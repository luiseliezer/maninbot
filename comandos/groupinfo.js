// Crear archivo: comandos/groupinfo.js
module.exports = {
    comando: ['groupinfo', 'infogrupo', 'gi'],
    descripcion: 'Muestra información del grupo y permisos',
    categoria: 'debug',
    
    async ejecutar(m, { sock, config }) {
        const jid = m.key.remoteJid;
        const sender = m.key.participant || jid;
        const senderNumber = sender.split('@')[0];
        const isGroup = jid.endsWith('@g.us');
        const isOwner = senderNumber === config.ownerNumber;
        
        if (!isGroup) {
            await sock.sendMessage(jid, { text: '❌ Este comando solo funciona en grupos.' }, { quoted: m });
            return;
        }
        
        try {
            const groupMetadata = await sock.groupMetadata(jid);
            const participant = groupMetadata.participants.find(p => p.id === sender);
            const isGroupAdmin = !!participant?.admin;
            
            // Buscar si el bot es admin
            const botParticipant = groupMetadata.participants.find(p => p.id === sock.user.id);
            const botIsAdmin = !!botParticipant?.admin;
            
            const info = `🏷️ *Información del grupo:*

📋 *Nombre:* ${groupMetadata.subject}
👥 *Participantes:* ${groupMetadata.participants.length}
🔒 *Restringido:* ${groupMetadata.restrict ? 'Sí' : 'No'}
📢 *Solo admins pueden escribir:* ${groupMetadata.announce ? 'Sí' : 'No'}

👤 *Tu información:*
📱 *Número:* ${senderNumber}
👑 *Eres dueño del bot:* ${isOwner ? 'SÍ' : 'NO'}
🛡️ *Eres admin del grupo:* ${isGroupAdmin ? 'SÍ' : 'NO'}
✅ *Puedes usar el bot:* ${isOwner || isGroupAdmin ? 'SÍ' : 'NO'}

🤖 *Bot información:*
🛡️ *Bot es admin:* ${botIsAdmin ? 'SÍ' : 'NO'}
⚠️ *Problema:* ${!botIsAdmin ? 'El bot NO es admin, no puede leer permisos correctamente' : 'Todo correcto'}`;
            
            await sock.sendMessage(jid, { text: info }, { quoted: m });
            
        } catch (error) {
            console.error('Error obteniendo metadata del grupo:', error);
            await sock.sendMessage(jid, { 
                text: '❌ No pude obtener información del grupo. El bot necesita ser administrador.' 
            }, { quoted: m });
        }
    }
};