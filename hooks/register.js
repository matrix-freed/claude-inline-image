// inline-image — show images inline in the Claude Code terminal transcript
//   dropped/pasted image + Enter  → drawn small right under its [Image #N] row in the transcript
//   /img <path>                   → drawn in a pane (type "/img " then drag a file)
//   /imgtest                      → bundled test PNG in a pane
const IMG_RE = /(?:^|[\s"'(\[])((?:~|\/)[^\s"'()\[\]]*?\.(?:png|jpe?g|gif|webp|heic|tiff?|bmp))(?=$|[\s"')\]])/gi
const INLINE = { columns: 32, rows: 9 }   // size under the [Image #N] row
let pane = { title: 'inline-image', lines: [], images: [] }
const byRow = new Map()      // session.append uuid -> images
const pending = []           // images not yet matched to a rendered row
const assigned = new Map()   // UserMessage requestId -> images (fallback by order)

function unescapePath(p) { return p.replace(/\\ /g, ' ').replace(/^["']|["']$/g, '') }

async function fileToPng($, src, home) {
  const path = src.startsWith('~/') ? home + src.slice(1) : src
  if (/\.png$/i.test(path)) return { file: path, note: 'png 원본' }
  const out = `/tmp/claude-inline-image/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`
  await $.process.run(['mkdir', '-p', '/tmp/claude-inline-image'], { timeoutMs: 5000 })
  const r = await $.process.run(['sips', '-s', 'format', 'png', path, '--out', out], { timeoutMs: 20000 })
  return r.exitCode === 0 ? { file: out, note: 'sips로 png 변환' } : { file: null, note: `sips 실패: ${(r.stderr || '').trim().slice(0, 100)}` }
}

async function b64ToPng($, mediaType, data) {
  if (mediaType === 'image/png') return { png: data, note: 'png base64' }
  const base = `/tmp/claude-inline-image/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  await $.process.run(['mkdir', '-p', '/tmp/claude-inline-image'], { timeoutMs: 5000 })
  await $.fs.write(`${base}.b64`, data)
  const ext = mediaType === 'image/jpeg' ? 'jpg' : mediaType === 'image/webp' ? 'webp' : mediaType === 'image/gif' ? 'gif' : 'bin'
  await $.process.run(['sh', '-c', `base64 -D -i "${base}.b64" -o "${base}.${ext}"`], { timeoutMs: 10000 })
  const r = await $.process.run(['sips', '-s', 'format', 'png', `${base}.${ext}`, '--out', `${base}.png`], { timeoutMs: 20000 })
  return r.exitCode === 0 ? { file: `${base}.png`, note: `${mediaType} → sips png` } : { file: null, note: `sips 실패: ${(r.stderr || '').trim().slice(0, 100)}` }
}

function imageEl(Image, im, columns, rows) {
  const src = im.png ? { png: im.png } : im.file ? { file: im.file, format: 'png' } : null
  if (!src) return null
  return Image({ key: im.file || ('b64-' + im.png.length), source: src, columns, rows, alt: `[이미지 미표시: ${im.label}]` })
}

async function showPane($, title, lines, paths) {
  const home = (await $.env.get('HOME')) ?? ''
  const images = []
  for (const raw of paths.slice(0, 4)) {
    const p = unescapePath(raw)
    const c = await fileToPng($, p, home)
    images.push({ label: p, file: c.file, note: c.note })
  }
  pane = { title, lines, images }
  await $.ui.open({ id: 'inline-image', focus: true, closeOnEscape: true })
  await $.ui.invalidate('ui.render')
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'img-test', description: 'Draw the bundled test image in a pane (checks terminal support)' })
    await $.command.register({ name: 'img', description: 'Draw a local image in a pane: /img <path>' })
    return next(e)
  })

  on('command.run', { command: 'img-test' }, async ($) => {
    const root = typeof $.plugin.root === 'function' ? await $.plugin.root() : $.plugin.root
    await showPane($, 'img-test', ['번들 테스트 PNG'], [`${root}/samples/test.png`])
    return {}
  })

  on('command.run', { command: 'img' }, async ($, e) => {
    const args = (e.args || '').trim()
    if (!args) return { text: '사용법: /img <이미지 경로>' }
    const found = [...args.matchAll(IMG_RE)].map((m) => m[1])
    await showPane($, '/img', [`인자: ${args}`], found.length ? found : [args])
    return {}
  })

  // Dropped/pasted images arrive as base64 blocks in the user row session.append hands us.
  on('session.append', async ($, e, next) => {
    try {
      const m = e.message
      if (m && m.type === 'user' && Array.isArray(m.content) && !e.agentId) {
        const blocks = m.content.filter((b) => b && b.type === 'image' && b.source && b.source.type === 'base64' && b.source.data)
        if (blocks.length) {
          const images = []
          for (const b of blocks.slice(0, 4)) {
            const c = await b64ToPng($, b.source.media_type || '', b.source.data)
            images.push({ label: `${b.source.media_type || 'image'} ${Math.round(b.source.data.length * 3 / 4 / 1024)} KB`, png: c.png, file: c.file, note: c.note })
          }
          byRow.set(e.uuid, images)
          pending.push({ uuid: e.uuid, images })
          await $.ui.invalidate('ui.render')
        }
      }
    } catch (err) { /* never block the row */ }
    return next(e)
  })

  // Draw the images right under the [Image #N] row, keeping Claude Code's own row.
  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    let images = byRow.get(e.requestId) || assigned.get(e.requestId)
    if (!images) {
      const text = (e.props && e.props.text) || ''
      if (/\[Image #\d+\]/.test(text) && pending.length) {
        images = pending.shift().images
        assigned.set(e.requestId, images)
      }
    }
    if (!images || !images.length) return next(e)
    const { Box, Text, Image } = $.ui.resolve(e)
    const theirs = await next(e)
    const cols = Math.min(INLINE.columns, (e.props && e.props.bodyColumns) || INLINE.columns)
    const kids = [theirs]
    for (const im of images) {
      const el = imageEl(Image, im, cols, INLINE.rows)
      kids.push(el || Text({ dimColor: true, children: [`[이미지 변환 실패: ${im.note}]`] }))
    }
    return Box({ flexDirection: 'column', children: kids })
  })

  on('ui.render', { component: 'Pane' }, async ($, e, next) => {
    if (e.requestId !== 'inline-image') return next(e)
    const { Box, Text, Image } = $.ui.resolve(e)
    const children = [Text({ bold: true, children: [`inline-image · ${pane.title}`] }), ...pane.lines.map((l) => Text({ children: [l] }))]
    for (const im of pane.images) {
      children.push(Text({ dimColor: true, children: [`${im.label}  (${im.note})`] }))
      const el = imageEl(Image, im, Math.min(60, (e.props && e.props.bodyColumns) || 60), 18)
      if (el) children.push(el)
    }
    return Box({ flexDirection: 'column', children })
  })
}
