import { IAutoMovieSurface } from "./IAutoMovieSurface";

/**
 * The space of a scene: the set of standable surfaces plus which of them an actor may walk on: the first-class representation behind what the engine previously assumed as one scalar ground plane.
 *
 * This low-level record intentionally owns only the surface facts needed by motion, support, and contact math (`heightAt`, support contacts, walkability). Rooms, storeys, boundaries, openings, and traversal connectors live in {@link IAutoMovieBuiltEnvironment}; its lowering produces one or more of these support spaces. A plain outdoor world may still author this type directly. The space answers "how high is the ground and may I stand there", while the higher-level owner answers where the region begins and how it is connected.
 *
 * @evidence contracts/common.md#principled-implementation Surface footprints and height laws supply support/contact height, while an explicit walkable-id population independently admits performer traversal; building lowering contributes this same low-level support representation.
 * @evidence contracts/common.md#clear-and-simple-design Support geometry is separated from logical rooms, boundaries and connectors owned by the built environment, permitting direct outdoor authoring without duplicating architecture topology.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A standable patch omitted from walkable can support props but not locomotion; semantic surface kind does not infer traversal permission or replace its actual height law.
 * @evidence contracts/common.md#meaningful-documentation Defines surface ownership and walkable references, forbidden standable tops and the division from logical architecture.
 */
export interface IAutoMovieSpace {
  /** Stable id. */
  id: string;

  /** The standable surface patches. */
  surfaces: IAutoMovieSurface[];

  /**
   * Ids of the surfaces an actor may walk on. A surface not listed is a standable-but-forbidden top (a table an actor should not climb): objects may still rest on it, but locomotion treats it as no-go.
   */
  walkable: string[];
}
