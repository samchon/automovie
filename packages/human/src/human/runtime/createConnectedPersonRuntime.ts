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
 * Keep one compiled face basis and body basis, or one source generation read
 * as one skin with a head/body partition (`createHumanPersonGenerationBuilder`,
 * selected by the presence of its head weight map, or by the published head
 * and body files joined with `joinHumanPersonGeneration`), in a worker and
 * evaluate whole people against them. It answers the body editor's request protocol, so the
 * body stage draws a person exactly as it draws a body: a preview packs the
 * composed model's Float32 buffers (the composed model is one static resident
 * model, its face parts, body parts and seam ribbon together) and an export
 * runs only on an explicit request. The last evaluated document is reused for
 * an export of the same text, and every request is admitted from its text, so
 * a caller cannot skip document admission by reusing a string.
 *
 * A person has no arms-down solve yet; it refuses. A preview that asks for a
 * contact or anatomy reading reads the person's body build exactly as the
 * body editor reads a body (`readConnectedBodyContacts`,
 * `readConnectedBodyHumeralHeads`): the body partition's posed skin before
 * the seam joins it to the head, which leaves the shoulders unchanged. The
 * humeral-head estimate reads the stature of this person, with its own face,
 * through the compiled generation, compiled on the first such request. A
 * person built from a face and body basis pair has no compiled generation
 * and refuses the reading by name.
 *
 * A construction is the one evaluation that always answers with the model and
 * its owner's whole admission report, accepted or not. One evaluated person is
 * kept, by document text, so encoding the person just shown evaluates nothing
 * again, and an accepted construction also serves the preview and export of
 * the same text; a refused one never does. The optional `progress` callback
 * names each finished stage of a static encoding for the transport's progress
 * display (`IConnectedBodyProgress`), and the person builder's own
 * construction stages are relayed to it. `options.census` asks the builder
 * for its report-only assembly census; the product editor leaves it off and
 * an inspection tool turns it on.
 *
 * Facial jaw, lid and attachment articulation, attachment and seam geometry,
 * lip, tooth and tongue contacts, skin pigmentation and regional condition
 * or wrinkles, scalp hair and surface maps remain the numerical person and
 * face builders' responsibilities. This adapter packs their returned model
 * and transports admission reports; it does not establish photographic
 * provenance, own facial review evidence or judge likeness.
 *
 *
 */
export function createConnectedPersonRuntime(
  source:
    | IAutoMovieHumanPersonGeneration
    | Pick<IAutoMovieHumanPersonGeneration, "face" | "body">
    | [IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView],
  options: IConnectedPersonRuntimeOptions = {},
) {
  // the evaluation in progress reports its stages to the request that asked for it
  let stage: (name: string) => void = options.progress ?? (() => undefined);
  const census = options.census === true;
  const observeStage = (name: string): void => stage(name);
  const observeFaceConstructionProgress = (
    progress: IAutoMovieHumanFaceConstructionProgress,
  ): void => stage(describeConnectedPersonFaceProgress(progress));
  const observeBodyConstructionProgress = (
    progress: IHumanBodyConstructionProgress,
  ): void => stage(describeConnectedBodyConstructionProgress(progress));
  const evaluate = Array.isArray(source)
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
  const bodyBasis = Array.isArray(source) ? source[1].body : source.body;
  const faceBasis = Array.isArray(source) ? source[0].face : source.face;
  // the generation the humeral-head reading compiles, joined again only then
  const generationOf = () =>
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
  // One evaluated person is kept. It is released before a different document
  // is evaluated, so the worker never holds two whole people at once.
  const release = (): void => {
    lastDocument = undefined;
    lastBuilt = undefined;
    lastConstructionDocument = undefined;
    lastConstruction = undefined;
  };
  const encode = async (
    built: Pick<IAutoMovieHumanPersonGenerationBuild, "model" | "body">,
    face: IAutoMovieHumanFaceBasisDocument,
    progress: (stage: string) => void,
  ): Promise<Uint8Array<ArrayBuffer>> => {
    const atlas = await createHumanBodyAtlasExportQualification(
      bodyBasis,
      built.body.evaluatedDocument,
      "body:",
    );
    progress("atlas-qualified");
    const assembly = await createHumanBodyAssemblyExportQualification(
      bodyBasis,
      built.body.evaluatedDocument,
      "body:",
      built.body.layerObservations,
    );
    progress("assembly-qualified");
    const oral = await createHumanFaceOralExportQualification(
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
    progress: (stage: string) => void = () => undefined,
  ): Promise<ConnectedBodyResult> => {
    stage = progress;
    if (request.operation === "armsDown")
      throw new Error("A person has no arms-down solve.");
    const document = parseHumanPersonDocument(
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
      const constructed = lastConstruction ?? evaluate.construct(document);
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
    const built = lastBuilt ?? evaluate(document);
    lastDocument = request.document;
    lastBuilt = built;
    if (request.operation === "export")
      return {
        operation: "export",
        glb: await encode(built, document.face, progress),
      };
    const crossings =
      request.measure || request.anatomy
        ? await readConnectedBodyContacts({
            model: (segment ??= createHumanBodySegmenter(bodyBasis))(built.body)
              .model,
            sliceMs: 25,
            yieldThread: () =>
              new Promise((resolve) => {
                setTimeout(resolve, 0);
              }),
            superseded: () => false,
          })
        : null;
    let anatomy: IConnectedBodyPreviewResult["anatomy"] = null;
    if (request.anatomy && crossings !== null) {
      const generation = compiled?.generation ?? generationOf();
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
            built.body.posedSurfaces.map((surface) => surface.positions),
            built.body.landmarks,
            built.body.groundPlaneHeightMetres,
          )
        : null,
      extras: { bones: built.bones, landmarks: built.body.landmarks },
    };
  };
}
