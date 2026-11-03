import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, RenderNode } from 'claude-code'

import type { Lang, NoteCode, RcRow } from '../types'
import { demoRows } from './demo'
import { STRINGS } from './strings'

const PANE = 'rc-panel'
const TITLE = 'Remote Control'
const LIST_TOOL = 'mcp__ccd_session_mgmt__list_sessions'
const GET_TOOL = 'mcp__ccd_session_mgmt__get_session'
const REFRESH_MS = 60_000
const GEAR = '⚙'
const LANG_KEY = 'lang'
const HIDE_ICON_KEY = 'hideIcon'

const ON_COLOR = '#7BE0A8'
const IDLE_COLOR = '#9C9A92'
const CURRENT_COLOR = '#EF9F27'
const BORDER = '#6F6E69'

const rows = atom({ plugin: 'rc-panel', key: 'rows' } as const, [], {
  shape: 'rows-1',
})
// 종류가 바뀔 때마다 shape를 올려 예전 값('offFailed' 등)은 버린다
const note = atom(
  { plugin: 'rc-panel', key: 'note' } as const,
  'loading' as NoteCode | null,
  { shape: 'note-3' },
)
const isPaneOpen = atom(
  { plugin: 'rc-panel', key: 'isPaneOpen' } as const,
  false as boolean,
)
const lang = atom({ plugin: 'rc-panel', key: 'lang' } as const, 'en' as Lang)
const isSettingsOpen = atom(
  { plugin: 'rc-panel', key: 'isSettingsOpen' } as const,
  false as boolean,
)
const isIconHidden = atom(
  { plugin: 'rc-panel', key: 'isIconHidden' } as const,
  false as boolean,
)

type RawSession = {
  sessionId?: string
  title?: string
  cwd?: string
  isRunning?: boolean
  remoteControlActive?: boolean
}

// 도구 결과 글에서 JSON만 꺼낸다
function parseJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const at = text.search(/[[{]/)
    if (at < 0) return null
    try {
      return JSON.parse(text.slice(at))
    } catch {
      return null
    }
  }
}

// 워크트리 폴더(…\repo\.claude\worktrees\x)는 저장소 이름으로 보여 준다
function folderName(cwd: string) {
  const base = cwd.split(/[\\/]\.claude[\\/]worktrees[\\/]/)[0] ?? cwd
  const parts = base.split(/[\\/]/).filter(Boolean)

  return parts[parts.length - 1] ?? ''
}

function toRow(s: RawSession, isCurrent: boolean): RcRow | null {
  if (!s.sessionId || s.remoteControlActive !== true) return null

  return {
    id: s.sessionId,
    title: s.title ?? '',
    folder: folderName(s.cwd ?? ''),
    isRunning: s.isRunning === true,
    isCurrent,
  }
}

export function parseRows(listText: string, selfText: string): RcRow[] {
  const list = parseJson(listText)
  const self = parseJson(selfText) as RawSession | null
  const others = (Array.isArray(list) ? (list as RawSession[]) : []).flatMap(
    s => toRow(s, false) ?? [],
  )
  const current = self && toRow(self, true)

  return current ? [current, ...others] : others
}

// 1분마다 도는 갱신은 권한 창을 띄우면 안 되므로 이미 허용된 도구만 부른다.
// 사람이 버튼을 눌렀을 때는 권한 창이 떠도 되므로 바로 부른다.
async function callTool(
  $: EngineInterface,
  tool: string,
  input: Record<string, unknown>,
  isQuiet: boolean,
) {
  try {
    if (isQuiet) {
      const { decision } = await $.tool.check({ tool, input } as never)
      if (decision !== 'allow') return null
    }
    const { text } = await $.tool.call({ tool, ...input } as never)

    return String(text ?? '')
  } catch {
    return null
  }
}

// `/rc-panel demo`로 연 동안은 예시만 보여 주고 앱 도구를 부르지 않는다
let isDemo = false

async function refresh($: EngineInterface, isQuiet: boolean) {
  if (isDemo) {
    if (!isQuiet) await update($, rows, () => demoRows())
    await update($, note, () => null)

    return
  }
  const listText = await callTool($, LIST_TOOL, { limit: 500 }, isQuiet)
  if (listText === null) {
    if (!isQuiet) await update($, note, () => 'readFailed' as const)

    return
  }
  const selfText =
    (await callTool($, GET_TOOL, { session_id: 'self' }, isQuiet)) ?? ''
  const next = parseRows(listText, selfText)
  await update($, rows, () => next)
  await update($, note, () => (next.length ? null : ('empty' as const)))
}

