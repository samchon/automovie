# src/posture/writtenHumanSeeds.ts#writtenHumanSeeds

## @evidence contracts/development/common.md#meaningful-documentation

States where the placement comes from, what a fit prescribed by it does instead of a cold sweep, and the limbs it gives none.

## @evidence contracts/development/implementation.md#principled-implementation

The swivel and bend branch are the redundant coordinates of a two-bone limb on its goal (Tolani, Goswami and Badler 2000, section 3.2.4); the posture's own written joints are the reference a law states for the limb, so the limb is placed on its goal at the swivel those joints give, read in closed form (`HumanLimbFit.seed`) and prescribed, refined from it only where that placement does not stand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One goal-free resolve, then one closed-form seed per goal limb without a planned seed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No search and no tuned value: the seed is the written chain's own, at the fit's stated resolution (`hingedArmSwivel.RESOLUTION`).

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward-kinematics assembly of the posture without its goals and one closed-form seed per goal limb, each limb then placed in closed form where the placement stands, in place of a cold sweep of every swivel per goal limb per read. A goal carrying its law's planned seed needs no written one, and a posture whose every goal carries one is not assembled here at all.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments; its callers resolve once per read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.