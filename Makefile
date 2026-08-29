#
# luci-theme-opizwrt — tema LuCI bergaya kaca cair
# Copyright 2026 Rizpedia
#
# Silsilah: luci-theme-bootstrap (Steven Barth, Jo-Philipp Wich, David
# Menting) -> luci-theme-material (Lutty Yang) -> tema ini. Lapisan
# strukturalnya -- tata letak berbasis div ber-display:table dan widget
# .cbi-dropdown/.cbi-dynlist milik LuCI -- diwarisi karena itu perilaku,
# bukan rasa. Seluruh lapisan visualnya ditulis ulang.
#
# Licensed to the public under the Apache License 2.0
#

include $(TOPDIR)/rules.mk

LUCI_TITLE:=Opizwrt theme (liquid glass)
LUCI_DEPENDS:=
LUCI_PKGARCH:=all

# Pemadatan dimatikan, dan bukan karena selera.
#
# luci.mk memadatkan CSS dengan csstidy lewat baris ini:
#
#   if csstidy "$$src" ... "$$src.o"; then mv "$$src.o" "$$src"; fi
#
# Ia hanya mengganti berkas bila csstidy keluar dengan kode 0 -- tapi csstidy
# keluar 0 MESKI keluarannya terpotong. csstidy adalah alat tua yang tidak
# mengenal CSS modern, dan pada berkas ini ia berhenti di sepertiga jalan:
# 80.613 byte sumber menjadi 10.959 byte terpasang, tanpa satu pun pesan
# galat. Tema pun terpasang dengan sepertiga aturannya hilang dan build tetap
# hijau. Lebih baik mengirim berkas utuh yang lebih besar daripada berkas
# separuh yang diam-diam rusak; uhttpd tetap mengirimkannya terkompresi.
LUCI_MINIFY_CSS:=0
LUCI_MINIFY_JS:=0

PKG_VERSION:=1.2.1
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Rizpedia <achmadrizkiramadhan0101@gmail.com>

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
