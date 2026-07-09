---
description: Start (or re-arm) the CreateWorker watcher — one cron that polls your external-worker queue AND dashboard chat every ~10 min while this session stays open.
---

Start the CreateWorker watcher:

1. Run one cycle NOW per `.claude/skills/createworker-watch/SKILL.md` (tasks + chat).
2. If a CreateWorker watcher isn't already scheduled (`CronList`), create ONE durable recurring job
   (`CronCreate`, cron `7,17,27,37,47,57 * * * *` = every ~10 min, `durable: true`) whose prompt is:
   "Run one CreateWorker poll cycle per .claude/skills/createworker-watch/SKILL.md (tasks + chat).
   If there is nothing to do, end quietly."
3. Tell the user: watcher armed — it picks up assigned tasks and answers dashboard chat every ~10 min
   while this session is open; pickups and replies can lag up to ~10 min; it auto-expires after
   7 days (`/watch-createworker` re-arms).

The watcher only runs while this Claude Code session is open — close the session and it stops.