// 1분마다 도는 갱신: 이미 허용된 도구만 불러 권한 창을 띄우지 않는다
async function quietRefresh($: EngineInterface) {
  await refresh($, true)
}

// 끄기 버튼은 두지 않는다. mod가 쉬는 세션에서 set_remote_control을 부르면 앱이 승인 창을 띄우고,
// 그 승인이 턴 밖이라 '작업 중' 시간 표시가 멈추지 않는다(데스크톱 4.4212). 그래서 그 세션으로 이동만 한다.
async function openSession($: EngineInterface, id: string) {
  if (!/^local_[0-9a-f-]+$/.test(id)) return
  await $.process.run([
    'rundll32',
    'url.dll,FileProtocolHandler',
    `claude://claude.ai/epitaxy/${id}`,
  ])
}

async function openPane($: EngineInterface) {
  await $.ui.open({ id: PANE, title: TITLE })
  await update($, isPaneOpen, () => true)
  await refresh($, false)
}

// 패널이 열려 있으면 닫고 true를 돌려준다
async function closeIfOpen($: EngineInterface) {
  const panes = await $.ui.panes()
  if (!panes.some(pane => pane.id === PANE)) return false
  await $.ui.close({ id: PANE })
  await update($, isPaneOpen, () => false)

  return true
}

async function togglePane($: EngineInterface) {
  if (!(await closeIfOpen($))) await openPane($)
}

// 사용자가 고른 언어가 기본값이다. 고른 적이 없으면 Claude Code 언어 설정과 시스템 언어를 따른다.
async function resolveLang($: EngineInterface): Promise<Lang> {
  const stored = await $.store.get(LANG_KEY)
  if (stored === 'ko' || stored === 'en') return stored
  try {
    const rows = await $.config.list()
    const setting = rows.find(row => row.key === 'language')?.value
    if (typeof setting === 'string' && setting) {
      return /^(ko|korean|한국어)/i.test(setting) ? 'ko' : 'en'
    }
  } catch {
    // 설정을 읽지 못하면 시스템 언어를 본다
  }
  let system: string | undefined
  try {
    system = await $.env.get('LANG')
  } catch {
    system = undefined
  }

  return system?.startsWith('ko') ? 'ko' : 'en'
}

async function toggleLang($: EngineInterface) {
  const next: Lang = (await read($, lang)) === 'ko' ? 'en' : 'ko'
  await update($, lang, () => next)
  await $.store.set(LANG_KEY, next)
}

async function toggleIcon($: EngineInterface) {
  const next = !(await read($, isIconHidden))
  await update($, isIconHidden, () => next)
  await $.store.set(HIDE_ICON_KEY, next)
}

async function toggleSettings($: EngineInterface) {
  const next = !(await read($, isSettingsOpen))
  await update($, isSettingsOpen, () => next)
}

// 버튼 처리는 10초 안에 끝나야 한다. 승인 창을 기다리는 일은 뒤에서 이어 간다.
function background(work: Promise<unknown>) {
  void work.catch(() => {})
}

// 그리는 도중에는 상태를 쓸 수 없어 세션 시작에서 갱신을 건다
let isStarted = false

async function start($: EngineInterface) {
  if (isStarted) return
  isStarted = true
  const resolved = await resolveLang($)
  await update($, lang, () => resolved)
  const hidden = await $.store.get(HIDE_ICON_KEY)
  if (hidden === true) await update($, isIconHidden, () => true)
  let isOpen = false
  try {
    const panes = await $.ui.panes()
    isOpen = panes.some(pane => pane.id === PANE)
  } catch {
    // 패널 목록을 못 읽으면 닫힌 것으로 본다
  }
  await update($, isPaneOpen, () => isOpen)
  await quietRefresh($)
  $.clock.every(REFRESH_MS, () => void quietRefresh($))
}

// mod를 불러오는 순서는 세션마다 달라서, session-tree(◨)가 아래에 깔려 있으면
// 그 버튼 바로 뒤에 끼워 넣는다. 어느 순서로 불려도 '◨ RC'로 보이게 하려는 것.
const TREE_BUTTON = 'toggle-pane'

function isTreeButton(node: RenderNode | undefined) {
  return !!node && typeof node !== 'string' && node.type === 'Button' && node.props.key === TREE_BUTTON
}

