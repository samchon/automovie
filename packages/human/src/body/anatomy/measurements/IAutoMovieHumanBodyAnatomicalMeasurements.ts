import type { IAutoMovieHumanBodyLowerLimbMeasurements } from "../lower-limb/IAutoMovieHumanBodyLowerLimbMeasurements";
import type { IAutoMovieHumanBodyPelvisMeasurements } from "../pelvis/IAutoMovieHumanBodyPelvisMeasurements";
import type { IAutoMovieHumanBodySurfaceMeasurements } from "../surface/IAutoMovieHumanBodySurfaceMeasurements";
import type { IAutoMovieHumanBodyTrunkMeasurements } from "../thorax/IAutoMovieHumanBodyTrunkMeasurements";
import type { IAutoMovieHumanBodyUpperLimbMeasurements } from "../upper-limb/IAutoMovieHumanBodyUpperLimbMeasurements";
import type { AutoMovieHumanBodyNonemptyMeasurements } from "./AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAge } from "./IAutoMovieHumanBodyAge";
import type { IAutoMovieHumanBodyCompositionMeasurements } from "./IAutoMovieHumanBodyCompositionMeasurements";

/**
 * Sparse typed exterior and internal targets or observations, nested by anatomical ownership.
 *
 * A target requests a fictional physical quantity; an observation retains its acquisition context. Omission means unknown. This vocabulary alone does not establish complete, renderable or clinically validated anatomy. Body-document admission accepts only paths with registered executable source, exterior or articular consumers and rejects unsupported requests; a type-level field does not promise a generator for it. Age is optional context, not an invented morph weight or a mandatory complete-body tier.
 *
 * The editable scope covers body size, exterior anthropometry, musculoskeletal tissues and adipose compartments relevant to silhouette and articulation. Organ, vessel and nerve authoring is outside this interface. Anatomical ownership stays unique even when attachments cross regions: gluteus maximus belongs to the hip region while attaching across sacrum, coxal bone, femur and iliotibial tract; pectoralis major belongs to the chest while inserting on humerus. Detailed readings do not become mandatory controls for an ordinary torso.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty sparse ownership tree separates targets from observations; executable document admission still determines supported consumer paths.
 * @evidence contracts/common.md#clear-and-simple-design Named surface, composition and bilateral regions keep anatomical ownership local while allowing cross-region attachments.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omission remains unknown and optional age does not imply a complete renderable or clinically validated body.
 * @evidence contracts/common.md#meaningful-documentation Prose explains vocabulary versus executable support, product scope, sparse fields and cross-region attachment ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The anatomical measurement type performs no consumer dispatch, geometry reconstruction or whole-body traversal.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This schema shares component definitions but contains no completed solver work for cross-call reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The ownership vocabulary itself retains no rendered body, acquisition buffers or running generation tasks.
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
