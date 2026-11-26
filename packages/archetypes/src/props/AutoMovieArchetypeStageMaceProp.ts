import { type AutoMovieArchetype } from "../core/index";
import { createStageMaceProp as createStageMacePropImplementation } from "./internal/createStageMaceProp";
import { type createStageWeaponProp } from "./createStageWeaponProp";

/** Public operations for Auto Movie Archetype Stage Mace Prop. */
export namespace AutoMovieArchetypeStageMaceProp {
  /**
   * Padded round-headed stage prop.
   *
   * A display form with a round ornament above a one-hand shaft grip. Its origin
   * is at the shaft base.
   *
   * @param params The scene identity and optional total display height in metres.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageMaceProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageMaceProp.Affordance,
  AutoMovieArchetypeStageMaceProp.Dimension
> {
    return createStageMacePropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height";

  /**
   * The createStageWeaponProp contact set its shared construction types. This
   * producer builds grip.
   */
  export type Affordance = createStageWeaponProp.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageWeaponProp.IParams, "id" | "height">;}
