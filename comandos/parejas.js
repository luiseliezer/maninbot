module.exports = {
  comando: ['parejas'],
  descripcion: 'Forma parejas aleatorias 2x2 👥',

  ejecutar: async (m, { sock, texto }) => {
    const lista = texto
      .split('|')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    if (lista.length < 4) {
      return sock.sendMessage(m.key.remoteJid, {
        text: '⚠️ Necesitas al menos 4 nombres pa’ formar parejas.\nEjemplo:\n.parejas Ana | Pedro | Juan | Carla'
      }, { quoted: m })
    }

    // Mezclar los nombres
    const mezclado = lista.sort(() => Math.random() - 0.5)

    const parejas = []
    for (let i = 0; i < mezclado.length; i += 2) {
      if (mezclado[i + 1]) {
        parejas.push([mezclado[i], mezclado[i + 1]])
      } else {
        parejas.push([mezclado[i], '🕊️ Solo por ahora'])
      }
    }

    let textoFinal = '💞 *Parejas formadas al azar:*\n\n'
    parejas.forEach(([a, b], i) => {
      textoFinal += `• Pareja ${i + 1}: ${a} 🤝 ${b}\n`
    })

    await sock.sendMessage(m.key.remoteJid, {
      text: textoFinal
    }, { quoted: m })
  }
}
