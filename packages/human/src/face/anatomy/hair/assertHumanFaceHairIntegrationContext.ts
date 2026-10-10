import type { integrateHumanFaceHairCurve } from "./integrateHumanFaceHairCurve";

/**
 * Admit the shared closed-skin readers and caller-owned numerical budget.
 * Both the metric walk's preparation and standalone exterior-interval query
 * use this boundary before reading required context. Legacy callers receive a
 * named refusal rather than an accidental property-access TypeError. Zero is
 * valid admission and later means exhaustion; malformed counts never mutate.
 * Reader snapshot/provenance identity remains the compiler's responsibility.
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
