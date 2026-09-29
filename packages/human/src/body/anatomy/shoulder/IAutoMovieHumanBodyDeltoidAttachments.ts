import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

type DeltoidOrigin<Side extends AutoMovieHumanBodySide> =
  | { structure: `${Side}Clavicle`; site: "lateralThird" }
  | { structure: `${Side}Scapula`; site: "acromion" }
  | { structure: `${Side}Scapula`; site: "lateralScapularSpine" };

/**
 * Same-side bony origins and humeral insertion of a generated deltoid.
 *
 * Its clavicular, acromial and scapular-spine regions attach across two bones
 * rather than forming an arbitrary skin bulge around one shoulder joint.
 * Moatshe et al. 2018, doi:10.1016/j.arthro.2017.08.301, dissected and
 * measured the proximal humeral and acromial muscle attachment surfaces.
 * Anatomical site names are outputs of a resolved bone, never document XYZ.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyDeltoidAttachments<
  Side extends AutoMovieHumanBodySide,
> {
  /** One or more origin regions on this side's clavicle and scapula. */
  readonly origins: readonly [DeltoidOrigin<Side>, ...DeltoidOrigin<Side>[]];
  /** The deltoid tuberosity on the same side's humerus. */
  readonly insertions: readonly [{
    structure: `${Side}Humerus`;
    site: "deltoidTuberosity";
  }];
}
