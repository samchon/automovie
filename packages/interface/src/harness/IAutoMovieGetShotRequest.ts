/**
 * Asks for an already built sibling shot, to match its ending pose, position
 * or energy.
 *
 * The engine's `readSlateContext` answers it with the slate shot whose id is
 * `shot:<beat>`, the id a built beat's shot carries, or `null` when the beat
 * has none yet, and throws when two stored shots carry that id. For the tidy
 * per-node end state rather than the motion, use
 * {@link IAutoMovieGetBeatEndRequest}.
 *
 * @evidence contracts/common.md#principled-implementation The shot is located by the deterministic `shot:<beat>` id convention, so a beat id is enough to find it, and every stored shot is scanned so a duplicate id is refused.
 * @evidence contracts/common.md#clear-and-simple-design The beat id is the only key, because a beat realizes one shot; the end state is a separate request rather than a projection option here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unbuilt beat answers `null` instead of compiling the shot on demand, and a duplicated shot id throws instead of returning the first.
 * @evidence contracts/common.md#meaningful-documentation States the purpose, the id convention, the `null` and throw outcomes, and the request to use for end state instead; the member says what id it holds.
 * @author Samchon
 */
export interface IAutoMovieGetShotRequest {
  /** Selects the knowledge query that reads a built shot. */
  type: "getShot";

  /** Script beat id whose shot, `shot:<beat>`, is read. */
  beat: string;
}
