import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieFurnishingLayout,
  IAutoMovieModel,
  IAutoMoviePropBox,
} from "@automovie/interface";

import { createSeat } from "../../furniture/createSeat";
import { createTable } from "../../furniture/createTable";
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
 * @evidence contracts/development/common.md#meaningful-documentation States room orientation, defaults through the shared layout, count, role paths, returned records and placement refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Uses the measured local extents of a service counter, dining table and dining seat. Two chairs face inward with their front of occupancy at the table's two Z edges. The counter is a wall piece centred on the -Z wall, and its front clearance, as deep as the aisle, reserves its approach.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Chooses the reusable models and local dining arrangement. FurnishRoom owns fit, grid placement and transformed model/prop/anchor emission.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Capacity and scene clearances are supplied and checked per room. Counter and chairs use their native contact records. The grid and default aisle describe a coarse layout rather than a guarantee of accessibility.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds and measures three model prototypes once per occurrence. Work per repeated table follows the shared room planner and is bounded by the requested population and candidate grid size.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work All dining groups in an occurrence share the table and chair draw and their extents while retaining distinct prop ids and transforms. The optional occurrence seed is separated by prototype role.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The module captures the room parameters only. Model prototypes and planner allocations belong to one call and survive only where the emitted stage records use them.
 */
export function createCafeKit(
  params: createCafeKit.IParams,
): IAutoMovieEnvironmentModule {
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const seed: string | undefined = context.seed;
    const counter: IAutoMovieModel = createTable(
      { kind: "serviceCounter" },
      seed === undefined ? undefined : `${seed}/counter`,
    );
    const table: IAutoMovieModel = createTable(
      { kind: "dining" },
      seed === undefined ? undefined : `${seed}/table`,
    );
    const chair: IAutoMovieModel = createSeat(
      { kind: "dining" },
      seed === undefined ? undefined : `${seed}/chair`,
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

/**
 * Types of the cafe kit producer.
 */
export namespace createCafeKit {
  /** The room layout and the positive integer count of the kit's repeated group. */
  export interface IParams extends IAutoMovieFurnishingLayout {
    /** Positive integer count of dining groups. */
    readonly tables: number;
  }
}
