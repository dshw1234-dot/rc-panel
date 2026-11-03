# RC Panel

[한국어](README.ko.md)

A side panel for the Claude desktop app that shows which of your sessions have Remote Control on, and turns Remote Control off for one session or for all of them. Remote Control is switched on session by session, so it is easy to lose track of which sessions are still reachable from your phone or claude.ai. RC Panel puts them in one list.

## Features

- **One list:** every session on this computer with Remote Control on, this session first.
- **Status:** each card shows the folder, whether the session is running (●) or idle (○), and marks the current session.
- **Turn off:** a button on each card, and **Turn all off** in the settings box. The app asks you to approve each change.
- **Open by clicking:** click a title to open that session in the app.
- **Quick toggle:** a dim `RC` button below the prompt opens and closes the panel and shows how many sessions are on (`RC 5`). `/rc-panel` does the same. The button can be hidden in the settings.
- **Korean and English:** the language you pick is remembered.

The list refreshes itself every minute.

## Install

Needs the Claude desktop app and the Claude Code CLI. At the prompt of a terminal session:

```
/plugin install rc-panel --marketplace dshw1234-dot/rc-panel
```

Answer `y` to add the marketplace, then pick the user scope. From a shell:

```bash
claude plugin install rc-panel --marketplace dshw1234-dot/rc-panel
```

In the desktop app, where `/plugin` does not run: click + next to the prompt box, then Plugins, Add marketplace with `dshw1234-dot/rc-panel`, then Add plugin.

Open a new session, and click `RC` below the prompt or type `/rc-panel`. The ⚙ button at the top right of the panel opens the settings: language, refresh, turn all off, and hide the icon below the prompt.

## What it reads and sends

- **Tools it calls itself.** The mod calls three of the desktop app's own session tools, never any other tool:
  - `mcp__ccd_session_mgmt__list_sessions` and `mcp__ccd_session_mgmt__get_session` (with `self`), to read which sessions have Remote Control on. It calls them when a session starts, every minute, when you open the panel and when you press **Refresh**. The minute-by-minute refresh first asks the permission check and skips the call unless the tool is already allowed, so it never opens a permission prompt.
  - `mcp__ccd_session_mgmt__set_remote_control` with `enabled: false`, only when you press **Turn off** or **Turn all off**. The app asks you to approve each change. The mod never turns Remote Control on.
- **The one program it starts.** When you click a session's title, it runs `rundll32 url.dll,FileProtocolHandler claude://claude.ai/epitaxy/<session id>`, the Windows way to open a `claude://` link, so the desktop app shows that session. The session id must look like `local_` followed by letters, digits and dashes, or nothing runs.
- **What it sends.** Nothing leaves your computer: the mod makes no network requests and never calls the model, so it uses no tokens. What it reads (session titles, folders, running state) stays in the panel.
- **Hooks.** It hooks `ui.close` only to notice that its own panel was closed, then passes the event on unchanged. It adds one command, `/rc-panel`, and draws a button in the footer below the prompt, leaving whatever other mods draw there in place.

## License

MIT
