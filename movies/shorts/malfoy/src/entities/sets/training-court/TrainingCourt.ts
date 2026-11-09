import type { IAutoMovieZone } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IStageSet } from "../IStageSet";
import { SetGeometry } from "../SetGeometry";

/**
 * The training court: an 8 × 6 m flagstone floor with a low north wall and
 * the damaged stone support in its north-east, as named places a scene
 * walks between. World frame: the floor's centre at the origin, +X east,
 * +Z south (north is −Z), floor at y = 0.
 *
 * ```ts
 * const court = new TrainingCourt();
 * court.places.underCap.point; // under the cap's front edge, just inside the danger region
 * court.inDanger({ x: 1.3, y: 0, z: -1.2 }, 0.25); // true
 * ```
 *
 * @evidence docs/body/settings/sets/training-court.md#floor 8 m by 6 m flagstones, low north wall 0.45 m high and 0.15 m thick, open south, east and west edges.
 * @evidence docs/body/settings/sets/training-court.md#support Base 1.0 m across and 0.12 m high at 1.2–2.2 m east and 1.8–2.8 m north; upright 0.6 × 0.5 m, 3.0 m tall; cap 1.3–2.1 m east, 1.3–2.3 m north, underside 2.70 m, top 2.95 m; cracked lower fillet, bearing ledge, upper web.
 * @evidence docs/body/settings/sets/training-court.md#danger-region 1.0–2.4 m east and 0.5–2.6 m north.
 * @evidence docs/body/settings/sets/training-court.md#zone-list Centre, support zone, west lane, south approach, north wall.
 * @evidence docs/body/settings/sets/training-court.md#landmarks Base corner, cap front edge, cracked fillet, wall west end.
 * @evidence docs/body/settings/sets/training-court.md#light Bright high cloud, soft daylight from the south-west.
 * @evidence contracts/development/entities.md#settings-realization Every dimension is the record's.
 * @evidence contracts/development/entities.md#object-shape A frozen class of places and a figure builder; it imports no other entity.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame and the places.
 */
export class TrainingCourt implements IStageSet {
  /** Stable set id. */
  public readonly id: string = "training-court";

  /** Named places. */
  public readonly places: Readonly<Record<string, IStageSet.IPlace>>;

  /** The places as engine zones. */
  public readonly zones: readonly IAutoMovieZone[];

  /** Camera stations. */
  public readonly stations: Readonly<Record<string, IAutoMovieVector3>>;

  /** Pale sky. */
  public readonly sky: number = 0xc9d3dc;

  /** Light preset. */
  public readonly light = "court-late-morning" as const;

  /** The danger region on the floor, metres: x east and z south bounds. */
  public readonly danger = Object.freeze({ minX: 1.0, maxX: 2.4, minZ: -2.6, maxZ: -0.5 });

  /** The cap block's resting geometry, metres. */
  public readonly cap = Object.freeze({ minX: 1.3, maxX: 2.1, minZ: -2.3, maxZ: -1.3, bottom: 2.7, top: 2.95 });

  /** Build the court from its settings. */
  public constructor() {
    const p = (x: number, z: number, radius: number = 0.3, y: number = 0, facing?: number): IStageSet.IPlace => ({
      point: { x, y, z },
      radius,
      ...(facing === undefined ? {} : { facing }),
    });
    this.places = Object.freeze({
      centre: p(0, 0, 1.0),
      "centre.middle": p(0, 0),
      "centre.southWest": p(-0.6, 0.6),
      "centre.northEast": p(0.6, -0.6),
      "centre.south": p(0, 0.9),
      "centre.farSouthWest": p(-1.4, 1.3),
      "centre.farNorthEast": p(1.0, -1.0),
      "centre.farWest": p(-2.0, 0.2),
      "centre.farEast": p(2.0, 0.4),
      supportZone: p(1.7, -1.6, 0.7),
      underCap: p(1.3, -1.25, 0.15),
      westLane: p(-2.2, 0, 1.5),
      southApproach: p(0, 4.0, 1.0),
      northWall: p(0, -2.7, 0.3),
      baseCorner: p(1.2, -1.8, 0.05),
      capFrontEdge: p(1.7, -1.3, 0.05, 2.7),
      crackedFillet: p(1.7, -2.28, 0.05, 2.68),
      wallWestEnd: p(-4.0, -3.07, 0.05, 0.45),
    });
    this.zones = Object.freeze(
      Object.entries(this.places).map(([id, place]) => ({ id, center: place.point, radius: place.radius })),
    );
    this.stations = Object.freeze({
      southApproach: { x: 0.3, y: 1.5, z: 6.5 },
      south: { x: 0, y: 1.4, z: 5.0 },
      southWest: { x: -4.5, y: 1.5, z: 4.5 },
      southEast: { x: 4.5, y: 1.5, z: 4.5 },
      east: { x: 5.5, y: 1.5, z: 0.5 },
      west: { x: -5.5, y: 1.5, z: 0 },
    });
    Object.freeze(this);
  }

  /**
   * Whether a body of a radius standing at a floor point reaches into the danger region.
   *
   * @param point Floor point.
   * @param radius Body radius, metres.
   * @returns True when inside.
   */
  public inDanger(point: IAutoMovieVector3, radius: number): boolean {
    const d = this.danger;
    return point.x + radius > d.minX && point.x - radius < d.maxX && point.z + radius > d.minZ && point.z - radius < d.maxZ;
  }

  /** @returns The court's scenery: floor, earth, north wall and the support with its joint strips (the cap is the falling-masonry prop). */
  public figure(): IStageSet.IFigure {
    const g: SetGeometry = new SetGeometry();
    g.box([16, 0.02, 14], [0, -0.03, 0], 0x7a6650); // bare earth
    g.box([8, 0.04, 6], [0, -0.02, 0], 0x7d7d79); // flagstones
    g.box([8, 0.45, 0.15], [0, 0.225, -3.075], 0x8c8a84); // north wall
    g.box([1.0, 0.12, 1.0], [1.7, 0.06, -2.3], 0x6f6d68); // base
    g.box([0.6, 3.0, 0.5], [1.7, 1.5, -2.55], 0x6f6d68); // upright
    g.box([0.6, 0.08, 0.1], [1.7, 2.66, -2.25], 0x6f6d68); // bearing ledge
    g.box([0.62, 0.04, 0.12], [1.7, 2.68, -2.25], 0xb9b7b0); // cracked lower fillet
    g.box([0.62, 0.05, 0.1], [1.7, 2.97, -2.3], 0xb9b7b0); // upper mortar web
    return g.done();
  }
}
