import type { IPortraitWebAlphaMaterial } from "./portraitWebAlphaTest";

/**
 * One exported face model as the review page draws it: the geometry and
 * finish of `export-subject-views.ts` and `export-articulation-census.ts`,
 * in the export's Y-up metre frame with +Z the face's front.
 *
 * Materials name colour, roughness and an optional texture (a data URI); the
 * alpha fields are absent in a census exported before they were carried. A
 * part without a mesh is not drawn.
 */
export interface IPortraitWebModel {
  id: string;
  parts: {
    id: string;
    material: string;
    mesh: {
      positions: number[];
      normals?: number[] | null;
      uvs?: number[] | null;
      indices?: number[] | null;
      colors?: number[] | null;
    } | null;
  }[];
  materials: (IPortraitWebAlphaMaterial & {
    id: string;
    baseColor: { r: number; g: number; b: number };
    roughness: number;
    texture?: string | null;
  })[];
}

/**
 * How one frame of a model is drawn: the camera (angles in degrees, distance
 * and target in metres, vertical field of view in degrees) and the display
 * mode. `clay` swaps every material for one untextured grey, `hairMask` draws
 * visible numerical hair white over black, and `only` keeps the parts whose
 * id starts with one of its prefixes.
 */
export interface IPortraitWebOptions {
  yaw?: number;
  pitch?: number;
  distance?: number;
  target?: readonly number[];
  fov?: number;
  clay?: boolean;
  /** Draw the shading normals as colour, a form-revealing structural pass. */
  normal?: boolean;
  hairMask?: boolean;
  only?: string[];
}
