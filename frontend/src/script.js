// Navegação entre abas
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// A API é acessada via /api — o Nginx faz proxy reverso para o backend,
// então o mesmo caminho funciona local (docker compose) e em produção
// (Kubernetes, atrás do Ingress).
const API_BASE = '/api';

async function carregarSkills() {
    const el = document.getElementById('skills-list');
    try {
        const res = await fetch(`${API_BASE}/skills`);
        const skills = await res.json();
        if (!skills.length) { el.innerHTML = '<p>Nenhuma skill cadastrada ainda.</p>'; return; }
        el.innerHTML = skills.map(s => `
            <div class="card">
                <h3>${escapeHtml(s.nome)}</h3>
                <p>${escapeHtml(s.categoria)}</p>
                <div class="skill-bar"><div class="skill-bar-fill" style="width:${s.nivel}%"></div></div>
            </div>
        `).join('');
    } catch (e) {
        el.innerHTML = '<p>Não foi possível carregar as skills agora.</p>';
    }
}

async function carregarProjetos() {
    const el = document.getElementById('projects-list');
    try {
        const res = await fetch(`${API_BASE}/projects`);
        const projetos = await res.json();
        if (!projetos.length) { el.innerHTML = '<p>Nenhum projeto cadastrado ainda.</p>'; return; }
        el.innerHTML = projetos.map(p => `
            <div class="card">
                <h3>${escapeHtml(p.titulo)}</h3>
                <p>${escapeHtml(p.descricao)}</p>
                <p><em>${escapeHtml(p.tecnologias)}</em></p>
                ${p.link ? `<p><a href="${escapeHtml(p.link)}" target="_blank">Ver projeto →</a></p>` : ''}
            </div>
        `).join('');
    } catch (e) {
        el.innerHTML = '<p>Não foi possível carregar os projetos agora.</p>';
    }
}

async function carregarArquitetura() {
    const el = document.getElementById('architecture-content');
    try {
        const res = await fetch(`${API_BASE}/architecture`);
        const arq = await res.json();
        el.innerHTML = `
            <p>${escapeHtml(arq.descricao)}</p>
            <h3>Componentes</h3>
            <div class="grid">
                ${arq.componentes.map(c => `
                    <div class="card">
                        <h3>${escapeHtml(c.nome)}</h3>
                        <p><strong>${escapeHtml(c.tecnologia)}</strong></p>
                        <p>${escapeHtml(c.papel)}</p>
                    </div>
                `).join('')}
            </div>
            <h3>Recursos de Kubernetes usados</h3>
            <pre>${arq.kubernetes.map(k => '• ' + k).join('\n')}</pre>
        `;
    } catch (e) {
        el.innerHTML = '<p>Não foi possível carregar a arquitetura agora.</p>';
    }
}

async function carregarGuestbook() {
    const el = document.getElementById('guestbook-list');
    try {
        const res = await fetch(`${API_BASE}/guestbook`);
        const entradas = await res.json();
        el.innerHTML = entradas.map(e => `
            <div class="gb-entry">
                <strong>${escapeHtml(e.nome)}</strong>
                <small>· ${new Date(e.criado_em).toLocaleString('pt-BR')}</small>
                <p>${escapeHtml(e.mensagem)}</p>
            </div>
        `).join('') || '<p>Seja o primeiro a deixar uma mensagem.</p>';
    } catch (e) {
        el.innerHTML = '<p>Não foi possível carregar o guestbook agora.</p>';
    }
}

document.getElementById('guestbook-form').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const nome = document.getElementById('gb-nome').value;
    const mensagem = document.getElementById('gb-mensagem').value;
    try {
        const res = await fetch(`${API_BASE}/guestbook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, mensagem }),
        });
        if (!res.ok) throw new Error('Falha ao enviar');
        document.getElementById('guestbook-form').reset();
        carregarGuestbook();
    } catch (e) {
        alert('Não foi possível enviar sua mensagem agora. Tente novamente.');
    }
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Carrega tudo ao abrir a página
carregarSkills();
carregarProjetos();
carregarArquitetura();
carregarGuestbook();
