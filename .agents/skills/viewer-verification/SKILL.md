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

## Product editors

Judge the face and body editors on the frames the product draws. The playground dev server at `http://127.0.0.1:5173` serves them, and the tool `test/scripts/viewer/viewer.ts` owns its life. Run it from `test/` as `pnpm exec ttsx -P tsconfig.scripts.json scripts/viewer/viewer.ts <command>`:

- `ensure` leaves a healthy, fresh server alone, rebuilds `@automovie/human` when its source is newer than the browser build (the running server reads the new files on the next page load), and otherwise builds if needed and starts the server and stays attached to it. Start `ensure` as an in-session background job so ending the session ends the server. Keep the server running for the whole task so each observation costs one navigation.
- `status` reports whether the port serves the playground, the revision, and whether the human build is fresh. Its exit code is 0 for ready, 3 for absent, 4 when another program holds the port and 5 for a stale build. `status --gpu` also opens the body editor in a browser and prints the renderer string, and exits 6 when it names a software rasterizer.
- `stop` ends the server this tool started and its whole process tree. It acts only on the process id it recorded, and only while the port still serves the playground. It never touches a program it did not start.

A server the dev command or another shell started is served but not owned: `ensure` reuses it and `stop` leaves it. The dev server does not rebuild `@automovie/human`, so a capture of an older build reports a feature as absent; run `status` before capturing and rebuild when it says the build is stale. The tool takes no port from another program, opens no window, and judges nothing about the frame: read the `RENDERER` string on every run as the previous section says.

Open `connected-face.html` or `connected-body.html`, wait for the panel to report a committed state, and drive the page through `window.__connectedFace` or `window.__connectedBody`: `change` (body) applies a document as a slider commit does, `camera` and `fit` move the display camera, `clay` switches the material-independent view, `finish` completes the frame, and `renderer` returns the graphics device to log. Both pages share the observation hooks, which change the display and never the document:

- `view(name, { distance?, fov? })` looks at the whole subject from `front`, `left-three-quarter`, `left`, `back`, `right-three-quarter`, `right`, `top` or `bottom`. Left and right are the figure's anatomical sides.
- `look({ position, target, fov })` places the camera exactly and lifts the orbit's limits. `frame({ center, radius, view?, fov? })` frames a sphere of the displayed space, which is how a joint or a seam is zoomed.
- `parts()` lists the displayed meshes by name, `isolate(names | null)` and `hide(names | null)` show or hide them and return the names no displayed part carries, and `state()` reports the current pass, isolation and hidden names. A part here is a mesh, which today is a material region and not yet an anatomical part. The hooks hide and restore only the meshes they hid themselves, and an unknown pass or view name throws.
- On the body page, `companion()` resolves once the face seated beside the body has been built, so a capture after it always shows the same figure.
- `pass(name)` draws the subject as `beauty` (the product frame), `clay`, `normal`, `depth`, `flat`, `wire` or `outline`. No pass replaces a lit `beauty` frame for judging material or light; the meaning and limits of each are on the pass type's JSDoc.

Call `finish` after any hook before capturing. Only `change` edits the document.

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
