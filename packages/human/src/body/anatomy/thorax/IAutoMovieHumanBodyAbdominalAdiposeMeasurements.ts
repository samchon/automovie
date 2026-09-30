import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * Target or observed abdominal fat volumes, separate from waist girth.
 *
 * Subcutaneous adipose lies outside the abdominal muscular fascia; visceral
 * adipose lies within the abdominal cavity. Each field denotes a 3D volume
 * over a documented abdominal region, not the area of one L3 CT slice.
 * The shared `region` supplies matching superior/inferior bony boundaries;
 * a later tissue resolver must also check observed posture and segmentation
 * method before combining two observations. Neither alone gives
 * the shape of a belly fold or a contact-compression modulus.
 *
 * @evidence contracts/common.md#principled-implementation The required `region` fixes the shared bony extent of both depots so their volumes are comparable, and the mapped union requires at least one depot volume, so `region` alone cannot claim a specification; each volume carries its own provenance kind.
 * @evidence contracts/common.md#clear-and-simple-design One record of named optional quantities and no behaviour.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is data only: it has no special case, foreign mutation or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment states which structure the type names, what its quantities do not determine and which neighbouring declarations own the adjacent structures, and each member is described.
 * @evidence contracts/modeling.md#part-identity-and-grouping One declaration stands for one named tissue; the adjacent structures it meets are separate declarations.
 * @evidenceExclude contracts/modeling.md#parameter-channels The members are absolute target or observed quantities, not offsets from a neutral that vary a form, and no product path varies a form from them.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The type states no unit or frame of its own; each value's unit is owned by the measurement type it references.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint that a viewer displays, because no product path reads it.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing itself; scalar admission is `admitHumanBodyAnatomicalMeasurements` and population ranges belong to a component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every member is a named anatomical measurement or a closed named site, and no member addresses a vertex, curve, strand or patch, so a caller cannot sculpt through it.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAbdominalAdiposeMeasurements = {
  /** Common axial extent of both optional depots, fixed by bony landmarks. */
  readonly region: {
    /** Bony landmark bounding the region above. */
    readonly superior: "xiphoidProcess" | "lowerCostalMargin";
    /** Bony landmark bounding the region below. */
    readonly inferior: "iliacCrest" | "pelvicInlet";
  };
} & AutoMovieHumanBodyNonemptyMeasurements<{
  subcutaneousVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  visceralVolume?: IAutoMovieHumanBodyAnatomicalVolume;
}>;
