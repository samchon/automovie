/**
 * Distance in metres a depth-tested inspection mark is drawn nearer the camera than it lies, along its line of sight, so a mark lying on a surface wins the depth test against that surface.
 *
 * Two millimetres is a drawing convention: far below the size of anything a still is judged at, so a mark never visibly floats off its surface, and far above the depth buffer's resolution at the subject distances an inspection frames, so the lead is never lost to depth precision.
 */
export const AUTO_MOVIE_INSPECTION_DEPTH_LEAD: number = 0.002;
