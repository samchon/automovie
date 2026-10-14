import type { AutoMovieHumanBodySide } from "./AutoMovieHumanBodySide";

/**
 * Closed names of the separately measured skeletal muscle bellies.
 *
 * Every name has a part-specific measurement file and one side; compound groups such as quadriceps and triceps surae are not duplicate muscle solids. Additional clinically observed muscles must add their own part contract.
 *
 * @evidence contracts/common.md#principled-implementation Closed side-qualified muscle-belly names identify separately measured owners while compound groups remain outside duplicate solid ownership.
 * @evidence contracts/common.md#clear-and-simple-design Each supported muscle has its own measurement contract and shares only the bilateral naming convention.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Quadriceps/triceps-surae group labels cannot duplicate their constituent muscles as extra solids.
 * @evidence contracts/common.md#meaningful-documentation The comment states side-specific belly ownership and part-contract requirements for added muscles.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Muscle identity alternatives run no volume inference or muscle-generation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Bilateral name composition stores no equivalent muscle measurement or solve.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The muscle catalogue allocates no source belly meshes or simulation tasks.
 * @author Samchon
 */
export type AutoMovieHumanBodyMuscleId = `${AutoMovieHumanBodySide}${
  | "GluteusMaximus"
  | "GluteusMedius"
  | "GluteusMinimus"
  | "PsoasMajor"
  | "Iliacus"
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
