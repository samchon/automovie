/**
 * One absorbing surface of a room.
 *
 * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `IAutoMovieAcousticSurface` declares one bounded area-and-absorption contribution to the room's scalar reverberation estimate.
 * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The surface record supplies the exact operands accumulated into the scenario's equivalent absorption area.
 */
export interface IAutoMovieAcousticSurface {
  /**
   * Stable surface identity within the request.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary This `id` keeps each absorbing surface traceable as a separate authored room input.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The surface key gives validation and gap reporting a stable identity for the corresponding absorption operand.
   */
  id: string;
  /**
   * Area in m^2; strictly positive.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary Surface `area` states how much material participates in the room absorption calculation.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The square-metre operand weights this surface's coefficient in the Sabine absorption sum.
   */
  area: number;
  /**
   * Sabine absorption coefficient within `[0, 1]`.
   *
   * @evidence requirements/interior/acoustics-and-sound-boundaries.md#interior-acoustic-analysis-boundary `absorption` declares the broadband fraction removed at this room surface without claiming frequency-resolved behavior.
   * @evidence specifications/interior-space/lighting-acoustics-and-environment.md#interior-space-acoustic-boundary-scenario The bounded coefficient is multiplied by surface area to form this scenario's Sabine absorption contribution.
   */
  absorption: number;
}
