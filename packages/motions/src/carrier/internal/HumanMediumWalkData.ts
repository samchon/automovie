import type { IAutoMovieVector3 } from "@automovie/interface";

export namespace HumanMediumWalkData {
  /*
   * World vertical.
   */
  export const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

  /*
   * The wading measurement: walking speed in water 1.2 m deep, as a share of the
   * land speed (Fantozzi et al. 2015,
   * https://pmc.ncbi.nlm.nih.gov/articles/PMC4569370/: 40 % slower).
   */
  export const WADE_SHARE: number = 0.6;

  /*
   * The water depth of that measurement, metres.
   */
  export const WADE_DEPTH: number = 1.2;

  /*
   * How far a swinging foot clears the medium's surface, metres (provisional
   * staging).
   */
  export const CLEARANCE: number = 0.05;

  /*
   * Hands held above the water's surface at hip depth or deeper, metres
   * (provisional staging).
   */
  export const ARMS_ABOVE: number = 0.15;

  /*
   * Seconds over which a lifted foot's toe-down turn eases in from and out to its
   * plants (provisional staging).
   */
  export const EASE: number = 0.1;

  /*
   * The trunk's forward lean while wading, degrees (provisional staging).
   */
  export const WADE_LEAN: number = 10;

  /*
   * Terrain factors of the walking-energy equation (Pandolf, Givoni and Goldman
   * 1977, after Soule and Goldman 1972): loose sand 2.1 and a swampy bog, taken
   * for mud, 1.8. Soft snow's factor rises with depth; 1.3 a decimetre of sinking
   * is a provisional reading.
   */
  export const TERRAIN: Readonly<Record<TERRAINEntryItem, number>> = {
    sand: 2.1,
    mud: 1.8,
  };

  /*
   * Soft snow's terrain factor per metre of sinking (provisional).
   */
  export const SNOW_PER_METRE: number = 13;

  /*
   * The alternatives of `TERRAINEntryItem`'s site.
   */
  export type TERRAINEntryItem = "sand" | "mud";
}
