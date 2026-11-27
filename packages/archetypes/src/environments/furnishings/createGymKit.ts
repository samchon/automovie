import type { AutoMovieEnvironmentFurnishing } from "../AutoMovieEnvironmentFurnishing";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMoviePropBox,
} from "@automovie/interface";
import { AutoMovieArchetypeBench, AutoMovieArchetypeDumbbell } from "../../gym";
import { deriveArchetypeSeed } from "../../core/internal/deriveArchetypeSeed";
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
 */
export function createGymKit(
  params: AutoMovieEnvironmentFurnishing.IGymKitParams,
): IAutoMovieEnvironmentModule {
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const seed: number | undefined = context.seed;
    const bench: IAutoMovieModel = AutoMovieArchetypeBench.create(
      { kind: "flat" },
      seed === undefined ? undefined : deriveArchetypeSeed(seed, "bench"),
    );
    const dumbbell: IAutoMovieModel = AutoMovieArchetypeDumbbell.create(
      {},
      seed === undefined ? undefined : deriveArchetypeSeed(seed, "dumbbell"),
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
