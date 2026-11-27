import type { AutoMovieFurnishingWall } from "./AutoMovieFurnishingWall";
import type { IAutoMovieFurnishingPoint } from "./IAutoMovieFurnishingPoint";

/**
 * How a furnished piece is placed in its room: against a wall, facing an
 * earlier piece, or at an absolute position.
 *
 * Relations resolve in the room frame of `IAutoMovieFurnishingLayout`: origin
 * at the floor centre, Y up, metres. A piece's front is its local +Z face, and
 * a heading is a turn about +Y that maps local +Z to `(sin h, 0, cos h)`. Every
 * distance is measured between faces of the pieces' rest boxes after their
 * turn, so a reseeded model that changes size moves the pieces placed after it.
 * A relation names only an earlier piece of the same room, so pieces resolve in
 * record order without cycles. The furnishing producer refuses a missing, later
 * or misplaced reference with the role.
 */
export type IAutoMovieFurnishingRelation =
  | IAutoMovieFurnishingRelation.IWall
  | IAutoMovieFurnishingRelation.IFacing
  | IAutoMovieFurnishingRelation.IAt;

/**
 * The relations: against a wall, facing an earlier piece, or at an absolute
 * room position.
 */
export namespace IAutoMovieFurnishingRelation {
  /**
   * The piece's back box face on the inner face of a wall, its front facing
   * into the room.
   *
   * The piece runs along the wall from left to right for a person standing in
   * the room and facing the wall: `-z` runs -X to +X at heading 0, `+z` runs +X
   * to -X at heading 180, `+x` runs -Z to +Z at heading -90 and `-x` runs +Z to
   * -Z at heading 90. The run direction is always the piece's local +X.
   */
  export interface IWall {
    /** Discriminator. */
    readonly kind: "wall";

    /** The wall the piece's back face rests on. */
    readonly wall: AutoMovieFurnishingWall;

    /**
     * Role of an earlier piece on the same wall. The piece's box then starts
     * `gap` metres past that piece's box along the run, and `offset` is
     * refused.
     */
    readonly after?: string;

    /**
     * Distance in metres from the run's start corner to the piece's box, used
     * without `after`. The default is zero.
     */
    readonly offset?: number;

    /**
     * Distance in metres between the box of `after` and this piece's box along
     * the run, used only with `after`. The default is zero.
     */
    readonly gap?: number;

    /**
     * Height in metres of the piece's box underside above the floor. The
     * default is the model's own rest-box underside height when positive and
     * zero otherwise, so a floor piece stands on the floor and a wall mirror or
     * board keeps the mounting height its producer cites.
     */
    readonly elevation?: number;
  }

  /**
   * The piece turned to face an earlier piece across clear floor.
   *
   * The piece's heading is the target's plus 180 degrees. Its front box face
   * stands `distance` metres out from the target's front box face, and its box
   * is centred on the target's box along the target's local X, shifted by
   * `offset`. Its underside stands on the floor.
   */
  export interface IFacing {
    /** Discriminator. */
    readonly kind: "facing";

    /** Role of the earlier piece this one faces. */
    readonly target: string;

    /**
     * Clear floor in metres between the target's front box face and this
     * piece's front box face, at least zero.
     */
    readonly distance: number;

    /**
     * Shift in metres along the target's local +X from the target's box centre.
     * The default is zero.
     */
    readonly offset?: number;
  }

  /** The existing absolute placement, with the underside on the floor. */
  export interface IAt {
    /** Discriminator. */
    readonly kind: "at";

    /** Room-frame X and Z in metres of the model origin. */
    readonly at: IAutoMovieFurnishingPoint;

    /** Turn about +Y in degrees. The default is zero. */
    readonly heading?: number;
  }
}
