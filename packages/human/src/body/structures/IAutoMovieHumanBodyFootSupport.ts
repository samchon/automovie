import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieHumanBodySide } from "../anatomy/identity/AutoMovieHumanBodySide";

/**
 * One foot's geometric support against the ground plane: its lowest posed
 * skin point and that point's height above the plane.
 *
 * A positive gap is a foot clear of the ground, a negative one a foot through
 * it. This is a final-surface reading, not a pressure or contact simulation.
 *
 * @evidence contracts/common.md#principled-implementation The reading names the measured point so a consumer can check it on the same skin.
 * @evidence contracts/common.md#clear-and-simple-design Side, lowest point and signed gap.
 * @evidenceExclude contracts/common.md#prohibited-implementation-shortcuts A carrier; it substitutes nothing.
 * @evidence contracts/common.md#meaningful-documentation States the sign and that no contact mechanics is modelled.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The side names the foot region read.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits a reading, not geometry.
 * @evidence contracts/modeling.md#spatial-conventions Metres in the basis frame; the plane is horizontal (+Y up).
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation Consumers display it.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is a reading, not an authoring input.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyFootSupport {
  /** The foot read. */
  side: AutoMovieHumanBodySide;

  /** The foot region's lowest posed skin point, metres. */
  lowest: IAutoMovieVector3;

  /** Height of that point above the ground plane, metres; negative is through it. */
  gapMetres: number;
}
