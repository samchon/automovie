import type { HeightPlane } from "../../geometry/HeightPlane";

export const offset = (plane: HeightPlane, dy: number): HeightPlane => ({ ...plane, constant: plane.constant + dy });
