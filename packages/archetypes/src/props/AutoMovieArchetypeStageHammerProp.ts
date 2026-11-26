import { type AutoMovieArchetype } from "../core/index";
import { createStageHammerProp as createStageHammerPropImplementation } from "./internal/createStageHammerProp";
import { type createStageWeaponProp } from "./createStageWeaponProp";

/** Public operations for Auto Movie Archetype Stage Hammer Prop. */
export namespace AutoMovieArchetypeStageHammerProp {
  /**
   * Padded offset stage hammer.
   *
   * A digital asymmetrical block marks the visible face above one hand contact.
   * Display height is along +Y.
   *
   * @param params The scene identity and optional total display height in metres.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageHammerProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageHammerProp.Affordance,
  AutoMovieArchetypeStageHammerProp.Dimension
> {
    return createStageHammerPropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height";

  /**
   * The createStageWeaponProp contact set its shared construction types. This
   * producer builds face, grip.
   */
  export type Affordance = createStageWeaponProp.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageWeaponProp.IParams, "id" | "height">;}
