/* Isolastech | comportamento do site: menu, filtro, calculadora, formulario e fotos. */
(function () {
  'use strict';

  var WA = document.body.getAttribute('data-wa');

  function linkWhats(msg) {
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
  }

  function num(v) {
    var arred = Math.round(v * 10) / 10;
    return arred.toLocaleString('pt-BR', { maximumFractionDigits: arred % 1 === 0 ? 0 : 1 });
  }

  /* ---------- menu do celular */
  var botaoMenu = document.querySelector('.menu-btn');
  var menu = document.getElementById('menu');
  if (botaoMenu && menu) {
    botaoMenu.addEventListener('click', function () {
      var aberto = menu.classList.toggle('aberto');
      botaoMenu.setAttribute('aria-expanded', aberto ? 'true' : 'false');
      botaoMenu.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    });
  }

  /* ---------- filtro do catalogo (aceita produtos.html#laje) */
  var filtros = document.querySelector('[data-filtros]');
  if (filtros) {
    var estado = { obra: '', familia: '' };
    var cards = Array.prototype.slice.call(document.querySelectorAll('[data-lista] .prod'));
    var total = document.querySelector('[data-total]');
    var vazio = document.querySelector('[data-vazio]');
    var chips = Array.prototype.slice.call(filtros.querySelectorAll('.chip'));

    var aplicar = function () {
      var n = 0;
      cards.forEach(function (c) {
        var okObra = !estado.obra || (' ' + c.getAttribute('data-obras') + ' ').indexOf(' ' + estado.obra + ' ') > -1;
        var okFam = !estado.familia || c.getAttribute('data-familia') === estado.familia;
        c.hidden = !(okObra && okFam);
        if (!c.hidden) n++;
      });
      chips.forEach(function (ch) {
        var ativo = estado[ch.getAttribute('data-filtro')] === ch.getAttribute('data-valor');
        ch.setAttribute('aria-pressed', ativo ? 'true' : 'false');
      });
      total.textContent = n === 1 ? 'Mostrando 1 produto' : 'Mostrando ' + n + ' produtos';
      vazio.hidden = n !== 0;
      var hash = estado.obra ? '#' + estado.obra : '';
      if (window.history && history.replaceState) {
        history.replaceState(null, '', location.pathname + location.search + hash);
      }
    };

    chips.forEach(function (ch) {
      ch.addEventListener('click', function () {
        estado[ch.getAttribute('data-filtro')] = ch.getAttribute('data-valor');
        aplicar();
      });
    });
    document.querySelector('[data-limpar]').addEventListener('click', function () {
      estado.obra = ''; estado.familia = ''; aplicar();
    });

    var lerHash = function () {
      var h = decodeURIComponent(location.hash.replace('#', ''));
      var existe = chips.some(function (ch) { return ch.getAttribute('data-filtro') === 'obra' && ch.getAttribute('data-valor') === h; });
      if (h && existe) { estado.obra = h; estado.familia = ''; aplicar(); }
    };
    window.addEventListener('hashchange', lerHash);
    lerHash();
  }

  /* ---------- calculadora de quantidade (mesma regra do gerar.py) */
  function unidEmb(q, u) {
    if (u === 'kg' && q < 1) return Math.round(q * 1000) + ' g';
    return num(q) + ' ' + u;
  }

  function sugestao(kmin, kmax, embs, u) {
    if (!embs.length) return 'Embalagens: consulte no orçamento.';
    embs = embs.slice().sort(function (a, b) { return b - a; });
    var maior = embs[0];
    if (kmax <= maior) {
      var cabe = embs.filter(function (x) { return x >= kmax; });
      return '1 embalagem de ' + unidEmb(Math.min.apply(null, cabe), u);
    }
    var n1 = Math.ceil(kmin / maior - 1e-9), n2 = Math.ceil(kmax / maior - 1e-9);
    return 'cerca de ' + (n1 === n2 ? n1 : n1 + ' a ' + n2) + ' embalagens de ' + unidEmb(maior, u);
  }

  function faixaKg(a, b) {
    return Math.abs(a - b) < 1e-9 ? num(a) + ' kg' : num(a) + ' a ' + num(b) + ' kg';
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-calc]'), function (calc) {
    var produto = calc.getAttribute('data-produto');
    var embs = (calc.getAttribute('data-emb') || '').split(',').filter(Boolean).map(parseFloat);
    var unid = calc.getAttribute('data-unidade-emb');
    var area = calc.querySelector('input[name="area"]');
    var sit = calc.querySelector('select[name="situacao"]');
    var saidaKg = calc.querySelector('[data-calc-kg]');
    var saidaEmb = calc.querySelector('[data-calc-emb]');
    var botao = calc.querySelector('[data-calc-wa]');
    var form = calc.querySelector('form');

    var atualizar = function () {
      var min = parseFloat(calc.getAttribute('data-min'));
      var max = parseFloat(calc.getAttribute('data-max'));
      var nomeSit = '';
      if (sit) {
        var op = sit.options[sit.selectedIndex];
        min = parseFloat(op.getAttribute('data-min'));
        max = parseFloat(op.getAttribute('data-max'));
        nomeSit = op.textContent.trim();
      }
      var m2 = parseFloat(String(area.value).replace(',', '.'));
      if (!(m2 > 0)) {
        saidaKg.textContent = 'Digite a área em m²';
        saidaEmb.textContent = '';
        botao.href = linkWhats('Olá! Vim pelo site da Isolastech e quero um orçamento de ' + produto + '.');
        return;
      }
      var kmin = min * m2, kmax = max * m2;
      saidaKg.textContent = faixaKg(kmin, kmax) + ' de ' + produto;
      saidaEmb.textContent = sugestao(kmin, kmax, embs, unid);
      var msg = 'Olá! Vim pelo site da Isolastech e quero um orçamento de ' + produto + ' para ' + num(m2) + ' m²' +
        (nomeSit ? ', ' + nomeSit.toLowerCase() : '') + ' (estimativa de ' + faixaKg(kmin, kmax) + ').';
      botao.href = linkWhats(msg);
    };

    area.addEventListener('input', atualizar);
    if (sit) sit.addEventListener('change', atualizar);
    form.addEventListener('submit', function (ev) { ev.preventDefault(); });
    atualizar();
  });

  /* ---------- formulario de contato vira mensagem no WhatsApp */
  var formWa = document.querySelector('[data-form-wa]');
  if (formWa) {
    var erro = formWa.querySelector('[data-form-erro]');
    formWa.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = function (n) { var el = formWa.elements[n]; return el ? String(el.value).trim() : ''; };
      if (!v('nome')) {
        erro.hidden = false;
        formWa.elements.nome.focus();
        return;
      }
      erro.hidden = true;
      var linhas = ['Olá! Vim pelo site da Isolastech e quero um orçamento.', 'Nome: ' + v('nome')];
      if (v('cidade')) linhas.push('Cidade: ' + v('cidade'));
      linhas.push('Produto: ' + (v('produto') || 'ainda não sei'));
      if (v('area')) linhas.push('Área: ' + v('area').replace('.', ',') + ' m²');
      if (v('mensagem')) linhas.push('Preciso resolver: ' + v('mensagem'));
      var url = linkWhats(linhas.join('\n'));
      formWa.setAttribute('data-ultimo-link', url);
      window.open(url, '_blank', 'noopener');
    });
  }

  /* ---------- fotos ampliadas na pagina de obras */
  var caixa = document.querySelector('[data-lightbox]');
  if (caixa && typeof caixa.showModal === 'function') {
    var foto = caixa.querySelector('[data-lightbox-img]');
    var leg = caixa.querySelector('[data-lightbox-leg]');
    Array.prototype.forEach.call(document.querySelectorAll('[data-ampliar]'), function (a) {
      a.addEventListener('click', function (ev) {
        ev.preventDefault();
        var mini = a.querySelector('img');
        foto.src = a.getAttribute('href');
        foto.alt = mini ? mini.alt : '';
        leg.textContent = mini ? mini.alt : '';
        caixa.showModal();
      });
    });
    caixa.querySelector('[data-lightbox-fechar]').addEventListener('click', function () { caixa.close(); });
    caixa.addEventListener('click', function (ev) { if (ev.target === caixa) caixa.close(); });
  }
})();
