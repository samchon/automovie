# Viewer tool usage

Read the sections needed for the selected viewer, capture or quantitative measurement. The skill entry owns acceptance and observation scope.

## Driving the browser

Use the Playwright library in `test/node_modules/playwright`. Check the local browser installation before launching; install the required binary through Playwright if it is absent. Browser-cache availability varies between checkouts.

Two details decide whether the frame is real.

- **Import by absolute file URL.** The library resolves only from `test/`, so a script written to a scratchpad cannot find it by name. `NODE_PATH` is ignored under ESM. Import `test/node_modules/playwright/index.mjs` by its full `file:///` URL instead.
- **Ask for `channel: "chromium"`.** The default launch drops to `chromium_headless_shell`, which has no GPU. With the real channel this repository reaches a real device through ANGLE. **Log the `RENDERER` string on every run.** Silently falling back to a software rasterizer and reading the result as a GPU frame is this procedure's main false result.

## Resident development viewer

`test/scripts/human-viewer/human-shot.mts` is the standard way to look at a human part. A resident GPU server opens a published face document or a standard body state by address and answers a PNG in about a second, and it rebuilds what changed in the working tree. The session starts it once as an attached background job and never restarts or stops a server it did not start. From `test/`:

```bash
pnpm exec ttsx -P scripts/human-viewer/tsconfig.json scripts/human-viewer/human-shot.mts <ensure|status|stop|watch|render|sheet|compare|warm> [key=value ...] [--output file.png]
```

`HUMAN_VIEWER_PORT` selects the viewer for the server, `human-shot.mts`, the control script and the capture drivers alike, and a server that `human-shot.mts` starts inherits it. Unset, it is `127.0.0.1:5175` with the process record `.shots/human-viewer/server.json` and `source-status.json`; another port (an integer from 1024 to 65535, anything else is refused) uses `server-<port>.json` and `source-status-<port>.json`, so two viewers never claim each other's record. When another session's viewer is busy, stale or unhealthy, leave it running and start your own on a free port by setting `HUMAN_VIEWER_PORT` for every command of the session; never restart or stop the other one.

Only `ensure` and `watch` start a server, as their attached child, so run `ensure` as the session's background job. They start the plain-Node launcher `human-viewer-launcher.mts`, which binds the public port and writes the process record at once and then builds the server with `ttsx` as its own child on an internal port it reserved. While the server builds and starts, the port answers: `/health` reports `ready: false` with `startup.phase` and the launcher's last build lines in `launcher.output`, and every other route answers 503 with `Retry-After`. A second `ensure` therefore finds a starting viewer and waits for it instead of starting another. The record's pid and `/health` `pid` are the launcher's, `/health` `serverPid` names the server process, and `stop` kills the launcher's tree. When the server's build or startup fails, the launcher logs the cause, removes the record and exits with the server's code, so nothing is served. HTTP and Vite's WebSocket pass through the public port unchanged. The client commands (`render`, `sheet`, `compare`, `warm`) only use a ready server and never wait for one, because a server started by a capture would end with that capture: with no listener they name `ensure` and exit 3, with a server that answers but is not ready they exit 3, and with a port that accepts but does not answer `/health` they exit 4 as `status` does. A started server's output and its exit code and signal are appended to `.shots/human-viewer/server.log` (`server-<port>.log` for another port) as well as the client's stderr. When `ensure` fails, its message gives the cause (the server's exit code, or the last probe's failure) and the log path, and a server that client started is stopped. `watch` starts a server only when the connection is refused, and restarts only its own child after a long silence; a silent server it did not start is waited for and never killed.

A capture the server marks stale was drawn by the last good generation while the current source failed or was rebuilding. `human-shot.mts` keeps the file, reports `stale: true` and exits 5, and `connectHumanViewer` returns it to the capture drivers as a refusal rather than a frame; it is not an observation of the current source.

