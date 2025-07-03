// Importar dotenv y cargar las variables de entorno al inicio de todo
require('dotenv').config();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  downloadMediaMessage // Importar explícitamente para mayor claridad
} = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const { Boom } = require('@hapi/boom');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- CONFIGURACIÓN ---
// Ahora se leen las variables desde el archivo .env para mayor seguridad
const config = {
  nombreBot: 'ManinBot AI',
  prefijo: '.',
  geminiApiKey: process.env.GEMINI_API_KEY,
  ownerNumber: process.env.OWNER_NUMBER,
  aiConfig: {
    modelo: 'gemini-1.5-flash', // <-- ¡ACTUALIZADO A LA VERSIÓN MÁS PRO!
    temperatura: 0.7,
    maxTokens: 1500, // Aumentado un poco para el modelo más potente
    personalidad: `Eres ManinBot, un asistente AI dominicano muy carismático y divertido.
Características:
- Hablas como un dominicano típico, usando expresiones locales (klk, tiguere, chercha, vacano, etc.).
- Eres muy gracioso, servicial y a veces un poco sarcástico pero siempre amigable.
- Ayudas con todo lo que te piden, desde una simple pregunta hasta analizar una imagen.
- Usas emojis frecuentemente para darle vida a tus mensajes.
- Tu saludo principal es "Klk mi gente" o "Dime a ver".
- Siempre mantén un tono positivo y cercano.`
  }
};

const logger = pino({ level: 'info' });

// --- INICIALIZACIÓN DE GEMINI AI ---
let genAI, model;
try {
  if (!config.geminiApiKey) {
    throw new Error('API Key de Gemini no encontrada. Asegúrate de crear un archivo .env y añadir la variable GEMINI_API_KEY.');
  }
  genAI = new GoogleGenerativeAI(config.geminiApiKey);
  model = genAI.getGenerativeModel({ model: config.aiConfig.modelo });
  console.log('🤖 Google Gemini AI inicializado correctamente con el modelo:', config.aiConfig.modelo);
} catch (error) {
  console.error('❌ Error inicializando Gemini:', error.message);
  console.log('   📚 Para habilitar IA, asegúrate de que tu API key sea válida y haya conexión.');
  console.log('   📚 Obtén tu API key en: https://makersuite.google.com/app/apikey');
  model = null;
}

// --- FUNCIONES AUXILIARES ---

/**
 * Convierte un stream de datos a un Buffer.
 * @param {ReadableStream} stream El stream a convertir.
 * @returns {Promise<Buffer>} El buffer resultante.
 */
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

// --- FUNCIONES DE IA ---

async function consultarGemini(prompt, contexto = '') {
  if (!model) {
    return '⚠️ IA no disponible. Revisa la configuración de la API key de Gemini.';
  }
  try {
    const fullPrompt = `${config.aiConfig.personalidad}\n\nContexto: ${contexto}\n\nUsuario: ${prompt}\n\nManinBot:`;
    console.log('🤖 Consultando a Gemini AI...');
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();
    console.log('✅ Respuesta de Gemini recibida.');
    return text.trim();
  } catch (error) {
    console.error('❌ Error consultando Gemini:', error.message);
    if (error.message.includes('API key not valid')) {
      return '😵‍💫 ¡Diantre! Mi API Key no está funcionando. ¿Puedes revisar que esté bien configurada en el archivo .env?';
    }
    return '😵‍💫 Tuve un problemita con mi cerebrito artificial. Intenta de nuevo más tarde.';
  }
}

