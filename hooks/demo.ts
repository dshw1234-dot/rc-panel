import type { RcRow } from '../types'

// `/rc-panel demo`가 실제 세션 대신 보여 주는 예시 (README 스크린샷용).
// id가 local_ 모양이 아니라서 눌러도 아무 세션도 열리지 않는다.
export function demoRows(): RcRow[] {
  return [
    { id: 'demo-1', title: 'Plan the v2 release', folder: 'web-app', isRunning: true, isCurrent: true },
    { id: 'demo-2', title: 'Fix the login redirect bug', folder: 'web-app', isRunning: true, isCurrent: false },
    { id: 'demo-3', title: 'Write the API docs', folder: 'api-server', isRunning: false, isCurrent: false },
    { id: 'demo-4', title: 'Review the dependency updates', folder: 'mobile', isRunning: false, isCurrent: false },
  ]
}
