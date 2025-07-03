const fs = require('fs')
const path = require('path')

module.exports = {
  comando: [], // No es comando manual, lo llamamos desde eventos
  descripcion: 'Evento de bienvenida con imagen + audio',

  ejecutar: async (m, { sock }) => {
    const from = m.key.remoteJid
    const nombre = m.messageStubParameters?.[0]?.split('@')[0]

    const nombreFormateado = nombre ? `@${nombre}` : 'nuevo'

    // Imagen
    const imagenPath = path.join(__dirname, '..', 'media', 'bienvenida.jpg')
    const imagen = fs.existsSync(imagenPath) ? fs.readFileSync(imagenPath) : null

    // Audio
    const audioPath = path.join(__dirname, '..', 'media', 'bienvenida.mp3')
    const audio = fs.existsSync(audioPath) ? fs.readFileSync(audioPath) : null

    if (imagen) {
      await sock.sendMessage(from, {
        image: imagen,
        caption: `🌴 ¡Bienvenido ${nombreFormateado} al grupo!\nPonte cómodo que el swing está prendido. 🔥`,
        mentions: [m.messageStubParameters?.[0]]
      })
    }

    if (audio) {
      await sock.sendMessage(from, {
        audio,
        mimetype: 'audio/mp4',
        ptt: false
      })
    }
  }
}
