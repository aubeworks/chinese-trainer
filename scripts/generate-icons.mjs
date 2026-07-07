// PWA用アイコン(PNG)を依存ライブラリなしで生成するスクリプト
// 赤地に白の「中」をピクセル描画した正方形アイコンを public/ へ出力する
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

// CRC32 (PNGチャンク用)
const crcTable = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

function makePng(size) {
  const bg = [185, 28, 28] // #b91c1c
  const fg = [255, 255, 255]
  const px = new Uint8Array(size * size * 3)
  const put = (x, y, c) => {
    const i = (y * size + x) * 3
    px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) put(x, y, bg)

  // 「中」を比率ベースで描画
  const s = size
  const t = Math.max(3, Math.round(s * 0.07)) // 線の太さ
  const boxL = Math.round(s * 0.24), boxR = Math.round(s * 0.76)
  const boxT = Math.round(s * 0.34), boxB = Math.round(s * 0.62)
  const barL = Math.round(s * 0.5 - t / 2), barR = barL + t
  const barT = Math.round(s * 0.16), barB = Math.round(s * 0.84)
  const rect = (x0, y0, x1, y1) => {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) put(x, y, fg)
  }
  rect(boxL, boxT, boxR, boxT + t)       // 上辺
  rect(boxL, boxB - t, boxR, boxB)       // 下辺
  rect(boxL, boxT, boxL + t, boxB)       // 左辺
  rect(boxR - t, boxT, boxR, boxB)       // 右辺
  rect(barL, barT, barR, barB)           // 中央縦棒

  // スキャンライン化(各行の先頭にフィルタ0)
  const raw = Buffer.alloc(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    Buffer.from(px.buffer, y * size * 3, size * 3).copy(raw, y * (size * 3 + 1) + 1)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8  // bit depth
  ihdr[9] = 2  // color type RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ])
}

mkdirSync(join(root, 'public'), { recursive: true })
for (const size of [192, 512]) {
  writeFileSync(join(root, 'public', `icon-${size}.png`), makePng(size))
  console.log(`generated public/icon-${size}.png`)
}
