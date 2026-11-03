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

test('켜진 세션만 보여 주고, 이동을 누르면 그 세션을 열 뿐 끄지는 않는다', async ($, on) => {
  const tools: string[] = []
  const opened: string[] = []
  on('command.register', () => ({ value: { command: 'rc-panel' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('store.get', (_, e) => ({ value: e.key === 'lang' ? 'ko' : undefined }))
  on('tool.check', () => ({ decision: 'allow' as const }))
  on('tool.call', (_, e) => {
    tools.push(e.tool)

    return {
      result: {},
      text: JSON.stringify(e.tool === 'mcp__ccd_session_mgmt__get_session' ? SELF : LIST),
    }
  })
  on('process.run', (_, e) => {
    opened.push(e.argv.at(-1) ?? '')

    return { value: { exitCode: 0, stdout: '', stderr: '' } as never }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })

  expect((await ui.find({ type: 'Text', text: /켜진 세션 3개/ }))?.text).toBe('켜진 세션 3개')
  expect(await ui.find({ type: 'Text', text: /꺼진 세션/ })).toBe(undefined)
  expect((await ui.find({ type: 'Text', text: /todo-app/ }))?.text).toMatch(/^todo-app/)

  // 지금 이 세션에는 이동 버튼이 없다
  expect(await ui.find({ type: 'Button', key: 'go:local_dd' })).toBeFalsy()
  expect((await ui.find({ type: 'Button', key: 'go:local_cc' }))?.props.label).toBe('이동')
  await ui.press({ key: 'go:local_cc' })
  await settle()
  expect(opened).toEqual(['claude://claude.ai/epitaxy/local_cc'])
  expect(tools).not.toContain('mcp__ccd_session_mgmt__set_remote_control')

  // 모두 끄기도 없다
  await ui.press({ key: 'settings' })
  await settle()
  expect(await ui.find({ type: 'Button', key: 'off-all' })).toBeFalsy()
  await ui.unmount()
})

test('이동은 Windows에서는 rundll32로, macOS에서는 open으로 세션 링크를 연다', async ($, on) => {
  let os: string | undefined = 'Windows_NT'
  const runs: string[][] = []
  on('command.register', () => ({ value: { command: 'rc-panel' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('store.get', () => ({ value: undefined }))
  on('env.get', (_, e) => ({ value: e.name === 'OS' ? os : undefined }))
  on('tool.check', () => ({ decision: 'allow' as const }))
  on('tool.call', (_, e) => ({
    result: {},
    text: JSON.stringify(e.tool === 'mcp__ccd_session_mgmt__get_session' ? SELF : LIST),
  }))
  on('process.run', (_, e) => {
    runs.push([...e.argv])

    return { value: { exitCode: 0, stdout: '', stderr: '' } as never }
  })
  on('session.start', (_, e) => ({ cwd: e.cwd }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  await ui.press({ key: 'go:local_aa' })
  await settle()
  os = undefined
  await ui.press({ key: 'go:local_aa' })
  await settle()
  expect(runs).toEqual([
    ['rundll32', 'url.dll,FileProtocolHandler', 'claude://claude.ai/epitaxy/local_aa'],
    ['open', 'claude://claude.ai/epitaxy/local_aa'],
  ])
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
  // 어느 mod가 먼저 불려도 ◨ 다음에 RC가 온다
  expect((await band.findAll({ type: 'Button' })).map(b => b.props?.key)).toEqual(['toggle-pane', 'rc-toggle'])

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

test('session-tree가 줄로 그린 상태 줄에서도 ◨ 바로 뒤에 RC를 놓는다', async ($, on) => {
  on('ui.render', ($$, e) => {
    const { Box, Button, Text } = $$.ui.resolve(e)

    return (
      <Box flexDirection="row">
        <Button key="toggle-pane" label="◨" onPress={() => {}} />
        <Text>모드</Text>
      </Box>
    )
  })
  on('store.get', () => ({ value: undefined }))

  const band = await $.ui.mount({ ...MODE, surface: 'desktop' })
  expect((await band.findAll({ type: 'Button' })).map(b => b.props?.key)).toEqual(['toggle-pane', 'rc-toggle'])
  expect(await band.find({ type: 'Text', text: /모드/ })).toBeTruthy()
  await band.unmount()
})

test('예시 화면은 실제 세션 대신 예시를 보여 주고, 이동을 눌러도 아무 세션도 열지 않는다', async ($, on) => {
  const opened: unknown[] = []
  on('process.run', (_, e) => {
    opened.push(e.argv)

    return { value: { exitCode: 0, stdout: '', stderr: '' } as never }
  })
  const called: string[] = []
  on('command.register', () => ({ value: { command: 'rc-panel' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('ui.panes', () => ({ value: [] }))
  on('clock.every', () => ({ value: undefined }))
  on('store.get', () => ({ value: undefined }))
  on('tool.check', () => ({ decision: 'allow' as const }))
  on('tool.call', (_, e) => {
    called.push(e.tool)

    return { result: {}, text: JSON.stringify(e.tool === 'mcp__ccd_session_mgmt__get_session' ? SELF : LIST) }
  })

  await $.command.run({ command: 'rc-panel', args: 'demo' } as never)
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await ui.find({ type: 'Text', text: /Plan the v2 release/ })).toBeTruthy()
  expect(await ui.find({ type: 'Text', text: /켜진 세션/ })).toBeFalsy()

  called.length = 0
  await ui.press({ key: 'go:demo-2' })
  await settle()
  expect(called).toEqual([])
  expect(opened).toEqual([])

  // 인자 없이 다시 열면 실제 세션으로 돌아온다
  await $.command.run({ command: 'rc-panel', args: '' } as never)
  await $.command.run({ command: 'rc-panel', args: '' } as never)
  expect(await ui.find({ type: 'Text', text: /켜진 세션/ })).toBeTruthy()
  await ui.unmount()
})
