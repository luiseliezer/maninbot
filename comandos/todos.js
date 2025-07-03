module.exports = {
  comando: ['todos'],
  descripcion: 'Menciona a todos los del grupo con flow isleño 🌴',
  ejecutar: async (m, { sock }) => {
    const grupo = m.key.remoteJid

    if (!grupo.endsWith('@g.us')) {
      return sock.sendMessage(grupo, { text: '❌ Este comando solo funciona en grupos, manín.' }, { quoted: m })
    }

    const metadata = await sock.groupMetadata(grupo)
    const miembros = metadata.participants.map(p => p.id)

    const texto = `🌴 *¡Convocatoria tropical de Manin!* 🌴\n\n` +
      miembros.map(u => `🌴 @${u.split('@')[0]}`).join('\n') +
      `\n\n🍃 *¡To’ el mundo activo, que se armó el swing!* 🍃`

    await sock.sendMessage(grupo, { text: texto, mentions: miembros }, { quoted: m })
  }
}
