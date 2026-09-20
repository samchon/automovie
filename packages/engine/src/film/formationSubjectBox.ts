import { IAutoMovieCompiledFormation, IAutoMovieFormationMotion } from "@automovie/interface";
import { sampleFormationMotion } from "../sampleFormationMotion";
import { transformFormationBounds } from "../transformFormationBounds";
import { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";

/**
 * The box one formation's members occupy at a shot-local instant.
 *
 * The unit's designed bounds go through {@link transformFormationBounds} under
 * the cue {@link sampleFormationMotion} reports at that instant, so a mass that
 * has marched, wheeled, or closed its ranks is framed where it actually is.
 * Both reads are the builder's own: the ground gate that refuses a member
 * standing off its staged surface asks the same two functions the same way, and
 * a second implementation here is how a gate and a camera come to disagree
 * about where a unit is.
 *
 * The transformed slot box is then widened by the member radius the builder
 * already derived for LOD projection and raised by the member's own extent,
 * because the box of slot POSITIONS is a footprint: the outermost member's body
 * hangs over its edge and its head stands above it.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-bounds-state-motion formationSubjectBox unions every member's sampled world extent at the addressed shot time into one live formation bound.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-dynamic-bounds-invariants formationSubjectBox realizes dynamic-bounds invariants: The box one formation's members occupy at a shot-local instant. The unit's designed bounds go through {@link transformFormationBounds} under the cue {@link sampleFormationMotion} reports at that instant, so a mass that has marched, wheeled, or closed its ranks is framed where it actually is. Both reads are the builder's own: the ground gate that refuses a member standing off its staged surface asks the same two functions the same way, and a second implementation here is how a gate and a camera come to disagree about where a unit is. The transformed slot box is then widened by the member radius the builder already derived for LOD projection and raised by the member's own extent, because the box of slot POSITIONS is a footprint: the outermost member's body hangs over its edge and its head stands above it.
 */
export const formationSubjectBox = (props: {
  /** The unit being framed. */
  formation: IAutoMovieCompiledFormation;
  /** Every compact cue in the shot; those of other units are ignored. */
  motions: readonly IAutoMovieFormationMotion[];
  /** One member's model-space vertical extent ({@link formationMemberExtent}). */
  member: { min: number; max: number };
  /** Shot-local seconds at which the cue is sampled. */
  seconds: number;
}): IAutoMovieSubjectBox => {
  const moved = transformFormationBounds(
    props.formation.bounds,
    props.formation.anchor,
    sampleFormationMotion(
      props.motions,
      props.formation.id,
      Math.max(0, props.seconds),
    ),
    props.formation.facingDeg,
  );
  const pad = Math.max(0, props.formation.projectionRadius);
  return {
    min: {
      x: moved.min.x - pad,
      y: moved.min.y + props.member.min,
      z: moved.min.z - pad,
    },
    max: {
      x: moved.max.x + pad,
      y: moved.max.y + props.member.max,
      z: moved.max.z + pad,
    },
  };
};
