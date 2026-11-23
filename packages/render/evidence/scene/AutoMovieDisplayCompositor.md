# src/scene/AutoMovieDisplayCompositor.ts#AutoMovieDisplayCompositor

## @evidence contracts/development/design.md#principled-representation

Resolved RGBA8 framebuffer copies preserve each source's display transform; the shader interpolates rounded display bytes and reverses native sRGB encoding only when the destination will encode again. Float32 thresholds can differ from CPU Float64 by one byte.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One compositor owns the three display copies and one full-screen quad; source callbacks keep scene rendering with their existing owners and framebuffer restoration stays in the shared capture helper.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Uses public renderer reset and framebuffer-copy APIs to synchronize context state; no native bindings or renderer internals are replaced, and the same byte operator serves all scenes.

## @evidence contracts/development/common.md#meaningful-documentation

Describes display-byte rather than radiance composition, alpha association, the associated-alpha mix that `mixAutoMovieStraightAlpha` states on bytes, the fade toward black or transparency, destination encoding, precision limits, and caller ownership of the destination.

# src/scene/AutoMovieDisplayCompositor.ts#AutoMovieDisplayCompositor.prototype.resize

## @evidence contracts/development/implementation.md#principled-implementation

Admits positive safe-integer drawing-buffer extents and attempts all three old-copy retirements before publishing new images/upload generations. Failure independently retires the quad and retains the closed owner, old potential extent and original causes; reentrant mutations refuse during retirement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One retirement boundary controls the three equal copy extents, with the same terminal failure state used by final disposal rather than an untracked resize recovery allocation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Equal extents reuse an open owner, while a failed old allocation cannot be hidden by new dimensions, retry or another draw. Native public release failure is not treated as physical retirement.

## @evidence contracts/development/common.md#meaningful-documentation

States drawing-buffer units, success-only extent publication and failed closed-owner retention/refusal, distinguishing invalid-dimension preflight from failed native release.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visits exactly three texture wrappers and, on failure, two quad resources with a fixed-size failure list. Supported success reallocates on subsequent upload; failed owners allocate no new images or native draws.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equal dimensions retain open copy allocations without disposal/upload changes. Failed resize shares its stored failure with later resize, draw and disposal instead of repeating any native attempt.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

All old-copy releases are attempted before changing extents. A failure retains the previous copy bounds/references and attempts remaining geometry/material release once; physical uncertainty follows the failed owner until its renderer/context lifetime ends.

# src/scene/AutoMovieDisplayCompositor.ts#AutoMovieDisplayCompositor.prototype.render

## @evidence contracts/development/implementation.md#principled-implementation

Saves canvas bytes before drawing callbacks, composes quantized straight display channels with alpha association and destination sRGB correction, then independently restores framebuffer and renderer state; Float32 rounding is the documented precision limit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Source rendering stays in callbacks, copy synchronization stays in copyDisplay and shared restoration aggregation preserves the primary error before cleanup causes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Source callbacks must return on the default framebuffer; the renderer's public reset boundary synchronizes native texture units without patching foreign methods or private cache entries.

## @evidence contracts/development/common.md#meaningful-documentation

Describes fade versus two-source draws, independent restoration attempts and the saved-canvas recovery attempt without guaranteeing that recovery succeeds when its native draw fails.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs one backing copy, one or two source renders and one full-screen blend over width times height pixels, avoiding CPU readback; restoration can add one backing draw.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the instance's persistent copies and shader for every frame; each callback is invoked because its effects and newly sampled pixels cannot be shared merely by matching alpha.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrows renderer and destination without disposing them and retains the instance's three copies. Independently attempts target, viewport, scissor, clear and tone restoration after success or failure; a restoration failure remains visible and may leave partial host state.

# src/scene/AutoMovieDisplayCompositor.ts#AutoMovieDisplayCompositor.prototype.dispose

## @evidence contracts/development/implementation.md#principled-implementation

Closes before independently disposing the three copies, quad geometry and shader material; a single failure keeps its identity, multiple causes retain attempt order and repeated callers receive the same stored completion.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The disposal list mirrors the compositor's owned allocations and excludes the borrowed renderer, scene callbacks and destination target.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No cleanup failure is swallowed or converted into a successful physical-retirement claim.

## @evidence contracts/development/common.md#meaningful-documentation

States exact owned resources, terminal render/resize refusal and one-attempt repeated completion rather than asserting native physical release after a listener failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Attempts a fixed five resources with a failure list bounded by those five calls, independent of rendered frame count.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Exactly one physical disposal attempt serves all calls to this owner; successful repeats return and failed repeats throw the original stored cause, preventing native retries and false success.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Attempts all owned public release operations and closes future use; resource references remain with the owner on failed/indeterminate retirement, with physical release unverified until its supported renderer/context boundary.

# src/scene/AutoMovieDisplayCompositor.ts#AutoMovieDisplayCompositor.prototype.describeTextureResidency

## @evidence contracts/development/implementation.md#principled-implementation

Reports current drawing-buffer width and height with exactly three RGBA8 no-mipmap copies, including the saved backing that remains part of a fade's resident closure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Returns allocation facts for the budget observer instead of duplicating GPU byte estimation inside the compositor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The copy count comes from the two source textures and one backing allocation, without substituting a measured or fixture-specific budget.

## @evidence contracts/development/common.md#meaningful-documentation

Explains format, mip policy, dimensions and why one-source fades still account for all three copies.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Reading two fields and returning one fixed-size record selects no algorithm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

These mutable extent facts are read directly and no repeated computation is coordinated.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned residency record owns no handles and retains no source textures.
