
/** Height field `y = x * px + z * pz + constant` over the plan, in metres. */
export interface HeightPlane {
  /** Height gradient along world x. */
  x: number;
  /** Height gradient along world z. */
  z: number;
  /** Height at the plan origin. */
  constant: number;
}
