/** Flat rectangle in the local XZ plane. */
export interface IAutoMoviePlaneShape {
  /** Discriminator. */
  type: "plane";

  /** Size along local X, meters. */
  width: number;

  /** Size along local Z, meters. */
  depth: number;
}
