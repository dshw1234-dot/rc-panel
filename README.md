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

- It reads the session list through the desktop app's own session tools (`list_sessions`, `get_session`) and changes Remote Control through `set_remote_control`.
- The minute-by-minute refresh only calls tools you have already allowed, so it never opens a permission prompt. Buttons you press may.
- It sends nothing over the network and never calls the model, so it uses no tokens.

## License

MIT
