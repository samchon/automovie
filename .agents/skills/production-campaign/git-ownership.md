# Git ownership

Workers of one campaign share one Git index, so each stages only its own paths and commits under a lock.

A worker never mixes in or unstages another worker's staged changes, because a commit takes whatever is staged.

## The lock

Hold an atomic lock in the common Git directory from staging through commit, with an owner file naming your role and run marker, then release only your own lock:

```bash
lock="$(git rev-parse --git-common-dir)/campaign.lock"
mkdir "$lock" && echo "<role> <run marker>" > "$lock/owner"
```

Wait while a lock is held. Only the observer removes another run's lock, after confirming that the run named in its owner file has no process.

## Workers that cannot write to Git

Codex's `workspace-write` sandbox keeps `.git` and `.agents` read-only, so a Codex worker under it neither stages, takes the lock nor commits. It reports its paths, and the coordinator stages and commits them under the lock unless the user grants the worker broader access.

## What does not block

Another worker's unstaged changes or an unrelated production's failing build do not block a film. Commit and push authority follows AGENTS and the [pull-request](../pull-request/SKILL.md) skill.
