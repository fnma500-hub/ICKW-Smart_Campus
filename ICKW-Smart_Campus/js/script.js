document.addEventListener('DOMContentLoaded', function () {

    /* ---------- Calculadora de subredes ---------- */
    function aEntero(ip) {
        var p = ip.trim().split('.');
        if (p.length !== 4) return null;
        var n = 0;
        for (var i = 0; i < 4; i++) {
            if (!/^\d{1,3}$/.test(p[i]) || +p[i] > 255) return null;
            n = n * 256 + (+p[i]);
        }
        return n >>> 0;
    }
    function aIP(n) {
        return [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join('.');
    }
    var calc = document.getElementById('calc');
    if (calc) {
        calc.addEventListener('submit', function (e) {
            e.preventDefault();
            var ip = aEntero(document.getElementById('ipIn').value);
            var pre = parseInt(document.getElementById('preIn').value, 10);
            var err = document.getElementById('calcErr');
            var res = document.getElementById('calcRes');
            if (ip === null || isNaN(pre) || pre < 0 || pre > 32) {
                err.textContent = 'Escribe una IPv4 válida (ej. 192.168.1.10) y un prefijo entre 0 y 32.';
                res.hidden = true;
                return;
            }
            err.textContent = '';
            var mask = pre === 0 ? 0 : (0xFFFFFFFF << (32 - pre)) >>> 0;
            var red = (ip & mask) >>> 0;
            var bc = (red | (~mask >>> 0)) >>> 0;
            var hosts = pre >= 31 ? (pre === 32 ? 1 : 2) : Math.pow(2, 32 - pre) - 2;
            var rango = pre >= 31 ? aIP(red) + ' – ' + aIP(bc) : aIP(red + 1) + ' – ' + aIP(bc - 1);
            document.getElementById('rMask').textContent = aIP(mask);
            document.getElementById('rRed').textContent = aIP(red);
            document.getElementById('rBc').textContent = aIP(bc);
            document.getElementById('rHosts').textContent = hosts.toLocaleString('es');
            document.getElementById('rRango').textContent = rango;
            var a = ip >>> 24, b = (ip >>> 16) & 255, tipo = 'Pública';
            if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) tipo = 'Privada (RFC 1918)';
            else if (a === 127) tipo = 'Loopback';
            else if (a === 169 && b === 254) tipo = 'APIPA (link-local)';
            document.getElementById('rTipo').textContent = tipo;
            res.hidden = false;
        });
    }

    /* ---------- Simulador de TTL ---------- */
    var nombres = ['PC0', 'Router A', 'Router B', 'Router C', 'Servidor'];
    var ruta = document.getElementById('ruta');
    var slider = document.getElementById('ttlIn');
    var timer = null;
    function pintar(estados, ttls) {
        ruta.innerHTML = '';
        nombres.forEach(function (n, i) {
            var d = document.createElement('div');
            d.className = 'node ' + (estados[i] || '');
            d.innerHTML = n + '<b>' + (ttls[i] === undefined ? '–' : 'TTL ' + ttls[i]) + '</b>';
            ruta.appendChild(d);
            if (i < nombres.length - 1) {
                var a = document.createElement('span');
                a.className = 'arrow'; a.textContent = '→';
                ruta.appendChild(a);
            }
        });
    }
    if (ruta) {
        document.getElementById('ttlVal').textContent = slider.value;
        slider.addEventListener('input', function () { document.getElementById('ttlVal').textContent = slider.value; });
        pintar([], []);
        document.getElementById('enviar').addEventListener('click', function () {
            clearInterval(timer);
            var msg = document.getElementById('simMsg');
            var ttl = parseInt(slider.value, 10), i = 0, estados = [], ttls = [];
            msg.textContent = ''; msg.style.color = '#fff';
            pintar([], []);
            timer = setInterval(function () {
                if (i > 0) ttl--;
                ttls[i] = ttl;
                if (ttl <= 0 && i < nombres.length - 1) {
                    estados[i] = 'muere';
                    pintar(estados, ttls);
                    msg.style.color = '#ff9d8f';
                    msg.textContent = nombres[i] + ' descartó el paquete (TTL = 0) y envió un ICMP "Tiempo excedido" a PC0.';
                    clearInterval(timer);
                    return;
                }
                estados[i] = 'pasa';
                pintar(estados, ttls);
                if (i === nombres.length - 1) {
                    msg.style.color = '#7be3b0';
                    msg.textContent = '¡Llegó al servidor con TTL ' + ttl + '! Cada router le restó 1 en el camino.';
                    clearInterval(timer);
                }
                i++;
            }, 650);
        });
    }

    /* ---------- Pestañas IPv4 / IPv6 ---------- */
    var tabs = document.querySelectorAll('.tab'), paneles = document.querySelectorAll('.panel');
    tabs.forEach(function (t) {
        t.addEventListener('click', function () {
            tabs.forEach(function (x) { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', x === t); });
            paneles.forEach(function (p) { p.classList.toggle('on', p.id === t.dataset.tab); });
        });
    });

    /* ---------- Índice lateral activo ---------- */
    var enlaces = document.querySelectorAll('.toc a');
    var secciones = Array.prototype.map.call(enlaces, function (a) { return document.querySelector(a.getAttribute('href')); });
    if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (en) {
                if (en.isIntersecting) {
                    enlaces.forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id); });
                }
            });
        }, { rootMargin: '-20% 0px -70% 0px' });
        secciones.forEach(function (s) { if (s) obs.observe(s); });
    }
});
