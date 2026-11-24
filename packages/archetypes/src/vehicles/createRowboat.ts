import { type AutoMovieArchetype } from "../core";
import { BoatConstruction } from "./BoatConstruction";
import { BoatHull } from "./BoatHull";
import { BoatOars } from "./BoatOars";
import { createBoat } from "./createBoat";

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
export function createRowboat(
  params: createRowboat.IParams = {},
  seed?: number,
): AutoMovieArchetype<createRowboat.Affordance, createRowboat.Dimension> {
  return BoatConstruction("rowboat", params, seed, outfit);
}

/** Authoring options for {@link createRowboat}. */
export namespace createRowboat {
  /** The `model` choices this producer admits. */
  export type Model = "thamesSkiff" | "whitehallSkiff" | "whitehall17";

  /**
   * The boat construction's dimension set, which the rowing ride reads. This
   * producer records beam, bladeLength, bladeWidth, depth, draft, length,
   * mass.
   */
  export type Dimension = createBoat.Dimension;

  /**
   * The boat construction's contact set, which the rowing ride reads. This
   * producer builds bow, floor, gunwale, leftHandle, leftOar, leftOarlock,
   * rightHandle, rightOar, rightOarlock, stern, sternSeat, thwart0, thwart1.
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
