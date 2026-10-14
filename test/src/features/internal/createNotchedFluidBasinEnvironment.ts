import type { IAutoMovieBuiltEnvironment, IAutoMovieBuiltSpace, IAutoMovieHalfSpacePlane } from "@automovie/interface";
import { basinEnvironment } from "./basinEnvironment";

/** Original shared Y/Z halfspaces of both convex basin halves. */
const SIDES: IAutoMovieHalfSpacePlane[] = [
  { normal: { x: 0, y: -1, z: 0 }, offset: 1 },
  { normal: { x: 0, y: 1, z: 0 }, offset: 4 },
  { normal: { x: 0, y: 0, z: -1 }, offset: 2 },
  { normal: { x: 0, y: 0, z: 1 }, offset: 2 },
];

/** Preserve the original two-cell basin: west X in [-2,-0.5], east X in
 * [0.5,2], with their shared Y/Z walls. The owning binding entry contrasts a
 * bridging lattice with one wholly inside the west half, deriving containment
 * from these authored halfspaces. Cells and plane arrays are fresh; the shared
 * SIDES plane records are borrowed exactly as in the original fixture. */
export function createNotchedFluidBasinEnvironment(): IAutoMovieBuiltEnvironment {
  const environment: IAutoMovieBuiltEnvironment = basinEnvironment();
  return {
    ...environment,
    spaces: environment.spaces.map((space: IAutoMovieBuiltSpace): IAutoMovieBuiltSpace => ({
      ...space,
      cells: [
        { id: "west-half", planes: [
          { normal: { x: -1, y: 0, z: 0 }, offset: 2 },
          { normal: { x: 1, y: 0, z: 0 }, offset: -0.5 },
          ...SIDES,
        ] },
        { id: "east-half", planes: [
          { normal: { x: -1, y: 0, z: 0 }, offset: -0.5 },
          { normal: { x: 1, y: 0, z: 0 }, offset: 2 },
          ...SIDES,
        ] },
      ],
    })),
  };
}
