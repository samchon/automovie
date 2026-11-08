# Human debug viewer

The debug viewer shows a generated Human, as the whole figure or one piece of it, and draws frames of it as PNG over HTTP. It is a development tool that lives in the Human package and runs from its tracked source. The published library has no browser build and no viewer export; `files` publishes `lib` and `src` only.

- `vite.config.ts`, `debug.html`, `tsconfig.debug.json` and `tsconfig.debug.scripts.json` sit at the package root.
- Browser UI, HTTP service and capture clients are under `debug/`; pure source/display adapters shared with Node live in `src/inspection`:

| Folder | Holds |
| --- | --- |
| `debug/contracts/` | Typed contracts shared by the server and the page: the options parser (`HumanDebugOptions`), the routes and headers (`HUMAN_DEBUG_ROUTES`), the cameras (`HUMAN_DEBUG_CAMERAS`), the regions (`HUMAN_DEBUG_REGIONS`), the document and snapshot types |
| `debug/server/` | The Vite configuration, the server routes, the capture session, the generation slots, the source hash, the batch render |
| `debug/people/` | The people: every export of `packages/playground/src/human-parameters` |
| `debug/pieces/` | The piece registry (`HUMAN_DEBUG_PIECES`) and one file per piece, with sub-folders by region |
| `debug/page/` | The page: subject loading, view, shading, curves, stage, controls, compile panel |
| `debug/compare/` | The view comparison: the recorded view parts, their curves, the reference's underlay, its cuts and the deviations |
| `debug/capture/` | The image-route capture CLI and the inspection-plan client of the batch route |

## Direct Node Images

Node image and numeric diagnostic entries live in `src/executable` and compile with the Human package's `tsconfig.json`. Invoke screenshots through the registered package scripts, which supply `ttsx --no-plugins --noCheck`; the existing test/debug type watches check their respective programs. They import no debug, Vite or browser module. The old Node paths under `debug/capture` remain compatibility delegates for resident consumers. `@napi-rs/canvas` is a declared development dependency; no ignored private installation is required.

Run from the workspace root:

```powershell
pnpm --dir packages/human run node:capture --parts arm.left
pnpm --dir packages/human run node:canvas --reference-only
pnpm --dir packages/human run node:canvas --first-original
pnpm --dir packages/human run node:canvas --first-original --reference-cache-check
pnpm --dir packages/human run node:canvas --originals
pnpm --dir packages/human run node:canvas --all
pnpm --dir packages/human run node:torso --scope stages --out packages/human/.shots/human_sections_xhigh/s00-stages
pnpm --dir packages/human run node:six
pnpm --dir packages/human run node:inspect <absolute-packet-directory>
pnpm --dir packages/human run node:curve-cost --cpu-profile
pnpm --dir packages/human run node:curve-cost --source-cases --cpu-profile
pnpm --dir packages/human run node:scalar-cost
```

The source-rendering commands load the actual typed `packages/playground/src/human-parameters/f1.ts` module at run time; its local `tsconfig.json` owns the typed input project, inherits the Playground compiler options and resolves the unchanged lint configuration explicitly. The package library never statically imports Playground. Native-mesh image commands read `test/.shots/f1/reference-model.json` asynchronously. Their output goes under `packages/human/.shots/node_canvas_xhigh`, with PNG hashes, actual selected ids, cameras, source facts and separate drawing, encoding and writing times in each manifest. The fixed six-pair command requires the existing `packages/human/.shots/comparison_xhigh/node-ortho-pairs.json` receipts; they provide saved camera facts, not replacement geometry. Saved-reference control commands below instead read their explicit curve files and have their own output directory. No environment-variable setup is needed.

`--first-original` saves one actual S00 `q1.start` guide with the native reference, then verifies the earlier source hashes against archived bytes and records the after hashes. It does not request whole-body original providers, coupled torso closure or a raw loft. `--originals` reuses that prepared S00 candidate for its wider original inventory; missing composed streams and capture failures remain explicit. The first mode verifies the image path, not whole-curve or anatomical acceptance. In the 2026-11-07 02:45 +09:00 run, the one PNG completed with unchanged selected source hashes and exit 0. Entry import was 74.491 s, typed input loading 10.006 s, S00 original preparation 3.835 s, display 0.596 s, initial hashing 3.565 s and post-image byte archive 26.650 s. These distinct and sometimes nested boundaries neither isolate compiler cost nor meet the one-second generation target.

Reference-prefixed frames reuse an unlabelled background PNG and checked Float64 depth sidecar under `.shots/reference-background`. The key records the actual resolved camera, adapted reference buffers/colours and narrow raster/native-backend identity. Current curves, generated surfaces and labels are drawn afresh over copied buffers; one viewport is retained in memory. Changed camera/reference inputs miss, and incomplete or damaged entries are rendered again. Reference reading, parsing, identity preparation, cache lookup/decode/raster/encode/store, current composition and final PNG writing retain separate timings.

`--reference-cache-check` saves the real first frame before running same-camera uncached/cache comparisons. It exercises A/B/A/no-overlay display changes, dynamic labels, a synthetic current-surface probe, disk reads, camera/reference-colour changes and three damaged-entry cases. B is a display subrange, and the probe is not Human geometry. The complete command includes comparison overhead; a successful comparison establishes neither source speed nor anatomical acceptance.

The CPU rasterizer draws the existing original display curves, generated loft curves and prejoin raw operands as separate stages. It uses orthographic projection, a pixel depth buffer and flat Lambert clay; GPU PBR, shadows, smooth shading and antialiasing remain different from the viewer. A PNG or completed batch is an observation, not shape acceptance or final realization. Open the actual images and compare matching stage, selection, camera and size before drawing conclusions.

