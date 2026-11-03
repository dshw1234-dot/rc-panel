export type Lang = 'ko' | 'en'
export type NoteCode = 'loading' | 'empty' | 'readFailed' | 'offFailed'

export type RcRow = {
  id: string
  title: string
  folder: string
  isRunning: boolean
  isCurrent: boolean
}

declare module 'claude-code' {
  interface PluginState {
    'rc-panel': {
      rows: Shaped<RcRow[]>
      // 언어를 바꿔도 따라 바뀌도록 글 대신 종류를 둔다
      note: Shaped<NoteCode | null>
      isPaneOpen: boolean
      // 끄는 중인 세션 id. 모두 끄기 중이면 '*'
      busy: string | null
      lang: Lang
      isSettingsOpen: boolean
      isIconHidden: boolean
    }
  }
}
