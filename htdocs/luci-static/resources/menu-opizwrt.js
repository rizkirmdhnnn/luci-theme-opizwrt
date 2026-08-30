'use strict';
'require baseclass';
'require ui';

/* Modul menu untuk luci-theme-opizwrt.
 *
 * Turunan dari menu-material.js (Lutty Yang, Apache-2.0). Empat perubahan
 * yang disengaja terhadap aslinya:
 *
 *  1. Buka-tutup sidebar dipindah dari gaya sebaris ke kelas pada <body>.
 *     Aslinya menulis mainLeft.style.width = '0' langsung, sehingga CSS tidak
 *     punya cara mengambil alih transisi dan lebar sidebar tersebar di dua
 *     tempat. Kini JS hanya mengumumkan keadaan, CSS yang menggambarnya.
 *
 *  2. Tombol terang/gelap. Pilihannya disimpan di localStorage dan dibaca
 *     kembali oleh potongan skrip di <head> sebelum lukisan pertama.
 *
 *  3. Ikon dan penanda kelompok. Setiap kelompok menu diberi atribut
 *     data-menu berisi segmen URL-nya -- bukan judulnya -- lalu CSS dan ikon
 *     dipetakan dari situ. Judul diterjemahkan mengikuti bahasa antarmuka;
 *     segmen URL tidak, jadi hanya itu yang aman dijadikan kunci.
 *
 *  4. Navigasi ponsel berupa bilah tab bawah, bukan laci. Di bawah 768px
 *     sidebar disembunyikan sepenuhnya dan digantikan empat tab kelompok;
 *     menyentuh tab memunculkan lembar bawah berisi anak-anaknya. Keduanya
 *     membaca pohon menu yang sama, jadi aplikasi LuCI yang dipasang
 *     kemudian muncul sendiri tanpa perlu disentuh di sini.
 *
 * Copyright 2026 Rizpedia. Licensed to the public under the Apache License 2.0
 */

/* Harus sama dengan --bp-laci dan --bp-tab di cascade.css. */
var AMBANG_LACI = 1152;   /* di atas ini sidebar selalu tampak */
var AMBANG_TAB  = 768;    /* di bawah ini bilah tab menggantikan sidebar */

/* Ikon digambar seadanya dan seragam: garis 1.75, kotak 24, tanpa isi.
   Dipetakan ke segmen URL LuCI. Kelompok yang tidak dikenali -- misalnya
   dari aplikasi yang dipasang kemudian -- memakai ikon cadangan, bukan
   tidak dapat ikon sama sekali, supaya barisnya tetap sejajar. */
var IKON = {
	status:   '<path d="M3.5 13a8.5 8.5 0 0 1 17 0"/><path d="M12 13l4.2-3.4"/><circle cx="12" cy="13" r="1.2" fill="currentColor" stroke="none"/>',
	system:   '<circle cx="12" cy="12" r="3.1"/><path d="M12 2.6v3M12 18.4v3M21.4 12h-3M5.6 12h-3M18.6 5.4l-2.1 2.1M7.5 16.5l-2.1 2.1M18.6 18.6l-2.1-2.1M7.5 7.5L5.4 5.4"/>',
	services: '<path d="M12 3.2 20.5 8 12 12.8 3.5 8z"/><path d="M3.5 12 12 16.8 20.5 12"/><path d="M3.5 16 12 20.8 20.5 16"/>',
	network:  '<path d="M7.5 3.5v13"/><path d="M4 13l3.5 3.5L11 13"/><path d="M16.5 20.5v-13"/><path d="M13 11l3.5-3.5L20 11"/>',
	vpn:      '<rect x="4" y="10.5" width="16" height="9.5" rx="2"/><path d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9"/>',
	logout:   '<path d="M15 4.5h3.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H15"/><path d="M10.5 15.5 6 12l4.5-3.5"/><path d="M6 12h9"/>',
	_lain:    '<circle cx="12" cy="12" r="7.4"/><path d="M12 8.6v4.2M12 15.6v.1"/>'
};

function ikonNode(nama, kelas) {
	var html = '<svg class="' + (kelas || 'mi') + '" viewBox="0 0 24 24" fill="none" ' +
		'stroke="currentColor" stroke-width="1.75" stroke-linecap="round" ' +
		'stroke-linejoin="round" aria-hidden="true">' + (IKON[nama] || IKON._lain) + '</svg>';
	return document.createRange().createContextualFragment(html).firstChild;
}

