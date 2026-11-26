import { type AutoMovieArchetype } from "../core/index";
import { createStageLinkedProp as createStageLinkedPropImplementation } from "./internal/createStageLinkedProp";
import { type createStageWeaponProp } from "./createStageWeaponProp";

/** Public operations for Auto Movie Archetype Stage Linked Prop. */
export namespace AutoMovieArchetypeStageLinkedProp {
  /**
   * Padded linked stage ornament.
   *
   * A shaft and visibly jointed distal ornament with a grip, hinge, and following
   * end mark.
   *
   * @param params The scene identity and optional total display height in metres.
   * @param seed Uses the original named draw session to resolve omitted settings.
   * @returns The digital model and its authored contact frames.
   * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
   *   cannot use.
   */
  export function create(params?: AutoMovieArchetypeStageLinkedProp.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeStageLinkedProp.Affordance,
  AutoMovieArchetypeStageLinkedProp.Dimension
> {
    return createStageLinkedPropImplementation(params, seed);
  }

  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "height";

  /**
   * The createStageWeaponProp contact set its shared construction types. This
   * producer builds end, grip, link.
   */
  export type Affordance = createStageWeaponProp.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<createStageWeaponProp.IParams, "id" | "height">;}
