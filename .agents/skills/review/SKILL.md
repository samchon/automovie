---
name: review
description: Runs automovie's Overall Self-Review of a complete change, which any unqualified review request means, and an issue campaign's per-commit Individual Self-Review. Use for every review or self-review.
---

# Review

## Review Law

- Read the whole declared surface in the current checkout, without splitting it by file, package, or concern, and follow it into consumers, tests, rendered output, CI, and platforms.
- Collect a round's findings, fix them together, then run a fresh complete round. Stop only after a complete round finds nothing.
- Check that each checklist answer is true of its declaration under [contracts](../contracts/SKILL.md). A passing test or renamed wrapper does not prove a cause was fixed.
- Judge appearance and motion only from rendered frames.
- A failed name search does not prove a capability missing, and a symbol does not prove it reachable: check the type's JSDoc and exclusions, the runtime caller, and whether the result reaches a frame.

## Overall Self-Review

The review law over the whole change: the base-to-head diff and any uncommitted work. Report the clean round, every check that could not run, and every claim not yet proven on a real host or in a render. It grants no authority to push or merge.

## Individual Self-Review

In an issue campaign, the review of one pushed commit's diff. It never replaces Overall Self-Review.