The explicit `node:torso --scope stages` inspection prepares one S00 candidate, requests its chest/front-course closure and reuses that exact source in the public single-profile `skin:true` realization. Seven identical cameras show original/reference, retained atlas curves, those curves with the official mesh, and mesh alone. Named section lines and three meridians per face are display selections, not the entire adaptive grid or new authored originals. This single-leaf tessellation is separate from whole-person final skin and binding. Diagnostic vertex replay/edge readings have their own elapsed field and do not precede `--first-original`. Selected source archives and the returned numeric mesh buffers accompany subsequent stage packets. The first 28-frame round at 04:14 on 2026-11-07 retained two footprint display failures and exited 1; shoulder shape and mesh seam/large-face display remain unaccepted. Complete public realization was 40.656 s, including admission, physical2/grid/atlas, body drawing and tessellation; it is not isolated loft time.

For generated-source observations, both renderers consume `HumanInspectionCurves`: original scalar controls and their support remain intact, while displayed edges, axis and top rings stay within the actual `part.stations` interval. `top.<k>` retains its original front-positive knot index; support knots outside the physical part do not produce a displayed ring.

The curve-cost command measures actual shared preparation, sampled display evaluation and native raw lofts separately, without loading a reference or rendering images. Display polylines, top rings and axis samples are not independent authored input curves. The scalar-cost command re-prepares actual borrowed control records with the public interpolator and measures its explicit reads; original representative-formula construction time remains unmeasured rather than inferred from that probe.

The existing curve-cost entry's `--source-cases` mode instead requests the current f1 original providers and sparse first native/edge reads without raw loft, tree assembly or rendering. It compares fresh first, same-value and neck-circumference-plus-1-mm contexts in one loaded process. Required common constraints stay inside the actual calls; inclusive producer intervals overlap and must not be added. Import, typed input loading and report IO have separate boundaries. CPU profiling adds observation overhead. Missing composed inputs, provider failures and sparse coverage keep this diagnostic from establishing anatomical acceptance or the 100 ms target.

Distinguish authored representative formulas/control records, derived signed-outline/fullness fields, generated 3D sections/lofts and materialized display lines in each report. Shared constraint and parent-placement costs belong to their measured acquisition phases; references from several rows do not make those costs additive. Command-to-program startup includes compiler preparation, runtime hooks and module evaluation and is not a pure compilation time. Code/input/config hashes identify the observed disk epoch without certifying every transformed module actually consumed by the process.

### One-shot capture

`node:capture` captures everything a question about a set of parts needs in one process. From the selected parts it expands each original curve alone, each part alone, the part with its neighbours (frame-chain parent, children and port or contour sharers) and the whole figure. It draws each at four stages: the original 2D curves with their spec's construction aids, datums and frame triads over the reference registered into the same frame; the generated loft curves; those curves over the default clay; and the clay alone. The cameras are front, left, right, back, top, bottom, a high and a low oblique from the front-left, and an oblique close-up at each joint or port. A single-curve row gets close-ups only at the ports its curve reaches, and its reference is cropped to the slab of stations that curve spans, widened by 15 mm. The source is prepared once per run; no whole-figure calibration or final realization is requested.

```powershell
pnpm --dir packages/human node:capture --parts arm.left
pnpm --dir packages/human node:capture --parts "arm.*" --scope individual --stages original --views "front,left,top,closeup.*" --frame local
pnpm --dir packages/human node:capture --compare packages/human/.shots/f1_capture/<earlier-packet>
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--parts` | `*` | Comma-separated part globs; `*` spans dots, `?` is one character. |
| `--scope` | `individual,neighbours,whole` | `individual` gives each curve alone and the part alone. |
| `--stages` | `original,loft,loft-clay,clay` | A single-curve row has only `original`; its loft belongs to its part row. |
| `--views` | `*` | Camera-name globs, such as `front,closeup.*`. |
| `--frame` | `local,world` | `local` draws a curve row in its own segment frame and a part or neighbour row in the part's root frame; `world` draws the figure as it stands. The whole figure is drawn in `world` only. |
| `--pose` | `neutral` | `reference` displays the generated chain at the reference's measured joint bend, for display only. |
| `--compare` | none | Earlier packet to reproduce and pair before/after. |
| `--out` | `packages/human/.shots/f1_capture/capture-<stamp>` | Output directory; relative paths resolve from the directory the command was typed in. |
| `--size`, `--cell` | `720`, `300` | Frame and contact-sheet cell edges in pixels. |
| `--reference-cache` | `rows` | Reference-background cache use: `rows` (part, neighbour and whole rows), `all` or `off`. |
| `--plan` | none | JSON file with the same fields as `request` in the manifest; flags override it. |

The command prints the contact-sheet paths. A packet holds `frames/<frame>/<selection>/<stage>.<camera>.png`, `sheets/<part|whole>.<stage>.<frame>[.p<k>].png` with labelled cells and a colour legend, and `manifest.json`. The manifest records the request, the reference SHA-256 and the source file SHA-256 identities hashed at entry and at exit (a provider's `files` entry ending in `/` covers its directory's `.ts` files; a file changed between the two is listed and printed, because the frames may show either version, and neither hash certifies the bytes `ttsx` compiled before the entry), each part's placement, relations, curves, ports, loft and registration facts, the expanded selections, every cell with its selection, stage, frame, resolved camera, file and SHA-256 or its unavailable cause, its display, raster, encode and write times, reference-cache facts, and the run's separate input-load, construction, reference-read, frame, sheet and pair times. A cell that cannot be drawn, and every neighbour or figure part without a provider, appears as an unavailable cell naming its cause. The command exits non-zero when a planned cell has no complete record.

