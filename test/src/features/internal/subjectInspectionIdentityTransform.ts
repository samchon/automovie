import { IAutoMovieTransform } from "@automovie/interface";


/** Identity transform used by the compiled subject-inspection fixtures. */
export const subjectInspectionIdentityTransform: () => IAutoMovieTransform = (): IAutoMovieTransform => ({
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
});
