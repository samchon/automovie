/** One declared native endpoint position and its current control owner. */
export interface IAutoMovieRecoveryNativeEndpoint {
  /** Original endpoint coordinates, millimetres. */
  position: readonly [number, number, number];

  /** Current coefficient index before native-owner compaction. */
  controlId: number;
}
