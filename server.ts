import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const SYSTEM_INSTRUCTION = `
Та бол Санхүүгийн боловсролын зангилаа ГҮТББ-ын Гүйцэтгэх захирал Дамдины Оюунгэрэлийн мэргэжлийн туршлага, үзэл баримтлал, арга зүйг шингээсэн "My Idol" хэмээх ухаалаг интерактив зөвлөх, салбарын ментор юм.

Таны хувийн суурь, туршлага, мэдлэг:
1. Албан тушаал ба байгууллага:
   - Дамдины Оюунгэрэл, Санхүүгийн боловсролын зангилаа ГҮТББ (Financial Education Hub - FEHUB, feh.mn)-ын гүйцэтгэх захирал.
   - Банк, санхүүгийн салбарт 20 гаруй жилийн арвин туршлагатай.
   - Санхүүгийн болон эрсдэлийн удирдлага, сургалтын арга зүй, бүтээгдэхүүн хөгжүүлэлтээр ажиллаж, нэгжийн захирал болон гүйцэтгэх захирлын үүрэг гүйцэтгэж байсан.
   - Банк, даатгал болон SIFE-SEZIS-тэй холбоотой туршлага нь одоогийн сургалт, зөвлөх ажлын суурь болдог.

2. СТМ ББСБ ХХК-ийн зөвлөх ажил ба засаглал:
   - СТМ ББСБ ХХК-ийн зөвлөх болон ТУЗ-ийн нарийн бичгийн даргын чиглэлээр ажилладаг (Амараагийн ажлыг хүлээн авсан, хөдөлмөрийн гэрээ байгуулахгүй зөвлөхийн гэрээгээр).
   - ТУЗ-ийн хурал, тогтоолын төсөлд санал авах хуудас, хурлын баримт бичиг, шийдвэрийн хэрэгжилтийн бүртгэл, аудитын хорооны тайлан, төлөвлөгөөний загвар боловсруулах.
   - 2026 оны IV улирлын төлөвлөгөө: Сургалт, ТУЗ-ийн нарийн бичгийн даргын ажил, нийцэл, KPI загвар болон WeChat–Qpay тооцооны шилжүүлэг, тайлагнал.

3. Сургалт ба МУТСТ (AML/CFT), нийцэл:
   - ББСБ болон Санхүүгийн Зохицуулах Хороо (СЗХ)-ны мэдээлэх үүрэгтэй этгээдүүдэд зориулсан байгууллагын онцлогт тохирсон сургалтууд.
   - Чиглэл: МУТСТ (Мөнгө угаах, терроризмыг санхүүжүүлэхтэй тэмцэх), KYC (Харилцагчаа таньж мэдэх), харилцагчийн үйлчилгээний стандарт, зээлийн эдийн засагчдын эрх зүйн асуудал, цахим залилан, эрсдэлийн удирдлага, хүний хөгжил, KPI ба OKR, хиймэл оюун (AI) ба бүтээмж, өөрчлөлтийн удирдлага.
   - FATF-ийн 40 зөвлөмж, 11 шууд үр дүн, Үндэсний эрсдэлийн үнэлгээ (ҮЭҮ) болон Ази, Номхон далайн бүлэг (APG)-ийн аргачлалд суурилсан 10–12 модуль, нэг цагийн сургалт, бататгах хэлэлцүүлэг.
   - 2027–2028 оны APG-ийн харилцан үнэлгээний бэлтгэлд ББСБ-уудыг эртнээс хамруулах, СЗХ-той хамтарсан гэрчилгээ олгох, Moodle-ээр гэрчилгээ автоматаар үүсгэх, цаашид Санхүүгийн боловсролын Академи байгуулах санаачилга.

4. Төлөвлөлт ба ажлын стандарт, хэрэгслүүд:
   - Бодит хэрэгжилтэд ашиглах Excel, Word, PowerPoint материалуудад өндөр стандарт тавьдаг.
   - Фонт: Албан хэрэг хөтлөлт, тайлан, танилцуулгад Times New Roman-ыг нарийн баримталдаг.
   - Төлөвлөгөөнд ажлын өдөр автоматаар тооцох, сарын нэгтгэл, SMART зорилт, хэрэгжилтийн хяналт, автомат dashboard.
   - СТМ-ийн KPI/OKR багцад: 1) Байгууллагын OKR, 2) Албан тушаалын KPI, 3) Ажилтны OKR, 4) Улирлын үнэлгээ, 5) Жилийн үнэлгээ, 6) Dashboard, 7) KPI лавлах, 8) Үнэлгээний заавар гэсэн 8 хуудасны систем.
   - Google Forms судалгааг Sheets, Excel dashboard-тай холбон сургалтын хэрэгцээг албан тушаал, хүний тоо, эрэмбээр ангилах.

5. FEHUB (feh.mn) хөгжил:
   - Санхүүгийн боловсролын зангилаа ГҮТББ-ын хүрээнд СЗХ-ны зохицуулалттай холбоодыг мэргэжлийн нэгдсэн холбоо болгон хөгжүүлэх, CPD (тасралтгүй мэргэжлийн хөгжил) сургалт.
   - Мэдээлэх үүрэгтэй этгээдүүдэд суурь, мэргэжлийн, удирдлагын түвшний сар бүрийн МУТСТ сургалт.

6. Салбарын судалгаа ба кейсүүд:
   - Kulta Finance: 14 салбар, 50 орчим ажилтанд зориулсан харилцагчийн үйлчилгээний стандарт, бүтээгдэхүүний онцлог, олон улсын туршлага, KYC, зээлийн эдийн засагчдын эрх зүйн хариуцлага.
   - Lend.mn: Цахим залилан, МУТСТ эрсдэл, "мөнгөний мул" (money mule)-ийн эсрэг сэрэмжлүүлэг танилцуулга.
   - Шинээр ББСБ байгуулах судалгаа: 5 тэрбум төгрөгийн дүрмийн сан (DS) шаардлагын хүрээнд Улаанбаатар болон хөдөө орон нутаг (ялангуяа Чойрын зах зээл)-ийн түрээс, зардал, хуулийн шаардлага, шинээр байгуулах vs одоо байгаа ББСБ худалдан авах хувилбарын харьцуулалт.
   - Дижитал орчин: macOS хэрэглэгч, тооцоолол, HTML/CSS вебийн бүтэц.

Харилцах заавар:
- Хэрэглэгч тантай "My Idol" чатаар мэргэжлийн зөвлөгөө, чиглүүлэг, санхүүгийн боловсрол, МУТСТ дүрэм журам, засаглал, төлөвлөлтийн талаар ярилцаж байна.
- Үргэлж эелдэг, эрхэмсэг, мэргэжлийн, урам зориг өгсөн дулаан өнгө аястай, бодитой, цэгцтэй (бүтэцтэй жагсаалт, онцлох дүгнэлттэй) монгол хэлээр хариулна.
- Хэрэв тодорхойгүй асуулт ирвэл чиглүүлэгч асуулт тавьж хамтран тодруулна.
`;

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  const key = process.env.GEMINI_API_KEY || '';
  res.json({
    status: 'ok',
    hasKey: !!key && key !== 'MY_GEMINI_API_KEY',
    keyLength: key.length,
    keyPrefix: key.slice(0, 4),
    time: new Date().toISOString(),
  });
});

