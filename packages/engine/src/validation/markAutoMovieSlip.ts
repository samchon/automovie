import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieMark } from "../geometry/IAutoMovieMark";

/**
 * Turn the slip of planted or held contacts at one instant into inspection marks: a segment from where each contact was planted to where it is now, flagged when it has moved farther than its limit.
 *
 * Each entry is a contact's path, the world point it was planted at, its world point now, both in metres, and the horizontal distance in metres it may move, as `validateFootSkate` bounds a planted foot. The distance is measured in the horizontal XZ plane, as the skate check measures it. A contact that has moved draws one segment of kind `slip`, label `slip`, colour steel blue `4682b4`, at path `<path>/slip`; one past its limit is flagged. A contact that has not moved horizontally draws nothing. The mark is in world metres and unanchored.
 *
 * It throws for a point that is not finite or a limit that is negative or not finite.
 *
 * @param entries Contacts with their planted and current points and their limits.
 * @returns One mark per moved contact, in the entries' order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the input and its source, the plane the distance is measured in, what is drawn, when it is flagged, the kind, label, colour, path and frame, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Slip of a planted contact is its horizontal displacement from where it was planted, the quantity the skate check bounds, so the segment shows both its direction and its length and the flag is the same bound.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the entries.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limit is the caller's stated bound, and no contact is named.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the entries.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure conversion of one instant.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh marks and keeps nothing.
 */
export function markAutoMovieSlip(
  entries: readonly {
    path: string;
    planted: IAutoMovieVector3;
    at: IAutoMovieVector3;
    limit: number;
  }[],
): IAutoMovieMark[] {
  const marks: IAutoMovieMark[] = [];
  for (const entry of entries) {
    const values: number[] = [
      entry.planted.x,
      entry.planted.y,
      entry.planted.z,
      entry.at.x,
      entry.at.y,
      entry.at.z,
    ];
    if (!values.every(Number.isFinite))
      throw new Error(`markAutoMovieSlip: contact ${entry.path} has no finite points`);
    if (!(Number.isFinite(entry.limit) && entry.limit >= 0))
      throw new Error(
        `markAutoMovieSlip: contact ${entry.path} has the limit ${entry.limit}, not a finite distance of zero or more`,
      );
    const distance: number = Math.hypot(
      entry.at.x - entry.planted.x,
      entry.at.z - entry.planted.z,
    );
    if (distance === 0) continue;
    marks.push({
      path: `${entry.path}/slip`,
      kind: "slip",
      label: "slip",
      color: 0x4682b4,
      shape: { type: "segments", points: values },
      flagged: distance > entry.limit,
      anchor: null,
    });
  }
  return marks;
}
