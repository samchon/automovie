import { sampleBroomPath } from "./sampleBroomPath";

/**
 * Continue Harry's riderless broom into a slowing upper-right departure.
 *
 * @evidence contracts/common.md#implementation-and-ownership Delegates release and finite-acceleration drag to the same path owner as occupied flight. Inherits the last tangent without autonomous climb or sideways steering; the occupied broom clears lower/left and remains faster at the ending.
 * @evidence contracts/common.md#authoring-interface Finite global seconds in +X east,+Y up,+Z north metres are required. Returns owned transform/derivatives; departure begins44.3seconds with continuous position, velocity and acceleration. Magical glide is not aerodynamic simulation.
 */
export function sampleReleasedBroom(seconds: number): ReturnType<typeof sampleBroomPath> {
  return sampleBroomPath("old", seconds);
}
