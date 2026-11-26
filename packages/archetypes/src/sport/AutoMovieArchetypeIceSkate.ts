import { type AutoMovieArchetype } from "../core/index";
import { createIceSkate as createIceSkateImplementation } from "./internal/createIceSkate";

/** Public operations for Auto Movie Archetype Ice Skate. */
export namespace AutoMovieArchetypeIceSkate {
  /**
   * One coarse hockey skate, resting on the runner with the toe toward +Z. Its
   * intended foot length and runner length are from the CCM 2016 size guide. The
   * boot, holder and steel cross section use provisional outer dimensions.
   * https://www.iceglace.com/catalogues/Catalogue_ICE_CCM_2016.pdf
   *
   * @param params The scene id and optional mass in kilograms.
   * @param seed Draws the mass if the author leaves it open.
   * @returns A skate with a boot socket and three runner contact sites.
   */
  export function create(params?: AutoMovieArchetypeIceSkate.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeIceSkate.Affordance, "mass"> {
    return createIceSkateImplementation(params, seed);
  }

  /** The boot socket, runner centerline and its two lower edges. */
  export type Affordance = "boot" | "blade" | "leftEdge" | "rightEdge";

  /** A scene id and optional fixed mass in kilograms. */
  export interface IParams {
    /** Scene id, unique when staging more than one skate. */
    id?: string;

    /**
     * Mass in kilograms, drawn from the documented provisional band when
     * absent.
     */
    mass?: number;
  }}
