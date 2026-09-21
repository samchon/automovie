# Parameter editor investigation

Issue [#2533](https://github.com/samchon/automovie/issues/2533) requires a face document to contain numerical shape and expression weights, material overrides and resource identities. Per-vertex identity displacement and per-document corrective geometry violate that boundary. Geometry, shared corrective fields and attachment correspondence belong to the reusable basis.

## Acceptance surface

The investigation covers the connected editor, its numerical builder, static export and all eighteen published subjects. It includes neutral shape, unilateral and combined expression, intermediate weights, invalid input, interrupted edits, undo, redo and document replay. Frontal, both oblique, both profile, rear and clay observations are separate from numeric admission. A successful render or a sampled collision result does not prove an unrestricted anatomical guarantee.

Repeated evaluation must preserve correspondence and update resident position and normal buffers. Basis preparation, material/resource changes, explicit contact checks and export are measured separately. The issue requests less than 50 ms per warm pose or subject change and a five-second eighteen-subject, twelve-pose capture population. Both remain unverified targets until measured through the actual browser consumer, with hardware and raster recorded.

## Anatomical questions

The mandibular arch must remain rigid during performance. Shape may change its dimensions, but expression must not shrink teeth through linear interpolation. The maxillary arch remains attached to the cranium. Tongue and oral lining motion must be evaluated with the mandible and lip aperture, including conflicting combinations. Eye rotation must preserve globe dimensions; lids must maintain attachment and a coherent aperture. Shape-dependent placement must be evaluated before performance so a change of identity cannot leave a joint or an attached surface behind.

These are joint conditions for each anatomical group. A correction that clears one intersection while creating another, collapses a surface, changes a rigid organ's dimensions or removes the intended expression is not accepted.

## Primary sources under investigation

- [FLAME, Learning a model of facial shape and expression from 4D scans](https://download.is.tue.mpg.de/flame/flame_paper.pdf): separates identity, expression, articulated joints and pose-dependent corrections. Its learned representation is a reference method, not evidence that this repository has reproduced its behavior.
- [MetaHuman DNA, Rig Definition, and Rig Operation](https://dev.epicgames.com/documentation/metahuman/metahuman-dna-rig-definition-and-rig-operation): separates rig evaluation, joint transforms and geometry. Character-specific DNA geometry does not justify placing vertex fields in this editor's numerical documents.
- [In vivo three-dimensional mandibular kinematics and functional point trajectories](https://pmc.ncbi.nlm.nih.gov/articles/PMC7860955/): measures coupled rotation and translation. A fitted fixed screw is a geometric approximation; it is not automatically an anatomical temporomandibular joint model.
- [Pure rotation in the temporomandibular joint during jaw opening?](https://pmc.ncbi.nlm.nih.gov/articles/PMC11026373/): investigates the limits of a pure-rotation description. Numerical ranges require their population and measurement assumptions, rather than being presented as universal biological limits.

## Initial state

The investigation starts at master commit `d6be8fd9` after PR #2522. Its published documents still admit `identity` and `correctives`; its preview creates a worker for each request, rebuilds and validates a model, exports GLB, decodes GLB and replaces the scene. Measurements reported in #2533 belong to the previous environment and require local reproduction. The new work is delivered through one Draft PR.

## Canonical detail and simple controls

The user's additional requirement is tracked in [#2535](https://github.com/samchon/automovie/issues/2535). The finest numerical parameters are authoritative. Simple controls must resolve through explicit transformations to that representation; an intermediate tier is optional. Research includes proportions, outline, fullness, skeletal prominence, feature placement and shape, asymmetry, skin, hair and performance as well as age. A mode change must preserve detailed edits, and repeated application must not accumulate drift.

The [research inventory and references](https://github.com/samchon/automovie/issues/2535#issuecomment-5757654846) distinguish documented authoring methods from anatomical studies and local reproduction. [Body research issue #2536](https://github.com/samchon/automovie/issues/2536) separately preserves shared-control questions, sources and limits for a future checkout without `.wiki`. This PR's implementation scope is facial effects and their attachment boundaries only; it does not introduce a body editor or interpret facial authoring weights as measured whole-body attributes.
