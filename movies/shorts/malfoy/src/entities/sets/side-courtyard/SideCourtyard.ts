import type { IAutoMovieZone } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IStageSet } from "../IStageSet";
import { SetGeometry } from "../SetGeometry";

/**
 * The side courtyard: an 8 × 4 m paved recess with its beige north wall, the
 * west wall's passage gap, the side wing's wall on the east and the stone
 * bench against the north wall, as named places. World frame: +X east from
 * the west wall (x = 0), +Z south from the north wall (z = 0) to the open
 * south edge (z = 4); facing the bench is heading π.
 *
 * ```ts
 * const yard = new SideCourtyard();
 * yard.places.startingPlace.point; // two steps south of the bench front
 * ```
 *
 * @evidence docs/body/settings/sets/side-courtyard.md#recess 8.0 × 4.0 m flush limestone paving.
 * @evidence docs/body/settings/sets/side-courtyard.md#walls North wall 8.0 m long, 2.4 m high, 0.25 m thick; west wall with a 1.2 m gap centred 1.4 m north of the south edge; east wing wall; open south.
 * @evidence docs/body/settings/sets/side-courtyard.md#bench Stone block 1.6 × 0.4 × 0.45 m against the north wall, centred 2.2 m from the west wall.
 * @evidence docs/body/settings/sets/side-courtyard.md#zone-list West gap, bench, bench front, clear paving, open south.
 * @evidence docs/body/settings/sets/side-courtyard.md#landmarks Bench centre front, west gap middle, a starting place two steps south of the bench front.
 * @evidence docs/body/settings/sets/side-courtyard.md#light Low sun from the south-west.
 * @evidence contracts/development/entities.md#settings-realization Every dimension is the record's.
 * @evidence contracts/development/entities.md#object-shape A frozen class of places and a figure builder; it imports no other entity.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame and the places.
 */
export class SideCourtyard implements IStageSet {
  /** Stable set id. */
  public readonly id: string = "side-courtyard";

  /** Named places. */
  public readonly places: Readonly<Record<string, IStageSet.IPlace>>;

  /** The places as engine zones. */
  public readonly zones: readonly IAutoMovieZone[];

  /** Camera stations. */
  public readonly stations: Readonly<Record<string, IAutoMovieVector3>>;

  /** The lens stays inside the recess's walls, or anywhere over the open lawn south of them. */
  public readonly lens = Object.freeze([
    Object.freeze({ minX: 0.3, maxX: 7.7, minZ: 0.4, maxZ: 4.6 }),
    // Open ground west of the recess past the west wall's south end, short of the passage's far wall.
    Object.freeze({ minX: -2.4, maxX: 0.3, minZ: 4.1, maxZ: 4.6 }),
    Object.freeze({ minX: -10, maxX: 18, minZ: 4.6, maxZ: 14 }),
  ]);

  /** Pale afternoon sky. */
  public readonly sky: number = 0xd8dee2;

  /** Light preset. */
  public readonly light = "courtyard-late-afternoon" as const;

  /** Build the recess from its settings. */
  public constructor() {
    const p = (x: number, z: number, radius: number = 0.3, facing?: number, seat?: IStageSet.ISeat): IStageSet.IPlace => ({
      point: { x, y: 0, z },
      radius,
      ...(facing === undefined ? {} : { facing }),
      ...(seat === undefined ? {} : { seat }),
    });
    this.places = Object.freeze({
      bench: p(2.2, 0.2, 0.8),
      "bench.centre": p(2.2, 0.25, 0.4, 0, { height: 0.45, facing: 0, halfLength: 0.4, depth: 0.4 }),
      "bench.centreFront": p(2.2, 0.75, 0.1, Math.PI),
      benchFront: p(2.2, 1.4, 0.8),
      startingPlace: p(2.2, 2.05, 0.1, Math.PI),
      clearPaving: p(5.0, 2.2, 1.8),
      westGap: p(0.3, 2.6, 0.5),
      "westGap.middle": p(-0.12, 2.6, 0.1),
      passage: p(-2.2, 2.6, 0.6),
      openSouth: p(4.0, 5.5, 1.5),
    });
    this.zones = Object.freeze(
      Object.entries(this.places).map(([id, place]) => ({ id, center: place.point, radius: place.radius })),
    );
    this.stations = Object.freeze({
      eastEnd: { x: 7.6, y: 1.45, z: 1.3 },
      openSouth: { x: 3.4, y: 1.45, z: 7.5 },
      south: { x: 2.6, y: 1.4, z: 6.4 },
      southEast: { x: 6.2, y: 1.35, z: 5.2 },
      southWest: { x: -0.8, y: 1.4, z: 6.4 },
    });
    Object.freeze(this);
  }

  /** @returns The recess's scenery: paving, lawn, the three walls with the gap, the side passage and the bench. */
  public figure(): IStageSet.IFigure {
    const g: SetGeometry = new SetGeometry();
    const plaster: number = 0xcdbd9a;
    g.box([30, 0.02, 30], [4, -0.03, 8], 0x6d7f4e); // lawn
    g.box([8, 0.04, 4], [4, -0.02, 2], 0xb4b2ac); // paving
    g.box([8, 2.4, 0.25], [4, 1.2, -0.125], plaster); // north wall
    g.box([0.25, 2.4, 2.0], [-0.125, 1.2, 1.0], plaster); // west wall north of the gap
    g.box([0.25, 2.4, 0.8], [-0.125, 1.2, 3.6], plaster); // west wall south of the gap
    g.box([0.4, 4.0, 6], [8.2, 2.0, 1.5], 0x8e8b84); // side wing wall
    g.box([2.0, 0.04, 6], [-1.4, -0.02, 2.4], 0xa9a7a0); // side passage floor
    g.box([0.25, 2.4, 8], [-2.6, 1.2, 1.5], 0xbfae8c); // the passage's far wall
    g.box([1.6, 0.45, 0.4], [2.2, 0.225, 0.2], 0x8f8f8b); // stone bench
    return g.done();
  }
}
