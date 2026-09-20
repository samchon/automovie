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
 * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `IAutoMovieSlate` as the portable data boundary for the story time state review scope requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `IAutoMovieSlate` for the narrative intent temporal state handoff system contract.
 * @author Samchon
 */
export interface IAutoMovieSlate {
  /**
   * The user's original request (+ any references), verbatim.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `brief` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `brief` for the narrative intent temporal state handoff system contract.
   */
  brief: string;

  /**
   * The macro plan, once the SCRIPT stage has run (else null).
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `script` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `script` for the narrative intent temporal state handoff system contract.
   */
  script: IAutoMovieScript | null;

  /**
   * The staged world: placed models, cameras, lights (once STAGING has run).
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `scene` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `scene` for the narrative intent temporal state handoff system contract.
   */
  scene: IAutoMovieScene | null;

  /**
   * Shots built so far, keyed by the beat id they realise.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `shots` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `shots` for the narrative intent temporal state handoff system contract.
   */
  shots: IAutoMovieShot[];

  /**
   * Resolved end-state snapshots for built beats, keyed by beat id.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `beatEnds` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `beatEnds` for the narrative intent temporal state handoff system contract.
   */
  beatEnds: IAutoMovieBeatEndState[];

  /**
   * Open review notes still to be addressed (the correction backlog).
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `notes` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `notes` for the narrative intent temporal state handoff system contract.
   */
  notes: IAutoMovieReviewNote[];

  /**
   * The assembled film, once every beat has passed review (else null).
   *
   * @evidence requirements/story/story-clock-and-state.md#story-time-state-review-scope Exposes `film` as the portable data boundary for the story time state review scope requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff Types `film` for the narrative intent temporal state handoff system contract.
   */
  film: IAutoMovieSequence | null;
}
