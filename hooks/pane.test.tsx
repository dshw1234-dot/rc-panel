import { expect, test } from 'claude-code/testing'

// 버튼 처리는 뒤에서 이어지므로 끝날 때까지 몇 차례 기다린다
const settle = async () => {
  for (let i = 0; i < 50; i++) await Promise.resolve()
}

const PANE = {
  plugin: 'rc-panel',
  component: 'Pane',
  requestId: 'rc-panel',
  props: {
    title: 'Remote Control',
    isFocused: false,
    bodyColumns: 40,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 20 },
    view: {},
  },
} as const

const MODE = {
  plugin: 'rc-panel',
  component: 'SessionMode',
  props: { modes: [] },
} as const

const LIST = [
  { sessionId: 'local_aa', title: '켜진 세션', cwd: 'C:\\p\\AI공부', isRunning: true, remoteControlActive: true },
  { sessionId: 'local_bb', title: '꺼진 세션', cwd: 'C:\\p\\AI공부', isRunning: false, remoteControlActive: false },
  {
    sessionId: 'local_cc',
    title: '워크트리 세션',
    cwd: 'C:\\dev\\todo-app\\.claude\\worktrees\\x-1',
    isRunning: false,
    remoteControlActive: true,
  },
]
const SELF = { sessionId: 'local_dd', title: '이 세션', cwd: 'C:\\p\\AI공부', isRunning: true, remoteControlActive: true }

test('켜진 세션만 보여 주고, 끄기를 누르면 그 세션을 끈다', async ($, on) => {
  const turnedOff: unknown[] = []
  on('command.register', () => ({ value: { command: 'rc-panel' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('store.get', (_, e) => ({ value: e.key === 'lang' ? 'ko' : undefined }))
  on('tool.check', () => ({ decision: 'allow' as const }))
  on('tool.call', (_, e) => {
    if (e.tool === 'mcp__ccd_session_mgmt__set_remote_control') {
      turnedOff.push((e as { session_id?: unknown }).session_id)

      return { result: {}, text: '"off"' }
    }

    return {
      result: {},
      text: JSON.stringify(e.tool === 'mcp__ccd_session_mgmt__get_session' ? SELF : LIST),
    }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /켜진 세션 3개/ }))?.text).toBe('켜진 세션 3개')
  expect(await ui.find({ type: 'Text', text: /꺼진 세션/ })).toBe(undefined)
  expect((await ui.find({ type: 'Text', text: /todo-app/ }))?.text).toMatch(/^todo-app/)

  await ui.press({ key: 'off:local_dd' })
  await settle()
  await ui.press({ key: 'off:local_cc' })
  await settle()
  expect(turnedOff).toEqual(['self', 'local_cc'])

  // 모두 끄기는 설정창 안에 있다
  expect(await ui.find({ type: 'Button', key: 'off-all' })).toBeFalsy()
  await ui.press({ key: 'settings' })
  await settle()
  turnedOff.length = 0
  await ui.press({ key: 'off-all' })
  await settle()
  expect(turnedOff).toEqual(['self', 'local_aa', 'local_cc'])
  await ui.unmount()
})

test('설정에서 언어를 바꾸고 그 값을 기본값으로 저장한다', async ($, on) => {
  const stored: Record<string, unknown> = {}
  on('command.register', () => ({ value: { command: 'rc-panel' } }))
  on('ui.panes', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('store.get', (_, e) => ({ value: e.key === 'lang' ? 'ko' : undefined }))
  on('store.set', (_, e) => {
    stored[e.key] = e.value

    return { value: undefined }
  })
  on('tool.check', () => ({ decision: 'deny' as const }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'settings' })
  await settle()
  expect((await ui.find({ type: 'Button', key: 'language' }))?.props.label).toBe('English')

  await ui.press({ key: 'language' })
  await settle()
  expect(stored.lang).toBe('en')
  expect((await ui.find({ type: 'Button', key: 'language' }))?.props.label).toBe('한국어')
  expect((await ui.find({ type: 'Button', key: 'refresh' }))?.props.label).toBe('Refresh')
  await ui.unmount()
})

test('상태 줄에 RC 버튼을 그리고, 설정에서 숨기면 아래 mod의 버튼만 남긴다', async ($, on) => {
  const stored: unknown[] = []
  // 아래에 깔린 다른 mod(session-tree)가 자기 버튼을 그린다고 본다
  on('ui.render', ($$, e) => {
    const { Button } = $$.ui.resolve(e)

    return <Button key="toggle-pane" label="◨" onPress={() => {}} />
  })
  on('store.get', () => ({ value: undefined }))
  on('store.set', (_, e) => {
    stored.push(e.value)

    return { value: undefined }
  })

  const band = await $.ui.mount({ ...MODE, surface: 'desktop' })
  expect((await band.find({ type: 'Button', key: 'rc-toggle' }))?.props.label).toBe('RC')
  expect((await band.find({ type: 'Button', key: 'toggle-pane' }))?.props.label).toBe('◨')

  const pane = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await pane.press({ key: 'settings' })
  await settle()
  await pane.press({ key: 'icon' })
  await settle()
  expect(stored.at(-1)).toBe(true)
  expect(await band.find({ type: 'Button', key: 'rc-toggle' })).toBeFalsy()
  expect(await band.find({ type: 'Button', key: 'toggle-pane' })).toBeTruthy()

  await pane.press({ key: 'icon' })
  await settle()
  expect(stored.at(-1)).toBe(false)
  expect(await band.find({ type: 'Button', key: 'rc-toggle' })).toBeTruthy()
  await pane.unmount()
  await band.unmount()
})
