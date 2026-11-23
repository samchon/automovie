# src/everyday/kneelKeys.ts#kneelKeys.still

## @evidence contracts/development/common.md#meaningful-documentation

States the test and its tolerance.

## @evidence contracts/development/implementation.md#principled-implementation

The Euclidean distance of the two toe joints against a tolerance between round-off and a step.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One distance and one comparison, shared by the foot courses and the plant windows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The tolerance is named and derived; nothing is special-cased.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/everyday/kneelKeys.ts#kneelKeys.IFoot

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and its unit.

## @evidence contracts/development/design.md#principled-representation

The toe joint's point, a heading, a pitch and the toes' angle define the foot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, all read by the kneel law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ankle is derived by `HumanFoot.pivot`, not stored.

# src/everyday/kneelKeys.ts#kneelKeys.IKey

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

A root and a foot per side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by the kneel law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No joint angle is stored; the legs are solved from the feet.

# src/everyday/kneelKeys.ts#kneelKeys.IKeys

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The keys in order from standing down, with the frame and the sitting pivot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, all read by the kneel law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The stepped key carries the kneeling root; its height on the way is the law's, found from the legs' reach.

# src/everyday/kneelKeys.ts#kneelKeys.tucked

## @evidence contracts/development/common.md#meaningful-documentation

States the posture, each input and its unit; the namespace gives the toes' rule.

## @evidence contracts/development/implementation.md#principled-implementation

The toes' joint is found on the floor behind the knee where the ankle is a shank from the knee, and the foot's pitch is the one that leaves the ankle at its dorsiflexion range against the shank's slope.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A foot from a distance and a pitch, a bisection for the distance and a fixed-point loop for the pitch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ranges are read from the range table; past the toes' range the toes' joint rises instead of the toes overextending.

## @evidence contracts/development/implementation.md#efficient-algorithms

Six fixed-point pitch updates and the final placement retain all seven 40-step distance bisections. Fixed rotation/socket/toe height prepare once per pitch; each distance trial emits only its observed point instead of a discarded full foot record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses HumanFoot.prepareAt for each fixed-pitch ankle transform; callers solve a foot once and translate it with its knee.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/everyday/kneelKeys.ts#kneelKeys.prepareTurn

## @evidence contracts/development/common.md#meaningful-documentation

States the turn, each input in world metres and the progress the reader takes.

## @evidence contracts/development/implementation.md#principled-implementation

A spherical interpolation of the two arms from the pivot, so the root keeps its distance from the knees when the arms are equally long, as the kneel's thigh-long arms are.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The two arms, their angle and its sine are computed once; the reader forms one weighted sum per progress.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Arms closer than a millionth of a radian return the first root instead of dividing by a vanishing sine.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per phase to prepare and two sines per reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The endpoints and pivot are fixed for a phase, so their arms and angle are shared by every reading of it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader holds two arm vectors, the pivot, the first root and two scalars until its plan is released.

# src/everyday/kneelKeys.ts#kneelKeys.lean

## @evidence contracts/development/common.md#meaningful-documentation

States the tilt, why people make it, each input and the result's unit.

## @evidence contracts/development/implementation.md#principled-implementation

The thigh's slope behind the vertical is the hip-to-ankle line's slope less the angle the two-bone leg puts between that line and the thigh; the tilt is what that slope exceeds the range less `SPARE` by, the greater of the two legs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A law of cosines per leg and one rounded maximum with zero.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The range is read from the range table; the corner at zero is rounded over 2 degrees so the tilt starts without a jump in its speed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads `AutoMovieMotionHumanRange.limit`, as `tucked` does.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work with no algorithm to choose.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/everyday/kneelKeys.ts#kneelKeys.solve

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result; the namespace gives the geometry.

## @evidence contracts/development/implementation.md#principled-implementation

Each place is solved from the thigh, the shank, the knee's radius and the ankle's and toes' ranges.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Standing feet, the kneeling height, the tucked feet, the sitting root, then the key list.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The knee's radius is the shank collider's, marked provisional in the namespace of the law.

## @evidence contracts/development/implementation.md#efficient-algorithms

Solves one tucked foot for a one-knee route, two for both-knee routes, each retaining seven 40-step bisections; sitting-pivot geometry is demanded only by sitBack.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Standing placements are read once per side and the first knee's tucked foot serves every key after the step.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
