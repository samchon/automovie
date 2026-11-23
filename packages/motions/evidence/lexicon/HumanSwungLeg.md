# src/lexicon/HumanSwungLeg.ts#HumanSwungLeg.Joints

## @evidence contracts/development/common.md#meaningful-documentation

States the record and its unit.

## @evidence contracts/development/design.md#principled-representation

The posture's own joint record, so a key drops into a posture unchanged.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The keys' and the curve's record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the posture's type rather than restating it.

# src/lexicon/HumanSwungLeg.ts#HumanSwungLeg.Swing

## @evidence contracts/development/common.md#meaningful-documentation

States both ends and their timebase.

## @evidence contracts/development/design.md#principled-representation

Two action seconds, the leave before the landing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `plan` asks of each leg.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A leg that does not swing has no swing (null), not an empty one.

# src/lexicon/HumanSwungLeg.ts#HumanSwungLeg.plan

## @evidence contracts/development/common.md#meaningful-documentation

States what is replaced, inside which window and what is found once.

## @evidence contracts/development/implementation.md#principled-implementation

The keys are fits of the plan's own posture at the window's ends, so the posture just outside the window equals the keyed one at them; inside it the joint curve stands in for a world goal the leg cannot reach.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One wrapper over the plan's posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Outside a window the plan's posture is returned as it was.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan of a swing per leg and plan (`window`); constant work a read after.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The window and its keys are kept per leg for the plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains at most two key sets, released with the plan.

# src/lexicon/HumanSwungLeg.ts#HumanSwungLeg.IKeys

## @evidence contracts/development/common.md#meaningful-documentation

States the window and each key.

## @evidence contracts/development/design.md#principled-representation

The leg's joints at the window's two ends and its middle, with the window in action seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Made by `window`, read by `at` and `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each key holds the same bones, those the fit returned for the leg.

# src/lexicon/HumanSwungLeg.ts#HumanSwungLeg.window

## @evidence contracts/development/common.md#meaningful-documentation

States the scan, the pin test, the window and the keys.

## @evidence contracts/development/implementation.md#principled-implementation

The fits are the shared resolver's, continued frame to frame as the display's leg chain is (Tolani, Goswami and Badler 2000, section 3.2.4), so the ends are the poses shown outside the window; a fit held at a bound is the resolver's projection of a goal past it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan, one test, three keys.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `EDGE` is a named reading tolerance; nothing is tuned to a case.

## @evidence contracts/development/implementation.md#efficient-algorithms

One continued fit of every goal limb and one forward-kinematics pass a frame of the swing, made once per leg and plan: the other limbs continue the frame before's fits (on the first frame placed at the swivels their written joints give, `writtenHumanSeeds`), so only the swung leg's first, middle and landing fits are cold.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The caller keeps the keys for its plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanSwungLeg.ts#HumanSwungLeg.at

## @evidence contracts/development/common.md#meaningful-documentation

States the curve, the bounds and the share.

## @evidence contracts/development/implementation.md#principled-implementation

The quadratic meets each key exactly (s = 0, 1/2, 1), as `HumanMount.between`'s course passes its middle; the range clamp is continuous, so the curve stays continuous where it touches a bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression per angle, one clamp.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The bounds are the range table's and the unloaded ankle's; the foot's bound yields to an end key that is loaded, so no end jumps.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per bone.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
