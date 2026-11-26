import { FamilyConicCaptureCatalog as Catalog } from "./FamilyConicCaptureCatalog";
import { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicMeshTopology } from "./FamilyConicMeshTopology";
import { FamilyConicSource as R } from "./FamilyConicSource";
import { FamilyConicSourceCapture as Source } from "./FamilyConicSourceCapture";
import { NodeCanvasCamera } from "./render/NodeCanvasCamera";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";

import { AutoMovieHumanF1 as F1 } from "@automovie/human";
import type { IAutoMovieHumanF1 } from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/** One case lifetime shares actual geometry, display curves and cameras across both captures. */
export namespace FamilyConicCaptureContext {
  /**
   * Existing engine mesh, including its actual owners and material coordinates.
   *
   * @evidence contracts/development/design.md#principled-representation NonNullable imports the actual engine realization mesh including owner coordinates and metre positions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The engine remains the sole mesh schema owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No parallel mesh or missing-mesh stand-in is declared.
   * @evidence contracts/development/common.md#meaningful-documentation The comment names the imported actual realization mesh.
   */
  export type IMesh = NonNullable<
    ReturnType<typeof AutoMovieEngineConstruction.realize>["mesh"]
  >;
  /**
   * Shared close-zone framing, recorded by Figure before Deviation consumes it.
   *
   * @evidence contracts/development/design.md#principled-representation A named immutable-reference ROI holds metre points and explicit camera directions; twin reflects world z only.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Figure records this shared ROI and Deviation consumes it unchanged.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ROI is display framing and does not assign clinical laterality.
   * @evidence contracts/development/common.md#meaningful-documentation Members state fixed reference points and shared views.
   */
  export interface IZone {
    /** Physical display ROI identity; twin is the opposite world-z half. */
    id: string;

    /** Immutable-reference ROI points in metres, reused by every case and pass. */
    points: N.Point[];

    /** Explicit directions shared by Figure and Deviation for this ROI. */
    views: string[];
  }
  /**
   * Case-scoped evaluated state; it never retains a collection of realized cases.
   *
   * @evidence contracts/development/design.md#principled-representation One admitted case owns one mesh, raw/original catalogs, read-only reference, camera records and scalar frame evidence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Both callable consumers borrow engine/Human/render types in this shared case lifetime.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No collection of realized cases or PNG cache exists; timing snapshots and diagnostics are not acceptance.
   * @evidence contracts/development/common.md#meaningful-documentation Members state geometry units, exact provenance, shared camera/ROI scope and lifetime.
   */
  export interface IContext {
    /** Admitted exact producer record and checked source/preflight provenance. */
    input: Input.IInput;

    /** Same prepared originals saved before whole-tree realization. */
    source: Source.IState;

    /** Exact saved original-control evidence, surviving downstream failure. */
    originalEvidence: Input.IFile;

    /** One UTC capture timestamp used by both output directories. */
    round: string;

    /** The one actual native realization, with its owner coordinates. */
    mesh: IMesh;

    /** One same-mesh topology/component report; query time excludes generationMs. */
    meshTopology: ReturnType<typeof FamilyConicMeshTopology>;

    /** Display triangles copied from that same realization, in metres. */
    pieces: IAutoMovieHumanF1.IPiece[];

    /** All actual engine realization diagnostics; absence of a mesh still fails. */
    diagnostics: string[];

    /** One evaluated native-source/operator display catalog shared by all passes. */
    catalog: Catalog.IResult;

    /** Read-only private reference loaded after generated geometry. */
    reference: R.ISource;

    /** Unmodified reference triangles converted once from mm to display metres. */
    referenceMeshes: N.Mesh[];

    /** Exact private source identities used only as comparison provenance. */
    referenceHashes: Input.IFile[];

    /** Assembly, construction and realization wall time in milliseconds. */
    generationMs: number;

    /** Actual bounded source-display sampling time in milliseconds. */
    catalogMs: number;

    /** Process memory snapshots at three named boundaries; these are not a peak estimate. */
    memory: {
      before: NodeJS.MemoryUsage;
      afterMesh: NodeJS.MemoryUsage;
      afterCatalog: NodeJS.MemoryUsage;
    };

    /** Complete reference-fitted frames shared across passes and both consumers. */
    cameras: Map<string, N.Camera>;

    /** Figure-selected physical ROIs and views consumed unchanged by Deviation. */
    zones: IZone[];

    /** Actual original-evidence, Figure and Deviation output directories populated by their consumers. */
    outputs: Record<string, string>;

    /** Per-frame scalar raster work and identities, never retained PNG bytes. */
    frames: (N.Frame & { directory: string })[];
  }

