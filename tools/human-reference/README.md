# Human reference research tools

These developer tools observe fixed private reference meshes, fit contour families and reconstruct surfaces for comparison. They are separate from the Human package and do not supply meshes, topology, indices or textures to it. A numerical fit, additional curve count or dense contour replay does not establish anatomical correctness, independent controls or a completed Human editor.

The [Human reverse-analysis procedure](../../.agents/skills/human/reverse-analysis.md) governs this work. A qualifying reverse render expresses the saved curve or formula representation through this repository's interface contracts, generates its surface through the engine and renders through the viewer. Wrapping an externally generated mesh in a typed model does not establish engine generation. The standalone contour replay and browser comparison remain diagnostic artifacts while this integration is incomplete.

## Inputs and isolation

Each operation consumes one absolute manifest path and writes to its own absolute private output directory. The manifest declares millimetres, frame, native or diagnostic posture, a gate identifier and named inputs with relative paths and SHA-256 hashes. `readInput` reads the verified bytes once before parsing, rejects path escapes and preserves declared source defects for the owning operator to interpret. Saved rig markers have no implied clinical meaning.

```json
{
  "schema": "human-reference-input-v1",
  "root": "ABSOLUTE_PRIVATE_INPUT_DIRECTORY",
  "gate": "PRIVATE_REFERENCE_ID",
  "units": "mm",
  "frame": "+X subject-left, +Y up, +Z front, native root origin, mm",
  "pose": "native-A",
  "files": {
    "body": { "path": "body.json", "sha256": "COMPLETE_FILE_SHA256" },
    "head": { "path": "head.json", "sha256": "COMPLETE_FILE_SHA256" }
  }
}
```

The example describes the document structure; its placeholder values are not executable inputs. Producers use `body`, `head` and optional `bodyT` for saved source meshes. Reconstruction uses `sections` and optional `fittedSections`. Viewer inputs are `source`, `reconstruction`, optional `observations` and optional `sections`; the viewer consumes saved generic payloads without importing an extractor.

Freeze declared inputs before starting an operation. `src/io/runFreeze.ts` takes `--manifest` and `--output`, copies verified bytes into an owned directory, checks that live inputs stayed unchanged throughout the copy and publishes `manifest.json` last. Subsequent operations read that frozen manifest. Different outputs use different version directories; `writeArtifact` atomically publishes JSON and refuses to replace different existing bytes.

`scripts/freezeSource.ps1` records a local committed source snapshot. Its absolute `ProjectRoot`, `Request` and `SnapshotRoot` arguments select an explicit source request and a private local repository with no remote. The request lists `sources`, private `inputs` and a `purpose`. Conditional workspace exports require an explicit ordered `workspaceConditions` list; browser artifacts are not silently substituted for source. Static relative TypeScript imports, emitted `.js` specifiers with a `.ts` source counterpart, directory barrels and workspace package exports are followed, including their governing `package.json` scopes. Compiler configurations, runtime-discovered assets and third-party dependency identities must be listed explicitly. The tool configuration resolves workspace interface types to the copied source barrel. Runtime workspace aliases must likewise resolve inside the frozen tree; a junction to live workspace source invalidates that dependency binding. Each round retains source copies and input hashes, checks the committed blobs against the unfiltered source bytes and publishes `CURRENT.json` only after those checks. Execute the copied tree with its relative layout preserved; an external dependency junction belongs to the recorded environment and must not copy mutable source back into the run.

Each author owns an entry project, mutable emission directory, output directory, viewer port and capture page. Entry projects extend `tsconfig.json` and include only their entry file; imported modules remain part of that compiler graph. Keep mutable emission state separate while reusing the compiler's supported content-addressed plugin cache for equivalent compiler, plugin source and environment identities. A separate cold `--cache-dir` for every author also rebuilds native plugins and is unnecessary. Required native guards use the shared verified plugin cache; actual geometry execution may use `ttsx --no-plugins` before the entry argument on the same frozen source while those guards run, without claiming a guard pass. Record the exact command and cache identity. Copy only the declared source and configuration byte closure; never recursively copy the repository configuration tree or `node_modules`. Record third-party dependency junctions separately. Only genuinely shared mutation takes the campaign's shared atomic lock. A long read-only runtime retains its frozen input lease rather than holding the compiler lock. A live file edited by another author is never a runtime input.

## Responsibilities

