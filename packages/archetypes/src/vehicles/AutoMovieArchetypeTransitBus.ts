import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import { addTransitBusSeating } from "./internal/addTransitBusSeating";

/** Constructs a low-floor city bus with passenger contacts and door controls. */
export namespace AutoMovieArchetypeTransitBus {
  /**
   * Builds a rigid, two-door low-floor city bus for boarding, standing and seated
   * passenger scenes. The origin is at road height under the center of the body.
   * +Z points forward and −X faces the curb in right-hand traffic. Open either
   * door by advancing its leader to half the doorway width, in metres. The
   * threshold and aisle are level with one another. Board the front door toward
   * +X, travel along the aisle and exit the rear door toward −X.
   *
   * The New Flyer 40-foot Xcelsior supplies the nominal envelope, floor height
   * and wheelbase
   * (https://www.newflyer.com/site-content/uploads/2020/01/NF_Xcelsior_2020-web.pdf).
   * LA Metro's [boarding
   * guide](https://www.metro.net/riding/how-to-ride-metro-bus/) and [rider
   * guide](https://www.metro.net/safety-support/rider-guide/) ground the
   * passenger routes and handhold use. The grasping diameter follows
   * [§1192.29(b)](https://www.access-board.gov/ada/vehicles/subpart-b/).
   *
   * @param params The model id, supplied as an option or as a positional string.
   * @param seed Draws the aisle width in the Xcelsior seat-model range. Omit it
   *   for the nominal 0.59 m aisle.
   * @returns A bus at rest with both passenger doors shut.
   */
  export function create(
    params: AutoMovieArchetypeTransitBus.IParams | string = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeTransitBus.Affordance, AutoMovieArchetypeTransitBus.Dimension> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeTransitBus.Dimension> =
      new AutoMovieArchetypeDrawSession("transitBus", { aisleWidth: "m" }, seed, {
        aisleWidth: seed === undefined ? 0.59 : undefined,
      });
    const { aisleWidth }: Record<AutoMovieArchetypeTransitBus.Dimension, number> =
      draw.dimensions({ aisleWidth: AISLE_BAND });
    const builder: BusBuilder = new AutoMovieArchetypeBuilder({
      id: (typeof params === "string" ? params : params.id) ?? "transitBus",
      name: "low-floor transit bus",
      material: "steel",
      draw,
    });

    builder.box(
      "deck",
      v(2 * (HALF_WIDTH - WELL_WIDTH), DECK_DEPTH, 2 * END),
      v(0, FLOOR - DECK_DEPTH / 2, 0),
      DARK,
    );
    // The center deck stays continuous while the outer strips clear each tyre.
    addDeck(builder, -END, AXLES.rear - ARCH_HALF, "aft");
    addDeck(builder, AXLES.rear + ARCH_HALF, AXLES.front - ARCH_HALF, "mid");
    addDeck(builder, AXLES.front + ARCH_HALF, END, "fore");
    builder.box(
      "roof",
      v(2 * HALF_WIDTH, 0.27, 2 * END),
      v(0, CEILING + 0.135, 0),
      BODY,
    );
    builder.box(
      "air-conditioning",
      v(1.65, ROOF - CEILING - 0.27, 2.6),
      v(0, (ROOF + CEILING + 0.27) / 2, -1.65),
      BODY,
    );
    for (const end of [-1, 1] as const) {
      const z: number = end * (END - 0.035);
      builder.box(
        "end-lower-" + end,
        v(2 * HALF_WIDTH, 1.02, 0.07),
        v(0, FLOOR + 0.51, z),
        BODY,
      );
      builder.box(
        "end-window-" + end,
        v(2 * HALF_WIDTH, CEILING - FLOOR - 1.02, 0.07),
        v(0, (CEILING + FLOOR + 1.02) / 2, z),
        GLASS,
      );
      builder.box(
        "bumper-" + end,
        v(2 * HALF_WIDTH, 0.25, BUMPER),
        v(0, FLOOR + 0.1, end * (END + BUMPER / 2)),
        DARK,
      );
      for (const side of [-1, 1] as const)
        builder.box(
          "lamp-" + end + "-" + side,
          v(0.32, 0.15, 0.035),
          v(side * (HALF_WIDTH - 0.33), FLOOR + 0.37, end * END),
          end === 1 ? HEADLAMP : TAILLAMP,
        );
    }

    // Mullions, wheel openings and door pockets are fixed to the shell.
    addWall(builder, 1, -END, END, "street");
    addWall(builder, -1, -END, EXIT.z - LEAF, "curb-rear");
    addWall(builder, -1, EXIT.z + LEAF, ENTRY.z - LEAF, "curb-middle");
    addWall(builder, -1, ENTRY.z + LEAF, END, "curb-front");
    builder.box(
      "curb-header",
      v(WALL, CEILING - FLOOR - DOOR_HEIGHT, 2 * END),
      v(-HALF_WIDTH + WALL / 2, (CEILING + FLOOR + DOOR_HEIGHT) / 2, 0),
      BODY,
    );
    for (const axle of ["front", "rear"] as const)
      for (const side of [-1, 1] as const) {
        const z: number = AXLES[axle];
        builder.rod(
          "tyre-" + axle + "-" + side,
          RADIUS,
          v(side * (HALF_WIDTH - TYRE_WIDTH - 0.03), RADIUS, z),
          v(side * (HALF_WIDTH - 0.03), RADIUS, z),
          DARK,
        );
        builder.rod(
          "hub-" + axle + "-" + side,
          0.21,
          v(side * (HALF_WIDTH - 0.04), RADIUS, z),
          v(side * (HALF_WIDTH - 0.012), RADIUS, z),
          BODY,
        );
        addWheelHousing(builder, side, z, "wheel-housing-" + axle + "-" + side);
      }

    addDoor(builder, ENTRY);
    addDoor(builder, EXIT);

    addTransitBusSeating(builder, FLOOR, aisleWidth, DARK);
    builder.affordance({
      id: "aisle",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, FLOOR, 0)),
      extent: null,
      width: aisleWidth,
      depth: 2 * (END - 0.07),
    });
    return builder.build(27_750 * AutoMovieArchetypeUnits.POUND);
  }

}

