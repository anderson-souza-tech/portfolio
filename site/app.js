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
let projectKnowledge = [];

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
  .catch(() => {
    projectKnowledge = [];
  });

assistantForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const question = assistantInput?.value.trim();
  if (!question) return;

  addAssistantMessage(question, 'user');

  if (!projectKnowledge.length) {
    addAssistantMessage('A base local de projetos ainda está carregando. Tente novamente em instantes.', 'bot');
  } else {
    addAssistantMessage(answerQuestion(question), 'bot');
  }

  assistantInput.value = '';
  assistantInput.focus();
});

document.querySelectorAll('[data-question]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!assistantInput || !assistantForm) return;
    assistantInput.value = button.dataset.question || '';
    assistantForm.requestSubmit();
  });
});
