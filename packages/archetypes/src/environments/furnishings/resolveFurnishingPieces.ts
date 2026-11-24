import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieFurnishingWall,
  IAutoMovieFurnishingClearance,
  IAutoMovieFurnishingLayout,
  IAutoMovieFurnishingRelation,
  IAutoMovieModel,
  IAutoMoviePropBox,
  IAutoMovieVector3,
} from "@automovie/interface";

import { FurnishingRect } from "./FurnishingRect";

/** A wall's heading and its map from run and inward distance to room XZ. */
interface IWallFrame {
  /** The heading that faces a piece's front into the room. */
  heading: number;

  /**
   * The room-frame X and Z of a point `u` metres along the run from its start
   * corner and `v` metres out from the wall's inner face.
   */
  at: (u: number, v: number) => readonly [x: number, z: number];
}

/** One wall piece's run interval, for an `after` relation. */
interface IRun {
  /** The wall the piece stands on. */
  wall: AutoMovieFurnishingWall;

  /** Distance in metres from the run's start corner to the box's far end. */
  end: number;
}

/**
 * Place a room's individually related pieces in record order and reserve the
 * floor each keeps clear.
 *
 * Each piece's measured rest box is turned and placed by its relation, then
 * claimed against the room and the blocked rectangles: `keepClear` areas,
 * overridden grid roles, earlier pieces and their clearances. Its own clearance
 * rectangles are then checked against the room and every blocked box and
 * keep-out, and blocked in turn, so later pieces and grid groups stay out.
 * Clearances may share floor with one another, as the work aisle in front of
 * neighbouring counters does. A clearance is labelled `<role>/clear/<name>`,
 * its name defaulting to its side. A layout override of a piece's role places
 * it at the override instead. A `wall` piece's origin is solved in the wall's
 * run coordinates `(u, v)`: its box starts at the offset, or `gap` past its
 * `after` piece's box, along the run, which is the piece's local +X, and its
 * back face rests on the wall at `v = 0`.
 *
 * @param props The occurrence id, room, aisle, overrides, pieces and the
 *   rectangles already blocked, which this call extends.
 * @returns Each piece's placement in record order and the wall of each piece a
 *   `wall` relation placed.
 * @throws Naming the occurrence and role for a malformed relation or clearance,
 *   a missing, later or other-wall reference, a box outside the room or
 *   entering a blocked rectangle, and a clearance outside the room or entered
 *   by a blocked rectangle.
 */
