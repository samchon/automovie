import type { IAutoMovieVector3 as ImportedIAutoMovieVector3 } from "@automovie/interface";
import type { IHumanFaceHairContact as ImportedIHumanFaceHairContact } from "./IHumanFaceHairContact";
import { Vector3, type IAutoMovieMeshQueryBudget as ImportedIAutoMovieMeshQueryBudget } from "@automovie/engine";

import type { IHumanFaceHairIntegration } from "./IHumanFaceHairIntegration";
import type { IHumanFaceHairMetric } from "./IHumanFaceHairMetric";
import { assertHumanFaceHairIntegrationContext } from "./assertHumanFaceHairIntegrationContext";
import { createHumanFaceHairGatherStage } from "./createHumanFaceHairGatherStage";
import { humanFaceHairEmergence } from "./humanFaceHairEmergence";
import { humanFaceHairFrame } from "./humanFaceHairFrame";

/**
 * Prepare the same rooted emergence for an integrated guide or a placed strand. The caller supplies the lock's metric length and its exact contact instance: regional length for a guide, post-clump polyline length for a strand. This owner reads the combed field from the neutral chart; the current barycentric seat, signed query, ray caster and root-star distance reader must share one closed collider snapshot. The emergence owner supplies the desired unit root tangent at the caller's exit elevation `degrees`, either an admitted authored target or the existing scalp placement interval. The integrator grows its curved boundary transition before starting the free walk. All positions and lengths are head-frame metres. An authored non-normal elevation needs a tangential field; a singular field refuses rather than replacing that target with normal emergence. The legacy scalp fallback remains with the unchanged generic emergence owner.
 *
 * The returned stage and contact belong to this lock; the supplied remaining budget is admitted here and mutated by the owning metric walker. Both guide and strand use the same initial state; the integrator supplies any completed rooted transition before hierarchy placement. Preparation refusal propagates. Neither the fibre launch nor this preparation certifies ribbon interiors.
 *
 * @evidence contracts/common.md#principled-implementation Guide and hierarchy placement prepare one canonical root direction, gather stage, metric contact and remaining budget.
 * @evidence contracts/common.md#clear-and-simple-design The existing metric walker retains this same preparation when hierarchy placement resumes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored non-normal emergence needs tangential styling and gathered hierarchy placement refuses instead of substituting a launch.
 * @evidence contracts/common.md#meaningful-documentation Length and coordinates use head metres; preparation alone does not certify ribbon interiors.
 * @evidence contracts/performance.md#efficient-algorithms Preparation performs fixed field/frame work before subsequent station traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Caller metric and contact are reused instead of recomputing regional or post-clump length.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The lock owns the returned stage, while contact and remaining budget retain their existing caller lifetime.
 */
export function createHumanFaceHairCurveStart(
  props: IHumanFaceHairIntegration,
  metric: IHumanFaceHairMetric,
  degrees: number,
): { stage: { pending: () => boolean; direction(point: ImportedIAutoMovieVector3, normal: ImportedIAutoMovieVector3, distance: number): ImportedIAutoMovieVector3; observe(point: ImportedIAutoMovieVector3, distance: number): void; crossing(from: ImportedIAutoMovieVector3, to: ImportedIAutoMovieVector3): number | undefined; enter: (point: ImportedIAutoMovieVector3, distance: number) => void; assertTied(last: ImportedIAutoMovieVector3): void; }; length: number; contact: ImportedIHumanFaceHairContact; budget: ImportedIAutoMovieMeshQueryBudget; direction: ImportedIAutoMovieVector3; } {
  assertHumanFaceHairIntegrationContext(props);
  const { layer }: IHumanFaceHairIntegration = props;
  if (layer.gather !== undefined && props.place !== undefined)
    throw new Error(
      "Gathered hair requires direct integration through its scalp tie, without hierarchy placement.",
    );
  const stage: { pending: () => boolean; direction(point: ImportedIAutoMovieVector3, normal: ImportedIAutoMovieVector3, distance: number): ImportedIAutoMovieVector3; observe(point: ImportedIAutoMovieVector3, distance: number): void; crossing(from: ImportedIAutoMovieVector3, to: ImportedIAutoMovieVector3): number | undefined; enter: (point: ImportedIAutoMovieVector3, distance: number) => void; assertTied(last: ImportedIAutoMovieVector3): void; } = createHumanFaceHairGatherStage({
    layer,
    reference: props.reference,
    root: props.root,
    sequence: props.sequence,
    anchor: props.gatherAnchor,
    gatherDirection: props.gatherDirection,
  });
  const { length, contact }: IHumanFaceHairMetric = metric;
  if (!Number.isFinite(length) || length <= contact.epsilon)
    throw new Error("Hair length cannot accommodate its rooted transition.");
  const budget: ImportedIAutoMovieMeshQueryBudget = props.budget;
  const normal: ImportedIAutoMovieVector3 = humanFaceHairFrame.direction(props.normal);
  const field: ImportedIAutoMovieVector3 = stage.direction(props.root, normal, 0);
  if (layer.emergenceAngleDegrees !== undefined && degrees < 90 &&
      Vector3.length(Vector3.subtract(field, Vector3.scale(normal, Vector3.dot(field, normal)))) === 0)
    throw new Error("An authored non-normal hair emergence requires a nonzero tangential styling direction.");
  const direction: ImportedIAutoMovieVector3 = humanFaceHairEmergence({
    normal: props.normal,
    degrees,
    field,
  });
  return { stage, length, contact, budget, direction };
}
