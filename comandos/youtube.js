// comandos/youtube.js
module.exports = {
  comando: ['youtube', 'yt'],
  descripcion: 'Busca videos en YouTube.',
  ejecutar: async (m, { sock, args, buscarVideoYouTube }) => {
    if (!args.length) {
      await sock.sendMessage(m.key.remoteJid, {
        text: '🎬 ¿Qué video quieres buscar en YouTube? Usa: .youtube [tu búsqueda]'
      }, { quoted: m })
      return
    }

    const query = args.join(' ')
    await sock.sendMessage(m.key.remoteJid, {
      text: '🔎 Buscando en YouTube... dame un segundito, mi loco.'
    }, { quoted: m })

    try {
      const videoEncontrado = await buscarVideoYouTube(query)
      if (videoEncontrado) {
        await sock.sendMessage(m.key.remoteJid, {
          text: `🎬 ¡Klk! Encontré este video pa' ti:\n\n*${videoEncontrado.title}*\n${videoEncontrado.url}`
        }, { quoted: m })
      } else {
        await sock.sendMessage(m.key.remoteJid, {
          text: '🤦‍♂️ No encontré ningún video con eso, mi loco. ¿Seguro que lo escribiste bien?'
        }, { quoted: m })
      }
    } catch (error) {
      console.error('❌ Error en comando YouTube:', error.message)
      await sock.sendMessage(m.key.remoteJid, {
        text: '😵‍💫 Se me frizó el sistema buscando en YouTube. ¡Intenta de nuevo!'
      }, { quoted: m })
    }
  }
}