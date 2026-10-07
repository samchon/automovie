/** Geometric source axes rooted at the exact cervical cycle, not clinical CEJ. */
export interface IHumanSourceCrownAffineFrame {
  crown: string;
  vertices: number[];
  centreMetres: number[];
  widthAxis: number[];
  depthAxis: number[];
  heightAxis: number[];
  sourceExtentsMetres: number[];
  parameterIndices: number[];
  qualification: string;
}
