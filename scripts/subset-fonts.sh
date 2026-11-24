#!/usr/bin/env bash
# Обрезает вариативные шрифты из fonts-src/ до латиницы, кириллицы и знаков,
# сохраняя все вариативные оси, и пишет WOFF2 в public/fonts/.
# Требует: pip install fonttools brotli
set -euo pipefail
cd "$(dirname "$0")/.."

UNICODES="U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,\
U+0400-045F,U+0490-0491,U+04D8-04D9,U+04E8-04E9,\
U+2010-2027,U+2030-203A,U+2044,U+20AC,U+20BD,U+2116,U+2122,\
U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD"

mkdir -p public/fonts
for name in RobotoFlex Literata Literata-Italic JetBrainsMono; do
  pyftsubset "fonts-src/$name.ttf" \
    --unicodes="$UNICODES" \
    --layout-features='*' \
    --flavor=woff2 \
    --output-file="public/fonts/$name.woff2"
done
ls -l public/fonts
du -cb public/fonts/*.woff2 | tail -1