A neighbour or whole row checks each part's box against the median of the parts' box centres. A part whose farthest box corner lies more than 1.75 statures from it (the diagonal of a 1.25 by 1.06 by 0.4 stature box, arms raised, is 1.69) is left out of that row's camera fit, still drawn, named with its distance in a red line of the sheet header, recorded under `outliers` and listed in the manifest problems, so the command exits 1. Every part and curve in the manifest carries its world bounds in millimetres, which locate the outlying geometry. A NaN or infinite framing coordinate (in a curve, aid, datum, clay or reference) would make every fitted camera NaN and every frame empty: such points are left out of the fit, the part and its count are named in the same red header line and in the problems, a camera that is still not finite turns its cell unavailable with the fields as cause, and each curve's `nonFinite` list names the line, aid or datum holding one with its first such point.

`--compare` reads the earlier `manifest.json`. An earlier `node:capture` packet replays its request and reuses each cell's recorded resolved camera exactly. An earlier `node:arm-specs` packet records only camera names: its neutral frames map to `arm.left/part` at the `original` stage in the world frame, with `elbow-oblique` and `wrist-oblique` as the port close-ups, refitted by name; its posed frames are listed with their cause. Pairs go to `pairs/` and `sheets/compare*.png`, each labelled with whether the camera was exact.

Regions supply parts through capture providers. Each region owns `src/executable/Node<Region>CaptureSource.ts`, exporting a namespace of the file's name with a `PROVIDER` (`NodeCaptureSources.IProvider`: part `names`, source `files` and `prepare(name, context)`); the capture loads every such module at run time. `prepare` builds the part from the region's public constructors and returns `CaptureSpecs.part(bundle)`, which turns its segment frames, shared `AutoMovieHumanArmCurveSpec` specs, engine loft chain, ports, relations and registered reference into the display model. `NodeCaptureSources.ts` lists the figure parts that still have no provider. Outline specs are exact when the provider supplies its station-to-parameter map (`outline`) or the knots' parameter is the station; otherwise the curve is labelled a display approximation. A fullness spec draws shoulder lines on every quarter unless the provider scopes it to named pairs of neighbouring outlines (`quarters`). Each loft cap fans to the ring of the end it closes (`pole.end`); an end without a pole stays open. The arm's root stands at identity until a trunk placement exists, so its local root frame and world coincide.

The renderer is the existing CPU z-buffer (`NodeCanvasRaster`), with original-stage lines drawn through the reference and loft-stage lines depth-tested. List flags accept commas or spaces between members, since PowerShell passes an unquoted `a,b` on as `a b`.

The full default `arm.left` run on 2026-11-08 02:03 planned and drew 556 cells with no manifest problem and exit 0. It took 147 s from command to exit, of which 89.3 s ran in the process: input load 3.7 s, arm construction with the reference read and registration 0.82 s, cells 73.4 s (raster 43.4 s, encode 20.2 s, write 3.7 s, display assembly 0.3 s) and sheets 10.7 s. The rest is `ttsx` startup before the entry runs. Its 52 cached reference cells made 22 misses and 30 disk hits, because the arm's local root frame equals its world. Comparing that packet with itself replayed all 556 cells with their exact cameras, and every PNG matched the earlier SHA-256; the 556 pairs and 93 comparison pages added 81 s. Comparing the `node:arm-specs` packet `f1_arm/specs-2026-11-07T14-51-36-075Z` paired its four neutral frames, refitted by name, and listed its four flexed frames with their cause.

### Saved reference controls

`pnpm --dir packages/human run node:reference-bases` publishes the existing private f1 pack to `.references/curves/hermite/f1` and `.references/curves/bezier/f1`. It copies Hermite bytes, uses Recovery's algebraic same-parameter cubic basis conversion, and verifies every serialized curve's original metadata. Independent numerical observations compare position and first two derivatives at five parameters per span; they do not observe the entire continuous domain. These two f1 copies are explicit Node inspection inputs. The viewer, capture identity and existing cohort aggregates retain their original `.references/curves/<id>/` sources, including f1, f2, m1 and m2; no other person's data is copied or converted. A differing existing destination refuses publication. `basis-publication.json` records actual destination bytes and hashes; copied acquisition indexes and verification files describe the original Hermite publication.

Inspect one real span with `pnpm --dir packages/human run node:reference <hermite|bezier|both> <relative-json-file> <section-or-station-index> <kind> <curve-ordinal> <span-index>`. `both` observes the same selected source in the two saved bases in one process. Choose identifiers from that private file, for example a `sections/trunk/NNN.json` or `limbs/<bone>/<family>-NNN.json` publication. Kind and ordinal identify a closed loop or open arc without confusing their separate ordinal namespaces. The command reads asynchronously and draws through the existing Node camera, line and native Canvas adapters. PNGs and exact input/camera/hash receipts live under `packages/human/.shots/reference_aids_xhigh`.

Blue shows the saved reference curve, gold its actual four-point control polygon, teal the unnormalized endpoint tangent handles and grey the control-hull box. Handle controls need not lie on the curve. The box bounds the polynomial only in its saved coordinate frame; a fixed 64-chord display has no geometric error guarantee. These are reference authoring aids, separate from original anatomical definitions, generated lofts and final skin. They supply no anatomical fitting target or generated-Human acceptance.

