import type { AutoMovieEnvironmentFurnishing } from "../AutoMovieEnvironmentFurnishing";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMovieFurnishingRoomSize,
} from "@automovie/interface";
import {
  AutoMovieArchetypeBookcase,
  AutoMovieArchetypeSeat,
  AutoMovieArchetypeTable,
} from "../../furniture";
import { deriveArchetypeSeed } from "../../core/internal/deriveArchetypeSeed";
import { furnishRoom } from "./furnishRoom";

/**
 * Furnish a living room: a sofa centred on the `-z` wall, a coffee table facing
 * it, two armchairs facing the sofa across the table and a bookcase centred on
 * the `-x` wall.
 *
 * The roles are `sofa`, `coffee`, `armchair-left` (on the sofa's local -X
 * side), `armchair-right` and `bookcase`; each producer affordance is
 * `<role>/<affordance id>`, such as `sofa/seat`. The coffee table stands
 * `tableGap` metres of clear floor out from the sofa's front face, centred on
 * it. Each armchair faces the sofa with its front face `tableGap` beyond the
 * table's far face, and the two stand `tableGap` apart, centred on the sofa.
 * The room is measured from its floor centre and follows the kit's placement
 * frame. No clearance is cited: no published standard read for this kit gives a
 * distance between a sofa and a coffee table.
 *
 * @param params The room layout and the sofa-to-table gap.
 * @returns The placed-room module.
 * @throws When a piece leaves the room or overlaps another piece or a
 *   `keepClear` area, naming the role.
 */
export function createLivingRoomKit(
  params: AutoMovieEnvironmentFurnishing.ILivingRoomKitParams,
  defaultGap: number,
): IAutoMovieEnvironmentModule {
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const seed: number | undefined = context.seed;
    const draw: (role: string) => number | undefined = (
      role: string,
    ): number | undefined =>
      seed === undefined ? undefined : deriveArchetypeSeed(seed, role);
    const gap: number = params.tableGap ?? defaultGap;
    if (!(gap >= 0))
      throw new Error(
        `${context.id} tableGap needs a finite nonnegative distance: ${gap}`,
      );
    const sofa: IAutoMovieModel = AutoMovieArchetypeSeat.create(
      { kind: "sofa" },
      draw("sofa"),
    );
    const coffee: IAutoMovieModel = AutoMovieArchetypeTable.create(
      { kind: "coffee" },
      draw("coffee"),
    );
    const armchair: IAutoMovieModel = AutoMovieArchetypeSeat.create(
      { kind: "armchair" },
      draw("armchair"),
    );
    const bookcase: IAutoMovieModel = AutoMovieArchetypeBookcase.create(
      {},
      draw("bookcase"),
    );
    const sofaBox: IAutoMoviePropBox = furnishRoom.measure(sofa);
    const coffeeBox: IAutoMoviePropBox = furnishRoom.measure(coffee);
    const armchairBox: IAutoMoviePropBox = furnishRoom.measure(armchair);
    const bookcaseBox: IAutoMoviePropBox = furnishRoom.measure(bookcase);
    const { width, depth }: IAutoMovieFurnishingRoomSize = params.room;

    // The armchairs' front faces stand past the table's far face, and their
    // boxes sit side by side with `gap` between them.
    const across: number = gap + (coffeeBox.max.z - coffeeBox.min.z) + gap;
    const beside: number = (armchairBox.max.x - armchairBox.min.x + gap) / 2;
    return furnishRoom(context, {
      layout: params,
      pieces: {
        sofa: {
          model: sofa,
          bounds: sofaBox,
          place: {
            kind: "wall",
            wall: "-z",
            offset: (width - (sofaBox.max.x - sofaBox.min.x)) / 2,
          },
        },
        coffee: {
          model: coffee,
          bounds: coffeeBox,
          place: { kind: "facing", target: "sofa", distance: gap },
        },
        "armchair-left": {
          model: armchair,
          bounds: armchairBox,
          place: {
            kind: "facing",
            target: "sofa",
            distance: across,
            offset: -beside,
          },
        },
        "armchair-right": {
          model: armchair,
          bounds: armchairBox,
          place: {
            kind: "facing",
            target: "sofa",
            distance: across,
            offset: beside,
          },
        },
        bookcase: {
          model: bookcase,
          bounds: bookcaseBox,
          place: {
            kind: "wall",
            wall: "-x",
            offset: (depth - (bookcaseBox.max.x - bookcaseBox.min.x)) / 2,
          },
        },
      },
    });
  };
}
