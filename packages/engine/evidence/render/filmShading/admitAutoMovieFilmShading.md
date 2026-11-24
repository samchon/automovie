# src/render/filmShading/admitAutoMovieFilmShading.ts#admitAutoMovieFilmShading

## @evidence contracts/development/common.md#meaningful-documentation

States every check, the optics dependency, the error's content and when the draw host calls it.

## @evidence contracts/development/implementation.md#principled-implementation

Each check is a range `IAutoMovieFilmShading` states; occlusion needs optics because its prepass and result live beside the linear target only optics create. The 2048-probe bound is the texture height every WebGL 2 renderer must support, since the renderer stores one probe per texture row.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Mirrors `admitAutoMovieFilmOptics`: one function per film member, throwing at the first refused field.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Nothing is defaulted or repaired.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per draw: the probe count is a product of three axis counts, never a list of positions.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure; a film's shading can change at any second, so it is admitted at every draw.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