The observed f1 example selects one saved limb-plane span in both bases:

```powershell
node_modules\.bin\ttsx.CMD --no-plugins --noCheck -P packages/human/tsconfig.json packages/human/src/executable/HumanReferenceInspect.ts both limbs/arm_l/arm_l-heads-v2-001.json 0 closed 0 0
```

## Running

```powershell
# from packages/human
pnpm debug
pnpm ttsc --noEmit --watch -p tsconfig.debug.json >> .shots\debug\ttsc-debug-watch.log 2>&1
```

The first command serves the viewer on `http://127.0.0.1:5197`. `AUTOMOVIE_HUMAN_PORT` selects another port, from 1024 to 65535, and each port gets its own dependency cache. The second command is the viewer's compile collector, which checks `debug` and the Human `src`. Its log is the default of `AUTOMOVIE_HUMAN_CHECK_LOG`, and the page's corner panel and `/human-debug/compiler.json` report its latest cycle. The tests and the other packages have their own collector, `pnpm ttsc --noEmit --watch` in `test/`, logging to `.shots\debug\ttsc-test-watch.log`; the viewer does not read it.

Vite strips types and checks none; the compile collector checks them. The viewer draws from the type-stripped source whatever the collector reports and shows its state: the compile panel and, while the latest cycle (`/human-debug/compiler.json`) has not passed, a notice name the cycle, and the image and batch routes carry it in `x-human-compile`.

An open page keeps its evaluated modules until it is reloaded by hand or by a capture's own request: Vite's update socket is off (`server.hmr: false`), so a save reaches no page. Reloading requests modules from the running server; when investigating stale workspace dependencies, compare their actual served exports/bytes with disk rather than treating a disk hash as proof of transformed-module freshness. The file watcher ignores `.shots`, `docs`, `dev`, `lib` and Markdown. With HMR disabled, do not assume configuration or imported server code restarted the running server. After its queue and in-flight request are empty, use `r` then Enter in its existing Vite terminal and confirm the new capture session actually loaded the change before requesting a frame. A page reload alone does not replace the server's capture-session implementation. The compile panel reads `/human-debug/compiler.json` when it mounts and whenever it opens; subject loading also reads the latest cycle. None of these reads blocks generation.

## The page

`http://127.0.0.1:5197/debug.html?person=f1` shows the whole figure of `f1`. Add `piece=<name>` or `piece=<name>:<argument>` to show one registered piece. Every option is a URL variable, and the sidebar and the URL stay in sync both ways (orbiting writes `az`, `el`, `dist` and `target`). A rejected value keeps its default and is listed in the red notice box. The person and piece menus list the registries.

The page generates its subject itself, with the modules it loaded:

- The whole figure is `AutoMovieHuman.prepare` of the person's typed inputs, generated once per person and page load and shown in its pose, by default the anatomical neutral. `HumanDebugPose` poses it with the production rig: an `AutoMovieHumanInstance` gives each bone's local transform under the pose and at the bind, and the engine's `skinAutoMovieMesh` moves every bound part with the binding's own method, so a pose that translates a bone (a folded scapula or atlas) moves it too. `pose=bind` shows the skin as generated. Its construction tubes ride the same binding and return as the curves they were swept along, so the whole figure and a piece draw curves through the same tube renderer and options.
- Each whole-figure load writes one `[human-debug timing]` line (prepare, pose, curves and textures milliseconds; evaluate and skin for a pose) to the console, which the server log repeats, and the same numbers to the provenance.
- A piece uses its registered builder and reads no file. Most read the person's typed inputs or calibration; `body.parts` instead uses declared fixed diagnostic inputs. A piece that calls `person.calibration()` first runs the whole production calibration, even when its displayed output is a small component.

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
| `camera` | `three-quarter` | `front`, `back`, `left`, `right`, `top`, `bottom`, `three-quarter` (also `three`), `three-quarter-back` |
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
| `reference` | none | `f1`, `f2`, `m1`, `m2`: the view comparison against that reference person (see below) |
| `referenceStyle` | `clay` | `clay` (compatible native f1 mesh, otherwise section walls), `loft` (section curves) |
| `referenceOpacity` | `0.35` | the reference clay's opacity, (0, 1] |
| `referencePart` | `*` | reference pieces drawn: native `head`/`body` or section-pack region globs (`trunk`, `head`, `arm.left`, `leg_l`, ...) select those regions whole; compared-part globs (`nose`, `breast.left`, `lid.*`) use their displayed-curve boxes plus 15 mm; `none` draws none |
| `part` | `*` | compared part patterns over part names (`leg.left`, `head.*`), also scoping numerical deviation; `none` selects none |
| `views` | `front,side,top` | subset of `front,side,top`, `none` |
| `axis` | `1` | `0` hides the compared parts' axes |
| `legend` | `1` | `0` hides the comparison's legend |
| `viewLabels` | `1` | `0` drops the compared curves' labels (`<part> · <view>`) |

Framing fits the focus box with a 15 percent margin from the camera's direction (`placeHumanDebugCamera`). `reference` light is a key at camera-space (1, 1.4, 0.7) with hemisphere 0.6. `raking` puts the key `lightEl` degrees above the screen plane on `lightSide` with hemisphere 0.08.

## Pieces

A piece is one file under `debug/pieces/` exporting one `IHumanDebugPiece` and listed once in `HUMAN_DEBUG_PIECES`. Its `build(person, argument)` makes a component document (`IHumanDebugDocument`) with the input scope below. Each part of the document is one thing to judge alone, so the part list can show, hide and colour it. `arguments` lists the arguments the batch render opens the piece with. A fixed or analytic diagnostic piece is not an observation of the generated person's corresponding anatomy.

