#!/usr/bin/env node
import { execSync, spawn } from 'child_process'
import { existsSync, writeFileSync, mkdirSync, readdirSync, statSync, readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { createInterface } from 'readline'

const SC_URL  = 'https://brief-maker.vercel.app'
const SB_URL  = 'https://qitxwciaphfftuisyjrg.supabase.co'
const SB_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpdHh3Y2lhcGhmZnR1aXN5anJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1NjMwMTcsImV4cCI6MjA4OTEzOTAxN30.dkgdVwG_8W1CzKQhFe5REr-5n27sBzsMvxDxwzeCni0'
const CONFIG  = join(homedir(), '.sc-config.json')
const MEMBERS = ['이태섭', '안성은', '백은총', '김승리', '구광현', '전성은']

const PROVIDERS = [
  { id: 'gemini',    label: 'Gemini 2.5 Flash',       model: 'gemini-2.5-flash',              envKey: 'GEMINI_API_KEY',    keyField: 'api_key' },
  { id: 'anthropic', label: 'Claude Sonnet (Anthropic)', model: 'claude-sonnet-4-6',           envKey: 'ANTHROPIC_API_KEY', keyField: 'anthropic_key' },
  { id: 'openai',    label: 'GPT-4o (OpenAI)',         model: 'gpt-4o',                        envKey: 'OPENAI_API_KEY',    keyField: 'openai_key' },
  { id: 'groq',      label: 'LLaMA 3.3 (Groq, 무료)', model: 'groq/llama-3.3-70b-versatile',  envKey: 'GROQ_API_KEY',      keyField: 'groq_key' },
  { id: 'ollama',    label: 'Ollama (로컬)',            model: 'ollama/llama3.2',               envKey: null,                keyField: null },
]

function loadCfg() {
  try { return JSON.parse(readFileSync(CONFIG, 'utf-8')) } catch { return {} }
}
function saveCfg(data) {
  writeFileSync(CONFIG, JSON.stringify(data, null, 2), 'utf-8')
}

async function prompt(rl, q) {
  return new Promise(r => rl.question(q, r))
}

// ── 멤버 선택 ─────────────────────────────────────────────────────────────────
async function getMember() {
  const args = process.argv.slice(2)
  if (args.includes('--reset')) {
    saveCfg({})
    console.log('설정 초기화 완료. 다시 실행하세요.')
    process.exit(0)
  }
  const cfg = loadCfg()
  if (cfg.member) return cfg.member

  console.log('\n ╔══════════════════════════════╗')
  console.log(' ║   Survey Corps Pi 런처       ║')
  console.log(' ╚══════════════════════════════╝\n')
  console.log('멤버를 선택하세요:\n')
  MEMBERS.forEach((m, i) => console.log(`  ${i + 1}. ${m}`))

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ans = await prompt(rl, '\n번호: ')
  rl.close()

  const idx = parseInt(ans) - 1
  if (isNaN(idx) || idx < 0 || idx >= MEMBERS.length) {
    console.error('잘못된 선택입니다.'); process.exit(1)
  }
  const member = MEMBERS[idx]
  saveCfg({ member })
  console.log(`\n✅ ${member}님으로 저장됐습니다.\n`)
  return member
}

// ── 프로바이더 선택 ───────────────────────────────────────────────────────────
async function selectProvider(availableKeys) {
  const cfg = loadCfg()

  const options = PROVIDERS.map(p => {
    if (p.id === 'ollama') return { ...p, available: true }
    const key = p.keyField === 'api_key' ? availableKeys.api_key : availableKeys.keys?.[p.keyField]
    return { ...p, available: !!key, apiKey: key }
  })

  // 사용 가능한 것만 + Ollama
  const choices = options.filter(p => p.available)
  if (!choices.length) {
    console.error(`키 없음. ${SC_URL} 에서 API 키를 먼저 등록하세요.`)
    process.exit(1)
  }

  // 저장된 프로바이더가 있으면 바로 사용
  if (cfg.provider) {
    const saved = choices.find(p => p.id === cfg.provider)
    if (saved) return saved
  }

  // 하나뿐이면 바로 사용
  if (choices.length === 1) return choices[0]

  console.log('\n어떤 모델로 시작할까요?\n')
  choices.forEach((p, i) => console.log(`  ${i + 1}. ${p.label}`))
  console.log(`\n  (기본값 유지: 엔터 / 다음부터 기억: 번호 입력)`)

  const rl = createInterface({ input: process.stdin, output: process.stdout })
  const ans = await prompt(rl, '\n번호: ')
  rl.close()

  if (!ans.trim()) return choices[0]

  const idx = parseInt(ans) - 1
  if (isNaN(idx) || idx < 0 || idx >= choices.length) return choices[0]

  const selected = choices[idx]
  saveCfg({ ...cfg, provider: selected.id })
  return selected
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
const member = await getMember()
console.log(`\n👤 ${member}님 | Survey Corps Pi 런처\n`)

// 1. 키 전체 조회
process.stdout.write('🔑 키 확인 중...')
const keyRes  = await fetch(
  `${SB_URL}/rest/v1/sc_members?name=eq.${encodeURIComponent(member)}&select=api_key,keys`,
  { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
)
const keyData = await keyRes.json()
const row = keyData[0]
if (!row) {
  console.log(' ❌')
  console.error(`등록된 멤버 없음. ${SC_URL} 에서 먼저 설정하세요.`)
  process.exit(1)
}
console.log(' ✅')

// 2. 프로바이더 선택
const provider = await selectProvider(row)
console.log(`\n🤖 ${provider.label}`)

// 3. Pi 설치 확인
let piOk = false
try { execSync('pi --version', { stdio: 'ignore' }); piOk = true } catch {}
if (!piOk) {
  console.log('📦 Pi 설치 중...')
  execSync('npm install -g @earendil-works/pi-coding-agent', { stdio: 'inherit' })
}

// 4. 워크스페이스
const workDir = join(homedir(), 'survey-corps', member)
mkdirSync(workDir, { recursive: true })
process.chdir(workDir)
console.log(`📁 ${workDir}`)

// 5. 브리프 로드
process.stdout.write('📡 브리프 로드 중...')
try {
  const ctx = await (await fetch(`${SC_URL}/api/sessions/${encodeURIComponent(member)}`)).json()
  if (ctx.context) {
    writeFileSync('AGENTS.md', `# Survey Corps 브리프\n멤버: ${member} | 폴더: ${ctx.folder}\n\n${ctx.context}`, 'utf-8')
    console.log(` ✅ (${ctx.folder})`)
  } else {
    console.log(' ℹ️  없음')
  }
} catch { console.log(' ⚠️  실패') }

// 6. Pi 설정
const piSettingsDir = join(homedir(), '.pi', 'agent')
mkdirSync(piSettingsDir, { recursive: true })
const piSettingsPath = join(piSettingsDir, 'settings.json')
let piSettings = {}
try { piSettings = JSON.parse(readFileSync(piSettingsPath, 'utf-8')) } catch {}
piSettings.defaultModel = provider.model
writeFileSync(piSettingsPath, JSON.stringify(piSettings, null, 2), 'utf-8')

// 7. Pi 실행
console.log('\n🚀 Pi 시작!\n')
const piCmd = process.platform === 'win32' ? 'pi.cmd' : 'pi'
const env   = { ...process.env }
if (provider.envKey && provider.apiKey) env[provider.envKey] = provider.apiKey
if (provider.id === 'ollama') env['OLLAMA_HOST'] = 'http://localhost:11434'

const pi = spawn(piCmd, ['--model', provider.model], { stdio: 'inherit', env })

// 8. 종료 시 세션 저장
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
