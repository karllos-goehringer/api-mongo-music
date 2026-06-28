# API Mongo Music

API REST para gerenciamento de músicas, álbuns, artistas, bandas, usuários e playlists, desenvolvida em **Node.js** e **MongoDB**. O projeto fornece os dados consumidos pelo aplicativo mobile **SpotiLike**.

## Aplicação Mobile

Repositório do aplicativo:

https://github.com/karllos-goehringer/spotilike-front

## Demonstração

A API está disponível em:

https://api-mongo-music.onrender.com/

> **Observação**
>
> A instância hospedada utiliza o **MongoDB Atlas Free Tier**, que possui limite de aproximadamente **520 MB** de armazenamento. Por esse motivo, a quantidade de arquivos disponíveis na versão online é reduzida. Na local você pode colocar o quanto quiser.

---

# Tecnologias

- Node.js
- Express
- MongoDB
- MongoDB GridFS
- Mongoose
- Multer
- TypeScript

# Funcionalidades

- Cadastro de artistas
- Cadastro de bandas
- Cadastro de álbuns
- Cadastro de músicas
- Upload de imagens
- Upload de arquivos de áudio
- Streaming de músicas utilizando GridFS
- Cadastro de usuários
- Criação de playlists
- Gerenciamento de gêneros musicais

# Instalação

## Clone o repositório

```bash
git clone https://github.com/karllos-goehringer/API-Mongo-Music.git
cd API-Mongo-Music
```
## ATENÇÃO

```bash
Para popular o banco de dados se atente a pasta dados_para_seed que é nela onde estão os arquivos para o seed do banco.
Caso você queira adicionar as novas músicas/albuns/artistas veja a arquitetura da pasta e insira no mesmo padrão, que será usado também no seed.
    Exemplo:
      <ironMaiden> //pasta
          perfil.img
          fundo.img
          <Powerslave> //pasta
            capa.img
            musicas.mp3...
          </Powerslave>
      </ironMaiden>
```
## Instale as dependências

```bash
npm install
```

## Configure o arquivo .env

```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/spotlike
```

## Popular o banco

```bash
npm run seed
```

## Executar

```bash
npm run dev
```

# Estrutura do Banco de Dados

## Collections

- albums
- artists
- bands
- genres
- playlists
- users
- uploads.files
- uploads.chunks

## Albums

```js
{
  _id,
  name,
  releaseDate,
  coverImageUrl,
  credits,
  tracks:[
    {
      _id,
      title,
      duration,
      lyrics,
      genreId,
      songPath,
      trackNumber
    }
  ],
  createdAt,
  updatedAt
}
```

## Artists

```js
{
  _id,
  name,
  description,
  imageUrl,
  backgroundImageUrl,
  createdAt,
  updatedAt
}
```

## Bands

```js
{
  _id,
  name,
  description,
  imageUrl,
  backgroundImageUrl,
  members:[
    {
      artistId,
      name
    }
  ],
  createdAt,
  updatedAt
}
```

## Genres

```js
{
  _id,
  name
}
```

## Playlists

```js
{
  _id,
  name,
  imageUrl,
  description,
  ownerId,
  followerIds,
  tracks,
  createdAt,
  updatedAt
}
```

## Users

```js
{
  _id,
  name,
  email,
  passwordHash,
  profilePictureUrl,
  backgroundImageUrl,
  description,
  createdAt,
  updatedAt
}
```

# Rotas
Temos o mesmo padrão para todas as rotas de objetos em si, onde há o CRUD desses objetos
temos rotas de:

  Create
  Create Many
  GetByID
  GetAll
  Update
  Delete
  
- /albums
- /artists
- /bands
- /genres
- /playlists
- /uploads
- /users
  
  Em pipelines teremos rotas muito mais específicas e que não seguem o padrão de CRUD
- /pipelines
    /pipelines/top-playlists -- retorna as playlists com mais seguidores
    /pipelines/genre-songs -- retorna o número de músicas por gênero músical
    /pipelines/band-credits -- retorna o número de artistas associados a Banda e numero de albums creditados a banda Ex:
      {
        "name": "Black Sabbath",
        "totalMembers": 1, -- no caso so o Ozzy, se houver mais perfis vinculados, maior o número
        "albumCreditCount": 1, -- numero de albuns vinculados no sistema.
        "bandId": "6a408aaac5f85a2062836236"
      }
    /pipelines/genre-albums -- retorna todos os numero de albuns por genero junto dos albuns.

    /pipelines/user-playlist-stats retorna o numero de playlists do usuário por usuario, media de músicas por playlist e maior numero de musica em uma única playlist.

# Organização

```text
src/
├── config
├── controllers
├── models
├── routes
├── app.ts
├── seed.ts
└── server
```
# Embbeds x References
```text
Temos os seguintes embbeds no projeto:

- album
  - tracks
    - Foi implementado junto ao álbum para facilitar na exibição, já que sempre que exibir uma música no front ele já usa a imagem, nome e outras coisas do álbum.

E os seguintes References:

- albums
  - credits
    - Deixado apenas a referência do artista/banda referenciado com o tipo (se é banda ou solo), ID (referência) e nome (para não precisar buscar no outro objeto). Deixado como referência para ter o dado rápido, mas ter a possibilidade de buscar os dados completos através do álbum.

- bands
  - members
    - Deixado como referência para rápido acesso aos membros da banda que têm carreira solo (exemplo), ID (referência) e nome.

- playlists
  - followerIds
    - Vetor com referência para os usuários que seguem essa playlist.

- playlists
  - tracks
    - Contém duas referências, uma para álbum e outra para música, para acesso rápido através de nova chamada.
```