# Motion verification

Test each isolated action's own goal with bounded assertions in unit tests or capture checks. Unit tests answer the [testing contract](../../contracts/development/testing.md). Check:

- the distance from effector to target;
- penetration;
- slip of every planted or held contact;
- range-of-motion overshoot;
- balance for a staged physical outcome or on request, using extrapolated center of mass against the support (Hof 2005);
- continuity of every displayed channel and of its velocity at every cut and at both joins of each prepared physical response.

## Checks that can fail

A check states the bound it tests and tests exactly that bound. A value reported with no bound is a measurement, not a pass.

Measure the displayed result, never the plan's own output. A check that compares two outputs of the same plan, or reads back the target the plan reached, cannot catch the plan being wrong.

Check phase boundaries, the shortest contact and between-frame extrema, locating each extremum with Brent's method. Use a supported swept query where a fast crossing can slip through discrete checks. State the resolution and any unproven interval.

Take every bound from the requirement or its study, never widening one until a case passes.

Cover statures, proportions, partners and props with independent expectations and relations such as symmetry or body scaling. Check branch boundaries, cuts within declared windows and moving tracked targets.

Verify evaluation by its structure rather than a timed workload: preparation runs once, `f(plan, t)` is pure, and no sample recomputes prepared work. Compare sequential, repeated and out-of-order samples at the same times.

## Frame review

Review time-ordered stills from several named views. Show every held prop at every frame and add `joint` marks where supported. Sample under [capture](../../visual-debugging/capture.md#times).

## Rounds

Keep each round's capture as [capture](../../visual-debugging/capture.md#rounds) sets, and keep a round only as [correction rounds](../../visual-debugging/correction-rounds.md#comparing-again) allow.