Check status before starting a viewer. `status` exits 0 for a ready server and 3 for an answered but not-ready server, including one still starting behind its launcher, or a refused connection (nothing listens, so `ensure` may start one). It exits 4 when the port accepted the connection but `/health` did not answer within the probe: a listener, usually a busy viewer, holds the port, so `ensure` will not start another there and `stop` refuses because ownership cannot be verified. The silent report names the recorded pid and whether it is alive; for exit 4, use another port. `ensure` starts a server only when the connection is refused. At `/health`, verify the service identity, hardware renderer, `ready`, `serving.revision`, `serving.current`, `serving.stale`, `sourceError` and compilation status. A ready server may still draw its last good build after current source compilation fails. The revision is a source/import/basis digest rather than a Git SHA; compare it with the requested current generation before accepting a capture. Input documents and candidate bases live under the repository root's `.shots/human-viewer/inputs/`, regardless of the client's working directory.

The fields are `doc` (a face document id, `body:<state>`, or `file:<name>` for a hand-written document), `parts` (mesh names, comma separated), `view` (`front`, `left-three-quarter`, `left`, `back`, `right-three-quarter`, `right`, `top` or `bottom`, the figure's anatomical sides) with `pitch` (degrees added to its elevation), `pass` (`beauty`, the product frame, `clay`, `normal`, `depth`, `flat`, `albedo`, `wire` or `outline`; read the pass's `X-Pass-Reading` before judging it), `frame` (`x,y,z,radius` in metres, which zooms a joint or a seam), `look` (`yaw,pitch,distance,x,y,z[,fov]`, an exact camera that overrides the three above), `pose` (`<pose file>:<subject>`, a measured pose of the population folder resolved to `look`), `ao` (`on`, `off` by default), `size`, and for a face with a local reference photograph `ref` (`split`, `overlay` or `swipe`) and `opacity`. Left and right are the figure's anatomical sides, and a part is a mesh, which today is a material region and not yet an anatomical part. `render` draws one frame, `sheet` several (`axes="view:front,left;pass:beauty,clay"`), and `compare` the reference beside or over the render at the photograph's own camera. A frame is evidence only when the response's renderer names real hardware.

`flat` preserves its existing lit grey faceted rendering and shows triangle orientation and tessellation. `albedo` reads unlit authored base colour, texture, vertex RGB and alpha; it does not show roughness, specular, emissive or transmission and refuses unsupported custom shaders or active displacement. Structural overrides may make alpha brow and lash cards opaque, so they cannot be read as tissue. Calibration markers remain independent display auxiliaries under these passes and do not enter subject parts, framing, visibility selection or outline swaps. Beauty remains necessary for material response and illumination.

Two more fields serve reading and calibration. `landmarks` (`on` or `off`, default off) marks the photograph's observed landmarks over it in the page and in every saved frame that carries `ref`, so the frame needs a local photograph and a landmark entry for its subject. `calibrate` (`on` or `off`, default off) adds five spheres whose positions and colours were typed by hand (`humanViewerCalibrationRig`) beside the subject after framing. Project them through the exact camera with `projectHumanViewerCalibration`, find them by colour with `measureHumanViewerCalibration` and judge them with `judgeHumanViewerCalibration`: a sphere that is out of frame, occluded or off position marks a region as not observed. A live `/render` response carries `X-Pass-Reading`, the reading limit of its pass (a wire frame shows far-side edges through the near side), and `X-Human-Waited-Ms`, the time spent behind other requests and waiting out a source rebuild. A request that meets a rebuild waits for the settled generation, and a server that is still starting answers 503 with `Retry-After`.

Bulk responses marked `thumbnail-cache` or `thumbnail-stale` serve stored PNGs and currently omit the pass reading and hardware renderer. Their cache revision does not establish those missing facts. Use the default CLI lane's live render path for current hardware observations; retain a stale thumbnail's limited authority when recording it.

