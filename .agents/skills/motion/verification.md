# Verify a motion

Give each action isolated cases. Each case's checks test the action's own goal as bounded assertions, in the unit tests or capture checks the project has:

- the distance from effector to target;
- penetration;
- slip of every planted or held contact;
- range-of-motion overshoot;
- balance, as the extrapolated centre of mass against the support (Hof 2005);
- continuity of every displayed channel and of its velocity at every cut.

A case that only shows the action establishes nothing.

## Checks that can fail

- A check states the bound it tests and tests exactly that bound. A value reported with no bound is a measurement, not a pass.
- Measure the displayed result, never the plan's own output. A check that compares two outputs of the same plan, or reads back the target the plan reached, cannot catch the plan being wrong.
- Take every bound from the requirement or its study. Widening a bound until a case passes hides the defect the case exists to find.
- Run the cases across bodies of different statures and proportions, and against different partners and props. A pass on one body establishes nothing about another.
- Cut each action at every window its interrupt table lists, and move its target mid-motion where it tracks one. A law checked only from start to end has not been checked where films use it.

## Look at the frames

Review still images of every case from several named views, with a joint overlay where the project's capture offers one and with every held prop drawn at every frame. Numbers alone miss what a still shows at once: a carry crossed in one split lunge, or a bottle that is not where the hand is.

Match the spacing of the stills to what they must show. Around every contact, cut and decisive instant, review the output's own consecutive frames, because a contact shorter than the gap between two stills leaves an arm out and an arm back with nothing wrong between them. A sparser, even spacing serves only what changes slowly: staging, travel and camera.

A reviewer who sees motion only as stills says so, and claims nothing about how it plays that the stills do not show.

## Judge rounds honestly

Judge a rerun by the time of the files it wrote, because a rerun overwrites its stills and records in place. When a fix is tried in rounds, keep a round only if no case got worse than the best earlier round, and record every remaining failure with its numbers.

Unit tests of the laws answer the [testing contract](../contracts/development/testing.md).
