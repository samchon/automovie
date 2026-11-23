# src/everyday/prepareKneelPhases.ts#prepareKneelPhases

## @evidence contracts/development/common.md#meaningful-documentation

States fixed inputs, world-metre geometry, index-four route premise and ordered phase readers, leaving clocks and solves with their owners.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates unchanged foot movement classification/pivots/arcs to prepareKneelFoot, the original max(from,to)===4 seated-back arc to kneelKeys.prepareTurn and other actually observed root lines to native Vector3.prepareLerp.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass prepares each existing phase's two feet and only its demanded fixed root line or arc; dynamic balance-course phases acquire neither fixed root reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No phase, key, movement threshold, contact rule, root condition, clearance or progress is changed; other root courses remain in the kneeling law.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) bounded geometry preparation for N phases removes fixed foot/arc/linear-endpoint work from time queries; each query retains the two original foot evaluations and its actual root interpolation, with no unused line preparation for dynamic-course phases.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Body, authored key records, pivot and clearance remain fixed for this plan, so their geometry is equivalent throughout each interval; time and output poses remain independent inputs.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns N two-foot readers and only demanded fixed line/arc readers until release; no query history, solver workspace or fitted pose is retained here.
