import { Vector3 } from "@automovie/engine";

import type { IHumanFaceHairIntegration } from "./IHumanFaceHairIntegration";
import type { IHumanFaceHairMetric } from "./IHumanFaceHairMetric";
import { assertHumanFaceHairIntegrationContext } from "./assertHumanFaceHairIntegrationContext";
import { createHumanFaceHairGatherStage } from "./createHumanFaceHairGatherStage";
import { humanFaceHairEmergence } from "./humanFaceHairEmergence";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Prepare the same rooted emergence for an integrated guide or a placed strand.
 * The caller supplies the lock's metric length and its exact contact instance:
 * regional length for a guide, post-clump polyline length for a strand. This
 * owner reads the combed field from the neutral chart; the current
 * barycentric seat, signed query, ray caster and root-star distance reader must
 * share one closed collider snapshot. The emergence owner supplies the desired
 * unit root tangent at the caller's exit elevation `degrees`, either an
 * admitted authored target or the existing scalp placement interval. The
 * integrator grows its curved boundary transition
 * before starting the free walk. All positions and lengths are head-frame metres.
 * An authored non-normal elevation needs a tangential field; a singular field
 * refuses rather than replacing that target with normal emergence. The legacy
 * scalp fallback remains with the unchanged generic emergence owner.
 *
 * The returned stage and contact belong to this lock; the supplied remaining
 * budget is admitted here and mutated by the owning metric walker. Both guide
 * and strand use the same initial state; the integrator supplies any completed
 * rooted transition before hierarchy placement. Preparation refusal propagates.
 * Neither the fibre launch nor this preparation certifies ribbon interiors.
 */
export function createHumanFaceHairCurveStart(
  props: IHumanFaceHairIntegration,
  metric: IHumanFaceHairMetric,
  degrees: number,
) {
  assertHumanFaceHairIntegrationContext(props);
  const { layer } = props;
  if (layer.gather !== undefined && props.place !== undefined)
    throw new Error(
      "Gathered hair requires direct integration through its scalp tie, without hierarchy placement.",
    );
  const stage = createHumanFaceHairGatherStage({
    layer,
    reference: props.reference,
    root: props.root,
    sequence: props.sequence,
    anchor: props.gatherAnchor,
    gatherDirection: props.gatherDirection,
  });
  const { length, contact } = metric;
  if (!Number.isFinite(length) || length <= contact.epsilon)
    throw new Error("Hair length cannot accommodate its rooted transition.");
  const budget = props.budget;
  const normal = humanFaceHairFrame.direction(props.normal);
  const field = stage.direction(props.root, normal, 0);
  if (layer.emergenceAngleDegrees !== undefined && degrees < 90 &&
      Vector3.length(Vector3.subtract(field, Vector3.scale(normal, Vector3.dot(field, normal)))) === 0)
    throw new Error("An authored non-normal hair emergence requires a nonzero tangential styling direction.");
  const direction = humanFaceHairEmergence({
    normal: props.normal,
    degrees,
    field,
  });
  return { stage, length, contact, budget, direction };
}
