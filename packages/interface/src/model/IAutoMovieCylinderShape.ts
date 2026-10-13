/** Cylinder aligned to local Y. */
export interface IAutoMovieCylinderShape {
  /** Discriminator. */
  type: "cylinder";

  /** Radius, meters. */
  radius: number;

  /** Height along local Y, meters. */
  height: number;
}
