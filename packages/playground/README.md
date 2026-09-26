# @automovie/playground

Browser development surfaces for inspecting engine geometry, poses, motion, cameras and object placement. The face editor renders resident numerical geometry through the AutoMovie viewer. Both face page URLs mount the same editor.

## Run

```bash
pnpm --filter @automovie/playground dev
pnpm --filter @automovie/playground build
pnpm --filter @automovie/playground preview
```

The default development URL is `http://127.0.0.1:5173`. The development command first builds `@automovie/human`, including its schema-transformed browser entry. After changing human source, rebuild that package and reload the editor. `preview` serves the built `dist` at `http://127.0.0.1:4173`. The connected editors read their gzip bases by content, inflating only bytes that open with the gzip magic, so a server that marks `.gz` with `Content-Encoding: gzip` and hands the page inflated JSON (`vite preview`) and one that sends the stored bytes unmarked (a plain static server) both work.

## Anatomical face editor

Simple mode presents 26 shape controls, including age structure, facial fullness and paired eyes, lips and ears. Fine detail exposes the underlying shape and performance coordinates. Switching modes does not edit the face. Simple changes preserve paired differences and unlisted detail; the available range narrows when those differences require it. Both modes save the same fine numerical document. Age structure is an authored morphological axis, not a calibrated age in years.

Open `/face.html` or `/connected-face.html` for the [connected whole-face study](../../test/studies/human-face/connected-basis/global-face/README.md). Its selected CC0 basis exposes 141 shape and 52 expression controls. Search filters visible controls without changing hidden values. Each control states what one unit of its endpoints moves on the surface, in millimetres, so a dimensionless weight carries the unit its envelope alone does not. Selection, numerical edits, presets and document loading share undo/redo and last-valid-state recovery. Save document preserves the exact basis revision. Skin pigmentation and scalp hair are numerical fields evaluated by shared generators; personal bitmaps, sculpt fields and groom resource names are refused.

Open `/connected-body.html` for the [connected body study](../../test/studies/human-body/connected-basis/README.md). Its CC0 basis exposes 148 shape channels grouped by region (132 from the source; fourteen individuality traits: gluteal ptosis and projection, the fullness of the breast's lower pole, the abdominal apron, flank and outer-thigh fat, the hip dip, rectus, deltoid and scapular definition, skeletal prominence; and the two musculature definition channels), the eight macro controls (gender, age, muscle, weight, height, proportions, cup size, firmness) and 52 clinical joints. The Simple body section reads the current body back as the numbers a person knows (sex, age, stature in cm, mass in kg, muscle) and its tape measurements (waist, hip, bust, thigh, upper arm and calf girth, shoulder breadth), and applies edited values through the package's expansion over the current shape, so a detailed edit survives; the archetype presets (a slender woman, a bodybuilder, a giant, an elderly man, …) are those same values solved on click, a stature or mass beyond the basis's reach being refused with the reach. A measured channel (bust, waist, hips, thigh, shoulder breadth, limb lengths, stature) states its girth, length or height in millimetres at neutral and at each end; every other channel states what one unit moves. Joints are edited in clinical degrees inside the pinned ranges, with the rest angle marked and an axis the constraint holds shown disabled. An axis a basis coupling drives states the coupled degrees, the coupling and the total beside its slider; the document keeps only what the author wrote. Body and pose presets, numerical edits and document loading share the face editor's undo/redo and last-valid-state recovery; Save document keeps the exact basis revision and Export GLB downloads the current posed static body. The neutral connected face is shown seated on the head bone so the figure is judged whole; it is display only and is not part of the body document or its export. The body page names the face basis by the revision it reads off the head of the face basis asset, not by loading a face study, and when the companion face cannot be built the status line says why and body editing continues. Check contacts reports which skin segments cross in the current pose with the same instrument as the shipped census.

Open `/face.html`. The editor consumes [human](../human/README.md) and the eighteen numerical subject documents in this face study, not photographs or a live fitting service. The old face-package page and `/head.html` have been retired.

The [hair data migration](../../test/studies/human-face/connected-basis/global-face/numerical-hair.md) replaces personal groom resources with scalar profiles and shared scalp correspondence. The migration is reproducible from the tracked receipt, but the resulting hair and face are still subject to the unresolved anatomical and visual acceptance gates in issue #2547.

The connected worker stays alive across edits. It compiles the basis once and returns resident geometry directly; GLB is encoded only when Export GLB is clicked. Export captures that click's committed document and can finish while later edits continue. Pending or refused previews leave the displayed buffers unchanged. Successful deformations update existing buffers; changed topology or materials stage a replacement group. Texture preparation preserves the exporter's glTF UV orientation. This architecture does not itself establish an interactive latency budget; the current investigation and measurements are tracked in [#2533](https://github.com/samchon/automovie/issues/2533).

The editor consumes [human](../human/README.md), one shared basis and numerical documents. Camera presets, orbit controls and clay help inspect geometry. The Shadows checkbox isolates cast-shadow boundaries from surface form while preserving the direct lights, face document and export. Shadows start enabled; turning them off is an inspection mode, not a change to the anatomical model.

Fit frames the complete three-dimensional face and hair envelope for every orbit direction. It accounts for the viewport aspect and optical zoom, and expands the orbit limit and clipping range when needed. This changes only inspection, never the saved face or its exported geometry.

Appearance edits linear RGB and numerical pigmentation fields. Hair layers expose their shared growth domain, population, hairline, six regional lengths, combing, lift, parting, curl, taper and procedural finish. Mean length scales the six canonical lengths together and preserves their ratios. Fine fields remain independently editable. Strip count controls generated geometry and is not a biological density measurement.

A rejected edit preserves the last valid document/model. Undo, redo and reset operate on successful edits. Saved JSON retains numerical values and the shared basis identity. The self-contained GLB contains generated geometry and procedural images for the current expression. It is a derived static export. Generated geometry and unresolved likeness are separate outcomes.

Pure editor adapter tests live in the workspace test package and import this private application's `src/human` modules through its workspace dependency. They construct an in-memory DOM or renderer port without starting a browser. `connectedViewport` composes resident numerical requests, staged geometry and explicit export. `residentWorker` correlates replies and recovers after transport failure. Manual frame completion applies the current clay and orbit state before drawing, just as the animation loop does. Historical procedural adapters remain source-level research consumers; the published face entries no longer bundle their personal guide documents. Actual GPU captures remain a separate visual check.

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
