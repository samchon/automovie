import { type AutoMovieArchetype } from "../core";
import { BoatConstruction } from "./BoatConstruction";
import { BoatHull } from "./BoatHull";
import { BoatOars } from "./BoatOars";
import { createBoat } from "./createBoat";

/**
 * Fixed-seat rowboat.
 *
 * The hull floats at its waterline with its bow along +Z. The rowing thwart faces aft and its paired oars sit in articulated locks.
 *
 * @param params The scene identity and this hull's accepted dimensions and catalogue choices.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile cannot use.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the waterline frame and its working seats.
 * @evidence contracts/development/implementation.md#principled-implementation Builds the shared hull before fitting this boat's thwarts and model-space working contacts.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Keeps the hull shared and assembles this boat's interior in its own function.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the measured or explicitly provisional figures recorded by the geometry owner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds the selected profile once.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the legacy draw and the profile's parts and frames.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs or resources.
 */
export function createRowboat(
  params: createRowboat.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createRowboat.Affordance, createRowboat.Dimension> {
  return BoatConstruction("rowboat", params, seed, outfit);
}

/**
 * Authoring options for {@link createRowboat}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the options of this form.
 * @evidence contracts/development/design.md#principled-representation Uses the shared model identity and only the dimensions or catalogue selectors this form admits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The producer supplies the fixed operating form.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the original typed dimensions and retains runtime admission.
 */
export namespace createRowboat {
  /** The `model` choices this producer admits. */
  export type Model = "thamesSkiff" | "whitehallSkiff" | "whitehall17";

  /**
   * The boat construction's dimension set, which the rowing ride reads. This producer records beam, bladeLength, bladeWidth, depth, draft, length, mass.
   */
  export type Dimension = createBoat.Dimension;

  /**
   * The boat construction's contact set, which the rowing ride reads. This producer builds bow, floor, gunwale, leftHandle, leftOar, leftOarlock, rightHandle, rightOar, rightOarlock, stern, sternSeat, thwart0, thwart1.
   */
  export type Affordance = createBoat.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<createBoat.IParams, "id" | "draft"> {
    /** A model from this form's catalogue. */
    model?: Model;
  }
}

/** Record this hull's fixed seats and articulated rowing station. */
function outfit(
  builder: Parameters<BoatConstruction.Outfit>[0],
  { d, length, beam, gunwale, stern }: BoatConstruction.IHull,
): void {
  const e: typeof createBoat.ESTIMATES = createBoat.ESTIMATES;
  const span: number = beam;
  const pivot: number = gunwale + createBoat.LOCK;
  const seat: number = pivot - BoatOars.HEIGHT * span;
  const aft: number = BoatOars.AFT * span;
  // The rowing station's height comes from the oarlock geometry rather
  // than chair ergonomics. Its rower's joints admit the working seat.
  BoatHull.thwart(
    builder,
    "thwart0",
    seat,
    aft,
    beam * e.seats.rowing,
    -1,
    true,
  );
  BoatHull.thwart(
    builder,
    "thwart1",
    seat,
    aft + createBoat.ROWBOAT.forward,
    beam * e.seats.forward,
    -1,
  );
  BoatHull.thwart(
    builder,
    "sternSeat",
    seat,
    -length / 2 + createBoat.ROWBOAT.stern,
    2 * stern,
    1,
  );
  BoatOars.build(builder, d);
}
