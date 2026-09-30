---
name: viewer-verification
description: Defines how to drive the viewer/playground through the Playwright library to inspect renders, poses, and motion against expectation, including how to reach a real GPU context and how to compare against previous behavior without disturbing the working tree. Use before claiming a viewer, render, pose, motion, or expression change works.
---

# Viewer Verification

Unit tests pin the engine's numbers; they cannot tell you the character renders right. Any change to `viewer`, to the render path, or to a pose/motion/expression that is meant to look a certain way is verified visually by driving the viewer in a real browser, not by a green test run alone.

## When to verify visually

- A `@automovie/viewer` change (model/scene builder, pose application, material, camera, lights, the player loop).
- A new or changed pose, motion clip, or expression whose correctness is "it looks like X".
- A render-output or headless-snapshot change.
- Before reporting any of the above as working.

## Driving the browser

Playwright is a **library** here, not a tool server. This repository registers no server of any kind, so an agent that goes looking for one finds nothing and concludes it cannot verify visually. It can. The library lives in `test/node_modules/playwright` and the browser binaries are already installed under the user's `ms-playwright` cache; neither needs an install step.

Two details decide whether the frame is real.

- **Import by absolute file URL.** The library resolves only from `test/`, so a script written to a scratchpad cannot find it by name. `NODE_PATH` is ignored under ESM. Import `test/node_modules/playwright/index.mjs` by its full `file:///` URL instead.
- **Ask for `channel: "chromium"`.** The default launch drops to `chromium_headless_shell`, which has no GPU. With the real channel this repository reaches a real device through ANGLE. **Log the `RENDERER` string on every run.** Silently falling back to a software rasterizer and reading the result as a GPU frame is this procedure's main false result.

## Resident development viewer

`test/scripts/human-viewer/human-shot.mts` is the standard way to look at a human part. A resident GPU server on `http://127.0.0.1:5175` opens a published face document or a standard body state by address and answers a PNG in about a second, and it rebuilds what changed in the working tree. The session starts it once as an attached background job and never restarts or stops a server it did not start. From `test/`:

```bash
pnpm exec ttsx -P scripts/human-viewer/tsconfig.json scripts/human-viewer/human-shot.mts <ensure|status|stop|render|sheet|compare|warm> [key=value ...] [--output file.png]
```

The fields are `doc` (a face document id, `body:<state>`, or `file:<name>` for a hand-written document), `parts` (mesh names, comma separated), `view` (`front`, `left-three-quarter`, `left`, `back`, `right-three-quarter`, `right`, `top` or `bottom`, the figure's anatomical sides) with `pitch` (degrees added to its elevation), `pass` (`beauty`, the product frame, `clay`, `normal`, `depth`, `flat`, `wire` or `outline`; no pass replaces a lit `beauty` frame for judging material or light), `frame` (`x,y,z,radius` in metres, which zooms a joint or a seam), `look` (`yaw,pitch,distance,x,y,z[,fov]`, an exact camera that overrides the three above), `pose` (`<pose file>:<subject>`, a measured pose of the population folder resolved to `look`), `ao` (`on`, `off` by default), `size`, and for a face with a local reference photograph `ref` (`split`, `overlay` or `swipe`) and `opacity`. Left and right are the figure's anatomical sides, and a part is a mesh, which today is a material region and not yet an anatomical part. `render` draws one frame, `sheet` several (`axes="view:front,left;pass:beauty,clay"`), and `compare` the reference beside or over the render at the photograph's own camera. A frame is evidence only when the response's renderer names real hardware.

A hand-written document or a candidate basis goes into `.shots/human-viewer/inputs/`: `<name>.json` holds one document or an array (`file:<name>`, `file:<name>/<document id>`), and `<name>.basis.json.gz` beside it is the basis those documents are built on in place of the published one. A document must name the basis it is built on, and a wrong one is rejected with the reason (`/rescan` lists what was accepted and rejected). The drivers that write frames and records are clients of this server and never start a browser: `test/scripts/human-viewer/capture-face-references.mts STUDY OUTPUT POSE_FILE` for face documents at measured poses, `test/scripts/body-review/capture-editor.ts` for body states, views and passes, and `observe-body.ts` for the part, joint and whole units of the body (`connectHumanViewer` is their shared client). Each record holds the frames' SHA-256, the renderer, the revision and no image bytes. Read the frames yourself; the record says what was drawn, not that it is right.

Frames go to gitignored directories and never into the repository.

## Getting engine code into the page

For engine geometry that no product page shows, do not stand up vite or a bundler. Split it in two, which is simpler:

1. Run the TypeScript export entry through `pnpm exec ttsx -P <owning-tsconfig.json> <entry.ts>` from the repository root. The owning project supplies its type checks and configured transforms. Import the engine source module directly to inspect the working-tree implementation, build the geometry or pose, and write the result to JSON. Face-review entries use `test/tsconfig.scripts.json`; a diagnostic entry needs a project that includes it. The [development skill](../development/SKILL.md#validation) owns repository acceptance checks.
2. A dependency-free static page reads that JSON and draws it. It opens over `file://`, so no server is involved.

Create the context with `preserveDrawingBuffer: true` and call `gl.finish()` at the end of the render, or the screenshot and the pixel read will disagree about which frame they saw. Screenshot the canvas element rather than the page, and expose `gl.readPixels` on `window` when a claim needs coordinates and channel values rather than an impression.

## Flow

1. Build the page that shows the thing: the playground or website page that mounts `mountViewer`, or a minimal page that builds a model and applies the pose.
2. **Render a calibration frame first.** Put a reference shape whose coordinates you typed by hand (untouched by the code under test) beside the subject, and fix the reading convention on it. Without that, every later reading is circular: you are using the thing you are testing to decide what its own output means.
3. Load the page, set the model and the pose or motion, advance the player to the target time, and capture.
4. Read the capture against the intended result: the bones bend the right way, the limbs sit where forward kinematics says, the expression shows the named emotion, the camera frames the subject, materials and lighting match the authored values. For a dense region such as a face, a joint or a seam, capture at a higher resolution and crop and zoom into the region under test, and take measurements with `gl.readPixels` or an image library, instead of judging one downscaled full frame.
5. For motion, sample several timestamps (start, midpoints, end) and confirm the in-betweens are coherent, not just the keyframes.
6. Report concrete observations tagged `[regression]` / `[polish]` / `[nit]` / `[ok]`. Fix obvious visual breaks in the same turn before continuing.

## Comparing against the previous behavior

Never `git stash` or check out an older commit to get the "before" frame. The working tree usually carries the user's uncommitted work, and that move destroys it.

Reflect the quantity under test in code instead and render the twin beside the fix, without touching a tracked file. The twin doubles as a check on the instrument: a measurement that gives the same verdict for the fix and its mirror is not reading what it claims to read.

## Cross-check against the engine

A render that disagrees with `resolvePose`/`sampleMotion` output is a viewer bug; a render that agrees but still looks wrong is an engine or data bug. State which side the discrepancy is on. The viewer is a thin projection of the engine's deterministic result, so the two must match.