/** Authorable passenger contacts and door controls in the bus frame. */
export namespace AutoMovieArchetypeTransitBus {
  /** Optional scene identifier for the bus. */
  export interface IParams {
    /** Unique in the scene; defaults to `transitBus`. */
    id?: string;
  }

  /** The clear span in metres between the innermost seat edges. */
  export type Dimension = "aisleWidth";

  /**
   * Front and rear sliders, with their coupled leaves, apertures, thresholds
   * and stanchions. The center aisle and a forward-facing passenger seat are
   * shared staging contacts for both routes.
   */
  export type Affordance =
    | "frontDoor"
    | "frontDoorFollower"
    | "frontDoorway"
    | "frontThreshold"
    | "frontGrabRail"
    | "rearDoor"
    | "rearDoorFollower"
    | "rearDoorway"
    | "rearThreshold"
    | "rearGrabRail"
    | "aisle"
    | "seat";
}

/** Archetype construction with the bus's contact ids and seating fit. */
type BusBuilder = AutoMovieArchetypeBuilder<
  AutoMovieArchetypeTransitBus.Affordance,
  AutoMovieArchetypeTransitBus.Dimension
>;

/** A curbside bay binds its geometry to both moving and fixed affordances. */
type DoorBay = Readonly<{
  z: number;
  leader: "frontDoor" | "rearDoor";
  follower: "frontDoorFollower" | "rearDoorFollower";
  aperture: "frontDoorway" | "rearDoorway";
  threshold: "frontThreshold" | "rearThreshold";
  rail: "frontGrabRail" | "rearGrabRail";
  railDirection: -1 | 1;
}>;

/** Extends the deck to both side walls where no tyre crosses floor height. */
function addDeck(
  builder: BusBuilder,
  start: number,
  end: number,
  id: string,
): void {
  for (const side of [-1, 1] as const)
    builder.box(
      "deck-edge-" + id + "-" + side,
      v(WELL_WIDTH, DECK_DEPTH, end - start),
      v(
        side * (HALF_WIDTH - WELL_WIDTH / 2),
        FLOOR - DECK_DEPTH / 2,
        (start + end) / 2,
      ),
      DARK,
    );
}

/** Closes the two inboard edges of each wheel arch above the deck. */
function addWheelHousing(
  builder: BusBuilder,
  side: -1 | 1,
  z: number,
  id: string,
): void {
  const inset: number = HALF_WIDTH - WELL_WIDTH;
  const span: number = WELL_WIDTH - WALL;
  const y: number = (FLOOR + ARCH_TOP) / 2;
  const height: number = ARCH_TOP - FLOOR;
  const sheet: number = 0.04;
  const x: number = side * (inset + span / 2);
  builder.box(
    id + "-cover",
    v(span, sheet, 2 * ARCH_HALF),
    v(x, ARCH_TOP - sheet / 2, z),
    DARK,
  );
  builder.box(
    id + "-inner",
    v(sheet, height - sheet, 2 * ARCH_HALF),
    v(side * (inset + sheet / 2), y - sheet / 2, z),
    DARK,
  );
  for (const end of [-1, 1] as const)
    builder.box(
      id + "-end-" + end,
      v(span - sheet, height - sheet, sheet),
      v(
        x + (side * sheet) / 2,
        y - sheet / 2,
        z + end * (ARCH_HALF - sheet / 2),
      ),
      DARK,
    );
}