function placeAfterTree(below: unknown, button: RenderNode): RenderElement | undefined {
  const tree = below as RenderNode | undefined
  if (isTreeButton(tree)) return { type: 'Box', props: { flexDirection: 'row' }, children: [tree!, button] }
  if (!tree || typeof tree === 'string' || tree.type !== 'Box') return undefined
  const [first, ...rest] = tree.children ?? []
  if (!isTreeButton(first)) return undefined

  return { ...tree, children: [first!, button, ...rest] }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await start($)
    await $.command.register({
      name: 'rc-panel',
      description: STRINGS[await read($, lang)].commandDescription,
    })

    return next(e)
  })

  on('command.run', { command: 'rc-panel' }, async ($, e) => {
    await start($)
    // `/rc-panel demo`는 실제 세션 대신 예시 데이터를 보여 준다 (스크린샷용)
    isDemo = e.args.trim() === 'demo'
    const t = STRINGS[await read($, lang)]
    if (!isDemo && (await closeIfOpen($))) return { text: t.closed }
    await openPane($)

    return { text: t.opened }
  })

  on('ui.close', { id: PANE }, async ($, e, next) => {
    const result = await next(e)
    await update($, isPaneOpen, () => false)

    return result
  })

  // 입력창 아래 상태 줄의 버튼. 다른 mod(session-tree 등)의 버튼도 그대로 둔다.
  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const below = await next(e)
    if (e.surface !== 'desktop' || (await read($, isIconHidden))) return below
    const { Box, Button } = $.ui.resolve(e)
    const count = (await read($, rows)).length
    const isOpen = await read($, isPaneOpen)

    const button = (
      <Button
        key="rc-toggle"
        label={`RC${count ? ` ${count}` : ''}${isOpen ? ' ▾' : ''}`}
        dimColor
        onPress={() => background(togglePane($))}
      />
    )

    return placeAfterTree(below, button) ?? (
      <Box flexDirection="row">
        {button}
        {below}
      </Box>
    )
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, rows)
    const message = await read($, note)
    const isOpen = await read($, isSettingsOpen)
    const isHidingIcon = await read($, isIconHidden)
    const t = STRINGS[await read($, lang)]

    return (
      <Box flexDirection="column" gap="sm">
        <Box flexDirection="row" alignItems="center">
          <Box flexGrow={1}>
            <Text bold>{t.count(list.length)}</Text>
          </Box>
          <Button key="settings" label={GEAR} plain onPress={() => background(toggleSettings($))} />
        </Box>
        {isOpen && (
          <Box
            flexDirection="column"
            gap="xs"
            borderStyle="round"
            borderColor={BORDER}
            paddingX={1}
          >
            <Text bold>{t.settings}</Text>
            <Box flexDirection="row" flexWrap="wrap">
              <Button key="language" label={t.otherLanguage} onPress={() => background(toggleLang($))} />
              <Button key="refresh" label={t.refresh} onPress={() => background(refresh($, false))} />
              <Button
                key="icon"
                label={isHidingIcon ? t.showIcon : t.hideIcon}
                onPress={() => background(toggleIcon($))}
              />
            </Box>
          </Box>
        )}
        {message && <Text dimColor>{t.notes[message]}</Text>}
        {list.map(row => (
          <Box
            flexDirection="row"
            alignItems="center"
            borderStyle="round"
            borderColor={row.isCurrent ? CURRENT_COLOR : BORDER}
            paddingX={1}
          >
            <Box flexDirection="column" flexGrow={1} flexShrink={1}>
              <Button key={`open:${row.id}`} plain onPress={() => background(openSession($, row.id))}>
                <Text bold={row.isCurrent}>{row.title || t.untitled}</Text>
              </Button>
              <Text dimColor>
                {row.folder}
                {' · '}
                <Text color={row.isRunning ? ON_COLOR : IDLE_COLOR}>
                  {row.isRunning ? t.running : t.idle}
                </Text>
                {row.isCurrent && <Text color={CURRENT_COLOR}> · {t.here}</Text>}
              </Text>
            </Box>
            {!row.isCurrent && (
              <Button key={`go:${row.id}`} label={t.go} onPress={() => background(openSession($, row.id))} />
            )}
          </Box>
        ))}
        <Text dimColor>{t.footer}</Text>
      </Box>
    )
  })
}
