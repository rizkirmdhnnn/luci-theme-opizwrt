'use strict';
'require baseclass';
'require ui';

/* Modul menu untuk luci-theme-opizwrt.
 *
 * Turunan dari menu-material.js (Lutty Yang, Apache-2.0). Dua perubahan yang
 * disengaja terhadap aslinya:
 *
 *  1. Buka-tutup sidebar dipindah dari gaya sebaris ke kelas pada <body>.
 *     Aslinya menulis mainLeft.style.width = '0' langsung, sehingga CSS tidak
 *     punya cara mengambil alih transisi dan lebar sidebar tersebar di dua
 *     tempat. Kini JS hanya mengumumkan keadaan, CSS yang menggambarnya.
 *
 *  2. Tombol terang/gelap. Pilihannya disimpan di localStorage dan dibaca
 *     kembali oleh potongan skrip di <head> sebelum lukisan pertama.
 *
 * Copyright 2026 Rizpedia. Licensed to the public under the Apache License 2.0
 */

/* Di bawah lebar ini sidebar menjadi laci yang menimpa isi halaman.
   Nilainya harus sama dengan --bp-sidebar di cascade.css. */
var SIDEBAR_BREAKPOINT = 1152;

return baseclass.extend({
	__init__: function() {
		ui.menu.load().then(L.bind(this.render, this));
	},

	render: function(tree) {
		var node = tree,
		    url = '';

		this.renderModeMenu(node);

		if (L.env.dispatchpath.length >= 3) {
			for (var i = 0; i < 3 && node; i++) {
				node = node.children[L.env.dispatchpath[i]];
				url = url + (url ? '/' : '') + L.env.dispatchpath[i];
			}

			if (node)
				this.renderTabMenu(node, url);
		}

		document.querySelector('.showSide')
			.addEventListener('click', ui.createHandlerFn(this, 'handleSidebarToggle'));

		/* .showSide adalah <span>, jadi ia tidak menanggapi spasi/enter dengan
		   sendirinya seperti <button>. Tanpa ini menu tak terjangkau papan ketik. */
		document.querySelector('.showSide').addEventListener('keydown', L.bind(function(ev) {
			if (ev.key === 'Enter' || ev.key === ' ') {
				ev.preventDefault();
				this.handleSidebarToggle(ev);
			}
		}, this));

		document.querySelector('.darkMask')
			.addEventListener('click', ui.createHandlerFn(this, 'handleSidebarToggle'));

		this.setupThemeToggle();

		var loading = document.querySelector('.main > .loading');
		if (loading)
			loading.classList.add('done');

		if (window.innerWidth > SIDEBAR_BREAKPOINT)
			document.body.classList.add('sidebar-open');

		window.addEventListener('resize', L.bind(this.handleViewportChange, this));
	},

	/* --------------------------------------------------------------- tampilan */

	setupThemeToggle: function() {
		var btn = document.getElementById('theme-toggle');
		if (!btn)
			return;

		btn.addEventListener('click', function() {
			var root = document.documentElement,
			    /* Belum ada pilihan tersimpan: baca apa yang sedang tampak,
			       supaya klik pertama selalu membalik yang dilihat pengguna. */
			    current = root.getAttribute('data-theme') ||
			              (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
			    next = (current === 'dark') ? 'light' : 'dark';

			root.setAttribute('data-theme', next);

			try {
				localStorage.setItem('opizwrt-theme', next);
			} catch (e) {
				/* Mode penyamaran atau penyimpanan diblokir: tampilan tetap
				   berubah untuk sesi ini, hanya tidak diingat. */
			}
		});
	},

	/* ---------------------------------------------------------------- sidebar */

	handleSidebarToggle: function(ev) {
		document.body.classList.toggle('sidebar-open');
		if (ev)
			ev.preventDefault();
	},

	handleViewportChange: function() {
		/* Di layar lebar sidebar selalu ada; laci tidak boleh tertinggal
		   tertutup hanya karena jendela sempat disempitkan. */
		if (window.innerWidth > SIDEBAR_BREAKPOINT)
			document.body.classList.add('sidebar-open');
		else
			document.body.classList.remove('sidebar-open');
	},

	/* ------------------------------------------------------------------- menu */

	handleMenuExpand: function(ev) {
		var a = ev.target,
		    ul1 = a.parentNode,
		    ul2 = a.nextElementSibling;

		document.querySelectorAll('li.slide.active').forEach(function(li) {
			if (li !== a.parentNode || li == ul1) {
				li.classList.remove('active');
				li.childNodes[0].classList.remove('active');
			}
		});

		if (!ul2)
			return;

		if (ul2.parentNode.offsetLeft + ul2.offsetWidth <= ul1.offsetLeft + ul1.offsetWidth)
			ul2.classList.add('align-left');

		ul1.classList.add('active');
		a.classList.add('active');
		a.blur();

		ev.preventDefault();
		ev.stopPropagation();
	},

	renderMainMenu: function(tree, url, level) {
		var l = (level || 0) + 1,
		    ul = E('ul', { 'class': level ? 'slide-menu' : 'nav' }),
		    children = ui.menu.getChildren(tree);

		if (children.length == 0 || l > 2)
			return E([]);

		children.forEach(L.bind(function(child) {
			var submenu = this.renderMainMenu(child, url + '/' + child.name, l),
			    isActive = (L.env.dispatchpath[l] == child.name),
			    hasChildren = submenu.children.length;

			ul.appendChild(E('li', {
				'class': hasChildren ? 'slide' + (isActive ? ' active' : '')
				                     : (isActive ? 'active' : '')
			}, [
				E('a', {
					'href': hasChildren ? '#' : L.url(url, child.name),
					'class': hasChildren ? 'menu' + (isActive ? ' active' : '') : '',
					'click': hasChildren ? ui.createHandlerFn(this, 'handleMenuExpand') : '',
					'data-title': hasChildren ? '' : _(child.title)
				}, [ _(child.title) ]),
				submenu
			]));
		}, this));

		if (l == 1) {
			var container = document.querySelector('#mainmenu');
			container.appendChild(ul);
			container.style.display = '';
		}

		return ul;
	},

	renderModeMenu: function(tree) {
		var ul = document.querySelector('#modemenu'),
		    children = ui.menu.getChildren(tree);

		children.forEach(L.bind(function(child, index) {
			var isActive = L.env.requestpath.length ? child.name === L.env.requestpath[0]
			                                        : index === 0;

			ul.appendChild(E('li', {}, [
				E('a', {
					'href': L.url(child.name),
					'class': isActive ? 'active' : ''
				}, [ _(child.title) ])
			]));

			if (isActive)
				this.renderMainMenu(child, child.name);
		}, this));

		if (children.length > 1)
			ul.parentElement.style.display = '';
	},

	renderTabMenu: function(tree, url, level) {
		var container = document.querySelector('#tabmenu'),
		    l = (level || 0) + 1,
		    ul = E('ul', { 'class': 'tabs' }),
		    children = ui.menu.getChildren(tree),
		    activeNode = null;

		if (children.length == 0)
			return E([]);

		children.forEach(function(child) {
			var isActive = (L.env.dispatchpath[l + 2] == child.name);

			ul.appendChild(E('li', {
				'class': 'tabmenu-item-%s %s'.format(child.name, isActive ? 'active' : '')
			}, [
				E('a', { 'href': L.url(url, child.name) }, [ _(child.title) ])
			]));

			if (isActive)
				activeNode = child;
		});

		container.appendChild(ul);
		container.style.display = '';

		if (activeNode)
			container.appendChild(this.renderTabMenu(activeNode, url + '/' + activeNode.name, l));

		return ul;
	}
});