async function analizarImagen(imagenBuffer, prompt = '') {
  if (!model) {
    return '⚠️ IA no disponible para analizar imágenes.';
  }
  try {
    const imagePart = {
      inlineData: {
        data: imagenBuffer.toString('base64'),
        mimeType: 'image/jpeg'
      }
    };
    const defaultPrompt = prompt || `${config.aiConfig.personalidad}\n\nDescribe esta imagen de manera divertida y detallada como ManinBot:`;
    console.log('👁️ Analizando imagen con Gemini Vision...');
    const result = await model.generateContent([defaultPrompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    console.log('✅ Análisis de imagen completado.');
    return text.trim();
  } catch (error) {
    console.error('❌ Error analizando imagen:', error.message);
    if (error.message.includes('API key not valid')) {
      return '😵‍💫 Mi API Key no está funcionando para ver imágenes. Revisa la configuración, mi pana.';
    }
    return '😵‍💫 No pude ver bien esa imagen, loco. Intenta con otra.';
  }
}

// --- FUNCIONES DE WHATSAPP ---

function obtenerRutaMedia(nombreArchivo, extensiones = ['png', 'jpg', 'jpeg', 'mp4', 'mp3', 'wav', 'ogg', 'm4a']) {
  const rutaMedia = path.join(__dirname, 'media');
  for (const ext of extensiones) {
    const rutaCompleta = path.join(rutaMedia, `${nombreArchivo}.${ext}`);
    if (fs.existsSync(rutaCompleta)) return rutaCompleta;
  }
  return null;
}

async function enviarImagen(sock, jid, nombreArchivo, caption = '', quoted = null) {
  const rutaImagen = obtenerRutaMedia(nombreArchivo, ['png', 'jpg', 'jpeg']);
  if (!rutaImagen) {
    console.log(`⚠️ No se encontró la imagen: ${nombreArchivo}`);
    return false;
  }
  try {
    console.log(`📸 Enviando imagen: ${rutaImagen}`);
    await sock.sendMessage(jid, {
      image: fs.readFileSync(rutaImagen),
      caption: caption
    }, { ...(quoted && { quoted }) });
    return true;
  } catch (error) {
    console.error(`❌ Error enviando imagen ${nombreArchivo}:`, error.message);
    return false;
  }
}

async function enviarAudio(sock, jid, nombreArchivo, ptt = false, quoted = null) {
  const rutaAudio = obtenerRutaMedia(nombreArchivo, ['mp3', 'ogg', 'm4a']);
  if (!rutaAudio) {
    console.log(`⚠️ No se encontró el audio: ${nombreArchivo}`);
    return false;
  }
  try {
    console.log(`🎵 Enviando audio: ${rutaAudio}`);
    await sock.sendMessage(jid, {
      audio: fs.readFileSync(rutaAudio),
      mimetype: 'audio/mp4',
      ptt: ptt
    }, { ...(quoted && { quoted }) });
    return true;
  } catch (error) {
    console.error(`❌ Error enviando audio ${nombreArchivo}:`, error.message);
    return false;
  }
}

async function enviarVideoVistaUnica(sock, jid, nombreArchivo, caption = '', quoted = null) {
    const rutaVideo = obtenerRutaMedia(nombreArchivo, ['mp4']);
    if (!rutaVideo) {
      console.log(`⚠️ No se encontró el video: ${nombreArchivo}`);
      return false;
    }
    try {
        console.log(`📹 Enviando video (vista única): ${rutaVideo}`);
        await sock.sendMessage(jid, {
            video: fs.readFileSync(rutaVideo),
            caption: caption,
            viewOnce: true
        }, { ...(quoted && { quoted }) });
        return true;
    } catch (error) {
        console.error(`❌ Error enviando video ${nombreArchivo}:`, error.message);
        return false;
    }
}


// --- CARGADOR DE COMANDOS ---
function cargarComandos() {
  const comandos = {};
  const rutaComandos = path.join(__dirname, 'comandos');
  if (!fs.existsSync(rutaComandos)) fs.mkdirSync(rutaComandos, { recursive: true });

  const archivos = fs.readdirSync(rutaComandos).filter(file => file.endsWith('.js'));
  archivos.forEach(archivo => {
    try {
      const rutaCompleta = path.join(rutaComandos, archivo);
      delete require.cache[require.resolve(rutaCompleta)];
      const cmd = require(rutaCompleta);
      if (cmd && cmd.comando && typeof cmd.ejecutar === 'function') {
        const nombresComando = Array.isArray(cmd.comando) ? cmd.comando : [cmd.comando];
        nombresComando.forEach(nombre => {
          comandos[nombre.toLowerCase()] = cmd;
        });
      }
    } catch (error) {
      console.error(`❌ Error cargando el comando ${archivo}:`, error.message);
    }
  });
  console.log(`📦 Total de comandos cargados: ${Object.keys(comandos).length}`);
  return comandos;
}

// --- FUNCIÓN PRINCIPAL DEL BOT ---
async function iniciarBot() {
  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: true,
    browser: ['ManinBot AI', 'Desktop', '2.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {
    if (qr) {
      console.log('\n📲 Escanea este QR con tu WhatsApp:\n');
      qrcode.generate(qr, { small: true });
    }
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error instanceof Boom) && lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('❌ Conexión cerrada. Causa:', lastDisconnect?.error, ', reconectando:', shouldReconnect);
      if (shouldReconnect) {
        setTimeout(iniciarBot, 3000);
      } else {
        console.log('📴 Sesión cerrada permanentemente. Elimina la carpeta "session" y escanea el QR de nuevo.');
      }
    }
    if (connection === 'open') {
      console.log(`✅ ${config.nombreBot} encendido y picante 🔥🤖`);
      sock.comandos = cargarComandos();
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const jid = m.key.remoteJid;
    const sender = m.key.participant || jid;
    const isGroup = jid.endsWith('@g.us');
    const senderNumber = sender.split('@')[0];
    const isOwner = senderNumber === config.ownerNumber;
    let isGroupAdmin = false;

    if (isGroup) {
      try {
        const groupMetadata = await sock.groupMetadata(jid);
        const participant = groupMetadata.participants.find(p => p.id === sender);
        isGroupAdmin = !!participant?.admin;
      } catch (error) {
        console.error("Error obteniendo metadata del grupo:", error);
      }
    }

    const isAuthorized = isOwner || (isGroup ? isGroupAdmin : true);
    if (!isAuthorized) {
        return;
    }

    const texto = m.message?.conversation || m.message?.extendedTextMessage?.text || m.message?.imageMessage?.caption || m.message?.videoMessage?.caption || '';

    if (m.message?.imageMessage && model) {
      try {
        console.log('📸 Imagen detectada, analizando...');
        const stream = await downloadMediaMessage(m, 'buffer', {}, { logger });
        const buffer = await streamToBuffer(stream);
        const respuestaIA = await analizarImagen(buffer, texto || '');
        await sock.sendMessage(jid, { text: `🤖 *Análisis de imagen:*\n\n${respuestaIA}` }, { quoted: m });
      } catch (error) {
        console.error('❌ Error procesando la imagen:', error);
        await sock.sendMessage(jid, { text: '😵‍💫 Tuve un lío procesando esa imagen. Intenta de nuevo.' }, { quoted: m });
      }
      return;
    }

    if (texto.startsWith(config.prefijo)) {
      const [cmdName, ...args] = texto.slice(config.prefijo.length).trim().split(/ +/);
      const comandoNombre = cmdName.toLowerCase();
      const comando = sock.comandos?.[comandoNombre];

      if (comando) {
        try {
          console.log(`🔧 Ejecutando comando: ${comandoNombre} por ${senderNumber}`);
          await comando.ejecutar(m, { sock, texto, args, config, consultarGemini, analizarImagen, enviarImagen, enviarAudio, enviarVideoVistaUnica });
        } catch (err) {
          console.error(`💥 Error en comando ${comandoNombre}:`, err);
          await sock.sendMessage(jid, { text: `😵‍💫 ¡Diantre! Fallé ejecutando eso.\n\n*Error:* ${err.message}` }, { quoted: m });
        }
      } else if (model) {
        try {
            console.log(`🤖 Comando '${cmdName}' no existe, usando IA...`);
            const preguntaAI = texto.slice(config.prefijo.length).trim();
            const respuestaIA = await consultarGemini(preguntaAI);
            await sock.sendMessage(jid, { text: respuestaIA }, { quoted: m });
        } catch (error) {
            console.error('❌ Error usando IA para comando desconocido:', error);
        }
      }
      return;
    }

    const esPrivado = !isGroup;
    const mencionBot = texto.toLowerCase().includes('maninbot') || texto.toLowerCase().includes('bot');
    if (model && (esPrivado || mencionBot) && texto.length > 3) {
        const saludosSimples = ['hola', 'klk', 'saludos', 'hey', 'buenos dias', 'buenas tardes', 'buenas noches'];
        if (saludosSimples.some(s => texto.toLowerCase().trim() === s)) return;
        try {
            console.log('🤖 Generando respuesta automática con IA...');
            const respuestaIA = await consultarGemini(texto, esPrivado ? 'Conversación privada' : 'Grupo de WhatsApp');
            await sock.sendMessage(jid, { text: respuestaIA }, { quoted: m });
        } catch (error) {
            console.error('❌ Error en respuesta automática con IA:', error);
        }
    }
  });

  sock.ev.on('group-participants.update', async (update) => {
    try {
        const { id: grupo, action, participants } = update;
        const groupMetadata = await sock.groupMetadata(grupo).catch(() => null);
        if (!groupMetadata) return;

        const botIsAdmin = !!groupMetadata.participants.find(p => p.id === sock.user.id)?.admin;
        if (!botIsAdmin) return;

        for (const user of participants) {
            const nombre = user.split('@')[0];
            let mensaje;
            let imagen;
            let audio;

            if (action === 'add') {
                console.log(`👋 Usuario ${nombre} se unió a ${groupMetadata.subject}`);
                imagen = 'bienvenida';
                audio = 'bienvenida';
                mensaje = model
                    ? await consultarGemini(`Crea un mensaje de bienvenida muy dominicano y gracioso para @${nombre} que se unió al grupo "${groupMetadata.subject}".`)
                    : `¡Klk @${nombre}! Bienvenido/a a la chercha. 🔥`;
            } else if (action === 'remove') {
                console.log(`👋 Usuario ${nombre} salió de ${groupMetadata.subject}`);
                imagen = 'salida';
                mensaje = model
                    ? await consultarGemini(`Crea un mensaje de despedida muy dominicano y gracioso para @${nombre} que se fue o fue eliminado del grupo "${groupMetadata.subject}".`)
                    : `Se nos fue @${nombre}. ¡Lo veremos en el colmado! 😢`;
            }

            if (mensaje) {
                const imgEnviada = await enviarImagen(sock, grupo, imagen, mensaje, { key: { remoteJid: grupo, id: '' } });
                if (!imgEnviada) {
                    await sock.sendMessage(grupo, { text: mensaje, mentions: [user] });
                }
                if(audio) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Pequeña pausa
                    await enviarAudio(sock, grupo, audio, true);
                }
            }
        }
    } catch (err) {
        console.error('❌ Error en actualización de participantes:', err);
    }
  });
}

