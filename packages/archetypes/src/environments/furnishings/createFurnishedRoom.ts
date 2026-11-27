import type { AutoMovieEnvironmentFurnishing } from "../AutoMovieEnvironmentFurnishing";
import { furnishRoom } from "./furnishRoom";
import type { resolveFurnishingPieces } from "./resolveFurnishingPieces";

/**
 * Furnish a room by relations: pieces against walls, after one another along a
 * wall, facing an earlier piece, or at an absolute position.
 *
 * Place the module at the floor centre of the room, with walls at `x =
 * ±width/2` and `z = ±depth/2`. Each piece is measured from its model's rest
 * box, so a reseeded sofa that grows moves the end table placed after it and
 * keeps the coffee table facing it centred. Pieces resolve in record order and
 * a relation names only an earlier piece. Each piece is staged as the role
 * `<role>`, and its model affordances as `<role>/<affordance id>`. Each piece a
 * `wall` relation placed is returned in `mounts` with its wall, so a support
 * check can judge a hung mirror or board against it.
 *
 * @param params The room layout and its pieces by role.
 * @returns The placed-room module.
 * @throws When a relation or clearance is malformed, names a missing, later or
 *   other-wall piece, or leaves a piece or clearance outside the room or
 *   overlapping another piece, clearance or `keepClear` area; each refusal
 *   names the role.
 */
export function createFurnishedRoom(
  params: AutoMovieEnvironmentFurnishing.IAutoMovieEnvironmentFurnishingFurnishedRoomParams,
): IAutoMovieEnvironmentModule {
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution =>
    furnishRoom(context, {
      layout: params,
      pieces: Object.fromEntries(
        Object.entries(params.pieces).map(
          ([role, piece]: [string, IAutoMovieFurnishingPiece]): [
            string,
            resolveFurnishingPieces.IPiece,
          ] => [
            role,
            {
              ...piece,
              bounds: furnishRoom.measure(piece.model),
            },
          ],
        ),
      ),
    });
}
