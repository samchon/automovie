import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySimpleWhole } from "../structures/IAutoMovieHumanBodySimpleWhole";
import { createHumanBodyBasisBuilder } from "../basis/createHumanBodyBasisBuilder";
import { parseHumanBodyBasisDocument } from "../document/parseHumanBodyBasisDocument";
import { createHumanBodyAssemblyExportQualification } from "../export/createHumanBodyAssemblyExportQualification";
import { createHumanBodyAtlasExportQualification } from "../export/createHumanBodyAtlasExportQualification";
import { exportHumanBody } from "../export/exportHumanBody";
import { createHumanBodySegmenter } from "../measure/createHumanBodySegmenter";
import { measureHumanBodyGroundSupport } from "../measure/measureHumanBodyGroundSupport";
import { stepHumanBodyArmsDown } from "../measure/stepHumanBodyArmsDown";
import { assertTextSize } from "../../common/document/assertTextSize";
import type { IAutoMovieModel } from "@automovie/interface";

import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import type { IConnectedBodyPreviewResult } from "./IConnectedBodyPreviewResult";
import type { IConnectedBodyRuntimeCachedBuild } from "./IConnectedBodyRuntimeCachedBuild";
import type { IConnectedBodyRuntimeOptions } from "./IConnectedBodyRuntimeOptions";
import { packConnectedBodyModel } from "./packConnectedBodyModel";
import { describeConnectedBodyConstructionProgress } from "./describeConnectedBodyConstructionProgress";
import { readConnectedBodyContacts } from "./readConnectedBodyContacts";
import { readConnectedBodyFemoralHeads } from "./readConnectedBodyFemoralHeads";
import { readConnectedBodyHumeralHeads } from "./readConnectedBodyHumeralHeads";
import { readConnectedBodyRigReading } from "./readConnectedBodyRigReading";

/**
 * Compile one body evaluator and static contact partition for a resident request handler. Every request receives a sequence ordinal; supported operations then receive canonical document admission, while exportConstruction refuses before parsing. Invalid later requests also supersede an older yielded observation. The runtime borrows basis, whole-person readers and source options for its lifetime, so callers must keep that context unchanged.
 *
 * Preview and explicit export share one last completed body build only when original document text matches, after reparsing. Construction inspection returns the owner's separate admission report without entering that cache, and construction-asset export belongs to the person runtime. The cache is numerical build state, not the transport's accepted display or a clinical verdict.
 *
 * Contact reads yield between part/pair queries; arms-down search yields between complete generator steps. The millisecond threshold cannot preempt an individual synchronous unit. Newer requests cause contacts to return null or the arms-down operation to throw at a checkpoint; preview can still return its already packed model with missing observations, and transport must choose replies by transaction identity. Export awaits encoding without a supersession check or cancellation protocol.
 *
 * Requested anatomy uses the same current build, whole-person projection and contact result for humeral/femoral fits, with ground readings handled separately. These are rig-centred geometric observations and do not qualify anatomical joint registration or living-body validity.
 *
 * @evidence contracts/common.md#principled-implementation Canonical parsing precedes exact-text build reuse within fixed source context; actual static skin queries and the arms-down generator provide observations with request-ordinal supersession at cooperative checkpoints.
 * @evidence contracts/common.md#clear-and-simple-design One closure owns source compilation, a single build cache and request sequencing, while existing numerical producers own body admission, contact geometry, head fits, ground reading and glTF encoding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cache hits do not bypass parsing, construction inspection does not enter accepted-build reuse, and null or cancelled observations do not substitute a healthy-model or clinical acceptance verdict.
 * @evidence contracts/common.md#meaningful-documentation The prose defines borrowed fixed context, cache identity, supported operations, cooperative scheduling, supersession differences and numerical versus displayed/clinical state.
 * @evidence contracts/performance.md#efficient-algorithms Basis compilation and contact plans occur once; every request parses its text, while matching text skips body rebuilding. Preview packing, optional contact/fit queries and explicit export retain their source-sized delegated costs; cooperative slicing adds repeated engine preparation rather than a measured speedup.
 * @evidence contracts/performance.md#reuse-equivalent-work The compiled evaluator and segment plan serve one source context, and a single exact-text build is reused only after admission. Distinct source/reader mutation is unsupported; export effects and progress notifications are not deduplicated merely because numerical inputs match.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains compiler/segment state and one last build until replaced or released. Concurrent yielded calls retain their own packed models and intermediates; their count follows caller concurrency and is not capped here. Default yield timers complete once, while transport workers, exported buffers and callback-owned tasks have external lifetimes.
 */
