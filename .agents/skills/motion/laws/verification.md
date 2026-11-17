# Motion verification

Give each action isolated cases. Each case tests the action's own goal as bounded assertions, in the unit tests or capture checks the project has, because a case that only shows the action establishes nothing. Unit tests of the laws answer the [testing contract](../../contracts/development/testing.md). The assertions cover:

- the distance from effector to target;
- penetration;
- slip of every planted or held contact;
- range-of-motion overshoot;
- balance, as the extrapolated center of mass against the support (Hof 2005);
- continuity of every displayed channel and of its velocity at every cut and at each end of a simulated window.

## Checks that can fail

A check states the bound it tests and tests exactly that bound. A value reported with no bound is a measurement, not a pass.

Measure the displayed result, never the plan's own output. A check that compares two outputs of the same plan, or reads back the target the plan reached, cannot catch the plan being wrong.

Check slip and penetration at a rate that cannot step over the contact, because a strike or a plant can begin and end between two output frames.

Take every bound from the requirement or its study, never widening one until a case passes.

Run the cases across bodies of different statures and proportions, and against different partners and props. Cut each action at every window it declares for a cut, and move its target mid-motion where it tracks one, because films use an action where it is interrupted.

## Frame review

Review stills of every case, in order, from several named views, with `joint` marks where the project's capture offers them and with every held prop drawn at every frame. Numbers alone miss what a still shows at once, such as a bottle that is not where the hand is. Sample the stills in time as [capture](../../visual-debugging/capture.md#times) sets.

## Rounds

Keep each round's capture as [capture](../../visual-debugging/capture.md#rounds) sets, and keep a round only as [correction rounds](../../visual-debugging/correction-rounds.md#comparing-again) allow.
