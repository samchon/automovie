# Verify a motion

Give each action isolated cases. Each case's checks test the action's own goal as bounded assertions, in the unit tests or capture checks the project has:

- the distance from effector to target;
- penetration;
- slip of every planted or held contact;
- range-of-motion overshoot;
- balance, as the extrapolated center of mass against the support (Hof 2005);
- continuity of every displayed channel and of its velocity at every cut.

A case that only shows the action establishes nothing.

## Checks that can fail

A check states the bound it tests and tests exactly that bound. A value reported with no bound is a measurement, not a pass.

Measure the displayed result, never the plan's own output. A check that compares two outputs of the same plan, or reads back the target the plan reached, cannot catch the plan being wrong.

Check slip and penetration at a rate that cannot step over the contact, because a strike or a plant can begin and end between two output frames.

Take every bound from the requirement or its study. Widening a bound until a case passes hides the defect the case exists to find.

Run the cases across bodies of different statures and proportions, and against different partners and props, because a pass on one body establishes nothing about another. Cut each action at every window it declares for a cut, and move its target mid-motion where it tracks one, because films use an action where it is interrupted.

## Look at the frames

Review stills of every case, in order, from several named views, with a joint overlay where the project's capture offers one and with every held prop drawn at every frame. Numbers alone miss what a still shows at once: a carry crossed in one split lunge, or a bottle that is not where the hand is.

Sample the stills in time as [capture](../visual-debugging/capture.md#times) sets, with the output's own consecutive frames around every contact, cut and decisive instant, and claim nothing about how the motion plays that the stills do not show.

## Judge rounds honestly

Keep each round's capture as [capture](../visual-debugging/capture.md#rounds) sets, and keep a round only as [correction rounds](../visual-debugging/correction-rounds.md#compare-again) allow.

Unit tests of the laws answer the [testing contract](../contracts/development/testing.md).
