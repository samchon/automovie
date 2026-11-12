---
name: review
description: Runs automovie's Overall Self-Review of a complete change, which any unqualified review request means, and an issue campaign's per-commit Individual Self-Review. Use for every review or self-review.
---

# Review

## Review law

Read the whole declared surface in the current checkout, without splitting it by file, package, or concern, and follow it into consumers, tests, generated output, CI, and platforms.

Judge each finding before acting on it. Fix a defect the change introduces or worsens; report a pre-existing one without fixing it here; drop a preference no rule supports.

Collect a round's findings, fix the ones that hold together, then run a fresh complete round. Stop after a complete round finds no defect the change introduced.

When rounds keep returning findings, look for the change's own design error and simplify or revert, rather than adding a rule or mechanism for each finding. Answering every finding with more text made one small skill change run twelve rounds and grow verbose.

For maintained code, check that each checklist answer is true and complete for its declaration under [contracts](../contracts/SKILL.md). A passing test or renamed wrapper does not prove a cause was fixed.

## Overall Self-Review

The review law over the whole change: the base-to-head diff and any uncommitted work. It grants no authority to push or merge.

Report:

- the clean round;
- every check that could not run;
- every claim fixed in code but not yet proven on a real host.

## Individual Self-Review

In an [issue campaign](../issue-campaign/SKILL.md), the review of one pushed commit's diff. It never replaces Overall Self-Review.
