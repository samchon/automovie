import { IAutoMovieBeatEndFootPlant, IAutoMovieMotion, IAutoMovieScene, IAutoMovieShot } from "@automovie/interface";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";

/**
 * Inputs shared by the beat-end and beat-opening snapshots.
 *
 * @evidence requirements/story/scenes-and-observable-action.md#story-scene-boundary-continuity IResolveBeatProps preserves measured beat-boundary continuity: Inputs shared by the beat-end and beat-opening snapshots.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff IResolveBeatProps realizes explicit temporal state handoff: Inputs shared by the beat-end and beat-opening snapshots.
 */
export interface IResolveBeatProps {
  /**
   * Beat id the shot realizes.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-boundary-continuity IResolveBeatProps.beat preserves measured beat-boundary continuity: Beat id the shot realizes.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff IResolveBeatProps.beat realizes explicit temporal state handoff: Beat id the shot realizes.
   */
  beat: string;

  /**
   * Staged scene the shot played over.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-boundary-continuity IResolveBeatProps.scene preserves measured beat-boundary continuity: Staged scene the shot played over.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff IResolveBeatProps.scene realizes explicit temporal state handoff: Staged scene the shot played over.
   */
  scene: IAutoMovieScene;

  /**
   * Compiled shot for the beat.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-boundary-continuity IResolveBeatProps.shot preserves measured beat-boundary continuity: Compiled shot for the beat.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff IResolveBeatProps.shot realizes explicit temporal state handoff: Compiled shot for the beat.
   */
  shot: IAutoMovieShot;

  /**
   * Motion clips referenced by scene nodes and shot performances.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-boundary-continuity IResolveBeatProps.motions preserves measured beat-boundary continuity: Motion clips referenced by scene nodes and shot performances.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff IResolveBeatProps.motions realizes explicit temporal state handoff: Motion clips referenced by scene nodes and shot performances.
   */
  motions: IAutoMovieMotion[];

  /**
   * Persistent mount couplings from staging (`IAutoMovieStagedSet.mounts`),
   * carried to each rider's end state so the next beat re-couples without
   * re-declaring. Omit when nothing is mounted.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-boundary-continuity IResolveBeatProps.mounts preserves measured beat-boundary continuity: Persistent mount couplings from staging (`IAutoMovieStagedSet.mounts`), carried to each rider's end state so the next beat re-couples without re-declaring. Omit when nothing is mounted.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff IResolveBeatProps.mounts realizes explicit temporal state handoff: Persistent mount couplings from staging (`IAutoMovieStagedSet.mounts`), carried to each rider's end state so the next beat re-couples without re-declaring. Omit when nothing is mounted.
   */
  mounts?: readonly IAutoMovieStagedSet.IMount[];

  /**
   * Ground-IK plant data per performed node (the `plants` of the engine's
   * plant-stance-feet pass), carried so the next beat keeps planted feet where
   * this beat left them. Omit when no pass ran.
   *
   * @evidence requirements/story/scenes-and-observable-action.md#story-scene-boundary-continuity IResolveBeatProps.plants preserves measured beat-boundary continuity: Ground-IK plant data per performed node (the `plants` of the engine's plant-stance-feet pass), carried so the next beat keeps planted feet where this beat left them. Omit when no pass ran.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-temporal-state-handoff IResolveBeatProps.plants realizes explicit temporal state handoff: Ground-IK plant data per performed node (the `plants` of the engine's plant-stance-feet pass), carried so the next beat keeps planted feet where this beat left them. Omit when no pass ran.
   */
  plants?: ReadonlyArray<{
    /** Scene node the plants belong to. */
    node: string;
    /** The pass's pinned stance runs for that node. */
    plants: readonly IAutoMovieBeatEndFootPlant[];
  }>;
}
