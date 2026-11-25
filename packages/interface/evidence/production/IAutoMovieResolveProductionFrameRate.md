# src/production/IAutoMovieResolveProductionFrameRate.ts#IAutoMovieResolveProductionFrameRate.IProps

## @evidence contracts/development/common.md#meaningful-documentation

The exact frame rate a record carries beside its `fps` display scalar, in lowest terms. Member documentation states the supplied records, units and absence meanings used by resolveProductionFrameRate.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Safe integer and positivity checks belong to the rate resolver; numeric fields alone do not establish a valid or exactly representable timebase.

## @evidence contracts/development/design.md#principled-representation

The frame-rate input preserves the existing scalar/rational representation and resolves it to the production's canonical positive rational clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieResolveProductionFrameRate.IProps, used by resolveProductionFrameRate. Its fps, frameRate members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
