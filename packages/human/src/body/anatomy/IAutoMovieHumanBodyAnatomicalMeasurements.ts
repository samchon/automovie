import type { IAutoMovieHumanBodyPelvisMeasurements } from "./pelvis/IAutoMovieHumanBodyPelvisMeasurements";
import type { IAutoMovieHumanBodyShoulderMeasurements } from "./shoulder/IAutoMovieHumanBodyShoulderMeasurements";
import type { IAutoMovieHumanBodyTrunkMeasurements } from "./thorax/IAutoMovieHumanBodyTrunkMeasurements";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "./measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAge } from "./measurements/IAutoMovieHumanBodyAge";
import type { IAutoMovieHumanBodySurfaceMeasurements } from "./surface/IAutoMovieHumanBodySurfaceMeasurements";

/**
 * Typed anatomical targets and observations for a body editor.
 *
 * The simple exterior tier still owns the currently generated body. This
 * separate record owns named exterior and internal dimensions and
 * compartment volumes, nested by the structures that generate them. A `target`
 * asks for a plausible fictional measurement; `observed` records an actual
 * acquisition and its posture. Omitted values are unknown rather than zero;
 * an estimator must identify its observed population and error or return an
 * unavailable part. This record
 * is not the current MPFB `shape` channel map and is not yet interpreted by
 * the legacy connected-skin builder. Extending modeled anatomy adds a named
 * component file and a field here, never a catch-all vertex array or a loose
 * `Record<string, number>` of shape weights.
 *
 * Anatomical ownership is nested but attachments cross it: gluteus maximus
 * belongs to one hip and attaches to shared sacrum, that side's coxal bone,
 * femur and iliotibial tract; pectoralis major belongs to one shoulder and
 * spans the chest wall and humerus. The generated body must have one connected
 * exterior skin after these internal parts are resolved and posed.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Chronological age conditions inference but does not prescribe shape. */
    age?: IAutoMovieHumanBodyAge;
    /** Named exterior targets or measurements, including paired limbs. */
    surface?: IAutoMovieHumanBodySurfaceMeasurements;
    /** Spine, breast and abdominal compartments of the torso. */
    trunk?: IAutoMovieHumanBodyTrunkMeasurements;
    /** One sacrum, paired coxal bones, hips, femora and three gluteal muscles. */
    pelvis?: IAutoMovieHumanBodyPelvisMeasurements;
    /** Independent left shoulder complex and upper-arm bone. */
    leftShoulder?: IAutoMovieHumanBodyShoulderMeasurements;
    /** Independent right shoulder complex and upper-arm bone. */
    rightShoulder?: IAutoMovieHumanBodyShoulderMeasurements;
  }>;
