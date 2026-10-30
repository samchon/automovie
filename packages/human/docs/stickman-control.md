# Human facade control

`@automovie/human/control` exports `AutoMovieHumanController`, the renderer-free owner of motion selection and time. `@automovie/viewer/human` exports the optional `AutoMovieHumanFacade` and `IAutoMovieHumanVisual` binding. Human imports no Three.js; the Viewer entry owns interpolation and drawing placement. The five playground motions are authoring examples, not a shipped motion catalogue or engine humanoid adapter.

## Prepare and bind one character

Call the existing public `AutoMovieHumanSkeleton.prepare(params)` once for a fixed body. It runs the existing body law and prepares joint centres, clinical axes and scales once. The returned `evaluate(pose = {}, clamp = true)` reuses the existing clinical channel limits and FK and returns fresh bone, placement and clamp arrays. `generate(params, clamp)` preserves its one-shot behavior. Create another evaluator and facade when the body or rest construction changes.

The development-only playground polygon factory uses `prepare(params, { neckSurface: true })`; that factory is not a published package API. The same calibration supplies the small exterior descriptor once, and each evaluated output owns its copy. Its requested-length band and head display courses preserve their stated source geometry; they do not establish a clinical neck site or public girth attainment. Default skeleton generation does not require this display descriptor.

Construct the facade with `{ definitions, rest: evaluate({}), evaluatePose: evaluate, visual, expression? }`. Definitions map caller names to `{ duration, loop, keys, alignAnkles? }`; keys contain local seconds and public Human poses. The controller snapshots those records, and the Three clip cache reads that same private snapshot. Returned definitions, state, name lists and prepared clips are independent data.

The visual supplies its original `object`, exact bone-id `bindings: [{ bone, objects }]`, optional `updateFace(expression, head)` and `dispose`. Successful construction transfers drawing disposal ownership. Failed construction restores the borrowed parent order and matrix state and leaves drawing disposal with the caller; cleanup failures are reported alongside the original error. Binding targets are bone-local rigid groups with identity scale, a fixed hierarchy and one placement owner. The facade owns their matrices with `matrixAutoUpdate=false` and `matrixWorldAutoUpdate=true`; callers place the whole character through `facade.object`. Accepted updates refresh placement even while paused. Callers maintaining ancestor world matrices manually must keep them current, finite and invertible.

The face callback receives copied inputs and returns unsupported fields. Input or replacement-construction refusal preserves the previous drawing. Retirement failure can leave a partial drawing and makes further face updates terminal; disposal still attempts the remaining owned resources once and reports the failure. Geometry and facial drawing remain caller-owned construction rules.

## Control time and expression

| Operation | Contract |
| --- | --- |
| `select(name)` | Select a known motion at zero seconds, stopped. |
| `play(name)` / `play()` | Start a named motion at zero, or resume the selection. A finished one-shot restarts. No selection is an error. |
| `pause()` | Hold local time. |
| `seek(seconds)` | Require a selection and finite nonnegative seconds. Loops wrap; one-shots clamp and stop at their endpoint. An interior seek preserves the playback toggle, so seeking backward after completion remains stopped until `play()`. |
| `update(absoluteSeconds)` | Accept finite nonnegative, nondecreasing absolute seconds. A decrease refuses before state mutation. The first update after selection/play/pause/seek/reset anchors the clock without advancing; later intervals advance playing time. |
| `reset()` | Deselect and restore the generated rest pose and neutral expression, preserving external whole-character placement. |
| `dispose()` | Retire actions, bindings and transferred drawings. Pure transport disposal is idempotent and retains final scalar diagnostics; controls and definition access then reject. Facade retirement failures remain failures. |

`setPose(pose)` stops body playback and applies the prepared evaluator's admitted pose, including explicit gaze and jaw controls. `setExpression(expression)` replaces explicit facial input without stopping playback. Body clips reject eye/jaw keys; the face callback is not a per-frame facial sampler. Endpoint ROM clamping is not a guarantee for interpolation between keys.

## Reuse and limits

The official [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html) samples the selected local time through `setTime`; [AnimationClip](https://threejs.org/docs/pages/AnimationClip.html) holds tracks and [QuaternionKeyframeTrack](https://threejs.org/docs/pages/QuaternionKeyframeTrack.html) supplies quaternion interpolation. Three's hierarchy supplies FK, consistent with the [glTF parent-global times local relationship](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc). The facade adds no second FK or interpolation sampler. Pose evaluation runs only for explicit changes and distinct clip keys, with no body-law or geometry rebuild during update/seek.

These bindings are rigid polygon/rod drawings, without continuous skin weights, foot-contact solving, balance, physics, ragdoll or crowd integration. Custom Human bone ids are not cast into the engine's closed humanoid vocabulary. Optional ankle alignment is a key-pose height convention, not continuous planted-foot contact. Semantic part colors and joint hints do not establish OpenPose or DensePose compatibility.

The page supports explicit pose and expression selection, paused local-time motion inspection, whole-character placement and optional semantic colors and xray joint hints. Rendered examples cover selected inputs and viewpoints; they do not establish natural motion quality, clinical accuracy or complete coverage of the supported parameter domain. Pure controller checks establish transport behavior independently of visual quality and resource retirement.
