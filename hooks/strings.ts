import type { Lang, NoteCode } from '../types'

type Strings = {
  commandDescription: string
  opened: string
  closed: string
  count: (n: number) => string
  settings: string
  otherLanguage: string
  refresh: string
  offAll: string
  hideIcon: string
  showIcon: string
  off: string
  working: string
  running: string
  idle: string
  here: string
  untitled: string
  footer: string
  notes: Record<NoteCode, string>
}

export const STRINGS: Record<Lang, Strings> = {
  ko: {
    commandDescription: 'Remote Control이 켜진 세션 패널을 열거나 닫는다',
    opened: 'Remote Control 패널을 열었어요.',
    closed: 'Remote Control 패널을 닫았어요.',
    count: n => `켜진 세션 ${n}개`,
    settings: '설정',
    otherLanguage: 'English',
    refresh: '새로 고침',
    offAll: '모두 끄기',
    hideIcon: '입력창 아래 아이콘 숨기기',
    showIcon: '입력창 아래 아이콘 보이기',
    off: '끄기',
    working: '끄는 중…',
    running: '● 실행 중',
    idle: '○ 쉬는 중',
    here: '지금 이 세션',
    untitled: '(제목 없음)',
    footer: '1분마다 저절로 새로 고침. 제목을 누르면 그 세션이 열려요.',
    notes: {
      loading: '불러오는 중…',
      empty: '켜진 세션이 없어요.',
      readFailed: '세션 목록을 읽지 못했어요. 권한을 허용했는지 확인해 주세요.',
      offFailed: '끄지 못했어요. 승인 창을 거절했거나 앱이 거부했어요.',
    },
  },
  en: {
    commandDescription: 'Open or close the panel of sessions with Remote Control on',
    opened: 'Opened the Remote Control panel.',
    closed: 'Closed the Remote Control panel.',
    count: n => `${n} session${n === 1 ? '' : 's'} on`,
    settings: 'Settings',
    otherLanguage: '한국어',
    refresh: 'Refresh',
    offAll: 'Turn all off',
    hideIcon: 'Hide icon below the prompt',
    showIcon: 'Show icon below the prompt',
    off: 'Turn off',
    working: 'Turning off…',
    running: '● running',
    idle: '○ idle',
    here: 'this session',
    untitled: '(untitled)',
    footer: 'Refreshes every minute. Click a title to open that session.',
    notes: {
      loading: 'Loading…',
      empty: 'No session has Remote Control on.',
      readFailed: 'Could not read the session list. Check that the tool is allowed.',
      offFailed: 'Could not turn it off: the approval was declined or the app refused.',
    },
  },
}
