import { type Archetype } from "../core";
import { BoatConstruction } from "./BoatConstruction";
import { BoatHull } from "./BoatHull";
import { createBoat } from "./createBoat";

/**
 * Pulling boat.
 *
 * A launch hull with five fixed thwarts facing aft. The waterline origin and bow along +Z define its boarding and crew frame.
 *
 * @param params The scene identity and this hull's accepted dimensions and catalogue choices.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {ArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the waterline frame and its working seats.
 * @evidence contracts/development/implementation.md#principled-implementation Builds the shared hull before fitting this boat's actual thwarts and model-space working contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps the hull shared and assembles this boat's interior in its own function.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createPullingBoat(
  params: createPullingBoat.IParams = {},
  seed?: number | string,
): Archetype<createPullingBoat.Affordance, createPullingBoat.Dimension> {
  return BoatConstruction("launch", params, seed, outfit);
}

/**
 * Authoring options for {@link createPullingBoat}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createPullingBoat {
  /**
   * The boat construction's dimension set, which the rowing ride reads. This producer records beam, depth, length, mass.
   */
  export type Dimension = createBoat.Dimension;

  /**
   * The createBoat contact set its shared construction types. This producer builds bow, floor, gunwale, stern, thwart0, thwart1, thwart2, thwart3, thwart4.
   */
  export type Affordance = createBoat.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    createBoat.IParams,
    "id" | "length" | "beam" | "depth" | "mass"
  >;
}

/** Record this hull's fixed seats. */
function outfit(
  builder: Parameters<BoatConstruction.Outfit>[0],
  { beam, gunwale }: BoatConstruction.IHull,
): void {
  const e: typeof createBoat.ESTIMATES = createBoat.ESTIMATES;
  const seat: number = gunwale - createBoat.LAUNCH.below;
  for (let k: number = 0; k < createBoat.LAUNCH.thwarts; k++)
    BoatHull.thwart(
      builder,
      `thwart${k}` as createBoat.Affordance,
      seat,
      (k - (createBoat.LAUNCH.thwarts - 1) / 2) * createBoat.LAUNCH.room -
        createBoat.THWART / 2,
      beam * e.seats.launch,
      -1,
    );
}