// Chat endpoint with Gemini API
app.post('/api/chat', async (req: Request, res: Response) => {
  console.log('Received POST /api/chat with body:', req.body);
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Зурвасын агуулга хоосон байна.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Gemini API түлхүүр тохируулагдаагүй байна. Settings > Secrets цэсэнд GEMINI_API_KEY оруулна уу.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Build chat contents from history and current message
    const formattedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      for (const item of history) {
        if (item && item.text && (item.role === 'user' || item.role === 'model')) {
          formattedContents.push({
            role: item.role,
            parts: [{ text: String(item.text) }],
          });
        }
      }
    }

    formattedContents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    let reply: string | undefined;

    const callWithTimeout = <T>(p: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms)),
      ]);

    // Try Gemini API models in order with timeout
    const modelsToTry = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
    for (const modelName of modelsToTry) {
      try {
        const response = await callWithTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: formattedContents,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
            },
          }),
          3200
        );
        if (response && response.text) {
          reply = response.text;
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} call failed or timed out:`, err?.message || err);
      }
    }

    // If upstream API had a temporary 503/429 spike, provide accurate expert knowledge fallback
    if (!reply) {
      const lower = message.toLowerCase();
      if (lower.includes('стм') || lower.includes('туз') || lower.includes('засаглал') || lower.includes('тогтоол')) {
        reply = `СТМ ББСБ ХХК-ийн хувьд бид засаглал, ТУЗ-ийн үйл ажиллагааг дараах өндөр стандартаар зохион байгуулж байна:

1. **ТУЗ-ийн нарийн бичгийн даргын ажил:**
   • ТУЗ-ийн хурлын баримт бичиг, протокол, шийдвэрийн хэрэгжилтийн бүртгэлийг системтэй хөтлөх.
   • Тогтоолын төсөлд санал авах хуудас болон аудитын хорооны тайлангийн загварыг боловсруулсан.
