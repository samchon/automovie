import { IAutoMovieBlockingActor } from "./IAutoMovieBlockingActor";
import { IAutoMovieBlockingCamera } from "./IAutoMovieBlockingCamera";
import { IAutoMovieBlockingCoverage } from "./IAutoMovieBlockingCoverage";

/**
 * Models one shot's intent before dense motion is synthesized.
 *
 * The engine checks this plan against script, stage, prior beat state and the
 * final action program. Prose explains craft; typed anchors and camera fields
 * carry the facts that can be checked deterministically. `blockBeat` gates the
 * plan against the script and the staged set, and `performShot` later holds
 * the action program to its beat, duration, anchors and hero framing and move.
 *
 * @evidence contracts/common.md#principled-implementation Splits a beat plan into prose (`analysis`, `rationale`, actor `beats`) and typed facts; `blockBeat` checks the beat id, positive duration, placed actors, ordered anchors and coverage cameras, and `performShot` checks the same beat, a duration within 1e-6 s, anchor coverage, and hero framing and move.
 * @evidence contracts/common.md#clear-and-simple-design One record per beat holds actor intents, the hero camera and optional coverage, so each gate reads a single value and the prose rationale sits beside the facts it justifies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No beat, actor or camera id is special-cased; the 1e-6 s duration tolerance in `performShot` is the only numeric slack, and the hero camera's `on` target is checked for placement but never compared with the performed `frame` subject.
 * @evidence contracts/common.md#meaningful-documentation Documents which fields are review prose and which gates check the others, the seconds unit of `duration`, and that `coverage` takes are alternates of this beat on other staged cameras.
 * @author Samchon
 */
export interface IAutoMovieBlocking {
  /** Script beat id realized by this plan; it must name a script beat. */
  beat: string;

  /** Dramatic purpose for later visual review; no engine gate reads it. */
  analysis: string;

  /**
   * Why the chosen placement, coverage and timing serve that purpose; review
   * prose that no engine gate reads.
   */
  rationale: string;

  /** Actor-local intent and optional causal timing anchors. */
  actors: IAutoMovieBlockingActor[];

  /**
   * Hero camera intent; `performShot` compares its `framing` and `move` with
   * the first `frame` action, and a `static` intent needs no frame action.
   */
  camera: IAutoMovieBlockingCamera;

  /**
   * Additional independently renderable takes, each on a staged camera other
   * than the elected hero camera and every sibling take's camera.
   */
  coverage?: IAutoMovieBlockingCoverage[];

  /**
   * Finite positive shot-local duration in seconds; the performance must match
   * it within 1e-6 s.
   */
  duration: number;
}
