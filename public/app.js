// Configurações globais do Spotlike Admin
let currentTab = 'genres';
let cachedArtists = [];
let cachedBands = [];
let cachedGenres = [];
let cachedAlbums = [];
let cachedUsers = [];

// Estado de edição por entidade
const editingState = {
  genres: null,
  artists: null,
  bands: null,
  albums: null,
  playlists: null,
  users: null,
};

const API_ORIGIN = (() => {
  if (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3001')) {
    return 'http://localhost:3001';
  }
  return window.location.origin;
})();

function apiUrl(path) {
  return `${API_ORIGIN}${path}`;
}

function publicUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith('/') ? path : `/${path}`}`;
}

// Inicialização da página
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  fetchCurrentTab();
  lucide.createIcons();
});

// 1. Controle de Navegação entre Abas
function setupNavigation() {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      document.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));
      currentTab = item.getAttribute('data-tab');
      document.getElementById(`tab-${currentTab}`).classList.remove('hidden');
      updateHeaderTexts();
      fetchCurrentTab();
    });
  });
}

function updateHeaderTexts() {
  const title = document.getElementById('tab-title');
  const subtitle = document.getElementById('tab-subtitle');
  switch(currentTab) {
    case 'genres':
      title.innerText = 'Gerenciador de Gêneros';
      subtitle.innerText = 'Cadastre e gerencie gêneros musicais no Spotlike';
      break;
    case 'artists':
      title.innerText = 'Gerenciador de Artistas';
      subtitle.innerText = 'Cadastre e gerencie cantores e músicos solo';
      break;
    case 'bands':
      title.innerText = 'Gerenciador de Bandas';
      subtitle.innerText = 'Cadastre e gerencie bandas musicais e vincule seus membros';
      break;
    case 'albums':
      title.innerText = 'Gerenciador de Álbuns e Faixas';
      subtitle.innerText = 'Cadastre álbuns de estúdio e inclua suas respectivas faixas (songs)';
      break;
    case 'playlists':
      title.innerText = 'Gerenciador de Playlists';
      subtitle.innerText = 'Crie playlists, vincule criadores, seguidores e músicas';
      break;
    case 'users':
      title.innerText = 'Gerenciador de Usuários';
      subtitle.innerText = 'Gerencie contas de usuários cadastrados no Spotlike';
      break;
  }
}

// 2. Fetch de Dados conforme a Aba ativa
async function fetchCurrentTab() {
  showAlert('Carregando dados...', 'success', 1000);
  try {
    switch(currentTab) {
      case 'genres':
        await loadGenres();
        break;
      case 'artists':
        await loadArtists();
        break;
      case 'bands':
        await loadArtists();
        await loadBands();
        break;
      case 'albums':
        await loadArtists();
        await loadBands();
        await loadGenres();
        await loadAlbums();
        resetAlbumTracksBuilder();
        break;
      case 'playlists':
        await loadUsers();
        await loadAlbums();
        await loadPlaylists();
        resetPlaylistTracksBuilder();
        break;
      case 'users':
        await loadUsers();
        break;
    }
    lucide.createIcons();
  } catch (error) {
    console.error(error);
    showAlert('Erro ao obter dados da API local.', 'error');
  }
}

// ==========================================
// EDIT STATE HELPERS
// ==========================================

/**
 * Entra no modo de edição para uma entidade.
 * Atualiza o título do card, o texto do botão submit e exibe o botão cancelar.
 */
function enterEditMode(entity, id) {
  editingState[entity] = id;

  const form = document.getElementById(`form-${entity}`);
  if (!form) return;

  // Adiciona classe visual ao form card
  const card = form.closest('.card');
  if (card) card.classList.add('editing-mode');

  // Atualiza o título do card de formulário
  const cardTitle = card ? card.querySelector('h3') : null;
  if (cardTitle) {
    const iconHtml = cardTitle.querySelector('i') ? cardTitle.querySelector('i').outerHTML : '';
    cardTitle.innerHTML = `${iconHtml} Editando Registro`;
  }

  // Atualiza o botão de submit
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    submitBtn.innerHTML = '<i data-lucide="check-circle"></i> Salvar Alterações';
    submitBtn.classList.remove('btn-primary');
    submitBtn.classList.add('btn-edit-save');
  }

  // Exibe o botão de cancelar
  const cancelBtn = document.getElementById(`cancel-edit-${entity}`);
  if (cancelBtn) cancelBtn.classList.remove('hidden');

  lucide.createIcons();
}

/**
 * Sai do modo de edição e restaura o formulário ao estado inicial.
 */
function cancelEdit(entity) {
  editingState[entity] = null;

  const form = document.getElementById(`form-${entity}`);
  if (!form) return;

  form.reset();

  // Se for o form de bandas, limpa explicitamente a seleção de membros
  if (entity === 'bands') {
    renderBandMembersSelection();
  }

  // Remove classe visual
  const card = form.closest('.card');
  if (card) card.classList.remove('editing-mode');

  // Restaura título do card
  const cardTitle = card ? card.querySelector('h3') : null;
  if (cardTitle) {
    const labels = {
      genres: '<i data-lucide="plus-circle"></i> Novo Gênero',
      artists: '<i data-lucide="plus-circle"></i> Novo Artista',
      bands: '<i data-lucide="plus-circle"></i> Nova Banda',
      albums: '<i data-lucide="plus-circle"></i> Novo Álbum',
      playlists: '<i data-lucide="plus-circle"></i> Nova Playlist',
      users: '<i data-lucide="plus-circle"></i> Novo Usuário',
    };
    cardTitle.innerHTML = labels[entity] || '<i data-lucide="plus-circle"></i> Novo Registro';
  }

  // Restaura o botão de submit
  const submitBtn = form.querySelector('button[type="submit"]');
  if (submitBtn) {
    const labels = {
      genres: '<i data-lucide="save"></i> Salvar Gênero',
      artists: '<i data-lucide="save"></i> Salvar Artista',
      bands: '<i data-lucide="save"></i> Salvar Banda',
      albums: '<i data-lucide="save"></i> Salvar Álbum completo',
      playlists: '<i data-lucide="save"></i> Salvar Playlist',
      users: '<i data-lucide="save"></i> Salvar Usuário',
    };
    submitBtn.innerHTML = labels[entity] || '<i data-lucide="save"></i> Salvar';
    submitBtn.classList.add('btn-primary');
    submitBtn.classList.remove('btn-edit-save');
  }

  // Esconde o botão de cancelar
  const cancelBtn = document.getElementById(`cancel-edit-${entity}`);
  if (cancelBtn) cancelBtn.classList.add('hidden');

  // Limpa upload statuses
  document.querySelectorAll('.upload-status').forEach(el => el.textContent = '');

  // Reset especial para albums
  if (entity === 'albums') resetAlbumTracksBuilder();
  if (entity === 'playlists') resetPlaylistTracksBuilder();

  lucide.createIcons();
}

// ==========================================
// LOADERS & RENDERS
// ==========================================

async function loadGenres() {
  const res = await fetch(apiUrl('/api/genres'));
  cachedGenres = await res.json();

  const tbody = document.getElementById('list-genres');
  tbody.innerHTML = '';

  if (cachedGenres.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="empty-state-text">Nenhum gênero cadastrado</td></tr>';
    return;
  }

  cachedGenres.forEach(genre => {
    tbody.innerHTML += `
      <tr>
        <td><code>${genre._id}</code></td>
        <td><strong>${genre.name}</strong></td>
        <td class="actions-cell">
          <button class="btn-edit" onclick="editGenre('${genre._id}')">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn-danger" onclick="deleteItem('genres', '${genre._id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

function editGenre(id) {
  const genre = cachedGenres.find(g => g._id === id);
  if (!genre) return;
  document.getElementById('genre-name').value = genre.name || '';
  enterEditMode('genres', id);
  document.getElementById('form-genres').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadArtists() {
  const res = await fetch(apiUrl('/api/artists'));
  cachedArtists = await res.json();

  const tbody = document.getElementById('list-artists');
  tbody.innerHTML = '';

  if (cachedArtists.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state-text">Nenhum artista cadastrado</td></tr>';
  } else {
    cachedArtists.forEach(artist => {
      const img = artist.imageUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&fit=crop';
      tbody.innerHTML += `
        <tr>
          <td><img src="${publicUrl(img)}" class="table-img" alt="${artist.name}"></td>
          <td><strong>${artist.name}</strong></td>
          <td>${artist.description || '<span class="empty-state-text">Sem bio</span>'}</td>
          <td class="actions-cell">
            <button class="btn-edit" onclick="editArtist('${artist._id}')">
              <i data-lucide="pencil"></i>
            </button>
            <button class="btn-danger" onclick="deleteItem('artists', '${artist._id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    });
  }

  // Se houver uma banda em edição, preserva os membros já selecionados ao re-renderizar a lista
  if (editingState.bands) {
    const editingBand = cachedBands.find(b => b._id === editingState.bands);
    renderBandMembersSelection(getBandMemberIds(editingBand));
  } else {
    renderBandMembersSelection();
  }
}

function editArtist(id) {
  const artist = cachedArtists.find(a => a._id === id);
  if (!artist) return;
  document.getElementById('artist-name').value = artist.name || '';
  document.getElementById('artist-description').value = artist.description || '';
  document.getElementById('artist-image').value = publicUrl(artist.imageUrl) || '';
  document.getElementById('artist-bg-image').value = publicUrl(artist.backgroundImageUrl) || '';
  enterEditMode('artists', id);
  document.getElementById('form-artists').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function getBandMemberIds(band) {
  return (band?.members || []).map(m => {
    const raw = m.artistId && m.artistId._id ? m.artistId._id : (m.artistId || m._id);
    return String(raw);
  });
}

function renderBandMembersSelection(selectedIds = []) {
  const container = document.getElementById('band-members-list');
  if (!container) return;

  if (cachedArtists.length === 0) {
    container.innerHTML = '<p class="empty-state-text">Cadastre artistas primeiro</p>';
    return;
  }

  container.innerHTML = cachedArtists.map(artist => `
    <label class="selection-item">
      <input type="checkbox" name="band-member-checkbox" value="${artist._id}" data-name="${artist.name}"
        ${selectedIds.includes(String(artist._id)) ? 'checked' : ''}>
      <span>${artist.name}</span>
    </label>
  `).join('');
}

async function loadBands() {
  const res = await fetch(apiUrl('/api/bands'));
  cachedBands = await res.json();

  const tbody = document.getElementById('list-bands');
  tbody.innerHTML = '';

  if (cachedBands.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty-state-text">Nenhuma banda cadastrada</td></tr>';
    return;
  }

  cachedBands.forEach(band => {
    const img = band.imageUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&fit=crop';
    const membersList = band.members.map(m => m.name).join(', ') || '<span class="empty-state-text">Sem membros</span>';
    tbody.innerHTML += `
      <tr>
        <td><img src="${publicUrl(img)}" class="table-img" alt="${band.name}"></td>
        <td><strong>${band.name}</strong></td>
        <td>${membersList}</td>
        <td class="actions-cell">
          <button class="btn-edit" onclick="editBand('${band._id}')">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn-danger" onclick="deleteItem('bands', '${band._id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

function editBand(id) {
  const band = cachedBands.find(b => b._id === id);
  if (!band) return;
  document.getElementById('band-name').value = band.name || '';
  document.getElementById('band-description').value = band.description || '';
  document.getElementById('band-image').value = publicUrl(band.imageUrl) || '';
  document.getElementById('band-bg-image').value = publicUrl(band.backgroundImageUrl) || '';

  // Seleciona os membros existentes (artistId pode vir como string ou como objeto populado)
  renderBandMembersSelection(getBandMemberIds(band));

  enterEditMode('bands', id);
  document.getElementById('form-bands').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function loadAlbums() {
  const res = await fetch(apiUrl('/api/albums'));
  cachedAlbums = await res.json();
  toggleCreditOptions();

  const tbody = document.getElementById('list-albums');
  tbody.innerHTML = '';

  if (cachedAlbums.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state-text">Nenhum álbum cadastrado</td></tr>';
    return;
  }

  cachedAlbums.forEach(album => {
    const img = album.coverImageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&fit=crop';
    const creditStr = album.credits.map(c => `${c.name} (${c.type === 'band' ? 'Banda' : 'Solo'})`).join(', ') || 'N/A';
    const tracksCount = album.tracks.length;
    const release = album.releaseDate ? new Date(album.releaseDate).toLocaleDateString('pt-BR') : 'N/A';

    tbody.innerHTML += `
      <tr>
        <td><img src="${publicUrl(img)}" class="table-img square" alt="${album.name}"></td>
        <td><strong>${album.name}</strong></td>
        <td>${release}</td>
        <td><code>${creditStr}</code></td>
        <td>${tracksCount} faixas</td>
        <td class="actions-cell">
          <button class="btn-edit" onclick="editAlbum('${album._id}')">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn-danger" onclick="deleteItem('albums', '${album._id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

function editAlbum(id) {
  const album = cachedAlbums.find(a => a._id === id);
  if (!album) return;

  document.getElementById('album-name').value = album.name || '';
  document.getElementById('album-date').value = album.releaseDate
    ? new Date(album.releaseDate).toISOString().split('T')[0]
    : '';
  document.getElementById('album-cover').value = publicUrl(album.coverImageUrl) || '';

  // Crédito
  if (album.credits && album.credits.length > 0) {
    const credit = album.credits[0];
    const typeSelect = document.getElementById('album-credit-type');
    typeSelect.value = credit.type || 'artist';
    toggleCreditOptions();
    setTimeout(() => {
      const refSelect = document.getElementById('album-credit-ref');
      refSelect.value = credit.refId || '';
    }, 50);
  }

  // Reconstrói o tracks builder com as músicas existentes
  const container = document.getElementById('tracks-builder-container');
  container.innerHTML = '';
  albumTrackCount = 0;

  if (album.tracks && album.tracks.length > 0) {
    album.tracks.forEach(track => {
      albumTrackCount++;
      const trackId = albumTrackCount;
      const row = document.createElement('div');
      row.className = 'track-row';
      row.id = `album-track-row-${trackId}`;

      let genresOptions = cachedGenres.map(g =>
        `<option value="${g._id}" ${String(g._id) === String(track.genreId?._id || track.genreId) ? 'selected' : ''}>${g.name}</option>`
      ).join('');
      if (genresOptions === '') genresOptions = '<option value="">Cadastre gêneros antes</option>';

      row.innerHTML = `
        <div class="track-num-label">#${trackId}</div>
        <input type="text" class="track-title" placeholder="Nome da Música" value="${track.title || ''}" required>
        <input type="hidden" class="track-duration" value="${track.duration || ''}">
        <select class="track-genre" required>${genresOptions}</select>
        <div class="track-song-upload">
          <input type="hidden" class="track-song-path" value="${publicUrl(track.songPath) || ''}">
          <label class="btn-upload track-upload-btn" title="Upload do arquivo de áudio">
            <i data-lucide="music"></i>
            <input type="file" accept="audio/*,.mp3,.wav,.flac" onchange="uploadTrackSong(this, ${trackId})">
          </label>
          <span class="track-upload-indicator" id="track-song-status-${trackId}">${track.songPath ? '✓ Áudio' : ''}</span>
        </div>
        <button type="button" class="btn-danger btn-sm" onclick="removeTrackRow(${trackId})"><i data-lucide="x"></i></button>
      `;
      container.appendChild(row);
    });
  } else {
    addTrackRow();
  }

  enterEditMode('albums', id);
  document.getElementById('form-albums').scrollIntoView({ behavior: 'smooth', block: 'start' });
  lucide.createIcons();
}

function toggleCreditOptions() {
  const typeSelect = document.getElementById('album-credit-type');
  const refSelect = document.getElementById('album-credit-ref');
  if (!typeSelect || !refSelect) return;

  const type = typeSelect.value;
  refSelect.innerHTML = '';

  if (type === 'artist') {
    if (cachedArtists.length === 0) {
      refSelect.innerHTML = '<option value="">Cadastre um artista antes</option>';
      return;
    }
    cachedArtists.forEach(art => {
      refSelect.innerHTML += `<option value="${art._id}">${art.name}</option>`;
    });
  } else {
    if (cachedBands.length === 0) {
      refSelect.innerHTML = '<option value="">Cadastre uma banda antes</option>';
      return;
    }
    cachedBands.forEach(band => {
      refSelect.innerHTML += `<option value="${band._id}">${band.name}</option>`;
    });
  }
}

// Construtor dinâmico de tracks no Álbum
let albumTrackCount = 0;
function resetAlbumTracksBuilder() {
  const container = document.getElementById('tracks-builder-container');
  if (!container) return;
  container.innerHTML = '';
  albumTrackCount = 0;
  addTrackRow();
}

function addTrackRow() {
  const container = document.getElementById('tracks-builder-container');
  albumTrackCount++;
  const trackId = albumTrackCount;

  const row = document.createElement('div');
  row.className = 'track-row';
  row.id = `album-track-row-${trackId}`;

  let genresOptions = cachedGenres.map(g => `<option value="${g._id}">${g.name}</option>`).join('');
  if (genresOptions === '') genresOptions = '<option value="">Cadastre gêneros antes</option>';

  row.innerHTML = `
    <div class="track-num-label">#${trackId}</div>
    <input type="text" class="track-title" placeholder="Nome da Música" required>
    <input type="hidden" class="track-duration">
    <select class="track-genre" required>${genresOptions}</select>
    <div class="track-song-upload">
      <input type="hidden" class="track-song-path">
      <label class="btn-upload track-upload-btn" title="Upload do arquivo de áudio">
        <i data-lucide="music"></i>
        <input type="file" accept="audio/*,.mp3,.wav,.flac" onchange="uploadTrackSong(this, ${trackId})">
      </label>
      <span class="track-upload-indicator" id="track-song-status-${trackId}"></span>
    </div>
    <button type="button" class="btn-danger btn-sm" onclick="removeTrackRow(${trackId})"><i data-lucide="x"></i></button>
  `;
  container.appendChild(row);
  lucide.createIcons();
}

async function uploadTrackSong(input, trackId) {
  const statusEl = document.getElementById(`track-song-status-${trackId}`);
  const row = document.getElementById(`album-track-row-${trackId}`);
  const hiddenInput = row ? row.querySelector('.track-song-path') : null;
  const durationInput = row ? row.querySelector('.track-duration') : null;
  const label = input.closest('.btn-upload');

  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];

  const audio = new Audio();
  audio.src = URL.createObjectURL(file);
  audio.addEventListener('loadedmetadata', () => {
    const durationSeconds = audio.duration;
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = Math.floor(durationSeconds % 60);
    const durationFormatted = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    if (durationInput && !durationInput.value) {
      durationInput.value = durationFormatted;
    }
    URL.revokeObjectURL(audio.src);
  });

  statusEl.textContent = '⏳ Enviando...';
  statusEl.style.color = 'var(--color-primary-hover)';
  if (label) label.classList.add('uploading');

  try {
    const formData = new FormData();
    formData.append('file', input.files[0]);
    const res = await fetch(apiUrl('/api/upload'), { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Falha no upload');
    const data = await res.json();
    if (hiddenInput) hiddenInput.value = publicUrl(data.url);
    statusEl.textContent = '✓ ' + input.files[0].name;
    statusEl.style.color = 'var(--color-green)';
  } catch (e) {
    statusEl.textContent = '✗ Erro';
    statusEl.style.color = 'var(--color-red)';
  } finally {
    if (label) label.classList.remove('uploading');
  }
}

function removeTrackRow(id) {
  const row = document.getElementById(`album-track-row-${id}`);
  if (row) row.remove();
}

// Lógica de Playlists
async function loadPlaylists() {
  const res = await fetch(apiUrl('/api/playlists'));
  const playlists = await res.json();

  const tbody = document.getElementById('list-playlists');
  tbody.innerHTML = '';

  if (playlists.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state-text">Nenhuma playlist cadastrada</td></tr>';
    return;
  }

  playlists.forEach(playlist => {
    const img = playlist.imageUrl || 'https://images.unsplash.com/photo-1487180142328-0c4e37023af5?w=100&fit=crop';
    const ownerName = playlist.ownerId ? playlist.ownerId.name : 'N/A';
    const followersCount = playlist.followerIds ? playlist.followerIds.length : 0;

    tbody.innerHTML += `
      <tr>
        <td><img src="${publicUrl(img)}" class="table-img square" alt="${playlist.name}"></td>
        <td><strong>${playlist.name}</strong></td>
        <td>${ownerName}</td>
        <td>${playlist.tracks.length} músicas</td>
        <td>${followersCount} seguidores</td>
        <td class="actions-cell">
          <button class="btn-edit" onclick="editPlaylist('${playlist._id}')">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn-danger" onclick="deleteItem('playlists', '${playlist._id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  });

  // guarda para poder editar depois
  window._cachedPlaylists = playlists;
}

function editPlaylist(id) {
  const playlist = (window._cachedPlaylists || []).find(p => p._id === id);
  if (!playlist) return;

  document.getElementById('playlist-name').value = playlist.name || '';
  document.getElementById('playlist-description').value = playlist.description || '';
  document.getElementById('playlist-image').value = publicUrl(playlist.imageUrl) || '';

  // Dono
  const ownerSelect = document.getElementById('playlist-owner');
  if (ownerSelect) {
    ownerSelect.value = playlist.ownerId ? (playlist.ownerId._id || playlist.ownerId) : '';
  }

  // Seguidores
  const followerIds = (playlist.followerIds || []).map(f => String(f._id || f));
  document.querySelectorAll('input[name="playlist-follower-checkbox"]').forEach(cb => {
    cb.checked = followerIds.includes(cb.value);
  });

  // Tracks
  const container = document.getElementById('playlist-tracks-container');
  container.innerHTML = '';
  playlistTrackCount = 0;

  if (playlist.tracks && playlist.tracks.length > 0) {
    playlist.tracks.forEach(track => {
      playlistTrackCount++;
      const rowId = playlistTrackCount;
      const row = document.createElement('div');
      row.className = 'track-row playlist-track';
      row.id = `playlist-track-row-${rowId}`;

      let albumsOptions = cachedAlbums.map(a =>
        `<option value="${a._id}" ${String(a._id) === String(track.albumId?._id || track.albumId) ? 'selected' : ''}>${a.name}</option>`
      ).join('');
      if (albumsOptions === '') albumsOptions = '<option value="">Cadastre álbuns antes</option>';

      // Opções de faixas do álbum selecionado
      const albumId = track.albumId?._id || track.albumId;
      const album = cachedAlbums.find(a => String(a._id) === String(albumId));
      let tracksOptions = '<option value="">Selecione a música...</option>';
      if (album && album.tracks) {
        tracksOptions = album.tracks.map(t =>
          `<option value="${t._id}" ${String(t._id) === String(track.songId?._id || track.songId) ? 'selected' : ''}>${t.title}</option>`
        ).join('');
      }

      row.innerHTML = `
        <select class="playlist-track-album" onchange="loadPlaylistTrackSongs(${rowId})" required>
          <option value="">Selecione o álbum...</option>
          ${albumsOptions}
        </select>
        <select class="playlist-track-song" required>
          ${tracksOptions}
        </select>
        <input type="number" class="playlist-track-order" placeholder="Ordem (ex: 1)" value="${track.order || rowId}" required>
        <button type="button" class="btn-danger btn-sm" onclick="removePlaylistTrackRow(${rowId})"><i data-lucide="x"></i></button>
      `;
      container.appendChild(row);
    });
  } else {
    addPlaylistTrackRow();
  }

  enterEditMode('playlists', id);
  document.getElementById('form-playlists').scrollIntoView({ behavior: 'smooth', block: 'start' });
  lucide.createIcons();
}

async function loadUsers() {
  const res = await fetch(apiUrl('/api/users'));
  cachedUsers = await res.json();

  // Popula seletor do dono da playlist
  const ownerSelect = document.getElementById('playlist-owner');
  if (ownerSelect) {
    ownerSelect.innerHTML = '<option value="">Selecione o criador...</option>';
    cachedUsers.forEach(user => {
      ownerSelect.innerHTML += `<option value="${user._id}">${user.name}</option>`;
    });
  }

  // Popula lista de seguidores da playlist
  const followersList = document.getElementById('playlist-followers-list');
  if (followersList) {
    if (cachedUsers.length === 0) {
      followersList.innerHTML = '<p class="empty-state-text">Cadastre usuários antes</p>';
    } else {
      followersList.innerHTML = cachedUsers.map(user => `
        <label class="selection-item">
          <input type="checkbox" name="playlist-follower-checkbox" value="${user._id}">
          <span>${user.name}</span>
        </label>
      `).join('');
    }
  }

  // Preenche a tabela de usuários na aba Users
  const tbody = document.getElementById('list-users');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (cachedUsers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state-text">Nenhum usuário cadastrado</td></tr>';
    return;
  }

  cachedUsers.forEach(user => {
    const img = user.profilePictureUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop';
    tbody.innerHTML += `
      <tr>
        <td><img src="${publicUrl(img)}" class="table-img" alt="${user.name}"></td>
        <td><strong>${user.name}</strong></td>
        <td>${user.email || '<span class="empty-state-text">Não informado</span>'}</td>
        <td>${user.description || '<span class="empty-state-text">Sem bio</span>'}</td>
        <td class="actions-cell">
          <button class="btn-edit" onclick="editUser('${user._id}')">
            <i data-lucide="pencil"></i>
          </button>
          <button class="btn-danger" onclick="deleteItem('users', '${user._id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

function editUser(id) {
  const user = cachedUsers.find(u => u._id === id);
  if (!user) return;
  document.getElementById('user-name').value = user.name || '';
  document.getElementById('user-email').value = user.email || '';
  document.getElementById('user-password').value = '';  // por segurança, não preenche a senha
  document.getElementById('user-picture').value = publicUrl(user.profilePictureUrl) || '';
  document.getElementById('user-bg').value = publicUrl(user.backgroundImageUrl) || '';
  document.getElementById('user-description').value = user.description || '';
  enterEditMode('users', id);
  document.getElementById('form-users').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Construtor de faixas na Playlist
let playlistTrackCount = 0;
function resetPlaylistTracksBuilder() {
  const container = document.getElementById('playlist-tracks-container');
  if (!container) return;
  container.innerHTML = '';
  playlistTrackCount = 0;
  addPlaylistTrackRow();
}

function addPlaylistTrackRow() {
  const container = document.getElementById('playlist-tracks-container');
  playlistTrackCount++;

  const row = document.createElement('div');
  row.className = 'track-row playlist-track';
  row.id = `playlist-track-row-${playlistTrackCount}`;

  let albumsOptions = cachedAlbums.map(a => `<option value="${a._id}">${a.name}</option>`).join('');
  if (albumsOptions === '') albumsOptions = '<option value="">Cadastre álbuns antes</option>';

  row.innerHTML = `
    <select class="playlist-track-album" onchange="loadPlaylistTrackSongs(${playlistTrackCount})" required>
      <option value="">Selecione o álbum...</option>
      ${albumsOptions}
    </select>
    <select class="playlist-track-song" required>
      <option value="">Selecione um álbum primeiro...</option>
    </select>
    <input type="number" class="playlist-track-order" placeholder="Ordem (ex: 1)" value="${playlistTrackCount}" required>
    <button type="button" class="btn-danger btn-sm" onclick="removePlaylistTrackRow(${playlistTrackCount})"><i data-lucide="x"></i></button>
  `;
  container.appendChild(row);
  lucide.createIcons();
}

function removePlaylistTrackRow(id) {
  const row = document.getElementById(`playlist-track-row-${id}`);
  if (row) row.remove();
}

function loadPlaylistTrackSongs(rowId) {
  const row = document.getElementById(`playlist-track-row-${rowId}`);
  if (!row) return;

  const albumSelect = row.querySelector('.playlist-track-album');
  const songSelect = row.querySelector('.playlist-track-song');
  const albumId = albumSelect.value;
  songSelect.innerHTML = '<option value="">Selecione a música...</option>';
  if (!albumId) return;

  const album = cachedAlbums.find(a => a._id === albumId);
  if (!album || !album.tracks) return;

  album.tracks.forEach(track => {
    songSelect.innerHTML += `<option value="${track._id}">${track.title}</option>`;
  });
}

// ==========================================
// SUBMISSIONS & ACTIONS
// ==========================================

async function handleFormSubmit(event, entity) {
  event.preventDefault();
  showAlert('Salvando...', 'success', 2000);

  const isEditing = !!editingState[entity];
  const editId = editingState[entity];

  let payload = {};

  try {
    if (entity === 'genres') {
      payload = { name: document.getElementById('genre-name').value };
    }
    else if (entity === 'artists') {
      payload = {
        name: document.getElementById('artist-name').value,
        description: document.getElementById('artist-description').value || null,
        imageUrl: document.getElementById('artist-image').value || null,
        backgroundImageUrl: document.getElementById('artist-bg-image').value || null
      };
    }
    else if (entity === 'bands') {
      const selectedMembers = [];
      document.querySelectorAll('input[name="band-member-checkbox"]:checked').forEach(cb => {
        selectedMembers.push({ artistId: cb.value, name: cb.getAttribute('data-name') });
      });
      payload = {
        name: document.getElementById('band-name').value,
        description: document.getElementById('band-description').value || null,
        imageUrl: document.getElementById('band-image').value || null,
        backgroundImageUrl: document.getElementById('band-bg-image').value || null,
        members: selectedMembers
      };
    }
    else if (entity === 'albums') {
      const creditType = document.getElementById('album-credit-type').value;
      const creditRef = document.getElementById('album-credit-ref').value;
      let creditName = '';
      if (creditType === 'artist') {
        const art = cachedArtists.find(a => a._id === creditRef);
        creditName = art ? art.name : '';
      } else {
        const band = cachedBands.find(b => b._id === creditRef);
        creditName = band ? band.name : '';
      }

      const tracks = [];
      const trackRows = document.querySelectorAll('#tracks-builder-container .track-row');
      trackRows.forEach((row, index) => {
        const title = row.querySelector('.track-title').value;
        const durationVal = row.querySelector('.track-duration').value || null;
        const genreId = row.querySelector('.track-genre').value;
        const songPathInput = row.querySelector('.track-song-path');
        const songPath = songPathInput ? songPathInput.value || null : null;
        tracks.push({ title, duration: durationVal, genreId, songPath, trackNumber: index + 1 });
      });

      payload = {
        name: document.getElementById('album-name').value,
        releaseDate: document.getElementById('album-date').value || null,
        coverImageUrl: document.getElementById('album-cover').value || null,
        credits: [{ type: creditType, refId: creditRef, name: creditName }],
        tracks
      };
    }
    else if (entity === 'playlists') {
      const selectedFollowers = [];
      document.querySelectorAll('input[name="playlist-follower-checkbox"]:checked').forEach(cb => {
        selectedFollowers.push(cb.value);
      });

      const tracks = [];
      const trackRows = document.querySelectorAll('#playlist-tracks-container .track-row');
      trackRows.forEach(row => {
        const songId = row.querySelector('.playlist-track-song').value;
        const albumId = row.querySelector('.playlist-track-album').value;
        const order = parseInt(row.querySelector('.playlist-track-order').value) || 0;
        if (songId && albumId) {
          tracks.push({ songId, albumId, order });
        }
      });

      payload = {
        name: document.getElementById('playlist-name').value,
        description: document.getElementById('playlist-description').value || null,
        imageUrl: document.getElementById('playlist-image').value || null,
        ownerId: document.getElementById('playlist-owner').value,
        followerIds: selectedFollowers,
        tracks
      };
    }
    else if (entity === 'users') {
      payload = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value || null,
        profilePictureUrl: document.getElementById('user-picture').value || null,
        backgroundImageUrl: document.getElementById('user-bg').value || null,
        description: document.getElementById('user-description').value || null
      };
      // Só inclui a senha se o campo foi preenchido (edição pode não alterar a senha)
      const pw = document.getElementById('user-password').value;
      if (pw) payload.passwordHash = pw;
    }

    const method = isEditing ? 'PUT' : 'POST';
    const url = isEditing ? apiUrl(`/api/${entity}/${editId}`) : apiUrl(`/api/${entity}`);

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Falha ao salvar dados.');
    }

    showAlert(isEditing ? 'Atualizado com sucesso!' : 'Salvo com sucesso!', 'success');

    // Sai do modo de edição e reseta o form
    if (isEditing) {
      cancelEdit(entity);
    } else {
      document.getElementById(`form-${entity}`).reset();
    }

    await fetchCurrentTab();

  } catch (error) {
    console.error(error);
    showAlert(`Erro: ${error.message}`, 'error');
  }
}

async function deleteItem(entity, id) {
  if (!confirm('Deseja realmente excluir este registro?')) return;
  try {
    const res = await fetch(apiUrl(`/api/${entity}/${id}`), { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha ao deletar.');
    }
    showAlert('Removido com sucesso!', 'success');
    await fetchCurrentTab();
  } catch (error) {
    console.error(error);
    showAlert(`Erro ao excluir: ${error.message}`, 'error');
  }
}

// ==========================================
// UPLOAD HELPER — Imagens (uploadAndFill)
// ==========================================

async function uploadAndFill(input, targetId) {
  if (!input.files || input.files.length === 0) return;

  const file = input.files[0];
  const urlInput = document.getElementById(targetId);
  const statusEl = document.getElementById(`status-${targetId}`);
  const label = input.closest('.btn-upload');

  if (statusEl) {
    statusEl.textContent = '⏳ Enviando...';
    statusEl.style.color = 'var(--color-primary-hover)';
  }
  if (label) label.classList.add('uploading');

  try {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(apiUrl('/api/upload'), { method: 'POST', body: formData });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha no upload');
    }

    const data = await res.json();
    if (urlInput) urlInput.value = publicUrl(data.url);

    if (statusEl) {
      statusEl.textContent = `✓ ${file.name}`;
      statusEl.style.color = 'var(--color-green)';
    }
  } catch (e) {
    console.error(e);
    if (statusEl) {
      statusEl.textContent = `✗ Erro: ${e.message}`;
      statusEl.style.color = 'var(--color-red)';
    }
  } finally {
    if (label) label.classList.remove('uploading');
    input.value = '';
  }
}

// 3. Helper de Alertas
function showAlert(message, type = 'success', duration = 4000) {
  const alertBox = document.getElementById('alert-box');
  alertBox.innerText = message;
  alertBox.className = `alert-box ${type}`;
  alertBox.classList.remove('hidden');

  if (duration > 0) {
    setTimeout(() => {
      alertBox.classList.add('hidden');
    }, duration);
  }
}
