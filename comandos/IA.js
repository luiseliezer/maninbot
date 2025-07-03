// comandos/ia.js
const { consultarGemini } = require('../index')

module.exports = {
  comando: ['ia', 'ai', 'pregunta', 'consulta'],
  descripcion: 'Hacer una pregunta a la inteligencia artificial',
  uso: '.ia ¿cómo hacer sancocho?',
  categoria: 'IA',
  ejecutar: async (m, { sock, args }) => {
    try {
      // Verificar que hay una pregunta
      if (!args.length) {
        await sock.sendMessage(m.key.remoteJid, {
          text: `🤖 *ManinBot AI* 

¿Qué quieres preguntarme, tiguer?

*Ejemplos:*
• \`.ia ¿Cómo hacer mangú?\`
• \`.ia Explícame qué es la inteligencia artificial\`
• \`.ia Cuéntame un chiste dominicano\`
• \`.ia ¿Qué tiempo hace en Santo Domingo?\`

¡Pregúntame lo que sea! 🧠✨`
        }, { quoted: m })
        return
      }
      
      const pregunta = args.join(' ')
      
      // Mensaje de "escribiendo..."
      await sock.sendMessage(m.key.remoteJid, {
        text: '🤖 Déjame pensar... 🧠💭'
      }, { quoted: m })
      
      // Consultar a Gemini AI
      console.log('🤖 Consultando IA para:', pregunta)
      const respuesta = await consultarGemini(pregunta)
      
      // Enviar la respuesta
      await sock.sendMessage(m.key.remoteJid, {
        text: `🤖 *ManinBot AI*\n\n${respuesta}\n\n_Powered by Google Gemini_ ✨`
      }, { quoted: m })
      
      console.log('✅ Respuesta de IA enviada correctamente')
      
    } catch (error) {
      console.error('❌ Error en comando IA:', error.message)
      
      await sock.sendMessage(m.key.remoteJid, {
        text: '😵‍💫 Ay, que me trabé pensando! Intenta preguntarme de nuevo, mi loco.\n\n_Si el problema persiste, verifica tu API key de Gemini._'
      }, { quoted: m })
    }
  }
}