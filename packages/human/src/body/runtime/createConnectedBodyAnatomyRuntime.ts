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
 * Route one admitted numerical document to its existing anatomy inspection owner. A present quantity path registered by the source assembly takes precedence and uses the body runtime with the same whole-person reader. Otherwise bound exterior targets select the source-conditioned exterior, and humeral/femoral head-radius paths select articular target-sphere inspection.
 *
 * The candidate-only branches refuse mixed exterior/head requests and documents with neither supported input. That mixed-input check occurs after source-quantity routing, so it is not a global prohibition for all body requests. Each chosen runtime compiles lazily once; canonical parsing also runs inside the delegate rather than being bypassed by routing.
 *
 * Basis, whole-person readers and constructor reference must remain the same source generation for this closure's lifetime. Returned reports retain each owner's candidate or body observation limits; routing does not certify physiological completion.
 *
 * @evidence contracts/common.md#principled-implementation Admitted anatomy paths select an actual registered source quantity before the authored exterior/head candidates, preserving source-context parsing and explicit ambiguous-candidate refusal.
 * @evidence contracts/common.md#clear-and-simple-design This router owns capability selection and lazy delegate lifetime; each selected runtime owns its numerical construction and supported operation refusals.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No missing anatomy is replaced by a default inspection, and source-quantity precedence is documented rather than claiming every mixed request is rejected.
 * @evidence contracts/common.md#meaningful-documentation The prose states routing order, candidate-only ambiguity, repeated admission and fixed-generation ownership.
 * @evidence contracts/performance.md#efficient-algorithms Each request parses its document and checks authored target paths plus registered quantity bindings, with path depth governing lookup cost; delegates add their own parsing and numerical work. Each of the three delegates compiles at most once per closure.
 * @evidence contracts/performance.md#reuse-equivalent-work Separate lazy caches reuse only the selected capability's compiler under fixed source context; request results and explicit exports remain independently evaluated effects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure can retain all three delegates and their source-sized compilation state until released, with no eviction bound beyond those three owners; concurrent request intermediates remain caller-driven and no worker handle is created here.
 */
export function createConnectedBodyAnatomyRuntime(
  basis: IAutoMovieHumanBodyBasis,
  whole: IAutoMovieHumanBodySimpleWhole,
  source?: IAutoMovieHumanBodyExteriorReference,
): (request: ConnectedBodyRequest) => Promise<ConnectedBodyResult> {
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
    const has: (path: string) => boolean = (path: string): boolean =>
      path
        .split(".")
        .reduce<unknown>(
          (node: unknown, key: string): unknown =>
            typeof node === "object" && node !== null
              ? (node as Record<string, unknown>)[key]
              : undefined,
          anatomy,
        ) !== undefined;
    const bound: boolean = HUMAN_BODY_EXTERIOR_TARGETS.some((target: (typeof HUMAN_BODY_EXTERIOR_TARGETS)[number]): boolean =>
      has(target.path),
    );
    if (
      basis.anatomicalAssembly?.parts.some((part: NonNullable<IAutoMovieHumanBodyBasis["anatomicalAssembly"]>["parts"][number]): boolean | undefined =>
        part.quantityBindings?.some((binding: NonNullable<NonNullable<IAutoMovieHumanBodyBasis["anatomicalAssembly"]>["parts"][number]["quantityBindings"]>[number]): boolean => has(binding.path)),
      )
    )
      return (sourceParts ??= createConnectedBodyRuntime(basis, whole))(
        request,
      );
    const heads: boolean = [
      "leftUpperLimb.upperArm.humerus",
      "rightUpperLimb.upperArm.humerus",
      "leftLowerLimb.thigh.femur",
      "rightLowerLimb.thigh.femur",
    ].some((bone: string): boolean => has(bone + ".sphereFittedHeadRadius"));
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
