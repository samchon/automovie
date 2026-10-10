import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

/**
 * One binding between a named surface target of the numerical body request
 * and the source instrument and shape channel that answer it.
 *
 * The rule is read from `HUMAN_BODY_MEASUREMENTS` by its key, oriented to
 * `side` when one is given, so the instrument has one owner and no mirrored
 * copy. The channel is the private source response the exterior generator
 * inverts for this target; it is not an editable sculpt control. The
 * protocol sentence states how the source-rest instrument departs from the
 * cited survey definition, because a source convention is not a registered
 * standing acquisition.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanBodyExteriorTarget {
  /**
   * Detailed request path below `targets`, such as
   * `surface.leftLowerLimb.foot.length`.
   */
  readonly path: string;

  /** Key of the instrument in `HUMAN_BODY_MEASUREMENTS`. */
  readonly rule: string;

  /** Side the rule is oriented to; omitted for a midline or bilateral rule. */
  readonly side?: AutoMovieHumanBodySide;

  /** Source shape channel the generator inverts for this target. */
  readonly channel: string;

  /** How the source-rest instrument departs from the cited survey definition. */
  readonly protocol: string;
}
