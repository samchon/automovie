import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieFurnishingClearance,
  IAutoMovieFurnishingLayout,
  IAutoMovieModel,
  IAutoMoviePropBox,
} from "@automovie/interface";

import { createDrawerUnit } from "../../furniture/createDrawerUnit";
import { createHingedCabinet } from "../../furniture/createHingedCabinet";
import { createPlatformBed } from "../../furniture/createPlatformBed";
import { ROOM_CLEARANCES } from "./ROOM_CLEARANCES";
import { furnishRoom } from "./furnishRoom";

/**
 * Furnish a bedroom: a bed with its head centred on the `-z` wall, and a
 * wardrobe and a chest on the `+z` wall facing the bed's foot.
 *
 * The roles are `bed`, `wardrobe` and `chest`; each producer affordance is
 * `<role>/<affordance id>`, such as `bed/surface`. The bed keeps the clear
 * floor of {@link ROOM_CLEARANCES}.bedSide beside both long sides, the 2010 ADA
 * Standards' parallel approach of 806.2.3, named `left side` and `right side`.
 * The wardrobe starts at the `+z` wall's run corner and the chest follows it
 * `chestGap` metres along the run; each keeps the forward-approach clear floor
 * of {@link ROOM_CLEARANCES}.clearFloor in front, named `forward approach`. A
 * room narrower than the bed plus both side clearances is refused naming the
 * bed's side clearance, and one shallower than the bed plus the wardrobe and
 * its clear floor is refused naming the wardrobe. The figures are a coarse
 * layout rule, not an accessibility or code compliance claim.
 *
 * @param params The room layout, the bed size and the wardrobe-to-chest gap.
 * @returns The placed-room module.
 * @throws When a piece or clearance leaves the room or overlaps another piece,
 *   clearance or `keepClear` area, naming the role and clearance.
 */
export function createBedroomKit(
  params: createBedroomKit.IParams,
): IAutoMovieEnvironmentModule {
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const seed: string | undefined = context.seed;
    const draw: (role: string) => string | undefined = (
      role: string,
    ): string | undefined =>
      seed === undefined ? undefined : `${seed}/${role}`;
    const chestGap: number = params.chestGap ?? createBedroomKit.CHEST_GAP;
    if (!(Number.isFinite(chestGap) && chestGap >= 0))
      throw new Error(
        `${context.id} chestGap needs a finite nonnegative distance: ${chestGap}`,
      );
    const bed: IAutoMovieModel = createPlatformBed(
      { kind: params.bed ?? "double" },
      draw("bed"),
    );
    const wardrobe: IAutoMovieModel = createHingedCabinet(
      { kind: "wardrobe" },
      draw("wardrobe"),
    );
    const chest: IAutoMovieModel = createDrawerUnit(
      { kind: "chest" },
      draw("chest"),
    );
    const bedBox: IAutoMoviePropBox = furnishRoom.measure(bed);
    const side: (which: "left" | "right") => IAutoMovieFurnishingClearance = (
      which: "left" | "right",
    ): IAutoMovieFurnishingClearance => ({
      side: which,
      name: `${which} side`,
      depth: ROOM_CLEARANCES.bedSide.depth,
      width: ROOM_CLEARANCES.bedSide.width!,
    });
    const front: IAutoMovieFurnishingClearance = {
      name: "forward approach",
      depth: ROOM_CLEARANCES.clearFloor.depth,
      width: ROOM_CLEARANCES.clearFloor.width!,
    };
    return furnishRoom(context, {
      layout: params,
      pieces: {
        bed: {
          model: bed,
          bounds: bedBox,
          place: {
            kind: "wall",
            wall: "-z",
            offset: (params.room[0] - (bedBox.max.x - bedBox.min.x)) / 2,
          },
          clear: [side("left"), side("right")],
        },
        wardrobe: {
          model: wardrobe,
          bounds: furnishRoom.measure(wardrobe),
          place: { kind: "wall", wall: "+z" },
          clear: [front],
        },
        chest: {
          model: chest,
          bounds: furnishRoom.measure(chest),
          place: { kind: "wall", wall: "+z", after: "wardrobe", gap: chestGap },
          clear: [front],
        },
      },
    });
  };
}

/** The bedroom kit's parameters and its default wardrobe-to-chest gap. */
export namespace createBedroomKit {
  /**
   * The default gap in metres between the wardrobe and the chest: an authored
   * layout default.
   */
  export const CHEST_GAP: number = 0.1;

  /** The room layout, the bed size and the wardrobe-to-chest gap. */
  export interface IParams extends IAutoMovieFurnishingLayout {
    /** The household bed size. The default is `"double"`. */
    readonly bed?: "single" | "double";

    /**
     * Gap in metres between the wardrobe's and the chest's boxes along the `+z`
     * wall. The default is {@link CHEST_GAP}.
     */
    readonly chestGap?: number;
  }
}
