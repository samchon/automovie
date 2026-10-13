/**
 * Asks for the state a built beat left every scene node in, so a later beat
 * blocks against where the previous one actually ended rather than against the
 * original staging.
 *
 * The engine's `readSlateContext` answers it with the
 * {@link IAutoMovieBeatEndState} stored on the slate for `beat`: per node the
 * world transform, facing, articulation, gait phase, root velocity, planted
 * feet and mount. It answers `null` when no end state is stored for the beat
 * and throws when two stored end states name the same beat. Use
 * {@link IAutoMovieGetShotRequest} instead for the built motion itself.
 *
 * @evidence contracts/common.md#principled-implementation A lookup by beat id over the slate's stored end states, which `resolveBeatEnd` sampled from the compiled shot, so the answer is a measurement rather than a restatement of the authored program; `readSlateContext` scans every entry so a duplicate is reported instead of resolved by position.
 * @evidence contracts/common.md#clear-and-simple-design The discriminator and one beat id are all the lookup needs; the end-state shape is owned by `IAutoMovieBeatEndState`, which this request only names.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A beat with no stored end state answers `null` instead of a state derived from staging, so a missing build stays visible to the caller.
 * @evidence contracts/common.md#meaningful-documentation States what the answer contains, the resolver, the `null` and duplicate outcomes, and which request to use for the motion instead; the member names the id it holds.
 * @author Samchon
 */
export interface IAutoMovieGetBeatEndRequest {
  /** Selects the query that reads a beat's resolved end state. */
  type: "getBeatEnd";

  /** Script beat id whose stored end state is read. */
  beat: string;
}
