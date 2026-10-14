import { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";

/** Six authored half-spaces defining the supplied drawing-space box. */
export const canonicalDrawingCell: (id: string, min: IAutoMovieVector3, max: IAutoMovieVector3) => IAutoMovieBuiltEnvironment["spaces"][number]["cells"][number] = (
  id: string,
  min: IAutoMovieVector3,
  max: IAutoMovieVector3,
): IAutoMovieBuiltEnvironment["spaces"][number]["cells"][number] => ({
  id,
  planes: [
    { normal: { x: 1, y: 0, z: 0 }, offset: max.x },
    { normal: { x: -1, y: 0, z: 0 }, offset: -min.x },
    { normal: { x: 0, y: 1, z: 0 }, offset: max.y },
    { normal: { x: 0, y: -1, z: 0 }, offset: -min.y },
    { normal: { x: 0, y: 0, z: 1 }, offset: max.z },
    { normal: { x: 0, y: 0, z: -1 }, offset: -min.z },
  ],
});
