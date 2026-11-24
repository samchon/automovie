# src/lexicon/HumanBikeGuidePath.ts#HumanBikeGuidePath.IStep

## @evidence contracts/development/common.md#meaningful-documentation

States both members and their units.

## @evidence contracts/development/design.md#principled-representation

A print's path distance in metres and its landing in action seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by `run` and read by the bicycle guide's prints.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: both members always present.

# src/lexicon/HumanBikeGuidePath.ts#HumanBikeGuidePath.IPath

## @evidence contracts/development/common.md#meaningful-documentation

States each sampled series, its unit and that the distances never decrease.

## @evidence contracts/development/design.md#principled-representation

Four series of one length: action seconds, root path distance in metres (nondecreasing), world root points in metres and the bicycle's heading change in degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Sampled once by the bicycle guide's plan and read by its path functions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The nondecreasing distance is a runtime invariant of the sampling, not encoded in the type.

# src/lexicon/HumanBikeGuidePath.ts#HumanBikeGuidePath.stops

## @evidence contracts/development/common.md#meaningful-documentation

States what counts as a stop and that the path's end is always one.

## @evidence contracts/development/implementation.md#principled-implementation

A stop is the start of a pause at least one swing time (`SWING`) long, after which the athlete would plant both feet; the path's end closes the last run.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `HumanBikeGuide` with the other path reads: one pass over the samples.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

`SWING` is provisional (about 40 % of a one-second stride); the 1e-5 m motion and 1 mm stop separations are numerical floors.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the path.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanBikeGuidePath.ts#HumanBikeGuidePath.run

## @evidence contracts/development/common.md#meaningful-documentation

States the step length rule, the remainder rule, the landing and the closing step.

## @evidence contracts/development/implementation.md#principled-implementation

The step is the walking step (0.41 of stature; Murray, Drought and Kory 1964) or, where the bicycle runs faster, its speed over the running cadence (2.8 steps a second; Heiderscheit et al. 2011); each lands as the root comes half a step short of its print.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `HumanBikeGuide` with the other path reads: one loop of steps from a stop to the next.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The quarter-step join and the closing step's landing halfway through the last step's second half carry no cited source.

## @evidence contracts/development/implementation.md#efficient-algorithms

One binary search per step over the samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the path.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanBikeGuidePath.ts#HumanBikeGuidePath.indexAt

## @evidence contracts/development/common.md#meaningful-documentation

States what index it returns.

## @evidence contracts/development/implementation.md#principled-implementation

A lower-bound binary search over the nondecreasing distances.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One search, shared by the steps and the prints.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Logarithmic in the samples.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of the path.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
