#!/bin/sh
#
# Membangun htdocs/luci-static/opizwrt/cascade.css dari src/cascade.css.
#
# Sumbernya ditulis untuk dibaca manusia: hampir 30% isinya komentar yang
# menjelaskan mengapa tiap perbaikan ada. Yang dikirim ke perangkat tidak
# perlu itu, dan buildroot OpenWrt tidak punya alat pemadat yang bisa
# dipercaya -- csstidy memotong berkas ini diam-diam sambil keluar dengan
# kode 0 (lihat Makefile). Jadi pemadatan dikerjakan di sini, dengan esbuild,
# dan hasilnya ikut di-commit supaya build image cukup meng-clone repo ini.
#
# Versi esbuild dipatok. Tanpa itu, pemutakhiran esbuild bisa mengubah
# keluaran dan membuat pemeriksaan drift di CI gagal tanpa ada yang menyunting
# apa pun.
set -eu

cd "$(dirname "$0")/.."

SUMBER=src/cascade.css
TUJUAN=htdocs/luci-static/opizwrt/cascade.css

npx --yes esbuild@0.24.0 "$SUMBER" --minify --outfile="$TUJUAN"

A=$(wc -c < "$SUMBER")
B=$(wc -c < "$TUJUAN")
awk -v a="$A" -v b="$B" 'BEGIN{printf "cascade.css: %d -> %d byte (-%d%%)\n", a, b, (a-b)*100/a}'
