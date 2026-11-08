# **Victor Queiroz Bazarim** · Portfólio de Análise de Dados

Site de portfólio pessoal que apresenta minha atuação em **análise de dados, BI e automação de processos**: dashboards publicados em Power BI, uma análise exploratória de dados, automações em Python e os certificados que conquistei.

O site é **estático** (HTML, CSS e JavaScript puros, sem frameworks e sem etapa de build) e é publicado no **GitHub Pages**.

## Páginas

| Página | Conteúdo |
| --- | --- |
| `index.html` | Início, competências com evidências, projetos com filtros, certificados de dados, sobre e contato |
| `projeto1.html` | Todos os projetos com problema, dados, ferramentas e resultado (filtro também pela URL, ex.: `projeto1.html?filtro=powerbi`) |
| `dashboard.html` | Os 3 dashboards do Power BI, com os indicadores de cada um; o relatório carrega só quando o visitante pede |
| `certificados.html` | 14 certificados com filtro por área, ampliação e download do PDF |
| `datalhes-projetoanalise.html` | Estudo de caso: análise exploratória de 5.570 municípios |
| `detalhes-projeto.html` | Estudo de caso: robô de automação (PyAutoGUI + Pandas) |
| `detalhes-projetocert.html` | Estudo de caso: junção de PDFs (PyPDF2) |
| `Chat.html` | Estudo de caso: chat em tempo real (Flet) |
| `projeto2.html`, `projeto3.html`, `webdevelopment.html`, `backend.html` | Páginas antigas: só redirecionam para `projeto1.html` (podem ser apagadas) |

## Estrutura de pastas

```text
/
├── index.html e demais páginas .html
├── favicon.svg
├── css/style.css      → todo o visual (cores e tamanhos ficam no topo, em :root)
├── js/script.js       → todo o comportamento (menu, filtros, ampliação, formulário…)
├── img/               → foto, capas dos projetos e imagens dos certificados
├── pdfs/              → currículo e certificados em PDF
├── videos/            → vídeos de funcionamento dos projetos
└── scripts/           → scripts dos projetos em Python
```

Todos os caminhos são **relativos** (sem `/` no início), então o site funciona tanto em `usuario.github.io` quanto em `usuario.github.io/nome-do-repositorio/`.

## Tecnologias

- **HTML5** semântico, com navegação por teclado e textos alternativos
- **CSS3**: layout responsivo com Grid e Flexbox, variáveis CSS, foco visível e respeito a "reduzir movimento"
- **JavaScript** puro, sem bibliotecas
- **Google Fonts** (Poppins)
- **Ícones SVG** embutidos no HTML, no estilo [Feather Icons](https://feathericons.com) (licença MIT), sem fonte de ícones externa
- **EmailJS** para o formulário de contato (carregado só quando o formulário é usado)
- **Power BI** (publicar na web) para os dashboards

## Como atualizar

**Novo projeto:** copie um `<li class="project-card">` em `index.html` e um `<li class="case-row">` em `projeto1.html`. Em `data-tags`, use as palavras dos filtros (`analise`, `powerbi`, `python`, `automacao`); as contagens dos filtros se atualizam sozinhas. Para a página de detalhes, copie `detalhes-projeto.html` como modelo.

**Novo certificado:** copie um `<li class="cert-card">` em `certificados.html`, troque título, imagem e PDF e escolha a área em `data-tags` (`dados`, `programacao`, `gestao` ou `redes`). Se for de dados, inclua também na lista da seção "Certificados" do `index.html` e ajuste o número total no texto.

**Cores e fontes:** altere as variáveis no início de `css/style.css` (`--c-accent` é o ciano da marca).

## Testar localmente

Abra a pasta no VS Code e use a extensão **Live Server**, ou rode na pasta do projeto:

```bash
python -m http.server 8000
```

e acesse `http://localhost:8000`.

## Publicar no GitHub Pages

1. Envie as alterações para o repositório (`git add .`, `git commit -m "..."`, `git push`), ou use **Add file → Upload files** no site do GitHub.
2. Em **Settings → Pages**, a fonte deve continuar como a branch principal (pasta `/root`).
3. Aguarde alguns minutos e atualize o site com **Ctrl + F5** para não ver a versão em cache.

Atenção: o GitHub Pages diferencia **maiúsculas de minúsculas** e acentos nos nomes dos arquivos (`Chat.html` ≠ `chat.html`).

## Formulário de contato (EmailJS)

A configuração fica nos atributos `data-emailjs-*` do formulário em `index.html`. A **Public Key** do EmailJS é pública por definição; a **Private Key nunca deve ir para o código**. O site só mostra "Mensagem enviada" depois que o EmailJS confirma o envio; se algo falhar, o visitante vê o e-mail para contato direto.
