import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";

/**
 * Getting up from the floor to standing: from lying on the back or the front,
 * from the hands and knees or crouched, as a crawl ends.
 *
 * Rising from the floor is described by the movement of three body regions
 * (VanSant 1988, Phys Ther 68:185, "Rising from a supine position to erect
 * stance"): the arms, the head and trunk (the axial region) and the legs. The
 * one combination VanSant found most often among adults, though in only a
 * quarter of them, is symmetrical throughout: the trunk flexes forward out of
 * supine with both hands pushing, the body comes through sitting to a squat and
 * stands. That is the `symmetric` pattern, the default from the back. The other
 * end of VanSant's axial scale is a full rotation: the body rolls over to face
 * the floor, comes up onto the hands and knees, through a half kneel to
 * standing; that is the `rotation` pattern, the only way up from the front and
 * from the hands and knees, whose first postures it has already passed.
 *
 * The rise is a support sequence (`support`): each posture of the route is a
 * stance resting on what that posture bears on (`BEARS`), its key solved by the
 * whole-body fit nearest the route's posture (`POSES`, provisional angles, with
 * `lieDown`'s own floor postures where they are the same) with those parts on
 * the floor and the centre of mass over them, a new support placed before an
 * old one lets go, the body carried between keys about a support both hold and
 * resting on the floor by its colliders at every instant. The first stance
 * leaves from the posture the entry displays, so the rise continues from where
 * the body lies.
 *
 * Young adults rise from supine to standing in 2.6 s on average at their own
 * pace (Ulbrich et al. 2000, J Am Geriatr Soc 48:1626); the route's phases
 * share that time equally (provisional split), scaled by the manner's tempo.
 * Events: one per posture reached, then `standing`.
 *
 * Not yet: a partial rotation (one hand pushing from the side) and the half
 * kneel out of the symmetric squat, VanSant's other adult variants.
 */
export namespace IAutoMovieMotionHumanGetUp {
  /**
   * One supported key posture along a floor-to-standing route. sit and squat
   * form the symmetric route; prone, quadruped and halfKneel form the rotation
   * route; stood is the terminal upright posture.
   */
  export type Stage =
    | "sit"
    | "squat"
    | "prone"
    | "quadruped"
    | "halfKneel"
    | "stood";

  /** Parameters. */
  export interface IParams {
    /**
     * The pattern; `symmetric` from the back when absent, and always `rotation`
     * from the front or the hands and knees.
     */
    pattern?: IAutoMovieMotionHumanGetUp.Pattern;

    /**
     * The foot set forward in the half kneel of the rotation; `right` when
     * absent.
     */
    lead?: "left" | "right";

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** How the body gets up (VanSant 1988's axial region). */
  export type Pattern = (readonly ["symmetric", "rotation"])[number];
}