export function createConnectedBodyRuntime(
  basis: IAutoMovieHumanBodyBasis,
  whole: IAutoMovieHumanBodySimpleWhole,
  options: IConnectedBodyRuntimeOptions = {},
): (request: ConnectedBodyRequest) => Promise<ConnectedBodyResult> {
  const evaluate: ReturnType<typeof createHumanBodyBasisBuilder> = createHumanBodyBasisBuilder(
    basis,
    options.progress === undefined
      ? options.builderOptions
      : {
          ...options.builderOptions,
          observeProgress: (progress: Parameters<typeof describeConnectedBodyConstructionProgress>[0]): void => {
            options.builderOptions?.observeProgress?.(progress);
            options.progress!(
              describeConnectedBodyConstructionProgress(progress),
            );
          },
        },
  );
  const segment: ReturnType<typeof createHumanBodySegmenter> = createHumanBodySegmenter(basis);
  const sliceMs: number = options.sliceMs ?? 25;
  const yieldThread: () => Promise<unknown> =
    options.yieldThread ??
    ((): Promise<undefined> =>
      new Promise<undefined>((resolve: (value: undefined | PromiseLike<undefined>) => void): void => {
        setTimeout((): void => resolve(undefined), 0);
      }));
  /** Requests received so far; a reading is superseded by any later one. */
  let received: number = 0;
  const readContacts: (model: IAutoMovieModel, superseded: () => boolean) => ReturnType<typeof readConnectedBodyContacts> = (model: IAutoMovieModel, superseded: () => boolean): ReturnType<typeof readConnectedBodyContacts> =>
    readConnectedBodyContacts({ model, sliceMs, yieldThread, superseded });
  let last: IConnectedBodyRuntimeCachedBuild | undefined;
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    const mine: number = ++received;
    if (request.operation === "exportConstruction")
      throw new Error(
        "Construction asset export belongs to the person generation runtime.",
      );
    assertTextSize(request.document);
    // Canonical parsing is required even when the text matches the cache: a
    // caller cannot bypass document admission by reusing a previous string.
    const document: ReturnType<typeof parseHumanBodyBasisDocument> = parseHumanBodyBasisDocument(
      request.document,
      basis.anatomicalAssembly,
    );
    if (request.operation === "construct") {
      // Construction retains the layer owner's refusal, while the normal
      // callable below still admits preview/export. This result never writes
      // their accepted-build cache, even when its limited layer checks pass.
      const constructed: ReturnType<typeof evaluate.construct> = evaluate.construct(document);
      if (constructed.layerAdmission === undefined)
        throw new Error(
          "Body construction inspection needs the registered layer admission report.",
        );
      return {
        operation: "construct",
        model: packConnectedBodyModel(constructed.model),
        admission: constructed.layerAdmission,
        crossings: null,
        anatomy: null,
        femoralHeads: null,
        groundSupport: null,
        extras: { bones: constructed.bones, landmarks: constructed.landmarks },
        rigReading: readConnectedBodyRigReading(constructed),
      };
    }
    if (request.operation === "armsDown") {
      // the same slicing as a contact reading: a step at a time, abandoned
      // when a later request supersedes it
      const steps: ReturnType<typeof stepHumanBodyArmsDown> = stepHumanBodyArmsDown(basis, evaluate, document, segment);
      let since: number = Date.now();
      let next: ReturnType<typeof steps.next> = steps.next();
      while (next.done !== true) {
        if (Date.now() - since >= sliceMs) {
          await yieldThread();
          since = Date.now();
        }
        if (received !== mine)
          throw new Error(
            "The arms-down solve was superseded by a later request.",
          );
        next = steps.next();
      }
      const solved: Pick<ReturnType<typeof parseHumanBodyBasisDocument>, "pose" | "shoulders"> = next.value;
      return {
        operation: "armsDown",
        pose: solved.pose ?? [],
        shoulders: solved.shoulders ?? [],
      };
    }
    const built: ReturnType<typeof evaluate> =
      last?.document === request.document ? last.built : evaluate(document);
    last = { document: request.document, built };
    if (request.operation === "export") {
      const { glb }: Awaited<ReturnType<typeof exportHumanBody>> = await exportHumanBody(
        built.model,
        undefined,
        undefined,
        await createHumanBodyAtlasExportQualification(
          basis,
          built.evaluatedDocument,
        ),
        await createHumanBodyAssemblyExportQualification(
          basis,
          built.evaluatedDocument,
          "",
          built.layerObservations,
        ),
      );
      return { operation: "export", glb };
    }
    const model: ReturnType<typeof packConnectedBodyModel> = packConnectedBodyModel(built.model);
    const crossings: Awaited<ReturnType<typeof readContacts>> =
      request.measure || request.anatomy
        ? await readContacts(segment(built).model, (): boolean => received !== mine)
        : null;
    let anatomy: IConnectedBodyPreviewResult["anatomy"] = null;
    if (request.anatomy && crossings !== null)
      anatomy = readConnectedBodyHumeralHeads({
        basis,
        whole,
        document,
        built,
        crossings,
      });
    const femoralHeads: ReturnType<typeof readConnectedBodyFemoralHeads> =
      request.anatomy && crossings !== null
        ? readConnectedBodyFemoralHeads({
            basis,
            whole,
            document,
            built,
            crossings,
          })
        : null;
    const groundSupport: ReturnType<typeof measureHumanBodyGroundSupport> | null = request.anatomy
      ? measureHumanBodyGroundSupport(
          basis,
          built.posedSurfaces.map((surface: ReturnType<typeof evaluate>["posedSurfaces"][number]): number[] => surface.positions),
          built.landmarks,
          built.groundPlaneHeightMetres,
        )
      : null;
    return {
      operation: "preview",
      model,
      crossings: request.measure ? crossings : null,
      anatomy,
      femoralHeads,
      groundSupport,
      extras: { bones: built.bones, landmarks: built.landmarks },
    };
  };
}
