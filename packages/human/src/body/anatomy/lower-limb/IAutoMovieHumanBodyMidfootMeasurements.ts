import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodySmallBoneMeasurements } from "../measurements/IAutoMovieHumanBodySmallBoneMeasurements";

/**
 * Five tarsal bones distal to talus/calcaneus and proximal to metatarsals.
 *
 * Each named observation belongs to one bone. Longitudinal and transverse foot arches are generated relationships, not a vertex height authored here.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty group separately names navicular, cuboid and three cuneiform small-bone measurement owners.
 * @evidence contracts/common.md#clear-and-simple-design Each tarsal uses shared small-bone quantities while arch relationships stay generated rather than authored vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Longitudinal/transverse arch height is not a user-defined mesh coordinate.
 * @evidence contracts/common.md#meaningful-documentation Members specify all five tarsal identities and their source quantity ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Midfoot metadata performs no tarsal-placement or arch-generation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Five named tarsal records retain no cached foot-arch solution.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Midfoot inputs own no assembled arch mesh or active bone fitter.
 * @author Samchon
 */
export type IAutoMovieHumanBodyMidfootMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Medial bone articulating with talar head. */
    navicular?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Lateral bone articulating with calcaneus. */
    cuboid?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Medial cuneiform under first metatarsal. */
    medialCuneiform?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Intermediate cuneiform under second metatarsal. */
    intermediateCuneiform?: IAutoMovieHumanBodySmallBoneMeasurements;

    /** Lateral cuneiform under third metatarsal. */
    lateralCuneiform?: IAutoMovieHumanBodySmallBoneMeasurements;
  }>;