| Directory            | Author                     | Responsibility                                                         |
| -------------------- | -------------------------- | ---------------------------------------------------------------------- |
| `src/io`             | inventory                  | Hashed input admission, frozen runs and immutable artifact publication |
| `src/calibration`    | sampling                   | Scalar dimension coverage and between-identity design rank             |
| `src/geometry`       | observations               | Pure mesh, vector, plane-cut and nearest-surface operations            |
| `src/schema`         | limbs and inventory        | Region records and surface-course operators                            |
| `src/observations`   | observations               | Physical sections, orientation witnesses and critical levels           |
| `src/reconstruction` | reconstruction             | Contour correspondence, topology events and reconstructed skin         |
| `src/fit`            | curvefit                   | Cubic spans and reserved observations                                  |
| `src/headneck`       | headneck                   | Head, neck and shared saved face charts                                |
| `src/face`           | reconstruction/branch_math | Face patch consumers                                                   |
| `src/eyes`           | eyes                       | Orbital and lid observations                                           |
| `src/nosemouth`      | nosemouth                  | Nose and mouth observations                                            |
| `src/ears`           | ears                       | Ear observations                                                       |
| `src/trunk`          | trunk                      | Trunk section families and reserved cuts                               |
| `src/limbs`          | limbs                      | Limb families and shared wrist/ankle boundaries                        |
| `src/hands`          | hands                      | Palm and digit observations                                            |
| `src/feet`           | feet                       | Foot and toe observations                                              |
| `src/branches`       | branches                   | Shoulder, groin and branch observations                                |
| `src/viewer`         | viewer                     | Immutable hardware comparison runtimes and captures                    |

## Qualification

Record the committed source, immutable input manifest, fitted-span identities, actual surface consumer, runtime hashes, camera, renderer and capture time. Trace each observation family through fitting into the displayed skin; identify unconsumed and reserved families explicitly. Show surface, its actual construction over the surface and construction alone under matching cameras. Use raking light without fine material relief for form and keep source display normals separate from geometric normals.

Reverse-render acceptance requires a new mesh produced by consuming saved curves. Its primary comparison shows the source and reconstructed surfaces side by side with the same camera, light, material and geometric-normal policy. A source overlay establishes observations only. Replaying source vertices, source triangle indices or topology, copying the original source as a fallback, or borrowing its vertex normals for the primary comparison does not establish reconstruction. A separately identified display-normal diagnostic may localize shading differences.

Measure omission and addition separately, including branches, apertures, thin parts and held-out sections. A sampled maximum is an observed residual, not a complete-surface bound. Projected crossings of non-planar curves, exact planar source crossings and reconstruction self-intersections are different findings. Approximate reference correspondences do not certify age, population, adiposity or clinical measurements.

An observation omitted from a particular fit is not necessarily independent validation. If its person, angular sections or measurements informed earlier inspection or design, report a later split as retrospective. Preserve the original development history and reserve untouched identities and parameter combinations before fitting a shared rule.

The authors collect each complete round's defects, correct common causes together and inspect again. Two matched rounds without improvement require a change of source, correspondence or representation. Human and Human-viewer tests remain prohibited; these reference measurements and existing compiler guards do not replace actual-viewer inspection. Native compilation and checklist evidence apply to maintained tool declarations, whose `evidence.config.ts` selects the common and performance questions.

The product representation must develop curves from named physical measurements, relative local coordinates, ratios and shared rules. Saved dense cubic spans remain a measurement baseline; their control points, cages and patch records are not proposed editor inputs. Refining the Human parameters means incorporating defensible reverse-analysis rules into those measurement-driven formulas and preserving the existing physiological motion and closed-choice input contract.

The inherited reference overlay and whole-horizontal replay remain incomplete diagnostic work. Regional families, held-out correspondence, source defect policy, local face/branch engine consumers and anatomical parameter transfer require explicit evidence before the reverse-analysis or product campaigns can be called complete. Four seed references and many cuts on those same people do not establish a shared population equation; reserve distinct identities and parameter combinations before fitting and report free coefficients, spans and constraints alongside error.

## Maintained checks

`pnpm --dir tools/human-reference build` runs the workspace native compiler with its shared correctness and declaration guards. `pnpm --dir tools/human-reference evidence` checks this tool's common and performance acknowledgments. The main build workflow invokes these two checks explicitly without private reference inputs; this tool is not implicitly selected by the root workspace package globs. These commands inspect maintained tooling; they do not execute Human tests or certify the generated figure. Owner entry projects allow narrow native compilation while unrelated modules are still being authored; final integration requires the complete tool graph.
