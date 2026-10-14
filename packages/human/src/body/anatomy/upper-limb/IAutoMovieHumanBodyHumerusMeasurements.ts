import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalAngle } from "../measurements/IAutoMovieHumanBodyAnatomicalAngle";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyTomographicLength } from "../measurements/IAutoMovieHumanBodyTomographicLength";

/**
 * Target or observed osseous dimensions of one humerus.
 *
 * The humeral head is an articular ball, while the tubercles and shaft carry distinct muscle origins and insertions. A glenohumeral rig centre and elbow point do not determine the individual's shaft line or neck-shaft angle; the current CT-backed head component consequently represents only its head. The fields below can later constrain a separately generated full bone, never ask the user to sculpt its vertices.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty head radius, maximum osseous length and neck-shaft angle remain distinct tomographic/length/angle quantities for one humerus.
 * @evidence contracts/common.md#clear-and-simple-design Shared acquisition carriers own units and protocols while this bone record separates articular head and full-bone conditions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Shoulder/elbow rig centers cannot reconstruct an individual's shaft or neck axis; an articular sphere cannot stand in for the full humerus.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish sphere-fitted radius, bony length and neck-shaft orientation without vertex-level controls.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Humeral quantity typing performs no CT sphere fit or full-bone construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work These separate humeral conditions store no completed shaft/frame solution across poses.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Humerus metadata acquires no articular tessellation, shaft mesh or imaging process.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHumerusMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Radius of a sphere fitted to the articular head on CT or MRI. */
    sphereFittedHeadRadius?: IAutoMovieHumanBodyTomographicLength;

    /** Greatest osseous length of the humerus, not a skin distance. */
    maximumLength?: IAutoMovieHumanBodyAnatomicalLength;

    /** Angle between the humeral neck axis and the shaft axis. */
    neckShaftAngle?: IAutoMovieHumanBodyAnatomicalAngle;
  }>;
