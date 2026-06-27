const API_URL = 'http://localhost:3001/api';

const endpoints = [
  '/genres',
  '/artists',
  '/bands',
  '/albums',
  '/playlists',
  '/users'
];

async function runTests() {
  console.log('=== Iniciando testes das rotas (GET) ===\n');

  for (const endpoint of endpoints) {
    try {
      console.log(`[TESTANDO] GET ${API_URL}${endpoint}`);
      const startTime = Date.now();
      
      const response = await fetch(`${API_URL}${endpoint}`);
      const endTime = Date.now();
      const timeTaken = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        const itemCount = Array.isArray(data) ? data.length : (data ? 1 : 0);
        console.log(`  ✅ SUCESSO (${response.status}) - Tempo: ${timeTaken}ms`);
        console.log(`  📦 Registros retornados: ${itemCount}\n`);
      } else {
        console.error(`  ❌ FALHA (${response.status}) - Erro na requisição`);
        const text = await response.text();
        console.error(`  📝 Detalhes: ${text}\n`);
      }
    } catch (error) {
      console.error(`  ❌ ERRO DE CONEXÃO ao acessar ${endpoint}`);
      console.error(`  📝 Detalhes: ${(error as Error).message}\n`);
    }
  }

  console.log('=== Testes finalizados ===');
}

runTests();
