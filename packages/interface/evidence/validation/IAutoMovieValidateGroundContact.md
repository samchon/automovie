# src/validation/IAutoMovieValidateGroundContact.ts#IAutoMovieValidateGroundContact.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Sample FK and compare configured foot points and valid capsule endpoints to scalar/height-source ground minus tolerance. Member documentation states the supplied records, units and absence meanings used by validateGroundContact.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional capsule proxies extend foot-point coverage without pretending to measure the whole mesh; missing/detached capsule bones remain errors and physicsIntent only changes plausibility expectations.

## @evidence contracts/development/design.md#principled-representation

motion and skeleton provide FK in a shared metre frame; groundY is a constant height or x/z-to-y source, tolerance is penetration metres and sampleRate is hertz.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieValidateGroundContact.IProps, used by validateGroundContact. Its motion, skeleton, footBones, capsules, groundY, tolerance, sampleRate, path, jointAxes, restFrames, physicsIntent members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
