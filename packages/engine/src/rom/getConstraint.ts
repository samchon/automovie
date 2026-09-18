import { AutoMovieHumanoidBone, IAutoMovieJointConstraint } from "@automovie/interface";
import { DEFAULT_HUMANOID_ROM } from "./DEFAULT_HUMANOID_ROM";

/**
 * The effective ROM constraint for a bone: the skeleton's per-bone override if
 * present, otherwise the default-table fallback, otherwise `null`
 * (unconstrained).
 *
 * @evidence requirements/actors/skeleton-rig-and-retargeting.md#actor-joint-range-constraints Resolves the authored bone constraint before the normalized humanoid fallback.
 * @evidence specifications/performance-motion-and-staging/rig-deformation-and-retargeting.md#performance-rig-rom-control-driver-graph Selects the effective limit node evaluated by ROM consumers.
 */
export const getConstraint = (
  bone: AutoMovieHumanoidBone,
  override: IAutoMovieJointConstraint | null,
): IAutoMovieJointConstraint | null =>
  override ?? DEFAULT_HUMANOID_ROM[bone] ?? null;
