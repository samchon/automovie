/**
 * Keep one compiled face basis and body basis in a worker and evaluate whole
 * people against them. It answers the body editor's request protocol, so the
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
 * @evidence contracts/common.md#principled-implementation One admitted builder serves every request; the response shape is the body protocol's, which a composed static model satisfies by construction.
 * @evidence contracts/common.md#clear-and-simple-design A thin adapter from the body protocol to the person builder, holding only the last evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported operations refuse by name instead of returning an empty answer.
 * @evidence contracts/common.md#meaningful-documentation The comment states which protocol it answers, what it packs and what it does not offer.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The runtime carries a model and defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The runtime consumes no channel of its own.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The runtime emits what the person builder emits.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The runtime converts no unit or frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The seam is the person builder's; the runtime only transports its result.
 * @evidenceExclude contracts/modeling.md#rendered-observation The runtime displays nothing; the assembled person is observed on the viewer that draws it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The runtime carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The runtime bounds no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The runtime adds no input.
 */
import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanFaceBasis,
  createHumanPersonBuilder,
  exportHumanPerson,
  parseHumanPersonDocument,
} from "@automovie/human";

import { packConnectedBodyModel } from "../body/connectedBodyGeometry";
import type {
  ConnectedBodyRequest,
  ConnectedBodyResult,
} from "../body/connectedBodyProtocol";

export function createConnectedPersonRuntime(bases: {
  face: IAutoMovieHumanFaceBasis;
  body: IAutoMovieHumanBodyBasis;
}) {
  const evaluate = createHumanPersonBuilder(bases);
  let last: { document: string; built: ReturnType<typeof evaluate> } | undefined;
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    if (request.operation === "armsDown")
      throw new Error("A person has no arms-down solve.");
    const document = parseHumanPersonDocument(request.document);
    const built =
      last?.document === request.document ? last.built : evaluate(document);
    last = { document: request.document, built };
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