  /**
   * Realize the same prepared source invocation and share its one resulting mesh.
   * Reference bytes are read only after generated geometry and source curves.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The prepared original assembly enters constructionFrom without another assembly, followed by one realization; owners, deviation and passes borrow its mesh and actual source catalog.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Scoped feature selection precedes generation, catalog creation and independent read-only reference loading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No converter, second anatomy law, fallback figure or mesh-derived original curve enters this context; loose-family omissions are refused.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes input resolution, generated diagnostics, native Point0 display and independent reference data.
   * @evidence contracts/development/implementation.md#efficient-algorithms One case retains one mesh/catalog/reference set; display sampling is bounded per source and cases are processed sequentially.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All pass and owner/deviation consumers borrow the same evaluated state without reassembly.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No global mesh or PNG cache is introduced; the caller releases this case context after both consumers settle.
   */
  export async function create(
    source: Source.IState,
    originalEvidence: Input.IFile,
  ): Promise<IContext> {
    const input: Input.IInput = source.input;
    if (F1.LOOSE.length !== 0)
      throw new Error("Native capture does not omit loose families");
    const before: NodeJS.MemoryUsage = source.memory.before;
    const started: number = performance.now();
    const assembly: IAutoMovieHumanF1.IAssembly = source.assembly;
    const declared: IAutoMovieHumanF1.IConstruction = F1.constructionFrom(assembly);
    const real: ReturnType<typeof AutoMovieEngineConstruction.realize> =
      AutoMovieEngineConstruction.realize(
        { name: "f1.body", root: declared.root, fills: declared.fills },
        { chord: 0.001, sources: declared.sources },
      );
    const diagnostics: string[] = real.diagnostics.map(
      (
        item: ReturnType<
          typeof AutoMovieEngineConstruction.realize
        >["diagnostics"][number],
      ): string => item.node + " (" + item.contract + "): " + item.detail,
    );
    if (real.mesh === null)
      throw new Error("Native figure has no mesh: " + diagnostics.join("; "));
    const mesh: IMesh = real.mesh;
    const generationMs: number =
      source.assemblyMs + performance.now() - started;
    const afterMesh: NodeJS.MemoryUsage = process.memoryUsage();
    const meshTopology: IContext["meshTopology"] = FamilyConicMeshTopology(mesh);
    const catalogStarted: number = performance.now();
    const cutters: string[] = F1.CUTTERS.flatMap(
      (item: (typeof F1.CUTTERS)[number]): string[] => [
        item.family.name,
        ...(item.mirrored ? [item.family.name + ".mirror"] : []),
      ],
    );
    const catalog: Catalog.IResult = Catalog.create(
      declared,
      real.surfaces,
      cutters,
    );
    const catalogMs: number = performance.now() - catalogStarted;
    const afterCatalog: NodeJS.MemoryUsage = process.memoryUsage();
    const reference: R.ISource = await R.load(input.root);
    const referenceMeshes: N.Mesh[] = [reference.body, reference.head].map(
      (part: R.ISource["body"], k: number): N.Mesh => ({
        id: "reference." + k,
        positions: Array.from(part.positions, (x: number): number => x / 1000),
        indices: Array.from(part.indices),
        colour: [0.64, 0.65, 0.67],
      }),
    );
    const referenceHashes: Input.IFile[] = [];
    for (const name of ["body-observations.json", "reference-model.json"]) {
      const file: string = path.join(input.root, "test/.shots/f1", name);
      referenceHashes.push({
        file,
        sha256: Input.hash(await fs.readFile(file)),
      });
    }
    return {
      input,
      source,
      originalEvidence,
      round: source.round,
      mesh,
      meshTopology,
      pieces: [
        {
          name: "body",
          positions: Array.from(mesh.positions),
          indices: Array.from(mesh.indices),
          diagnostics,
        },
      ],
      diagnostics,
      catalog,
      reference,
      referenceMeshes,
      referenceHashes,
      generationMs,
      catalogMs,
      memory: { before, afterMesh, afterCatalog },
      cameras: new Map(),
      zones: [],
      outputs: { originals: path.dirname(originalEvidence.file) },
      frames: [],
    };
  }

