import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** Nominal concrete density for the schematic slab, kilograms per cubic metre. */
const CONCRETE_DENSITY: number = 2_400;

/** Constructs the rail carriage archetype from its recipe. */
export namespace AutoMovieArchetypeRailCarriage {
  /**
   * A rapid-transit middle car based on the Southern California Rapid Transit
   * District's 1968 preliminary design, §§I.B and II.C.3–5 and II.C.10
   * (https://libraryarchives.metro.net/DPGTL/scrtd/1968-metro-rail-preliminary-design-criteria-and-outline-specifications.pdf).
   * The origin is centered across and along the car at rail-top height. Y is
   * up, Z runs along the track and +X faces the platform.
   *
   * Set the door slider to its maximum travel to open the principal bay at Z =
   * 0. The other five pairs have separate controls. Threshold and aisle are
   * upward surfaces. Board along −X onto threshold, then stage onward travel on
   * the aisle. The seat is the aisle-side seat on −X, facing +Z. The grabRail
   * is vertical, just inside the principal bay. Create the stationary platform
   * with AutoMovieArchetypeRailCarriage.createPlatform and move only the
   * carriage on a ride.
   *
   * @param params Model id and floor-relative seat height. Also accepts a
   *   positional id.
   * @param options A gallery seed or, with a positional id, the seat height
   *   options.
   * @returns The carriage at rest with the door pairs closed.
   * @throws {AutoMovieArchetypeRefusal} When the height is nonfinite or outside
   *   the 17–19 inch scenic contact band.
   */
  export function create(
    params: AutoMovieArchetypeRailCarriage.IParams | string = {},
    options?:
      | number
      | Pick<AutoMovieArchetypeRailCarriage.IParams, "seatHeight">,
  ): AutoMovieArchetype<
    AutoMovieArchetypeRailCarriage.Affordance,
    AutoMovieArchetypeRailCarriage.Dimension
  > {
    const id: string =
      (typeof params === "string" ? params : params.id) ?? "railCarriage";
    const dimensionsInput: Pick<
      AutoMovieArchetypeRailCarriage.IParams,
      "seatHeight"
    > =
      typeof options === "object"
        ? options
        : typeof params === "object"
          ? params
          : {};
    const seed: number | undefined =
      typeof options === "object" ? undefined : options;
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRailCarriage.Dimension> =
      new AutoMovieArchetypeDrawSession("railCarriage", UNITS, seed, {
        seatHeight:
          dimensionsInput.seatHeight ?? (seed === undefined ? 0.45 : undefined),
      });
    const dimensions: Record<AutoMovieArchetypeRailCarriage.Dimension, number> =
      draw.dimensions(BANDS);
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeRailCarriage.Affordance,
      AutoMovieArchetypeRailCarriage.Dimension
    > = new AutoMovieArchetypeBuilder({
      id,
      name: "metro carriage",
      material: "steel",
      draw,
    });
    const v: typeof Vector3.create = Vector3.create;
    const inch: number = AutoMovieArchetypeUnits.INCH;
    const foot: number = AutoMovieArchetypeUnits.FOOT;
    const half: number = AutoMovieArchetypeRailCarriage.REFERENCE.width / 2;
    const floor: number = AutoMovieArchetypeRailCarriage.REFERENCE.floor;
    const end: number = (75 * foot) / 2 - ESTIMATES.coupler;
    const pitch: number = 25 * foot;
    const leaf: number = 27 * inch;
    const ceiling: number = floor + 86 * inch;
    const roof: number = 130 * inch;
    const {
      doorHeight,
      wall,
      threshold,
      seatDepth,
      seatBack,
    }: typeof ESTIMATES = ESTIMATES;
    const seatWidth: number = 22 * inch;
    const aisle: number = 2 * (half - wall - 2 * seatWidth);

    builder.box(
      "cabin-floor",
      v(2 * (half - threshold), 0.18, 2 * end),
      v(0, floor - 0.09, 0),
      DARK,
    );
    builder.box(
      "roof",
      v(2 * half, roof - ceiling, 2 * end),
      v(0, (ceiling + roof) / 2, 0),
      STEEL,
    );
    for (const side of [-1, 1] as const) {
      const bank: readonly DoorPair[] = side === 1 ? DOORS.platform : DOORS.far;
      const sideName: string = side === 1 ? "platform" : "far";
      const skin: number = side * (half - wall / 2);
      builder.box(
        "floor-edge-" + sideName,
        v(threshold, 0.18, 2 * end),
        v(side * (half - threshold / 2), floor - 0.09, 0),
        STEEL,
      );
      builder.box(
        "header-" + sideName,
        v(wall, ceiling - floor - doorHeight, 2 * end),
        v(skin, (ceiling + floor + doorHeight) / 2, 0),
        STEEL,
      );

      // The leaves retract between the body skin and the inboard pocket liner.
      const doorX: number = side * (half - 0.075);
      const liner: number = side * (half - 0.125);
      let start: number = -end;
      for (let i: number = 0; i <= bank.length; i++) {
        const station: number = (i - 1) * pitch;
        const stop: number = i === bank.length ? end : station - leaf;
        const run: number = stop - start;
        const mid: number = (start + stop) / 2;
        const bay: string = sideName + "-" + i;
        const glazing: number = doorHeight - 1.08;
        builder.box(
          "sill-" + bay,
          v(wall, 0.96, run),
          v(skin, floor + 0.48, mid),
          STEEL,
        );
        const bays: number = Math.ceil(run / 1.5);
        const pane: number = run / bays;
        const windowY: number = floor + 0.96 + glazing / 2;
        for (let j: number = 0; j < bays; j++) {
          const windowZ: number = start + j * pane;
          builder.box(
            "window-post-" + bay + "-" + j,
            v(wall, glazing, 0.1),
            v(skin, windowY, windowZ + 0.05),
            STEEL,
          );
          builder.box(
            "window-" + bay + "-" + j,
            v(wall, glazing, pane - 0.1),
            v(skin, windowY, windowZ + (pane + 0.1) / 2),
            GLASS,
          );
        }
        builder.box(
          "lintel-" + bay,
          v(wall, 0.12, run),
          v(skin, floor + doorHeight - 0.06, mid),
          STEEL,
        );
        const pair: DoorPair | undefined = bank[i];
        if (pair === undefined) break;

        for (const direction of [-1, 1] as const) {
          const slider: DoorId = direction === 1 ? pair[0] : pair[1];
          const centre: number = station + (direction * leaf) / 2;
          const lower: string = slider + "-lower";
          const glass: string = slider + "-glass";
          const cap: string = slider + "-cap";
          builder.box(
            lower,
            v(0.03, 1.04, leaf),
            v(doorX, floor + 0.52, centre),
            STEEL,
          );
          builder.box(
            glass,
            v(0.03, doorHeight - 1.19, leaf),
            v(doorX, floor + (doorHeight + 0.89) / 2, centre),
            GLASS,
          );
          builder.box(
            cap,
            v(0.03, 0.15, leaf),
            v(doorX, floor + doorHeight - 0.075, centre),
            STEEL,
          );
          builder.box(
            slider + "-liner",
            v(0.025, 1.04, leaf),
            v(liner, floor + 0.52, station + direction * 1.5 * leaf),
            STEEL,
          );
          builder.affordance({
            id: slider,
            kind: "slider",
            frame: AutoMovieArchetypeFrame.facing(
              v(doorX, floor, centre),
              v(0, 1, 0),
              v(0, 0, direction),
            ),
            extent: null,
            travel: leaf,
            parts: [lower, glass, cap],
            ...(direction === -1 ? { follows: { id: pair[0], ratio: 1 } } : {}),
          });
        }
        start = station + leaf;
      }
    }

    // Each end leaves a gangway gap as wide as the uninterrupted aisle.
    for (const sign of [-1, 1] as const) {
      const span: number = half - aisle / 2;
      for (const side of [-1, 1] as const)
        builder.box(
          "end-wall-" + sign + "-" + side,
          v(span, ceiling - floor, 0.06),
          v(
            side * (half - span / 2),
            (floor + ceiling) / 2,
            sign * (end - 0.03),
          ),
          STEEL,
        );
      const coupler: number = ESTIMATES.coupler;
      builder.box(
        "coupler-" + sign,
        v(0.36, 0.18, coupler),
        v(0, 0.73, sign * (end + coupler / 2)),
        DARK,
      );

      // §II.C.5 permits 30-inch wheels and a 7 ft 6 in truck wheelbase.
      const bogie: number = sign * 26 * foot;
      const radius: number = 15 * inch;
      const gauge: number = 56.5 * inch;
      builder.box(
        "truck-" + sign,
        v(gauge, 0.23, 2.6),
        v(0, 0.58, bogie),
        DARK,
      );
      const frameTop: number = 0.58 + 0.23 / 2;
      const floorBottom: number = floor - 0.18;
      builder.box(
        "bolster-" + sign,
        v(gauge, floorBottom - frameTop, 0.44),
        v(0, (floorBottom + frameTop) / 2, bogie),
        DARK,
      );
      for (const axle of [-1, 1] as const) {
        const z: number = bogie + axle * 45 * inch;
        builder.rod(
          "axle-" + sign + "-" + axle,
          0.07,
          v(-gauge / 2, radius, z),
          v(gauge / 2, radius, z),
          DARK,
        );
        for (const side of [-1, 1] as const) {
          const x: number = (side * gauge) / 2;
          builder.rod(
            "wheel-" + sign + "-" + axle + "-" + side,
            radius,
            v(x - 0.065, radius, z),
            v(x + 0.065, radius, z),
            DARK,
          );
        }
      }
    }

    const seatX: number = half - wall - seatWidth;
    const seatY: number = floor + dimensions.seatHeight;
    const seatFront: number = 2 * leaf + seatDepth + 0.11;
    const rowPitch: number = 32 * inch;
    for (const bay of [-pitch, 0] as const)
      for (let row: number = 0; row < 6; row++) {
        const front: number = bay + seatFront + row * rowPitch;
        const back: number = front - seatDepth;
        for (const side of [-1, 1] as const) {
          const key: string =
            (bay === 0 ? "front-" : "rear-") + row + "-" + side;
          const x: number = side * seatX;
          const base: number = dimensions.seatHeight - 0.07;
          builder.box(
            "seat-base-" + key,
            v(2 * seatWidth, base, seatDepth),
            v(x, floor + base / 2, (front + back) / 2),
            DARK,
          );
          builder.box(
            "seat-back-" + key,
            v(2 * seatWidth, seatBack, 0.08),
            v(x, seatY + seatBack / 2, back - 0.04),
            SEAT,
          );
          builder.box(
            "seat-pad-" + key,
            v(2 * seatWidth, 0.07, seatDepth),
            v(x, seatY - 0.035, (front + back) / 2),
            SEAT,
          );
        }
      }
    builder.affordance({
      id: "seat",
      kind: "seat",
      frame: AutoMovieArchetypeFrame.upright(
        v(-seatX + seatWidth / 2, seatY, seatFront),
      ),
      extent: null,
      width: seatWidth,
      depth: seatDepth,
      back: seatBack,
    });

    // Pole centers are outside the projected doorway and central walking strip.
    const railX: number = half - 0.47;
    const railZ: number = leaf + 0.16;
    // The midpoint of the rapid-rail gripping diameter in Access Board §1192.57(c).
    const bar: number = 1.375 * inch;
    for (const station of [-pitch, 0, pitch] as const)
      for (const side of [-1, 1] as const)
        builder.rod(
          "grab-rail-" + (station / pitch + 1) + "-" + side,
          bar / 2,
          v(side * railX, floor, station + railZ),
          v(side * railX, ceiling, station + railZ),
          STEEL,
        );
    builder.affordance({
      id: "grabRail",
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(railX, (floor + ceiling) / 2, railZ),
        v(-1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: bar,
      length: ceiling - floor,
    });
    builder.affordance({
      id: "threshold",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(half - threshold / 2, floor, 0)),
      extent: null,
      width: threshold,
      depth: 2 * leaf,
    });
    builder.affordance({
      id: "doorway",
      kind: "aperture",
      frame: AutoMovieArchetypeFrame.facing(
        v(half, floor, 0),
        v(0, 1, 0),
        v(0, 0, -1),
      ),
      extent: null,
      width: 2 * leaf,
      height: doorHeight,
    });
    builder.affordance({
      id: "aisle",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, floor, 0)),
      extent: null,
      width: aisle,
      depth: 2 * (end - 0.06),
    });
    return builder.build(65_000 * AutoMovieArchetypeUnits.POUND);
  }

  /** All slider pairs from negative to positive Z on the two sides. */
  const DOORS = {
    far: [
      ["farDoor0", "farDoor0Follower"],
      ["farDoor1", "farDoor1Follower"],
      ["farDoor2", "farDoor2Follower"],
    ],
    platform: [
      ["rearDoor", "rearDoorFollower"],
      ["door", "doorFollower"],
      ["frontDoor", "frontDoorFollower"],
    ],
  } as const;

  /** Leader, moving toward +Z, then follower, moving toward −Z. */
  type DoorPair = (typeof DOORS)[keyof typeof DOORS][number];

  /** The six independently controlled pairs' leaf ids. */
  type DoorId = DoorPair[number];

  /**
   * Fixed shell dimensions, named carriage contacts and the authored seat
   * height.
   *
   * Boarding supports and hand contact at the principal bay plus the positive-Z
   * leader and negative-Z follower of each paired door.
   */
  export type Affordance =
    | "threshold"
    | "doorway"
    | "aisle"
    | "seat"
    | "grabRail"
    | DoorId;

  /** The height of the seat pad's top above the finished cabin floor, in metres. */
  export type Dimension = "seatHeight";

  /** Optional seat height in metres for staging seated contact. */
  export interface IParams {
    /** Scene model id, defaulting to railCarriage. */
    id?: string;

    /**
     * Seat pad top above the cabin floor, 17–19 inches expressed in metres.
     * Defaults to 0.45 m without a seed and draws in the band with a seed.
     */
    seatHeight?: number;
  }

  /** Outside width and floor height above rail in metres, reference §II.C.3. */
  export const REFERENCE: Readonly<{ width: number; floor: number }> = {
    width: 126 * AutoMovieArchetypeUnits.INCH,
    floor: 40 * AutoMovieArchetypeUnits.INCH,
  };

  /** Parameters for the stationary boarding platform. */
  export interface IPlatformParams {
    /** Unique scene id; defaults to `railPlatform`. */
    id?: string;
  }

  /**
   * A one-car segment of a level-boarding station platform, aligned with
   * `AutoMovieArchetypeRailCarriage.create` at the parked carriage's origin and
   * orientation. The platform is on +X and its track-facing edge runs along Z.
   * Keep this model stationary when giving the carriage its own ride.
   *
   * The 11-foot clear depth and one-foot contrasting edge strip are from the
   * Southern California Rapid Transit District's 1968 preliminary design §III.C
   * (https://libraryarchives.metro.net/DPGTL/scrtd/1968-metro-rail-preliminary-design-criteria-and-outline-specifications.pdf).
   * The 75 mm gap is inside the three-inch level-boarding bound in §1192.53(d)
   * (https://www.access-board.gov/ada/vehicles/subpart-c/).
   *
   * @param params The model id, supplied as an option or as a positional
   *   string.
   * @returns The stationary platform, including the support top and its track
   *   edge.
   */
  export function createPlatform(
    params: IPlatformParams | string = {},
  ): AutoMovieArchetype<"platform" | "platformEdge", never> {
    const builder: AutoMovieArchetypeBuilder<
      "platform" | "platformEdge",
      never
    > = new AutoMovieArchetypeBuilder({
      id: (typeof params === "string" ? params : params.id) ?? "railPlatform",
      name: "rail platform",
      material: "concrete",
      draw: new AutoMovieArchetypeDrawSession<never>(
        "railPlatform",
        {},
        undefined,
      ),
    });
    const v: typeof Vector3.create = Vector3.create;
    const depth: number = 11 * AutoMovieArchetypeUnits.FOOT;
    const strip: number = AutoMovieArchetypeUnits.FOOT;
    const length: number = 75 * AutoMovieArchetypeUnits.FOOT;
    const height: number = AutoMovieArchetypeRailCarriage.REFERENCE.floor;
    const edge: number =
      AutoMovieArchetypeRailCarriage.REFERENCE.width / 2 + 0.075;
    builder.box(
      "platform-edge-strip",
      v(strip, height, length),
      v(edge + strip / 2, height / 2, 0),
      {
        color: "#e4b63a",
      },
    );
    builder.box(
      "platform-deck",
      v(depth - strip, height, length),
      v(edge + (depth + strip) / 2, height / 2, 0),
      {
        color: "#a6a29b",
      },
    );
    builder.affordance({
      id: "platform",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(edge + depth / 2, height, 0)),
      extent: null,
      width: depth,
      depth: length,
    });
    builder.affordance({
      id: "platformEdge",
      kind: "ledge",
      frame: AutoMovieArchetypeFrame.facing(
        v(edge, height, 0),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      length,
    });
    return builder.build(CONCRETE_DENSITY * depth * length * height);
  }

  /** Unit shared by the seat-height input, band and record. */
  const UNITS: Readonly<
    Record<
      AutoMovieArchetypeRailCarriage.Dimension,
      AutoMovieArchetypeDrawSession.Unit
    >
  > = {
    seatHeight: "m",
  };

  /**
   * Rail transfer-seat guidance gives the scenic seat contact height above the
   * finished floor.
   */
  const BANDS: Readonly<
    Record<AutoMovieArchetypeRailCarriage.Dimension, IAutoMovieArchetypeBand>
  > = {
    seatHeight: AutoMovieArchetypeBand.metres(
      17 * AutoMovieArchetypeUnits.INCH,
      19 * AutoMovieArchetypeUnits.INCH,
      "U.S. Access Board RVAA Committee Final Report, Appendix §V.1, Transfer Seat Details (https://www.access-board.gov/advisory-committee-reports/rail/rvaac-report/#v-transfer-seat-details)",
    ),
  };

  /** Provisional thicknesses and interior staging dimensions in metres. */
  const ESTIMATES: Readonly<{
    coupler: number;
    doorHeight: number;
    wall: number;
    threshold: number;
    seatDepth: number;
    seatBack: number;
  }> = {
    coupler: 0.35,
    doorHeight: 2.03,
    wall: 0.04,
    // The landing strip extends far enough inboard for a boarding stance.
    threshold: 0.36,
    seatDepth: 0.42,
    seatBack: 0.48,
  };

  /** Neutral stainless finish for the carriage shell and grab rails. */
  const STEEL: AutoMovieArchetypeBuilder.IOptions = {
    color: "#bfc8ce",
    surface: "steel",
  };

  /** Low-reflectance floor and underframe silhouette. */
  const DARK: AutoMovieArchetypeBuilder.IOptions = { color: "#363d46" };

  /** Tinted fixed sash represented by a thin panel. */
  const GLASS: AutoMovieArchetypeBuilder.IOptions = {
    color: "#526d7e",
    density: 0.4,
  };

  /** Colored upholstery distinguishes the passenger supports from the shell. */
  const SEAT: AutoMovieArchetypeBuilder.IOptions = { color: "#326878" };
}
