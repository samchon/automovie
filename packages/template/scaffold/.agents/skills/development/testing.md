# Testing

Test a promised behavior through its actual consumer or computed output. Take expectations and tolerances from the request, physical requirements, or an independent reference. Installed packages own their validation APIs; choose the checks that reach this production's geometry, motion, continuity, timing, or media behavior.

Keep visual and listening judgments in [review](../review/SKILL.md). A source pattern or output copied into expectations does not supply an independent oracle. Inventory, byte or pixel assertions are useful when they check an actual promised behavior against independently established expectations; they cannot establish unobserved visual quality or replace listening. Add tests where a failure could violate a production promise; do not invent tests for a screenplay or to populate an empty suite.

For generated geometry, test each construction operator against an analytic oracle on made inputs, such as the intersection of two orthogonal cylinders against the Steinmetz curve, or a blend's declared continuity at both of its rails. Audit invariants generically over every section and join of the finished form: each section closed and free of self-intersection, each surface continuous, and the declared continuity held across each join. Check each input on the finished form at its own definition, such as a measurement taken at its site the way it is defined. A per-part test that recomputes the construction's formulas passes whatever the construction does.

Put cases in `test/<domain>/test_<name>.ts` as exported `test_*` functions, synchronous or returning `Promise<void>`, with assertions from `node:assert/strict`. [`test/index.ts`](../../../test/index.ts) discovers them. Keep helpers outside those files or unexported. Each exported function answers the [testing checklist](../contracts/testing.md).

Cover the decisions and boundaries the test owns, including intended exceptions. Let the complete round finish, group failures by cause, and repair the source with [development](SKILL.md).
