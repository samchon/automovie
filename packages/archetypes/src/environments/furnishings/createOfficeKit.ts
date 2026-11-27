import type { AutoMovieEnvironmentFurnishing } from "../AutoMovieEnvironmentFurnishing";
import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieModel,
  IAutoMoviePropBox,
} from "@automovie/interface";
import {
  AutoMovieArchetypeBookcase,
  AutoMovieArchetypeDrawerUnit,
  AutoMovieArchetypeSeat,
  AutoMovieArchetypeTable,
} from "../../furniture";
import { deriveArchetypeSeed } from "../../core/internal/deriveArchetypeSeed";
import { ROOM_CLEARANCES } from "./ROOM_CLEARANCES";
import { furnishRoom } from "./furnishRoom";

/*
 * Furnish an office: repeated desks, each with an office chair facing it, on
 * the room's grid, a filing cabinet on the `-x` wall and a bookcase on the `+x`
 * wall.
 *
 * The roles are `filing`, `bookcase`, `desk-1`, `desk-1/chair` and so on for
 * each desk; each producer affordance is `<role>/<affordance id>`, such as
 * `desk-1/chair/seat`. Each chair stands on its desk's local +Z side, turned to
 * face the desk, with its front at the desk's edge. The filing cabinet stands
 * near the `-x` wall's run corner, as far from it as its clear floor overhangs
 * the cabinet, and keeps the forward-approach clear floor of
 * ROOM_CLEARANCES.clearFloor in front, named `forward approach`; the
 * bookcase starts at the `+x` wall's run corner. The desk groups take the first
 * grid slots clear of both and of that clearance. The figure is a coarse layout
 * rule, not an accessibility claim.
 * Parameter params: The room layout and the positive number of desks.
 * Returns: The placed-room module.
 * When a piece or clearance leaves the room or overlaps, or the desks
 * do not fit, naming the role or the `desks` count.
 */
export function createOfficeKit(
  params: AutoMovieEnvironmentFurnishing.IOfficeKitParams,
): IAutoMovieEnvironmentModule {
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const seed: number | undefined = context.seed;
    const draw: (role: string) => number | undefined = (
      role: string,
    ): number | undefined =>
      seed === undefined ? undefined : deriveArchetypeSeed(seed, role);
    const desk: IAutoMovieModel = AutoMovieArchetypeTable.create(
      { kind: "desk" },
      draw("desk"),
    );
    const chair: IAutoMovieModel = AutoMovieArchetypeSeat.create(
      { kind: "office" },
      draw("chair"),
    );
    const filing: IAutoMovieModel = AutoMovieArchetypeDrawerUnit.create(
      { kind: "filingCabinet" },
      draw("filing"),
    );
    const bookcase: IAutoMovieModel = AutoMovieArchetypeBookcase.create(
      {},
      draw("bookcase"),
    );
    const deskBox: IAutoMoviePropBox = furnishRoom.measure(desk);
    const chairBox: IAutoMoviePropBox = furnishRoom.measure(chair);
    const filingBox: IAutoMoviePropBox = furnishRoom.measure(filing);
    const approach: number = ROOM_CLEARANCES.clearFloor.width!;

    // A clear floor wider than the cabinet overhangs it equally on both sides,
    // so the cabinet stands that overhang from the corner.
    const overhang: number = Math.max(
      0,
      (approach - (filingBox.max.x - filingBox.min.x)) / 2,
    );
    return furnishRoom(context, {
      layout: params,
      pieces: {
        filing: {
          model: filing,
          bounds: filingBox,
          place: { kind: "wall", wall: "-x", offset: overhang },
          clear: [
            {
              name: "forward approach",
              depth: ROOM_CLEARANCES.clearFloor.depth,
              width: approach,
            },
          ],
        },
        bookcase: {
          model: bookcase,
          bounds: furnishRoom.measure(bookcase),
          place: { kind: "wall", wall: "+x" },
        },
      },
      grid: {
        count: params.desks,
        capacity: "desks",
        prefix: "desk",
        group: [
          { role: "", model: desk, bounds: deskBox, x: 0, z: 0, heading: 0 },
          {
            role: "chair",
            model: chair,
            bounds: chairBox,
            x: 0,
            z: deskBox.max.z + chairBox.max.z,
            heading: 180,
          },
        ],
      },
    });
  };
}
