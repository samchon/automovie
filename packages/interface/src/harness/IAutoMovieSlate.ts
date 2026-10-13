import { IAutoMovieSequence } from "../cinematics/IAutoMovieSequence";
import { IAutoMovieShot } from "../cinematics/IAutoMovieShot";
import { IAutoMovieScene } from "../scene/IAutoMovieScene";
import { IAutoMovieBeatEndState } from "./IAutoMovieBeatEndState";
import { IAutoMovieReviewNote } from "./IAutoMovieReviewNote";
import { IAutoMovieScript } from "./IAutoMovieScript";

/**
 * The **slate**: the clapperboard that heads every take and carries the
 * production's running context between stages. Each harness stage reads the
 * slate's upstream slices and writes its own, exactly as AutoBe threads state
 * between analyze → database → interface → realize → test. State lives here;
 * the model just calls functions.
 *
 * @author Samchon
 */
export interface IAutoMovieSlate {
  /** The user's original request (+ any references), verbatim. */
  brief: string;

  /** The macro plan, once the SCRIPT stage has run (else null). */
  script: IAutoMovieScript | null;

  /**
   * The staged world: placed models, cameras, lights (once STAGING has run).
   */
  scene: IAutoMovieScene | null;

  /** Shots built so far, keyed by the beat id they realise. */
  shots: IAutoMovieShot[];

  /** Resolved end-state snapshots for built beats, keyed by beat id. */
  beatEnds: IAutoMovieBeatEndState[];

  /** Open review notes still to be addressed (the correction backlog). */
  notes: IAutoMovieReviewNote[];

  /** The assembled film, once every beat has passed review (else null). */
  film: IAutoMovieSequence | null;
}
