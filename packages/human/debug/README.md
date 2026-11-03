# Human debug viewer

The debug viewer shows a generated Human, as the whole figure or one piece of it, and draws frames of it as PNG over HTTP. It is a development tool that lives in the Human package and runs from its tracked source. The published library has no browser build and no viewer export; `files` publishes `lib` and `src` only.

- `vite.config.ts`, `debug.html`, `tsconfig.debug.json` and `tsconfig.debug.scripts.json` sit at the package root.
- All viewer code is under `debug/`:

| Folder | Holds |
| --- | --- |
| `debug/contracts/` | Typed contracts shared by the server and the page: the options parser (`HumanDebugOptions`), the routes and headers (`HUMAN_DEBUG_ROUTES`), the cameras (`HUMAN_DEBUG_CAMERAS`), the regions (`HUMAN_DEBUG_REGIONS`), the document and snapshot types |
| `debug/server/` | The Vite configuration, the server routes, the capture session, the generation slots, the source hash, the batch render |
| `debug/people/` | The people: every export of `packages/playground/src/human-parameters` |
| `debug/pieces/` | The piece registry (`HUMAN_DEBUG_PIECES`) and one file per piece, with sub-folders by region |
| `debug/page/` | The page: subject loading, view, shading, curves, stage, controls, compile panel |
| `debug/capture/` | The capture CLI, a client of the image route |

## Running

From `packages/human`:

```powershell
pnpm debug
pnpm ttsc --noEmit --watch -p tsconfig.debug.json >> .shots\debug\ttsc-debug-watch.log 2>&1
```

The first command serves the viewer on `http://127.0.0.1:5197`. `AUTOMOVIE_HUMAN_PORT` selects another port, from 1024 to 65535, and each port gets its own dependency cache. The second command is the compile collector. Its log is the default of `AUTOMOVIE_HUMAN_CHECK_LOG`, and the page's corner panel and `/human-debug/compiler.json` report its latest cycle. `pnpm debug:check` runs the same check once.

Vite strips types and checks none; the compile collector checks them. Nothing is generated on a failed or unfinished compile: while the collector's latest cycle (`/human-debug/compiler.json`) is checking, failed or missing, the page shows the compiler's messages and generates nothing until a cycle passes, the image and batch routes answer 503 with `retry-after` while it checks and 409 after a failed cycle, each with the messages.

An open page reloads when a file it loaded is saved: Vite's update socket reaches it, and no module accepts a hot update, so every change is a full reload. A capture page blocks that socket, so a frame stays bound to the source its page loaded. The file watcher ignores `.shots`, `docs`, `dev`, `lib` and Markdown. Vite restarts the server when its configuration file or a module the configuration imports changes (`vite.config.ts`, `debug/server`, `debug/contracts`, `debug/poses`); a restart closes the capture session and its page. The compile panel reads `/human-debug/compiler.json` when the page loads, when the panel is opened, and every 3 s while a compile blocks generation.

## The page

`http://127.0.0.1:5197/debug.html?person=f1` shows the whole figure of `f1`. Add `piece=<name>` or `piece=<name>:<argument>` to show one registered piece. Every option is a URL variable, and the sidebar and the URL stay in sync both ways (orbiting writes `az`, `el`, `dist` and `target`). A rejected value keeps its default and is listed in the red notice box. The person and piece menus list the registries.

The page generates its subject itself, with the modules it loaded:

- The whole figure is `AutoMovieHuman.prepare` of the person's typed inputs, generated once per person and page load and shown in its pose, by default the anatomical neutral. `HumanDebugPose` poses it with the production rig: an `AutoMovieHumanInstance` gives each bone's local transform under the pose and at the bind, and the engine's `skinAutoMovieMesh` moves every bound part with the binding's own method, so a pose that translates a bone (a folded scapula or atlas) moves it too. `pose=bind` shows the skin as generated. Its construction tubes ride the same binding and return as the curves they were swept along, so the whole figure and a piece draw curves through the same tube renderer and options.
- Each whole-figure load writes one `[human-debug timing]` line (prepare, pose, curves and textures milliseconds; evaluate and skin for a pose) to the console, which the server log repeats, and the same numbers to the provenance.
- A piece builds from the person's typed inputs and the current production code, and reads no file.

## URL variables

`HumanDebugOptions` reads and writes these variables, one declaration each:

- Patterns are `*` globs over part ids (`human.skin.<chain>/<k>`, `human.hair.*`, and so on) or curve ids (`human.construction.<chain>/<k|axis|g<j>|name>`). The namespace prefix `human.skin.` or `human.construction.` may be left out.
- Lists are comma separated or the variable repeated, and `none` is the empty list.
- Colours are `rrggbb`.
- Lengths are mm and angles degrees in the body frame: forward +X, up +Y, left +Z, floor at y = 0.
- In `partColor`, `thick` and `curveColor` the last matching entry wins.

