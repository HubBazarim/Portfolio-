/*
 * Portfólio · Victor Queiroz Bazarim
 * script.js: comportamento compartilhado por todas as páginas, sem dependências.
 *
 * Cada recurso só é ativado quando os elementos dele existem na página:
 *  - menu do celular (botão "Menu")
 *  - cabeçalho com sombra ao rolar e botão "voltar ao topo"
 *  - link ativo do menu conforme a seção visível (página inicial)
 *  - filtros de projetos e certificados (com contagem e ?filtro= na URL)
 *  - prévia do dashboard de vendas no card principal (abas "Por loja"/"Por pagamento")
 *  - barras dos gráficos que crescem ao aparecer na tela
 *  - ampliação de certificados (<dialog>)
 *  - robô: gaveta e aceno nos certificados, carimbo ao baixar um PDF
 *  - dashboards do Power BI carregados só quando o visitante pede (com o robô)
 *  - simulação do robô de cadastro, com dados fictícios
 *  - aviso quando um vídeo não pode ser reproduzido no navegador
 *  - botão "Copiar e-mail"
 *  - formulário de contato via EmailJS (carregado só quando o formulário é usado)
 *  - ano atual no rodapé
 *  - idioma (português/inglês) e tema (escuro/claro), salvos no navegador
 *  - movimento: circuito no topo, linha até o card de vendas, reações do robô
 */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : { matches: false };

  function $(selector, context) {
    return (context || document).querySelector(selector);
  }

  function $$(selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  }

  function onMediaChange(query, handler) {
    if (query.addEventListener) query.addEventListener('change', handler);
    else if (query.addListener) query.addListener(handler);
  }

  function store(key, value) {
    try { window.localStorage.setItem(key, value); } catch (error) { /* navegação privada */ }
  }

  function stored(key) {
    try { return window.localStorage.getItem(key); } catch (error) { return null; }
  }

  /* ------------------------------------------------------------------ */
  /* Idioma: português (padrão) e inglês                                 */
  /* O dicionário (js/i18n-en.js) usa o texto em português como chave.   */
  /* Textos montados pelo script passam por t()/tf() e são redesenhados  */
  /* quando o idioma muda (render/say).                                  */
  /* ------------------------------------------------------------------ */
  var LANG = 'pt';
  var DICT = window.I18N_EN || {};
  var rendered = [];

  function norm(text) {
    return String(text).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function t(pt) {
    if (LANG !== 'en') return pt;
    var en = DICT[norm(pt)];
    return en === undefined ? pt : en;
  }

  function tf(key, vars) {
    return t(key).replace(/\{(\w+)\}/g, function (match, name) {
      return vars && vars[name] !== undefined ? vars[name] : match;
    });
  }

  // Desenha o texto agora e de novo a cada troca de idioma
  function render(el, fn) {
    el.__render = fn;
    if (rendered.indexOf(el) === -1) rendered.push(el);
    fn();
  }

  function say(el, key, vars) {
    render(el, function () { el.textContent = key ? tf(key, vars) : ''; });
  }

  // Texto original (em português) do primeiro trecho de texto de um elemento
  function ptText(el) {
    for (var node = el.firstChild; node; node = node.nextSibling) {
      if (node.nodeType === 3 && node.nodeValue.trim()) return norm(node.__pt || node.nodeValue);
    }
    return norm(el.textContent);
  }

  var I18N_ATTRS = ['alt', 'title', 'aria-label', 'placeholder', 'data-title', 'data-stamp-title', 'data-embed-title', 'data-alt'];
  var I18N_SKIP = { SCRIPT: 1, STYLE: 1, CODE: 1, PRE: 1, NOSCRIPT: 1, TEMPLATE: 1, svg: 1 };

  // Números soltos (61,39% · 3.084.251) seguem o padrão do inglês (61.39% · 3,084,251)
  function localizeNumber(pt) {
    return pt.replace(/(\d)([.,])(?=\d)/g, function (match, digit, sep) {
      return digit + (sep === '.' ? ',' : '.');
    });
  }

  function translated(pt) {
    if (LANG !== 'en') return pt;
    var en = DICT[norm(pt)];
    if (en === undefined) {
      return !/[A-Za-zÀ-ú]/.test(pt) && /\d[.,]\d/.test(pt) ? localizeNumber(pt) : pt;
    }
    return pt.match(/^\s*/)[0] + en + pt.match(/\s*$/)[0];
  }

  function translatePage() {
    var walker = document.createTreeWalker(root, 4, {
      acceptNode: function (node) {
        for (var el = node.parentNode; el && el !== root; el = el.parentNode) {
          if (I18N_SKIP[el.nodeName] || (el.hasAttribute && el.hasAttribute('data-i18n-skip'))) return 2;
        }
        return 1;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (node.__pt === undefined) {
        if (!/[A-Za-zÀ-ú]/.test(node.nodeValue) && !/\d[.,]\d/.test(node.nodeValue)) return;
        node.__pt = node.nodeValue;
      }
      var value = translated(node.__pt);
      if (node.nodeValue !== value) node.nodeValue = value;
    });

    $$('[' + I18N_ATTRS.join('],[') + ']').forEach(function (el) {
      el.__ptAttrs = el.__ptAttrs || {};
      I18N_ATTRS.forEach(function (name) {
        if (!el.hasAttribute(name)) return;
        if (!(name in el.__ptAttrs)) el.__ptAttrs[name] = el.getAttribute(name);
        el.setAttribute(name, translated(el.__ptAttrs[name]));
      });
    });

    $$('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach(function (meta) {
      if (meta.__pt === undefined) meta.__pt = meta.getAttribute('content');
      meta.setAttribute('content', translated(meta.__pt));
    });
    var locale = $('meta[property="og:locale"]');
    if (locale) locale.setAttribute('content', LANG === 'en' ? 'en_US' : 'pt_BR');
  }

  function applyLanguage(lang) {
    LANG = lang === 'en' ? 'en' : 'pt';
    root.lang = LANG === 'en' ? 'en' : 'pt-BR';
    translatePage();
    rendered = rendered.filter(function (el) { return el.isConnected !== false; });
    rendered.forEach(function (el) { el.__render(); });
    root.classList.remove('i18n-pending');
    var event;
    try { event = new CustomEvent('langchange'); } catch (error) { event = null; }
    if (event) document.dispatchEvent(event);
  }

  /* Botão de idioma: mostra a bandeira e a sigla do idioma para o qual ele muda */
  function initLanguage() {
    var button = $('[data-lang-toggle]');
    var flag = button && $('[data-lang-flag]', button);
    var code = button && $('[data-lang-code]', button);
    var hint = button && $('[data-lang-hint]', button);

    function syncButton() {
      if (!button) return;
      var target = LANG === 'en' ? 'pt' : 'en';
      flag.setAttribute('src', target === 'en' ? 'img/flag-us.svg' : 'img/flag-br.svg');
      code.textContent = target.toUpperCase();
      code.setAttribute('lang', target === 'en' ? 'en' : 'pt-BR');
      hint.textContent = LANG === 'en' ? ': switch the site to Portuguese' : ': mudar o site para inglês';
    }

    if (button) {
      button.addEventListener('click', function () {
        var next = LANG === 'en' ? 'pt' : 'en';
        store('vb-idioma', next);
        applyLanguage(next);
        syncButton();
        // a bandeira ondula uma vez (com movimento reduzido, só troca)
        flag.classList.remove('is-waving');
        void flag.offsetWidth;
        flag.classList.add('is-waving');
        window.setTimeout(function () { flag.classList.remove('is-waving'); }, 900);
      });
    }

    applyLanguage(stored('vb-idioma') === 'en' ? 'en' : 'pt');
    syncButton();
  }

  /* ------------------------------------------------------------------ */
  /* Tema: escuro (padrão) e claro, com a lâmpada                        */
  /* ------------------------------------------------------------------ */
  function initTheme() {
    var button = $('[data-theme-toggle]');
    var meta = $('meta[name="theme-color"]');
    var timer = null;

    function isLight() {
      return root.getAttribute('data-theme') === 'light';
    }

    function sync() {
      if (button) button.setAttribute('aria-pressed', String(isLight()));
      if (meta) meta.setAttribute('content', isLight() ? '#fbfaf7' : '#14171c');
    }

    sync();
    if (!button) return;
    button.addEventListener('click', function () {
      var light = !isLight();
      if (light) root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
      store('vb-tema', light ? 'claro' : 'escuro');
      sync();
      // acende brevemente ao ir para o claro; apaga ao voltar para o escuro
      button.classList.remove('is-lighting');
      button.classList.remove('is-dimming');
      void button.offsetWidth;
      button.classList.add(light ? 'is-lighting' : 'is-dimming');
      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        button.classList.remove('is-lighting');
        button.classList.remove('is-dimming');
      }, 1000);
      var event;
      try { event = new CustomEvent('themechange'); } catch (error) { event = null; }
      if (event) document.dispatchEvent(event);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Menu do celular                                                     */
  /* ------------------------------------------------------------------ */
  function initMenu() {
    var toggle = $('[data-menu-toggle]');
    if (!toggle) return;
    var nav = document.getElementById(toggle.getAttribute('aria-controls'));
    var header = toggle.closest('.site-header');
    if (!nav || !header) return;

    function isOpen() {
      return toggle.getAttribute('aria-expanded') === 'true';
    }

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      header.classList.toggle('is-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(!isOpen());
    });

    // Fecha ao escolher um link, ao apertar Esc, ao clicar fora ou ao sair com Tab
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (isOpen() && !header.contains(event.target)) setOpen(false);
    });

    header.addEventListener('focusout', function (event) {
      if (isOpen() && event.relatedTarget && !header.contains(event.relatedTarget)) setOpen(false);
    });

    onMediaChange(window.matchMedia('(min-width: 60em)'), function (event) {
      if (event.matches) setOpen(false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Cabeçalho ao rolar e botão "voltar ao topo"                         */
  /* ------------------------------------------------------------------ */
  function initScrollState() {
    var header = $('.site-header');
    var toTop = $('[data-to-top]');
    if (!header && !toTop) return;
    var ticking = false;

    function update() {
      var y = window.scrollY || window.pageYOffset || 0;
      if (header) header.classList.toggle('is-scrolled', y > 8);
      if (toTop) toTop.classList.toggle('is-visible', y > 700);
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------ */
  /* Link ativo do menu conforme a seção visível (página inicial)        */
  /* ------------------------------------------------------------------ */
  function initScrollSpy() {
    // Só na página inicial: é a única com links de âncora no menu
    if (!$('.site-nav a[href^="#"]')) return;
    var links = $$('.site-nav a');
    var sections = $$('main section[id]');
    if (!links.length || !sections.length) return;

    // "#about" e "certificados.html" apontam para a mesma ideia de seção
    var linkFor = {};
    links.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      var corte = href.indexOf('#');
      var id = corte >= 0 ? href.slice(corte + 1) : href.replace(/\.html$/, '');
      if (id && !linkFor[id]) linkFor[id] = link;
    });

    var alvos = sections.filter(function (section) { return linkFor[section.id]; });
    if (!alvos.length) return;

    var atual = null;
    var ticking = false;

    function update() {
      ticking = false;
      // a seção em leitura é a última que já passou pelo primeiro terço da tela
      var marca = window.pageYOffset + window.innerHeight * 0.4;
      var escolhido = alvos[0];
      alvos.forEach(function (section) {
        if (section.getBoundingClientRect().top + window.pageYOffset <= marca) escolhido = section;
      });
      // no fim da página, o último item sempre ganha
      if (window.innerHeight + window.pageYOffset >= document.documentElement.scrollHeight - 4) {
        escolhido = alvos[alvos.length - 1];
      }
      if (escolhido === atual) return;
      atual = escolhido;
      links.forEach(function (link) {
        if (link === linkFor[escolhido.id]) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    update();
  }

  /* ------------------------------------------------------------------ */
  /* Filtros (projetos e certificados)                                   */
  /* ------------------------------------------------------------------ */
  function initFilters() {
    $$('[data-filter-controls]').forEach(function (controls) {
      var key = controls.getAttribute('data-filter-controls');
      var list = $('[data-filter-list="' + key + '"]');
      if (!list) return;

      var items = $$('[data-tags]', list);
      var buttons = $$('[data-filter]', controls);
      var status = $('[data-filter-status="' + key + '"]');
      var nouns = (controls.getAttribute('data-filter-noun') || 'item|itens').split('|');
      var current = { filter: 'todos', shown: 0, label: '' };
      var syncUrl = controls.hasAttribute('data-filter-url');

      function tagsOf(item) {
        return item.getAttribute('data-tags').split(/\s+/);
      }

      function matches(item, filter) {
        return filter === 'todos' || tagsOf(item).indexOf(filter) !== -1;
      }

      function noun(count) {
        return t(count === 1 ? nouns[0] : nouns[1]);
      }

      // Guarda o nome de cada filtro e mostra quantos itens ele tem
      buttons.forEach(function (button) {
        var filter = button.getAttribute('data-filter');
        var count = items.filter(function (item) { return matches(item, filter); }).length;
        button.setAttribute('data-label', button.textContent.trim());
        var badge = document.createElement('span');
        badge.className = 'chip__count';
        badge.textContent = String(count);
        button.appendChild(badge);
        if (!count) button.hidden = true;
      });

      function apply(filter, animate) {
        var shown = 0;
        items.forEach(function (item) {
          var ok = matches(item, filter);
          item.hidden = !ok;
          if (ok) {
            shown += 1;
            if (animate) {
              item.classList.remove('is-entering');
              void item.offsetWidth; // reinicia a animação
              item.classList.add('is-entering');
            }
          }
        });

        var activeButton = null;
        buttons.forEach(function (button) {
          var active = button.getAttribute('data-filter') === filter;
          button.setAttribute('aria-pressed', String(active));
          if (active) activeButton = button;
        });

        if (status) {
          render(status, function () {
            status.textContent = filter === 'todos'
              ? tf('Mostrando todos os {n} {noun}.', { n: items.length, noun: noun(items.length) })
              : tf('Mostrando {shown} de {total} {noun}: {label}.', {
                shown: shown, total: items.length, noun: noun(items.length),
                label: activeButton ? t(ptText(activeButton)) : ''
              });
          });
        }

        if (syncUrl && window.history && window.history.replaceState) {
          try {
            var url = new URL(window.location.href);
            if (filter === 'todos') url.searchParams.delete('filtro');
            else url.searchParams.set('filtro', filter);
            window.history.replaceState(null, '', url.href);
          } catch (error) {
            /* alguns navegadores bloqueiam isso ao abrir o arquivo localmente */
          }
        }
      }

      controls.addEventListener('click', function (event) {
        var button = event.target.closest('[data-filter]');
        if (!button) return;
        apply(button.getAttribute('data-filter'), !reduceMotion.matches);
      });

      // Filtro inicial vindo da URL, ex.: projeto1.html?filtro=powerbi
      var initial = 'todos';
      if (syncUrl) {
        var requested = new URLSearchParams(window.location.search).get('filtro');
        var valid = buttons.some(function (button) {
          return button.getAttribute('data-filter') === requested && !button.hidden;
        });
        if (valid) initial = requested;
      }
      apply(initial, false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Prévia do dashboard no card principal                               */
  /* Abas acessíveis: setas, Home e End trocam a visão; clicar ou tocar  */
  /* na imagem mostra a outra visão, sem sair do card.                   */
  /* ------------------------------------------------------------------ */
  function initPreviewTabs() {
    $$('[data-preview]').forEach(function (box) {
      var tabs = $$('[role="tab"]', box);
      var panels = tabs.map(function (tab) {
        return document.getElementById(tab.getAttribute('aria-controls'));
      });
      if (!tabs.length || panels.some(function (panel) { return !panel; })) return;

      var currentTab = -1;

      function select(index, moveFocus) {
        var direction = currentTab < 0 || index === currentTab ? '' : (index > currentTab ? 'slide-next' : 'slide-prev');
        currentTab = index;
        tabs.forEach(function (tab, i) {
          var active = i === index;
          panels[i].classList.remove('slide-next');
          panels[i].classList.remove('slide-prev');
          if (active && direction) {
            void panels[i].offsetWidth;
            panels[i].classList.add(direction);
          }
          tab.setAttribute('aria-selected', String(active));
          tab.tabIndex = active ? 0 : -1;
          panels[i].classList.toggle('is-active', active);
        });
        if (moveFocus) tabs[index].focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () {
          select(i, false);
        });

        tab.addEventListener('keydown', function (event) {
          var target = null;
          if (event.key === 'ArrowRight') target = (i + 1) % tabs.length;
          else if (event.key === 'ArrowLeft') target = (i - 1 + tabs.length) % tabs.length;
          else if (event.key === 'Home') target = 0;
          else if (event.key === 'End') target = tabs.length - 1;
          if (target === null) return;
          event.preventDefault();
          select(target, true);
        });
      });

      panels.forEach(function (panel, i) {
        var img = $('img', panel);
        if (!img) return;
        img.addEventListener('click', function () {
          select((i + 1) % tabs.length, false);
        });
      });

      var initial = 0;
      tabs.forEach(function (tab, i) {
        if (tab.getAttribute('aria-selected') === 'true') initial = i;
      });
      select(initial, false);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Barras dos gráficos crescem ao entrar na tela                       */
  /* ------------------------------------------------------------------ */
  function initVizAnimation() {
    var blocks = $$('.viz-anim');
    if (!blocks.length) return;

    if (reduceMotion.matches || !('IntersectionObserver' in window)) {
      blocks.forEach(function (block) { block.classList.add('is-in'); });
      return;
    }

    // O que já está visível ao abrir a página aparece pronto (sem "piscar")
    var viewportHeight = window.innerHeight || root.clientHeight;
    blocks.forEach(function (block) {
      var rect = block.getBoundingClientRect();
      if (rect.top < viewportHeight && rect.bottom > 0) block.classList.add('is-in');
    });
    root.classList.add('can-animate');

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    blocks.forEach(function (block) {
      if (!block.classList.contains('is-in')) observer.observe(block);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Ampliação de certificados                                           */
  /* ------------------------------------------------------------------ */
  function initLightbox() {
    var dialog = $('[data-lightbox-dialog]');
    var triggers = $$('[data-lightbox]');
    // Sem suporte a <dialog>, o link continua abrindo a imagem normalmente
    if (!dialog || !triggers.length || typeof dialog.showModal !== 'function') return;

    var img = $('[data-lightbox-img]', dialog);
    var title = $('[data-lightbox-title]', dialog);
    var download = $('[data-lightbox-download]', dialog);
    var counter = $('[data-lightbox-counter]', dialog);
    var prev = $('[data-lightbox-prev]', dialog);
    var next = $('[data-lightbox-next]', dialog);
    var current = null;
    var opener = null;

    function visibleTriggers() {
      return triggers.filter(function (trigger) { return !trigger.closest('[hidden]'); });
    }

    function show(trigger) {
      current = trigger;
      img.src = trigger.getAttribute('href');
      img.alt = trigger.getAttribute('data-alt') || '';
      title.textContent = trigger.getAttribute('data-title') || '';
      var pdf = trigger.getAttribute('data-pdf');
      download.hidden = !pdf;
      if (pdf) download.setAttribute('href', pdf);
      download.setAttribute('data-stamp-title', trigger.getAttribute('data-title') || '');
      var list = visibleTriggers();
      counter.textContent = tf('{i} de {n}', { i: list.indexOf(trigger) + 1, n: list.length });
      prev.hidden = next.hidden = list.length < 2;
    }

    function step(direction) {
      var list = visibleTriggers();
      if (!list.length) return;
      var index = (list.indexOf(current) + direction + list.length) % list.length;
      show(list[index]);
    }

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        opener = trigger;
        show(trigger);
        dialog.showModal();
      });
    });

    prev.addEventListener('click', function () { step(-1); });
    next.addEventListener('click', function () { step(1); });

    $$('[data-lightbox-close]', dialog).forEach(function (button) {
      button.addEventListener('click', function () { dialog.close(); });
    });

    // Clique no fundo escuro fecha
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });

    dialog.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    });

    dialog.addEventListener('close', function () {
      img.removeAttribute('src');
      if (opener) opener.focus();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Robô na página de certificados                                      */
  /* Ao entrar na área visível: desliza até a gaveta, fecha, vira o visor */
  /* para os cards e acena. Ao clicar/tocar: aponta para os downloads.   */
  /* Com movimento reduzido: só mudanças de pose e de estado.            */
  /* ------------------------------------------------------------------ */
  function initDrawerScene() {
    var scene = $('[data-scene-drawer]');
    if (!scene) return;
    var button = scene.closest('[data-robot-btn]');
    var bubble = button ? $('[data-robot-bubble]', button) : null;
    var talkTimer = null;

    // Balão curto: aparece na chegada e ao passar o mouse/focar no robô
    function talk(ms) {
      if (!bubble) return;
      window.clearTimeout(talkTimer);
      button.classList.add('is-talking');
      if (ms) talkTimer = window.setTimeout(quiet, ms);
    }

    function quiet() {
      window.clearTimeout(talkTimer);
      if (button) button.classList.remove('is-talking');
    }
    var status = $('[data-robot-status]');
    var arrived = false;
    var timers = [];

    function later(fn, ms) { timers.push(window.setTimeout(fn, ms)); }

    function settle() {
      arrived = true;
      scene.classList.add('is-done');
      scene.classList.remove('is-playing');
    }

    function arrive() {
      if (arrived || scene.classList.contains('is-playing')) return;
      if (reduceMotion.matches) {
        // troca de estado sem deslocamento: já na gaveta, visor virado e pose de aceno
        settle();
        scene.classList.add('is-greeting');
        talk(4500);
        later(function () { scene.classList.remove('is-greeting'); }, 1500);
        return;
      }
      scene.classList.add('is-playing');
      later(function () { talk(4000); }, 1250);
      later(settle, 2350);
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          observer.disconnect();
          later(arrive, 250);
        }
      }, { threshold: 0.6 });
      observer.observe(scene);
    } else {
      arrive();
    }

    var showButtons = $$('[data-show-download]');
    if (button) showButtons.unshift(button);
    showButtons.forEach(function (trigger) {
      trigger.addEventListener('click', showWhere);
    });

    if (button) {
      button.addEventListener('pointerenter', function (event) { if (event.pointerType === 'mouse') talk(0); });
      button.addEventListener('pointerleave', function () { talkTimer = window.setTimeout(quiet, 600); });
      button.addEventListener('focus', function () { talk(0); });
      button.addEventListener('blur', quiet);
    }

    function showWhere() {
      quiet();
      if (!arrived) {
        timers.forEach(window.clearTimeout);
        timers = [];
        settle();
      }
      scene.classList.remove('is-greeting');
      scene.classList.remove('is-pointing');
      void scene.getBoundingClientRect();
      scene.classList.add('is-pointing');
      // leva ao primeiro certificado do filtro atual e destaca o "Baixar PDF" quando ele aparecer
      var first = $$('.cert-card').filter(function (card) { return !card.closest('[hidden]') && !card.hidden; })[0];
      var target = first ? $('[data-stamp]', first) : null;
      var hinted = target ? [target] : [];
      if (target) {
        first.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'center' });
        var hint = function () {
          target.classList.remove('is-hinted');
          void target.offsetWidth;
          target.classList.add('is-hinted');
          window.setTimeout(function () { target.classList.remove('is-hinted'); }, 1800);
          try { target.focus({ preventScroll: true }); } catch (error) { target.focus(); }
        };
        if ('IntersectionObserver' in window) {
          var seen = new IntersectionObserver(function (entries) {
            if (entries.some(function (entry) { return entry.isIntersecting; })) {
              seen.disconnect();
              window.setTimeout(hint, 150);
            }
          }, { threshold: 1 });
          seen.observe(target);
        } else {
          hint();
        }
      }
      if (status) {
        say(status, '');
        window.setTimeout(function () { say(status, 'Os PDFs ficam nos botões “Baixar PDF” de cada certificado.'); }, 60);
      }
      window.setTimeout(function () {
        scene.classList.remove('is-pointing');
      }, 1800);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Robô do Bazarim Score: diz os números da página, uma frase por vez  */
  /* As frases já estão no HTML (e por isso são traduzidas junto).       */
  /* ------------------------------------------------------------------ */
  function initRobotTalk() {
    var button = $('[data-robot-talk]');
    if (!button) return;
    var lines = $$('.robot-line', button);
    if (!lines.length) return;
    var scene = $('.scene', button);
    var index = 0;
    var timer = null;
    var pausa = reduceMotion.matches ? 4200 : 3200;

    function show(n) {
      lines.forEach(function (line, k) { line.classList.toggle('is-on', k === n); });
    }

    function next() {
      index += 1;
      if (index >= lines.length) {
        index = 0;
        button.classList.remove('is-talking');
        return;
      }
      show(index);
      timer = window.setTimeout(next, pausa);
    }

    function start() {
      window.clearTimeout(timer);
      index = 0;
      show(0);
      button.classList.add('is-talking');
      timer = window.setTimeout(next, pausa);
    }

    function stop() {
      window.clearTimeout(timer);
      button.classList.remove('is-talking');
    }

    button.addEventListener('pointerenter', function (event) { if (event.pointerType === 'mouse') start(); });
    button.addEventListener('pointerleave', stop);
    button.addEventListener('focus', start);
    button.addEventListener('blur', stop);
    button.addEventListener('click', start);

    function arrive() {
      if (scene) scene.classList.add('is-active');
      window.setTimeout(start, 400);
    }

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          observer.disconnect();
          arrive();
        }
      }, { threshold: 0.6 });
      observer.observe(button);
    } else {
      arrive();
    }
  }

  /* ------------------------------------------------------------------ */
  /* Olhos dos robôs seguem o ponteiro do mouse                          */
  /* Cada cena recebe --eye-x/--eye-y; o CSS move as pupilas dentro do   */
  /* visor. Só com mouse e só sem a preferência por movimento reduzido.  */
  /* ------------------------------------------------------------------ */
  function initEyes() {
    if (reduceMotion.matches) return;
    var frame = null;
    var px = 0;
    var py = 0;

    function update() {
      frame = null;
      $$('.scene').forEach(function (scene) {
        var face = $('.rb-face', scene);
        if (!face) return;
        var box = face.getBoundingClientRect();
        if (!box.width) return;
        var dx = px - (box.left + box.width / 2);
        var dy = py - (box.top + box.height / 2);
        var distance = Math.sqrt(dx * dx + dy * dy) || 1;
        var reach = Math.min(1, distance / 240); // perto do robô, o olhar anda menos
        scene.style.setProperty('--eye-x', (dx / distance * reach * 3).toFixed(2) + 'px');
        scene.style.setProperty('--eye-y', (dy / distance * reach * 1.7).toFixed(2) + 'px');
      });
    }

    document.addEventListener('pointermove', function (event) {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      px = event.clientX;
      py = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(update);
    }, { passive: true });
  }

  /* ------------------------------------------------------------------ */
  /* Circuito na grade atrás do retrato                                  */
  /* O traço se desenha uma vez; depois um pulso percorre o caminho e    */
  /* acende dois nós, com pausa entre as passagens. Fica parado quando a */
  /* abertura sai da tela.                                               */
  /* ------------------------------------------------------------------ */
  function initCircuit() {
    var svg = $('[data-circuit]');
    if (!svg) return;
    var photo = svg.closest('.portrait') || svg;
    var visible = true;

    // Recomeça a passagem do pulso (usado ao trocar o tema com a foto na tela)
    function replay() {
      if (!visible || reduceMotion.matches || !svg.getAnimations) return;
      svg.getAnimations({ subtree: true }).forEach(function (anim) {
        if (anim.animationName && anim.animationName.indexOf('circuit-') === 0) anim.currentTime = 350;
      });
    }

    document.addEventListener('themechange', replay);
    svg.classList.add('is-on');
    if (!('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      visible = entries.some(function (entry) { return entry.isIntersecting; });
      svg.classList.toggle('is-paused', !visible);
    }, { threshold: 0.25 }).observe(photo);
  }

  /* ------------------------------------------------------------------ */
  /* Linha que se desenha do título "Projetos" até o card de vendas       */
  /* ------------------------------------------------------------------ */
  function initLeadLine() {
    var svg = $('[data-lead-line]');
    if (!svg) return;
    var section = svg.parentNode;
    var title = $('h2', section);
    var card = $('.project-card--featured', section);
    var path = $('.lead-line__path', svg);
    var node = $('.lead-line__node', svg);
    var pulse = $('.lead-line__pulse', svg);
    if (!title || !card || !path || !node) return;

    // Quando o pulso chega, o card de vendas responde com um destaque breve
    function arrive() {
      window.setTimeout(function () {
        card.classList.add('is-arrived');
        window.setTimeout(function () { card.classList.remove('is-arrived'); }, 1400);
      }, reduceMotion.matches ? 0 : 1500);
    }

    function layout() {
      var visible = !card.hidden && card.offsetParent !== null;
      svg.classList.toggle('is-hidden', !visible);
      if (!visible) return;
      var s = section.getBoundingClientRect();
      var h = title.getBoundingClientRect();
      var c = card.getBoundingClientRect();
      var x0 = Math.round(h.left - s.left);
      var y0 = Math.round(h.top - s.top) + 1;
      var gx = Math.max(5, x0 - 14);
      var x1 = Math.round(c.left - s.left);
      var y1 = Math.round(c.top - s.top) + 30;
      svg.setAttribute('viewBox', '0 0 ' + Math.round(s.width) + ' ' + Math.round(s.height));
      path.setAttribute('d', 'M' + x0 + ' ' + y0 + 'H' + gx + 'V' + y1 + 'H' + x1);
      if (pulse) pulse.setAttribute('d', path.getAttribute('d'));
      node.setAttribute('cx', x1);
      node.setAttribute('cy', y1);
    }

    layout();
    if ('ResizeObserver' in window) new ResizeObserver(layout).observe(section);
    else window.addEventListener('resize', layout);
    document.addEventListener('langchange', layout);

    if (!('IntersectionObserver' in window)) {
      svg.classList.add('is-drawn');
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        observer.disconnect();
        layout();
        svg.classList.add('is-drawn');
        arrive();
      }
    }, { threshold: 0.15 });
    // observa o card (a seção inteira pode ser mais alta que a tela no celular)
    observer.observe(card);
  }

  /* ------------------------------------------------------------------ */
  /* Robô carimba uma folha ao lado de "Baixar PDF"                      */
  /* O download é o do próprio link (atributo download): nada é bloqueado; */
  /* a animação só acompanha o clique.                                   */
  /* ------------------------------------------------------------------ */
  function initStampDownloads() {
    var template = document.getElementById('tpl-stamp');
    var links = $$('[data-stamp]');
    if (!template || !links.length || !('content' in template)) return;
    var status = $('[data-download-status]');

    // O robô aparece ao passar o mouse (ou focar) em "Baixar PDF" e fica até o fim do
    // carimbo. Se o PDF abrir em outra aba, ele espera a pessoa voltar para sumir.
    function popFor(link) {
      var anchor = link.closest('.stamp-anchor') || link.parentNode;
      var pop = $('.stamp-pop', anchor);
      if (pop) {
        window.clearTimeout(pop.__timer);
        pop.classList.remove('is-leaving');
        return pop;
      }
      pop = document.createElement('span');
      pop.className = 'stamp-pop';
      pop.setAttribute('aria-hidden', 'true');
      pop.appendChild(template.content.cloneNode(true));
      // No lightbox a reação fica junto aos controles, sem cobrir o certificado:
      // à esquerda do botão; se o botão estiver numa linha própria (celular), à direita
      var foot = anchor.closest('.lightbox__foot');
      if (foot) {
        var wrapped = anchor.getBoundingClientRect().left - foot.getBoundingClientRect().left < 48;
        pop.classList.add(wrapped ? 'stamp-pop--side' : 'stamp-pop--before');
      }
      anchor.appendChild(pop);
      return pop;
    }

    function hide(pop, delay) {
      if (!pop) return;
      window.clearTimeout(pop.__timer);
      pop.__timer = window.setTimeout(function () {
        if (document.hidden) {
          // voltou de outra aba: mostra o resultado mais um pouco antes de sair
          document.addEventListener('visibilitychange', function back() {
            if (document.hidden) return;
            document.removeEventListener('visibilitychange', back);
            hide(pop, 1500);
          });
          return;
        }
        pop.classList.add('is-leaving');
        pop.__timer = window.setTimeout(function () { pop.remove(); }, 260);
      }, delay);
    }

    links.forEach(function (link) {
      function preview(event) {
        if (event && event.pointerType && event.pointerType !== 'mouse') return;
        var pop = popFor(link);
        if (!pop.__stamping) window.clearTimeout(pop.__timer);
      }

      function leave() {
        var pop = $('.stamp-pop', link.closest('.stamp-anchor') || link.parentNode);
        if (pop && !pop.__stamping) hide(pop, 350);
      }

      link.addEventListener('pointerenter', preview);
      link.addEventListener('focus', function () { preview(null); });
      link.addEventListener('pointerleave', leave);
      link.addEventListener('blur', leave);

      link.addEventListener('click', function () {
        var pop = popFor(link);
        var scene = $('.scene', pop);
        pop.__stamping = true;
        if (scene) {
          scene.classList.remove('is-playing');
          void scene.getBoundingClientRect();
          scene.classList.add('is-playing');
        }
        window.setTimeout(function () { pop.__stamping = false; }, 1400);
        hide(pop, 3200);

        if (status) {
          var title = link.getAttribute('data-stamp-title') || '';
          say(status, '');
          window.setTimeout(function () {
            if (title) say(status, 'Download do PDF iniciado: {title}.', { title: title });
            else say(status, 'Download do PDF iniciado.');
          }, 60);
        }
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Dashboards do Power BI sob demanda                                  */
  /* O iframe começa a carregar no clique; enquanto isso o robô acende o  */
  /* visor e aponta para o minigráfico. O dashboard aparece quando o      */
  /* Power BI termina de carregar (ou após 12 s, o que vier primeiro).    */
  /* ------------------------------------------------------------------ */
  function initEmbeds() {
    $$('[data-embed-src]').forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        var box = trigger.closest('[data-embed]');
        if (!box) return; // sem a moldura, o link abre o Power BI em nova aba
        event.preventDefault();
        if (box.classList.contains('is-loading')) return;

        var placeholder = trigger.closest('.embed__placeholder');
        var scene = placeholder ? $('.scene', placeholder) : null;
        var status = placeholder ? $('[data-embed-status]', placeholder) : null;
        var started = Date.now();
        var minimum = reduceMotion.matches ? 0 : 1200;
        var revealed = false;
        var fallback = null;

        box.classList.add('is-loading');
        trigger.setAttribute('aria-disabled', 'true');
        // Troca só o texto visível do botão ("Carregar dashboard" -> "Carregando…")
        var labelNode = trigger.firstChild && trigger.firstChild.nodeType === 3 ? trigger.firstChild : null;
        if (labelNode) {
          render(trigger, function () { labelNode.nodeValue = t('Carregando…'); });
        }
        if (scene) {
          scene.classList.add('is-active');
          scene.classList.add('is-lit');
        }
        if (status) say(status, 'Carregando o dashboard do Power BI…');

        var iframe = document.createElement('iframe');
        iframe.title = trigger.getAttribute('data-embed-title') || t('Dashboard do Power BI');
        iframe.setAttribute('allowfullscreen', '');
        iframe.className = 'is-pending';
        iframe.setAttribute('tabindex', '-1');
        iframe.setAttribute('aria-hidden', 'true');

        function reveal() {
          if (revealed) return;
          revealed = true;
          window.clearTimeout(fallback);
          var moveFocus = document.activeElement === trigger;
          box.classList.remove('is-loading');
          iframe.classList.remove('is-pending');
          iframe.removeAttribute('tabindex');
          iframe.removeAttribute('aria-hidden');
          if (!reduceMotion.matches) iframe.classList.add('is-revealed');
          if (placeholder) placeholder.remove();
          if (moveFocus) iframe.focus();
        }

        iframe.addEventListener('load', function () {
          window.setTimeout(reveal, Math.max(0, minimum - (Date.now() - started)));
        });
        fallback = window.setTimeout(reveal, 12000);

        iframe.src = trigger.getAttribute('data-embed-src');
        box.appendChild(iframe);
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Simulação do robô de cadastro (dados fictícios)                     */
  /* O robô pega uma linha da planilha, leva até o formulário, preenche   */
  /* os campos e o registro aparece como concluído. Pode ser repetida.    */
  /* ------------------------------------------------------------------ */
  function initSimulation() {
    var sim = $('[data-sim]');
    if (!sim) return;
    var stage = $('[data-sim-stage]', sim);
    var sheet = $('[data-sim-sheet]', sim);
    var lane = $('[data-sim-lane]', sim);
    var form = $('[data-sim-form]', sim);
    var bot = $('[data-sim-bot]', sim);
    var chip = $('[data-sim-chip]', sim);
    var button = $('[data-sim-run]', sim);
    var status = $('[data-sim-status]', sim);
    var rows = $$('[data-sim-row]', sim);
    if (!stage || !sheet || !lane || !form || !bot || !button || !status || !rows.length) return;

    var fields = $$('[data-field]', form);
    var submit = $('[data-sim-submit]', form);
    var stamp = $('[data-sim-stamp]', form);
    var label = $('[data-sim-label]', button) || button;
    var next = 0;
    var running = false;
    var timers = [];

    function later(fn, ms) {
      timers.push(window.setTimeout(fn, ms));
    }

    function box(element) {
      return element.getBoundingClientRect();
    }

    function rowData(row) {
      try {
        return JSON.parse(row.getAttribute('data-sim-row')) || {};
      } catch (error) {
        return {};
      }
    }

    // Centraliza o robô no ponto (x, y) da tela, sem deixá-lo sair da faixa do meio
    function moveTo(x, y) {
      var s = box(stage);
      var l = box(lane);
      var w = bot.offsetWidth;
      var h = bot.offsetHeight;
      var minX = l.left - s.left;
      var maxX = Math.max(minX, l.right - s.left - w);
      var minY = l.top - s.top;
      var maxY = Math.max(minY, l.bottom - s.top - h);
      var left = Math.min(Math.max(x - s.left - w / 2, minX), maxX);
      var top = Math.min(Math.max(y - s.top - h / 2, minY), maxY);
      bot.style.setProperty('--x', Math.round(left) + 'px');
      bot.style.setProperty('--y', Math.round(top) + 'px');
    }

    function sideBySide() {
      return box(form).left >= box(sheet).right - 1;
    }

    function goHome() {
      var l = box(lane);
      moveTo(l.left + l.width / 2, l.top + l.height / 2);
    }

    function goToRow(row) {
      var l = box(lane);
      var r = box(row);
      if (sideBySide()) moveTo(l.left, r.top + r.height / 2);
      else moveTo(r.left + r.width * 0.3, l.top);
    }

    function goToForm() {
      var l = box(lane);
      var f = box(form);
      var first = box(fields[0] || form);
      if (sideBySide()) moveTo(l.right, first.top + first.height / 2);
      else moveTo(f.left + f.width * 0.62, l.bottom);
    }

    function setArm(state) {
      bot.classList.remove('is-grab');
      bot.classList.remove('is-carry');
      if (state) bot.classList.add(state);
    }

    function resetForm() {
      fields.forEach(function (field) {
        say(field, '');
        field.classList.remove('is-new');
      });
      if (submit) submit.classList.remove('is-pressed');
      if (stamp) {
        stamp.hidden = true;
        stamp.classList.remove('is-new');
      }
    }

    function fill(field, data) {
      var key = field.getAttribute('data-field');
      say(field, data[key] || '—');
    }

    function finish(row, data) {
      row.classList.remove('is-picked');
      var done = $('[data-sim-done]', row);
      if (done) done.hidden = false;
      if (stamp) {
        stamp.hidden = false;
        if (!reduceMotion.matches) stamp.classList.add('is-new');
      }
      say(status, 'Concluído: o produto {code} foi cadastrado no formulário de exemplo. Isto é uma simulação; nada foi enviado.', { code: data.codigo });
      say(label, 'Repetir simulação');
      button.removeAttribute('aria-disabled');
      running = false;
    }

    function run() {
      if (running) return;
      running = true;
      timers.forEach(window.clearTimeout);
      timers = [];

      // Depois da última linha, a planilha volta a ficar pendente e tudo recomeça
      if (next >= rows.length) {
        next = 0;
        rows.forEach(function (row) {
          var done = $('[data-sim-done]', row);
          if (done) done.hidden = true;
        });
      }
      var row = rows[next];
      var data = rowData(row);
      next += 1;

      resetForm();
      rows.forEach(function (item) { item.classList.remove('is-picked'); });
      row.classList.add('is-picked');
      button.setAttribute('aria-disabled', 'true');
      if (chip) chip.textContent = data.codigo || '';
      say(status, 'Simulação em andamento: o robô está levando o produto {code} da planilha para o formulário.', { code: data.codigo });

      if (reduceMotion.matches) {
        fields.forEach(function (field) { fill(field, data); });
        finish(row, data);
        return;
      }

      bot.classList.add('is-lit');
      goToRow(row);
      later(function () { setArm('is-grab'); }, 600);
      later(function () { if (chip) chip.classList.add('is-held'); }, 750);
      later(function () { setArm('is-carry'); }, 850);
      later(goToForm, 900);
      later(function () {
        if (chip) chip.classList.remove('is-held');
        setArm(null);
        fields.forEach(function (field, i) {
          later(function () {
            fill(field, data);
            field.classList.add('is-new');
            later(function () { field.classList.remove('is-new'); }, 300);
          }, i * 110);
        });
      }, 1700);

      var filled = 1700 + fields.length * 110 + 150;
      later(function () {
        if (submit) submit.classList.add('is-pressed');
      }, filled);
      later(function () {
        if (submit) submit.classList.remove('is-pressed');
        bot.classList.remove('is-lit');
        goHome();
        finish(row, data);
      }, filled + 320);
    }

    button.addEventListener('click', run);

    // Posição inicial (sem transição) e reposicionamento quando o layout muda
    goHome();
    window.requestAnimationFrame(function () {
      bot.classList.add('is-ready');
    });

    var resizeTimer = null;
    function rehome() {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (!running) goHome();
      }, 120);
    }

    if ('ResizeObserver' in window) new ResizeObserver(rehome).observe(stage);
    else window.addEventListener('resize', rehome);
  }

  /* ------------------------------------------------------------------ */
  /* Aviso quando o vídeo não roda neste navegador                       */
  /* ------------------------------------------------------------------ */
  function initVideos() {
    $$('video[data-fallback]').forEach(function (video) {
      var note = document.getElementById(video.getAttribute('data-fallback'));
      if (!note) return;
      var sources = $$('source', video);
      var last = sources[sources.length - 1];

      function showNote() {
        note.hidden = false;
      }

      if (last) last.addEventListener('error', showNote);
      video.addEventListener('error', showNote);
      // Se o erro aconteceu antes deste script rodar
      if (video.networkState === 3) showNote(); // NETWORK_NO_SOURCE
    });
  }

  /* ------------------------------------------------------------------ */
  /* Copiar e-mail                                                       */
  /* ------------------------------------------------------------------ */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (error) {
      ok = false;
    }
    area.remove();
    return ok;
  }

  function initCopy() {
    $$('[data-copy]').forEach(function (button) {
      var label = $('[data-copy-label]', button) || button;
      var initial = norm(label.textContent);
      var status = $('[data-copy-status]');
      var timer = null;

      button.addEventListener('click', function () {
        var text = button.getAttribute('data-copy');
        copyText(text).then(function (ok) {
          button.focus();
          say(label, ok ? 'E-mail copiado' : 'Copie manualmente');
          button.classList.toggle('is-done', ok);
          if (status) {
            if (ok) say(status, 'E-mail copiado para a área de transferência.');
            else say(status, 'Não foi possível copiar automaticamente. O e-mail é {email}.', { email: text });
          }
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            say(label, initial);
            button.classList.remove('is-done');
          }, 2500);
        });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Formulário de contato (EmailJS)                                     */
  /* ------------------------------------------------------------------ */
  // SDK oficial atual do EmailJS. A Public Key é pública por definição;
  // a Private Key NUNCA deve ser colocada neste arquivo.
  var EMAILJS_SDK = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = function () { reject(new Error('Falha ao carregar ' + src)); };
      document.head.appendChild(script);
    });
  }

  function withTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      var timer = window.setTimeout(function () { reject(new Error('Tempo esgotado')); }, ms);
      promise.then(function (value) {
        window.clearTimeout(timer);
        resolve(value);
      }, function (error) {
        window.clearTimeout(timer);
        reject(error);
      });
    });
  }

  function initContactForm() {
    var form = $('#contact-form');
    if (!form) return;

    var config = {
      publicKey: form.getAttribute('data-emailjs-key'),
      service: form.getAttribute('data-emailjs-service'),
      template: form.getAttribute('data-emailjs-template')
    };
    var fallbackEmail = form.getAttribute('data-fallback-email');
    var status = $('[data-form-status]', form);
    var submit = $('button[type="submit"]', form);
    var submitLabel = $('[data-submit-label]', submit) || submit;
    var submitText = norm(submitLabel.textContent);
    var fields = $$('input[required], textarea[required]', form);
    var honeypot = form.querySelector('[name="website"]');
    var sdkPromise = null;

    var messages = {
      name: 'Informe seu nome.',
      email: 'Informe seu e-mail.',
      message: 'Escreva sua mensagem.',
      emailFormat: 'Informe um e-mail válido, como nome@exemplo.com.'
    };

    function loadSdk() {
      if (!sdkPromise) {
        sdkPromise = loadScript(EMAILJS_SDK).then(function () {
          if (!window.emailjs) throw new Error('EmailJS indisponível');
          window.emailjs.init({
            publicKey: config.publicKey,
            blockHeadless: true,
            limitRate: { id: 'portfolio-contato', throttle: 10000 }
          });
        });
        sdkPromise.catch(function () { sdkPromise = null; }); // permite tentar de novo
      }
      return sdkPromise;
    }

    // Carrega o SDK só quando a pessoa começa a usar o formulário
    form.addEventListener('focusin', function () {
      loadSdk().catch(function () { /* o envio mostra o erro, se acontecer */ });
    }, { once: true });

    function setFieldError(field, text) {
      var error = document.getElementById(field.id + '-erro');
      field.setAttribute('aria-invalid', text ? 'true' : 'false');
      if (error) {
        say($('[data-error-text]', error), text || '');
        error.hidden = !text;
      }
    }

    function checkField(field) {
      var text = '';
      if (!field.value.trim()) text = messages[field.name] || 'Preencha este campo.';  // chaves em português; say() traduz
      else if (field.validity && field.validity.typeMismatch) text = messages.emailFormat;
      setFieldError(field, text);
      return !text;
    }

    fields.forEach(function (field) {
      field.addEventListener('blur', function () {
        if (field.value) checkField(field);
      });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') checkField(field);
      });
    });

    function setStatus(state, text, withEmail) {
      status.setAttribute('data-state', state);
      render(status, function () {
        status.textContent = t(text);
        if (withEmail && fallbackEmail) {
          var link = document.createElement('a');
          link.href = 'mailto:' + fallbackEmail;
          link.textContent = fallbackEmail;
          status.appendChild(document.createTextNode(' '));
          status.appendChild(link);
          status.appendChild(document.createTextNode('.'));
        }
      });
    }

    function setSending(sending) {
      submit.disabled = sending;
      if (sending) submit.setAttribute('aria-busy', 'true');
      else submit.removeAttribute('aria-busy');
      say(submitLabel, sending ? 'Enviando…' : submitText);
    }

    function fail() {
      setStatus('error', 'Não foi possível enviar agora. Tente de novo em instantes ou escreva direto para', true);
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var invalid = fields.filter(function (field) { return !checkField(field); });
      if (invalid.length) {
        setStatus('error', 'Revise os campos destacados.');
        invalid[0].focus();
        return;
      }

      // Robôs costumam preencher o campo invisível: nada é enviado
      if (honeypot && honeypot.value) {
        fail();
        return;
      }

      if (navigator.onLine === false) {
        setStatus('error', 'Você parece estar sem conexão. Verifique a internet ou escreva para', true);
        return;
      }

      setSending(true);
      setStatus('sending', 'Enviando sua mensagem…');

      withTimeout(loadSdk(), 12000)
        .then(function () {
          return withTimeout(window.emailjs.sendForm(config.service, config.template, form), 15000);
        })
        .then(function () {
          // Só confirma depois da resposta positiva do EmailJS
          form.reset();
          fields.forEach(function (field) { field.setAttribute('aria-invalid', 'false'); });
          setStatus('success', 'Mensagem enviada com sucesso. Obrigado pelo contato!');
        })
        .catch(fail)
        .then(function () { setSending(false); });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Ano atual no rodapé                                                 */
  /* ------------------------------------------------------------------ */
  function initYear() {
    var year = String(new Date().getFullYear());
    $$('[data-year]').forEach(function (element) {
      element.textContent = year;
    });
  }

  initTheme();
  initMenu();
  initScrollState();
  initScrollSpy();
  initFilters();
  initPreviewTabs();
  initVizAnimation();
  initLightbox();
  initDrawerScene();
  initStampDownloads();
  initEmbeds();
  initSimulation();
  initVideos();
  initCopy();
  initContactForm();
  initYear();
  initCircuit();
  initLeadLine();
  initEyes();
  initRobotTalk();
  initLanguage(); // por último: guarda os textos originais e aplica o idioma salvo
})();
