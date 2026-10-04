import {
  type IAutoMovieHumanPersonGeneration,
  createHumanPersonBuilder,
  createHumanPersonGenerationBuilder,
  exportHumanPerson,
  parseHumanPersonDocument,
} from "@automovie/human";

import { packConnectedBodyModel } from "../body/connectedBodyGeometry";
import type {
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "../body/connectedBodyProtocol";

/**
 * Keep one compiled face basis and body basis, or one source generation read
 * as one skin with a head/body partition (`createHumanPersonGenerationBuilder`,
 * selected by the presence of its head weight map), in a worker and evaluate
 * whole people against them. It answers the body editor's request protocol, so the
 * body stage draws a person exactly as it draws a body: a preview packs the
 * composed model's Float32 buffers (the composed model is one static resident
 * model, its face parts, body parts and seam ribbon together) and an export
 * runs only on an explicit request. The last evaluated document is reused for
 * an export of the same text, and every request is admitted from its text, so
 * a caller cannot skip document admission by reusing a string.
 *
 * A person has no contact reading and no arms-down solve yet: those are the
 * body editor's, they refuse on a person, and a preview reports no crossings
 * and no anatomy reading.
 *
 *
 * @evidenceExclude requirements/actors/facial-authoring/README.md#face-requirements The runtime is the whole-person adapter; the face domain index is answered by the face editor and the package.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components The runtime names no face component; the person builder composes the face and body parts.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-articulation The runtime evaluates no jaw, lid or attachment articulation; the person builder does.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-contact The runtime evaluates no lip, tooth or tongue contact; the face builder inside the person builder does.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement The runtime offers no control or component replacement; it only answers requests for an admitted document.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-document The runtime parses a person document and defines no independent face document.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-export The runtime exports the composed whole person on request, not the static face asset this unit names.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-expression The runtime separates no identity from expression; the person document carries them to the builder.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-provenance The runtime records no photograph provenance.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-review The runtime produces no review evidence or likeness judgement.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-skin-colour The runtime colours no skin; the person builder does.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-skin-condition The runtime shapes no skin condition or wrinkle.
 * @evidenceExclude requirements/actors/facial-authoring/contract.md#actor-face-surface-maps The runtime builds no surface map; it packs the composed model the builder returned.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/README.md#face-specifications The runtime is the whole-person adapter; the face specification index is answered by the face editor and the package.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-articulation The runtime evaluates no articulation; the person builder does.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments The runtime builds no shared joint or internal structure; the person builder owns the seam.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components The runtime builds no component or surface composition of its own.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-contact The runtime evaluates no contact.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls The runtime resolves no control or replacement.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-document The runtime holds no replay basis of its own; the bases are the builder's inputs.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-export The runtime exports a composed whole person, not the static face exchange this unit names.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-expression The runtime defines no expression or optical reference.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-parametric-hair The runtime generates no hair.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-provenance The runtime executes no photograph source.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-review The runtime records no review state or source.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-colour The runtime colours no skin.
 * @evidenceExclude specifications/asset-and-representation/facial-authoring/contract.md#face-spec-skin-condition The runtime divides no skin into local regions.
 */
export function createConnectedPersonRuntime(
  source:
    | IAutoMovieHumanPersonGeneration
    | Pick<IAutoMovieHumanPersonGeneration, "face" | "body">,
) {
  const evaluate =
    "headSkin" in source
      ? createHumanPersonGenerationBuilder({ generation: source })
      : createHumanPersonBuilder(source);
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
    return {
      operation: "preview",
      model: packConnectedBodyModel(built.model),
      crossings: null,
      anatomy: null,
      extras: { bones: built.bones, landmarks: built.body.landmarks },
    };
  };
}