`node scripts/human-viewer/human-viewer-control.mts status|stop` from `test/` runs under plain Node with no project type check, so it works while the working tree has a type error that stops `ttsx` from starting any script. It honours `HUMAN_VIEWER_PORT` and reports exit 3 and 4 as `status` does. Stop kills only the pid in the selected port's process record, and only when the answering server reports that pid.

A hand-written document or a candidate basis goes into `.shots/human-viewer/inputs/`: `<name>.json` holds one document or an array (`file:<name>`, `file:<name>/<document id>`), and `<name>.basis.json.gz` beside it is the basis those documents are built on in place of the published one. A document must name the basis it is built on, and a wrong one is rejected with the reason (`/rescan` lists what was accepted and rejected). The drivers that write frames and records are clients of this server and never start a browser: `test/scripts/human-viewer/capture-face-references.mts STUDY OUTPUT POSE_FILE` for face documents at measured poses, `test/scripts/body-review/capture-editor.ts` for body states, views and passes, and `observe-body.ts` for the part, joint and whole units of the body (`connectHumanViewer` is their shared client). Each record holds the frames' SHA-256, the renderer, the revision and no image bytes. Read the frames yourself; the record says what was drawn, not that it is right.

Frames go to gitignored directories and never into the repository.

## Getting engine code into the page

For engine geometry that no product page shows, do not stand up vite or a bundler. Split it in two, which is simpler:

1. Run the TypeScript export entry through `pnpm exec ttsx -P <owning-tsconfig.json> <entry.ts>` from the repository root. The owning project supplies its type checks and configured transforms. Import the engine source module directly to inspect the working-tree implementation, build the geometry or pose, and write the result to JSON. Face-review entries use `test/tsconfig.scripts.json`; a diagnostic entry needs a project that includes it. The [development skill](../development/SKILL.md#validation) owns repository acceptance checks.
2. A dependency-free static page reads that JSON and draws it. It opens over `file://`, so no server is involved.

Create the context with `preserveDrawingBuffer: true` and call `gl.finish()` at the end of the render, or the screenshot and the pixel read will disagree about which frame they saw. Screenshot the canvas element rather than the page, and expose `gl.readPixels` on `window` when a claim needs coordinates and channel values rather than an impression.

## Flow

1. Build the page that shows the thing: the playground or website page that mounts `mountViewer`, or a minimal page that builds a model and applies the pose.
2. For a quantitative reading, render an independently defined reference shape first and verify the instrument and coordinate convention. Choose a discriminating counterexample for the measured claim. Appearance inspection follows the skill entry's observation procedure.
3. Load the page, set the model and the pose or motion, advance the player to the target time, and capture.
4. Read the capture against the intended result: the bones bend the right way, the limbs sit where forward kinematics says, the expression shows the named emotion, the camera frames the subject, materials and lighting match the authored values. For a dense region such as a face, a joint or a seam, capture at a higher resolution and crop and zoom into the region under test, and take measurements with `gl.readPixels` or an image library, instead of judging one downscaled full frame.
5. For motion, sample several timestamps (start, midpoints, end) and confirm the in-betweens are coherent, not just the keyframes.
6. Record concrete observations, their current source and conditions, and any unverified region in the owning task.

## Comparing against the previous behavior

Never `git stash` or check out an older commit to get the "before" frame. The working tree usually carries the user's uncommitted work, and that move destroys it.

Produce the prior geometry or input in an isolated temporary path without changing the working tree. Hold source inputs, camera, lighting and runtime fixed except for the change being compared, and state any mismatch. A reflected twin can test an instrument's directional sensitivity; it does not substitute for historical behavior.

## Cross-check against the engine

Compare rendered geometry and motion with the resolved engine result. A discrepancy on the same source and input points to the viewer path; an incorrect resolved result points to the engine or data. Matching geometry does not validate camera, material or lighting behavior, which must also be traced through their actual viewer inputs.