  /**
   * Explicit native camera handoff; the existing seven preset names/order stay unchanged.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing camera fit supplies native complete frames; underside flips top back/up and opposite low reflects the fixed world-z frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A per-case zone/view cache returns the first complete frame, preserving the common ROI and dimensions supplied by these two consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Core preset names/order are untouched; callers must keep ROI and dimensions stable for one zone/view key.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fit per native zone/view scans the supplied fixed reference points; later pass reads are constant-time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Figure and Deviation use identical 900-wide whole/close frames and the same cached ROI keys.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The map belongs to one case context and holds only small camera records.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states explicit complete native handoff without changing core presets.
   */
  export function camera(
    context: IContext | null,
    zone: string,
    view: string,
    points: readonly N.Point[],
    width: number,
    height: number,
  ): N.Camera {
    if (context === null)
      return NodeCanvasCamera.fit(view, points, width, height);
    const key: string = zone + "/" + view;
    const previous: N.Camera | undefined = context.cameras.get(key);
    if (previous !== undefined) return previous;
    let result: N.Camera;
    if (view === "underside") {
      const top: N.Camera = NodeCanvasCamera.fit("top", points, width, height);
      result = {
        ...top,
        name: view,
        back: [-top.back[0], -top.back[1], -top.back[2]],
        up: [-top.up[0], -top.up[1], -top.up[2]],
      };
    } else if (view === "low-oblique-other-side") {
      const low: N.Camera = NodeCanvasCamera.fit(
        "low-oblique",
        points,
        width,
        height,
      );
      result = {
        ...low,
        name: view,
        back: [low.back[0], low.back[1], -low.back[2]],
        right: [-low.right[0], -low.right[1], low.right[2]],
        up: [low.up[0], low.up[1], -low.up[2]],
      };
    } else result = NodeCanvasCamera.fit(view, points, width, height);
    context.cameras.set(key, result);
    return result;
  }

  /**
   * Add the opposite physical display ROI without assigning a clinical side.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing declared bilateral display ROIs gain their world-z-reflected predicate under the fixed bilateral-frame premise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The original zones precede reflected named counterparts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No clinical side or new anatomy selection is inferred.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear zone-list work retains predicates only.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both consumers use the Figure-recorded paired ROI list.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returned predicates borrow existing ones and leave scope with the case.
   * @evidence contracts/development/common.md#meaningful-documentation The comment distinguishes physical display pairing from clinical side.
   */
  export function pairedZones(
    zones: readonly [string, (p: N.Point) => boolean][],
  ): [string, (p: N.Point) => boolean][] {
    const paired: readonly string[] = [
      "hand",
      "foot",
      "ear",
      "knee",
      "fold",
      "toes",
      "armpit",
      "elbow",
      "hand.web",
      "hand.dorsum",
      "hand.roots",
    ];
    return [
      ...zones,
      ...zones
        .filter(([id]: [string, (p: N.Point) => boolean]): boolean =>
          paired.includes(id),
        )
        .map(
          ([id, inside]: [string, (p: N.Point) => boolean]): [
            string,
            (p: N.Point) => boolean,
          ] => [
            id + ".twin",
            (p: N.Point): boolean => inside([p[0], p[1], -p[2]]),
          ],
        ),
    ];
  }

  /**
   * Share the native Figure requests and existing Deviation comparison directions before either consumer draws.
   * Both sides reuse complete camera frames; a named underside remains a global below view, not a visibility guarantee.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The eight existing Deviation regions retain their five comparison directions through an ordered union with Figure requests; native nose keeps its explicit seven directions and twins exchange left/right.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure An explicit nose list or one comparison-region union precedes the existing opposite-side mapping.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No core preset order, camera math, geometry or scene/phase law changes; unrelated zone plans retain their directions and no view existence is treated as visibility proof.
   * @evidence contracts/development/implementation.md#efficient-algorithms Small bounded list unions retain one plan; the complete owners-enabled native round adds eighteen view cells and thus144 Figure/Deviation PNGs compared with the previously incomplete plan.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both consumers borrow the same plan, reference ROI and memoized camera without another assembly or realization.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a new small array survives; no resource or cache is retained.
   * @evidence contracts/development/common.md#meaningful-documentation States retained comparison coverage, ordered union, both-side camera reuse, output cost and visibility limits.
   */
  export function views(
    zone: string,
    original: (zone: string) => string[],
  ): string[] {
    const name: string = zone.replace(/\.twin$/, "");
    if (name === "nose")
      return [
        "front",
        "left",
        "right",
        "high-oblique",
        "low-oblique",
        "low-oblique-other-side",
        "underside",
      ];
    const requested: string[] = original(name);
    const comparison: readonly string[] = ["head", "hand", "foot", "shoulder", "ear", "neck", "hip", "chest"];
    const planned: string[] = comparison.includes(name)
      ? [...new Set([...requested, "front", "back", "left", "high-oblique", "low-oblique"])]
      : requested;
    return planned.map((view: string): string =>
      zone.endsWith(".twin")
        ? view === "left"
          ? "right"
          : view === "right"
            ? "left"
            : view
        : view,
    );
  }