/** Adds the coupled pair, its geometric clear opening and passenger contacts. */
function addDoor(builder: BusBuilder, bay: DoorBay): void {
  const x: number = -HALF_WIDTH + WALL + 0.035;
  const paneHeight: number = DOOR_HEIGHT - 1.1;
  for (const dir of [-1, 1] as const) {
    const slider: DoorBay["leader" | "follower"] =
      dir === 1 ? bay.leader : bay.follower;
    const z: number = bay.z + (dir * LEAF) / 2;
    const panel: string = slider + "-panel";
    const pane: string = slider + "-window";
    const cap: string = slider + "-cap";
    builder.box(panel, v(0.035, 0.98, LEAF), v(x, FLOOR + 0.49, z), BODY);
    builder.box(
      pane,
      v(0.035, paneHeight, LEAF),
      v(x, FLOOR + 0.98 + paneHeight / 2, z),
      GLASS,
    );
    builder.box(
      cap,
      v(0.035, 0.12, LEAF),
      v(x, FLOOR + DOOR_HEIGHT - 0.06, z),
      BODY,
    );
    builder.affordance({
      id: slider,
      kind: "slider",
      frame: AutoMovieArchetypeFrame.facing(
        v(x, FLOOR, z),
        v(0, 1, 0),
        v(0, 0, dir),
      ),
      extent: null,
      travel: LEAF,
      parts: [panel, pane, cap],
      ...(dir === -1 ? { follows: { id: bay.leader, ratio: 1 } } : {}),
    });
  }

  const threshold: number = 0.39;
  builder.affordance({
    id: bay.aperture,
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.facing(
      v(-HALF_WIDTH, FLOOR, bay.z),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    width: 2 * LEAF,
    height: DOOR_HEIGHT,
  });
  builder.affordance({
    id: bay.threshold,
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      v(-HALF_WIDTH + threshold / 2, FLOOR, bay.z),
    ),
    extent: null,
    width: threshold,
    depth: 2 * LEAF,
  });

  // Place the stanchion beyond the doorway's projection into the vestibule.
  const railX: number = -0.63;
  const railZ: number = bay.z + bay.railDirection * (LEAF + 0.18);
  const diameter: number = 1.375 * AutoMovieArchetypeUnits.INCH;
  builder.rod(
    bay.rail + "-pole",
    diameter / 2,
    v(railX, FLOOR, railZ),
    v(railX, CEILING, railZ),
    RAIL,
  );
  builder.affordance({
    id: bay.rail,
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.facing(
      v(railX, (CEILING + FLOOR) / 2, railZ),
      v(1, 0, 0),
      v(0, 1, 0),
    ),
    extent: null,
    grip: "power",
    aperture: diameter,
    length: CEILING - FLOOR,
  });
}

/** Builds a bounded side-wall run; only the sill needs wheel cutouts. */
function addWall(
  builder: BusBuilder,
  side: -1 | 1,
  start: number,
  end: number,
  id: string,
): void {
  const skin: number = side * (HALF_WIDTH - WALL / 2);
  const sill: number = FLOOR + 0.93;
  const glassTop: number = FLOOR + DOOR_HEIGHT;
  const panels: number = Math.ceil((end - start) / 1.45);
  const pitch: number = (end - start) / panels;
  for (let i: number = 0; i < panels; ++i) {
    const z: number = start + i * pitch;
    builder.box(
      id + "-post-" + i,
      v(WALL, glassTop - sill, 0.07),
      v(skin, (sill + glassTop) / 2, z + 0.035),
      BODY,
    );
    builder.box(
      id + "-window-" + i,
      v(WALL, glassTop - sill, pitch - 0.07),
      v(skin, (sill + glassTop) / 2, z + (pitch + 0.07) / 2),
      GLASS,
    );
  }
  if (side === 1)
    builder.box(
      id + "-header",
      v(WALL, CEILING - glassTop, end - start),
      v(skin, (CEILING + glassTop) / 2, (end + start) / 2),
      BODY,
    );

  let cursor: number = start;
  for (const axle of ["rear", "front"] as const) {
    const left: number = Math.max(start, AXLES[axle] - ARCH_HALF);
    const right: number = Math.min(end, AXLES[axle] + ARCH_HALF);
    if (left >= right) continue;
    if (cursor < left)
      builder.box(
        id + "-sill-before-" + axle,
        v(WALL, sill - SKIRT, left - cursor),
        v(skin, (sill + SKIRT) / 2, (cursor + left) / 2),
        BODY,
      );
    builder.box(
      id + "-arch-" + axle,
      v(WALL, sill - ARCH_TOP, right - left),
      v(skin, (sill + ARCH_TOP) / 2, (left + right) / 2),
      BODY,
    );
    cursor = right;
  }
  if (cursor < end)
    builder.box(
      id + "-sill-end",
      v(WALL, sill - SKIRT, end - cursor),
      v(skin, (sill + SKIRT) / 2, (cursor + end) / 2),
      BODY,
    );
}

