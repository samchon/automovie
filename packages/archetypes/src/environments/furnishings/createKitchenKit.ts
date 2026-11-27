import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieFurnishingClearance,
  IAutoMovieFurnishingLayout,
  IAutoMovieModel,
  IAutoMoviePropBox,
} from "@automovie/interface";

import { AutoMovieArchetypeRange } from "../../architecture/AutoMovieArchetypeRange";
import { AutoMovieArchetypeRefrigerator } from "../../architecture/AutoMovieArchetypeRefrigerator";
import { deriveArchetypeSeed } from "../../core/deriveArchetypeSeed";
import { AutoMovieArchetypeTable } from "../../furniture/AutoMovieArchetypeTable";
import { ROOM_CLEARANCES } from "./ROOM_CLEARANCES";
import { furnishRoom } from "./furnishRoom";
import type { resolveFurnishingPieces } from "./resolveFurnishingPieces";

/**
 * Furnish a kitchen: one run along the `-z` wall of a refrigerator, a counter,
 * a range and a second counter, each abutting the one before.
 *
 * The roles are `refrigerator`, `counter-1`, `range` and `counter-2`; each
 * producer affordance is `<role>/<affordance id>`. The refrigerator starts at
 * the run's corner. Each counter and the range keeps the NKBA work aisle in
 * front of it, as wide as its own box and named `work aisle`:
 * {@link ROOM_CLEARANCES}.workAisle for one cook and
 * {@link ROOM_CLEARANCES}.sharedWorkAisle for two. A room too shallow for the
 * aisle is refused naming it. No archetype draws a kitchen sink, so the kit has
 * no sink role; a production that needs one adds a coarse form. The figures are
 * a coarse layout rule, not a code compliance claim.
 *
 * @param params The room layout and the number of cooks.
 * @returns The placed-room module.
 * @throws When the run leaves the room or its work aisle does not fit, naming
 *   the role and the work aisle, or when `cooks` is not 1 or 2.
 */
export function createKitchenKit(
  params: createKitchenKit.IParams,
): IAutoMovieEnvironmentModule {
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const cooks: number = params.cooks ?? 1;
    if (cooks !== 1 && cooks !== 2)
      throw new Error(`${context.id} cooks must be 1 or 2: ${cooks}`);
    const seed: number | undefined = context.seed;
    const draw: (role: string) => number | undefined = (
      role: string,
    ): number | undefined =>
      seed === undefined ? undefined : deriveArchetypeSeed(seed, role);
    const refrigerator: IAutoMovieModel = AutoMovieArchetypeRefrigerator.create(
      {},
      draw("refrigerator"),
    );
    const counter: IAutoMovieModel = AutoMovieArchetypeTable.create(
      { kind: "counter" },
      draw("counter"),
    );
    const range: IAutoMovieModel = AutoMovieArchetypeRange.create({}, draw("range"));
    const aisle: number = (
      cooks === 1 ? ROOM_CLEARANCES.workAisle : ROOM_CLEARANCES.sharedWorkAisle
    ).depth;

    // A run piece after the one before, keeping the work aisle across its own
    // front face.
    const work: (
      model: IAutoMovieModel,
      after: string,
    ) => resolveFurnishingPieces.IPiece = (
      model: IAutoMovieModel,
      after: string,
    ): resolveFurnishingPieces.IPiece => {
      const bounds: IAutoMoviePropBox = furnishRoom.measure(model);
      const clear: IAutoMovieFurnishingClearance = {
        name: "work aisle",
        depth: aisle,
        width: bounds.max.x - bounds.min.x,
      };
      return {
        model,
        bounds,
        place: { kind: "wall", wall: "-z", after },
        clear: [clear],
      };
    };
    return furnishRoom(context, {
      layout: params,
      pieces: {
        refrigerator: {
          model: refrigerator,
          bounds: furnishRoom.measure(refrigerator),
          place: { kind: "wall", wall: "-z" },
        },
        "counter-1": work(counter, "refrigerator"),
        range: work(range, "counter-1"),
        "counter-2": work(counter, "range"),
      },
    });
  };
}

/** The kitchen kit's parameters. */
export namespace createKitchenKit {
  /** The room layout and the number of cooks the work aisle serves. */
  export interface IParams extends IAutoMovieFurnishingLayout {
    /** One or two cooks, choosing the NKBA work aisle. The default is 1. */
    readonly cooks?: 1 | 2;
  }
}
