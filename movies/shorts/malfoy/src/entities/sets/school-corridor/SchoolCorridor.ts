import type { IAutoMovieZone } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IStageSet } from "../IStageSet";
import { SetGeometry } from "../SetGeometry";

/**
 * The corridor window bay: a 6 × 4 m bay with its window and sill, the
 * fixed backless bench and the open front onto the corridor, as named
 * places. World frame: the window wall lies along +X at z = 0 from its left
 * end (x = 0) to its right end (x = 6) as seen facing the window; the bay
 * runs toward +Z to the open front at z = 4; facing the window is heading π.
 *
 * ```ts
 * const bay = new SchoolCorridor();
 * bay.places["bench.right"].seat; // { height: 0.45, facing: 0, ... }
 * ```
 *
 * @evidence docs/body/settings/sets/school-corridor.md#bay 6.0 m along the window wall, 4.0 m deep, ceiling 3.0 m; open front.
 * @evidence docs/body/settings/sets/school-corridor.md#sill Window 3.6 × 1.4 m from 0.8 m along the wall; sill 0.30 m deep, top 0.95 m.
 * @evidence docs/body/settings/sets/school-corridor.md#bench Seat 1.8 × 0.45 m, top 0.45 m, back edge 0.55 m from the wall, from 1.8 to 3.6 m along it.
 * @evidence docs/body/settings/sets/school-corridor.md#zone-list Bench halves, sill right end, right-end standing area, front route, open front.
 * @evidence docs/body/settings/sets/school-corridor.md#landmarks Bench front-right corner, bench right end, sill right end, open front.
 * @evidence docs/body/settings/props/tea-cups.md#start Two cup places 25 cm apart on the sill's right end.
 * @evidence docs/body/settings/sets/school-corridor.md#light Late-afternoon sun through the window.
 * @evidence contracts/development/entities.md#settings-realization Every dimension is the record's.
 * @evidence contracts/development/entities.md#object-shape A frozen class of places and a figure builder; it imports no other entity.
 * @evidence contracts/development/common.md#meaningful-documentation States the frame and the places.
 */
export class SchoolCorridor implements IStageSet {
  /** Stable set id. */
  public readonly id: string = "school-corridor";

  /** Named places. */
  public readonly places: Readonly<Record<string, IStageSet.IPlace>>;

  /** The places as engine zones. */
  public readonly zones: readonly IAutoMovieZone[];

  /** Camera stations. */
  public readonly stations: Readonly<Record<string, IAutoMovieVector3>>;

  /** The lens stays inside the bay and the corridor in front of it. */
  public readonly lens = Object.freeze({ minX: 0.25, maxX: 5.75, minZ: 0.5, maxZ: 6.8 });

  /** The corridor beyond the open front reads as dim stone. */
  public readonly sky: number = 0x4a4744;

  /** Light preset. */
  public readonly light = "corridor-late-afternoon" as const;

  /** Build the bay from its settings. */
  public constructor() {
    const seat: IStageSet.ISeat = { height: 0.45, facing: 0, halfLength: 0.45, depth: 0.45 };
    const p = (x: number, z: number, radius: number = 0.3, y: number = 0, facing?: number, s?: IStageSet.ISeat): IStageSet.IPlace => ({
      point: { x, y, z },
      radius,
      ...(facing === undefined ? {} : { facing }),
      ...(s === undefined ? {} : { seat: s }),
    });
    this.places = Object.freeze({
      // Seats: the pelvis 0.15 m behind the seat's front edge (z = 1.0).
      "bench.left": p(2.25, 0.85, 0.4, 0, 0, seat),
      "bench.right": p(3.15, 0.85, 0.4, 0, 0, seat),
      "bench.frontEdge": p(2.7, 1.0, 0.05),
      "bench.frontRightCorner": p(3.6, 1.0, 0.05),
      "bench.rightEnd": p(3.75, 0.78, 0.1),
      "sill.rightEnd": p(4.0, 0.15, 0.4, 0.95),
      "sill.cupA": p(3.85, 0.15, 0.05, 0.95),
      "sill.cupB": p(4.1, 0.15, 0.05, 0.95),
      "sill.note": p(4.3, 0.15, 0.05, 0.95),
      rightEndStanding: p(4.0, 0.62, 0.4, 0, Math.PI),
      frontRoute: p(2.7, 2.2, 1.2),
      openFront: p(3.0, 3.9, 0.8),
      corridor: p(3.0, 5.5, 1.0),
    });
    this.zones = Object.freeze(
      Object.entries(this.places).map(([id, place]) => ({ id, center: place.point, radius: place.radius })),
    );
    this.stations = Object.freeze({
      front: { x: 2.7, y: 1.4, z: 5.2 },
      openFront: { x: 3.0, y: 1.4, z: 4.6 },
      rightEnd: { x: 5.6, y: 1.4, z: 2.4 },
      leftEnd: { x: 0.4, y: 1.4, z: 2.6 },
      window: { x: 3.4, y: 1.5, z: 0.4 },
      // Outside the window, looking in through the pane at the sill: the only station beyond the walls.
      outsideWindow: { x: 3.9, y: 1.45, z: -1.6 },
    });
    Object.freeze(this);
  }

  /** @returns The bay's scenery: floor, walls with the window, sill, ceiling, bench and the corridor beyond. */
  public figure(): IStageSet.IFigure {
    const g: SetGeometry = new SetGeometry();
    const stone: number = 0x8b8478;
    g.box([6, 0.04, 7], [3, -0.02, 3.5], 0x6e6c68); // floor of bay and corridor
    // The window wall around its opening; the clear pane shows the pale sky beyond, and a lens outside sees into the bay.
    g.box([0.8, 3, 0.2], [0.4, 1.5, -0.1], stone); // wall left of the window
    g.box([1.6, 3, 0.2], [5.2, 1.5, -0.1], stone); // wall right of the window
    g.box([3.6, 0.95, 0.2], [2.6, 0.475, -0.1], stone); // wall below the sill
    g.box([3.6, 0.65, 0.2], [2.6, 2.675, -0.1], stone); // wall above the window
    g.box([3.8, 0.1, 0.06], [2.6, 2.4, 0.03], 0x6f695f); // window head frame
    g.box([3.6, 0.04, 0.3], [2.6, 0.93, 0.15], 0x9b948a); // sill top
    g.box([0.2, 3, 4], [-0.1, 1.5, 2], stone); // left wall
    g.box([0.2, 3, 4], [6.1, 1.5, 2], stone); // right wall
    g.box([6.4, 0.1, 4], [3, 3.05, 2], 0xc9c6c0); // ceiling
    g.box([8, 3, 0.2], [3, 1.5, 7.1], 0x6a655e); // corridor's far wall
    g.box([1.8, 0.05, 0.45], [2.7, 0.425, 0.775], 0x7a5132); // bench seat
    for (const x of [1.85, 3.55])
      for (const z of [0.6, 0.95]) g.box([0.05, 0.4, 0.05], [x, 0.2, z], 0x6a4429); // legs
    return g.done();
  }
}