/** Vector constructor for metric bus-local dimensions. */
const v: typeof Vector3.create = Vector3.create;
/** Half the 102-inch body width. */
const HALF_WIDTH: number = 51 * AutoMovieArchetypeUnits.INCH;
/** End station of the 40 ft 2 in body. */
const END: number = 241 * AutoMovieArchetypeUnits.INCH;
/** Additional length at each end of the 41 ft bumper envelope. */
const BUMPER: number = 5 * AutoMovieArchetypeUnits.INCH;
/** Height of the passenger deck and thresholds above the road. */
const FLOOR: number = 14 * AutoMovieArchetypeUnits.INCH;
/** Depth of the deck panels below the common walking surface. */
const DECK_DEPTH: number = 0.16;
/** Mid-coach ceiling height, with a scenic level ceiling. */
const CEILING: number = FLOOR + 95 * AutoMovieArchetypeUnits.INCH;
/** Height over the diesel model's air conditioner. */
const ROOF: number = 126 * AutoMovieArchetypeUnits.INCH;
/**
 * Clear aisle width across the offered seat models, using the brochure's metric
 * figures.
 */
const AISLE_BAND: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
  0.559,
  0.61,
  "New Flyer Xcelsior brochure, p. 3, 40-foot Aisle Width (varies with seat model): https://www.newflyer.com/site-content/uploads/2025/12/New-Flyer-Xcelsior-Brochure.pdf",
);
/** Side-wall thickness, leaving space behind it for door leaves. */
const WALL: number = 0.075;
/** Elevation of the lower body skirt. */
const SKIRT: number = 0.18;
/** Half the nominal 0.90 m doorway span. */
const LEAF: number = 0.45;
/** Scenic clearance above both thresholds. */
const DOOR_HEIGHT: number = 2.06;
/** Tyre width in the 305/70R22.5 nominal size. */
const TYRE_WIDTH: number = 0.305;
/** Lateral depth of the floor cutout around each exterior tyre. */
const WELL_WIDTH: number = TYRE_WIDTH + 0.2;
/** Nominal unloaded tyre radius, from rim diameter and sidewall height. */
const RADIUS: number = 11.25 * AutoMovieArchetypeUnits.INCH + TYRE_WIDTH * 0.7;
/** Clearance envelope around a tyre in the side fascia. */
const ARCH_HALF: number = RADIUS + 0.055;
/** Upper edge of wheel cutouts and housings. */
const ARCH_TOP: number = 2 * RADIUS + 0.055;
/** Axle stations on the 283.75-inch wheelbase. */
const AXLES: Readonly<{ front: number; rear: number }> = {
  front: 3.5,
  rear: 3.5 - 283.75 * AutoMovieArchetypeUnits.INCH,
};
/** Front boarding bay ahead of the front axle. */
const ENTRY: DoorBay = {
  z: 5.05,
  leader: "frontDoor",
  follower: "frontDoorFollower",
  aperture: "frontDoorway",
  threshold: "frontThreshold",
  rail: "frontGrabRail",
  railDirection: -1,
};
/** Rear exit bay between the two axles. */
const EXIT: DoorBay = {
  z: -1.35,
  leader: "rearDoor",
  follower: "rearDoorFollower",
  aperture: "rearDoorway",
  threshold: "rearThreshold",
  rail: "rearGrabRail",
  railDirection: 1,
};
/** Painted bus body without operator graphics. */
const BODY: AutoMovieArchetypeBuilder.IOptions = { color: "#bfcccf" };
/** Tinted window marker. */
const GLASS: AutoMovieArchetypeBuilder.IOptions = {
  color: "#48616d",
  density: 0.4,
};
/** Floor, tyres and wheel surfaces. */
const DARK: AutoMovieArchetypeBuilder.IOptions = { color: "#2d343a" };
/** Yellow supports visible against the passenger interior. */
const RAIL: AutoMovieArchetypeBuilder.IOptions = { color: "#e5b229" };
/** Headlamp lens marker. */
const HEADLAMP: AutoMovieArchetypeBuilder.IOptions = { color: "#e4e4df" };
/** Rear lamp lens marker. */
const TAILLAMP: AutoMovieArchetypeBuilder.IOptions = { color: "#a53f39" };