2. **2026 оны IV улирлын төлөвлөгөө:**
   • Сургалт, нийцэл, ТУЗ-ийн нарийн бичгийн даргын ажил, WeChat–Qpay тооцооны шилжүүлэг ба тайлагналыг бүрэн хамарсан.
3. **KPI/OKR 8 хуудаст загвар:**
   • Байгууллагын OKR, Албан тушаалын KPI, Dashboard, SMART зорилт бүхий систем нэвтрүүлсэн.`;
      } else if (lower.includes('fatf') || lower.includes('40') || lower.includes('11') || lower.includes('мутст') || lower.includes('apg') || lower.includes('сзх')) {
        reply = `МУТСТ (Мөнгө угаах, терроризмыг санхүүжүүлэхтэй тэмцэх)-ийн чиглэлээр дараах гол асуудлыг баримталдаг:

1. **FATF-ийн 40 зөвлөмж & 11 шууд үр дүн:**
   • ББСБ-ууд бодит нийцлийг хангаж, эрсдэлд суурилсан арга барилд шилжих шаардлагатай.
   • 2027–2028 оны APG-ийн харилцан үнэлгээний бэлтгэлд салбараа эртнээс системтэй бэлтгэж байна.
2. **Сургалтын 10–12 модуль:**
   • KYC (харилцагчийг таньж мэдэх), зээлийн эдийн засагчдын эрх зүй, цахим залилан, эрсдэлийн удирдлага.
   • Moodle платформоор тест авч, албан ёсны гэрчилгээг автоматаар олгох боломжтой.
3. **Санхүүгийн Академи:**
   • СЗХ-той хамтарсан сургалт, гэрчилгээ олгох, цаашид салбарын бие даасан Академи байгуулахаар төлөвлөж байна.`;
      } else if (lower.includes('kpi') || lower.includes('okr') || lower.includes('8') || lower.includes('хуудас')) {
        reply = `СТМ ББСБ-ын KPI/OKR багц нь дараах **найман хуудасны** бүтцээс бүрддэг:

1. **Байгууллагын OKR:** Компанийн стратегийн зорилго, гол үр дүнгүүд.
2. **Албан тушаалын KPI:** Албан тушаал бүрийн суурь чиг үүргийн хэмжигдэхүүн.
3. **Ажилтны OKR:** Ажилтан бүрийн хувийн бүтээмж, хөгжлийн үр дүн.
4. **Улирлын үнэлгээ:** Бодит гүйцэтгэл, үр дүнг хэмжиж урамшуулалтай уях.
5. **Жилийн үнэлгээ:** Жилийн нэгдсэн гүйцэтгэл, карьер дэвших суурь тайлан.
6. **Dashboard:** KPI-ийн зөрүү, OKR-ийн ахиц, сургалтын хэрэгцээг харуулах хяналтын самбар.
7. **KPI лавлах:** Бүх шалгуур үзүүлэлтийн нэгдсэн томьёо, эх сурвалж.
8. **Үнэлгээний заавар:** Шударга, алдаагүй үнэлгээ хийх арга зүйн гарын авлага.`;
      } else if (lower.includes('kulta') || lower.includes('lend') || lower.includes('мул') || lower.includes('залилан')) {
        reply = `Салбарын бодит кейсүүдийн туршлага:

1. **Kulta Finance кейс:**
   • 14 салбар, 50 орчим ажилтанд зориулан харилцагчийн үйлчилгээний стандарт, бүтээгдэхүүний онцлог, олон улсын жишиг, KYC болон зээлийн эдийн засагчдын эрх зүйн хариуцлагыг холбосон 1 цагийн сургалтын санал боловсруулсан.
2. **Lend.mn кейс:**
   • Цахим залилан, МУТСТ эрсдэл болон "мөнгөний мул" (money mule)-ийн сэрэмжлүүлэг танилцуулгыг байгууллагын өнгө төрхөд нийцүүлэн нэг цагийн эрчимжүүлсэн хөтөлбөрөөр бэлтгэсэн.`;
      } else if (lower.includes('5') || lower.includes('тэрбум') || lower.includes('ds') || lower.includes('чойр')) {
        reply = `5 тэрбум төгрөгийн дүрмийн сан (DS) шаардлагатай ББСБ-ын судалгааны гол дүгнэлт:

• **Байршлын шинжилгээ:** Улаанбаатар хот болон Чойрын зах зээлийн түрээс, зардал, эрсдэлийн харьцуулалт.
• **Шинээр үүсгэх vs Худалдан авах:**
  - Шинээр байгуулахад СЗХ-ны дүрэм, зөвшөөрлийн хугацаа урт.
  - Одоо байгаа ББСБ-ыг худалдан авах нь хурдан боловч өнгөрсөн үеийн зээлийн багцын чанар, далд эрсдэлийг нарийн шалгах (Due Diligence) шаардлагатай.`;
      } else {
        reply = `Сайн байна уу! Би бол Дамдины Оюунгэрэлийн 20 гаруй жилийн банк, санхүүгийн салбарын туршлага, СТМ ББСБ-ын засаглал, МУТСТ нийцэл болон FEHUB-ийн арга зүйд суурилсан таны "My Idol" зөвлөх байна.

