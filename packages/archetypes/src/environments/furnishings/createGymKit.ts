import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieFurnishingLayout,
  IAutoMovieModel,
  IAutoMoviePropBox,
} from "@automovie/interface";

import { createBench } from "../../gym/createBench";
import { createDumbbell } from "../../gym/createDumbbell";
import { furnishRoom } from "./furnishRoom";

/**
 * Furnish a room with bench and free-weight stations.
 *
 * Each station has one bench and one dumbbell on each side, resting on the
 * floor. A bench's +Z end faces its seated approach. Use `bench-1/seat` for a
 * sitting contact and `bench-1/dumbbell-left/grip` to aim at a weight. Left
 * means +X for a person facing local +Z. The room layout is measured from the
 * floor centre and follows the kit's placement frame.
 *
 * @param params The useful room layout and positive number of stations.
 * @returns The placed-room module, with stage nodes and operative prop records.
 * @throws When the requested stations or their clearances do not fit.
 * @evidence contracts/development/common.md#meaningful-documentation States the room origin, orientation, bench and weight roles, attached contact paths and failure condition.
 * @evidence contracts/development/implementation.md#principled-implementation Positions the measured rest boxes of flat benches and dumbbells. The two weights stand alongside a bench without crossing its sides. FurnishRoom uses the lowest rest extent on Y to place each model on the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Chooses the room's two model prototypes and their group relationship. Common layout and prop instantiation stay in furnishRoom.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The station does not claim movement or manufacturer clearances for training equipment. Capacity, useful aisle and approach reservations are checked by the shared planner.
 * @evidence contracts/development/implementation.md#efficient-algorithms Builds and measures two model prototypes once per occurrence. Cost then follows the shared room planner's candidate and requested population sizes.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Each occurrence shares a bench prototype and a dumbbell prototype across its stations. Instance ids and transforms remain distinct.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned module keeps the layout parameters. Each call owns its model draws and emits a population bounded by the requested stations. It owns no external resources.
 */
export function createGymKit(
  params: createGymKit.IParams,
): IAutoMovieEnvironmentModule {
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const seed: string | undefined = context.seed;
    const bench: IAutoMovieModel = createBench(
      { kind: "flat" },
      seed === undefined ? undefined : `${seed}/bench`,
    );
    const dumbbell: IAutoMovieModel = createDumbbell(
      {},
      seed === undefined ? undefined : `${seed}/dumbbell`,
    );
    const benchBox: IAutoMoviePropBox = furnishRoom.measure(bench);
    const weightBox: IAutoMoviePropBox = furnishRoom.measure(dumbbell);
    return furnishRoom(context, {
      layout: params,
      grid: {
        count: params.stations,
        capacity: "stations",
        prefix: "bench",
        group: [
          { role: "", model: bench, bounds: benchBox, x: 0, z: 0, heading: 0 },
          {
            role: "dumbbell-left",
            model: dumbbell,
            bounds: weightBox,
            x: benchBox.max.x - weightBox.min.x,
            z: 0,
            heading: 0,
          },
          {
            role: "dumbbell-right",
            model: dumbbell,
            bounds: weightBox,
            x: benchBox.min.x - weightBox.max.x,
            z: 0,
            heading: 0,
          },
        ],
      },
    });
  };
}

/** Types of the gym kit producer. */
export namespace createGymKit {
  /** The room layout and the positive integer count of the kit's repeated group. */
  export interface IParams extends IAutoMovieFurnishingLayout {
    /** Positive integer count of free-weight stations. */
    readonly stations: number;
  }
}
