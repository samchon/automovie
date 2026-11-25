import type { IAutoMovieCompiledFormation } from "./IAutoMovieCompiledFormation";
import type { IAutoMovieFormationMemberExtent } from "./IAutoMovieFormationMemberExtent";
import type { IAutoMovieFormationMotion } from "./IAutoMovieFormationMotion";

/** Inputs for framing a compact formation at one shot-local instant. */
export namespace IAutoMovieFormationSubjectBox {
  /**
   * Borrowed compact formation, cues and member extent used to derive a
   * world-space framing box in metres.
   *
   * The unit's designed bounds go through {@link transformFormationBounds} under
   * the cue {@link sampleFormationMotion} reports at that instant, so a mass
   * that has marched, wheeled, or closed its ranks is framed where it is. Both
   * reads are the builder's own: the ground gate that refuses a member standing
   * off its staged surface asks the same two functions the same way, so a gate
   * and a camera cannot disagree about where a unit is. A time before 0 reads
   * the unit as it stands at 0.
   *
   * The transformed slot box is then widened on X and Z by the member radius
   * the compiler derived for LOD projection, ignored when negative, and its Y
   * range raised by the member's own extent, because the box of slot positions
   * is a footprint: the outermost member's body hangs over its edge and its
   * head stands above it. The result encloses member geometry only when the
   * supplied radius and rest extent bound that geometry. Missing-geometry
   * estimates and rest-pose measurements do not prove enclosure of every
   * deformation. Inputs are read without mutation or retention.
   */
  export type IProps = {
    /**
     * Unit whose world-space placement bounds, anchor, heading and
     * projection-radius estimate are sampled. Its slot bounds include promoted
     * heroes as well as anonymous members.
     */
    formation: IAutoMovieCompiledFormation;

    /** Every compact cue in the shot; those of other units are ignored. */
    motions: readonly IAutoMovieFormationMotion[];

    /**
     * One member's rest-space vertical offsets in metres, as returned by
     * formationMemberExtent; no additional pose or scale measurement is made
     * here.
     */
    member: IAutoMovieFormationMemberExtent.IResult;

    /**
     * Finite shot-local seconds at which cues are sampled. Negative values are
     * sampled at zero; this function does not clamp to shot duration.
     */
    seconds: number;
  };
}
