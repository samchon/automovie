import type { AutoMovieHumanBodySide } from "../identity/AutoMovieHumanBodySide";

type PectoralisMajorOrigin<Side extends AutoMovieHumanBodySide> =
  | { structure: `${Side}Clavicle`; site: "medialAnteriorHalf" }
  | { structure: "sternum"; site: "anteriorSurface" }
  | { structure: `${Side}CostalCartilages`; site: "superiorTrueRibs" }
  | {
      structure: `${Side}ExternalObliqueAponeurosis`;
      site: "thoracicContinuation";
    };

/**
 * Cross-group chest-wall origins and humeral insertion of pectoralis major.
 *
 * This fan-shaped muscle spans the clavicle, sternum and anterior rib region beneath breast tissue, then converges on the lateral lip of the humeral intertubercular sulcus. Moatshe et al. 2018, doi:10.1016/j.arthro.2017.08.301, report the humeral tendon footprint. A singleton Side literal excludes the opposite humerus. Instantiating Side as the left-or-right union permits independent member alternatives, so a producer must select one literal side to obtain that guarantee.
 *
 * @evidence contracts/common.md#principled-implementation Origin sites on clavicle, sternum, costal cartilage and aponeurosis correlate with the same-side humeral insertion when Side is a singleton literal rather than a union.
 * @evidence contracts/common.md#clear-and-simple-design A private origin union expresses cross-group sites while one exported relation prevents duplication of the upper-limb humerus.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Named sites with one literal side exclude opposite-side insertion without claiming a resolved tendon footprint from chest skin; a union Side does not establish member correlation.
 * @evidence contracts/common.md#meaningful-documentation Members state anterior chest origins and lateral intertubercular insertion; the cited cadaveric study supports attachment measurement rather than individual generated geometry.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Pectoral attachment typing performs no tendon footprint fit or fan-shaped muscle construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Cross-group attachment metadata owns no completed bone-site registration to cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The readonly origin/insertion relation retains no attachment mesh or humeral solver handle.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyPectoralisMajorAttachments<
  Side extends AutoMovieHumanBodySide,
> {
  /** One or more named origins across the anterior chest wall. */
  readonly origins: readonly [
    PectoralisMajorOrigin<Side>,
    ...PectoralisMajorOrigin<Side>[],
  ];

  /** Lateral lip of the same side's intertubercular sulcus. */
  readonly insertions: readonly [
    {
      /** This side's humerus, shared with the upper-limb anatomy owner. */
      structure: `${Side}Humerus`;

      /** Named humeral tendon footprint; no registered surface coordinates are supplied. */
      site: "lateralLipIntertubercularSulcus";
    },
  ];
}
