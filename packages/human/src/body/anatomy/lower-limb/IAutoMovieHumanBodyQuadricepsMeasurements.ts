import type { AutoMovieHumanBodyNonemptyMeasurements } from "../measurements/AutoMovieHumanBodyNonemptyMeasurements";
import type { IAutoMovieHumanBodyRectusFemorisMeasurements } from "./IAutoMovieHumanBodyRectusFemorisMeasurements";
import type { IAutoMovieHumanBodyVastusIntermediusMeasurements } from "./IAutoMovieHumanBodyVastusIntermediusMeasurements";
import type { IAutoMovieHumanBodyVastusLateralisMeasurements } from "./IAutoMovieHumanBodyVastusLateralisMeasurements";
import type { IAutoMovieHumanBodyVastusMedialisMeasurements } from "./IAutoMovieHumanBodyVastusMedialisMeasurements";

/**
 * Four independently measured anterior thigh bellies converging on patella.
 *
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