| Variable | Default | Accepted |
| --- | --- | --- |
| `person` | first exported person | export name of `packages/playground/src/human-parameters` |
| `piece` | none: the whole figure | `<name>` or `<name>:<argument>` of `HUMAN_DEBUG_PIECES` |
| `pose` | `neutral` | `neutral`, `bind` (the skin as generated), or another key of `HUMAN_DEBUG_POSES`; a piece ignores it |
| `parts` | `*` | part patterns shown, `none` |
| `hide` | none | part patterns hidden after `parts` |
| `partColor` | none | `pattern:rrggbb` list |
| `curves` | `*` | curve patterns shown, `none` |
| `curveHide` | none | curve patterns hidden after `curves` |
| `kinds` | all | subset of `section,axis,guide,path`, `none` |
| `curveWidth` | `0.6` | tube radius mm, (0, 20] |
| `thick` | none | `pattern:radius` list, radius mm in (0, 50] |
| `curveColor` | kind colour | `pattern:rrggbb` list |
| `xray` | `0` | `1` draws every curve through the surface (axes always are) |
| `labels` | `0` | `1` labels every shown curve, `marked` those in `thick` or `curveColor` |
| `camera` | `three-quarter` | `front`, `back`, `left`, `right`, `top`, `bottom`, `three-quarter`, `three-quarter-back` |
| `az`, `el` | the camera's | azimuth from +X toward +Z in [-360, 360], elevation in [-90, 90] |
| `dist` | fitted | camera distance mm |
| `target` | focus box centre | `x,y,z` mm |
| `fov` | `30` | vertical field of view, [5, 120] |
| `ortho` | `0` | `1` orthographic |
| `focus` | every shown part | part patterns the camera frames, for a close-up |
| `shade` | `clay` | `appearance` (generated skin, hair, eyes), `clay`, `normals`, `curvature` (red convex, blue concave) |
| `light` | `reference` | `reference`, `raking` |
| `lightSide` | `left` | `left`, `right`, `top`, `bottom` of the screen |
| `lightEl` | `10` | raking light above the screen plane, [0, 80] |
| `opacity` | `1` | surface opacity, (0, 1] |
| `wire` | `0` | `1` triangle edges |
| `normals` | `0` | `1` vertex normal lines |
| `normalLength` | `3` | mm, (0, 50] |
| `section` | `none` | `x`, `y`, `z`: plane normal to that axis |
| `sectionAt` | focus box centre | plane position mm |
| `sectionFlip` | `0` | `0` removes the + side, `1` the - side |
| `bg` | `f1f3f6` | `rrggbb` |
| `w`, `h` | `0` (fill) | canvas px, 0 or an integer in [64, 4096] |
| `ui` | `1` | `0` hides the sidebar and compile panel |
| `axes` | `0` | `1` body axes at the focus box corner |

Framing fits the focus box with a 15 percent margin from the camera's direction (`placeHumanDebugCamera`). `reference` light is a key at camera-space (1, 1.4, 0.7) with hemisphere 0.6. `raking` puts the key `lightEl` degrees above the screen plane on `lightSide` with hemisphere 0.08.

## Pieces

A piece is one file under `debug/pieces/` exporting one `IHumanDebugPiece` and listed once in `HUMAN_DEBUG_PIECES`. Its `build(person, argument)` makes a component document (`IHumanDebugDocument`) from the person's typed inputs and the production code only. Each part of the document is one thing to judge alone, so the part list can show, hide and colour it. `arguments` lists the arguments the batch render opens the piece with.

| Piece | Shows |
| --- | --- |
| `chains:<globs>` | the named chains lofted alone from the person's calibration, such as `chains:leg.left` |
| `region:<region>` | the chains of one region of `HUMAN_DEBUG_REGIONS` (head, neck, trunk, shoulder, arm, hand, leg, foot), both sides; its provenance lists chains no region names |
| `web:<hand\|foot>` | the region's web patches (`AutoMovieHumanBodyWeb`) lofted with their parents and children alone, the web-grouped interval of each chain with its lips and columns |
| `timing` | milliseconds per generation stage (calibrate, surface, split, construction, skin chart, rig) and per skin chart group; each chain's layers and phases; the raw skin pieces |
| `trunk.landmarks` | the trunk solve's landmark heights and points as markers, and the column's axis |
| `trunk.chains[:trunk\|upper]` | the `trunk` and `upper` chains built by the trunk solve alone (`AutoMovieHumanTrunkFixed`) and lofted alone |
| `shoulder.outline` | the left shoulder's frontal outline pieces: trapezius line, cap fillet, arm edge |
| `shoulder.oval` | the left arm root's ellipses from the axilla to the shoulder point |
| `foot.centres` | ankle and malleoli, metatarsal heads and ball, toe joints |
| `foot.knots` | every guide region's knots, one part per region |
| `foot.guides` | the five guides as ribbons and curves |
| `foot.arcs` | the five section pieces, each swept alone between its guides |
| `foot.body` | the body from its sections and the five toes from their spans, before lofting |
| `foot.loft` | the left foot and toes lofted alone from the foot construction |
| `hair.guides[:<every>]` | the scalp hair the production hair stage builds on the generated figure at the bind: head and ear skin, `human.hair.cards` and `human.hair.scalp` as parts, every `<every>`-th guide (default all) as a curve `human.construction.hair.<left\|right>/g<root>` (left for a canonical root, right for its mirror); it generates the whole figure, so it takes minutes |

