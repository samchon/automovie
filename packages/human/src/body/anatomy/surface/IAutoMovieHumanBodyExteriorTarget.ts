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
 * @evidence contracts/common.md#principled-implementation The request path, instrument key, side and channel stay separate so the instrument keeps one owner and the generator owns the solve.
 * @evidence contracts/common.md#clear-and-simple-design One record per answerable request path; the table order is the solve order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A binding names an existing rule and channel and never carries a reading or a default value.
 * @evidence contracts/common.md#meaningful-documentation States what each field selects and that the protocol is a convention.
 * @evidence contracts/modeling.md#parameter-channels The channel is a source response solved privately against a named measurement.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A binding defines no part.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The rule owns its frame and units.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The exterior generator's consumer owns observation.
 * @evidence contracts/anatomy.md#parametric-authority Each binding answers a named anatomical measurement path, never a vertex or morph edit.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule owns the measurement definition and its source.
 * @evidenceExclude contracts/anatomy.md#permitted-range The channel's reach and the inverse own admission.
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
