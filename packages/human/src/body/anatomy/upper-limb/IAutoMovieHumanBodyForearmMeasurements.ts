import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyBrachioradialisMeasurements } from "./IAutoMovieHumanBodyBrachioradialisMeasurements";
import type { IAutoMovieHumanBodyExtensorDigitorumMeasurements } from "./IAutoMovieHumanBodyExtensorDigitorumMeasurements";
import type { IAutoMovieHumanBodyFlexorDigitorumSuperficialisMeasurements } from "./IAutoMovieHumanBodyFlexorDigitorumSuperficialisMeasurements";
import type { IAutoMovieHumanBodyRadiusMeasurements } from "./IAutoMovieHumanBodyRadiusMeasurements";
import type { IAutoMovieHumanBodyUlnaMeasurements } from "./IAutoMovieHumanBodyUlnaMeasurements";

/**
 * Two distinct forearm bones and separately named muscle bellies.
 *
 * Radius and ulna must remain separate under pronation/supination. Their
 * combined skin girth cannot determine either bone's length, volume, muscle
 * composition or the orientation of its proximal/distal articulations.
 *
 * @evidence contracts/common.md#principled-implementation The type is a closed mapped union that requires at least one of its optional named members and keeps the rest optional, so every subset of named parts is representable and `{}` cannot claim that a part was specified; each member is typed by its own declaration.
 * @evidence contracts/common.md#clear-and-simple-design One mapped union over the member fields; it owns composition only and no logic.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is data only: it has no special case, foreign mutation or compensating path.
 * @evidence contracts/common.md#meaningful-documentation The comment states which structure the type names, what its quantities do not determine and which neighbouring declarations own the adjacent structures, and each member is described.
 * @evidence contracts/modeling.md#part-identity-and-grouping The type is a group: it composes named member parts declared by their own types, owns no member's values, and neighbouring structures meet only through those named members.
 * @evidenceExclude contracts/modeling.md#parameter-channels The members are absolute target or observed quantities, not offsets from a neutral that vary a form, and no product path varies a form from them.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The type emits no primitive.
 * @evidenceExclude contracts/modeling.md#spatial-conventions The type states no unit or frame of its own; each value's unit is owned by the measurement type it references.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The type builds no surface or volume.
 * @evidenceExclude contracts/modeling.md#rendered-observation The type owns no part, group or joint that a viewer displays, because no product path reads it.
 * @evidenceExclude contracts/anatomy.md#permitted-range The type admits nothing itself; scalar admission is `admitHumanBodyAnatomicalMeasurements` and population ranges belong to a component resolver.
 * @evidence contracts/anatomy.md#parametric-authority Every member is a named anatomical measurement or a closed named site, and no member addresses a vertex, curve, strand or patch, so a caller cannot sculpt through it.
 * @author Samchon
 */
export type IAutoMovieHumanBodyForearmMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Lateral radius on this anatomical side. */
    radius?: IAutoMovieHumanBodyRadiusMeasurements;
    /** Medial ulna carrying the olecranon. */
    ulna?: IAutoMovieHumanBodyUlnaMeasurements;
    /** Lateral elbow-to-radius muscle belly. */
    brachioradialis?: IAutoMovieHumanBodyBrachioradialisMeasurements;
    /** Superficial anterior digital flexor belly. */
    flexorDigitorumSuperficialis?: IAutoMovieHumanBodyFlexorDigitorumSuperficialisMeasurements;
    /** Posterior finger extensor belly. */
    extensorDigitorum?: IAutoMovieHumanBodyExtensorDigitorumMeasurements;
  }>;
