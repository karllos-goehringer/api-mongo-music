import mongoose from 'mongoose';
import { GridFSBucket, ObjectId } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Models
import { Album } from './models/album.model';
import { Artist } from './models/artist.model';
import { Band } from './models/band.model';
import { Genre } from './models/genre.model';
import { Playlist } from './models/playlist.model';
import { User } from './models/user.model';
import { connectDatabase } from './config/database';

import dotenv from 'dotenv';
dotenv.config();

const SEED_DIR = path.join(__dirname, '../dados_para_seed');

const entityConfig: Record<string, { type: 'artist' | 'band', name: string, genre: string }> = {
  ozzyOsbourne: { type: 'artist', name: 'Ozzy Osbourne', genre: 'Heavy Metal' },
  'alemãoDoForró': { type: 'artist', name: 'Alemão do Forró', genre: 'Forró' },
  blackSabbath: { type: 'band', name: 'Black Sabbath', genre: 'Heavy Metal' },
  ironMaiden: { type: 'band', name: 'Iron Maiden', genre: 'Heavy Metal' },
  metallica: { type: 'band', name: 'Metallica', genre: 'Thrash Metal' },
  megadeath: { type: 'band', name: 'Megadeth', genre: 'Thrash Metal' }
};

function formatAlbumName(folderName: string): string {
  if (folderName === 'andJusticeForAll') return '...And Justice for All';
  if (folderName === 'blizzardOfOzz') return 'Blizzard of Ozz';
  
  // CamelCase to Normal Case
  const result = folderName.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

async function uploadFileToGridFS(bucket: GridFSBucket, filePath: string, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let contentType = 'application/octet-stream';
    if (filePath.endsWith('.mp3')) contentType = 'audio/mpeg';
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
    if (filePath.endsWith('.png')) contentType = 'image/png';
    if (filePath.endsWith('.webp')) contentType = 'image/webp';
    if (filePath.endsWith('.avif')) contentType = 'image/avif';

    const uploadStream = bucket.openUploadStream(filename, { contentType });
    const readStream = fs.createReadStream(filePath);

    readStream.pipe(uploadStream)
      .on('error', reject)
      .on('finish', () => {
        resolve(`/api/upload/${uploadStream.id}`);
      });
  });
}

