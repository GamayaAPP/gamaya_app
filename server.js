const express = require('express');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// كاشف عام لمتابعة أي طلب يدخل للسيرفر والتأكد من وصوله
app.use((req, res, next) => {
    console.log(`📥 استقبلنا طلب جديد: ${req.method} على الرابط ${req.url}`);
    next();
});

process.on('unhandledRejection', (reason) => {
    console.error('⚠️ تحذير:', reason);
});

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

let isWhatsAppReady = false;

client.on('qr', (qr) => {
    console.log('==================================================');
    console.log('🔗 انسخ هذا الرابط وافتحه في متصفح الكروم لرؤية الـ QR كصورة كاملة:');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`);
    console.log('==================================================');
});

client.on('ready', () => {
    isWhatsAppReady = true;
    console.log('✅ تم اتصال السيرفر بالواتساب بنجاح وأصبح جاهزاً لإرسال الرسائل!');
});

client.on('auth_failure', msg => {
    console.error('❌ فشل مصادقة الواتساب:', msg);
});

client.initialize();

const otpStore = {};
const gamayasStore = {};

// 1. API ارسال كود التحقق بالطريقة الأصلية والمباشرة
app.post('/api/send-otp', async (req, res) => {
    const { phone } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    const egyptianPhoneRegex = /^01[0125]\d{8}$/;

    if (!egyptianPhoneRegex.test(cleanPhone)) {
        return res.status(400).json({
            success: false,
            message: 'رقم غير صحيح، يجب أن يكون رقم مصري مكوناً من 11 رقماً'
        });
    }

    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    otpStore[cleanPhone] = {
        code: otpCode,
        expiresAt: Date.now() + 5 * 60 * 1000
    };

    const messageText = `رمز التحقق الخاص بك لتطبيق جمعية هو: ${otpCode}`;
    
    // الصيغة القياسية المباشرة للأرقام المصرية على واتساب
    const formattedChatId = `20${cleanPhone.substring(1)}@c.us`;

    try {
        console.log(`محاولة إرسال واتساب للرقم: ${formattedChatId}`);
        await client.sendMessage(formattedChatId, messageText);
        console.log(`تم إرسال الرسالة بنجاح للرقم: ${cleanPhone}`);
        
        return res.json({
            success: true,
            message: 'تم إرسال كود التحقق أوتوماتيكياً عبر واتساب'
        });
    } catch (err) {
        console.error('خطأ في إرسال الواتساب:', err);
        return res.status(500).json({
            success: false,
            message: 'فشل إرسال رسالة الواتساب، تأكد من اتصال البوت'
        });
    }
});

// 2. API التحقق من الكود
app.post('/api/verify-otp', (req, res) => {
    const { phone, code } = req.body;
    const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
    const record = otpStore[cleanPhone];

    if (!record || Date.now() > record.expiresAt) {
        return res.status(400).json({ success: false, message: 'كود التأكيد غير صحيح أو انتهت صلاحيته' });
    }

    if (record.code === code) {
        delete otpStore[cleanPhone];
        return res.json({ success: true, message: 'تم التحقق بنجاح' });
    }

    return res.status(400).json({ success: false, message: 'كود التأكيد غير صحيح' });
});

// 3. API إنشاء جمعية جديدة
app.post('/api/create-gamaya', (req, res) => {
    const { name, amount, totalMonths, creatorPhone } = req.body;
    const inviteCode = 'GM-' + Math.floor(100000 + Math.random() * 900000);

    gamayasStore[inviteCode] = {
        id: inviteCode,
        name,
        amount,
        totalMonths,
        creatorPhone,
        members: [creatorPhone]
    };

    res.json({
        success: true,
        message: 'تم إنشاء الجمعية بنجاح',
        inviteCode,
        gamayaDetails: gamayasStore[inviteCode]
    });
});

// 4. API الانضمام لجمعية بكود الدعوة
app.post('/api/join-gamaya', (req, res) => {
    const { invitecode, userPhone } = req.body;
    const gamaya = gamayasStore[invitecode];

    if (!gamaya) {
        return res.status(400).json({ success: false, message: 'كود غير صحيح أو الجمعية غير موجودة' });
    }

    if (gamaya.members.includes(userPhone)) {
        return res.status(400).json({ success: false, message: 'أنت منضم بالفعل لهذه الجمعية' });
    }

    gamaya.members.push(userPhone);

    res.json({
        success: true,
        message: 'تم الانضمام للجمعية بنجاح',
        gamayaDetails: gamaya
    });
});

// 5. API جلب جمعيات المستخدم
app.get('/api/my-gamayas/:phone', (req, res) => {
    const userPhone = req.params.phone;
    const userGamayas = Object.values(gamayasStore).filter(g => g.members.includes(userPhone));

    res.json({
        success: true,
        gamayas: userGamayas
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 السيرفر شغال تمام على البورت ${PORT}`);
});