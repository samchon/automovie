/** Capsule (cylinder capped by hemispheres) aligned to local Y. */
export interface IAutoMovieCapsuleShape {
  /** Discriminator. */
  type: "capsule";

  /** Radius of the body and end caps, meters. */
  radius: number;

  /** Length of the cylindrical body between the caps, meters. */
  height: number;
}
