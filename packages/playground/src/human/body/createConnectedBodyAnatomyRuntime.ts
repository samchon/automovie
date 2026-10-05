import { HUMAN_BODY_EXTERIOR_TARGETS } from "@automovie/human/body/anatomy/surface/HUMAN_BODY_EXTERIOR_TARGETS";
import type { IAutoMovieHumanBodyExteriorReference } from "@automovie/human/body/anatomy/surface/IAutoMovieHumanBodyExteriorReference";
import { assertTextSize } from "@automovie/human/common/document/assertTextSize";
import { parseHumanBodyBasisDocument } from "@automovie/human/body/document/parseHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import { createConnectedBodyAnatomicalRuntime } from "./createConnectedBodyAnatomicalRuntime";
import { createConnectedBodyExteriorRuntime } from "./createConnectedBodyExteriorRuntime";

/**
 * The anatomy inspection page's worker runtime: route a body document by the
 * anatomy it carries.
 *
 * A document whose anatomy holds bound surface targets builds the
 * source-conditioned exterior and its report; one holding only humeral or
 * femoral head radii builds the articular target-sphere candidates. One
 * frame is one inspection, so a document carrying both refuses by name, as
 * does a document with neither. Both runtimes are compiled on first use.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Connects body documents with anatomical measurements to their inspection on the actual worker.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Refuses an ambiguous inspection instead of choosing one report silently.
 */
export function createConnectedBodyAnatomyRuntime(basis: IAutoMovieHumanBodyBasis, source?: IAutoMovieHumanBodyExteriorReference) {
  let exterior: ReturnType<typeof createConnectedBodyExteriorRuntime> | undefined;
  let articular: ReturnType<typeof createConnectedBodyAnatomicalRuntime> | undefined;
  return async (request: ConnectedBodyRequest): Promise<ConnectedBodyResult> => {
    assertTextSize(request.document);
    const anatomy: unknown = parseHumanBodyBasisDocument(request.document).anatomy;
    const has = (path: string): boolean =>
      path.split(".").reduce<unknown>(
        (node, key) => (typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined),
        anatomy,
      ) !== undefined;
    const bound = HUMAN_BODY_EXTERIOR_TARGETS.some((target) => has(target.path));
    const heads = ["leftUpperLimb.upperArm.humerus", "rightUpperLimb.upperArm.humerus", "leftLowerLimb.thigh.femur", "rightLowerLimb.thigh.femur"]
      .some((bone) => has(bone + ".sphereFittedHeadRadius"));
    if (bound && heads)
      throw new Error("One inspection per frame: exterior targets and articular head radii are inspected in separate documents.");
    if (bound) return (exterior ??= createConnectedBodyExteriorRuntime(basis, source))(request);
    if (heads) return (articular ??= createConnectedBodyAnatomicalRuntime(basis))(request);
    throw new Error("missing-anatomical-input: the document's anatomy has no exterior target or articular head radius.");
  };
}
