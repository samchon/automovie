import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyBicepsFemorisLongHeadMeasurements } from "./IAutoMovieHumanBodyBicepsFemorisLongHeadMeasurements";
import type { IAutoMovieHumanBodyBicepsFemorisShortHeadMeasurements } from "./IAutoMovieHumanBodyBicepsFemorisShortHeadMeasurements";
import type { IAutoMovieHumanBodySemimembranosusMeasurements } from "./IAutoMovieHumanBodySemimembranosusMeasurements";
import type { IAutoMovieHumanBodySemitendinosusMeasurements } from "./IAutoMovieHumanBodySemitendinosusMeasurements";

/**
 * Posterior thigh bellies with distinct pelvic/femoral origins and knee insertions.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty group separates biceps long/short heads and semitendinosus/semimembranosus measurements into distinct belly owners.
 * @evidence contracts/common.md#clear-and-simple-design Posterior-thigh grouping delegates each constituent's quantities to its named contract.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The hamstring group is not another solid duplicating its four member muscles.
 * @evidence contracts/common.md#meaningful-documentation Comments distinguish the two biceps heads and superficial/deep medial members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Hamstring grouping executes no compound-muscle volume or generation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Member references retain no completed posterior-thigh measurement cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The hamstring input aggregate acquires no extra muscle surface or task.
 * @author Samchon
 */
export type IAutoMovieHumanBodyHamstringsMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Pelvis-origin long head of biceps femoris. */
    bicepsFemorisLongHead?: IAutoMovieHumanBodyBicepsFemorisLongHeadMeasurements;

    /** Femur-origin short head, separate from the long head. */
    bicepsFemorisShortHead?: IAutoMovieHumanBodyBicepsFemorisShortHeadMeasurements;

    /** Superficial medial hamstring. */
    semitendinosus?: IAutoMovieHumanBodySemitendinosusMeasurements;

    /** Deep medial hamstring. */
    semimembranosus?: IAutoMovieHumanBodySemimembranosusMeasurements;
  }>;
