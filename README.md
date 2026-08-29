# luci-theme-opizwrt

A liquid-glass theme for OpenWrt's LuCI web interface, with a real dark mode
and a login page of its own.

![Light](docs/light.jpg)

<table>
<tr>
<td width="50%"><img src="docs/dark.jpg" alt="Dark mode"></td>
<td width="50%"><img src="docs/login.jpg" alt="Login page"></td>
</tr>
</table>

## The idea

**Glass is for chrome, never for content.**

The header, the sidebar and the login card float above the canvas and may be
blurred — they hold almost no data. Anything holding an IP address, a byte
counter or a table sits on a near-opaque surface instead.

That line matters on a router. Putting blur behind text makes data hazy and
forces the GPU to recomposite on every scroll, which a Cortex-A53 feels. Most
"glass" themes blur everything and end up foggy and slow; this one does not.

## What you get

- **A real dark mode**, not a filter — every colour is defined twice, so
  nothing is left dark-on-dark. Follows the system setting, with a toggle in
  the header that remembers your choice and is applied before first paint, so
  there is no white flash on load.
- **Its own login page.** A centred card, not the admin chrome with an empty
  sidebar around it.
- **Built for phones.** The sidebar becomes a drawer, tables become cards
  labelled from LuCI's own `data-title`, and tab strips scroll in one row
  instead of wrapping and clipping mid-word.
- **Data you can read.** Tabular numerals so columns stop shifting as values
  update, hairline row separators, monospace for addresses and counters.
- **Careful edges.** Selection, caret, scrollbars and focus rings are themed;
  `prefers-reduced-motion` is honoured; browsers without `backdrop-filter` get
  solid surfaces rather than unreadable transparency; printing drops the
  chrome.

## Requirements

- LuCI with **ucode** templates — OpenWrt **24.10 or newer**.
- Tested on **OpenWrt 25.12.5**.
- Prebuilt packages are `.apk`, so they need an apk-based OpenWrt (25.12+).
  On older releases, build from source.

The theme carries no architecture-specific code, so a single package works on
every target of the same OpenWrt release.

## Install

### From a release (no build needed)

```sh
wget -O /tmp/luci-theme-opizwrt.apk \
  https://github.com/rizkirmdhnnn/luci-theme-opizwrt/releases/latest/download/luci-theme-opizwrt.apk
apk add --allow-untrusted /tmp/luci-theme-opizwrt.apk
```

The package makes itself the active theme on install. Reload the page.

`-O` is not optional. OpenWrt's `wget` is `uclient-fetch`, which follows the
GitHub redirect and then names the file after the *redirected* URL — you end
up with a UUID and a query string instead of an `.apk`.

### From source

Clone into an OpenWrt build tree:

```sh
cd openwrt
git clone https://github.com/rizkirmdhnnn/luci-theme-opizwrt.git \
          package/luci-theme-opizwrt
make menuconfig     # LuCI -> Themes -> luci-theme-opizwrt
make package/luci-theme-opizwrt/compile V=s
```

## Switching back

Themes live in `luci.main.mediaurlbase`. From LuCI:
**System -> System -> Language and Style**. Or over SSH:

```sh
uci set luci.main.mediaurlbase=/luci-static/bootstrap
uci commit luci
```

**Switch away before uninstalling.** Removing the active theme leaves LuCI
with no templates to render, and the web interface stops loading until you set
`mediaurlbase` back over SSH.

```sh
uci set luci.main.mediaurlbase=/luci-static/bootstrap && uci commit luci
apk del luci-theme-opizwrt
```

## How it is put together

```
htdocs/luci-static/opizwrt/      cascade.css, logo.svg
htdocs/luci-static/resources/    menu-opizwrt.js
ucode/template/themes/opizwrt/   header.ut, footer.ut, sysauth.ut
root/etc/uci-defaults/           registers the theme on first boot
```

`cascade.css` is about 1,900 lines and is the whole stylesheet — LuCI ships no
base CSS, so a theme covers everything itself.

One part of it is deliberately inherited rather than rewritten: LuCI does not
use real `<table>` elements but `div`s turned into tables with `display`, and
`.cbi-dropdown` / `.cbi-dynlist` are hand-built widgets that depend on exact
`position`, `z-index` and `display` rules. That is behaviour, not taste.
Rewriting it would break every list in LuCI, so those rules are kept and
marked as such in the source. Everything else — roughly three quarters of the
file — is new.

`menu-opizwrt.js` is a readable fork of LuCI's menu module, with the sidebar
state moved from inline styles to a class on `<body>` so CSS owns the
transition, and with the theme toggle wired in.

## Credits

Lineage: [luci-theme-bootstrap](https://github.com/openwrt/luci) (Steven
Barth, Jo-Philipp Wich, David Menting) ->
[luci-theme-material](https://github.com/LuttyYang/luci-theme-material) (Lutty
Yang) -> this theme.

Source comments are written in Indonesian.

## License

[Apache License 2.0](LICENSE), matching its upstream lineage.