export function resolveFurnishingPieces(
  props: resolveFurnishingPieces.IProps,
): resolveFurnishingPieces.IResult {
  const { id, room, aisle, blocked }: resolveFurnishingPieces.IProps = props;
  const width: number = room.maxX - room.minX;
  const depth: number = room.maxZ - room.minZ;
  const roles: string[] = Object.keys(props.pieces);
  const placed: Map<string, FurnishingRect.IPlacement> = new Map();
  const headings: Map<string, number> = new Map();
  const runs: Map<string, IRun> = new Map();
  const walls: Map<string, AutoMovieFurnishingWall> = new Map();
  const clearances: Set<string> = new Set();

  // Name why a relation's reference to another role cannot be read yet.
  const earlier: (
    role: string,
    field: string,
    name: string,
  ) => FurnishingRect.IPlacement = (
    role: string,
    field: string,
    name: string,
  ): FurnishingRect.IPlacement => {
    const found: FurnishingRect.IPlacement | undefined = placed.get(name);
    if (found !== undefined) return found;
    throw new Error(
      roles.includes(name)
        ? `${id} ${role} place.${field} "${name}" is a later piece; a relation names only an earlier one`
        : `${id} ${role} place.${field} "${name}" names no piece of the room`,
    );
  };

  for (const role of roles) {
    const piece: resolveFurnishingPieces.IPiece = props.pieces[role]!;
    const override:
      | { readonly at: readonly [number, number]; readonly heading?: number }
      | undefined = props.overrides?.[role];
    let placement: FurnishingRect.IPlacement;
    let heading: number;
    if (override !== undefined) {
      heading = override.heading ?? 0;
      placement = FurnishingRect.locate(
        piece.model,
        piece.bounds,
        override.at[0],
        override.at[1],
        heading,
      );
    } else if (piece.place.kind === "at") {
      heading = piece.place.heading ?? 0;
      placement = FurnishingRect.locate(
        piece.model,
        piece.bounds,
        piece.place.at[0],
        piece.place.at[1],
        heading,
      );
    } else if (piece.place.kind === "facing") {
      const place: IAutoMovieFurnishingRelation.IFacing = piece.place;
      const offset: number = place.offset ?? 0;
      if (!(place.distance >= 0))
        throw new Error(
          `${id} ${role} place.distance needs a finite nonnegative distance`,
        );
      const target: FurnishingRect.IPlacement = earlier(
        role,
        "target",
        place.target,
      );
      heading = (headings.get(place.target)! + 180) % 360;

      // In the target's frame this piece's local axes are reversed, so its
      // front face, at its local max Z, lies at origin Z minus that max Z.
      const local: IAutoMovieVector3 = {
        x:
          (target.bounds.min.x + target.bounds.max.x) / 2 +
          offset +
          (piece.bounds.min.x + piece.bounds.max.x) / 2,
        y: 0,
        z: target.bounds.max.z + place.distance + piece.bounds.max.z,
      };
      const turned: IAutoMovieVector3 = Quaternion.rotateVector(
        target.rotation,
        local,
      );
      placement = FurnishingRect.locate(
        piece.model,
        piece.bounds,
        target.x + turned.x,
        target.z + turned.z,
        heading,
      );
    } else {
      const place: IAutoMovieFurnishingRelation.IWall = piece.place;
      const frame: IWallFrame = wallFrame(place.wall, width, depth);
      const gap: number = place.gap ?? 0;
      const offset: number = place.offset ?? 0;
      const lowest: number = piece.bounds.min.y;
      const elevation: number = place.elevation ?? (lowest > 0 ? lowest : 0);
      if (elevation < 0)
        throw new Error(
          `${id} ${role} place needs a finite offset and gap and a finite nonnegative elevation`,
        );
      let start: number = offset;
      if (place.after !== undefined) {
        if (place.offset !== undefined)
          throw new Error(
            `${id} ${role} place.offset applies only without place.after; use place.gap`,
          );
        earlier(role, "after", place.after);
        const run: IRun | undefined = runs.get(place.after);
        if (run === undefined || run.wall !== place.wall)
          throw new Error(
            `${id} ${role} place.after "${place.after}" is not on wall ${place.wall}`,
          );
        start = run.end + gap;
      } else if (place.gap !== undefined)
        throw new Error(
          `${id} ${role} place.gap applies only with place.after; use place.offset`,
        );
      heading = frame.heading;
      const [x, z]: readonly [x: number, z: number] = frame.at(
        start - piece.bounds.min.x,
        -piece.bounds.min.z,
      );
      placement = {
        ...FurnishingRect.locate(piece.model, piece.bounds, x, z, heading),
        y: elevation - lowest,
      };
      runs.set(role, {
        wall: place.wall,
        end: start + piece.bounds.max.x - piece.bounds.min.x,
      });
      walls.set(role, place.wall);
    }
    FurnishingRect.claim(id, role, placement, room, blocked);
    placed.set(role, placement);
    headings.set(role, heading);
    reserve(id, role, piece, placement, aisle, room, blocked, clearances);
  }
  return { placed, walls };
}

/** The heading and run coordinates of one wall of a `width` by `depth` room. */
function wallFrame(
  wall: AutoMovieFurnishingWall,
  width: number,
  depth: number,
): IWallFrame {
  const w: number = width / 2;
  const d: number = depth / 2;
  if (wall === "-z")
    return { heading: 0, at: (u: number, v: number) => [-w + u, -d + v] };
  if (wall === "+z")
    return { heading: 180, at: (u: number, v: number) => [w - u, d - v] };
  if (wall === "+x")
    return { heading: -90, at: (u: number, v: number) => [w - v, -d + u] };
  return { heading: 90, at: (u: number, v: number) => [-w + v, d - u] };
}

