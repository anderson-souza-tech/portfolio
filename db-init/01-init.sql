CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    categoria VARCHAR(50) NOT NULL,
    nome VARCHAR(80) NOT NULL,
    nivel INT NOT NULL CHECK (nivel BETWEEN 0 AND 100)
);

CREATE TABLE IF NOT EXISTS projetos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(120) NOT NULL,
    descricao TEXT NOT NULL,
    tecnologias VARCHAR(200) NOT NULL,
    link VARCHAR(300)
);

CREATE TABLE IF NOT EXISTS guestbook (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(80) NOT NULL,
    mensagem VARCHAR(500) NOT NULL,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dados de exemplo — TODO: substituir pelos seus dados reais depois de
-- publicar. Deixados aqui para o site não ficar vazio na primeira execução.
INSERT INTO skills (categoria, nome, nivel) VALUES
    ('Suporte & Infra', 'Linux (administração de servidores)', 80),
    ('Infraestrutura', 'Windows Server', 75),
    ('Containers', 'Docker', 80),
    ('Containers', 'Kubernetes', 65),
    ('Monitoramento', 'Zabbix', 80),
    ('Monitoramento', 'Grafana', 70),
    ('Segurança', 'Resposta a incidentes', 70),
    ('Segurança', 'pfSense / Firewall', 75)
ON CONFLICT DO NOTHING;

INSERT INTO projetos (titulo, descricao, tecnologias, link) VALUES
    ('Homelab LAB-SECURITY', 'Ambiente pessoal para estudo de infraestrutura e segurança, com monitoramento, SIEM e testes de containerização.', 'Proxmox, Hyper-V, Zabbix, Grafana, Kali Linux, TrueNAS', NULL),
    ('Este portfólio', 'Site pessoal construído como demonstração técnica de Docker e Kubernetes — frontend, API e banco orquestrados como microsserviços.', 'Docker, Kubernetes, FastAPI, PostgreSQL, Nginx', NULL)
ON CONFLICT DO NOTHING;
