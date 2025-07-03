// Crear archivo: comandos/whoami.js
module.exports = {
    comando: ['whoami', 'quien'],
    descripcion: 'Muestra información sobre tu número',
    categoria: 'debug',
    
    async ejecutar(m, { sock, config }) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const senderNumber = sender.split('@')[0];
        const isOwner = senderNumber === config.ownerNumber;
        
        const info = `🔍 *Información de debug:*
        
📱 *Tu número detectado:* ${senderNumber}
👑 *Número de dueño configurado:* ${config.ownerNumber || 'NO CONFIGURADO'}
✅ *¿Eres el dueño?:* ${isOwner ? 'SÍ' : 'NO'}
📋 *Sender completo:* ${sender}`;
        
        await sock.sendMessage(jid, { text: info }, { quoted: m });
    }
};