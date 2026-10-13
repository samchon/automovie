import type {
  IAutoMovieHumanFaceBasisDocument,
  IAutoMovieHumanPersonBodyView,
  IAutoMovieHumanPersonGeneration,
  IAutoMovieHumanPersonGenerationBuild,
  IAutoMovieHumanPersonHeadView,
} from "../../index";
import { createHumanBodyAssemblyExportQualification } from "../../body/export/createHumanBodyAssemblyExportQualification";
import { createHumanBodyAtlasExportQualification } from "../../body/export/createHumanBodyAtlasExportQualification";
import { createHumanBodySegmenter } from "../../body/measure/createHumanBodySegmenter";
import { measureHumanBodyGroundSupport } from "../../body/measure/measureHumanBodyGroundSupport";
import type { IHumanBodyConstructionProgress } from "../../body/structures/IHumanBodyConstructionProgress";
import { createHumanFaceOralExportQualification } from "../../face/export/createHumanFaceOralExportQualification";
import type { IAutoMovieHumanFaceConstructionProgress } from "../../face/structures/IAutoMovieHumanFaceConstructionProgress";
import { compileHumanPersonGeneration } from "../build/compileHumanPersonGeneration";
import { createHumanPersonBuilder } from "../build/createHumanPersonBuilder";
import { createHumanPersonGenerationBuilder } from "../build/createHumanPersonGenerationBuilder";
import { joinHumanPersonGeneration } from "../build/joinHumanPersonGeneration";
import { parseHumanPersonDocument } from "../document/parseHumanPersonDocument";
import { exportHumanPerson } from "../export/exportHumanPerson";
import { createHumanPersonSimpleWhole } from "../measure/createHumanPersonSimpleWhole";
import type { IAutoMovieHumanPersonConstruction } from "../structures/IAutoMovieHumanPersonConstruction";

import type { ConnectedBodyRequest } from "../../body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "../../body/runtime/ConnectedBodyResult";
import type { IConnectedBodyPreviewResult } from "../../body/runtime/IConnectedBodyPreviewResult";
import { packConnectedBodyModel } from "../../body/runtime/packConnectedBodyModel";
import { describeConnectedBodyConstructionProgress } from "../../body/runtime/describeConnectedBodyConstructionProgress";
import { readConnectedBodyContacts } from "../../body/runtime/readConnectedBodyContacts";
import { readConnectedBodyHumeralHeads } from "../../body/runtime/readConnectedBodyHumeralHeads";
import { readConnectedBodyRigReading } from "../../body/runtime/readConnectedBodyRigReading";
import type { IConnectedPersonRuntimeOptions } from "./IConnectedPersonRuntimeOptions";
import { describeConnectedPersonFaceProgress } from "./describeConnectedPersonFaceProgress";

/**
 * Create the body request-protocol handler for one borrowed person source context. Published head/body tuples or a generation with headSkin use the registered generation builder; a plain face/body pair uses the legacy builder. Preview packs the actual returned static model and explicit export encodes it. Every supported request parses its text, including cache hits; armsDown refuses before parsing. This factory owns no worker or asset fetch itself.
 *
 * Contacts and rig/anatomy readings use the returned body's own geometry/landmarks, whose relationship to final composed skin/layers remains the builder's contract. Contacts yield at a 25 ms slice policy using a zero-delay timer and never supersede themselves. Humeral-head reading lazily compiles a registered paired generation and refuses an unregistered legacy pair. These numerical readers do not observe the current displayed person or establish clinical/likeness qualification.
 *
 * One last text/evaluation and one same-text construction draft are retained. Accepted construction shares its model with ordinary preview/export; rejected construction remains inspectable through construct and explicit exportConstruction, whose exporter can still refuse actual geometry. Replacing text clears retained cache references before evaluation, but an asynchronous in-flight request may still hold its old model. The mutable progress relay and caches require serialized requests with unchanged source context; concurrent calls have no isolation or supersession guarantee. options.progress initializes the relay and each request replaces it with its own callback. Callback exceptions propagate.
 *
 * @evidence contracts/common.md#principled-implementation Actual source branch and parsed document feed the established person builders; protocol results carry their actual model/admission and requested body measurements.
 * @evidence contracts/common.md#clear-and-simple-design Builders own person anatomy/admission, export owners qualify actual metadata, and this adapter owns protocol dispatch, last-text reuse and progress relay.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Document admission is repeated on cache hits, ordinary output requires accepted construction, and explicit draft export is distinguished from acceptance, clinical qualification or current rendering.
 * @evidence contracts/common.md#meaningful-documentation Prose states source selection, serialized-request premise, cache lifetime, draft export, callback propagation and lazy measurement boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Builder setup follows source populations; text parsing occurs per request, cache misses pay full evaluation, and requested packing/qualification/contact work pays actual geometry populations separately.
 * @evidence contracts/performance.md#reuse-equivalent-work Same-text accepted construction or last evaluation serves preview/export, while segmenter and paired measurement compilation are initialized only when needed and retained for this source context.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Cache replacement drops prior retained model references, but in-flight asynchronous calls can retain their models and timers until completion; callers serialize requests to bound that population and own handler lifetime.
 */
