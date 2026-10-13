import {
  AutoMovieGrammarStyleIntent,
  IAutoMovieCameraIntent,
} from "@automovie/interface";

import { IAutoMovieGrammarCameraObservation } from "./IAutoMovieGrammarCameraObservation";
import { IAutoMovieGrammarSubjectObservation } from "./IAutoMovieGrammarSubjectObservation";

/** The geometric and editorial facts required to inspect one ordered shot. */
export interface IAutoMovieGrammarShotObservation {
  /** Stable shot id. */
  id: string;
  /** Positive edited duration in seconds. */
  duration: number;
  /** Resolved camera at both edited shot boundaries. */
  camera: {
    /** Opening-frame camera. */
    start: IAutoMovieGrammarCameraObservation;
    /** Closing-frame camera. */
    end: IAutoMovieGrammarCameraObservation;
  };
  /** Subjects observed in this shot; input order has no meaning. */
  subjects: IAutoMovieGrammarSubjectObservation[];
  /** Principal subject used for cut and framing checks. */
  primarySubject: string | null;
  /** Authored framing claim, or null when none was declared. */
  declaredShotSize: IAutoMovieCameraIntent["framing"] | null;
  /** Two subjects defining the line of action, or null when unavailable. */
  actionAxis: readonly [string, string] | null;
  /** Deliberate exceptions copied from the shot contract. */
  styleIntent?: AutoMovieGrammarStyleIntent[];
}
