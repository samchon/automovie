/**
 * A named point or range on a shot's source clock for editorial or conditioning metadata.
 *
 * @evidence contracts/development/design.md#principled-representation A finite start lies inside the playable shot and a finite end lies between start and shot duration. Equal endpoints denote a point and unequal endpoints a half-open range. The authored id is unique within the shot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Identity, label and source endpoints fully describe both point and range markers without a second time representation or interaction-event fields.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Admission rejects blank ids or labels, duplicate ids, and invalid endpoints instead of renaming or clamping the marker.
 * @evidence contracts/development/common.md#meaningful-documentation Defines shot-local seconds, point and range encoding, endpoint bounds and shot-local identity.
 */
export interface IAutoMovieEditorialMarker {
  /** Nonblank id, unique within the owning shot. */
  id: string;

  /** Nonblank label copied to every retained play. */
  label: string;

  /** Start in shot-local seconds, in `[0, duration)`. */
  startSeconds: number;

  /** End in shot-local seconds, in `[startSeconds, duration]`. Equal to start for a point. */
  endSeconds: number;
}
