# src/motion/locomoteMotion.ts#locomoteMotion

## @evidence contracts/development/implementation.md#principled-implementation

Normalizes direction, rounds nominal cycle count with a one-cycle minimum, compresses the short-trip cycle when needed, and derives velocity from exact distance over baked duration; travelMotion preserves gait seam interpolation and continuous root travel.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This function owns distance/speed sizing and optional heading, while timeScaleMotion owns clip-clock compression and travelMotion owns cycle repetition and root placement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid scalar/vector admission throws; the half-speed floor is an explicit locomotion sizing policy rather than a named-body adjustment, and faceTravel only yaws so vertical direction components do not pitch the rig.

## @evidence contracts/development/common.md#meaningful-documentation

States distance/speed units, exact-arrival sizing, short-trip compression, default strafe behavior and the horizontal-only facing rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sizing is constant work; delegated baking scales with chosen cycle count C times gait keyframes K, plus one O(K) clock copy for short-trip compression, with no additional trajectory sampling. Optional facing shares the private unchanged +Y magnitude preparation after first actual use and still computes every yaw's original trigonometry. Runtime improvement is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The normalized heading serves velocity and facing; unchanged gait data pass directly unless short-trip sizing requires a new clock. One module-owned lazy reader shares only private canonical +Y axis scalars, after the original scalar/vector/clock admission, without retaining heading, yaw or quaternion answers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the baked clip and keyframes; intermediate compressed clips are call-local. The module additionally retains at most one lazy reader and its private fixed +Y direction/length metadata until module release, acquired only for actual facing. No gait, heading, angle, quaternion result, physics handle or task is retained.
