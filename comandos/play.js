const yts = require('yt-search')
const ytdl = require('ytdl-core')
const ffmpeg = require('fluent-ffmpeg')
const fs = require('fs')
const path = require('path')

module.exports = {
  comando: ['play', 'p', 'música'],
  descripcion: 'Reproduce música de YouTube con intro isleño 🎶',
  ejecutar: async (m, { sock, texto, args }) => {
    try {
      // Verificar argumentos
      if (!args.length) {
        return await sock.sendMessage(m.key.remoteJid, {
          text: '❌ Tienes que escribir el nombre de una canción, bro.\n_Ejemplo: .play calor de noche_'
        }, { quoted: m })
      }

      const query = args.join(' ')
      
      // Mensaje de búsqueda
      await sock.sendMessage(m.key.remoteJid, {
        text: `🔍 Buscando: *${query}*\n⏳ Espera un momentico...`
      }, { quoted: m })

      // Buscar en YouTube
      const searchResults = await yts(query)
      const video = searchResults.videos.length > 0 ? searchResults.videos[0] : null

      if (!video) {
        return await sock.sendMessage(m.key.remoteJid, {
          text: '❌ No encontré na\' con ese nombre. Intenta con otra canción.'
        }, { quoted: m })
      }

      const url = video.url
      const videoTitle = video.title
      const duration = video.timestamp
      
      // Verificar que el video sea válido
      if (!ytdl.validateURL(url)) {
        return await sock.sendMessage(m.key.remoteJid, {
          text: '❌ Esta URL no es válida, manito. Intenta con otra canción.'
        }, { quoted: m })
      }

      // Verificar información del video
      const info = await ytdl.getInfo(url)
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly')
      
      if (audioFormats.length === 0) {
        return await sock.sendMessage(m.key.remoteJid, {
          text: '❌ Este video no tiene audio disponible.'
        }, { quoted: m })
      }

      // Crear carpeta temp si no existe
      const tempDir = path.join(__dirname, '..', 'temp')
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      const fileName = `manin_${Date.now()}.mp3`
      const filePath = path.join(tempDir, fileName)

      // Mensaje de descarga
      await sock.sendMessage(m.key.remoteJid, {
        text: `🎶 *Manin DJ está en la casa...*\n🎵 Descargando: *${videoTitle}*\n⏱️ Duración: ${duration}\n\n🔥 ¡Preparando la chercha!`
      }, { quoted: m })

      // Configurar opciones de descarga
      const downloadOptions = {
        filter: 'audioonly',
        quality: 'highestaudio',
        highWaterMark: 1 << 25 // 32MB buffer
      }

      // Crear stream de descarga
      const stream = ytdl(url, downloadOptions)
      
      // Manejar errores del stream
      stream.on('error', (err) => {
        console.error('Error en el stream:', err)
        sock.sendMessage(m.key.remoteJid, {
          text: '❌ Error descargando el audio. Intenta con otra canción.'
        }, { quoted: m })
      })

      // Procesar con FFmpeg
      ffmpeg(stream)
        .audioBitrate(128)
        .audioCodec('libmp3lame')
        .audioChannels(2)
        .audioFrequency(44100)
        .format('mp3')
        .save(filePath)
        .on('start', (commandLine) => {
          console.log('FFmpeg iniciado:', commandLine)
        })
        .on('progress', (progress) => {
          console.log('Progreso:', progress.percent + '% procesado')
        })
        .on('end', async () => {
          try {
            console.log('✅ Conversión completada')
            
            // Verificar que el archivo existe
            if (!fs.existsSync(filePath)) {
              throw new Error('El archivo no se creó correctamente')
            }

            // Verificar el tamaño del archivo
            const stats = fs.statSync(filePath)
            const fileSizeInMB = stats.size / (1024 * 1024)
            
            if (fileSizeInMB > 100) {
              fs.unlinkSync(filePath)
              return await sock.sendMessage(m.key.remoteJid, {
                text: '❌ El archivo es muy pesado (>100MB). Intenta con una canción más corta.'
              }, { quoted: m })
            }

            // Enviar el audio
            await sock.sendMessage(m.key.remoteJid, {
              audio: fs.readFileSync(filePath),
              mimetype: 'audio/mpeg',
              fileName: `${videoTitle}.mp3`,
              ptt: false,
              contextInfo: {
                externalAdReply: {
                  title: videoTitle,
                  body: `🎵 ManinBot DJ 🎵`,
                  thumbnailUrl: video.thumbnail,
                  sourceUrl: url,
                  mediaType: 2,
                  mediaUrl: url
                }
              }
            }, { quoted: m })

            // Limpiar archivo temporal
            fs.unlinkSync(filePath)
            console.log('🗑️ Archivo temporal eliminado')

          } catch (sendError) {
            console.error('Error enviando audio:', sendError)
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath)
            }
            await sock.sendMessage(m.key.remoteJid, {
              text: '❌ Error enviando el audio. El archivo puede ser muy pesado.'
            }, { quoted: m })
          }
        })
        .on('error', async (err) => {
          console.error('💥 Error de FFmpeg:', err)
          
          // Limpiar archivo si existe
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }
          
          await sock.sendMessage(m.key.remoteJid, {
            text: '❌ Se dañó la mezcla, manito. Intenta otra vez con otra canción.\n\n🔧 *Posibles soluciones:*\n• Intenta con una canción más corta\n• Verifica que el video existe\n• Intenta con otro nombre'
          }, { quoted: m })
        })

    } catch (error) {
      console.error('💥 Error general en comando play:', error)
      await sock.sendMessage(m.key.remoteJid, {
        text: '❌ Algo salió mal, bro. Intenta de nuevo en un rato.\n\n_Error: ' + error.message + '_'
      }, { quoted: m })
    }
  }
}