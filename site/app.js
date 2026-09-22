const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');

menuButton?.addEventListener('click', () => {
  const isOpen = menu.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
});

menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menu.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Abrir menu');
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));


const assistantForm = document.querySelector('#assistant-form');
const assistantInput = document.querySelector('#assistant-input');
const assistantLog = document.querySelector('#assistant-log');
const fallbackProjectKnowledge = [
  {
    id: 'portfolio',
    name: 'DevSystem Portfolio',
    status: 'Em produção',
    summary: 'Portfólio técnico da DevSystem publicado em VPS Ubuntu com deploy automatizado e HTTPS.',
    stack: ['HTML', 'CSS', 'JavaScript', 'Nginx', 'Docker', 'Docker Compose', 'Traefik', 'GitHub Actions', 'GitHub Container Registry'],
    architecture: 'Internet → Traefik → container Nginx → arquivos estáticos do portfólio.',
    cicd: 'Pull requests validam a aplicação. Após merge na main, o GitHub Actions constrói a imagem, publica no registry e atualiza o container na VPS.'
  },
  {
    id: 'financas',
    name: 'DevSystem Finanças',
    status: 'Em produção',
    summary: 'Aplicação financeira para controle de contas fixas e parceladas, favorecidos, filtros por período, dashboard, previsões e relatórios.',
    stack: ['PHP 8.3', 'Apache', 'MariaDB', 'Docker', 'Docker Compose', 'Traefik', 'GitHub Actions', 'GitHub Container Registry'],
    architecture: 'Internet → Traefik → PHP/Apache → rede interna Docker → MariaDB persistente.',
    cicd: 'A pipeline valida PHP e JavaScript, sobe um ambiente descartável com MariaDB, testa health check e banco, publica a imagem e faz deploy por SSH preservando banco e variáveis de ambiente.',
    harness: 'O AI Harness do DevSystem Finanças opera em modo somente leitura. Ele interpreta perguntas dentro de um contrato fechado, valida dimensões e filtros permitidos e usa consultas preparadas. A IA não recebe acesso para executar SQL livre nem alterar lançamentos.'
  }
];

let projectKnowledge = fallbackProjectKnowledge;

const normalizeText = (value = '') =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const addAssistantMessage = (text, role = 'bot') => {
  if (!assistantLog) return;
  const message = document.createElement('div');
  message.className = `assistant-message assistant-message-${role}`;
  message.textContent = text;
  assistantLog.appendChild(message);
  assistantLog.scrollTop = assistantLog.scrollHeight;
};

const answerQuestion = (question) => {
  const q = normalizeText(question);
  const portfolio = projectKnowledge.find((project) => project.id === 'portfolio');
  const financas = projectKnowledge.find((project) => project.id === 'financas');

  if (/harness|inteligencia artificial|\bia\b/.test(q)) {
    return financas?.harness || 'O AI Harness trabalha com informações autorizadas e operações previamente definidas.';
  }

  if (/ci.?cd|pipeline|deploy|github actions/.test(q)) {
    return projectKnowledge.map((project) => `${project.name}: ${project.cicd}`).join('\n\n');
  }

  if (/financas|financeiro|mariadb|php/.test(q)) {
    return financas ? `${financas.name}\n${financas.summary}\n\nStack: ${financas.stack.join(', ')}.\n\nArquitetura: ${financas.architecture}` : '';
  }

  if (/portfolio|site|nginx/.test(q)) {
    return portfolio ? `${portfolio.name}\n${portfolio.summary}\n\nStack: ${portfolio.stack.join(', ')}.\n\nArquitetura: ${portfolio.architecture}` : '';
  }

  if (/docker|traefik|tecnologia|stack/.test(q)) {
    const matches = projectKnowledge.filter((project) =>
      project.stack.some((technology) => q.includes(normalizeText(technology))) ||
      /docker|traefik|tecnologia|stack/.test(q)
    );
    return matches.map((project) => `${project.name}: ${project.stack.join(', ')}`).join('\n\n');
  }

  if (/projeto|produ[cç][aã]o|o que voce|o que tem/.test(q)) {
    return projectKnowledge.map((project) => `${project.name} — ${project.summary}`).join('\n\n');
  }

  return 'Posso responder sobre os projetos DevSystem, tecnologias, arquitetura, Docker, Traefik, CI/CD e o AI Harness. Tente uma das sugestões abaixo.';
};

fetch('data/projects.json')
  .then((response) => {
    if (!response.ok) throw new Error('Base de projetos indisponível');
    return response.json();
  })
  .then((data) => {
    projectKnowledge = data.projects || [];
  })
  .catch((error) => {
    console.warn('DevSystem AI: usando base local de fallback.', error);
    projectKnowledge = fallbackProjectKnowledge;
  });

assistantForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const question = assistantInput?.value.trim();
  if (!question) return;

  addAssistantMessage(question, 'user');

  try {
    const answer = answerQuestion(question);
    addAssistantMessage(answer || 'Não encontrei uma resposta para essa pergunta na base pública do portfólio.', 'bot');
  } catch (error) {
    console.error('DevSystem AI: erro ao gerar resposta.', error);
    addAssistantMessage('Ocorreu um erro ao processar a pergunta. Tente novamente ou use uma das sugestões abaixo.', 'bot');
  }

  if (assistantInput) {
    assistantInput.value = '';
    assistantInput.focus();
  }
});

document.querySelectorAll('[data-question]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!assistantInput || !assistantForm) return;
    assistantInput.value = button.dataset.question || '';
    assistantForm.requestSubmit();
  });
});
