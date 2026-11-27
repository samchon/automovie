import type { AutoMovieArchetypeEnvironmentFurnishing } from "../AutoMovieArchetypeEnvironmentFurnishing";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieFurnishingClearance,
  IAutoMovieModel,
  IAutoMoviePropBox,
} from "@automovie/interface";
import {
  AutoMovieArchetypeDrawerUnit,
  AutoMovieArchetypeHingedCabinet,
  AutoMovieArchetypePlatformBed,
} from "../../furniture";
import { deriveArchetypeSeed } from "../../core/internal/deriveArchetypeSeed";
import { ROOM_CLEARANCES } from "./ROOM_CLEARANCES";
import { furnishRoom } from "./furnishRoom";

/*
 * Furnish a bedroom: a bed with its head centred on the `-z` wall, and a
 * wardrobe and a chest on the `+z` wall facing the bed's foot.
 *
 * The roles are `bed`, `wardrobe` and `chest`; each producer affordance is
 * `<role>/<affordance id>`, such as `bed/surface`. The bed keeps the clear
 * floor of ROOM_CLEARANCES.bedSide beside both long sides, the 2010 ADA
 * Standards' parallel approach of 806.2.3, named `left side` and `right side`.
 * The wardrobe starts at the `+z` wall's run corner and the chest follows it
 * `chestGap` metres along the run; each keeps the forward-approach clear floor
 * of ROOM_CLEARANCES.clearFloor in front, named `forward approach`. A
 * room narrower than the bed plus both side clearances is refused naming the
 * bed's side clearance, and one shallower than the bed plus the wardrobe and
 * its clear floor is refused naming the wardrobe. The figures are a coarse
 * layout rule, not an accessibility or code compliance claim.
 * Parameter params: The room layout, the bed size and the wardrobe-to-chest gap.
 * Returns: The placed-room module.
 * When a piece or clearance leaves the room or overlaps another piece,
 * clearance or `keepClear` area, naming the role and clearance.
 */
export function createBedroomKit(
  params: AutoMovieArchetypeEnvironmentFurnishing.IBedroomKitParams,
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
    const chestGap: number = params.chestGap ?? defaultGap;
    if (!(chestGap >= 0))
      throw new Error(
        `${context.id} chestGap needs a finite nonnegative distance: ${chestGap}`,
      );
    const bed: IAutoMovieModel = AutoMovieArchetypePlatformBed.create(
      { kind: params.bed ?? "double" },
      draw("bed"),
    );
    const wardrobe: IAutoMovieModel = AutoMovieArchetypeHingedCabinet.create(
      { kind: "wardrobe" },
      draw("wardrobe"),
    );
    const chest: IAutoMovieModel = AutoMovieArchetypeDrawerUnit.create(
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
            offset: (params.room.width - (bedBox.max.x - bedBox.min.x)) / 2,
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