async function runSeed() {
  try {
    await connectDatabase();
    console.log('--- Iniciando Seed Dinâmico ---');
    const db = mongoose.connection.db;
    if (!db) throw new Error("DB Connection failed");

    const bucket = new GridFSBucket(db, { bucketName: 'uploads' });

    console.log('Limpando banco de dados...');
    await Album.deleteMany({});
    await Artist.deleteMany({});
    await Band.deleteMany({});
    await Genre.deleteMany({});
    await Playlist.deleteMany({});
    await User.deleteMany({});

    try {
      await db.collection('uploads.files').deleteMany({});
      await db.collection('uploads.chunks').deleteMany({});
    } catch (e) {
      console.log('GridFS uploads collection não existia ainda.');
    }
    console.log('Banco de dados limpo!');

    // --- Gêneros ---
    const genres = [
      { name: 'Thrash Metal' },
      { name: 'Heavy Metal' },
      { name: 'Rock' },
      { name: 'Forró' }
    ];
    const createdGenres = await Genre.insertMany(genres);
    console.log('Gêneros criados!');

    // --- Coleta de Artistas, Bandas e Álbuns ---
    const artistsToInsert: any[] = [];
    const bandsToInsert: any[] = [];
    const albumsToInsert: any[] = [];

    const entities = fs.readdirSync(SEED_DIR);

    for (const folderName of entities) {
      const entityPath = path.join(SEED_DIR, folderName);
      if (!fs.lstatSync(entityPath).isDirectory()) continue;

      const config = entityConfig[folderName];
      if (!config) {
        console.log(`\nPulando pasta desconhecida: ${folderName}`);
        continue;
      }

      console.log(`\nProcessando: ${config.name}`);

      const entityFiles = fs.readdirSync(entityPath);
      let perfilUrl = null;
      let fundoUrl = null;

      for (const file of entityFiles) {
        if (fs.lstatSync(path.join(entityPath, file)).isFile()) {
          if (file.startsWith('perfil')) {
            perfilUrl = await uploadFileToGridFS(bucket, path.join(entityPath, file), file);
          }
          if (file.startsWith('fundo')) {
            fundoUrl = await uploadFileToGridFS(bucket, path.join(entityPath, file), file);
          }
        }
      }

      // Pré-gera o _id para referenciar nos álbuns sem precisar aguardar o insert
      const entityId = new ObjectId();
      const creditType = config.type;

      if (creditType === 'artist') {
        artistsToInsert.push({
          _id: entityId,
          name: config.name,
          description: `Artista: ${config.name}`,
          imageUrl: perfilUrl,
          backgroundImageUrl: fundoUrl
        });
        console.log(`  Artista ${config.name} preparado.`);
      } else {
        bandsToInsert.push({
          _id: entityId,
          name: config.name,
          description: `Banda: ${config.name}`,
          imageUrl: perfilUrl,
          backgroundImageUrl: fundoUrl,
          members: []
        });
        console.log(`  Banda ${config.name} preparada.`);
      }

      // Processar Álbuns
      for (const folder of entityFiles) {
        const albumPath = path.join(entityPath, folder);
        if (fs.lstatSync(albumPath).isDirectory()) {
          console.log(`  Processando Álbum: ${folder}`);
          const albumFiles = fs.readdirSync(albumPath);
          let capaUrl = null;
          const tracks: any[] = [];
          let trackNumber = 1;

          for (const file of albumFiles) {
            const filePath = path.join(albumPath, file);
            if (file.startsWith('capa')) {
              capaUrl = await uploadFileToGridFS(bucket, filePath, file);
            } else if (file.endsWith('.mp3')) {
              const songUrl = await uploadFileToGridFS(bucket, filePath, file);
              const trackTitle = file
                .replace(/_Remastered\.mp3$/, '')
                .replace(/\.mp3$/, '')
                .replace(/_/g, ' ');

              const genreObj = createdGenres.find(g => g.name === config.genre);

              tracks.push({
                _id: new ObjectId(),
                title: trackTitle,
                genreId: genreObj ? genreObj._id : createdGenres[0]._id,
                songPath: songUrl,
                trackNumber: trackNumber++
              });
            }
          }

          albumsToInsert.push({
            name: formatAlbumName(folder),
            releaseDate: new Date(),
            coverImageUrl: capaUrl,
            credits: [{
              type: creditType,
              refId: entityId,
              name: config.name
            }],
            tracks
          });
          console.log(`  Álbum ${formatAlbumName(folder)} preparado com ${tracks.length} músicas.`);
        }
      }
    }

    // --- insertMany em lote ---
    if (artistsToInsert.length > 0) {
      await Artist.insertMany(artistsToInsert);
      console.log(`\n${artistsToInsert.length} artista(s) inserido(s)!`);
    }

    if (bandsToInsert.length > 0) {
      await Band.insertMany(bandsToInsert);
      console.log(`${bandsToInsert.length} banda(s) inserida(s)!`);
    }

    if (albumsToInsert.length > 0) {
      await Album.insertMany(albumsToInsert);
      console.log(`${albumsToInsert.length} álbum(ns) inserido(s)!`);
    }

    // --- Usuários ---
    const nomesUsuarios = ['Ana', 'Bruno', 'Carlos', 'Willian', 'Daniel', 'Fernanda', 'Julia', 'Larissa', 'Lucas', 'Matheus', 'Rafael', 'Thiago', 'William', 'Yasmin'];
    const titulosPlaylists = ['Rockon', 'Musicao', 'Kpop da galera', 'melhores do robério e seus teclados', 'saudadeds motley crue'];
    const descricoesPlaylists = ['Playlist maneira pra escutar na estrada', 'Melhores do meu gosto', 'Sorteio de palavras', 'Banidas do Xampp', 'Melhores do Playboy do Boné'];

    const usuariosToInsert = Array.from({ length: 30 }, (_, i) => {
      const nome = nomesUsuarios[Math.floor(Math.random() * nomesUsuarios.length)] + ' ' + Math.floor(Math.random() * 1000);
      return {
        name: nome,
        email: `user${i}@example.com`,
        passwordHash: 'hashedpassword123',
        description: `Descrição do usuário ${nome}`
      };
    });
    const createdUsers = await User.insertMany(usuariosToInsert);
    console.log(`${createdUsers.length} usuários criados!`);

    // --- Playlists ---
    const playlistsToInsert = Array.from({ length: 5 }, (_, i) => {
      const owner = createdUsers[Math.floor(Math.random() * createdUsers.length)];
      return {
        name: titulosPlaylists[i % titulosPlaylists.length],
        description: descricoesPlaylists[i % descricoesPlaylists.length],
        ownerId: owner._id,
        followerIds: [],
        tracks: []
      };
    });
    const createdPlaylists = await Playlist.insertMany(playlistsToInsert);
    console.log(`${createdPlaylists.length} playlists criadas!`);

    console.log('\n--- Seed concluído com sucesso! ---');
    process.exit(0);
  } catch (error) {
    console.error('Erro no seed:', error);
    process.exit(1);
  }
}

runSeed();
