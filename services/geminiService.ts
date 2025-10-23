import { GoogleGenAI, Type } from "@google/genai";
import type { SurveyData, ChartData, OptionClassification } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const formatDataForPrompt = (data: SurveyData): string => {
  const headers = data.headers.join(', ');
  const rows = data.rows.map(row => 
    data.headers.map(header => `"${row[header]}"`).join(', ')
  ).join('\n');
  
  const combinedData = `Headers: ${headers}\n\nData:\n${rows}`;
  if (combinedData.length > 50000) {
      return combinedData.substring(0, 50000) + "\n... (data truncated)";
  }
  return combinedData;
};

export const analyzeSurveyData = async (data: SurveyData): Promise<string> => {
  const model = 'gemini-2.5-flash';
  const formattedData = formatDataForPrompt(data);

  const prompt = `
  أنت خبير في تحليل البيانات ومتخصص في استطلاعات الرأي. لقد تم تزويدك ببيانات من استطلاع جوجل فورم. مهمتك هي تحليل هذه البيانات وتقديم تقرير شامل باللغة العربية.

  الرجاء اتباع الهيكل التالي في تقريرك:

  ## ملخص تنفيذي
  - قدم ملخصًا موجزًا لأهم النتائج التي توصلت إليها من البيانات. اذكر عدد المشاركين في الاستطلاع.

  ## الاتجاهات والمؤشرات الرئيسية
  - استخلص أهم الاتجاهات والأنماط الملحوظة في الإجابات.
  - استخدم نقاطًا (bullets) لعرض كل اتجاه بشكل واضح.
  - على سبيل المثال: "غالبية المشاركين يفضلون الخيار أ"، "هناك علاقة بين السؤال س والإجابة ص".

  ## رؤى وتوصيات
  - بناءً على التحليل، قدم رؤى عميقة وقابلة للتنفيذ. ماذا تعني هذه البيانات؟
  - قدم توصيات عملية يمكن اتخاذها بناءً على نتائج الاستطلاع.

  تجنب فقط إعادة ذكر البيانات. ركز على التفسير، والاستنتاج، وتقديم قيمة مضافة. اجعل التقرير احترافيًا وسهل القراءة.

  بيانات الاستطلاع هي كالتالي:
  ---
  ${formattedData}
  ---
  `;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error(`Error calling Gemini API:`, error);
    throw new Error("Failed to get analysis from Gemini API.");
  }
};

