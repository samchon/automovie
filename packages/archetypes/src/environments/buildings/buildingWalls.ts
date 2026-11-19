import { pointOnSegment } from "@automovie/engine";
import type { IAutoMovieProfilePoint } from "@automovie/interface";

import type { buildingPlans } from "./buildingPlans";
import type { createBuilding } from "./createBuilding";

/**
 * Split room edges at incident endpoints, identify shared walls, and bind each opening.
 *
 * The canonical ring windings put room interiors to the left of their own
 * directed edges. Canonical segment direction makes coincident sections from
 * two room rings share one wall irrespective of declaration order.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States shared-wall construction, winding, opening association and the normalized input.
 * @evidence contracts/development/implementation.md#principled-implementation Every admitted room endpoint on a collinear edge contributes a cut; adjacent cuts give maximal intervals with constant room incidence. Interior overlap has already been refused by buildingPlans.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One loop constructs and associates subdivided edges before apertures select from them.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Zero-length intervals are not emitted and ambiguous or missing aperture hosts refuse with the aperture path rather than selecting an arbitrary edge.
 * @evidence contracts/development/implementation.md#efficient-algorithms Each of E edges scans the O(E) authored unique endpoints and orders its incident cuts. Opening assignment scans the resulting intervals per opening; inputs are compact plan graphs.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Constructs one plan's wall table in one call; the prepared result belongs to the building definition.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds edge, cut and aperture lists only within plan preparation. Returned wall records own only their intervals and opening references.
 */
export function buildingWalls(
  level: buildingPlans.ILevel,
): buildingWalls.IWall[] {
  const points: Map<string, IAutoMovieProfilePoint> = new Map();
  for (const room of level.rooms)
    for (const point of room.region.region.points)
      points.set(pointKey(point), point);
  const walls: Map<string, buildingWalls.IWall> = new Map();
  for (const room of level.rooms)
    for (const ring of room.region.rings)
      for (let index: number = 0; index < ring.length; ++index) {
        const a: IAutoMovieProfilePoint = ring[index]!;
        const b: IAutoMovieProfilePoint = ring[(index + 1) % ring.length]!;
        const forward: boolean = compare(a, b) < 0;
        const cuts: IAutoMovieProfilePoint[] = [...points.values()]
          .filter((point: IAutoMovieProfilePoint): boolean =>
            pointOnSegment(point, a, b),
          )
          .sort(compare);
        for (let cut: number = 1; cut < cuts.length; ++cut) {
          const from: IAutoMovieProfilePoint = cuts[cut - 1]!;
          const to: IAutoMovieProfilePoint = cuts[cut]!;
          const key: string = `${pointKey(from)}:${pointKey(to)}`;
          let wall: buildingWalls.IWall | undefined = walls.get(key);
          if (wall === undefined) {
            wall = { key, from, to, left: null, right: null, openings: [] };
            walls.set(key, wall);
          }
          const side: "left" | "right" = forward ? "left" : "right";
          if (wall[side] !== null)
            throw new Error(
              `level "${level.id}" rooms "${wall[side]}" and "${room.id}" occupy the same side of wall "${key}"`,
            );
          wall[side] = room.id;
        }
      }
  const wallsInOrder: buildingWalls.IWall[] = [...walls.values()];
  for (const opening of level.openings) {
    const [from, to] = opening.between;
    const candidates: buildingWalls.IWall[] = wallsInOrder.filter(
      (wall: buildingWalls.IWall): boolean =>
        ((from === wall.left && to === wall.right) ||
          (from === wall.right && to === wall.left)) &&
        (opening.edge === undefined ||
          (matches(wall.from, opening.edge[0]) &&
            matches(wall.to, opening.edge[1])) ||
          (matches(wall.from, opening.edge[1]) &&
            matches(wall.to, opening.edge[0]))),
    );
    if (candidates.length !== 1)
      throw new Error(
        `level "${level.id}" opening "${opening.id}" must name one wall segment; found ${candidates.length}`,
      );
    const wall: buildingWalls.IWall = candidates[0]!;
    wall.openings.push({ opening, turn: from === wall.left });
  }
  return wallsInOrder;
}

/**
 * Normalized plan segments and their authored aperture bindings.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines directed metre segments, room incidence and aperture facing.
 * @evidence contracts/development/design.md#principled-representation Canonical endpoints determine each positive-length segment and room sides. An aperture retains its authored source and records when a half-turn restores its facing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The wall geometry and door generator both read the same prepared interval and aperture.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Exterior sides are explicit nulls. A shared partition has no aperture until an authored opening binds to it.
 */
export namespace buildingWalls {
  /**
   * One positive-length wall in a local XZ storey.
   */
  export interface IWall {
    /** Deterministic coordinate key within the level. */
    readonly key: string;

    /** Canonical segment start. */
    readonly from: IAutoMovieProfilePoint;

    /** Canonical segment end. */
    readonly to: IAutoMovieProfilePoint;

    /** Room id on the local +Z side, or null outside. */
    left: string | null;

    /** Room id on the local -Z side, or null outside. */
    right: string | null;

    /** Apertures in this wall in declared order. */
    readonly openings: IBinding[];
  }

  /**
   * An authored aperture with its orientation in the chosen wall.
   */
  export interface IBinding {
    /** Opening in the original metre plan. */
    readonly opening: createBuilding.Opening;

    /** Whether a half-turn carries wall +Z into the requested opening direction. */
    readonly turn: boolean;
  }
}

/** Order a straight segment by X then Z, preserving exact authored point identities. */
function compare(a: IAutoMovieProfilePoint, b: IAutoMovieProfilePoint): number {
  return a.x - b.x || a.y - b.y;
}

/** Make the normalized key; JSON numeric spellings collapse negative zero. */
function pointKey(point: IAutoMovieProfilePoint): string {
  return `${point.x},${point.y}`;
}

/** Check whether an authored endpoint exactly names the already-admitted wall endpoint. */
function matches(
  point: IAutoMovieProfilePoint,
  pair: createBuilding.Point,
): boolean {
  return point.x === pair[0] && point.y === pair[1];
}
