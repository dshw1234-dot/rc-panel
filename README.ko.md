# RC Panel

[English](README.md)

Claude 데스크톱 앱에서 Remote Control이 켜진 세션을 한눈에 보여 주고, 하나씩 또는 한 번에 끄는 옆 패널입니다. Remote Control은 세션마다 따로 켜기 때문에, 어느 세션이 아직 폰이나 claude.ai에서 열려 있는지 놓치기 쉽습니다. RC Panel은 그 세션들을 목록 하나로 모읍니다.

## 기능

- **목록 하나:** 이 컴퓨터에서 Remote Control이 켜진 세션을 모두 보여 줍니다. 지금 세션이 맨 위에 옵니다.
- **상태:** 카드마다 폴더, 실행 중(●)인지 쉬는 중(○)인지, 지금 세션인지가 표시됩니다.
- **끄기:** 카드마다 끄기 버튼이 있고, 설정 상자에 **모두 끄기**가 있습니다. 바꿀 때마다 앱이 승인을 묻습니다.
- **눌러서 열기:** 제목을 누르면 앱에서 그 세션을 엽니다.
- **간편 여닫기:** 입력창 아래의 흐린 `RC` 버튼이 패널을 열고 닫으며, 켜진 세션 수(`RC 5`)를 보여 줍니다. `/rc-panel`도 같은 일을 합니다. 버튼은 설정에서 숨길 수 있습니다.
- **한국어와 영어:** 고른 언어를 기억합니다.

목록은 1분마다 스스로 새로 고칩니다.

## 설치

Claude 데스크톱 앱과 Claude Code CLI가 필요합니다. 터미널 세션의 입력창에서 실행합니다.

```
/plugin install rc-panel --marketplace dshw1234-dot/rc-panel
```

마켓플레이스를 추가할지 물으면 `y`, 범위는 user를 고릅니다. 셸에서는 다음을 실행합니다.

```bash
claude plugin install rc-panel --marketplace dshw1234-dot/rc-panel
```

`/plugin`이 동작하지 않는 데스크톱 앱에서는 입력창 옆 + → Plugins → Add marketplace에 `dshw1234-dot/rc-panel`을 넣고 Add plugin을 누릅니다.

새 세션을 열고 입력창 아래 `RC`를 누르거나 `/rc-panel`을 입력합니다. 패널 오른쪽 위 ⚙ 버튼을 누르면 설정(언어, 새로 고침, 모두 끄기, 입력창 아래 아이콘 숨기기)이 열립니다.

## 읽는 것과 보내는 것

- **스스로 부르는 도구.** 데스크톱 앱의 세션 도구 세 개만 부르고, 다른 도구는 부르지 않습니다.
  - `mcp__ccd_session_mgmt__list_sessions`와 `mcp__ccd_session_mgmt__get_session`(`self`): Remote Control이 켜진 세션을 읽습니다. 세션이 시작될 때, 1분마다, 패널을 열 때, **새로 고침**을 누를 때 부릅니다. 1분마다 하는 새로 고침은 먼저 권한 확인을 하고, 이미 허용된 도구가 아니면 부르지 않아서 권한 창을 띄우지 않습니다.
  - `mcp__ccd_session_mgmt__set_remote_control`(`enabled: false`): **끄기**나 **모두 끄기**를 누를 때만 부릅니다. 바꿀 때마다 앱이 승인을 묻습니다. Remote Control을 켜는 일은 하지 않습니다.
- **실행하는 프로그램 하나.** 세션 제목을 누르면 `rundll32 url.dll,FileProtocolHandler claude://claude.ai/epitaxy/<세션 id>`를 실행합니다. Windows에서 `claude://` 링크를 여는 방법으로, 데스크톱 앱이 그 세션을 보여 줍니다. 세션 id가 `local_` 뒤에 영문·숫자·하이픈만 오는 모양이 아니면 아무것도 실행하지 않습니다.
- **보내는 것.** 컴퓨터 밖으로 보내는 것이 없습니다. 네트워크 요청을 하지 않고 모델도 부르지 않으므로 토큰을 쓰지 않습니다. 읽은 내용(세션 제목, 폴더, 실행 상태)은 패널에만 보입니다.
- **훅.** `ui.close`는 자기 패널이 닫혔는지 알아채는 데만 쓰고, 이벤트는 그대로 넘깁니다. 명령 `/rc-panel` 하나를 더하고, 입력창 아래 상태 줄에 버튼 하나를 그립니다. 다른 mod가 그 자리에 그린 것은 그대로 둡니다.

## 라이선스

MIT
