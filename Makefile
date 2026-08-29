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

PKG_VERSION:=1.0.1
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Rizpedia <achmadrizkiramadhan0101@gmail.com>

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
