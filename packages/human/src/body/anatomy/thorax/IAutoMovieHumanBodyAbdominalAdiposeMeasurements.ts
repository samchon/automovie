import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";

/**
 * Target or observed abdominal fat volumes, separate from waist girth.
 *
 * Subcutaneous adipose lies outside the abdominal muscular fascia; visceral
 * adipose lies within the abdominal cavity. Each field denotes a 3D volume
 * over a documented abdominal region, not the area of one L3 CT slice.
 * Admission must require compatible superior/inferior segmentation boundaries
 * before comparing or combining the two values. Neither alone gives
 * the shape of a belly fold or a contact-compression modulus.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAbdominalAdiposeMeasurements = {
  /** Common axial extent of both optional depots, fixed by bony landmarks. */
  readonly region: {
    readonly superior: "xiphoidProcess" | "lowerCostalMargin";
    readonly inferior: "iliacCrest" | "pelvicInlet";
  };
} & AutoMovieHumanBodyNonemptyMeasurements<{
  subcutaneousVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  visceralVolume?: IAutoMovieHumanBodyAnatomicalVolume;
}>;
