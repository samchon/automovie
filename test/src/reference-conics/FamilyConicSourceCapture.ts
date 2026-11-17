import type { FamilyConicCaptureFraming as Framing } from "./FamilyConicCaptureFraming";
import { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import {
  FamilyConicCaptureTransportFiles as TransportFiles,
} from "./FamilyConicCaptureTransportFiles";
import { FamilyConicCaptureViews as Views } from "./FamilyConicCaptureViews";
import type {
  FamilyConicOriginalCatalog as Original,
} from "./FamilyConicOriginalCatalog";
import { FamilyConicSourceDrawing as Drawing } from "./FamilyConicSourceDrawing";
import { FamilyConicSourceEvidence as Evidence } from "./FamilyConicSourceEvidence";
import {
  FamilyConicSourcePreparation as Preparation,
} from "./FamilyConicSourcePreparation";
import { FamilyConicSourceSelection as Selection } from "./FamilyConicSourceSelection";
import type { NodeCanvasTypes as N } from "./render/NodeCanvasTypes";
import type { IAutoMovieHumanConicLoft, IAutoMovieHumanF1 } from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/** Same-invocation original observations before whole-tree realization; no realization is imported. */
export namespace FamilyConicSourceCapture {
  /**
   * Prepared source lifetime shared with the subsequent raw/realized consumers.
   *
   * @evidence contracts/development/design.md#principled-representation One admitted case owns an assembly, original/authored observations, complete declared ids, optional recorded input layer and scalar process/frame evidence.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Source-only and subsequent raw/realized consumers share this lifetime; production assembly and renderer types remain authoritative.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Factory counts cover explicit reads only, memory snapshots are not a peak, and unavailable sources remain named.
   * @evidence contracts/development/common.md#meaningful-documentation Members state units, invocation ownership, fixed authored scope, timing, memory and declared failed identities.
   */
  export interface IState {
    /** Exact admitted production case and checked provenance. */
    input: Input.IInput;

    /** One UTC round used by all source/raw/realized output directories. */
    round: string;

    /** One actual production assembly, with invocation-scoped diagnostic relief selection. */
    assembly: IAutoMovieHumanF1.IAssembly;

    /** Original definitions, actual axes/guides and explicit unavailable evidence. */
    originals: Original.IResult;

    /** Every declared original id, including a failed factory. */
    declaredOriginals: string[];

    /** Separately identified actual submitted operator-input samples; no world profile is inferred. */
    recorded: TransportFiles.ILayer;

    /** Explicit old F1 camera/comparison data, never current case admission. */
    frameBaseline: Framing.IBaseline | null;

    /** Production body wall scope is separate from each returned cap-inclusive native source domain. */
    sourceScopes: {
      id: string;
      owner: string;
      wallDomain: readonly [number, number] | null;
      tips: IAutoMovieHumanConicLoft.IFamily["tips"];
      phase: number | undefined;
      turn: number | undefined;
    }[];

    /** Independent fixed authored F1 definitions supply comparison-frame axes; these are neither private skin observations nor production sampling-grid claims. */
    authored: Original.IResult;

    /** Production assembly time, including its internal original preparation, in ms. */
    assemblyMs: number;

    /** Both original definition observations, in ms, separate from mesh/raster work. */
    originalMs: number;

    /** Explicit factory-read counts; no claim about hidden production internals. */
    reads: {
      assembleNative: number;
      actualFamilyFactory: number;
      authoredFamilyFactory: number;
    };

    /** Process snapshots, not a measured peak. */
    memory: { before: NodeJS.MemoryUsage; afterOriginals: NodeJS.MemoryUsage };

    /** Scalar frame identities and raster work, without retained PNG buffers. */
    frames: (N.Frame & { directory: string })[];
  }

  /**
   * Select source-only explicitly after unchanged case/provenance admission; incomplete inputs cannot fall back.
   *
   * @evidence contracts/development/implementation.md#principled-implementation One exact source-only flag requires prior case admission, and image-axis flags require that explicit source-only mode.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Flag validation precedes a boolean selection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Incomplete, duplicate or valued source-only flags cannot fall back into another generation path.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear CLI scans retain only matching small strings.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Figure and Deviation entries use this shared selection.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a boolean escapes; no resource or mutable state is retained.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states explicit selection after unchanged admission.
   */
  export function requested(
    args: readonly string[],
    admitted: boolean,
  ): boolean {
    const flags: string[] = args.filter(
      (arg: string): boolean =>
        arg === "--source-only" || arg.startsWith("--source-only="),
    );
    if (flags.length === 0) {
      if (
        args.some((arg: string): boolean =>
          ["--sources", "--views", "--frame-baseline"].some(
            (key: string): boolean => arg === key || arg.startsWith(key + "="),
          ),
        )
      )
        throw new Error("--sources/--views require --source-only");
      return false;
    }
    if (flags.length !== 1 || flags[0] !== "--source-only" || !admitted)
      throw new Error(
        "--source-only requires one explicit flag and an admitted case with matching preflight",
      );
    const allowed: ReadonlySet<string> = new Set([
      "--cases",
      "--case",
      "--preflight",
      "--bare",
      "--source-only",
      "--sources",
      "--views",
      "--frame-baseline",
    ]);
    for (const arg of args)
      if (!allowed.has(arg.split("=", 1)[0]!))
        throw new Error("Unknown source-only capture option: " + arg);
    return true;
  }

  /**
   * Observe actual source factories before any whole-tree or physical2 admission.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing original factories and source readers are delegated to Original.create before any whole-tree realization.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared original-catalog call returns the evidence.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source2, geometry reconstruction or final-skin fallback is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms The catalog cost is driven by factories, controls, knots and bounded guide samples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same Original owner serves direct and prepared source consumers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned one-case catalog owns its observed arrays; no cross-case cache exists.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states source-factory observation before physical2 admission.
   */
  export const observe: typeof Preparation.observe = Preparation.observe;

  /**
   * Prepare the exact selected fields once, then inspect original factories before tree/mesh admission.
   * Existing production family membership and native mirror factories own the two sides.
   * Raw cutter originals are explicitly before CUTTERS.cut; applied cutter/kept domains belong to the later construction source.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The exact admitted fields enter assembleNative once; the production sourceScope and native H.source callback own actual closure/domain while fixed authored counterparts are observed independently.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Invocation-scoped bare selection precedes declared member enumeration and the two original catalogs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Global BODY and original families stay unchanged; official wallDomain is recorded separately without clamping cap-inclusive source stations, failed factories retain declared identities, and no ordinary-grid fallback case is created.
   * @evidence contracts/development/implementation.md#efficient-algorithms One assembly and per-family original reads dominate; explicit counters exclude hidden production internals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same prepared assembly and original catalog are handed to constructionFrom by the full consumer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One case state owns assembly, catalogs and observations; no reference mesh, renderer or cross-case cache is acquired.
   * @evidence contracts/development/common.md#meaningful-documentation The comment and members distinguish actual factories, fixed authored evidence and diagnostic bare scope.
   */
  export const prepare: typeof Preparation.prepare = Preparation.prepare;

  /**
   * Save original evidence before full construction/realization, so downstream failure cannot erase it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Exact input/producer identities and complete original definitions are serialized before downstream realization; invalid diagnostic numbers remain explicit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One new case directory and exclusive original JSON write return its byte digest.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No original metadata is filtered by PNG selection and no unavailable world loop is fabricated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Serialization and hashing cost the complete one-case original metadata.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Source-only and full capture save the same original evidence format and shared hash recipe.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The awaited write releases its handle and only file identity escapes.
   * @evidence contracts/development/common.md#meaningful-documentation The comment names preservation before downstream failure.
   */
  export const save: typeof Evidence.save = Evidence.save;

  /** Share the diagnostic JSON recipe with original evidence writing. */
  const json: typeof Evidence.json = Evidence.json;

  /**
   * Source-only consumer: original diagrams/actual guide overlays, without constructionFrom or realization.
   * Fixed authored F1 frames/plots and the immutable private reference are comparison/display inputs only.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Strict exact-byte recorded-input loading precedes one assembly; declared source ids select physical camera scopes and exact scalar owners select intrinsic charts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Original JSON is saved before reference loading; existing frame/camera/raster owners render selected passes and one final receipt retains expected versus actual scope.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No constructionFrom, realization, phase solver, private curve recovery or generated-case auto-fit runs; world seam profiles and source failures remain unavailable.
   * @evidence contracts/development/implementation.md#efficient-algorithms Selected physical scope-view passes redraw the retained reference/original scene; selected scalar owners add one chart each. Complete metadata and one reference scene remain retained; no speedup is claimed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same prepared source catalog, explicit archived F1 bounds and independent fixed authored frame axes serve all passes; Frame.write reuses the raster boundary with the actual case header.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One case assembly/reference scene and sampled layer live for this invocation; each PNG is written sequentially and only scalar frame identities survive.
   * @evidence contracts/development/common.md#meaningful-documentation The comment and receipt distinguish original, submitted-operator-input, reference overlay, units, PNG selection and unavailable measurements.
   */
  export async function run(input: Input.IInput): Promise<void> {
    const frameBaseline: Framing.IBaseline = await TransportFiles.baseline(
      input,
      process.argv.slice(2),
    );
    const recorded: TransportFiles.ILayer = await TransportFiles.load(
      input,
      true,
    );
    const producer: Input.IProducer = await Input.producer(input.root);
    let state: IState;
    try {
      state = prepare(input);
      state.recorded = recorded;
      state.frameBaseline = frameBaseline;
    } catch (error: unknown) {
      const failure: Error =
        error instanceof Error ? error : new Error(String(error));
      const out: string = path.join(
        input.root,
        "packages/human/.shots/family-conic-originals",
        new Date().toISOString().replaceAll(":", "-"),
        "case-" + encodeURIComponent(input.selected.id),
      );
      await fs.mkdir(out, { recursive: true });
      await fs.writeFile(
        path.join(out, "receipt.json"),
        json({
          schema: "f1-source-only-capture/v1",
          state: "assembly unavailable",
          case: input.selected,
          fieldsHash: input.fieldsHash,
          artifact: input.artifact,
          sourceHashes: input.sourceHashes,
          preflight: input.preflight,
          producer,
          unavailable: [{ id: "assembly", cause: failure.message }],
          originalDefinitions: "unavailable; no old F1 fallback",
          rawLoft: "not requested",
          realization: "not requested",
          error: failure.stack,
        }),
        { flag: "wx" },
      );
      throw failure;
    }
    const offeredSources: string[] = ["figure", ...state.declaredOriginals];
    const offeredViews: string[] = Views.whole(true);
    const selection: Selection.IPlan = Selection.select(
      process.argv.slice(2),
      offeredSources,
      offeredViews,
    );
    const sourceIds: Set<string> = new Set(selection.sources);
    const original: Input.IFile = await save(state, producer);
    const out: string = path.dirname(original.file);
    const unavailable: { id: string; cause: string }[] = [
      ...state.originals.unavailable,
      ...(recorded.submitted?.unavailable ?? []),
    ];
    let failure: Error | null = null;
    const referenceHashes: Input.IFile[] = [];
    const framingPlans: Framing.IPlan[] = [];
    try {
      await Drawing.draw({
        input,
        state,
        frameBaseline,
        recorded,
        out,
        selection,
        sourceIds,
        unavailable,
        referenceHashes,
        framingPlans,
      });
    } catch (error: unknown) {
      failure = error instanceof Error ? error : new Error(String(error));
    }
    await fs.writeFile(
      path.join(out, "receipt.json"),
      json({
        schema: "f1-source-only-capture/v1",
        state:
          failure === null
            ? "observed; unavailable evidence remains unverified"
            : "failed",
        case: input.selected,
        fieldsHash: input.fieldsHash,
        artifact: input.artifact,
        sourceHashes: input.sourceHashes,
        preflight: input.preflight,
        producer,
        original,
        fixedFraming: {
          baseline: frameBaseline.file,
          provenance: frameBaseline.provenance,
          coordinateRegistration:
            "Exact fixed F1 pelvis world-mm frame checked",
          plans: framingPlans.map((plan: Framing.IPlan): unknown => ({
            source: plan.source,
            operatorOwners: plan.operatorOwners,
            operatorAssociationRegistered: plan.operatorAssociationRegistered,
            missingOperatorOwners: plan.missingOperatorOwners,
            fixedPointCount: plan.points.length,
          })),
        },
        recordedOperatorInputs: recorded.evidence,
        pngSelection: {
          requested: selection.requested,
          offered: { sources: offeredSources, views: offeredViews },
          resolved: { sources: selection.sources, views: selection.views },
          semantics:
            "Sources choose physical camera scopes and scalar charts with exact scalar.owner identity. Figure includes no scalar charts automatically. Scalar charts retain their intrinsic top chart and are not repeated per physical view. Complete original JSON is never filtered. Physical original overlays retain the complete original curve catalog; Every selected scope displays the same whole-world submitted samples through its existing fixed camera; no per-family correspondence or curve filtering is inferred.",
          expected: {
            originalPhysical:
              selection.sources.length * selection.views.length * 2,
            scalarCharts: state.originals.scalars.filter(
              (scalar: Original.IScalar): boolean =>
                sourceIds.has(scalar.owner),
            ).length,
            submittedPhysical:
              recorded.submitted !== null &&
              recorded.submitted.curves.length > 0
                ? selection.sources.length * selection.views.length * 2
                : 0,
          },
          actual: {
            originalPhysical: state.frames.filter(
              (frame: N.Frame): boolean =>
                frame.stage === "originals" ||
                frame.stage === "originals-over-reference",
            ).length,
            scalarCharts: state.frames.filter(
              (frame: N.Frame): boolean =>
                frame.stage === "original-scalar-chart",
            ).length,
            submittedPhysical: state.frames.filter((frame: N.Frame): boolean =>
              frame.stage.startsWith("actual-submitted-operator-input"),
            ).length,
          },
        },
        reference: referenceHashes,
        frames: state.frames,
        unavailable,
        rawLoft: "not requested",
        realization: "not requested",
        error: failure?.stack ?? null,
        graphConvention:
          "Station mm; ordinate keeps declared mm/rad/share. Chart-display metres per ordinate unit are0.001/0.1/0.1; fixed authored envelope, never a case fit. Interpolation knots differ from off-curve controls. Net/shift and shared boundary controls are metadata, not fabricated world control points.",
        qualification:
          "Whole private-reference overlay is in the fixed F1 frame; corresponding per-curve/cut/region measurements are unavailable and no raw/skin/anatomy approval follows.",
      }),
      { flag: "wx" },
    );
    process.stdout.write(
      JSON.stringify({
        out,
        case: input.selected.id,
        frames: state.frames.length,
        unavailable: unavailable.length,
        realization: false,
      }) + "\n",
    );
    if (failure !== null) throw failure;
  }
}