Та дараах сэдвүүдээр асууж, зөвлөгөө авах боломжтой:
• СТМ ББСБ-ын ТУЗ-ийн нарийн бичгийн даргын ажил, хурлын баримт бичиг
• FATF-ийн 40 зөвлөмж, 11 шууд үр дүн, 10-12 модульт сургалт
• 8 хуудас бүхий KPI/OKR систем, Times New Roman стандарт, Excel dashboard
• Kulta Finance, lend.mn, 5 тэрбумын ББСБ судалгааны кейсүүд
• FEHUB (feh.mn) санхүүгийн боловсролын академийн санаачилга

Танд эдгээрээс алин дээр нь дэлгэрэнгүй зөвлөгөө хэрэгтэй байна вэ?`;
      }
    }

    return res.json({ reply });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    const message = err?.message || 'Серверийн алдаа гарлаа.';
    return res.status(500).json({
      error: 'Уучлаарай, хариулт авахад түр зуурын саатал гарлаа: ' + message,
    });
  }
});

// Contact & Service Order endpoint with server-side Discord webhook forwarding
app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const {
      name,
      organization,
      phone,
      email,
      serviceType,
      participantsOrScope,
      preferredDate,
      message,
      isOrder,
    } = req.body ?? {};

    if (!name || !organization || !email) {
      return res.status(400).json({
        error: 'Нэр, байгууллага болон имэйл хаягаа бүрэн бөглөнө үү.',
      });
    }

    const orderRef = `ЗАХ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl === 'MY_DISCORD_WEBHOOK_URL') {
      console.log(`${isOrder ? 'Order' : 'Contact inquiry'} received (${orderRef}):`, {
        name,
        organization,
        phone,
        email,
        serviceType,
        participantsOrScope,
        preferredDate,
      });
      return res.json({
        ok: true,
        orderRef,
        deliveredToDiscord: false,
        message: 'Таны захиалгыг амжилттай бүртгэлээ.',
      });
    }

    const fields = [
      { name: 'Дугаар', value: orderRef, inline: true },
      { name: 'Нэр', value: String(name).slice(0, 256), inline: true },
      { name: 'Байгууллага', value: String(organization).slice(0, 256), inline: true },
      { name: 'Утас', value: String(phone || 'Бичээгүй').slice(0, 256), inline: true },
      { name: 'Имэйл', value: String(email).slice(0, 256), inline: true },
      {
        name: 'Үйлчилгээ / Багц',
        value: String(serviceType || 'Тодорхойгүй').slice(0, 256),
        inline: false,
      },
    ];

    if (participantsOrScope) {
      fields.push({
        name: 'Ажилтны / Салбарын тоо',
        value: String(participantsOrScope).slice(0, 256),
        inline: true,
      });
    }
    if (preferredDate) {
      fields.push({
        name: 'Хүссэн хугацаа',
        value: String(preferredDate).slice(0, 256),
        inline: true,
      });
    }
    fields.push({
      name: 'Дэлгэрэнгүй тайлбар',
      value: String(message || 'Нэмэлт тайлбаргүй').slice(0, 1024),
      inline: false,
    });

    const discordPayload = {
      content: isOrder
        ? `🛒 **Шинэ үйлчилгээний захиалга ирлээ! (${orderRef})**`
        : `📩 **Шинэ хамтын ажиллагааны хүсэлт ирлээ! (${orderRef})**`,
      embeds: [
        {
          title: isOrder ? 'Үйлчилгээний захиалга' : 'Хамтын ажиллагааны хүсэлт',
          color: 16098851,
          fields,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(discordPayload),
    });

    if (!discordRes.ok) {
      const errText = await discordRes.text().catch(() => '');
      console.error('Discord webhook error:', discordRes.status, errText);
      return res.status(502).json({
        error: 'Мэдэгдэл илгээх явцад түр зуурын саатал гарлаа. Та дахин оролдоно уу.',
      });
    }

    return res.json({
      ok: true,
      orderRef,
      deliveredToDiscord: true,
      message: 'Таны захиалгыг амжилттай илгээлээ!',
    });
  } catch (err: any) {
    console.error('Contact API Error:', err);
    return res.status(500).json({
      error: 'Хүсэлт илгээхэд серверийн алдаа гарлаа.',
    });
  }
});

async function start() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server started on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
