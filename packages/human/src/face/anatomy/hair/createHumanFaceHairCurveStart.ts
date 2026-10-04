import { Vector3 } from "@automovie/engine";

import type { IHumanFaceHairMetric } from "./IHumanFaceHairMetric";
import type { IHumanFaceHairIntegration } from "./IHumanFaceHairIntegration";
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
 * unit root tangent; the integrator grows its curved boundary transition
 * before starting the free walk. All positions and lengths are head-frame metres.
 *
 * The returned stage and contact belong to this lock; the supplied remaining
 * budget is admitted here and mutated by the owning metric walker. Both guide
 * and strand use the same initial state; the integrator supplies any completed
 * rooted transition before hierarchy placement. Preparation refusal propagates.
 * Neither the fibre launch nor this preparation certifies ribbon interiors.
 *
 * @evidence contracts/common.md#principled-implementation Guide and strand preparation reads the same emergence field at its own current root and preserves the caller's metric/contact instance. Shared context is admitted before iteration and gathered locks cannot bypass tie-state completion through hierarchy placement. The integrator owns actual stations and exterior certificates.
 * @evidence contracts/common.md#clear-and-simple-design One owner prepares the initial field and caller's exact metric/contact instance; the integrator owns walking and the strand owner owns interpolation admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every root follows the same field and ray solver without a style or subject exception, projected launch or changed clearance.
 * @evidence contracts/common.md#meaningful-documentation States snapshot identity, neutral/current responsibilities, owned state, units, refusal and surface limits.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It prepares numerical state and defines no displayed part.
 * @evidenceExclude contracts/modeling.md#parameter-channels It preserves the admitted layer's quantities and introduces no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It prepares an initial direction and state but emits no station; the integrator owns the rooted stem and free population.
 * @evidence contracts/modeling.md#spatial-conventions Chart, current root and collider use head-frame metres; directions are dimensionless unit vectors.
 * @evidence contracts/modeling.md#shared-boundaries It transports the canonical sampler seat, support and same-snapshot contact to the metric walker; createHumanFaceHairExteriorInterval owns chord certificates and the integrator owns the freeFrom boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It prepares numerical state; the assembled hair builder owns visual observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The emergence and regional-length owners supply anatomical or conventional quantities.
 * @evidenceExclude contracts/anatomy.md#permitted-range Admission belongs to assertHumanFaceHair; this adapter establishes numerical launch premises only.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It transports an admitted layer and derived seat rather than adding an authoring input.
 */
export function createHumanFaceHairCurveStart(
  props: IHumanFaceHairIntegration,
  metric: IHumanFaceHairMetric,
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
  const direction = humanFaceHairEmergence({
    hairline: layer.hairline,
    chart: Vector3.subtract(props.reference, props.origin),
    normal: props.normal,
    field: stage.direction(
      props.root,
      humanFaceHairFrame.direction(props.normal),
      0,
    ),
  });
  return { stage, length, contact, budget, direction };
}
