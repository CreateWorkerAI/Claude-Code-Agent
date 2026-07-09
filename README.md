# Claude-Code-Agent

Turn [Claude Code](https://code.claude.com/docs) into a [CreateWorker](https://www.createworker.com)
AI agent — it claims tasks you assign in CreateWorker, does the work, and submits results for you to
approve. It answers your dashboard chat too.

> Requires Claude Code, a CreateWorker account with an API key (dashboard → **Developer**), and
> Node 18+ for the setup script.

## How it works

CreateWorker holds an **external worker** — a worker whose tasks are *not* run by CreateWorker's own
models but handed to your own agent. This repo is that agent: a Claude Code project with a watcher
that polls CreateWorker, claims each assigned task, does the work per your `CLAUDE.md`, and submits a
deliverable. You approve (or reject) it in CreateWorker. It answers dashboard chat the same way.

```
CreateWorker task / chat   ->   Claude Code (this repo)   ->   deliverable   ->   you approve
  assigned to your                claim -> do the work           (IN_REVIEW)       in CreateWorker
  external worker
```

A human stays in the loop: your Claude Code does the work, and nothing counts until you approve it.

## Quick start

**1. Get the template.** `git clone` this repo (or **Use this template** on GitHub) and open a
terminal in the folder.

**2. Get an API key** from your CreateWorker dashboard → **Developer**. It needs the scopes
`tasks:read`, `tasks:write`, `deliverables:write`, and — for chat — `chat:read`, `chat:write`.

**3. Connect the CreateWorker MCP** — pick one:

- *Easiest (guaranteed):* register it with your key (stored in your local Claude config, not this repo):
  ```bash
  claude mcp add --transport http createworker https://www.createworker.com/api/mcp \
    --header "Authorization: Bearer cw_live_..."
  ```
  Using this? Delete the bundled `.mcp.json` to avoid a duplicate.
- *Or keep the bundled `.mcp.json`* (already points at CreateWorker) and give it your key via an
  environment variable it reads:
  ```bash
  export CREATEWORKER_API_KEY=cw_live_...       # macOS / Linux
  $env:CREATEWORKER_API_KEY="cw_live_..."       # Windows PowerShell
  ```
  To keep the key in a gitignored file instead, copy `.claude/settings.local.json.example` to
  `.claude/settings.local.json` and paste it there.

Start Claude Code and run `/mcp` — you should see **createworker** connected.

**4. Create an external worker:**
```bash
CREATEWORKER_API_KEY=cw_live_... node scripts/setup.mjs                     # list your workers
CREATEWORKER_API_KEY=cw_live_... node scripts/setup.mjs make-external <id>  # flag one external
CREATEWORKER_API_KEY=cw_live_... node scripts/setup.mjs create "My Agent"   # ...or create a fresh one
```
Or in the dashboard: open a worker and turn **External Worker** on.

**5. Tell your agent what to do.** Edit `CLAUDE.md` — or copy a ready-made one from `examples/`:
```bash
cp examples/code-agent.md CLAUDE.md        # an agent that ships GitHub PRs
cp examples/research-agent.md CLAUDE.md    # an agent that writes cited findings
```

**6. Run it.** In Claude Code, run `/watch-createworker`. It picks up assigned tasks and answers chat
every ~10 minutes while the session is open. Assign a task to your external worker (or chat with it)
and watch it get claimed, worked, and delivered for your approval.

## Configuration

| Variable | Required | Default |
|----------|----------|---------|
| `CREATEWORKER_API_KEY` | yes | — |
| `CREATEWORKER_BASE_URL` | no | `https://www.createworker.com` |

The watcher runs only while a Claude Code session is open on your machine; close it and it stops. It
polls, so pickups and chat replies lag up to the poll interval (default ~10 min — edit
`.claude/commands/watch-createworker.md` to change the cadence).

## What's in here

| Path | What |
|------|------|
| `.mcp.json` | CreateWorker MCP server (reads `${CREATEWORKER_API_KEY}`) |
| `CLAUDE.md` | your agent's instructions — the one file to customize |
| `.claude/skills/createworker-watch/` | the poll -> claim -> work -> deliver + chat loop |
| `.claude/commands/watch-createworker.md` | `/watch-createworker` — arms the ~10-min watcher |
| `.claude/settings.json` | pre-allows the CreateWorker MCP tools so the watcher runs unattended |
| `scripts/setup.mjs` | verify your key, list / create / flag workers |
| `examples/` | ready-made `CLAUDE.md` files (code agent, research agent) |

## Safety

Two things keep this safe. **You approve** every deliverable in CreateWorker before it counts, and
**Claude Code's permissions** gate what your agent can actually do on your machine — `.claude/settings.json`
only pre-allows the CreateWorker tools, so anything else (editing files, running commands, pushing
code) follows Claude Code's normal permission prompts until you allow it. Set clear limits in your
`CLAUDE.md`, and for unattended runs add Claude Code hooks to hard-block anything you never want it to
do. The API key is scoped to your organization, so only your own tasks and chat reach the agent —
keep it out of git (an env var or the gitignored `.claude/settings.local.json`).

## Troubleshooting

- **`/mcp` doesn't show createworker** — your key isn't reaching the MCP. Use the `claude mcp add`
  command in step 3 (the guaranteed path), or make sure `CREATEWORKER_API_KEY` is set in the shell you
  launched Claude Code from.
- **Tasks aren't picked up** — confirm the worker is external (`node scripts/setup.mjs`) and that
  `/watch-createworker` is armed in an open session. Tasks only move when a cycle runs.
- **A task is stuck `IN_PROGRESS`** — a claimed task with no progress auto-returns to `ASSIGNED` after
  a few hours; or reject it in the dashboard to re-queue it.

## License

MIT
