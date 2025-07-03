module.exports = {
  comando: ['frase'],
  descripcion: 'Frases dominicanas aleatorias pa’ tirar cotorra 🔥',

  ejecutar: async (m, { sock }) => {
    const frases = [
      '🌴 *El que no da cotorra, no prende la chercha.*',
      '🍻 *En este grupo se goza más que en la capital un viernes.*',
      '👀 *Se habla claro y sin miedo, así que prende tu micrófono.*',
      '🔥 *Si viniste con miedo, devuélvete pa’ tu casa.*',
      '🥵 *No bajes la guardia, que aquí se mide con actitud.*',
      '😎 *Aquí no se frontea… se demuestra.*',
      '📲 *Si no escribes, te tumba el swing.*',
      '🧉 *Aquí to’ el mundo es pana, pero el más duro se respeta.*',
      '🎤 *Con una frase se prende el grupo, ¡suelta la tuya!*',
      '🇩🇴 *El que se va del grupo… ni falta hace, mi loco.*'
    ]

    const random = frases[Math.floor(Math.random() * frases.length)]

    await sock.sendMessage(m.key.remoteJid, {
      text: random
    }, { quoted: m })
  }
}
