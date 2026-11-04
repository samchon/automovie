# @automovie/viewer

Displays AutoMovie output through Three.js: it turns `@automovie/interface` models, scenes, poses, expressions and motion into Three objects, plays them on one frame clock, and captures and inspects the result. The engine decides what a frame contains; the viewer only draws it, so the same compiled input always draws the same picture.

Use it in a browser host, a headless capture host, or the playground. It owns no editor controls and no example content.

## Use

```bash
npm install @automovie/viewer three
```

Node hosts require Node 22.23.2 or later. The published JavaScript is ESM, with no separate CommonJS build. In an ESM project, the public entry and Three addons can load concurrently:

```typescript
const [viewer, three, lights] = await Promise.all([
  import("@automovie/viewer"),
  import("three"),
  import("three/examples/jsm/lights/RectAreaLightUniformsLib.js"),
]);
console.log(
  typeof viewer.buildLight,
  three.REVISION,
  typeof lights.RectAreaLightUniformsLib.init,
);
```

Keep the host, viewer and addons on one Three installation so their constructors and shared uniforms retain the same identity.

A source-linked `ttsx -P tsconfig.json` consumer should use an ESM compiler configuration (`module: "ESNext"` or `"NodeNext"`). The repository's CommonJS test configuration was observed to convert the consumer's Three import into `require("three")`, emitting `THREE_CJS_DEPRECATED`; the packed native ESM and source-linked ESM configurations did not emit that warning.

| Entry | Purpose |
| --- | --- |
| `@automovie/viewer` | Scene, model, material and light construction (`buildScene`, `buildModel`, `buildMaterial`), playback (`AutoMoviePlayer`, `applyPose`, `applyExpression`), render passes (`applyRenderMode`, `applyAutoMovieSemanticMask`), transitions (`renderAutoMovieFilmFrame`), instanced formations, effects and fluids, texture-budget facts for `@automovie/render`, subject framing and capture (`mountViewer`, `captureViewerSnapshot`) |
| `@automovie/viewer/node` | Node-only browser capture sessions |
| `@automovie/viewer/human-polygon` | Original rigid polygon mannequin and cartoon face over caller-supplied structural skeleton/exterior descriptors; actual bone/mesh registries, pose updates and palette ownership |
| `@automovie/viewer/process/ProcessOwnership` | Node-only discovery and termination of the services the viewer starts |

## Ownership

The viewer releases what it creates and leaves what the caller passes in. `dispose` functions free viewer-owned geometry, materials, textures and compositor targets, never a caller's renderer, scene or numerical source. Render-budget hosts read texture and render-target facts from the actual objects (`AutoMovieTextureCache.describeSources`, `readAutoMovieRenderTextureTarget`) and pass them to `assessAutoMovieRenderBudget`, which refuses a frame whose memory it cannot bound.

`buildModel` shares one skeleton and bone texture among parts with the same ordered joint slots inside one built model. Mesh bind matrices, skinning methods, geometry and culling remain independent; separate builds own separate skeletons. Retire an owned model with the identity-deduplicated `collectAutoMovieOwnedResources` population so shared skeletons are released once.

`buildAutoMovieConstruction` displays supplied open or closed generating polylines in metres under an explicit point budget, with one owned disposer. `createAutoMovieMetricOrthographicCamera` maps a supplied horizontal metric pixel chart to a native camera. `captureAutoMovieMetricFrame` captures the current scene in physical pixels as a surface or structural silhouette pass, then restores borrowed renderer and scene state. The host owns subject visibility, admission budgets and redrawing its ordinary camera; these operations perform no reconstruction or camera estimation.

`updateAutoMovieComparisonCamera` derives one centred orthographic projection and a screen-right separation vector from a standalone perspective camera. Hosts can display unchanged subjects at equal opposite offsets with the same magnification and view direction, including profile views. The caller owns the reusable output camera/vector and subject placement; parented/scaled cameras, manual matrices and off-axis source lenses refuse.

Human-specific bindings and diagnostic controls live in the Human package's [debug viewer](../human/debug/README.md). The viewer consumes ordinary model and pose data and has no dependency on the Human generator.

The optional `human-polygon` entry owns the original development mannequin's geometry formulas and face drawing. `buildHumanPolygon(output, { partColors })` accepts the public Human skeleton/exterior output structurally, including custom string bone ids. Its `setPose({ posed })` admits the complete fixed rig before updating the actual surface and diagnostic groups. `parts`, `bones` and `bindings` expose those displayed objects by bone id. A mesh vertex or contact probe's local point is its registered rest point minus that bone's rest joint; the flat group's bind-relative body-frame placement and the host's actor-parent transform apply once. Pose updates refresh world matrices for paused inspection too. Rigid modules can overlap or separate at joints and do not certify continuous skin or collision clearance.

`buildHumanCartoonFace(drawing.head, expression, headPose)` retains the original selected action-unit drawing and explicit unsupported-action report. Add its object to `drawing.head.object` once and retire the face separately from the polygon drawing. The host owns colours, equipment, clinical evaluation, choreography and actor-root placement. This optional entry imports neither Human nor development content.

Human's `AutoMovieHumanSkeleton.prepare(parameters, { neckSurface: true, footSurface: true })` supplies optional canonical foot courses to the same polygon builder. Subtalar and Midfoot keep separate bindings; existing toe modules remain articulated. `drawing.plantarLandmarks[side][name]` identifies an actual `parts.get(bone)` position-attribute `vertexIndex` and its Float32 `localPoint`. `plantarSupport` measures initial placed heights over the entire emitted foot, including toes; its named contact subset can be empty. These fixed references preserve intrinsic shape under later posing. The reported numerical coincidence bound grants no physical floor-clearance exemption, and rigid course joins do not certify continuous skin.

`applyAutoMovieRigLocals(target, locals, root)` displays complete rig-evaluator output directly, including translated bone locals from folded intermediate joints. Each `IAutoMovieRigLocalTransform` carries parent-relative metre translation `[x, y, z]` and a unit quaternion `[x, y, z, w]`. The map must match the built model's mapped bones exactly; invalid values refuse before any write. The adapter applies unit scale, refreshes world matrices and invalidates skinned bounds. The host supplies morph weights and imported-runtime updates when needed.