  /**
   * Select display passes only; legacy calls retain their exact stages.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Native original guides, raw loft display and realized clay retain separate stages; legacy calls preserve their original stages.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A context branch chooses mesh references without evaluating geometry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Raw samples, originals and skin are not merged under one identity.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant-size pass-list creation borrows existing arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All Figure stages reuse the same original catalog and realized mesh.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The pass list owns no mesh buffers and leaves scope after iteration.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states legacy stage preservation and display-only selection.
   */
  export function stages(
    context: IContext | null,
    reference: N.Mesh[],
    generated: N.Mesh[],
    owners: N.Mesh[] | null,
    whole: boolean,
  ): [string, N.Mesh[]][] {
    if (context === null)
      return [
        ["reference", reference],
        ["generated", generated],
        ...(!whole && owners !== null
          ? [["owners", owners] as [string, N.Mesh[]]]
          : []),
      ];
    return [
      ["reference", reference],
      ["curves", []],
      ["curves-over-clay", generated],
      ["raw-loft-curves", []],
      ["clay", generated],
      ...(owners === null ? [] : [["owners", owners] as [string, N.Mesh[]]]),
    ];
  }

  /**
   * Every native construction pass reads this same evaluated catalog.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Original stages borrow original guides while raw-loft stage borrows the actual factory display catalog.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One stage selection returns an existing array or an empty array.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No mesh-recovered original, missing-reader replacement or new evaluator is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant stage selection performs no geometry or array traversal.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Every matching pass reads the same evaluated catalog.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrowed arrays remain owned by the one-case context.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states shared evaluated catalog ownership.
   */
  export function curves(context: IContext | null, stage: string): N.Curve[] {
    return context === null
      ? []
      : stage === "raw-loft-curves"
        ? context.catalog.curves
        : stage === "curves" || stage === "curves-over-clay"
          ? context.source.originals.curves
          : [];
  }

  /**
   * Plain receipt identity, never a geometric acceptance certificate.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact input/source/field identities, original/raw stage definitions and actual frame/diagnostic records form an observation receipt.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A plain metadata object borrows checked identities and hashes finite display catalogs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No geometric acceptance, physical2 certification or original-control recovery is inferred.
   * @evidence contracts/development/implementation.md#efficient-algorithms Catalog hashing and camera/frame serialization scale with current-case display evidence.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared Identity recipes and evaluated catalogs avoid another generation or measurement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned snapshot borrows one-case evidence and owns no resource or running task.
   * @evidence contracts/development/common.md#meaningful-documentation The comment and status state receipt identity without acceptance.
   */
  export function metadata(context: IContext): unknown {
    return {
      schema: "f1-native-capture/v1",
      case: context.input.selected,
      artifact: context.input.artifact,
      inputRevision: context.input.artifact.sha256,
      fieldsHash: context.input.fieldsHash,
      sourceRevision: Input.dataHash(context.input.sourceHashes),
      sourceHashes: context.input.sourceHashes,
      preflight: context.input.preflight,
      originalEvidence: context.originalEvidence,
      originalObservation: {
        assemblyMs: context.source.assemblyMs,
        originalMs: context.source.originalMs,
        reads: context.source.reads,
        curveHash: Input.dataHash(context.source.originals.curves),
        curves: context.source.originals.curves.length,
        unavailable: context.source.originals.unavailable,
      },
      passDefinitions: {
        curves: "actual original axis/extreme/split guides",
        "curves-over-clay": "same originals over the one realized skin",
        "raw-loft-curves":
          "separate actual factory Point0 grid, not original2D definitions or an intermediate solid",
        clay: "same realized skin",
      },
      bare: context.input.bare,
      reference: context.referenceHashes,
      captureEntryCalls: {
        assembleNative: 1,
        constructionFrom: 1,
        realization: 1,
        catalog: 1,
      },
      generationMs: context.generationMs,
      catalogMs: context.catalogMs,
      memorySnapshots: context.memory,
      mesh: {
        vertices: context.mesh.positions.length / 3,
        triangles: context.mesh.indices.length / 3,
      },
      meshTopology: context.meshTopology,
      curveCatalog: {
        stage: "raw-loft-factory/retained-operator Point0 display",
        hash: Input.dataHash(context.catalog.curves),
        rows: context.catalog.rows,
        unavailable: context.catalog.unavailable,
        curves: context.catalog.curves.length,
        points: context.catalog.points,
        physical2: "not certified by display sampling",
      },
      cameras: Object.fromEntries(context.cameras),
      frames: context.frames,
      raster:
        "Skia Canvas2D / CPU z-buffer; existing colours, signed-distance bins and sampling",
      diagnostics: context.diagnostics,
      status: "captured evidence; no shape acceptance asserted",
    };
  }
}
