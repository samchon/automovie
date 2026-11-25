# src/production/IAutoMovieCompileAttach.ts#IAutoMovieCompileAttach.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Bake the `attachTo` verb into the child object's follow clip, the per-frame realisation of a rigid coupling to a parent's bone (a sword in a hand, a prop on a saddle). The child is not a rig, so, like a projectile, it moves by a node clip of translation and rotation tracks, not a pose motion. Member documentation states the supplied records, units and absence meanings used by compileAttach.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The callback contract exposes a synchronous transform lookup rather than a particular scene implementation; its frame and lifetime obligations are documented on the member.

## @evidence contracts/development/design.md#principled-representation

Attachment timing uses shot-local seconds and parentTransformAt supplies the parent frame at the requested instant; the input keeps the authored attachment and compiled motion context together.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieCompileAttach.IProps, used by compileAttach. Its child, bone, offset, parentTransform, parentTransformAt, parentSkeleton, parentMotion, start, duration, shotDuration, fps, jointAxes, restFrames members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
