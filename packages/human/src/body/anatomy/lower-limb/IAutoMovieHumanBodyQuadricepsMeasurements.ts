import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyRectusFemorisMeasurements } from "./IAutoMovieHumanBodyRectusFemorisMeasurements";
import type { IAutoMovieHumanBodyVastusIntermediusMeasurements } from "./IAutoMovieHumanBodyVastusIntermediusMeasurements";
import type { IAutoMovieHumanBodyVastusLateralisMeasurements } from "./IAutoMovieHumanBodyVastusLateralisMeasurements";
import type { IAutoMovieHumanBodyVastusMedialisMeasurements } from "./IAutoMovieHumanBodyVastusMedialisMeasurements";

/**
 * Four independently measured anterior thigh bellies converging on patella.
 *
 * @evidence contracts/common.md#principled-implementation A nonempty anterior-thigh group separates rectus femoris and three vasti into independently measured belly records.
 * @evidence contracts/common.md#clear-and-simple-design Four constituent contracts own their scalar quantities while the quadriceps label is only grouping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The group cannot add a fifth solid duplicating its actual component muscles.
 * @evidence contracts/common.md#meaningful-documentation Members distinguish rectus and lateral/medial/deep vastus ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Quadriceps grouping computes no combined-thigh volume or extension algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Four-head membership retains no completed anterior-thigh measurement cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The grouping type owns no duplicate quadriceps mesh or running simulator.
 * @author Samchon
 */
export type IAutoMovieHumanBodyQuadricepsMeasurements =
  AutoMovieHumanBodyNonemptyMeasurements<{
    /** Hip- and knee-spanning rectus femoris. */
    rectusFemoris?: IAutoMovieHumanBodyRectusFemorisMeasurements;

    /** Lateral femoral head. */
    vastusLateralis?: IAutoMovieHumanBodyVastusLateralisMeasurements;

    /** Medial femoral head. */
    vastusMedialis?: IAutoMovieHumanBodyVastusMedialisMeasurements;

    /** Deep head beneath rectus femoris. */
    vastusIntermedius?: IAutoMovieHumanBodyVastusIntermediusMeasurements;
  }>;
