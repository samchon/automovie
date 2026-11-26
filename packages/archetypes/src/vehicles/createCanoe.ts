import { type AutoMovieArchetype } from "../core";
import { AutoMovieArchetypeBoat } from "./AutoMovieArchetypeBoat";
import { BoatConstruction } from "./BoatConstruction";
import { BoatHull } from "./BoatHull";

/**
 * Tandem canoe.
 *
 * The bow points along +Z at the waterline. Both thwarts face forward for
 * paddlers and the hull is drawn from its selected layup.
 *
 * @param params The scene identity and this hull's accepted dimensions and
 *   catalogue choices.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createCanoe(
  params: createCanoe.IParams = {},
  seed?: number,
): AutoMovieArchetype<createCanoe.Affordance, createCanoe.Dimension> {
  return BoatConstruction("canoe", params, seed, outfit);
}

/** Authoring options for {@link createCanoe}. */
export namespace createCanoe {
  /** The `model` choices this producer admits. */
  export type Model =
    | "prospector16"
    | "discovery169"
    | "spiritII"
    | "minnesotaII";

  /**
   * The boat construction's dimension set, which the rowing ride reads. This
   * producer records beam, depth, endHeight, length, mass, seatHeight.
   */
  export type Dimension = AutoMovieArchetypeBoat.Dimension;

  /**
   * The AutoMovieArchetypeBoat contact set its shared construction types. This
   * producer builds bow, floor, gunwale, stern, thwart0, thwart1.
   */
  export type Affordance = AutoMovieArchetypeBoat.Affordance;

  /** The model identity, dimensions and this form's catalogue choices. */
  export interface IParams extends Pick<
    AutoMovieArchetypeBoat.IParams,
    "id" | "seatHeight"
  > {
    /** A model from this form's catalogue. */
    model?: Model;
    /** One of the selected hull model's documented layups. */
    layup?: AutoMovieArchetypeBoat.Layup;
  }
}

/** Record this hull's fixed seats. */
function outfit(
  builder: Parameters<BoatConstruction.Outfit>[0],
  { d, beam, bottom }: BoatConstruction.IHull,
): void {
  const e: typeof AutoMovieArchetypeBoat.ESTIMATES =
    AutoMovieArchetypeBoat.ESTIMATES;
  const seat: number = bottom + d.seatHeight!;
  BoatHull.thwart(
    builder,
    "thwart0",
    seat,
    AutoMovieArchetypeBoat.CANOE.bow,
    beam * e.seats.canoeBow,
    1,
  );
  BoatHull.thwart(
    builder,
    "thwart1",
    seat,
    -AutoMovieArchetypeBoat.CANOE.stern,
    beam * e.seats.canoeStern,
    1,
  );
}
