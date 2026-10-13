import { HUMAN_BODY_EXTERIOR_TARGETS } from "../anatomy/surface/HUMAN_BODY_EXTERIOR_TARGETS";
import type { IAutoMovieHumanBodyExteriorReference } from "../anatomy/surface/IAutoMovieHumanBodyExteriorReference";
import { parseHumanBodyBasisDocument } from "../document/parseHumanBodyBasisDocument";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodySimpleWhole } from "../structures/IAutoMovieHumanBodySimpleWhole";
import { assertTextSize } from "../../common/document/assertTextSize";

import type { ConnectedBodyRequest } from "./ConnectedBodyRequest";
import type { ConnectedBodyResult } from "./ConnectedBodyResult";
import { createConnectedBodyRuntime } from "./createConnectedBodyRuntime";
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
 * does a document with neither. Source-bound quantity requests use the body
 * evaluator with whole-person readings compiled from the same loaded body
 * view. Each selected runtime is compiled on first use; document admission
 * retains the basis's anatomical source context.
 *
 */
export function createConnectedBodyAnatomyRuntime(
  basis: IAutoMovieHumanBodyBasis,
  whole: IAutoMovieHumanBodySimpleWhole,
  source?: IAutoMovieHumanBodyExteriorReference,
) {
  let exterior:
    | ReturnType<typeof createConnectedBodyExteriorRuntime>
    | undefined;
  let articular:
    | ReturnType<typeof createConnectedBodyAnatomicalRuntime>
    | undefined;
  let sourceParts: ReturnType<typeof createConnectedBodyRuntime> | undefined;
  return async (
    request: ConnectedBodyRequest,
  ): Promise<ConnectedBodyResult> => {
    assertTextSize(request.document);
    const anatomy: unknown = parseHumanBodyBasisDocument(
      request.document,
      basis.anatomicalAssembly,
    ).anatomy;
    const has = (path: string): boolean =>
      path
        .split(".")
        .reduce<unknown>(
          (node, key) =>
            typeof node === "object" && node !== null
              ? (node as Record<string, unknown>)[key]
              : undefined,
          anatomy,
        ) !== undefined;
    const bound = HUMAN_BODY_EXTERIOR_TARGETS.some((target) =>
      has(target.path),
    );
    if (
      basis.anatomicalAssembly?.parts.some((part) =>
        part.quantityBindings?.some((binding) => has(binding.path)),
      )
    )
      return (sourceParts ??= createConnectedBodyRuntime(basis, whole))(
        request,
      );
    const heads = [
      "leftUpperLimb.upperArm.humerus",
      "rightUpperLimb.upperArm.humerus",
      "leftLowerLimb.thigh.femur",
      "rightLowerLimb.thigh.femur",
    ].some((bone) => has(bone + ".sphereFittedHeadRadius"));
    if (bound && heads)
      throw new Error(
        "One inspection per frame: exterior targets and articular head radii are inspected in separate documents.",
      );
    if (bound)
      return (exterior ??= createConnectedBodyExteriorRuntime(basis, source))(
        request,
      );
    if (heads)
      return (articular ??= createConnectedBodyAnatomicalRuntime(basis))(
        request,
      );
    throw new Error(
      "missing-anatomical-input: the document's anatomy has no exterior target or articular head radius.",
    );
  };
}
