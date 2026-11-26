import { type AutoMovieArchetype } from "../core/index";
import { createStagePoleBladeProp as createStagePoleBladePropImplementation } from "./internal/createStagePoleBladeProp";
import { type createStageWeaponProp } from "./createStageWeaponProp";

/** Public operations for Auto Movie Archetype Stage Pole Blade Prop. */
export namespace AutoMovieArchetypeStagePoleBladeProp {
  /**
   * Padded pole-blade silhouette.
   *
   * Independent stage profiles share a shaft, two actor grip marks and visible
   * outline marks: the `tip`, the main `edge`, the `rear` back of that edge cell,
   * and the side blade's `side-edge`. The form stands along +Y from its origin.
   *
   * @param params The scene identity and optional total display height in metres,
   *   with a choice of profile.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params: AutoMovieArchetypeStagePoleBladeProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStagePoleBladeProp.Affordance,
  AutoMovieArchetypeStagePoleBladeProp.Dimension
> {
    return createStagePoleBladePropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height";

  /**
   * The createStageWeaponProp contact set its shared construction types. This
   * producer builds edge, grip, grip-lower, grip-upper, rear, shaft, side-edge,
   * tip.
   */
  export type Affordance = createStageWeaponProp.Affordance;

  /** Accepted profiles sharing this producer's geometry and actor contacts. */
  export const KINDS = [
    "longBlade",
    "crescentBlade",
    "sideBlade",
    "serpentBlade",
  ] as const;

  /** The selected profile within this form. */
  export type Kind = (typeof KINDS)[number];

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createStageWeaponProp.IParams,
    "id" | "height"
  > {
    /** The profile with the required outline. */
    kind: Kind;
  }}