| Piece | Shows |
| --- | --- |
| `chains:<globs>` | the named chains lofted alone from the person's calibration, such as `chains:leg.left` |
| `source.parts:<globs>` | actual current-person source parts lofted together before final joins, without whole-person calibration; default `trunk`. Reserved `tree` selects exactly the production tree's current names, excluding studies and definition-only parts. Batch examples are `tree`, `trunk`, `trunk,gluteal.*,leg.*`, `arm.left,thumb.left` and `arm.right,thumb.right`; direct piece requests accept other part-name globs |
| `region:<region>` | the chains of one region of `HUMAN_DEBUG_REGIONS` (head, neck, trunk, shoulder, arm, hand, leg, foot), both sides; its provenance lists chains no region names |
| `web:<hand\|foot>` | the region's web patches (`AutoMovieHumanBodyWeb`) lofted with their parents and children alone, the web-grouped interval of each chain with its lips and columns |
| `timing` | milliseconds per generation stage (calibrate, surface, split, construction, skin chart, rig) and per skin chart group; each chain's layers and phases; the raw skin pieces |
| `body.parts[:trunk\|finger\|limb]` | standalone raw lofts from `HumanDebugBodyFixtures`, ignoring the selected person's inputs; default `trunk` |
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
| `web.saddle` | two seam patches over an analytic translational surface sized from the person's second toe; boundary curves and a comparison grid |
| `head.parts[:all\|mass\|parts\|composed\|nose\|nose.alone]` | `mass`/`parts`/`nose.alone` are raw lofts; `all` adds the realization's chain and blend lofts; `composed` is the realized head and `nose` its head-mass/nose merge. Reads public head inputs and the shared pure neck source without whole-person calibration; default `all` |
| `hair.guides[:<every>]` | the scalp hair the production hair stage builds on the generated figure at the bind: head and ear skin, `human.hair.cards` and `human.hair.scalp` as parts, every `<every>`-th guide (default all) as a curve `human.construction.hair.<left\|right>/g<root>` (left for a canonical root, right for its mirror); it generates the whole figure, so it takes minutes |

A chain end whose parent chain is not lofted closes as a flat fan at its axis: that lid is the cut, not anatomy.

`source.parts` shares the reference comparison's one latest source-definition cache. It selects the last actual `HumanDebugViewParts` result per name and passes its existing `loft.chain` to `HumanDebugChainLoft`; it does not call `person.calibration`, `AutoMovieHuman.prepare` or final realization. Only the selected chains receive raw surface/construction tessellation. Source exceptions propagate, an empty usable selection throws with available names and diagnostics, and unavailable or unmatched requested parts remain explicit in provenance. `body.parts` remains a fixed-input construction diagnostic and is not a substitute for these current-person parts.

