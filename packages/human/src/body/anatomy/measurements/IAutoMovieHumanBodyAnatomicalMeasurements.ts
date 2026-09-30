import type { IAutoMovieHumanBodyLowerLimbMeasurements } from "../lower-limb/IAutoMovieHumanBodyLowerLimbMeasurements";
import type { IAutoMovieHumanBodyPelvisMeasurements } from "../pelvis/IAutoMovieHumanBodyPelvisMeasurements";
import type { IAutoMovieHumanBodySurfaceMeasurements } from "../surface/IAutoMovieHumanBodySurfaceMeasurements";
import type { IAutoMovieHumanBodyTrunkMeasurements } from "../thorax/IAutoMovieHumanBodyTrunkMeasurements";
import type { IAutoMovieHumanBodyUpperLimbMeasurements } from "../upper-limb/IAutoMovieHumanBodyUpperLimbMeasurements";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "./AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAge } from "./IAutoMovieHumanBodyAge";
import type { IAutoMovieHumanBodyCompositionMeasurements } from "./IAutoMovieHumanBodyCompositionMeasurements";

/**
 * Sparse typed anatomical targets and observations for a body editor.
 *
 * The simple exterior tier still owns the currently generated body. This
 * separate record owns named exterior and internal dimensions and
 * compartment volumes, nested by the structures that generate them. A `target`
 * asks for a plausible fictional measurement; `observed` records an actual
 * acquisition and its posture. Omitted values are unknown rather than zero;
 * this partial record is not by itself a complete renderable person. The
 * complete detailed tier requires age, standing stature and body mass.
 * an estimator must identify its observed population and error or return an
 * unavailable part. This record
 * is not the current MPFB `shape` channel map and is not yet interpreted by
 * the legacy connected-skin builder. Extending modeled anatomy adds a named
 * component file and a field here, never a catch-all vertex array or a loose
 * `Record<string, number>` of shape weights.
 * The editable scope is body size, exterior anthropometry, bony frame,
 * musculoskeletal tissues and adipose compartments relevant to silhouette
 * and articulation. It is not a medical authoring interface for each organ,
 * vessel or nerve. Optional detailed bone/muscle readings do not become
 * required controls for building one ordinary torso.
 *
 * Anatomical ownership is nested but attachments cross it: gluteus maximus
 * belongs to one pelvic hip region and attaches to shared sacrum, that side's
 * coxal bone, lower-limb femur and iliotibial tract; pectoralis major belongs
 * to the chest wall and inserts on the upper-limb humerus. The generated body must have one connected
 * exterior skin after these internal parts are resolved and posed.
 * @author Samchon
 */
export type IAutoMovieHumanBodyAnatomicalMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Chronological age conditions inference but does not prescribe shape. */
    age?: IAutoMovieHumanBodyAge;
    /** Named exterior targets or measurements, including paired limbs. */
    surface?: IAutoMovieHumanBodySurfaceMeasurements;
    /** Whole-body tissue totals, never a substitute for regional boundaries. */
    composition?: IAutoMovieHumanBodyCompositionMeasurements;
    /** Spine, breast and abdominal compartments of the torso. */
    trunk?: IAutoMovieHumanBodyTrunkMeasurements;
    /** One sacrum, paired coxal bones and pelvic gluteal regions. */
    pelvis?: IAutoMovieHumanBodyPelvisMeasurements;
    /** Left shoulder girdle, arm and forearm with independent bones. */
    leftUpperLimb?: IAutoMovieHumanBodyUpperLimbMeasurements;
    /** Right shoulder girdle, arm and forearm with independent bones. */
    rightUpperLimb?: IAutoMovieHumanBodyUpperLimbMeasurements;
    /** Left femur, knee, tibia/fibula and hindfoot. */
    leftLowerLimb?: IAutoMovieHumanBodyLowerLimbMeasurements;
    /** Right femur, knee, tibia/fibula and hindfoot. */
    rightLowerLimb?: IAutoMovieHumanBodyLowerLimbMeasurements;
  }>;
