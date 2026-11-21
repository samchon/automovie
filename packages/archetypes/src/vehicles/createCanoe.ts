import { type Archetype } from "../core";
import { BoatConstruction } from "./BoatConstruction";
import { BoatHull } from "./BoatHull";
import { createBoat } from "./createBoat";

/**
 * Tandem canoe.
 *
 * The bow points along +Z at the waterline. Both thwarts face forward for paddlers and the hull is drawn from its selected layup.
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
export function createCanoe(
  params: createCanoe.IParams = {},
  seed?: number | string,
): Archetype<createCanoe.Affordance, createCanoe.Dimension> {
  return BoatConstruction("canoe", params, seed, outfit);
}

/**
 * Authoring options for {@link createCanoe}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createCanoe {
  /** The `model` choices this producer admits. */
  export type Model =
    | "prospector16"
    | "discovery169"
    | "spiritII"
    | "minnesotaII";

  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "beam"
    | "depth"
    | "endHeight"
    | "length"
    | "mass"
    | "seatHeight";

  /**
   * The createBoat contact set its shared construction types. This producer builds bow, floor, gunwale, stern, thwart0, thwart1.
   */
  export type Affordance = createBoat.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    createBoat.IParams,
    "id" | "seatHeight"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
    /** One of the selected hull model's documented layups. */
    layup?: createBoat.Layup;
  }
}

/** Record this hull's fixed seats. */
function outfit(
  builder: Parameters<BoatConstruction.Outfit>[0],
  { d, beam, bottom }: BoatConstruction.IHull,
): void {
  const e: typeof createBoat.ESTIMATES = createBoat.ESTIMATES;
  const seat: number = bottom + d.seatHeight!;
  BoatHull.thwart(
    builder,
    "thwart0",
    seat,
    createBoat.CANOE.bow,
    beam * e.seats.canoeBow,
    1,
  );
  BoatHull.thwart(
    builder,
    "thwart1",
    seat,
    -createBoat.CANOE.stern,
    beam * e.seats.canoeStern,
    1,
  );
}
