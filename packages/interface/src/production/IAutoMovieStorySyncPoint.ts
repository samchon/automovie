/**
 * One realized shot event placed on the production story clock.
 *
 * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `IAutoMovieStorySyncPoint` as the portable data boundary for the story simultaneous events requirement.
 * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `IAutoMovieStorySyncPoint` for the narrative intent story synchronization system contract.
 */
export interface IAutoMovieStorySyncPoint {
  /**
   * Owning shot id.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `shot` as the portable data boundary for the story simultaneous events requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `shot` for the narrative intent story synchronization system contract.
   */
  shot: string;
  /**
   * Exact event id.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `event` as the portable data boundary for the story simultaneous events requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `event` for the narrative intent story synchronization system contract.
   */
  event: string;
  /**
   * Compiler-realized shot-local time in seconds, or null when the owning shot
   * has no current realization for the event.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `localSeconds` as the portable data boundary for the story simultaneous events requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `localSeconds` for the narrative intent story synchronization system contract.
   */
  localSeconds: number | null;
  /**
   * Story-clock time in seconds, or null when the local time is unavailable or
   * the owning shot carries no story-clock pin.
   *
   * @evidence requirements/story/story-clock-and-state.md#story-simultaneous-events Exposes `storySeconds` as the portable data boundary for the story simultaneous events requirement.
   * @evidence specifications/narrative-and-intent/events-causality-and-time.md#narrative-intent-story-synchronization Types `storySeconds` for the narrative intent story synchronization system contract.
   */
  storySeconds: number | null;
}
