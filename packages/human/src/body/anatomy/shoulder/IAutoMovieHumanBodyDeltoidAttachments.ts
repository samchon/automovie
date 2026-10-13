import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

type DeltoidOrigin<Side extends AutoMovieHumanBodySide> =
  | { structure: `${Side}Clavicle`; site: "lateralThird" }
  | { structure: `${Side}Scapula`; site: "acromion" }
  | { structure: `${Side}Scapula`; site: "lateralScapularSpine" };

/**
 * Same-side bony origins and humeral insertion of a generated deltoid.
 *
 * Its clavicular, acromial and scapular-spine regions attach across two bones rather than forming an arbitrary skin bulge around one shoulder joint. Moatshe et al. 2018, doi:10.1016/j.arthro.2017.08.301, dissected and measured the proximal humeral and acromial muscle attachment surfaces. Anatomical site names are outputs of a resolved bone, never document XYZ.
 *
 * A singleton Side literal binds all named structures to that side. Instantiating Side as the left-or-right union instead permits independent alternatives and does not correlate every member; a producer must select one literal side before treating this relation as same-side anatomy.
 *
 * @evidence contracts/common.md#principled-implementation Structure literals bind origins and insertion to one side when Side is a singleton literal; the union instantiation is not an unconditional correlation guarantee.
 * @evidence contracts/common.md#clear-and-simple-design A private origin union owns the three allowed bony sites; the exported record shares the selected singleton side with its insertion, without resolving landmark geometry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named bone sites express attachment identity without treating document XYZ or a skin bulge as resolved deltoid geometry.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish multiple origin regions from the single humeral insertion and identify generated landmark ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Attachment-site typing computes no deltoid footprint, tendon path or muscle mesh.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The same-side attachment record describes relationships without caching resolved bony sites.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Readonly origin/insertion metadata acquires no landmark solver, mesh buffer or observer handle.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyDeltoidAttachments<
  Side extends AutoMovieHumanBodySide,
> {
  /** One or more origin regions on this side's clavicle and scapula. */
  readonly origins: readonly [DeltoidOrigin<Side>, ...DeltoidOrigin<Side>[]];

  /** The deltoid tuberosity on the same side's humerus. */
  readonly insertions: readonly [
    {
      structure: `${Side}Humerus`;
      site: "deltoidTuberosity";
    },
  ];
}
