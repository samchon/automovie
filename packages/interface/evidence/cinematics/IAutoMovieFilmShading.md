# src/cinematics/IAutoMovieFilmShading.ts#IAutoMovieFilmShading

## @evidence contracts/development/design.md#principled-representation

The indirect shading a film asks for at one second, beside its optics; each member is optional and absent means the step is skipped. The dependency on optics and every range are the author's documented contract; the engine runs no runtime check of them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The interface package owns it; the engine admits it, render's `AutoMovieFilmIndirectStage` reads it through `IAutoMovieDrawScene.shading`, and the scaffold's `IFilmProduction.shading` returns it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member names a scene or a production; absence rather than a zero radius means no occlusion.

## @evidence contracts/development/common.md#meaningful-documentation

States who supplies it and when, its dependency on optics, what it never changes, the per-frame independence and the admission owner.

# src/cinematics/IAutoMovieFilmShading.ts#IAutoMovieFilmShading.IOcclusion

## @evidence contracts/development/design.md#principled-representation

One world radius in metres, the only authored quantity of ground-truth-based ambient occlusion; slice and step counts are fixed by the contract.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The occlusion pass reads `radius`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No sample counts or falloff curves are exposed, because they are the renderer's estimator, not a film's look.

## @evidence contracts/development/common.md#meaningful-documentation

States the cited method, its slice and step counts, which light it multiplies and how to choose the radius.

# src/cinematics/IAutoMovieFilmShading.ts#IAutoMovieFilmShading.IProbes

## @evidence contracts/development/design.md#principled-representation

A world box in metres, a pitch in metres, a renderer layer and a revision naming the layer's lit state; the box order, ranges and the layer bounds are the author's documented contract, with no runtime check.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The bake reads box, pitch and layer; the revision is the reuse key, which exists because a bake is far costlier than a frame and the film alone knows when its static light changed.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No resolution or bounce count is exposed: the cube size and the single bounce are fixed by the contract.

## @evidence contracts/development/common.md#meaningful-documentation

States the cited methods, the bake's content and exclusions, validity, interpolation, the outside-box rule, the one-bounce rule and what the revision promises.
