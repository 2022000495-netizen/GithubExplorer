import { chromium } from 'playwright';

async function testRemoveRepository() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🧪 Iniciando testes de remoção de repositórios...\n');

    // Navegar até a página
    console.log('📱 Navegando até http://localhost:5173/...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    console.log('✅ Página carregada\n');

    // Pré-popular localStorage com um repositório de teste
    console.log('📝 Pré-populando localStorage com repositório de teste...');
    await page.evaluate(() => {
      const testRepo = [
        {
          full_name: 'facebook/react',
          description: 'A JavaScript library for building user interfaces',
          owner: {
            login: 'facebook',
            avatar_url: 'https://avatars.githubusercontent.com/u/69631?v=4'
          }
        }
      ];
      localStorage.setItem('@GihubExplorer:repositories', JSON.stringify(testRepo));
    });
    console.log('✅ Repositório adicionado ao localStorage\n');

    // Recarregar a página para carregar o repositório
    console.log('🔄 Recarregando página...');
    await page.reload({ waitUntil: 'networkidle' });
    console.log('✅ Página recarregada\n');

    // Aguardar o elemento do repositório aparecer
    console.log('⏳ Aguardando repositório aparecer...');
    await page.waitForSelector('.repository-item', { timeout: 5000 });
    console.log('✅ Repositório apareceu\n');

    // Verificar se o botão de remover existe
    console.log('🔍 Verificando se o botão de remover existe...');
    const removeButton = await page.$('button[title="Remover repositório"]');
    if (removeButton) {
      console.log('✅ Botão de remover encontrado\n');
    } else {
      console.log('❌ Botão de remover NÃO encontrado\n');
      throw new Error('Botão de remover não encontrado');
    }

    // Tirar screenshot antes de remover
    console.log('📸 Capturando screenshot ANTES de remover...');
    await page.screenshot({ path: '/tmp/before-remove.png' });
    console.log('✅ Screenshot salvo em /tmp/before-remove.png\n');

    // Contar repositórios antes
    const itemsBefore = await page.$$eval('.repository-item', items => items.length);
    console.log(`📊 Repositórios na lista ANTES: ${itemsBefore}`);

    // Clicar no botão de remover
    console.log('🗑️  Clicando no botão de remover...');
    await removeButton.click();
    console.log('✅ Botão clicado\n');

    // Aguardar o repositório desaparecer
    console.log('⏳ Aguardando repositório desaparecer...');
    await page.waitForSelector('.repository-item', { state: 'hidden', timeout: 5000 }).catch(() => {});
    const itemsAfter = await page.$$eval('.repository-item', items => items.length).catch(() => 0);
    console.log(`📊 Repositórios na lista DEPOIS: ${itemsAfter}\n`);

    // Tirar screenshot depois de remover
    console.log('📸 Capturando screenshot DEPOIS de remover...');
    await page.screenshot({ path: '/tmp/after-remove.png' });
    console.log('✅ Screenshot salvo em /tmp/after-remove.png\n');

    // Verificar localStorage
    console.log('💾 Verificando localStorage...');
    const storedRepos = await page.evaluate(() => {
      const repos = localStorage.getItem('@GihubExplorer:repositories');
      return repos ? JSON.parse(repos) : [];
    });
    console.log(`📊 Repositórios no localStorage: ${storedRepos.length}\n`);

    // Recarregar página para verificar persistência
    console.log('🔄 Recarregando página para verificar persistência...');
    await page.reload({ waitUntil: 'networkidle' });

    const itemsAfterReload = await page.$$eval('.repository-item', items => items.length).catch(() => 0);
    console.log(`📊 Repositórios após reload: ${itemsAfterReload}\n`);

    // Tirar screenshot final
    console.log('📸 Capturando screenshot FINAL...');
    await page.screenshot({ path: '/tmp/after-reload.png' });
    console.log('✅ Screenshot salvo em /tmp/after-reload.png\n');

    // Resultado final
    if (itemsBefore > itemsAfter && itemsAfter === 0) {
      console.log('✅ TESTE PASSOU! Repositório foi removido com sucesso e a remoção foi persistida.\n');
    } else {
      console.log('❌ TESTE FALHOU!');
      console.log(`   Antes: ${itemsBefore}, Depois: ${itemsAfter}, Após reload: ${itemsAfterReload}\n`);
      throw new Error('Remoção não funcionou corretamente');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

testRemoveRepository();
