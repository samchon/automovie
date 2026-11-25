/** Sphere centred at the model part's local origin. */
export interface IAutoMovieSphereShape {
  /** Discriminator. */
  type: "sphere";

  /** Finite positive radius, metres. */
  radius: number;
}
