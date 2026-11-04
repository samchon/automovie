# Screenshots

The Human debug viewer serves `http://127.0.0.1:5197`. It is the package's one shared viewer under development's [Scripts And Shared Checkouts](../development/SKILL.md#scripts-and-shared-checkouts): when none answers, start it from `packages/human` with `pnpm debug`, detached from the shell that starts it, and read its queue at `/human-debug/status.json`. Its [README](../../../packages/human/debug/README.md) owns every route, URL variable, header and piece.

The viewer strips types and draws even while its type-check watch, which the README calls its compile collector, reports errors, showing the watch's latest cycle in its compile panel and in each frame's `x-human-compile` header. Its watch is `pnpm ttsc --noEmit --watch -p tsconfig.debug.json` from `packages/human`, beside the test watch of development's [Type Checking](../development/validation.md#type-checking); read its state beside every capture. An open page keeps the source it loaded until it is reloaded.

| Use | Path under the viewer endpoint |
| --- | --- |
| Interactive page | `/debug.html?person=f1`, one piece alone with `&piece=<name>` |
| PNG | `/human-debug/images/<name>.png?person=f1&<variables>&fresh=<nonce>` |
| Every part of a person | `/human-debug/batch/<person>.json?round=<name>` |
| View curves over a reference | `/debug.html?reference=f1` with the README's view-comparison variables |

## Frames

- The surface alone is `curves=none`, the curves alone `parts=none`, and hair or underwear hide with `hide=<pattern>`.
- A registered piece (`piece=<name>`) isolates its documented component for inspection; check that piece's input and generation scope before using it.
- Give every new frame a unique `fresh` nonce, and accept it as new only when `x-human-cache` is `new-requested-frame`.
- Keep its `x-human-captured-utc`, `x-human-png-sha256` and `x-human-source-sha256` headers. The source hash records disk identity around page loading; it does not independently certify a server's cached transformed dependencies. When stale imports are suspected, repair and verify the actual served graph before making visual claims. A later save does not change an already drawn frame, and `x-human-load-attempts` above 1 means loading was retried.

## Selecting Curves And Parts

Run the capture CLI from the repository root. It sends one request at a time, checks the PNG hash and saves the response headers in `receipt.json`. Read the shared queue and coordinate the round's source and subject first. When saved page code must be loaded, use `keep=0` for its first frame, then `keep=1` throughout that frozen round. For changed server code, wait for no in-flight or queued request, reload with `r` then Enter in its existing Vite terminal and confirm the new capture session; a page reload alone leaves the old server implementation running. Use the task's person scope, f1 in these examples, and your own output and temporary paths.

```powershell
$env:AUTOMOVIE_HUMAN_PEOPLE = 'f1'
$captureTemp = [IO.Path]::GetFullPath('packages/human/.shots/comparison/runtime-temp')
if (-not (Test-Path -LiteralPath $captureTemp)) { New-Item -ItemType Directory -Path $captureTemp | Out-Null }
$env:TEMP = $captureTemp
$env:TMP = $captureTemp
$capture = 'packages/human/debug/capture/human-debug-capture.ts'
$config = 'packages/human/tsconfig.debug.scripts.json'
$out = 'packages/human/.shots/comparison/curve-selection'
node_modules\.bin\ttsx.CMD -P $config $capture --out $out --base 'person=f1;reference=f1;referenceStyle=clay;referencePart=*;parts=reference.head*;part=nose;curves=view.nose/front.pos;views=front;axis=0;viewLabels=0;legend=0;ortho=1;w=900;h=900;keep=0' --shot 'nose-one-curve:camera=left'
```

After the first receipt confirms the intended source, use `keep=1` for the remaining selections in that frozen round. `keep=0` checks disk identity; it does not verify the freshness of cached transformed dependencies. Start a new source round with `keep=0` rather than inheriting the continuation examples below.

`part` selects compared view parts, `referencePart` selects or crops the reference, `parts` selects rendered meshes and `curves` selects curve ids. A compared curve is `human.construction.view.<part>/<front.pos|front.neg|side.pos|side.neg|top.<k>|axis>`; only `human.construction.` may be omitted, so `view.` stays. The clay reference is a mesh: `parts=none` would hide it. Change the example's curve id to inspect every edge and ring individually, with `views` admitting that curve and `axis=1` when selecting its axis.

For f1 clay, a compatible private `reference-model.json` supplies native `reference.head/0` and `reference.body/0` meshes in its original metre frame. Use `parts=reference.body*` for that native body; pack region names such as `reference.trunk*` do not rename it. `referencePart=body` keeps the whole native body, while a compared-part crop excludes original triangles whose vertices leave its source-curve box. Such a crop loses boundary triangles and adds no cap; its full position buffer can also retain unused bounds, so use explicit framing. Read `referenceDisplay` for the displayed source/hash, retained triangles and fallback cause. Without a compatible artifact, clay keeps the sampled section walls and shows a notice; blank support is unavailable evidence. Loft underlay and deviation still read the section pack, independently of the native mesh.

This comparison assembles the same production source definition that calibration later realizes, without running final joins or rig checks. Read `observation.stage=source-definition` and `finalRealization=not-run` in the full batch snapshot. `treeParts` belong to that production tree; `studies` are unconnected; `definitionOnlyParts` and `unavailableParts` expose remaining support. `sourceRecords` retains every body attempt, its actual tree membership and original diagnostics. A repeated name displays its last result, including failure, rather than an earlier success.

`part` also scopes the numerical deviation table; `part=*` requests the whole table. Read `deviationScope` with every row: `complete` means measurement support for the selected raw stations, `partial` or `unavailable` names missing support, and none means anatomical acceptance. An empty selection is explicitly unavailable. Changing part scope reloads this request-owned display and diagnostics while the equivalent production source remains cached. Phase milliseconds and work counts distinguish reference reading, source curves and selected station queries; they do not measure GPU completion.

The comparison's front and side curves read the engine's shared original-outline evaluator in the actual source axis frame, independently of section success. Display polylines include named knots, scalar extrema, finite pole endpoints and declared stations, with subdivisions between them; this is an observation of the source, not a world-curve tessellation-error guarantee. Source-display failures appear in `sourceCurveDiagnostics` alongside the unchanged production diagnostics in provenance. A failed edge is withheld with its cause, while valid neighbours remain visible; an empty selection is not a passed curve.

`view.<part>/top.<k>` belongs to the section owner's raw fullness at front-positive source knot index `k`; a rejected section leaves that index unavailable with its diagnostic, and a closing pole has a point rather than a top ring. The ordinary person or piece view's `<chain>/<k>` sections and guides belong to the final loft. Read `curveProducers` and the source hash before judging the curves: an older resident page can still carry the former surviving-section display. Briefly enable `viewLabels=1` to establish each id (including `top.<k>`), then turn labels off; inspect both signs separately, every available top ring and the axis, without substituting a curve pair or a completed capture list for [2D acceptance](verification.md#curves-against-the-reference).

Continue the confirmed round with a neighbouring group by replacing that command's `part`, `curves`, `views` and `keep`:

```text
part=nose*,lip.*;curves=view.nose*/*,view.lip.*/*;views=front,side,top;keep=1
```

Continue the same frozen round with one top ring over the reference's own curves:

```powershell
node_modules\.bin\ttsx.CMD -P $config $capture --out "${out}-top" --base 'person=f1;reference=f1;referenceStyle=loft;referencePart=*;parts=none;part=nose;curves=reference.head/*,view.nose/top.10;views=top;axis=0;viewLabels=0;legend=0;ortho=1;w=900;h=900;keep=1' --shot 'nose-one-top-ring:camera=top'
```

Keep reference curves in `curves`; `curves=view.*` would remove this underlay. For a top group use the preceding group's `part` and `curves` and add `reference.head/*`. These curves have no mesh for `focus` to match, so omit it and let the visible curves frame the camera. In clay, visible mesh bounds win even with no `focus`: a head reference can clip the head mass's long neck. Include the needed reference meshes (`reference.head*,reference.body*` for the native artifact, `reference.head*,reference.trunk*` for the section fallback), or inspect the complete curves in a separate loft pass. `referencePart=*` can stay fixed while `parts` or `curves` hides unrelated regions, avoiding repeated reference-subject loads; use a part crop when the full region hides detail. Record gaps in the reference's support rather than judging the generated curves against blank pixels.

In the ordinary generated-person view, omit `reference` and select actual skin ids with `parts` and actual construction ids with `curves`. `piece=head.parts:nose;parts=*;focus=nose/*;curves=none;shade=clay;light=raking;lightSide=left` builds the head mass and nose as one realized merge, with its joining skin retained. Change `lightSide=right`, then compare construction over the surface and construction alone. `piece=head.parts:nose.alone` shows the nose's raw loft. Filtering only nose faces from the fully joined figure can expose holes cut for hidden neighbours; it does not build a nose subtree. Read the matched ids before interpreting a gap and include only the joins belonging to the selected group. The [piece registry and URL inventory](../../../packages/human/debug/README.md#pieces) own the remaining names.

Repeat each selection with `camera=front`, `left`, `top`, `back`, `bottom` and needed obliques; `az=45;el=20` is one free-camera example. Keep camera, target, projection, light and size identical between compared passes. `focus` fits visible mesh ids, `target=x,y,z` sets the target in mm and `dist` sets the distance in mm. For matched surface/overlay/construction passes, use perspective (`ortho=0`) and retain explicit `az`, `el`, `target` and `dist` from the viewer's orbit URL or the batch receipt's camera record, converting its metres to mm. Visibility changes can refit an orthographic frame, and changing `dist` does not zoom it.

The image receipt preserves headers and the canonical query; its provenance header can be truncated, so use the batch snapshot for full diagnostics, matched ids and camera placement. To continue the confirmed frozen round, a single reference selection can use `/human-debug/batch/f1.json?round=<unique-name>&pieces=whole&cameras=left&reference=f1&part=nose&curves=view.nose/front.pos&views=front&axis=0&keep=1&fresh=<unique-nonce>`; keep the same reference style and regions as that round. If this batch starts a new source round instead, set `keep=0` for its first frame. Open its saved PNG and read `snapshot.shown`, `snapshot.camera`, provenance and source before making the [judgment](verification.md).

## References

Reference outputs live in `test/.shots/<alias>/`, selected by `test/.shots/manifest.json`: `captures.json` indexes the original photographs, `recovery/screenshots/index.json` the Recovery renders, and `hermite-curves.json.gz` holds the saved curves. The view comparison reads the private section pack under `.references/curves/<alias>/`.