A chain end whose parent chain is not lofted closes as a flat fan at its axis: that lid is the cut, not anatomy.

## Image route

`GET /human-debug/images/<name>.png?<variables>&fresh=<nonce>` answers the PNG of the page's `#viewport` drawn with those variables. `keep=1` draws on the source the page has loaded even if files were saved since, so a series of frames shares one generation; `x-human-source-sha256` then names that loaded source. `<name>` is any file name of letters, digits, `.`, `_` and `-`; it labels the request and plays no part in the frame. `ui` is forced to `0`. An unset `w` or `h` becomes 1200, so a frame's size is fixed by its URL. A variable the parser rejects answers HTTP 400 with every notice.

| Header | Meaning |
| --- | --- |
| `x-human-source-sha256` | hash of the source the page's modules were loaded from |
| `x-human-cache` | `new-requested-frame` when drawn for this request, `existing-png` when a kept frame answered |
| `x-human-load-attempts` | page loads it took; above 1 means saves interrupted loading |
| `x-human-png-sha256` | SHA-256 of the PNG bytes |
| `x-human-captured-utc` | UTC time the PNG was taken |
| `x-human-query` | canonical variables the page drew |
| `x-human-gpu` | WebGL renderer string; a software renderer is refused |
| `x-human-notices` | URI-encoded page notices, one per line |
| `x-human-provenance` | URI-encoded JSON of the subject's provenance (pose, stage milliseconds, counts), cut at 7000 characters |

Examples (PowerShell from `packages/human`):

```powershell
$base = "http://127.0.0.1:5197/human-debug/images"
Invoke-WebRequest "$base/f1-front.png?person=f1&camera=front&curves=none&fresh=a1" -OutFile f1-front.png
Invoke-WebRequest "$base/f1-raking.png?person=f1&camera=left&light=raking&lightSide=right&curves=none&fresh=a2" -OutFile f1-raking.png
Invoke-WebRequest "$base/f1-face.png?person=f1&camera=front&shade=appearance&focus=head*&curves=none&fresh=a3" -OutFile f1-face.png
Invoke-WebRequest "$base/m2-arm-curves.png?person=m2&piece=region:arm&camera=front&curves=arm.left/*&kinds=section,axis&thick=arm.left/axis:1.5&fresh=a4" -OutFile m2-arm.png
Invoke-WebRequest "$base/f1-foot-top.png?person=f1&piece=foot.loft&camera=top&curves=*/g*&curveColor=*/g*:ff00aa&fresh=a5" -OutFile f1-foot-top.png
Invoke-WebRequest "$base/f1-hand-seam.png?person=f1&piece=chains:hand.left*,finger.left.*,thumb.left*&camera=bottom&shade=curvature&fresh=a6" -OutFile f1-hand-seam.png
```

A frame is bound to one source:

