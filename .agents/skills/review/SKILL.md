---
name: review
description: Runs automovie's overall self-review of a complete change, which any unqualified review request means, and an issue campaign's per-commit individual self-review. Use for every review or self-review.
---

# Review

## Review rules

Read the whole declared surface in the current checkout, without splitting it by file, package or concern, and follow it into consumers, tests, generated output, CI and platforms.

Judge each finding before acting on it. Fix every defect the change introduces or worsens and any pre-existing one inside the task's declared scope, report one outside it without fixing it, and drop a preference no rule supports. A readability or flow finding that rests only on [Writing](../documentation/writing.md)'s definition of clear names the misreading it causes, or it is a preference.

Code that Evidence covers with [contracts](../contracts/SKILL.md) checklists gets one complete pass, which checks that each checklist answer is true and complete for its declaration. CI already fails a missing answer, so a second pass costs hours and repeats that guard. Fix the pass's findings by cause, as the repository's fixing-by-cause rule sets; a passing test or renamed wrapper does not prove a cause was fixed.

Everything Evidence does not cover goes in rounds: skills, `AGENTS.md`, documents, READMEs and the website. Run fresh complete rounds, each fixed by cause, until one finds no defect to fix, because no checklist shows that a fix left nothing behind. Give each round's reviewer the decisions earlier rounds settled, so it does not reopen them.

When rounds keep returning findings, look for the change's own design error and simplify or revert, rather than adding a rule or mechanism per finding. Answering every finding with more text made one small skill change run twelve rounds and grow verbose.

## Overall self-review

The review rules applied to the whole change: the base-to-head diff and any uncommitted work. It reports three things:

- the single pass over Evidence-covered code, and the clean round over everything else;
- every check that could not run;
- every claim fixed in code but not yet proven on a real host.

## Individual self-review

In an issue campaign, the review of one pushed commit's diff. It never replaces the overall self-review.
