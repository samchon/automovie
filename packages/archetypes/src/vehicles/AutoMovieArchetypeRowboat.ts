import { type AutoMovieArchetype } from "../core/index";
import { createRowboat as createRowboatImplementation } from "./internal/createRowboat";
import { AutoMovieArchetypeBoat } from "./AutoMovieArchetypeBoat";

/** Public operations for Auto Movie Archetype Rowboat. */
export namespace AutoMovieArchetypeRowboat {
  /**
   * Fixed-seat rowboat.
   *
   * The hull floats at its waterline with its bow along +Z. The rowing thwart
   * faces aft and its paired oars sit in articulated locks.
   *
   * @param params The scene identity and this hull's accepted dimensions and
   *   catalogue choices.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeRowboat.IParams, seed?: number): AutoMovieArchetype<AutoMovieArchetypeRowboat.Affordance, AutoMovieArchetypeRowboat.Dimension> {
    return createRowboatImplementation(params, seed);
  }

  /** The `model` choices this producer admits. */
  export type Model = "thamesSkiff" | "whitehallSkiff" | "whitehall17";

  /**
   * The boat construction's dimension set, which the rowing ride reads. This
   * producer records beam, bladeLength, bladeWidth, depth, draft, length,
   * mass.
   */
  export type Dimension = AutoMovieArchetypeBoat.Dimension;

  /**
   * The boat construction's contact set, which the rowing ride reads. This
   * producer builds bow, floor, gunwale, leftHandle, leftOar, leftOarlock,
   * rightHandle, rightOar, rightOarlock, stern, sternSeat, thwart0, thwart1.
   */
  export type Affordance = AutoMovieArchetypeBoat.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    AutoMovieArchetypeBoat.IParams,
    "id" | "draft"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
  }}
