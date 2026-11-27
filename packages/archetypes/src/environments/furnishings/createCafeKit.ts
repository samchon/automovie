import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieFurnishingLayout,
  IAutoMovieModel,
  IAutoMoviePropBox,
} from "@automovie/interface";

import { deriveArchetypeSeed } from "../../core/internal/deriveArchetypeSeed";
import { AutoMovieArchetypeSeat } from "../../furniture/AutoMovieArchetypeSeat";
import { AutoMovieArchetypeTable } from "../../furniture/AutoMovieArchetypeTable";
import { furnishRoom } from "./furnishRoom";

/**
 * Furnish a room with a service counter and dining groups of one table and two
 * chairs.
 *
 * Place the kit at the centre of a floor with its local +Z facing customers
 * from the service counter. Name a role as `counter`, `table-1`,
 * `table-1/chair-near` on +Z or `table-1/chair-far` on -Z. Append the prop's
 * native affordance id to place or address a contact. For example,
 * `table-1/stack` is the support for a cup and `table-1/chair-near/seat` is a
 * sitting contact. The grid, aisle and approach reservations remain in the room
 * frame when the room is rotated.
 *
 * @param params The room layout and positive number of dining tables.
 * @returns The placed-room module, with both stage nodes and prop claims.
 * @throws When the room cannot accommodate the tables and clear approaches.
 */
export function createCafeKit(
  params: createCafeKit.IParams,
): IAutoMovieEnvironmentModule {
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const seed: number | undefined = context.seed;
    const counter: IAutoMovieModel = AutoMovieArchetypeTable.create(
      { kind: "serviceCounter" },
      seed === undefined ? undefined : deriveArchetypeSeed(seed, "counter"),
    );
    const table: IAutoMovieModel = AutoMovieArchetypeTable.create(
      { kind: "dining" },
      seed === undefined ? undefined : deriveArchetypeSeed(seed, "table"),
    );
    const chair: IAutoMovieModel = AutoMovieArchetypeSeat.create(
      { kind: "dining" },
      seed === undefined ? undefined : deriveArchetypeSeed(seed, "chair"),
    );
    const counterBox: IAutoMoviePropBox = furnishRoom.measure(counter);
    const tableBox: IAutoMoviePropBox = furnishRoom.measure(table);
    const chairBox: IAutoMoviePropBox = furnishRoom.measure(chair);
    return furnishRoom(context, {
      layout: params,
      pieces: {
        // The counter centred on the back wall, with an approach as deep as
        // the aisle and at least as wide across its service side.
        counter: {
          model: counter,
          bounds: counterBox,
          place: {
            kind: "wall",
            wall: "-z",
            offset:
              (params.room[0] - (counterBox.max.x - counterBox.min.x)) / 2,
          },
          clear: [{ depth: params.aisle ?? furnishRoom.DEFAULT_AISLE }],
        },
      },
      grid: {
        count: params.tables,
        capacity: "tables",
        prefix: "table",
        group: [
          { role: "", model: table, bounds: tableBox, x: 0, z: 0, heading: 0 },
          {
            role: "chair-near",
            model: chair,
            bounds: chairBox,
            x: 0,
            z: tableBox.max.z + chairBox.max.z,
            heading: 180,
          },
          {
            role: "chair-far",
            model: chair,
            bounds: chairBox,
            x: 0,
            z: tableBox.min.z - chairBox.max.z,
            heading: 0,
          },
        ],
      },
    });
  };
}

/** Types of the cafe kit producer. */
export namespace createCafeKit {
  /** The room layout and the positive integer count of the kit's repeated group. */
  export interface IParams extends IAutoMovieFurnishingLayout {
    /** Positive integer count of dining groups. */
    readonly tables: number;
  }
}
