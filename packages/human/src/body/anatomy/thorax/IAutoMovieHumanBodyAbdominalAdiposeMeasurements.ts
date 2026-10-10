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