export function createConnectedPersonRuntime(
  source:
    | IAutoMovieHumanPersonGeneration
    | Pick<IAutoMovieHumanPersonGeneration, "face" | "body">
    | [IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView],
  options: IConnectedPersonRuntimeOptions = {},
): (request: ConnectedBodyRequest, progress?: (stage: string) => void) => Promise<ConnectedBodyResult> {
  // the evaluation in progress reports its stages to the request that asked for it
  let stage: (name: string) => void = options.progress ?? ((): void => undefined);
  const census: boolean = options.census === true;
  const observeStage: (name: string) => void = (name: string): void => stage(name);
  const observeFaceConstructionProgress: (progress: IAutoMovieHumanFaceConstructionProgress) => void = (
    progress: IAutoMovieHumanFaceConstructionProgress,
  ): void => stage(describeConnectedPersonFaceProgress(progress));
  const observeBodyConstructionProgress: (progress: IHumanBodyConstructionProgress) => void = (
    progress: IHumanBodyConstructionProgress,
  ): void => stage(describeConnectedBodyConstructionProgress(progress));
  const evaluate: ReturnType<typeof createHumanPersonGenerationBuilder> | ReturnType<typeof createHumanPersonBuilder> = Array.isArray(source)
    ? createHumanPersonGenerationBuilder({
        generation: joinHumanPersonGeneration(source[0], source[1]),
        census,
        observeStage,
        observeFaceConstructionProgress,
        observeBodyConstructionProgress,
      })
    : "headSkin" in source
      ? createHumanPersonGenerationBuilder({
          generation: source,
          census,
          observeStage,
          observeFaceConstructionProgress,
          observeBodyConstructionProgress,
        })
      : createHumanPersonBuilder(source);
  const bodyBasis: IAutoMovieHumanPersonGeneration["body"] = Array.isArray(source) ? source[1].body : source.body;
  const faceBasis: IAutoMovieHumanPersonGeneration["face"] = Array.isArray(source) ? source[0].face : source.face;
  // the generation the humeral-head reading compiles, joined again only then
  const generationOf: () => IAutoMovieHumanPersonGeneration | undefined = (): IAutoMovieHumanPersonGeneration | undefined =>
    Array.isArray(source)
      ? joinHumanPersonGeneration(source[0], source[1])
      : "headSkin" in source
        ? source
        : undefined;
  let compiled: ReturnType<typeof compileHumanPersonGeneration> | undefined;
  let segment: ReturnType<typeof createHumanBodySegmenter> | undefined;
  let lastDocument: string | undefined;
  let lastBuilt: ReturnType<typeof evaluate> | undefined;
  let lastConstructionDocument: string | undefined;
  let lastConstruction: IAutoMovieHumanPersonConstruction | undefined;
  // Drop retained cache references; pending asynchronous requests may still hold their model.
  const release: () => void = (): void => {
    lastDocument = undefined;
    lastBuilt = undefined;
    lastConstructionDocument = undefined;
    lastConstruction = undefined;
  };
  const encode: (built: Pick<IAutoMovieHumanPersonGenerationBuild, "model" | "body">, face: IAutoMovieHumanFaceBasisDocument, progress: (stage: string) => void) => Promise<Uint8Array<ArrayBuffer>> = async (
    built: Pick<IAutoMovieHumanPersonGenerationBuild, "model" | "body">,
    face: IAutoMovieHumanFaceBasisDocument,
    progress: (stage: string) => void,
  ): Promise<Uint8Array<ArrayBuffer>> => {
    const atlas: Awaited<ReturnType<typeof createHumanBodyAtlasExportQualification>> = await createHumanBodyAtlasExportQualification(
      bodyBasis,
      built.body.evaluatedDocument,
      "body:",
    );
    progress("atlas-qualified");
    const assembly: Awaited<ReturnType<typeof createHumanBodyAssemblyExportQualification>> = await createHumanBodyAssemblyExportQualification(
      bodyBasis,
      built.body.evaluatedDocument,
      "body:",
      built.body.layerObservations,
    );
    progress("assembly-qualified");
    const oral: Awaited<ReturnType<typeof createHumanFaceOralExportQualification>> = await createHumanFaceOralExportQualification(
      faceBasis,
      face,
      built.model,
      "face:",
    );
    progress("oral-qualified");
    return (await exportHumanPerson(built.model, atlas, assembly, oral)).glb;
  };
  return async (
    request: ConnectedBodyRequest,
    progress: (stage: string) => void = (): void => undefined,
  ): Promise<ConnectedBodyResult> => {
    stage = progress;
    if (request.operation === "armsDown")
      throw new Error("A person has no arms-down solve.");
    const document: ReturnType<typeof parseHumanPersonDocument> = parseHumanPersonDocument(
      request.document,
      bodyBasis.anatomicalAssembly,
    );
    if (
      request.operation === "construct" ||
      request.operation === "exportConstruction"
    ) {
      if (!("construct" in evaluate))
        throw new Error(
          "Construction drafts require the registered person generation owner.",
        );
      if (lastConstructionDocument !== request.document) release();
      const constructed: IAutoMovieHumanPersonConstruction = lastConstruction ?? evaluate.construct(document);
      lastConstructionDocument = request.document;
      lastConstruction = constructed;
      // only an accepted construction may answer the admitted preview and export
      lastDocument = constructed.admission.accepted
        ? request.document
        : undefined;
      lastBuilt = constructed.admission.accepted ? constructed : undefined;
      progress("constructed");
      if (request.operation === "exportConstruction")
        return {
          operation: "exportConstruction",
          admission: constructed.admission,
          glb: await encode(constructed, document.face, progress),
        };
      return {
        operation: "construct",
        model: packConnectedBodyModel(constructed.model),
        admission: constructed.admission,
        crossings: null,
        anatomy: null,
        groundSupport: null,
        extras: {
          bones: constructed.bones,
          landmarks: constructed.body.landmarks,
        },
        rigReading: readConnectedBodyRigReading(constructed.body, constructed.model.id, constructed.bones),
      };
    }
    if (lastDocument !== request.document) release();
    const built: ReturnType<typeof evaluate> = lastBuilt ?? evaluate(document);
    lastDocument = request.document;
    lastBuilt = built;
    if (request.operation === "export")
      return {
        operation: "export",
        glb: await encode(built, document.face, progress),
      };
    const crossings: Awaited<ReturnType<typeof readConnectedBodyContacts>> | null =
      request.measure || request.anatomy
        ? await readConnectedBodyContacts({
            model: (segment ??= createHumanBodySegmenter(bodyBasis))(built.body)
              .model,
            sliceMs: 25,
            yieldThread: (): Promise<undefined> =>
              new Promise<undefined>((resolve: (value: undefined | PromiseLike<undefined>) => void): void => {
                setTimeout((): void => resolve(undefined), 0);
              }),
            superseded: (): boolean => false,
          })
        : null;
    let anatomy: IConnectedBodyPreviewResult["anatomy"] = null;
    if (request.anatomy && crossings !== null) {
      const generation: IAutoMovieHumanPersonGeneration | undefined = compiled?.generation ?? generationOf();
      if (generation === undefined)
        throw new Error(
          "A humeral-head reading needs the published person generation.",
        );
      anatomy = readConnectedBodyHumeralHeads({
        basis: bodyBasis,
        whole: createHumanPersonSimpleWhole(
          (compiled ??= compileHumanPersonGeneration(generation)),
          document,
        ),
        document: document.body,
        built: built.body,
        crossings,
      });
    }
    return {
      operation: "preview",
      model: packConnectedBodyModel(built.model),
      crossings: request.measure ? crossings : null,
      anatomy,
      groundSupport: request.anatomy
        ? measureHumanBodyGroundSupport(
            bodyBasis,
            built.body.posedSurfaces.map((surface: (typeof built.body.posedSurfaces)[number]): number[] => surface.positions),
            built.body.landmarks,
            built.body.groundPlaneHeightMetres,
          )
        : null,
      extras: { bones: built.bones, landmarks: built.body.landmarks },
    };
  };
}
