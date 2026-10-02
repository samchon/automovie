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
 * This fan-shaped muscle spans the clavicle, sternum and anterior rib region
 * beneath breast tissue, then converges on the lateral lip of the humeral
 * intertubercular sulcus. Moatshe et al. 2018,
 * doi:10.1016/j.arthro.2017.08.301, report the humeral tendon footprint.
 * The opposite humerus is excluded by the shared `Side` parameter.
 *
 * @evidence contracts/common.md#principled-implementation The type is a pair of closed literal unions over named structures and sites, parameterized by the side, so the opposite-side bone or a free coordinate cannot type-check.
 * @evidence contracts/common.md#clear-and-simple-design Two readonly members, origins and insertions, and nothing else.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is data only: it has no special case, foreign mutation or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment states which structure the type names, what its quantities do not determine and which neighbouring declarations own the adjacent structures, and each member is described.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The type defines a relation between parts declared elsewhere and is neither a part nor a group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The members are absolute target or observed quantities, not offsets from a neutral that vary a form, and no product path varies a form from them.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The type states no unit or frame of its own; each value's unit is owned by the measurement type it references.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint that a viewer displays, because no product path reads it.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing itself; scalar admission is `admitHumanBodyAnatomicalMeasurements` and population ranges belong to a component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every member is a named anatomical measurement or a closed named site, and no member addresses a vertex, curve, strand or patch, so a caller cannot sculpt through it.
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
      structure: `${Side}Humerus`;
      site: "lateralLipIntertubercularSulcus";
    },
  ];
}