1. Before the page loads, the session hashes the source. The page reads the hash itself once all its modules have evaluated, before it generates anything, and the two must be equal.
2. The capture page gets no Vite update socket, so saves made afterwards cannot reach its modules.
3. A later frame reuses the page while the disk still hashes the same. Otherwise the page loads again on the newer bytes.
4. A save between the two hashes, or a module graph that fails to load for a moment (the module script's error marker in `debug.html`), is retried after 3 s times the attempt, up to eight attempts. A frame that still fails answers HTTP 503 with `retry-after`.

Any other failure answers HTTP 500 with its cause, which the server log repeats with the page's own stack.

A frame that changes the person or the piece generates in the page. A frame that changes only the pose re-poses the person's prepared body, kept for the page's lifetime, in seconds; the session's subject key is the person and the piece, so such a frame takes no generation slot. While it does, the session holds one of the machine's generation slots, which are shared with every viewer and probe. A slot is the directory `.shots/locks/generation/slot-<n>`, at most two run at once, and `AUTOMOVIE_HUMAN_SLOTS` and `AUTOMOVIE_HUMAN_SLOT_ROOT` change the count and the directory. The session admits 16 requests at a time and serializes them on one resident headless Chrome page. It keeps up to 256 MiB of PNGs, so a repeated URL without a new `fresh` nonce answers `existing-png`. Changing the person takes minutes; options on the same subject take seconds.

## Batch route

`GET /human-debug/batch/<person>.json?round=<name>&cameras=<list>&pieces=<globs>&<variables>` draws every part of a person and saves the images as evidence.

- The subjects are the whole figure (`whole`) and every piece entry of the registry (each registered argument is its own entry, such as `region:arm`), narrowed by `pieces`. Each subject is drawn from every camera of `cameras` (default all), with the other variables applied to every frame.
- Each frame is written as `<subject>.<camera>.png` beside `<subject>.<camera>.json`, under `packages/human/.shots/debug/<person>/<round>/`. The JSON holds the source hash, PNG SHA-256, capture time, cache state, attempts, canonical variables and the page snapshot.
- The answer lists every frame with its file, hashes and notices, or its error. A failed frame does not stop the others.
- The first frame binds the batch to the source on disk and every later frame keeps that source, so one batch is one generation per subject and every frame of it has the same `source`, however often files are saved meanwhile. `keep=1` keeps the page's loaded source from the first frame too, so the batches of several people on one viewer share one source.
- The batch answers only when every frame is done, so use a long client timeout.

```powershell
Invoke-RestMethod "http://127.0.0.1:5197/human-debug/batch/f1.json?round=r1&cameras=front,left,back,top&curves=none" -TimeoutSec 7200
Invoke-RestMethod "http://127.0.0.1:5197/human-debug/batch/m2.json?round=r1-feet&pieces=foot.*,region:foot&cameras=front,top,three-quarter" -TimeoutSec 7200
```

## Capture CLI

`debug/capture/human-debug-capture.ts` saves shots of the image route as files. It draws nothing itself:

```powershell
node_modules\.bin\ttsx.CMD -P packages\human\tsconfig.debug.scripts.json packages\human\debug\capture\human-debug-capture.ts --out packages\human\.shots\<you>\<round> --base "person=f1;piece=foot.loft" --shot "front:camera=front" --shot "top:camera=top;curves=none"
```

Run it from the repository root.

- `--base` is the search text every shot starts from, and each `--shot <name>:<text>` replaces its variables. `;` stands for `&`, because the Windows shim of ttsx reads `&` as a command separator.
- `--origin` names another viewer.
- Each shot asks a new frame (a unique `fresh` nonce) and is kept as `<name>.png` only when the route answers `new-requested-frame` and the received bytes hash to `x-human-png-sha256`. `receipt.json` lists every kept shot: its file, URL, SHA-256 and the response headers, the source hash and capture time among them.
- `keep=1` in a shot's text draws it on the page's loaded source, so a series of people shares one source while files are saved.
- A failed shot keeps no PNG, adds one line with its cause to `<person>-FAILED.txt`, and the run goes on; the program then exits with code 1. While the compile gate answers 503 or 409 the shot is asked again after `retry-after`, for up to 30 minutes. Requests carry no timeout, since changing the person takes minutes.

The owner's evidence set, each reference person from the front, the left and the back on one source:

```powershell
node_modules\.bin\ttsx.CMD -P packages\human\tsconfig.debug.scripts.json packages\human\debug\capture\human-debug-capture.ts --out packages\human\.shots\owner\<yyyyMMdd-HHmm> --base "curves=none;w=900;h=1500;keep=1" --shot "f1-front:person=f1;camera=front" --shot "f1-left:person=f1;camera=left" --shot "f1-back:person=f1;camera=back" --shot "f2-front:person=f2;camera=front" --shot "f2-left:person=f2;camera=left" --shot "f2-back:person=f2;camera=back" --shot "m1-front:person=m1;camera=front" --shot "m1-left:person=m1;camera=left" --shot "m1-back:person=m1;camera=back" --shot "m2-front:person=m2;camera=front" --shot "m2-left:person=m2;camera=left" --shot "m2-back:person=m2;camera=back"
```

## Diagnostics

| Route | Answers |
| --- | --- |
| `/human-debug/index.json` | people, pieces with their arguments, batch entries, cameras, regions |
| `/human-debug/source.json` | current source hash |
| `/human-debug/status.json` | admitted requests, the page's source and subject, kept frames, generation slot holders |
| `/human-debug/compiler.json` | the compile collector's latest cycle |

The source hash covers the package's `src` and `debug` trees, the `src` tree of every workspace dependency in `packages/human/package.json`, the typed people, and the page and configuration files at the package root.