return baseclass.extend({
	__init__: function() {
		/* Dikumpulkan saat merender sidebar, lalu dipakai lagi oleh bilah tab
		   supaya keduanya tidak pernah berbeda isi. */
		this.kelompok = [];
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

		this.renderBilahTab();
		this.pasangPenandaSidebar();

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

		if (window.innerWidth > AMBANG_LACI)
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

	/* Penanda identitas di puncak sidebar dan label bagian di atas daftar.
	   Ditambahkan dari sini, bukan dari header.ut, karena #mainmenu baru ada
	   isinya setelah pohon menu selesai dimuat. */
	pasangPenandaSidebar: function() {
		var side = document.getElementById('mainmenu');
		if (!side || side.querySelector('.side-brand'))
			return;

		var media = (L.env.media || '/luci-static/opizwrt');

		var merek = E('div', { 'class': 'side-brand' }, [
			E('img', { 'src': media + '/logo.svg', 'alt': '', 'width': 24, 'height': 24 }),
			E('span', {}, [ 'Opizwrt' ])
		]);
		side.insertBefore(merek, side.firstChild);

		var nav = side.querySelector('.nav');
		if (nav)
			side.insertBefore(E('div', { 'class': 'side-sect' }, [ _('Menu') ]), nav);

		/* LuCI menaruh Log out sebagai butir biasa di ujung daftar. Dipindah
		   ke kaki sidebar dengan pembatasnya sendiri: ia tindakan yang
		   mengakhiri sesi, bukan salah satu tujuan yang setara. */
		if (!nav)
			return;

		var terakhir = nav.lastElementChild;
		if (terakhir && !terakhir.classList.contains('slide')) {
			var kaki = E('div', { 'class': 'side-foot' }, [
				E('div', { 'class': 'side-sect' }, [ _('Umum') ]),
				E('ul', { 'class': 'nav' }, [ terakhir ])
			]);
			var a = terakhir.querySelector('a');
			if (a && !a.querySelector('svg'))
				a.insertBefore(ikonNode('logout'), a.firstChild);
			side.appendChild(kaki);

			this.pasangLogoutHeader(a);
		}
	},

	/* Salinan Log out di header, khusus ponsel.

	   Memindahkan Log out ke kaki sidebar membuatnya lenyap di ponsel: di
	   sana sidebar disembunyikan seluruhnya dan digantikan bilah tab, yang
	   hanya memuat empat kelompok navigasi. Akibatnya tidak ada satu pun
	   jalan keluar dari sesi di layar kecil.

	   Diletakkan di header, bukan sebagai tab kelima, karena mengakhiri sesi
	   bukan tujuan navigasi -- dan menaruhnya sebaris dengan tab yang sering
	   disentuh mengundang salah tekan.

	   href disalin dari tautan milik LuCI, tidak ditulis ulang, supaya tetap
	   benar bila jalurnya berubah. Yang menentukan kapan ia tampak adalah
	   CSS, bukan JavaScript: di desktop kaki sidebar sudah memuatnya. */
	pasangLogoutHeader: function(sumber) {
		var wadah = document.querySelector('header .container');
		if (!wadah || !sumber || document.getElementById('opz-logout'))
			return;

		var tombol = E('a', {
			'id': 'opz-logout',
			'class': 'header-logout',
			'href': sumber.getAttribute('href'),
			'title': _('Log out'),
			'aria-label': _('Log out')
		}, [ ikonNode('logout') ]);

		var toggle = wadah.querySelector('.theme-toggle');
		if (toggle)
			toggle.parentNode.insertBefore(tombol, toggle.nextSibling);
		else
			wadah.appendChild(tombol);
	},

	/* ------------------------------------------------------- bilah tab ponsel */

	renderBilahTab: function() {
		if (!this.kelompok.length || document.getElementById('opz-tabbar'))
			return;

		var aktif = L.env.dispatchpath[1] || '';

		var bilah = E('nav', { 'class': 'tabbar', 'id': 'opz-tabbar', 'aria-label': _('Menu') },
			this.kelompok.map(L.bind(function(g) {
				var tab = E('button', {
					'type': 'button',
					'class': 'tab' + (g.name === aktif ? ' on' : ''),
					'data-menu': g.name,
					'aria-expanded': 'false'
				}, [ ikonNode(g.name, 'ti'), E('span', {}, [ g.title ]) ]);

				tab.addEventListener('click', L.bind(function() { this.bukaLembar(g); }, this));
				return tab;
			}, this)));

		var tirai = E('div', { 'class': 'navsheet-scrim', 'id': 'opz-scrim' });
		var lembar = E('div', { 'class': 'navsheet', 'id': 'opz-sheet', 'role': 'dialog', 'aria-modal': 'true' }, [
			E('div', { 'class': 'grip' }),
			E('h5', { 'class': 'navsheet-title' }),
			E('ul', { 'class': 'navsheet-list' })
		]);

		tirai.addEventListener('click', L.bind(this.tutupLembar, this));
		document.addEventListener('keydown', L.bind(function(ev) {
			if (ev.key === 'Escape') this.tutupLembar();
		}, this));

		document.body.appendChild(bilah);
		document.body.appendChild(tirai);
		document.body.appendChild(lembar);
	},

	bukaLembar: function(g) {
		var lembar = document.getElementById('opz-sheet');
		if (!lembar)
			return;

		var terbuka = document.body.classList.contains('navsheet-open'),
		    samaDenganYangTampil = lembar.getAttribute('data-menu') === g.name;

		/* Menyentuh tab yang lembarnya sedang terbuka berarti menutupnya --
		   perilaku yang dinantikan orang dari bilah tab. */
		if (terbuka && samaDenganYangTampil)
			return this.tutupLembar();

		lembar.setAttribute('data-menu', g.name);
		lembar.querySelector('.navsheet-title').textContent = g.title;

		var daftar = lembar.querySelector('.navsheet-list'),
		    halAktif = L.env.dispatchpath[2] || '';

		daftar.innerHTML = '';
		g.anak.forEach(function(a) {
			daftar.appendChild(E('li', { 'class': a.name === halAktif ? 'on' : '' }, [
				E('a', { 'href': a.url }, [ a.title ])
			]));
		});

		document.body.classList.add('navsheet-open');
		document.querySelectorAll('#opz-tabbar .tab').forEach(function(t) {
			t.setAttribute('aria-expanded', String(t.getAttribute('data-menu') === g.name));
		});
	},

	tutupLembar: function() {
		document.body.classList.remove('navsheet-open');
		document.querySelectorAll('#opz-tabbar .tab').forEach(function(t) {
			t.setAttribute('aria-expanded', 'false');
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
		if (window.innerWidth > AMBANG_LACI)
			document.body.classList.add('sidebar-open');
		else
			document.body.classList.remove('sidebar-open');

		/* Melewati ambang ke ranah bilah tab: lembar yang menggantung dari
		   ukuran sebelumnya harus ditutup, kalau tidak ia tetap menutupi isi
		   halaman padahal bilahnya sendiri sudah tidak tampak. */
		if (window.innerWidth > AMBANG_TAB)
			this.tutupLembar();
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

			var tautan = E('a', {
				'href': hasChildren ? '#' : L.url(url, child.name),
				'class': hasChildren ? 'menu' + (isActive ? ' active' : '') : '',
				'click': hasChildren ? ui.createHandlerFn(this, 'handleMenuExpand') : '',
				'data-title': hasChildren ? '' : _(child.title)
			}, [ E('span', {}, [ _(child.title) ]) ]);

			/* Ikon hanya untuk kelompok tingkat pertama. Memberi ikon pada
			   ketiga puluh satu anaknya justru meratakan hierarki, bukan
			   menegaskannya. */
			if (l == 1)
				tautan.insertBefore(ikonNode(child.name), tautan.firstChild);

			ul.appendChild(E('li', {
				'class': hasChildren ? 'slide' + (isActive ? ' active' : '')
				                     : (isActive ? 'active' : ''),
				'data-menu': l == 1 ? child.name : null
			}, [ tautan, submenu ]));

			/* Simpan untuk bilah tab -- sumbernya pohon yang sama, jadi
			   sidebar dan bilah tab mustahil berbeda isi. */
			if (l == 1 && hasChildren) {
				this.kelompok.push({
					name: child.name,
					title: _(child.title),
					anak: ui.menu.getChildren(child).map(function(c) {
						return { name: c.name, title: _(c.title), url: L.url(url, child.name, c.name) };
					})
				});
			}
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
