/** Cone aligned to local Y (wide base at +Y, tapering to the apex at -Y). */
export interface IAutoMovieConeShape {
  /** Discriminator. */
  type: "cone";

  /** Base radius, meters. */
  radius: number;

  /** Height along local Y, meters. */
  height: number;
}