// --- VERIFICACIONES INICIALES ---
console.log('🚀 Iniciando ManinBot AI...');

const carpetasNecesarias = ['./session', './comandos', './media'];
carpetasNecesarias.forEach(carpeta => {
  if (!fs.existsSync(carpeta)) {
    fs.mkdirSync(carpeta, { recursive: true });
    console.log(`📁 Carpeta creada: ${carpeta}`);
  }
});

console.log('🤖 Verificando configuración de IA...');
if (!config.geminiApiKey) {
  console.log('   ❌ API Key de Gemini NO configurada. El bot funcionará sin IA.');
  console.log('   👉 Crea un archivo .env y añade tu GEMINI_API_KEY.');
} else {
  console.log('   ✅ API Key de Gemini encontrada.');
}
if (!config.ownerNumber) {
    console.log('   ❌ Número de dueño NO configurado.');
    console.log('   👉 Añade tu OWNER_NUMBER al archivo .env para tener control total.');
} else {
    console.log('   ✅ Número de dueño configurado.');
}


iniciarBot().catch(err => console.error("❌ Error fatal al iniciar el bot:", err));

// Manejo de cierre del proceso
process.on('SIGINT', () => { console.log('\n👋 Cerrando ManinBot AI...'); process.exit(0); });
process.on('SIGTERM', () => { console.log('\n👋 Cerrando ManinBot AI...'); process.exit(0); });