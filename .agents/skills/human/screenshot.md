# Screenshots

Use the Human debug viewer, by default `http://127.0.0.1:5197`. After verifying ownership, start, stop or restart a task-owned server as needed without approval, and leave other owners' services running. From `packages/human`, start the viewer with `pnpm debug` and its compile collector with `pnpm ttsc --noEmit --watch -p tsconfig.debug.json`. Generation and capture never wait for the type check, and an open page never refreshes when a file is saved. The [debug README](../../../packages/human/debug/README.md) documents every route, variable and header.

| Use | Path under the viewer endpoint |
| --- | --- |
| Interactive page | `/debug.html?person=f1`, a piece with `&piece=<name>` |
| PNG | `/human-debug/images/<name>.png?person=f1&<variables>&fresh=<nonce>` |
| Every part of a person | `/human-debug/batch/<person>.json?round=<name>` |

## Free View

Every option is a URL variable listed in the debug README: `person`, `piece`, `parts`, `hide`, `partColor`, `curves`, `curveHide`, `kinds`, `curveWidth`, `thick`, `curveColor`, `xray`, `labels`, `camera`, `az`, `el`, `dist`, `target`, `fov`, `ortho`, `focus`, `shade`, `light`, `lightSide`, `lightEl`, `opacity`, `wire`, `normals`, `normalLength`, `section`, `sectionAt`, `sectionFlip`, `bg`, `w`, `h`. The surface alone is `curves=none`, the curves alone `parts=none`, and hair or underwear hide with `hide=<pattern>`.

- Give every new frame a unique `fresh` nonce.
- Accept a frame as new only when `x-human-cache` is `new-requested-frame`.
- Keep its `x-human-captured-utc`, `x-human-png-sha256` and `x-human-source-sha256` headers; the last names the source the frame reflects.

## Part View

View one piece or part alone in the component page of the development viewer. It shows a supplied document of parts with their surfaces and generating curves, and every option is a URL variable: the visibility and colour of each part, the visibility, thickness and colour of each curve, the camera, the shading, the raking light and the section. Build the document from a piece's standalone entry with fixed inputs, so a piece is seen in seconds without generating the whole body. The [debug README](../../../packages/human/debug/README.md) lists the variables, the piece registry and the piece contract.

## Running

- Start the viewer and its collector with the commands above; a red file never stops a capture.
- A frame's `x-human-source-sha256` is the source hash at module load, and a later save does not change a frame already made; a retry count above one shows a save during loading.

## References

Reference outputs live in `test/.shots/<alias>/`, selected by `test/.shots/manifest.json`: `captures.json` indexes the original photographs, `recovery/screenshots/index.json` the Recovery renders, and `hermite-curves.json.gz` holds the saved curves.
