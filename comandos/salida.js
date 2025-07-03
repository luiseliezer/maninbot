const fs = require('fs')
const path = require('path')

module.exports = {
  comando: [],
  descripcion: 'Despedida cuando alguien se va solo 👋🏽',
  ejecutar: async (m, { sock }) => {
    const grupo = m.key.remoteJid
    const usuario = m.messageStubParameters?.[0]
    const nombre = usuario ? `@${usuario.split('@')[0]}` : 'alguien'

    const img = leer('salida.jpg')
    const audio = leer('salida.mp3')

    if (img) {
      await sock.sendMessage(grupo, {
        image: img,
        caption: `👋🏽 ${nombre} se fue por su cuenta...\nPero el vacilón sigue. 🍃`,
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
