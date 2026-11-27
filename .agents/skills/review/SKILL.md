---
name: review
description: Runs automovie's self-review of a change.
---

# Review

## Review rules

Read the declared scope as a whole in the current checkout each round. Trace it through consumers, tests, generated output, CI and supported platforms.

Fix defects introduced, worsened or already present within the scope. Report defects outside it. For a finding based on the [writing rules](../documentation/SKILL.md), name the misreading it causes. Discard unsupported preferences.

Review Evidence-covered code once under [contracts](../contracts/SKILL.md). Check that each answer is true and complete. Verify the fix at the cause.

Review work outside Evidence in complete rounds. Fix each round's findings by cause until a round finds no defect. Give each reviewer the decisions settled in earlier rounds.

When findings recur, check the design and simplify or revert it.

## Overall self-review

Review the base-to-head diff and uncommitted work. Report:

- the single pass over Evidence-covered code, and the clean round over everything else;
- every check that could not run;
- every claim fixed in code but not yet proven on a real host.

## Individual self-review

In an issue campaign, review one pushed commit's diff. The whole change still needs an overall self-review.
