# Git ownership

Stage only your own paths. Commit and push under AGENTS and the [pull-request](../pull-request/SKILL.md) skill.

## The lock

Acquire an atomic lock directory named `campaign.lock` under the common Git directory. Its `owner` file names your role and run marker. Hold the lock from staging through commit and release only your own.

Wait while a lock is held. Only the observer removes another run's lock, after confirming that the run named in its owner file has no process.

## Workers without Git

A read-only worker reports its paths. The coordinator stages and commits them under the lock.

## What does not block

Another worker's unstaged changes or an unrelated production's failing build do not block a film.
