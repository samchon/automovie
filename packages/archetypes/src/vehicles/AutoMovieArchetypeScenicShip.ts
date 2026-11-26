import { type AutoMovieArchetype } from "../core/index";
import { createScenicShip as createScenicShipImplementation } from "./internal/createScenicShip";

/** Public operations for Auto Movie Archetype Scenic Ship. */
export namespace AutoMovieArchetypeScenicShip {
  /**
   * A rigid, fictional ship for people on deck. The root sits at the still-water
   * line, with the bow toward +Z and +Y up. The boarding side and its passage are
   * along +X. The deck and boarding frames lie on the deck top. Boarding faces
   * inward along the frame's +Z. Each oared bench's seat frame points its +Z axis
   * toward the ship's aft (−Z). Each kind has an unobstructed aft work area and
   * helm standing position.
   *
   * Pair the ship with AutoMovieArchetypeRide.along and optionally
   * AutoMovieArchetypeSea.float to carry the same contact frames through a turn
   * or swell. Hull solids, fixed oars and sails, and a wheelhouse with an open
   * aft entry model film silhouettes. The model has no interior below deck or
   * propulsion simulation.
   *
   * @param params Profile, scene id and optional sizes within the profile's
   *   provisional staging band.
   * @param seed Optional number or text used to draw unfixed sizes.
   * @returns The ship and its deck, boarding and crew contacts.
   * @throws {AutoMovieArchetypeRefusal} When the profile is unknown or a
   *   dimension falls outside its band.
   */
  export function create(params: AutoMovieArchetypeScenicShip.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeScenicShip.Affordance, AutoMovieArchetypeScenicShip.Dimension> {
    return createScenicShipImplementation(params, seed);
  }

  /**
   * The exposed rowing benches, square-rigged deck, and powered workboat
   * silhouettes.
   */
  export type Kind = "oared" | "squareSail" | "wheelhouse";

  /** Kind choices in historical sequence. */
  export const KINDS: readonly Kind[] = ["oared", "squareSail", "wheelhouse"];

  /**
   * Hull length, maximum beam, draft below still water and deck freeboard in
   * metres, and provisional total mass in kilograms.
   */
  export type Dimension = "length" | "beam" | "draft" | "freeboard" | "mass";

  /**
   * Deck walkway, the port entry, clear aft deck, helm standing area and
   * aft-facing bench-edge seats on the oared profile.
   */
  export type Affordance =
    | "deck"
    | "boarding"
    | "aftDeck"
    | "helm"
    | `rower-${"port" | "starboard"}-${0 | 1 | 2 | 3}`;

  /**
   * The film scene's ship choice and fixed dimension overrides inside its
   * admissible bands.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Selects the hull and scenery silhouette. */
    kind: Kind;

    /** The model's scene id. */
    id?: string;
  }}
