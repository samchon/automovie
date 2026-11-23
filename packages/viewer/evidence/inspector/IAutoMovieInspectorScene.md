# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene

## @evidence contracts/development/design.md#principled-representation

A mount is a live resource with a request in force, so it is a handle with one call to change the request and one to end it, the form the inspection handle has.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two calls the component's effects make; what the mount learns flows out through the `IReport` the component passes in.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `apply` never throws: a request the scene refuses is reported with the request still drawn, so the component sets that request back and the address stays equal to the picture.

## @evidence contracts/development/common.md#meaningful-documentation

States what the handle stands for and what each call does.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.apply

## @evidence contracts/development/common.md#meaningful-documentation

States when the request takes effect, what is re-applied, the refusal path and the identity rule.

## @evidence contracts/development/implementation.md#principled-implementation

The scene's inspection is restored before a new one is applied, as `applyAutoMovieInspection` requires a scene in its own state, and the previous request is re-applied when the new one throws, so the scene is never left uninspected.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call per request change, from the component's effect.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A refusal is reported and undone, never drawn half-applied.

## @evidence contracts/development/implementation.md#efficient-algorithms

One restore and one apply, each linear in the scene and its marks, only when the inspection changed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A request whose inspection writes the same text keeps the applied inspection.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one applied inspection; the replaced one is restored first.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.overlay

## @evidence contracts/development/common.md#meaningful-documentation

States what is hidden, when, and what continues.

## @evidence contracts/development/implementation.md#principled-implementation

Visibility is a display choice of the review picture, so it changes only which overlay is drawn, never which checks run.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One flag read by the paint step.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Hidden witnesses still reach the diagnostics report, so a hidden fault is still published.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant; the picture redraws once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A flag change computes nothing.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds one boolean.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States everything released, the late-instance case and the repeated call.

## @evidence contracts/development/implementation.md#principled-implementation

Release runs in the reverse of acquisition, every step attempted even when one throws, so one failure cannot leak the rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One call that the component's effect cleanup makes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The renderer's context is not forced lost, because StrictMode mounts again on the same canvas and a lost context would leave the next renderer black.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in what the inspection changed.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A release computes nothing to reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

After the call no frame is pending and the mount holds no renderer, instance or inspection.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.EpisodeBasis

## @evidence contracts/development/design.md#principled-representation

The two links the mount can witness, named by what they prove.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the console and findings presentation to word the span.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A playback span is never presented as frame-exact.

## @evidence contracts/development/common.md#meaningful-documentation

States what each value claims.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.IIncident

## @evidence contracts/development/design.md#principled-representation

A first visit carries its observation; a span carries its basis, the reducer's episode shape and the clock of its first sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the console writer and the findings panel.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The span's first sample is kept apart from its first witness, whose time can differ.

## @evidence contracts/development/common.md#meaningful-documentation

States the two kinds and what each carries.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.IFacts

## @evidence contracts/development/design.md#principled-representation

Identity paths, first-frame marks and lifetime kind declarations describe the subject's available inspection data. View names identify cameras. The raster is in pixels, duration in seconds and rate in frames per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Paths feed the selection tree, marks and declared kinds feed the marks panel, views feed the view panel, raster sets the canvas aspect, and the clock feeds the readout.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

First-frame marks carry actual styles, declared names carry availability, and render lists measured kinds under the current sliver or trail request.

## @evidence contracts/development/common.md#meaningful-documentation

States what each member lists and at which second.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.ILabels

## @evidence contracts/development/design.md#principled-representation

Positions and line height are CSS pixels of the canvas, converted from the picture pixels render's placement works in by the ratio of the canvas's size to the subject's raster, so an element placed at them sits where a capture stamps the same label.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The labels kept and the line height the component sizes them by; dropped labels are counted so the reader knows some were asked for.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No font or colour: the component owns how a label looks.

## @evidence contracts/development/common.md#meaningful-documentation

States the units and the conversion.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.IReport

## @evidence contracts/development/design.md#principled-representation

Reports readiness, legend, labels, any placed diagnostics, drawing errors and request refusals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each is read by the inspector component and nothing else.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A drawing error and a refused request are separate, because only the second changes the request.

## @evidence contracts/development/common.md#meaningful-documentation

States when each event fires.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.IReport.ready

## @evidence contracts/development/common.md#meaningful-documentation

States when it fires.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callback signature; the component implements it.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.IReport.legend

## @evidence contracts/development/common.md#meaningful-documentation

States when it fires.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callback signature; the component implements it.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.IReport.labels

## @evidence contracts/development/common.md#meaningful-documentation

States when it fires and the empty case.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callback signature; the component implements it.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.IReport.error

## @evidence contracts/development/common.md#meaningful-documentation

States when it fires and what null means.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callback signature; the component implements it.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.IReport.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

States when it fires and that generic subjects omit it.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

The consumer owns the callback's presentation.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback signature with no body.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The mount supplies the clock and the observed facts.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The callback chooses how to present its packet.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The packet comes from the painted frame's one observation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The consumer controls how much observed history it retains.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.IReport.diagnosticIncident

## @evidence contracts/development/common.md#meaningful-documentation

The first visit and an observed multi-sample span are separate events, and a span names whether consecutive frames or uninterrupted playback joined it.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

The listener owns presentation.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

This callback has no body.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

The mount keeps replay identity and admits measured intervals.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The listener owns output.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each event comes from the already painted sample.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The listener chooses retention.

# src/inspector/IAutoMovieInspectorScene.ts#IAutoMovieInspectorScene.IReport.refused

## @evidence contracts/development/common.md#meaningful-documentation

States when it fires and what each argument is.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A callback signature; the component implements it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A callback signature; the component implements it.
