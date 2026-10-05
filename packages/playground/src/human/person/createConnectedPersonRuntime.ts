import {
  type IAutoMovieHumanPersonBodyView,
  type IAutoMovieHumanPersonGeneration,
  type IAutoMovieHumanPersonHeadView,
  compileHumanPersonGeneration,
  createHumanBodySegmenter,
  createHumanPersonBuilder,
  createHumanPersonSimpleWhole,
  createHumanPersonGenerationBuilder,
  joinHumanPersonGeneration,
  exportHumanPerson,
  parseHumanPersonDocument,
} from "@automovie/human";

import { packConnectedBodyModel } from "../body/connectedBodyGeometry";
import type { ConnectedBodyRequest } from "../body/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "../body/ConnectedBodyResult";
import { readConnectedBodyContacts } from "../body/readConnectedBodyContacts";
import { readConnectedBodyHumeralHeads } from "../body/readConnectedBodyHumeralHeads";
import type { IConnectedBodyPreviewResult } from "../body/IConnectedBodyPreviewResult";

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
 *
 * @evidenceExclude requirements/actors/facial-authoring/README.md#face-requirements The runtime is the whole-person adapter; the face domain index is answered by the face editor and the package.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-articulation The runtime evaluates no jaw, lid or attachment articulation; the person builder does.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-contact The runtime evaluates no lip, tooth or tongue contact; the face builder inside the person builder does.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-provenance The runtime records no photograph provenance.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-review The runtime produces no review evidence or likeness judgement.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-skin-colour The runtime colours no skin; the person builder does.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-skin-condition The runtime shapes no skin condition or wrinkle.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-surface-maps The runtime builds no surface map; it packs the composed model the builder returned.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/README.md#face-specifications The runtime is the whole-person adapter; the face specification index is answered by the face editor and the package.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-articulation The runtime evaluates no articulation; the person builder does.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments The runtime builds no shared joint or internal structure; the person builder owns the seam.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-contact The runtime evaluates no contact.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair The runtime generates no hair.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance The runtime executes no photograph source.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The runtime records no review state or source.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour The runtime colours no skin.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-condition The runtime divides no skin into local regions.
 */
export function createConnectedPersonRuntime(
  source:
    | IAutoMovieHumanPersonGeneration
    | Pick<IAutoMovieHumanPersonGeneration, "face" | "body">
    | [IAutoMovieHumanPersonHeadView, IAutoMovieHumanPersonBodyView],
) {
  const evaluate = Array.isArray(source)
    ? createHumanPersonGenerationBuilder({ generation: joinHumanPersonGeneration(source[0], source[1]) })
    : "headSkin" in source
      ? createHumanPersonGenerationBuilder({ generation: source })
      : createHumanPersonBuilder(source);
  const bodyBasis = Array.isArray(source) ? source[1].body : source.body;
  // the generation the humeral-head reading compiles, joined again only then
  const generationOf = () =>
    Array.isArray(source) ? joinHumanPersonGeneration(source[0], source[1]) : "headSkin" in source ? source : undefined;
  let compiled: ReturnType<typeof compileHumanPersonGeneration> | undefined;
  let segment: ReturnType<typeof createHumanBodySegmenter> | undefined;
  let lastDocument: string | undefined;
  let lastBuilt: ReturnType<typeof evaluate> | undefined;
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    if (request.operation === "armsDown")
      throw new Error("A person has no arms-down solve.");
    const document = parseHumanPersonDocument(request.document);
    const built =
      lastDocument === request.document && lastBuilt !== undefined
        ? lastBuilt
        : evaluate(document);
    lastDocument = request.document;
    lastBuilt = built;
    if (request.operation === "export")
      return {
        operation: "export",
        glb: (await exportHumanPerson(built.model)).glb,
      };
    const crossings =
      request.measure || request.anatomy
        ? await readConnectedBodyContacts({
            model: (segment ??= createHumanBodySegmenter(bodyBasis))(built.body).model,
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
        throw new Error("A humeral-head reading needs the published person generation.");
      anatomy = readConnectedBodyHumeralHeads({
        basis: bodyBasis,
        whole: createHumanPersonSimpleWhole((compiled ??= compileHumanPersonGeneration(generation)), document),
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
      extras: { bones: built.bones, landmarks: built.body.landmarks },
    };
  };
}
