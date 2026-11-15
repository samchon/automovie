---
name: review
description: Runs automovie's Overall Self-Review of a complete change, which any unqualified review request means, and an issue campaign's per-commit Individual Self-Review. Use for every review or self-review.
---

# Review

## Review law

Read the whole declared surface in the current checkout, without splitting it by file, package, or concern, and follow it into consumers, tests, generated output, CI, and platforms.

Judge each finding before acting on it. Fix a defect the change introduces or worsens; report a pre-existing one without fixing it here; drop a preference no rule supports.

How many passes a review takes depends on whether [contracts](../contracts/SKILL.md) evidence covers what changed.

Code that evidence covers gets one complete pass: collect every finding, fix them together by cause, and the review is done. Each declaration already answers its checklists in its doc comment, and CI's evidence job fails a missing answer, so a second pass over the same code repeats what evidence guards and costs hours.

Everything evidence does not cover goes in rounds: skills, `AGENTS.md`, documents, READMEs and the website. Collect a round's findings, fix them together by cause, and run fresh complete rounds until one finds no defect the change introduced, because these have no checklist to show that a fix left nothing behind.

When rounds keep returning findings, look for the change's own design error and simplify or revert, rather than adding a rule or mechanism for each finding. Answering every finding with more text made one small skill change run twelve rounds and grow verbose.

For maintained code, check that each checklist answer is true and complete for its declaration under [contracts](../contracts/SKILL.md). A passing test or renamed wrapper does not prove a cause was fixed.

## Overall Self-Review

The review law over the whole change: the base-to-head diff and any uncommitted work. It grants no authority to push or merge.

Report:

- the single pass over evidence-covered code, and the clean round over everything else;
- every check that could not run;
- every claim fixed in code but not yet proven on a real host.

## Individual Self-Review

In an [issue campaign](../issue-campaign/SKILL.md), the review of one pushed commit's diff. It never replaces Overall Self-Review.
