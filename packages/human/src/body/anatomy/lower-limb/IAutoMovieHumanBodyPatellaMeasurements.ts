import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyAnatomicalLength } from "../measurements/IAutoMovieHumanBodyAnatomicalLength";
import type { IAutoMovieHumanBodyAnatomicalVolume } from "../measurements/IAutoMovieHumanBodyAnatomicalVolume";

/**
 * One patella embedded in the quadriceps–patellar tendon mechanism.
 *
 * Its posterior articular face slides across the distal femur; a knee joint centre alone cannot place or shape that face through flexion.
 *
 * @evidence contracts/common.md#principled-implementation Nonempty bony breadth/isolated volume observations describe the patella independently of distal femur and cartilage.
 * @evidence contracts/common.md#clear-and-simple-design Patellar quantity ownership remains separate from the knee's moving-articulation relation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A joint centre alone cannot certify placement or shape of the sliding articular face.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish bony medial-lateral breadth, bone compartment and tracking limitations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Patellar input typing executes no sesamoid surface or tracking algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Patella quantities store no cached knee-flexion or cartilage-contact result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The patellar record acquires no segmented sesamoid bytes or joint workspace.
 * @author Samchon
 */
export type IAutoMovieHumanBodyPatellaMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Maximum bony medial-to-lateral patellar breadth. */
    breadth?: IAutoMovieHumanBodyAnatomicalLength;

    /** Segmented patella alone, separate from distal femur and cartilage. */
    boneVolume?: IAutoMovieHumanBodyAnatomicalVolume;
  }>;
