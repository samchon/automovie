import type { integrateHumanFaceHairCurve } from "./integrateHumanFaceHairCurve";

/**
 * Admit the shared closed-skin readers and caller-owned numerical budget. Both the metric walk's preparation and standalone exterior-interval query use this boundary before reading required context. Legacy callers receive a named refusal rather than an accidental property-access TypeError. Zero is valid admission and later means exhaustion; malformed counts never mutate. Reader snapshot/provenance identity remains the compiler's responsibility.
 *
 * @evidence contracts/common.md#principled-implementation Required ray, root-support and budget members are admitted before the metric walk or exterior interval uses them.
 * @evidence contracts/common.md#clear-and-simple-design One context boundary supplies named refusal instead of relying on an accidental missing-member access.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nonnegative safe remaining counts include zero as valid exhaustion state; callable presence does not prove snapshot correspondence or query behavior.
 * @evidence contracts/common.md#meaningful-documentation The documented reader provenance premise remains with the compiler and malformed context is rejected without mutation.
 * @evidence contracts/performance.md#efficient-algorithms Fixed member and integer checks take constant work independent of collider size.
 * @evidence contracts/performance.md#reuse-equivalent-work Both walk preparation and standalone interval queries reuse the boundary while borrowing existing compiled readers.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains reader and budget ownership; this validator opens no handle and retains no reference after return.
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
