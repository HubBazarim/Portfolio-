/*
 * Portfólio · Victor Queiroz Bazarim
 * script.js: comportamento compartilhado por todas as páginas, sem dependências.
 *
 * Cada recurso só é ativado quando os elementos dele existem na página:
 *  - menu do celular (botão "Menu")
 *  - cabeçalho com sombra ao rolar e botão "voltar ao topo"
 *  - link ativo do menu conforme a seção visível (página inicial)
 *  - filtros de projetos e certificados (com contagem e ?filtro= na URL)
 *  - barras dos gráficos que crescem ao aparecer na tela
 *  - ampliação de certificados (<dialog>)
 *  - dashboards do Power BI carregados só quando o visitante pede
 *  - aviso quando um vídeo não pode ser reproduzido no navegador
 *  - botão "Copiar e-mail"
 *  - formulário de contato via EmailJS (carregado só quando o formulário é usado)
 *  - ano atual no rodapé
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
    var links = $$('.site-nav a[href^="#"]');
    var sections = $$('main section[id]');
    if (!links.length || !sections.length || !('IntersectionObserver' in window)) return;

    var linkFor = {};
    links.forEach(function (link) {
      linkFor[link.getAttribute('href').slice(1)] = link;
    });

    function setActive(id) {
      links.forEach(function (link) {
        if (linkFor[id] === link) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    // Uma faixa estreita no meio da tela decide qual seção está "em leitura"
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    sections.forEach(function (section) {
      observer.observe(section);
    });
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
      var syncUrl = controls.hasAttribute('data-filter-url');

      function tagsOf(item) {
        return item.getAttribute('data-tags').split(/\s+/);
      }

      function matches(item, filter) {
        return filter === 'todos' || tagsOf(item).indexOf(filter) !== -1;
      }

      function noun(count) {
        return count === 1 ? nouns[0] : nouns[1];
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

        var label = '';
        buttons.forEach(function (button) {
          var active = button.getAttribute('data-filter') === filter;
          button.setAttribute('aria-pressed', String(active));
          if (active) label = button.getAttribute('data-label');
        });

        if (status) {
          status.textContent = filter === 'todos'
            ? 'Mostrando todos os ' + items.length + ' ' + noun(items.length) + '.'
            : 'Mostrando ' + shown + ' de ' + items.length + ' ' + noun(items.length) + ': ' + label + '.';
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
      var list = visibleTriggers();
      counter.textContent = (list.indexOf(trigger) + 1) + ' de ' + list.length;
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
  /* Dashboards do Power BI sob demanda                                  */
  /* ------------------------------------------------------------------ */
  function initEmbeds() {
    $$('[data-embed-src]').forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        var box = trigger.closest('[data-embed]');
        if (!box) return; // sem a moldura, o link abre o Power BI em nova aba
        event.preventDefault();

        var iframe = document.createElement('iframe');
        iframe.src = trigger.getAttribute('data-embed-src');
        iframe.title = trigger.getAttribute('data-embed-title') || 'Dashboard do Power BI';
        iframe.setAttribute('allowfullscreen', '');
        box.classList.add('is-loading');
        iframe.addEventListener('load', function () {
          box.classList.remove('is-loading');
        });

        var placeholder = trigger.closest('.embed__placeholder');
        if (placeholder) placeholder.remove();
        box.appendChild(iframe);
        iframe.focus();
      });
    });
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
      var initial = label.textContent;
      var status = $('[data-copy-status]');
      var timer = null;

      button.addEventListener('click', function () {
        var text = button.getAttribute('data-copy');
        copyText(text).then(function (ok) {
          button.focus();
          label.textContent = ok ? 'E-mail copiado' : 'Copie manualmente';
          button.classList.toggle('is-done', ok);
          if (status) {
            status.textContent = ok
              ? 'E-mail copiado para a área de transferência.'
              : 'Não foi possível copiar automaticamente. O e-mail é ' + text + '.';
          }
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            label.textContent = initial;
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
    var submitText = submitLabel.textContent;
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
        $('[data-error-text]', error).textContent = text || '';
        error.hidden = !text;
      }
    }

    function checkField(field) {
      var text = '';
      if (!field.value.trim()) text = messages[field.name] || 'Preencha este campo.';
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
      status.textContent = text;
      if (withEmail && fallbackEmail) {
        var link = document.createElement('a');
        link.href = 'mailto:' + fallbackEmail;
        link.textContent = fallbackEmail;
        status.appendChild(document.createTextNode(' '));
        status.appendChild(link);
        status.appendChild(document.createTextNode('.'));
      }
    }

    function setSending(sending) {
      submit.disabled = sending;
      if (sending) submit.setAttribute('aria-busy', 'true');
      else submit.removeAttribute('aria-busy');
      submitLabel.textContent = sending ? 'Enviando…' : submitText;
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

  initMenu();
  initScrollState();
  initScrollSpy();
  initFilters();
  initVizAnimation();
  initLightbox();
  initEmbeds();
  initVideos();
  initCopy();
  initContactForm();
  initYear();
})();
