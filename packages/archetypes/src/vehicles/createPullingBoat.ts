import { type AutoMovieArchetype } from "../core";
import { AutoMovieArchetypeBoat } from "./AutoMovieArchetypeBoat";
import { BoatConstruction } from "./BoatConstruction";
import { BoatHull } from "./BoatHull";

/**
 * Pulling boat.
 *
 * A launch hull with five fixed thwarts facing aft. The waterline origin and
 * bow along +Z define its boarding and crew frame.
 *
 * @param params The scene identity and this hull's accepted dimensions and
 *   catalogue choices.
 * @param seed Uses the original named draw session to resolve omitted settings.
 * @returns The digital model and its authored contact frames.
 * @throws {AutoMovieArchetypeRefusal} For inputs the selected catalogue profile
 *   cannot use.
 */
export function createPullingBoat(
  params: createPullingBoat.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createPullingBoat.Affordance,
  createPullingBoat.Dimension
> {
  return BoatConstruction("launch", params, seed, outfit);
}

/** Authoring options for {@link createPullingBoat}. */
export namespace createPullingBoat {
  /**
   * The boat construction's dimension set, which the rowing ride reads. This
   * producer records beam, depth, length, mass.
   */
  export type Dimension = AutoMovieArchetypeBoat.Dimension;

  /**
   * The AutoMovieArchetypeBoat contact set its shared construction types. This
   * producer builds bow, floor, gunwale, stern, thwart0, thwart1, thwart2,
   * thwart3, thwart4.
   */
  export type Affordance = AutoMovieArchetypeBoat.Affordance;

  /** The model identity, dimensions. */
  export type IParams = Pick<
    AutoMovieArchetypeBoat.IParams,
    "id" | "length" | "beam" | "depth" | "mass"
  >;
}

/** Record this hull's fixed seats. */
function outfit(
  builder: Parameters<BoatConstruction.Outfit>[0],
  { beam, gunwale }: BoatConstruction.IHull,
): void {
  const e: typeof AutoMovieArchetypeBoat.ESTIMATES =
    AutoMovieArchetypeBoat.ESTIMATES;
  const seat: number = gunwale - AutoMovieArchetypeBoat.LAUNCH.below;
  const thwarts: readonly AutoMovieArchetypeBoat.Affordance[] = [
    "thwart0",
    "thwart1",
    "thwart2",
    "thwart3",
    "thwart4",
  ];
  for (let k: number = 0; k < AutoMovieArchetypeBoat.LAUNCH.thwarts; k++)
    BoatHull.thwart(
      builder,
      thwarts[k]!,
      seat,
      (k - (AutoMovieArchetypeBoat.LAUNCH.thwarts - 1) / 2) *
        AutoMovieArchetypeBoat.LAUNCH.room -
        AutoMovieArchetypeBoat.THWART / 2,
      beam * e.seats.launch,
      -1,
    );
}
