---
name: testing
description: Chooses and writes behavioral checks for a production's measurable promises. Use when changing behavior or a requirement that can be measured.
---

# Testing

Test a promised behavior through its actual consumer or computed output. Take expectations and tolerances from the request, physical requirements, or an independent reference. Installed packages own their validation APIs; choose the checks that reach this production's geometry, motion, continuity, timing, or media behavior.

Keep visual and listening judgments in [review](../review/SKILL.md). A source pattern, file inventory, copied output digest, or pixel comparison is not a behavioral test. Add tests where a failure could violate a production promise; do not invent tests for a screenplay or to populate an empty suite.

Put cases in `test/<domain>/test_<name>.ts` as exported `test_*` functions, synchronous or returning `Promise<void>`, with assertions from `node:assert/strict`. [`test/index.ts`](../../../test/index.ts) discovers them. Keep helpers outside those files or unexported. Each exported function answers the [testing checklist](../contracts/testing.md).

Cover the decisions and boundaries the test owns, including intended exceptions. Let the complete round finish, group failures by cause, and repair the source with [development](../development/SKILL.md).
