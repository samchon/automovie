import type { integrateHumanFaceHairCurve } from "./integrateHumanFaceHairCurve";

/**
 * Admit the shared closed-skin readers and caller-owned numerical budget.
 * Both the metric walk's preparation and standalone exterior-interval query
 * use this boundary before reading required context. Legacy callers receive a
 * named refusal rather than an accidental property-access TypeError. Zero is
 * valid admission and later means exhaustion; malformed counts never mutate.
 * Reader snapshot/provenance identity remains the compiler's responsibility.
 *
 * @evidence contracts/common.md#principled-implementation Callable ray/proximity readers, original support arrays and a nonnegative safe-integer remaining count are the numerical premises their consumers require; admission leaves all caller state intact.
 * @evidence contracts/common.md#clear-and-simple-design One context-admission owner serves both ray and metric consumers without copying budget validity rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts It supplies no fallback reader, count reset or per-subject exception.
 * @evidence contracts/common.md#meaningful-documentation Defines missing-context and malformed-count refusals, valid zero and ownership limits.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It admits transport context and defines no displayed part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It admits computational state rather than a styling channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It allocates no form or primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions Reader objects and iteration counts carry no spatial quantity here.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The compiler owns collider identity; this boundary only admits reader shape.
 * @evidenceExclude contracts/modeling.md#rendered-observation It admits context and owns no displayed result.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range A safe-integer computational count is not a clinical range.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It supplies no personal authoring control.
 */
export function assertHumanFaceHairIntegrationContext(
  props: Pick<
    Parameters<typeof integrateHumanFaceHairCurve>[0],
    "raycaster" | "rootBoundary" | "budget"
  >,
): void {
  if (
    props.raycaster === undefined ||
    props.raycaster === null ||
    typeof props.raycaster.nearestHit !== "function" ||
    props.rootBoundary === undefined ||
    props.rootBoundary === null ||
    !Array.isArray(props.rootBoundary.triangles) ||
    typeof props.rootBoundary.distance !== "function" ||
    props.budget === undefined ||
    props.budget === null
  )
    throw new Error(
      "Hair integration requires its current closed raycaster, root boundary and caller budget context.",
    );
  if (
    !Number.isSafeInteger(props.budget.remaining) ||
    props.budget.remaining < 0
  )
    throw new Error(
      "Hair integration budget must be a nonnegative safe integer.",
    );
}
