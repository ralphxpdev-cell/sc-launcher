#!/usr/bin/env node
import { execSync, spawn } from 'child_process'
import { existsSync, writeFileSync, mkdirSync, readdirSync, statSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { createInterface } from 'readline'

const SC_URL     = 'https://brief-maker.vercel.app'
const SB_URL     = 'https://qitxwciaphfftuisyjrg.supabase.co'
const SB_KEY     = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpdHh3Y2lhcGhmZnR1aXN5anJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjMwMTcsImV4cCI6MjA4OTEzOTAxN30.dkgdVwG_8W1CzKQhFe5REr-5n27sBzsMvxDxwzeCni0'
const CONFIG     = join(homedir(), '.sc-config.json')
const MEMBERS    = ['이태섭', '안성은', '백은총', '김승리', '구광현', '전성은']

// ── 설정 ─────────────────────────────────────────────────────────────────────
function loadCfg() {
  try { return JSON.parse(readFileSync(CONFIG, 'utf-8')) } catch { return {} }
}
function saveCfg(data) {
  writeFileSync(CONFIG, JSON.stringify(data, null, 2), 'utf-8')
}

// ── 멤버 선택 (처음 한 번만) ──────────────────────────────────────────────────
async function getMember() {
  const args = process.argv.slice(2)

  // sc --reset → 멤버 재설정
  if (args.includes('--reset')) {
    saveCfg({})
    console.log('설정이 초기화됐습니다. 다시 실행하세요.')
    process.exit(0)
  }

  const cfg = loadCfg()
  if (cfg.member) return cfg.member

  console.log('\n ╔══════════════════════════════╗')
  console.log(' ║   Survey Corps Pi 런처       ║')
  console.log(' ╚══════════════════════════════╝\n')
  console.log('처음 실행입니다. 멤버를 선택하세요:\n')
  MEMBERS.forEach((m, i) => console.log(`  ${i + 1}. ${m}`))

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ans = await new Promise(r => rl.question('\n번호: ', r))
  rl.close()

  const idx = parseInt(ans) - 1
  if (isNaN(idx) || idx < 0 || idx >= MEMBERS.length) {
    console.error('잘못된 선택입니다.')
    process.exit(1)
  }

  const member = MEMBERS[idx]
  saveCfg({ member })
  console.log(`\n✅ ${member}님으로 저장됐습니다. 다음부터 자동 인식돼요.\n`)
  return member
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
const member = await getMember()
console.log(`\n👤 ${member}님 | Survey Corps Pi 런처\n`)

// 1. API 키 조회
process.stdout.write('🔑 API 키 확인 중...')
const keyRes  = await fetch(
  `${SB_URL}/rest/v1/sc_members?name=eq.${encodeURIComponent(member)}&select=api_key`,
  { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
)
const keyData = await keyRes.json()
const apiKey  = keyData[0]?.api_key
if (!apiKey) {
  console.log(' ❌')
  console.error(`API 키 없음. ${SC_URL} 에서 먼저 설정하세요.`)
  process.exit(1)
}
console.log(' ✅')

// 2. Pi 설치 확인
let piOk = false
try { execSync('pi --version', { stdio: 'ignore' }); piOk = true } catch {}
if (!piOk) {
  console.log('📦 Pi 설치 중... (처음 한 번만)')
  execSync('npm install -g @earendil-works/pi-coding-agent', { stdio: 'inherit' })
}

// 3. 워크스페이스
const workDir = join(homedir(), 'survey-corps', member)
mkdirSync(workDir, { recursive: true })
process.chdir(workDir)
console.log(`📁 ${workDir}`)

// 4. 브리프 로드 → AGENTS.md
process.stdout.write('📡 브리프 로드 중...')
try {
  const ctx = await (await fetch(`${SC_URL}/api/sessions/${encodeURIComponent(member)}`)).json()
  if (ctx.context) {
    writeFileSync('AGENTS.md', `# Survey Corps 브리프\n멤버: ${member} | 폴더: ${ctx.folder}\n\n${ctx.context}`, 'utf-8')
    console.log(` ✅ (${ctx.folder})`)
  } else {
    console.log(' ℹ️  없음')
  }
} catch {
  console.log(' ⚠️  실패 (계속 진행)')
}

// 5. Pi 설정 — 모델 고정
const piSettingsDir = join(homedir(), '.pi', 'agent')
const piSettingsPath = join(piSettingsDir, 'settings.json')
mkdirSync(piSettingsDir, { recursive: true })
let piSettings = {}
try { piSettings = JSON.parse(readFileSync(piSettingsPath, 'utf-8')) } catch {}
piSettings.defaultModel = 'gemini-2.5-flash'
writeFileSync(piSettingsPath, JSON.stringify(piSettings, null, 2), 'utf-8')

// 6. Pi 실행
console.log('\n🚀 Pi 시작!\n')
const pi = spawn('pi', ['--model', 'gemini-2.5-flash'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, GEMINI_API_KEY: apiKey },
})

// 7. 종료 시 자동 저장
pi.on('exit', async () => {
  console.log('\n💾 세션 저장 중...')
  try {
    const sessDir = join(homedir(), '.pi', 'agent', 'sessions')
    if (!existsSync(sessDir)) return

    const files = readdirSync(sessDir, { recursive: true })
      .map(f => join(sessDir, String(f)))
      .filter(f => f.endsWith('.json'))
      .filter(f => { try { return !statSync(f).isDirectory() } catch { return false } })
      .map(f => ({ path: f, mtime: statSync(f).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)

    if (!files.length) return

    const raw = JSON.parse(readFileSync(files[0].path, 'utf-8'))
    const messages = (raw.messages || raw.turns || raw.history || [])
      .map(m => ({
        role: m.role || (m.type === 'assistant' ? 'assistant' : 'user'),
        content: typeof m.content === 'string'
          ? m.content
          : (m.content || []).map(c => c.text || '').join(''),
      }))
      .filter(m => m.content)

    if (!messages.length) return

    const res = await fetch(`${SC_URL}/api/sessions/${encodeURIComponent(member)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
    console.log(res.ok ? `✅ 저장 완료! ${SC_URL}/dashboard` : `⚠️  저장 실패 (${res.status})`)
  } catch (e) {
    console.log('⚠️  저장 오류:', e.message)
  }
})