Named body selections consume the actual shared `BodyLaw.original` provider and its required parents; digit/toe wildcards enumerate the production factories' names without preparing every child. Head mass reads its canonical original directly, while other head selections borrow the same lazy regional original provider used by composition. Original displays do not request raw lofts. `source.parts` explicitly requests each selected actual original's raw loft once from that context. Provenance keeps `scoped-source-definition`, requested/observed names and `tree:not-assembled`; this is not a partial successful production tree. Use `pieces=source.parts*gluteal*leg*` for the retained trunk/gluteal/leg registry example. `tree` and an unscoped comparison retain the complete source-definition path. The [comparison instructions](../../../.agents/skills/human/screenshot.md#selecting-curves-and-parts) describe selected original evaluation, explicit missing support and not-run aggregate measurements.

The source piece's `observation.stage=prejoin-part-loft` and `finalRealization=not-run` distinguish it from ordinary final output. `treeParts`, `studies`, `definitionOnlyParts` and `unavailableParts` retain their different meanings; `sourceObservation`, `sourceRecords` and original source `diagnostics` stay available. Selecting several parts displays their actual relative placements together, without joining their overlapping surfaces. The source-to-person scale is applied once to the new document's points about the floor before the ordinary mm-to-m adapter; chain frames/sources, normals and indices are unchanged. A piece has no rig pose.

For a selected hand and thumb, use `person=f1&piece=source.parts:arm.left,thumb.left&parts=none&curves=arm.left/*,thumb.left/*&labels=0&viewLabels=0`. These are the generated sections, axes and guides, not original `view.*` outlines. Start a new page source with `keep=0`, then keep that round with `keep=1`. Frame the curves in perspective and retain explicit `az`, `el`, `target` and `dist` from its camera receipt, converting receipt metres to URL millimetres. With that same piece and camera, restore `parts=arm.left/*,thumb.left/*` for the default-clay overlap, then set `curves=none` for the surface alone. Repeat individual and neighbour selections from the needed directions. A raw loft or its fan lid proves no final merge, trimmed skin or anatomical acceptance.

For a readable net, select existing principal section ids, the axis and a few fixed-phase `g<j>` guides from the current inventory; this filters display without changing layer count, coefficients or phase sampling. The registered left-hand example's full-snapshot batch uses `pieces=source.parts*arm.left*`. An explicit batch `piece=source.parts:<globs>` instead selects that one dynamic subject; without `piece`, `pieces` still filters registry entries. The verified foot request uses `/human-debug/batch/f1.json?round=<unique>&pieces=inspection-explicit-piece-only&piece=source.parts:foot.left&cameras=left&parts=none&curves=foot.left/*&keep=0&fresh=<unique>`. Its adjacent JSON preserves the full snapshot, unlike the truncated image provenance header. Continue a confirmed source round with `keep=1`.

For the whole production tree before joins, use `piece=source.parts:tree` or the single-entry batch filter `pieces=source.parts*tree`. The selection reads `sourceObservation.treeParts`, not `*`, so it neither adds unconnected studies nor fixes a person's part count. Provenance `selection=production-tree`, selected names and unavailable tree lofts state its coverage. Use `parts=none;curves=*;curveWidth=0.08;labels=0;viewLabels=0` for every generated section, axis and guide, then `parts=*;curves=none` for the default clay of those same raw lofts. Omit `reference`; retain the same explicit perspective camera for each pair. These assembled prejoin operands have no Boolean joins, clothing or rigged pose and are not the final realized skin. Subtractive operands also appear as positive raw surfaces; no Boolean difference is applied.

## View comparison

`reference=<id>` turns the page into the view comparison: one reference person of the private pack drawn as an underlay, and over it, in that person's own frame, the 2D view curves of every part the current source builds from the inputs of `person` (the reference itself when `person` is unset). It answers whether each part's views stand where the reference's skin is. `piece` and `pose` are not read.

- The comparison pack is the checkout's git-ignored original `.references/curves/<id>/` collection (f1, f2, m1, m2). The page reads Hermite horizontal sections at run time through Vite's file serving (`HumanDebugReferenceFiles`), thinned to one section per millimetre of height; nothing of it enters the repository, and a checkout without it answers that no pack is present. Source fitting diagnostics do not bound the start/midpoint display polygon, its rounding or its height thinning. The separate `.references/curves/{hermite,bezier}/f1/` copies are read explicitly by the Node reference-control command.
- `referenceStyle=clay` adopts f1's private `test/.shots/f1/reference-model.json` when compatible: its native static `head` and `body` become `human.skin.reference.head/0` and `human.skin.reference.body/0`. Coordinates, vertices and retained triangle indices stay in the original metre frame, with normals derived by the ordinary viewer. `referencePart=body` selects that body whole; other source-part crops exclude original triangles unless all three vertices pass their displayed-curve box, without clipping or capping. Cropping can lose boundary triangles. Source buffers remain intact, but camera bounds follow the active triangle index/draw range using current morph/skin and world placement, so unused positions do not expand a crop to the whole body. `referenceDisplay.nativeRegions` still describes the original artifact regions; `snapshot.camera.region` records the actual display bounds. Native `body` is not remapped to pack regions.
- An absent or incompatible native artifact leaves an explicit notice and the existing translucent section walls (`HumanDebugReferenceModel`), at `referenceOpacity`. Those fallback parts are `human.skin.reference.<region>/0` (`trunk`, `head`, `arm_l`, ...); missing support and the wall reach cap can leave gaps. `loft` always draws the sampled pack as grey curves. `referencePart` chooses exact whole regions or the displayed source curves' boxes (`HumanDebugReferencePieces`); unset, it keeps the whole reference. `referenceDisplay` separates displayed source/hash/bounds and excluded-triangle counts from deviation's independently sampled section source.
- `HumanDebugViewParts` borrows actual production originals through the canonical preparation's named providers, or observes the complete `AutoMovieHumanBodyLaw.define` result. Both paths retain that same call-owned context and raw suppliers; observation does not wake lazy loft getters. The ordinary calibration consumes the same definition; this comparison does not run final joins, skin or rig checks. `observation` distinguishes full/scoped source definitions and `finalRealization: not-run`, tree parts, unconnected studies, definition-only and unavailable names. `sourceRecords` preserves observed attempts and their diagnostics; a failed last result cannot display an earlier success instead. Explicitly requested raw diagnostics remain separate from unrequested work and survive re-observation.
- Each part has one colour (`legend=1`). `human.construction.view.<part>/front.pos`, `front.neg`, `side.pos` and `side.neg` read the shared original outline evaluator in the actual axis frame, independently of section admission. Display points include knots, scalar extrema, finite poles and declared stations with subdivisions; this is no world-curve error bound. `axis` is the actual source axis. `top.<k>` evaluates named-knot original fullness through the public section owner, or reads a returned raw section when present; neither proves complete loft admission. Missing non-pole sections are diagnosed without renumbering. `part`, `views`, `axis` and curve controls select these ids. Read `curveProducers`, `sourceTopProducers`, `sourceCurveDiagnostics` and source hash in the full snapshot; an older resident can still use the former display.
- `deviation` retains the compact `name_E..._B..._T..._R...` rows in person mm (`HumanDebugViewDeviation`), scoped by the existing `part` globs; `part=*` requests the whole table. Part scope belongs to page subject identity while equivalent source construction remains cached. `deviationScope` reports selected names, complete/partial/unavailable measurement coverage, missing support and an empty selection. Complete refers only to that selected diagnostic work. E/B use 10 mm linkage and 9/12 angle-sector coverage, proving neither closure nor containment; T/R use nearest kept projected segments, not exact 3D skin error. No value is an anatomical acceptance target.
- Provenance `milliseconds` separates pack/native reads, source generation, original-curve arrays, reference display/flattening and selected deviation work. `work` counts source curves/points, reference segments, selected raw/support stations and actual cut/distance queries. Native source identity and diagnostic scope precede large diagnostic payloads, but the full batch snapshot remains authoritative when the header is truncated. GPU completion is not timed by these loader fields.

Examples, one URL a frame:

```text
/debug.html?reference=f1&camera=front&ortho=1
/human-debug/images/f1-side.png?reference=f1&camera=left&ortho=1&w=1000&h=1400
/human-debug/images/f1-legs.png?reference=f1&part=leg.*,foot.*&views=front&camera=front&ortho=1&parts=reference.body*&legend=0
/human-debug/images/f1-top.png?reference=f1&referenceStyle=loft&camera=top&ortho=1
/human-debug/images/f1-head.png?reference=f1&part=head.*,nose*,lip.*&referenceStyle=loft&camera=three
/human-debug/images/f1-nose.png?reference=f1&part=nose*&referencePart=nose*&camera=left&ortho=1
```

The legs example selects the native body's mesh. With section fallback, use `parts=reference.leg_*,reference.foot_*` instead; inspect the actual `referenceDisplay` and matched ids before interpreting either frame.

## Image route

`GET /human-debug/images/<name>.png?<variables>&fresh=<nonce>` answers the PNG of the page's `#viewport` drawn with those variables. `keep=1` draws on the source the page has loaded even if files were saved since, so a series of frames shares one generation. `x-human-source-sha256` records the disk source inventory checked when that page loaded; served transformed dependencies require separate verification. `<name>` is any file name of letters, digits, `.`, `_` and `-`; it labels the request and plays no part in the frame. `ui` is forced to `0`. An unset `w` or `h` becomes 1200, so a frame's size is fixed by its URL. A variable the parser rejects answers HTTP 400 with every notice.

| Header | Meaning |
| --- | --- |
| `x-human-source-sha256` | disk source hash checked around page loading; transformed dependency freshness is qualified below |
| `x-human-cache` | `new-requested-frame` when drawn for this request, `existing-png` when a kept frame answered |
| `x-human-load-attempts` | source/module attempts; above 1 means an earlier attempt failed and was retried |
| `x-human-png-sha256` | SHA-256 of the PNG bytes |
| `x-human-captured-utc` | UTC time the PNG was taken |
| `x-human-query` | canonical variables the page drew |
| `x-human-gpu` | WebGL renderer string; a software renderer is refused |
| `x-human-notices` | URI-encoded page notices, one per line |
| `x-human-provenance` | URI-encoded JSON of the subject's provenance (pose, stage milliseconds, counts), cut at 7000 characters |
| `x-human-compile` | the compile collector's latest cycle as `<phase> <cycle>`, information only |

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

A frame records the source identity checked around page loading:

1. Before the page loads, the session hashes the source. The page reads the hash itself once all its modules have evaluated, before it generates anything, and the two must be equal.
2. The capture page gets no Vite update socket, so saves made afterwards cannot reach its modules.
3. A later frame reuses the page while the disk still hashes the same. Otherwise it reloads; `keep=1` deliberately retains its evaluated modules instead.
4. A save between the two hashes or a transient module-fetch failure is retried after 3 s times the attempt, up to eight attempts. A frame that still fails answers HTTP 503 with `retry-after`. A boot or mount error preserves its original cause and fails as initialization rather than retrying as a source change.

Any other failure answers HTTP 500 with its cause, which the server log repeats with the page's own stack.

These hash checks detect disk changes during loading; they do not independently hash Vite's cached transformed dependency bytes. A stale server graph can therefore violate the intended source correspondence. Repair that public module graph and verify its real consumer before accepting a visual result; a matching hash alone cannot establish it.

Vite keeps automatic page refresh disabled. Its file watcher still invalidates module transforms when a source file changes; this is separate from the browser's HTTP cache. The server configuration sends `Cache-Control: no-store`, and newly created capture pages disable HTTP caching through CDP before navigation. These policies do not replace already evaluated page modules or change the explicit frozen-round `keep` policy. Server-side capture and batch implementations are startup imports and require normal server reloading after their code changes; page modules are loaded through Vite on the next page load.

A frame that changes the person or the piece generates in the page. A frame that changes only the pose re-poses the person's prepared body, kept for the page's lifetime, in seconds; the session's subject key is the person and the piece, so such a frame takes no generation slot. While it does, the session holds one of the machine's generation slots, which are shared with every viewer and probe. A slot is the directory `.shots/locks/generation/slot-<n>`, at most two run at once, and `AUTOMOVIE_HUMAN_SLOTS` and `AUTOMOVIE_HUMAN_SLOT_ROOT` change the count and the directory. The session admits 16 requests at a time and serializes them on one resident headless Chrome page. It keeps up to 256 MiB of PNGs, so a repeated URL without a new `fresh` nonce answers `existing-png`. Changing the person takes minutes; options on the same subject take seconds.

## Batch route

`GET /human-debug/batch/<person>.json?round=<name>&cameras=<list>&pieces=<globs>&<variables>` draws every part of a person and saves the images as evidence.

- Without an explicit `piece`, subjects are the whole figure (`whole`) and every piece entry of the registry (each registered argument is its own entry, such as `region:arm`), narrowed by `pieces`. An explicit `piece` selects that one dynamic subject instead. Each subject is drawn from every camera of `cameras` (default all), with the other variables applied to every frame.
- Each frame is written as `<subject>.<camera>.png` beside `<subject>.<camera>.json`, under `packages/human/.shots/debug/<person>/<round>/`. The JSON holds the source hash, PNG SHA-256, capture time, cache state, attempts, canonical variables and the page snapshot.
- The answer lists every frame with its file, hashes and notices, or its error. A failed frame does not stop the others.
- The first frame binds the batch to the source on disk and every later frame keeps that source, so one batch is one generation per subject and every frame of it has the same `source`, however often files are saved meanwhile. `keep=1` keeps the page's loaded source from the first frame too, so the batches of several people on one viewer share one source.
- The batch answers only when every frame is done, so use a long client timeout.

```powershell
Invoke-RestMethod "http://127.0.0.1:5197/human-debug/batch/f1.json?round=r1&cameras=front,left,back,top&curves=none" -TimeoutSec 7200
Invoke-RestMethod "http://127.0.0.1:5197/human-debug/batch/m2.json?round=r1-feet&pieces=foot.*,region:foot&cameras=front,top,three-quarter" -TimeoutSec 7200
```

## Capture CLI

For a single f1 plan covering whole, individual original curves, available rings, explicit neighbour groups and matched raw loft/clay passes, use the [inspection packet guide](../../../.agents/skills/human/screenshot.md#inspection-packets). It owns the working command, plan format, output index/manifest, source and camera checks, and resume/failure rules. The image-route CLI below remains useful for arbitrary manual shots.

`debug/capture/human-debug-capture.ts` saves shots of the image route as files. It draws nothing itself:

```powershell
node_modules\.bin\ttsx.CMD -P packages\human\tsconfig.debug.scripts.json packages\human\debug\capture\human-debug-capture.ts --out packages\human\.shots\<you>\<round> --base "person=f1;piece=foot.loft;keep=1" --shot "front:camera=front;keep=0" --shot "top:camera=top;curves=none"
```

Run it from the repository root.

- `--base` is the search text every shot starts from, and each `--shot <name>:<text>` replaces its variables. `;` stands for `&`, because the Windows shim of ttsx reads `&` as a command separator.
- `--origin` names another viewer.
- Each shot asks a new frame (a unique `fresh` nonce) and is kept as `<name>.png` only when the route answers `new-requested-frame` and the received bytes hash to `x-human-png-sha256`. `receipt.json` lists every kept shot: its file, URL, SHA-256 and the response headers, the source hash and capture time among them.
- Start a new source round with `keep=0`, as the first shot above overrides the base; `keep=1` keeps that page's source for the remaining shots while files are saved. Inspect the receipt and intended source before accepting the round. Neither value verifies cached transformed dependency freshness.
- A failed shot keeps no PNG, adds one line with its cause to `<person>-FAILED.txt`, and the run goes on; the program then exits with code 1.
- The page's work on a frame always ends, with the frame or with a failure that names the stage the frame was in (navigating, loading the modules and generating, applying options, taking the screenshot):
  - `Human debug page crashed` at once when Chrome's renderer dies, most often out of JavaScript memory in a generation; the crash dump is under the browser profile's `Crashpad/reports`;
  - `Human debug page closed` or `Human debug Chrome disconnected` at once;
  - `Human debug frame exceeded its budget of 960 s` with the page's JavaScript stack, read by pausing its debugger; the budget is twice the slowest whole-person generation measured (481 s);
  - `Human debug page stalled` with the requests it still waits on, when mounted-page ready/apply work does no main-thread work for a minute: the server reads its task time every 5 s (Chrome's `Performance.getMetrics`, `debug/server/HumanDebugStall.ts`, proven by `test_human_debug_stall`). Cold module mounting keeps the frame deadline without this generation observer.

  Each closes the page, so the generation slot is released and the next frame loads a fresh page. A cause about the page's own generation (a crash, a stack in `src`) belongs to the generator; a stall or a hang without such a cause is a viewer defect to trace before any visual claim.
- A request whose client leaves before its frame starts is dropped from the queue. `status.json` names the running frame's stage and every queued request with its wait, and the server log names what a new request is queued behind.
- A subject that throws in the page fails its frame with the page's whole stack. Every address in it is rewritten through Vite's source map of that module to the TypeScript file, line and column, relative to `packages/human` (`src/generation/<file>.ts:<line>:<column>`); an address without a map keeps the served numbers and is marked `(unmapped)`. Initialization errors preserve their original cause. A transient module-load failure includes recorded refused modules (up to eight), with Vite's message and source location when available. The same text is the HTTP failure body, the server log's `[human-debug]` line, and an entry of `status.json`'s `failures` (the latest eight, newest first, with time, options and stage). While the route answers 503 for a source-change retry, the CLI asks again after `retry-after`, for up to 30 minutes; compile state is information, not a generation gate. Requests carry no timeout, since changing the person takes minutes.

Stack mapping uses the server's current transforms. A save after the page loaded can therefore map against newer text; retain the original failure and source identity when interpreting its location.

The current campaign's f1 evidence set starts a new source round, then continues from the front to the left and back on that source:

```powershell
node_modules\.bin\ttsx.CMD -P packages\human\tsconfig.debug.scripts.json packages\human\debug\capture\human-debug-capture.ts --out packages\human\.shots\owner\<yyyyMMdd-HHmm> --base "person=f1;curves=none;w=900;h=1500;keep=1" --shot "f1-front:camera=front;keep=0" --shot "f1-left:camera=left" --shot "f1-back:camera=back"
```

## Diagnostics

| Route | Answers |
| --- | --- |
| `/human-debug/index.json` | people, pieces with their arguments, batch entries, cameras, regions |
| `/human-debug/source.json` | current source hash |
| `/human-debug/status.json` | admitted requests, the running frame with its stage and seconds, the queued requests in order with their waits, the latest eight failures with their mapped stacks, the page's source and subject, kept frames, generation slot holders |
| `/human-debug/compiler.json` | the compile collector's latest cycle |

The source hash covers the package's `src` and `debug` trees, the `src` tree of every workspace dependency in `packages/human/package.json`, the typed people, and the page and configuration files at the package root.
