import type { AutoMovieHumanBodySide } from "./AutoMovieHumanBodySide";

/**
 * Closed names of the separately measured skeletal muscle bellies.
 *
 * Every name has a part-specific measurement file and one side; compound
 * groups such as quadriceps and triceps surae are not duplicate muscle solids.
 * Additional clinically observed muscles must add their own part contract.
 * @author Samchon
 */
export type AutoMovieHumanBodyMuscleId =
  `${AutoMovieHumanBodySide}${
    | "GluteusMaximus"
    | "GluteusMedius"
    | "GluteusMinimus"
    | "PectoralisMajor"
    | "RectusAbdominis"
    | "ExternalOblique"
    | "InternalOblique"
    | "LatissimusDorsi"
    | "Trapezius"
    | "Deltoid"
    | "Supraspinatus"
    | "Infraspinatus"
    | "TeresMinor"
    | "Subscapularis"
    | "BicepsBrachii"
    | "Brachialis"
    | "TricepsBrachii"
    | "Brachioradialis"
    | "FlexorDigitorumSuperficialis"
    | "ExtensorDigitorum"
    | "RectusFemoris"
    | "VastusLateralis"
    | "VastusMedialis"
    | "VastusIntermedius"
    | "BicepsFemorisLongHead"
    | "BicepsFemorisShortHead"
    | "Semitendinosus"
    | "Semimembranosus"
    | "AdductorMagnus"
    | "GastrocnemiusMedialHead"
    | "GastrocnemiusLateralHead"
    | "Soleus"
    | "TibialisAnterior"
    | "TibialisPosterior"}`;
