# Verify a motion

Give each action isolated capture cases. Each case carries verdicts that test the action's own goal:

- the distance from effector to target;
- penetration;
- slip of every planted or held contact;
- range-of-motion overshoot;
- balance, as the extrapolated centre of mass against the support (Hof 2005);
- continuity of every displayed channel and of its velocity at every cut.

A case that only shows the action passes nothing.

## Verdicts that can fail

- A verdict prints exactly the band it tests. A value printed with no bound is a metric, and a check that cannot fail does not count toward the action's pass count.
- Measure the displayed result, never the plan's own output. A check that compares two outputs of the same plan, or reads back the target the plan reached, cannot catch the plan being wrong.
- Take every bound from the requirement or its study. Widening a bound until a case passes hides the defect the case exists to find.
- Run the cases across bodies of different statures and proportions, and against different partners and props. A pass on one body establishes nothing about another.

## Look at the frames

Review consecutive stills of every case from several named views, with a joint overlay, and with every held prop drawn at every frame. Numbers alone miss what a still shows at once: a carry crossed in one split lunge, or a bottle that is not where the hand is.

## Judge rounds honestly

Read each case's result from the output file it writes, and check that file's time against the change under test, because a rerun overwrites the files in place.

When a fix is tried in rounds, keep a round only if no case got worse than the best earlier round, and record every remaining failure with its numbers.

Unit tests of the laws follow the [testing contract](../contracts/development/testing.md): expected values come from the study or the requirement, never from the law's own constants.
