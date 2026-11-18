# Motion verification

Test each isolated action's own goal with bounded assertions in unit tests or capture checks. Unit tests answer the [testing contract](../../contracts/development/testing.md). Check:

- the distance from effector to target;
- penetration;
- slip of every planted or held contact;
- range-of-motion overshoot;
- balance for a staged physical outcome or on request, using extrapolated center of mass against the support (Hof 2005);
- continuity of every displayed channel and of its velocity at every cut and at each end of a simulated window.

## Checks that can fail

A check states the bound it tests and tests exactly that bound. A value reported with no bound is a measurement, not a pass.

Measure the displayed result, never the plan's own output. A check that compares two outputs of the same plan, or reads back the target the plan reached, cannot catch the plan being wrong.

Sample slip and penetration densely enough to cover the shortest contact.

Take every bound from the requirement or its study, never widening one until a case passes.

Test across statures, proportions, partners and props. Cut in every declared window and move tracked targets mid-action.

## Frame review

Review time-ordered stills from several named views. Show every held prop at every frame and add `joint` marks where supported. Sample under [capture](../../visual-debugging/capture.md#times).

## Rounds

Keep each round's capture as [capture](../../visual-debugging/capture.md#rounds) sets, and keep a round only as [correction rounds](../../visual-debugging/correction-rounds.md#comparing-again) allow.
