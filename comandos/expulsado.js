const fs = require('fs')
const path = require('path')

module.exports = {
  comando: [],
  descripcion: 'Reacción cuando expulsan a alguien del grupo 💨',
  ejecutar: async (m, { sock }) => {
    const grupo = m.key.remoteJid
    const usuario = m.messageStubParameters?.[0]
    const nombre = usuario ? `@${usuario.split('@')[0]}` : 'alguien'

    const img = leer('expulsado.jpg')
    const audio = leer('expulsado.mp3')

    if (img) {
      await sock.sendMessage(grupo, {
        image: img,
        caption: `💨 ${nombre} fue sacado del corillo...\nAquí no se aguanta la nota mala 🎭`,
        mentions: [usuario]
      })
    }

    if (audio) {
      await sock.sendMessage(grupo, {
        audio,
        mimetype: 'audio/mp4',
        ptt: false
      })
    }
  }
}

function leer(nombreArchivo) {
  const p = path.join(__dirname, '..', 'media', nombreArchivo)
  return fs.existsSync(p) ? fs.readFileSync(p) : null
}
