import { IAutoMovieSubjectBox } from "./IAutoMovieSubjectBox";

/**
 * The smallest box containing every given box, or null when none were given.
 *
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-bounds-state-motion unionSubjectBoxes exposes state-dependent asset extent: The smallest box containing every given box, or null when none were given.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-dynamic-bounds-invariants unionSubjectBoxes realizes dynamic-bounds invariants: The smallest box containing every given box, or null when none were given.
 */
export const unionSubjectBoxes = (
  boxes: readonly IAutoMovieSubjectBox[],
): IAutoMovieSubjectBox | null =>
  boxes.length === 0
    ? null
    : {
        min: {
          x: Math.min(...boxes.map((box) => box.min.x)),
          y: Math.min(...boxes.map((box) => box.min.y)),
          z: Math.min(...boxes.map((box) => box.min.z)),
        },
        max: {
          x: Math.max(...boxes.map((box) => box.max.x)),
          y: Math.max(...boxes.map((box) => box.max.y)),
          z: Math.max(...boxes.map((box) => box.max.z)),
        },
      };
