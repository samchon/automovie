# src/film/createPerformShotSubjectFramer.ts#createPerformShotSubjectFramer

## @evidence contracts/development/implementation.md#principled-implementation

Places portable subject boxes and reduces their union through framedBoxOf so framing at the move start accounts for mass width as well as height. This excludes unmeasured external bytes and renderer-only deformation. Group following updates the union's base while retaining the height and radius measured at the move start.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The framing measurement of `performShot` in one factory, reusing the subject-box helpers the shot-contract grade reads, so the camera is solved for the box it is graded against.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every subject kind follows a stated measurement and fallback order; no actor, prop or formation is special-cased, and the live resolver is not asked for a group because one point cannot describe a mass.

## @evidence contracts/development/common.md#meaningful-documentation

States when it is built and why then, that hero and coverage share it, how a group and a point subject are measured with their fallbacks, which subjects move and by what, and the meaning of each parameter.

## @evidence contracts/development/implementation.md#efficient-algorithms

Indexes driven node identities in one track pass. Samples the object track sequence once at the current instant, then reads each baked placement in constant map work. Models and formation member extents are measured on first use. Missing model extents may query the supplied skeleton on each group read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Caches one sampled channel map for the same instant and immutable shot clips. Reuses portable extents by node and formation, and retains the chosen actor movement readers for each group.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The factory retains staged and driven node indexes, extent maps and one current channel map. Replacing the sample releases the previous map. Per-sample group boxes are temporary.
