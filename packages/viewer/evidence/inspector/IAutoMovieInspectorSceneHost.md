# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost

## @evidence contracts/development/design.md#principled-representation

The three things a render loop needs from its platform: a drawing surface, a frame clock in milliseconds and the drawing size in CSS pixels with the device pixel ratio.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the viewer and read only by `mountAutoMovieInspectorScene`; the renderer is the structural subset of `THREE.WebGLRenderer` the mount calls, extending render's own section-renderer seam.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Structural rather than `THREE.WebGLRenderer`, because demanding the whole renderer would put a live WebGL context between the lifecycle and any check of it; the real renderer satisfies it as it stands.

## @evidence contracts/development/common.md#meaningful-documentation

States who supplies it in a page and in a test, and what each member is.

# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost.createRenderer

## @evidence contracts/development/common.md#meaningful-documentation

States ownership of the result.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The mount owns the renderer and calls its `dispose` once.

# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost.requestFrame

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and the handle.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The mount holds at most one pending handle and cancels it when it ends.

# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost.cancelFrame

## @evidence contracts/development/common.md#meaningful-documentation

States the effect.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the host that implements it answers.

# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost.size

## @evidence contracts/development/common.md#meaningful-documentation

States the units.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature has no body; the host that implements it answers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature has no body; the host that implements it answers.

# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost.IRenderer

## @evidence contracts/development/design.md#principled-representation

Drawing, sizing, release and the section clipping switch, with three.js's own signatures, so the real renderer is assignable as it is.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four methods and the inherited switch, each called by the mount.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No context or capability member, so a recording double needs no WebGL.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member is for.

# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost.IRenderer.render

## @evidence contracts/development/common.md#meaningful-documentation

States the effect.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

three.js's own method.

# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost.IRenderer.setPixelRatio

## @evidence contracts/development/common.md#meaningful-documentation

States the effect.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

three.js's own method.

# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost.IRenderer.setSize

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and the style switch.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

three.js's own method.

# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost.IRenderer.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is released and what is kept.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

three.js's own method.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

three.js's own method.

# src/inspector/IAutoMovieInspectorSceneHost.ts#IAutoMovieInspectorSceneHost.ISize

## @evidence contracts/development/design.md#principled-representation

CSS pixels and a device pixel ratio, the two numbers a WebGL drawing buffer is sized from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three numbers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

That they are positive and finite is checked by the mount, which skips a frame otherwise.

## @evidence contracts/development/common.md#meaningful-documentation

States each unit.
