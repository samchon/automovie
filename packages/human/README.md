# @automovie/human

TypeScript library for numerical human construction in AutoMovie. It defines body, face and person documents and provides geometry builders, anatomical measurements, appearance controls and static asset export APIs.

<a id="construction-surface"></a>
<a id="surface-hair-and-eyebrow-cost"></a>

The public modules cover:

- `body`: body dimensions, skeletons, skin, tissue construction and measurements.
- `face`: facial anatomy, expression, skin, eyes, numerical hair and eyebrows.
- `human`: face and body composition into person models and whole-person measurements.
- `common`: shared geometry, colour, document and static export utilities.

Numerical documents can be saved as JSON for editing and replay. Static export APIs encode supported models as GLB or glTF for rendering and asset exchange.

Resident numerical runtimes keep their admitted basis and evaluated document across preview, measurement, construction and explicit export requests. The application supplies worker transport and display controls; these modules own numerical evaluation:

- `@automovie/human/face/runtime/createConnectedFaceRuntime` evaluates face documents.
- `@automovie/human/body/runtime/createConnectedBodyRuntime` evaluates body documents against an injected whole-person measurement context.
- `@automovie/human/human/runtime/createConnectedBodyGenerationRuntime` supplies that context from paired source views.
- `@automovie/human/human/runtime/createConnectedPersonRuntime` evaluates assembled person documents and preserves construction admission.

`body/runtime/createConnectedBodyAnatomyRuntime` routes source-bound quantity, articular and exterior inspection requests to their admitted numerical owners. The corresponding `createConnectedBodyAnatomicalRuntime` and `createConnectedBodyExteriorRuntime` also accept direct requests. `human/runtime/createConnectedBodyHeadPerson` serializes a companion person's default face with the current body document and its skin colour.

The corresponding request and result declarations live beside their runtimes. Preview, construction and static export remain distinct results; a construction report retains the numerical owner's refusals.

Required CC0 basis and paired source-view assets ship under `@automovie/human/assets/*`, with their source manifest and MPFB license. Example documents and parameter sets belong to Playground's [`src/human/examples`](../playground/src/human/examples). The [Playground run guide](../playground/README.md#run) owns the Human inspection application; [Viewer](../viewer/README.md) supplies its display and capture runtime. Numerical construction, clinical qualification, visual quality and likeness are separate judgments.

## Whole-person solve support

`human/measure/humanPersonBodyReach` derives a copied solve basis from a compiled person's Body availability and corrective support, and the actual Head driver support for the same source endpoints. `createHumanPersonSimpleWhole` supplies this reach to whole-person Simple expansion; `solveHumanPersonMeasuredChannel` uses it for measurement inversion. The original generation, endpoint gains and raw Body authoring intervals remain unchanged. Isolated Body detailed solves retain their own domain, and projection reads the held shape through its original basis.

Limits depend on the selected generation rather than a universal weight cap. Missing endpoints remain unavailable, and a shared endpoint whose channel or corrective contributions need a coupled domain refuses with its identity instead of certifying independent axis intervals. A target outside measured joint reach receives a refusal; supported intervals do not establish that every requested combination is reachable or clinically qualified. The [numerical owner](src/human/measure/humanPersonBodyReach.ts) states the supported dependency forms.

## Build

In this repository, run `pnpm --filter @automovie/human build` with Node.js 22.23.2 or later; `prepack` uses the same build. The [package entry](build.mjs) invokes the installed `ttsc` executable with the ordinary package lint and transforms. It emits Node16 CommonJS and ESNext browser output, with Bundler resolution for the browser pass, into one package-owned staging directory. Both passes must succeed before `lib` is replaced. Failure in either compiler pass leaves the existing `lib` untouched and fails the command.

The Node stage and its `browser` subtree have the same directory depth as their final `lib` locations. The compiler's relative source-map paths therefore remain valid after publication. Previous output is copied to a separate stage sibling, so recovery files cannot enter the published file inventory.

Publication copies the previous output to a stage backup, retains the watched `lib` directory, and replaces changed files through exclusive sibling files and individual renames. Obsolete files are removed after replacements; empty directories may remain. A failed install restores previous bytes and file membership, including empty membership when no output existed. If restoration also fails, recovery files and the publication lock remain, and both errors are reported. This is atomic per file rather than an atomic import graph. The Playground source owner refuses new candidates while the lock exists; an already displayed model remains held. An exclusive `.human-build.lock` prevents competing builds and is never removed because of its age. Retained `.human-build-*` recovery directories and their lock require inspection before recovery or cleanup. The [publication owner](build/publishHumanBuild.mjs) defines this failure boundary.
