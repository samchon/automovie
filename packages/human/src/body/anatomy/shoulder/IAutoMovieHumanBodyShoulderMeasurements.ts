import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyClavicleMeasurements } from "./IAutoMovieHumanBodyClavicleMeasurements";
import type { IAutoMovieHumanBodyDeltoidMeasurements } from "./IAutoMovieHumanBodyDeltoidMeasurements";
import type { IAutoMovieHumanBodyRotatorCuffMeasurements } from "./IAutoMovieHumanBodyRotatorCuffMeasurements";
import type { IAutoMovieHumanBodyScapulaMeasurements } from "./IAutoMovieHumanBodyScapulaMeasurements";

/**
 * One side's shoulder-complex measurements, with independently owned parts.
 *
 * Clavicle and scapula have different thoracic articulations; the upper arm's humerus turns at the glenoid. Deltoid originates here and inserts on that humerus. Pectoralis major belongs to the chest wall and also crosses to the humerus. A single `leftShoulder` rig transform or skin morph cannot be substituted for these components. The authored data are optional direct dimensions/volumes, while geometry, attachments and motion are generated and validated separately.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty same-side shoulder tree keeps clavicle, scapula, deltoid and cuff measurements distinct from the upper-limb humerus and chest-owned pectoralis.
 * @evidence contracts/common.md#clear-and-simple-design Component measurement owners supply their schemas; this record exposes only shoulder-complex composition.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts One rig transform or skin morph cannot satisfy the independent bone, muscle and attachment requirements.
 * @evidence contracts/common.md#meaningful-documentation The prose explains cross-region articulations, optional measured components and separately generated geometry/attachments/motion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Shoulder composition typing performs no humeral rotation or scapular reconstruction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The shoulder tree establishes no shared result for differing anatomical component measurements.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources These optional component records acquire no generated shoulder tissue or articulation process.
 * @author Samchon
 */
export type IAutoMovieHumanBodyShoulderMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** This side's clavicle. */
    clavicle?: IAutoMovieHumanBodyClavicleMeasurements;

    /** This side's scapula. */
    scapula?: IAutoMovieHumanBodyScapulaMeasurements;

    /** This side's deltoid belly. */
    deltoid?: IAutoMovieHumanBodyDeltoidMeasurements;

    /** Four scapular rotator-cuff bellies with humeral insertions. */
    rotatorCuff?: IAutoMovieHumanBodyRotatorCuffMeasurements;
  }>;
