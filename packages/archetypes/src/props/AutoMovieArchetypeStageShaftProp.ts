import { type AutoMovieArchetype } from "../core/index";
import { createStageShaftProp as createStageShaftPropImplementation } from "./internal/createStageShaftProp";
import { type AutoMovieArchetypeStageWeaponProp } from "./AutoMovieArchetypeStageWeaponProp";

/** Public operations for Auto Movie Archetype Stage Shaft Prop. */
export namespace AutoMovieArchetypeStageShaftProp {
  /**
   * Padded shaft stage prop.
   *
   * A digital upright shaft with a solid padded outline and one primary grip for
   * actor posing.
   *
   * @param params The scene identity and optional total display height in metres,
   *   with a choice of profile.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params: AutoMovieArchetypeStageShaftProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageShaftProp.Affordance,
  AutoMovieArchetypeStageShaftProp.Dimension
> {
    return createStageShaftPropImplementation(params, seed);
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
  export type Affordance = AutoMovieArchetypeStageWeaponProp.Affordance;

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = ["pike", "shuo", "halberd"] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    AutoMovieArchetypeStageWeaponProp.IParams,
    "id" | "height"
  > {
    /** The profile with the required outline. */
    kind: Kind;
  }}
