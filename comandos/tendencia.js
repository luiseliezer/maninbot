module.exports = {
  // Palabras para activar el comando
  comando: ['tendencia', 'videotendencia', 'trending'],
  
  // Descripción que aparecerá en un futuro comando de ayuda
  descripcion: 'Envía un video de tendencia como vista única.',

  /**
   * @param {import('@whiskeysockets/baileys').WASocket} sock
   * @param {import('@whiskeysockets/baileys').WAMessage} m
   * @param {object} args
   */
  ejecutar: async (m, { sock, enviarVideoVistaUnica }) => {
    // Texto que acompañará al video
    const caption = '🔥 ¡Klk! Chequéate este video que está en tendencia ahora mismo. 👀';

    // Se intenta enviar el video llamado 'tendencia.mp4'
    // La función devuelve 'true' si se envió, 'false' si no se encontró el archivo.
    const enviado = await enviarVideoVistaUnica(sock, m.key.remoteJid, 'tendencia', caption, m);
    
    // Si el video no se encontró, envía un mensaje de texto como alternativa.
    if (!enviado) {
      await sock.sendMessage(m.key.remoteJid, {
        text: '😵‍💫 ¡Diantre! No encontré el video de tendencia ahora mismo. Te lo mando ahorita.'
      }, { quoted: m });
    }
  }
};