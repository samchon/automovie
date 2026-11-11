import type { IAutoMovieViewerViewpoint } from "./IAutoMovieViewerViewpoint.js";

/**
 * The eight views an inspection asks for by name: the six along the world axes and two three-quarter views.
 *
 * A view is named by where the camera stands, looking at the subject's centre. For a subject built facing +Z these are its own front, back and sides.
 *
 * | Id | Camera | Reads |
 * | --- | --- | --- |
 * | `front` | On +Z | The XY silhouette |
 * | `back` | On -Z | The XY silhouette, mirrored |
 * | `right` | On +X | The ZY profile |
 * | `left` | On -X | The ZY profile, mirrored |
 * | `top` | On +Y, looking down, with -Z up in the picture | The XZ plan |
 * | `bottom` | On -Y, looking up, with +Z up in the picture | The XZ plan, mirrored |
 * | `three-quarter` | Between +Z and +X, raised 20 degrees | Front and side together |
 * | `three-quarter-back` | Between -Z and -X, raised 20 degrees | Back and the other side together |
 *
 * `distanceFactor` multiplies the distance at which the subject fills the frame, 1.25 when omitted as in the turntable plan. It throws when the factor is not positive and finite.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the naming rule, each view's camera side and what it reads, the picture-up of the two vertical views, the distance factor's default and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Orthogonal views read one plane each without foreshortening across it, and the two three-quarter views show every side of a form between them; the angles are the framing owner's azimuth and elevation, with azimuth zero on +Z.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal table of id, azimuth and elevation, mapped to viewpoints.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sides are world axes, not a subject's guessed facing, and an unusable distance factor is refused as the turntable plan refuses it.
 * @evidence contracts/development/implementation.md#efficient-algorithms Eight records.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The records are the viewpoint type the framing and capture owners already take, so a named view needs no second framing path.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh plain records and keeps nothing.
 */
export function autoMovieViewerNamedViewpoints(
  distanceFactor: number = 1.25,
): IAutoMovieViewerViewpoint[] {
  if (!(Number.isFinite(distanceFactor) && distanceFactor > 0))
    throw new RangeError(
      `named viewpoint distance factor must be positive and finite, not ${distanceFactor}`,
    );
  const views: [id: string, azimuthDeg: number, elevationDeg: number][] = [
    ["front", 0, 0],
    ["back", 180, 0],
    ["right", 90, 0],
    ["left", 270, 0],
    ["top", 0, 90],
    ["bottom", 0, -90],
    ["three-quarter", 45, 20],
    ["three-quarter-back", 225, 20],
  ];
  return views.map(
    ([id, azimuthDeg, elevationDeg]: [
      string,
      number,
      number,
    ]): IAutoMovieViewerViewpoint => ({
      id,
      azimuthDeg,
      elevationDeg,
      distanceFactor,
    }),
  );
}
