import type { AutoMovieHumanBodySide } from "../AutoMovieHumanBodySide";

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
 * This fan-shaped muscle spans the clavicle, sternum and anterior rib region
 * beneath breast tissue, then converges on the lateral lip of the humeral
 * intertubercular sulcus. Moatshe et al. 2018,
 * doi:10.1016/j.arthro.2017.08.301, report the humeral tendon footprint.
 * The opposite humerus is excluded by the shared `Side` parameter.
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
  readonly insertions: readonly [{
    structure: `${Side}Humerus`;
    site: "lateralLipIntertubercularSulcus";
  }];
}