/**
 * Check and block each clearance rectangle of a placed piece.
 *
 * A rectangle reaches `depth` out from the chosen face of the piece's local box
 * and runs `width` along it, centred, before the piece's turn and translation
 * project it into the room.
 */
function reserve(
  id: string,
  role: string,
  piece: resolveFurnishingPieces.IPiece,
  placement: FurnishingRect.IPlacement,
  aisle: number,
  room: FurnishingRect.IRect,
  blocked: Map<string, FurnishingRect.IRect>,
  clearances: Set<string>,
): void {
  const { min, max }: IAutoMoviePropBox = piece.bounds;
  const names: Set<string> = new Set();
  for (const clear of piece.clear ?? []) {
    const side: "front" | "left" | "right" = clear.side ?? "front";
    const name: string = clear.name ?? side;
    const label: string = `${role}/clear/${name}`;
    if (names.has(name))
      throw new Error(`${id} ${role} names clearance "${name}" twice`);
    names.add(name);
    const front: boolean = side === "front";
    const face: number = front ? max.x - min.x : max.z - min.z;
    const span: number = clear.width ?? Math.max(face, aisle);
    if (!(clear.depth > 0) || !(span > 0))
      throw new Error(
        `${id} ${role} ${name} clearance needs a positive finite depth and width`,
      );
    const centre: number = front ? (min.x + max.x) / 2 : (min.z + max.z) / 2;
    const local: FurnishingRect.IRect = front
      ? {
          minX: centre - span / 2,
          maxX: centre + span / 2,
          minZ: max.z,
          maxZ: max.z + clear.depth,
        }
      : {
          minX: side === "left" ? min.x - clear.depth : max.x,
          maxX: side === "left" ? min.x : max.x + clear.depth,
          minZ: centre - span / 2,
          maxZ: centre + span / 2,
        };
    const rect: FurnishingRect.IRect = FurnishingRect.shift(
      FurnishingRect.project(local, placement.rotation),
      placement.x,
      placement.z,
    );
    if (!FurnishingRect.within(rect, room))
      throw new Error(
        `${id} ${role} ${name} clearance is outside the usable room`,
      );

    // Clearances may share floor with one another; only boxes and keep-outs
    // must stay out.
    for (const [other, box] of blocked)
      if (
        other !== role &&
        !clearances.has(other) &&
        FurnishingRect.overlaps(rect, box)
      )
        throw new Error(`${id} ${other} blocks ${role} ${name} clearance`);
    blocked.set(label, rect);
    clearances.add(label);
  }
}

/**
 * The related pieces the resolver places, the room it places them in and what
 * it returns.
 */
export namespace resolveFurnishingPieces {
  /** One related piece with its measured rest box. */
  export interface IPiece {
    /** The piece's model. */
    model: IAutoMovieModel;

    /** The model's measured rest box in its own frame, in metres. */
    bounds: IAutoMoviePropBox;

    /** How the piece is placed. */
    place: IAutoMovieFurnishingRelation;

    /** Floor rectangles the piece keeps clear. */
    clear?: readonly IAutoMovieFurnishingClearance[];
  }

  /** The room, its reservations and the pieces to place. */
  export interface IProps {
    /** Occurrence id that prefixes every refusal. */
    id: string;

    /** The usable room in its own frame, centred on the origin. */
    room: FurnishingRect.IRect;

    /** The room's aisle in metres, the least default clearance width. */
    aisle: number;

    /** Role-keyed absolute placements that replace a piece's relation. */
    overrides: IAutoMovieFurnishingLayout["overrides"];

    /** The pieces by role, in resolution order. */
    pieces: Readonly<Record<string, IPiece>>;

    /**
     * Rectangles already blocked by label, extended with each piece and
     * clearance.
     */
    blocked: Map<string, FurnishingRect.IRect>;
  }

  /** Each piece's placement and the wall each wall piece stands on. */
  export interface IResult {
    /** Placements by role, in record order. */
    placed: Map<string, FurnishingRect.IPlacement>;

    /** The wall of each piece a `wall` relation placed, by role. */
    walls: Map<string, AutoMovieFurnishingWall>;
  }
}
