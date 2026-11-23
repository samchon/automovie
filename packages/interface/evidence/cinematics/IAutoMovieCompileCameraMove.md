# src/cinematics/IAutoMovieCompileCameraMove.ts#IAutoMovieCompileCameraMove

## @evidence contracts/development/design.md#principled-representation

IProps carries a staged lens and timed measured subjects; world metres, degrees and shot-local seconds remain distinct in its member contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Hero and alternate-take compilers use the same inputs to compileCameraMove; no rendering or platform state is exposed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required camera and action records reuse canonical types, with the sole optional aspect fallback explicitly described.

## @evidence contracts/development/common.md#meaningful-documentation

IProps explains path generation, ordering, aspect assumptions and synchronous subject sampling.

# src/cinematics/IAutoMovieCompileCameraMove.ts#IAutoMovieCompileCameraMove.IProps

## @evidence contracts/development/design.md#principled-representation

Positions and subject bounds use world metres, camera fovY uses degrees and actions use shot-local seconds. performShot gates timing and camera inputs; this low-level compiler does not validate all numerical premises or guarantee visible enclosure between keys.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Hero and coverage compilation share the same camera/action/subject contracts and differ only in their staged camera, entries and clip identity.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The optional aspect has a stated square fallback; it is not evidence that a narrower output contains the subject. No camera or subject identity changes the grammar.

## @evidence contracts/development/common.md#meaningful-documentation

Defines world placement, timebase, aspect fallback, input ordering, callback lifetime and the null/error outcomes.
