import { AutoMovieHumanoidBone } from "@automovie/interface";
import { IAutoMovieResolvedBone } from "../kinematics/IAutoMovieResolvedBone";

/**
 * The one stance predicate: `true` on every frame where the effector resolved
 * and sat at or below `groundAt(x, z) + tolerance`, mirroring
 * {@link validateGroundContact}'s contact test.
 *
 * It is extracted so the two consumers cannot disagree about what "planted"
 * means: {@link pinStanceTargets} groups the mask into stance runs for the
 * ground-IK pass, while the retarget contact pass reads it frame by frame to
 * decide which frames carry a contact worth preserving.
 *
 * @evidence requirements/motion/contact-weight-and-support.md#motion-contact-authority-tolerance Applies the declared ground source and tolerance to decide contact frames.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-contact-phase-weight-support Produces the shared stance mask used by planting and retargeting.
 * @author Samchon
 */
export const contactMask = (props: {
  /** End-effector bone judged against the ground. */
  effector: AutoMovieHumanoidBone;
  /** Per-frame FK bone lookups. */
  resolved: ReadonlyArray<
    ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
  >;
  /** Ground height at a plan position. */
  groundAt: (x: number, z: number) => number;
  /** Contact tolerance above the ground counted as stance. */
  tolerance: number;
}): boolean[] =>
  props.resolved.map((map) => {
    const p = map.get(props.effector)?.worldPosition;
    return p !== undefined && p.y <= props.groundAt(p.x, p.z) + props.tolerance;
  });
