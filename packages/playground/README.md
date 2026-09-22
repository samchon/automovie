# @automovie/playground

Browser development surfaces for inspecting engine geometry, poses, motion, cameras and object placement. Most pages use the AutoMovie viewer; the anatomical face editor loads its actual exported GLB with Three.js.

## Run

```bash
pnpm --filter @automovie/playground dev
pnpm --filter @automovie/playground build
pnpm --filter @automovie/playground preview
```

The default development URL is `http://127.0.0.1:5173`. The development command first builds `@automovie/human`, including its schema-transformed browser entry. After changing human source, rebuild that package and reload the editor. `preview` serves the built `dist` at `http://127.0.0.1:4173`. The connected editors read their gzip bases by content, inflating only bytes that open with the gzip magic, so a server that marks `.gz` with `Content-Encoding: gzip` and hands the page inflated JSON (`vite preview`) and one that sends the stored bytes unmarked (a plain static server) both work.

## Anatomical face editor

Open `/connected-face.html` for the [connected whole-face study](../../test/studies/human-face/connected-basis/global-face/README.md). Its selected CC0 basis exposes 84 shape and 52 expression controls. The study selector loads nineteen compact documents, including `kdy1`; search filters the visible controls without changing hidden values. Each control states what one unit of its endpoints moves on the surface, in millimetres, so a dimensionless weight carries the unit its envelope alone does not. Selection, numerical edits, presets and document loading share undo/redo and last-valid-state recovery. Save document preserves the exact basis revision, and Export GLB downloads the current static face. These studies have no scalp groom and retain the linked study's unresolved likeness limits.

Open `/connected-body.html` for the [connected body study](../../test/studies/human-body/connected-basis/README.md). Its CC0 basis exposes 144 shape channels grouped by region (132 from the source plus twelve individuality traits: gluteal ptosis, the abdominal apron, flank and outer-thigh fat, the hip dip, rectus, deltoid and scapular definition, skeletal prominence), the eight macro controls (gender, age, muscle, weight, height, proportions, cup size, firmness) and 52 clinical joints. The Simple body section reads the current body back as the numbers a person knows (sex, age, stature in cm, mass in kg, muscle) and its tape measurements (waist, hip and bust girth, shoulder breadth), and applies edited values through the package's expansion over the current shape, so a detailed edit survives; the archetype presets (a slender woman, a bodybuilder, a giant, an elderly man, …) are those same values solved on click, a stature or mass beyond the basis's reach being refused with the reach. A measured channel (bust, waist, hips, thigh, shoulder breadth, limb lengths, stature) states its girth, length or height in millimetres at neutral and at each end; every other channel states what one unit moves. Joints are edited in clinical degrees inside the pinned ranges, with the rest angle marked and an axis the constraint holds shown disabled. An axis a basis coupling drives states the coupled degrees, the coupling and the total beside its slider; the document keeps only what the author wrote. Body and pose presets, numerical edits and document loading share the face editor's undo/redo and last-valid-state recovery; Save document keeps the exact basis revision and Export GLB downloads the current posed static body. The neutral connected face is shown seated on the head bone so the figure is judged whole; it is display only and is not part of the body document or its export. The body page names the face basis by the revision it reads off the head of the face basis asset, not by loading a face study, and when the companion face cannot be built the status line says why and body editing continues. Check contacts reports which skin segments cross in the current pose with the same instrument as the shipped census.

Open `/face.html`. The editor consumes [human](../human/README.md) and the nineteen numerical [subject documents](../../test/studies/human-face), not photographs or a live fitting service. The old face-package page and `/head.html` have been retired.

Select a subject, adjust intermediate traits or an anatomical detail, and wait for the worker to build the model. Scalar fields show units and applied values; the region JSON editor handles nested objects and complete arrays. Eyes, cheeks and ears have independent side overrides. Expression controls and presets include paired blink, brow, smile and gaze plus jaw opening, lip separation and pucker. Camera presets, orbit controls and clay help inspect geometry. The Shadows checkbox isolates cast-shadow boundaries from surface form while preserving the direct lights, face document and export. Shadows start enabled; turning them off is an inspection mode, not a change to the anatomical model.

Fit frames the complete three-dimensional face and hair envelope for every orbit direction. It accounts for the viewport aspect and optical zoom, and expands the orbit limit and clipping range when needed. This changes only inspection, never the saved face or its exported geometry.

Appearance exposes linear RGB, surface roughness and clearcoat strength for skin, lips, brows, teeth and the resident finish named by the applied hair profile. A custom hair-material id is editable too. Roughness and clearcoat use [0,1]; absent clearcoat displays zero without changing the document until an edit is committed. Each entry changes only its selected coefficient or colour channel and retains the guide geometry, texture coverage and other finish properties. Choosing a different hair finish through region replacement moves these controls to that owner.

A rejected edit preserves the last valid document/model. Undo, redo and reset operate on successful edits. Save/load JSON keeps the complete numerical basis and explicit overrides. GLB is self-contained; glTF downloads include sibling buffers and any resident PNG images, which must stay alongside the JSON file. Downloaded meshes represent the current built expression, not a rigged animation. Generated geometry and unresolved likeness are separate outcomes.

Pure editor adapter tests live in the workspace test package and import this private application's `src/human` modules through its workspace dependency. They construct an in-memory DOM or renderer port without starting a browser. `viewport` owns scene publication, disposal, lighting and frame state; `workerPort` adapts browser messages and `workerHandler` owns parsing, construction and export failure replies. Manual frame completion applies the current clay and orbit state before drawing, just as the animation loop does. Actual GPU captures remain a separate visual check.

## Other pages

- `index.html`: procedural blockman proportions, joint poses and the built-in wave clip.
- `drivers.html`: three-joint arm, two-bone IK and driver resolution.
- `stickman.html`: stickman/humanoid and cat clips.
- `gesture.html`, `showcase.html`: engine gesture/action vocabulary.
- `film.html`: script/stage/block/perform/cut pipeline output.
- `launch.html`, `impact.html`, `attach.html`, `trampoline.html`: projectile, impact, attachment and jump actions.
- `knight.html`, `archery.html`, `spar.html`: mounted, archery and boxing scenes.
- `body.html`, `mhhead.html`, `mhfull.html`: retained body and MakeHuman research surfaces, independent from the human face editor.

## Motion assets

Hand-authored libraries remain in `src/stickman-motion.ts` (including walk/run, wave, dance and shadowbox), `src/horse-motion.ts` (gaits, turns and rear), `src/cat-motion.ts` (gaits, leap, sit, stretch and tail flick) and `src/spar.ts` (the boxing exchange).

Engine-generated motion is exercised by `attach-view.ts`, `launch-view.ts`, `impact-view.ts`, `trampoline-view.ts`, `gesture-view.ts`, `showcase-view.ts` and `film-view.ts`. Model/rig build scripts under `scripts/` produce the GLB scaffolds; `scripts/mh/` retains separate MakeHuman research utilities.

Locomotion migration prioritizes humanoid walk/run/stroll/sprint, horse walk/trot/gallop/travel and cat walk/prowl. Non-gait gestures remain hand-authored until their own action/profile contract exists. A profile-generated replacement first needs regression checks against the existing observable behavior and playground captures for silhouette and timing.
