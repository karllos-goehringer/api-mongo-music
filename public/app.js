// Configurações globais do Spotlike Admin
let currentTab = 'genres';
let cachedArtists = [];
let cachedBands = [];
let cachedGenres = [];
let cachedAlbums = [];
let cachedUsers = [];

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
  
  // Lucide Icons Render
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
      
      // Esconde todas as seções
      document.querySelectorAll('.tab-section').forEach(sec => sec.classList.add('hidden'));
      
      // Mostra a seção ativa
      currentTab = item.getAttribute('data-tab');
      document.getElementById(`tab-${currentTab}`).classList.remove('hidden');
      
      // Atualiza o título e subtítulo da página
      updateHeaderTexts();
      
      // Busca os dados da aba ativa
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
        // Carrega artistas primeiro, pois precisamos deles para vincular membros no formulário
        await loadArtists();
        await loadBands();
        break;
      case 'albums':
        // Precisamos carregar artistas, bandas e gêneros antes para montar o form
        await loadArtists();
        await loadBands();
        await loadGenres();
        await loadAlbums();
        // Inicializa o formulário de álbum com uma linha de música vazia
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
        <td>
          <button class="btn-danger" onclick="deleteItem('genres', '${genre._id}')">
            <i data-lucide="trash-2"></i> Excluir
          </button>
        </td>
      </tr>
    `;
  });
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
          <td><img src="${img}" class="table-img" alt="${artist.name}"></td>
          <td><strong>${artist.name}</strong></td>
          <td>${artist.description || '<span class="empty-state-text">Sem bio</span>'}</td>
          <td>
            <button class="btn-danger" onclick="deleteItem('artists', '${artist._id}')">
              <i data-lucide="trash-2"></i>
            </button>
          </td>
        </tr>
      `;
    });
  }
  
  // Atualiza também a lista de membros no form de bandas
  renderBandMembersSelection();
}

function renderBandMembersSelection() {
  const container = document.getElementById('band-members-list');
  if (!container) return;
  
  if (cachedArtists.length === 0) {
    container.innerHTML = '<p class="empty-state-text">Cadastre artistas primeiro</p>';
    return;
  }
  
  container.innerHTML = cachedArtists.map(artist => `
    <label class="selection-item">
      <input type="checkbox" name="band-member-checkbox" value="${artist._id}" data-name="${artist.name}">
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
        <td><img src="${img}" class="table-img" alt="${band.name}"></td>
        <td><strong>${band.name}</strong></td>
        <td>${membersList}</td>
        <td>
          <button class="btn-danger" onclick="deleteItem('bands', '${band._id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  });
}

async function loadAlbums() {
  const res = await fetch(apiUrl('/api/albums'));
  cachedAlbums = await res.json();
  
  // Atualiza lista do formulário de créditos
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
        <td><img src="${img}" class="table-img square" alt="${album.name}"></td>
        <td><strong>${album.name}</strong></td>
        <td>${release}</td>
        <td><code>${creditStr}</code></td>
        <td>${tracksCount} faixas</td>
        <td>
          <button class="btn-danger" onclick="deleteItem('albums', '${album._id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  });
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
  addTrackRow(); // Inicia com uma linha de música padrão
}

function addTrackRow() {
  const container = document.getElementById('tracks-builder-container');
  albumTrackCount++;
  const trackId = albumTrackCount;

  const row = document.createElement('div');
  row.className = 'track-row';
  row.id = `album-track-row-${trackId}`;

  let genresOptions = cachedGenres.map(g => `<option value="${g._id}">${g.name}</option>`).join('');
  if (genresOptions === '') {
    genresOptions = '<option value="">Cadastre gêneros antes</option>';
  }

  row.innerHTML = `
    <div class="track-num-label">#${trackId}</div>
    <input type="text" class="track-title" placeholder="Nome da Música" required>
    <input type="text" class="track-duration" placeholder="Duração (ex: 3:45)">
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
  const label = input.closest('.btn-upload');

  if (!input.files || input.files.length === 0) return;

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
        <td><img src="${img}" class="table-img square" alt="${playlist.name}"></td>
        <td><strong>${playlist.name}</strong></td>
        <td>${ownerName}</td>
        <td>${playlist.tracks.length} músicas</td>
        <td>${followersCount} seguidores</td>
        <td>
          <button class="btn-danger" onclick="deleteItem('playlists', '${playlist._id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  });
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
        <td><img src="${img}" class="table-img" alt="${user.name}"></td>
        <td><strong>${user.name}</strong></td>
        <td>${user.email || '<span class="empty-state-text">Não informado</span>'}</td>
        <td>${user.description || '<span class="empty-state-text">Sem bio</span>'}</td>
        <td>
          <button class="btn-danger" onclick="deleteItem('users', '${user._id}')">
            <i data-lucide="trash-2"></i>
          </button>
        </td>
      </tr>
    `;
  });
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
  if (albumsOptions === '') {
    albumsOptions = '<option value="">Cadastre álbuns antes</option>';
  }
  
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
        selectedMembers.push({
          artistId: cb.value,
          name: cb.getAttribute('data-name')
        });
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
      
      // Constrói array de tracks (com songPath do bucket local)
      const tracks = [];
      const trackRows = document.querySelectorAll('#tracks-builder-container .track-row');
      trackRows.forEach((row, index) => {
        const title = row.querySelector('.track-title').value;
        const duration = row.querySelector('.track-duration').value || null;
        const genreId = row.querySelector('.track-genre').value;
        const songPathInput = row.querySelector('.track-song-path');
        const songPath = songPathInput ? songPathInput.value || null : null;

        tracks.push({
          title,
          duration,
          genreId,
          songPath,
          trackNumber: index + 1
        });
      });
      
      payload = {
        name: document.getElementById('album-name').value,
        releaseDate: document.getElementById('album-date').value || null,
        coverImageUrl: document.getElementById('album-cover').value || null,
        credits: [{
          type: creditType,
          refId: creditRef,
          name: creditName
        }],
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
        passwordHash: document.getElementById('user-password').value, // Envia senha plana como hash para simplificar
        profilePictureUrl: document.getElementById('user-picture').value || null,
        backgroundImageUrl: document.getElementById('user-bg').value || null,
        description: document.getElementById('user-description').value || null
      };
    }
    
    // Faz a chamada POST
    const response = await fetch(apiUrl(`/api/${entity}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'Falha ao salvar dados.');
    }
    
    // Sucesso!
    showAlert('Salvo com sucesso!', 'success');
    
    // Limpa o formulário correspondente
    document.getElementById(`form-${entity}`).reset();
    
    // Recarrega os dados
    await fetchCurrentTab();
    
  } catch (error) {
    console.error(error);
    showAlert(`Erro: ${error.message}`, 'error');
  }
}

async function deleteItem(entity, id) {
  if (!confirm('Deseja realmente excluir este registro?')) return;
  
  try {
    const res = await fetch(apiUrl(`/api/${entity}/${id}`), {
      method: 'DELETE'
    });
    
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

/**
 * Faz upload de um arquivo de imagem e preenche o input de URL correspondente.
 * @param {HTMLInputElement} input - O input de arquivo que disparou o evento
 * @param {string} targetId - O id do input de URL que deve ser preenchido com a URL resultante
 */
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

    const res = await fetch(apiUrl('/api/upload'), {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Falha no upload');
    }

    const data = await res.json();

    // Preenche o campo URL com o caminho retornado pelo bucket
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
    // Reseta o input de arquivo para permitir re-envio do mesmo arquivo
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
