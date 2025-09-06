const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

// إنشاء العميل مع المصادقة المحلية
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './auth_data'
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

// عند توليد QR Code
client.on('qr', (qr) => {
    console.log('📱 امسح الـ QR Code دا بواتساب:');
    qrcode.generate(qr, { small: true });
    console.log('\n🔗 أو انسخ الكود دا في تطبيق QR Scanner:');
    console.log(qr);
});

// عند نجاح الاتصال
client.on('ready', () => {
    console.log('✅ بوت واتساب جاهز ويشتغل!');
    console.log('🤖 البوت بيستنى الرسائل...');
});

// عند استلام رسالة
client.on('message', async (message) => {
    // تجاهل رسائل الجروبات (اختياري)
    if (message.from.includes('@g.us')) return;
    
    // تجاهل رسائل البوت نفسه
    if (message.fromMe) return;

    console.log(`📩 رسالة من ${message.from}: ${message.body}`);

    const messageBody = message.body.toLowerCase().trim();
    const senderName = (await message.getContact()).pushname || 'مستخدم';

    try {
        // الردود التلقائية
        switch (messageBody) {
            case 'السلام عليكم':
            case 'سلام عليكم':
            case 'السلام':
                await message.reply(`وعليكم السلام ورحمة الله وبركاته 🌹\nأهلاً وسهلاً ${senderName}`);
                break;

            case 'مرحبا':
            case 'هاي':
            case 'hello':
            case 'hi':
                await message.reply(`مرحباً ${senderName} 👋\nأهلاً بيك في البوت الخاص بي!\n\nاكتب "المساعدة" عشان تشوف الأوامر المتاحة 🤖`);
                break;

            case 'المساعدة':
            case 'help':
            case 'مساعدة':
                const helpMessage = `🤖 *قائمة الأوامر المتاحة:*\n\n` +
                    `📋 *الأوامر الأساسية:*\n` +
                    `• المساعدة - عرض هذه القائمة\n` +
                    `• الوقت - معرفة الوقت الحالي\n` +
                    `• التاريخ - معرفة التاريخ اليوم\n` +
                    `• معلوماتي - معرفة معلوماتك\n\n` +
                    `🎲 *للترفيه:*\n` +
                    `• نكتة - نكتة عشوائية\n` +
                    `• حكمة - حكمة لليوم\n` +
                    `• رقم عشوائي - رقم من 1 إلى 100\n\n` +
                    `💬 *أرسل أي رسالة وهرد عليك!*`;
                await message.reply(helpMessage);
                break;

            case 'الوقت':
            case 'كام الساعة':
                const now = new Date();
                const time = now.toLocaleString('ar-EG', {
                    timeZone: 'Africa/Cairo',
                    hour12: true,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
                await message.reply(`🕐 الوقت الحالي: ${time}`);
                break;

            case 'التاريخ':
            case 'إيه التاريخ':
                const today = new Date();
                const date = today.toLocaleDateString('ar-EG', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
                await message.reply(`📅 تاريخ اليوم: ${date}`);
                break;

            case 'معلوماتي':
            case 'بياناتي':
                const contact = await message.getContact();
                const info = `👤 *معلوماتك:*\n\n` +
                    `📱 الرقم: ${contact.number}\n` +
                    `👤 الاسم: ${contact.pushname || 'غير محدد'}\n` +
                    `🆔 المعرف: ${contact.id.user}\n` +
                    `⏰ وقت الرسالة: ${new Date(message.timestamp * 1000).toLocaleString('ar-EG')}`;
                await message.reply(info);
                break;

            case 'نكتة':
            case 'نكت':
                const jokes = [
                    'ليه الطماطم حمرا؟ عشان شافت السلطة بتتقطع! 🍅😂',
                    'إيه اللي يخلي الفراخ تطير؟ الريش! 🐔✈️',
                    'ليه القطط بتحب اللبن؟ عشان بتقول مياو لذيذ! 🐱🥛',
                    'إيه الفرق بين النمر والأسد؟ النمر فيه خطوط! 🐅🦁',
                    'ليه البطيخ أخضر من بره؟ عشان أحمر من جوه! 🍉😄'
                ];
                const randomJoke = jokes[Math.floor(Math.random() * jokes.length)];
                await message.reply(`😂 ${randomJoke}`);
                break;

            case 'حكمة':
            case 'حكم':
                const wisdoms = [
                    '💎 "العلم نور والجهل ظلام"',
                    '🌟 "من جد وجد، ومن زرع حصد"',
                    '⭐ "الصبر مفتاح الفرج"',
                    '🎯 "العقل السليم في الجسم السليم"',
                    '🌸 "ما تأخر عنك لم يكن ليصيبك"'
                ];
                const randomWisdom = wisdoms[Math.floor(Math.random() * wisdoms.length)];
                await message.reply(randomWisdom);
                break;

            case 'رقم عشوائي':
            case 'رقم':
                const randomNumber = Math.floor(Math.random() * 100) + 1;
                await message.reply(`🎲 الرقم العشوائي هو: *${randomNumber}*`);
                break;

            default:
                // رد ذكي على الرسائل العادية
                if (messageBody.includes('شكرا') || messageBody.includes('شكراً')) {
                    await message.reply('العفو يا غالي 😊🌹');
                } else if (messageBody.includes('كيف حالك') || messageBody.includes('إزيك')) {
                    await message.reply('الحمد لله بخير، إيه أخبارك انت؟ 😊');
                } else if (messageBody.includes('اسمك إيه') || messageBody.includes('اسمك')) {
                    await message.reply('أنا البوت المساعد 🤖\nاكتب "المساعدة" عشان تشوف إيه اللي أقدر أساعدك فيه');
                } else if (messageBody.includes('bye') || messageBody.includes('باي')) {
                    await message.reply('مع السلامة 👋\nفي أمان الله');
                } else {
                    // رد عام للرسائل غير المفهومة
                    const generalReplies = [
                        `شكراً لرسالتك ${senderName} 😊\nاكتب "المساعدة" للأوامر المتاحة`,
                        `أهلاً ${senderName} 👋\nعايز مساعدة في إيه؟ اكتب "المساعدة"`,
                        `${senderName} أنا هنا لمساعدتك 🤖\nاكتب "المساعدة" لمعرفة الأوامر`
                    ];
                    const randomReply = generalReplies[Math.floor(Math.random() * generalReplies.length)];
                    await message.reply(randomReply);
                }
                break;
        }

    } catch (error) {
        console.error('❌ خطأ في إرسال الرسالة:', error);
        await message.reply('عذراً، حدث خطأ 😅\nجرب مرة تانية');
    }
});

// عند قطع الاتصال
client.on('disconnected', (reason) => {
    console.log('❌ تم قطع الاتصال:', reason);
    console.log('🔄 جاري إعادة الاتصال...');
});

// عند حدوث خطأ
client.on('auth_failure', () => {
    console.error('❌ فشل في المصادقة. امسح مجلد auth_data وأعد التشغيل');
});

// بدء البوت
console.log('🚀 بدء تشغيل بوت واتساب...');
client.initialize().catch(err => {
    console.error('❌ خطأ في بدء التشغيل:', err);
});

// معالجة إغلاق التطبيق بشكل صحيح
process.on('SIGINT', async () => {
    console.log('🛑 جاري إيقاف البوت...');
    await client.destroy();
    process.exit(0);
});

// إبقاء التطبيق يعمل + إعداد HTTP server بسيط لـ Railway
const http = require('http');
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('🤖 بوت واتساب يعمل بنجاح!\nWhatsApp Bot is running successfully!');
});

server.listen(PORT, () => {
    console.log(`🌐 Server is running on port ${PORT}`);
});

setInterval(() => {
    console.log('💚 البوت يعمل...', new Date().toLocaleString('ar-EG'));
}, 300000); // كل 5 دقائق