export const querySurveyData = async (data: SurveyData, query: string): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const formattedData = formatDataForPrompt(data);

    const prompt = `
    أنت مساعد تحليل بيانات. مهمتك هي الإجابة بدقة على سؤال المستخدم بناءً على بيانات الاستطلاع المقدمة فقط. لا تخترع أي معلومات غير موجودة في البيانات.

    **بيانات الاستطلاع:**
    ---
    ${formattedData}
    ---

    **سؤال المستخدم:**
    "${query}"

    **تعليمات:**
    1.  اقرأ السؤال بعناية.
    2.  حلل بيانات الاستطلاع للعثور على الإجابة.
    3.  قدم إجابة واضحة وموجزة ومباشرة على السؤال.
    4.  إذا كانت البيانات لا تحتوي على معلومات كافية للإجابة على السؤال، فاذكر ذلك بوضوح. قل شيئًا مثل "البيانات المقدمة لا تحتوي على المعلومات اللازمة للإجابة على هذا السؤال."
    5.  يجب أن تكون إجابتك باللغة العربية.
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error(`Error calling Gemini API for query:`, error);
        throw new Error("Failed to get query response from Gemini API.");
    }
};

export const compareSurveyData = async (dataA: SurveyData, fileNameA: string, dataB: SurveyData, fileNameB: string): Promise<string> => {
  const model = 'gemini-2.5-flash';
  const formattedDataA = formatDataForPrompt(dataA);
  const formattedDataB = formatDataForPrompt(dataB);

  const prompt = `
  أنت خبير في تحليل البيانات متخصص في مقارنة نتائج الاستطلاعات. لديك مجموعتان من بيانات الاستطلاع. مهمتك هي إجراء تحليل مقارن شامل وتقديم تقرير مفصل باللغة العربية.

  الاستطلاع الأول (أ): ${fileNameA}
  الاستطلاع الثاني (ب): ${fileNameB}

  يرجى تنظيم تقريرك المقارن على النحو التالي:

  ## ملخص المقارنة
  - قدم نظرة عامة موجزة على الفروقات والتشابهات الرئيسية بين الاستطلاعين.
  - اذكر عدد المشاركين في كل استطلاع وأي تغيير ملحوظ.

  ## تحليل التغييرات في الاتجاهات
  - لكل مؤشر أو سؤال مشترك، قارن النتائج بين الاستطلاع (أ) والاستطلاع (ب).
  - استخدم نقاطًا لتسليط الضوء على التحولات الهامة. مثال: "في الاستطلاع (أ) كانت نسبة الرضا 80%، بينما ارتفعت في الاستطلاع (ب) إلى 88%."
  - ركز على التغييرات الكبيرة والمؤثرة.

  ## أنماط جديدة أو ناشئة
  - هل هناك أي أنماط أو اتجاهات ظهرت في الاستطلاع (ب) لم تكن موجودة أو واضحة في الاستطلاع (أ)؟

  ## توصيات بناءً على المقارنة
  - بناءً على الفروقات الملحوظة، قدم توصيات محددة. على سبيل المثال، إذا انخفض الرضا في جانب معين، اقترح إجراءات لتحسينه.

  اجعل التحليل موضوعيًا ومبنيًا على البيانات المقدمة فقط.

  ---
  بيانات الاستطلاع (أ): ${fileNameA}
  ${formattedDataA}
  ---
  بيانات الاستطلاع (ب): ${fileNameB}
  ${formattedDataB}
  ---
  `;

  try {
    const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error(`Error calling Gemini API for comparison:`, error);
    throw new Error("Failed to get comparison from Gemini API.");
  }
};

export const summarizeChartData = async (title: string, data: ChartData[]): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const formattedData = data.map(d => `${d.name}: ${d.value}`).join('\n');

    const prompt = `
    أنت محلل بيانات موجز. مهمتك هي تحليل بيانات لسؤال واحد من استطلاع وتقديم ملخص من جملة واحدة أو جملتين باللغة العربية.

    **عنوان السؤال:** "${title}"

    **البيانات (الإجابة: العدد):**
    ---
    ${formattedData}
    ---

    **المطلوب:**
    اكتب استنتاجًا رئيسيًا واحدًا من هذه البيانات. كن مباشرًا وموجزًا.
    مثال: "الغالبية العظمى من المشاركين راضون عن الخدمة، حيث اختار أكثر من 70% 'راضٍ جدًا'."
    أو "تتوزع الآراء بالتساوي بين الخيارات المتاحة، مع تفضيل طفيف لخيار 'ب'."
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
        });
        return response.text;
    } catch (error) {
        console.error(`Error calling Gemini API for chart summary:`, error);
        throw new Error("Failed to get chart summary from Gemini API.");
    }
};

export const classifyChartOptions = async (title: string, options: string[]): Promise<Record<string, OptionClassification>> => {
    const model = 'gemini-2.5-flash';
    
    if (options.length === 0) {
        return {};
    }

    const prompt = `
    أنت مساعد في تحليل البيانات. مهمتك هي تصنيف خيارات إجابات الاستطلاع بناءً على الشعور (إيجابي، محايد، سلبي).
    بالنسبة للسؤال "${title}"، قم بتصنيف كل خيار من الخيارات التالية: [${options.join(', ')}].

    استخدم التصنيفات التالية فقط: 'Positive', 'Neutral', 'Negative'.
    الخيارات التي تدل على الموافقة، الرضا، الجودة العالية، أو التأكيد هي 'Positive'.
    الخيارات التي تدل على الرفض، عدم الرضا، الجودة المنخفضة، أو النفي هي 'Negative'.
    الخيارات الأخرى التي لا تندرج تحت الفئتين السابقتين هي 'Neutral' (مثل أسماء المدن، الأقسام، أو الخيارات غير الواضحة).

    قم بإرجاع إجابتك بتنسيق JSON بناءً على المخطط المحدد.
    `;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          option: {
            type: Type.STRING,
            description: 'نص خيار الإجابة الأصلي.',
          },
          classification: {
            type: Type.STRING,
            description: "التصنيف: 'Positive' أو 'Neutral' أو 'Negative'.",
          },
        },
        required: ['option', 'classification'],
      },
    };

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            },
        });

        const jsonResponse = JSON.parse(response.text);
        
        const classifications: Record<string, OptionClassification> = {};
        if (Array.isArray(jsonResponse)) {
            jsonResponse.forEach((item: { option: string; classification: OptionClassification }) => {
                if (item.option && ['Positive', 'Neutral', 'Negative'].includes(item.classification)) {
                    classifications[item.option] = item.classification;
                }
            });
        }
        return classifications;

    } catch (error) {
        console.error(`Error calling Gemini API for chart option classification:`, error);
        throw new Error("Failed to get chart option classification from Gemini API.");
    }
};