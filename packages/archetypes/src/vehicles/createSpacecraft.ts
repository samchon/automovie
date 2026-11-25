import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeConvexCell,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The capsule's blunt taper and distinct hatch inform the silhouette. */
const CAPSULE: string =
  "Smithsonian National Air and Space Museum, Apollo 11 Command Module Columbia (https://airandspace.si.edu/collection-media/NASM-A19700102000-NASM2016-04272)";
/**
 * The crew entrance and flight deck give the set two distinct staging
 * destinations.
 */
const CREW_COMPARTMENT: string =
  "NASA, The Space Shuttle, Flight Deck and Middeck (https://www.nasa.gov/reference/the-space-shuttle/)";
/** The connecting passage informs the route between the outer walkway and cabin. */
const PASSAGE: string =
  "Smithsonian National Air and Space Museum, Airlock Module, Skylab (https://airandspace.si.edu/collection-objects/airlock-module-skylab/nasm_A19761035000)";
/**
 * Identifiable handholds give crew contact points to start and stop
 * translating.
 */
const MOBILITY_AIDS: string =
  "NASA-STD-3001 Volume 2, sections 8.5.2 and 8.5.5 (https://www.nasa.gov/reference/8-0-architecture-vol-2/#8.5)";

/** Panel thickness in metres for this scenic construction. */
const PANEL: number = 0.08;
/** Nominal aluminium density, kilograms per cubic metre, for the scenic solids. */
const ALUMINIUM_DENSITY: number = 2700;

/**
 * A fictional civilian spacecraft set with an occupiable cabin, rear boarding
 * hatch and forward crew station. The cabin floor is at Y=0, the blunt nose
 * faces +Z and boarding proceeds along +Z from the walkway. The hatch is closed
 * at rest and swings 90 degrees out to -Z on its -X jamb. Two starboard
 * handrails stage a clear glide alongside the crew furniture. Their color and
 * function follow the mobility aid guidance in {@link MOBILITY_AIDS}.
 *
 * @param params The model id and any fixed dimensions in metres.
 * @param seed A number that draws the remaining dimensions. With no seed,
 *   dimensions take the middle of their bands.
 * @returns The set and its local boarding, handrail, seated crew and console
 *   contacts.
 * @throws {AutoMovieArchetypeRefusal} For a dimension outside its authored
 *   band.
 */
export function createSpacecraft(
  params: createSpacecraft.IParams = {},
  seed?: number,
): AutoMovieArchetype<createSpacecraft.Affordance, createSpacecraft.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createSpacecraft.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "spacecraft",
      createSpacecraft.UNITS,
      seed,
      params,
    );
  const d: Record<createSpacecraft.DrawnDimension, number> = draw.dimensions(
    createSpacecraft.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createSpacecraft.Affordance,
    createSpacecraft.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "spacecraft",
    material: "aluminium",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const rear: number = -d.length / 2;
  const nose: number = d.length / 2;
  const shoulder: number = nose - 0.3 * d.length;
  const half: number = d.width / 2;
  const noseHalf: number = 0.6 * half;
  const hull: string = "#aab6bb";
  const deck: string = "#64717a";
  const hatch: string = "#d18a47";
  const glazing: string = "#284955";
  let volume: number = 0;

  /** Add one rectangular scenic solid and account for its material volume. */
  function box(
    id: string,
    size: IAutoMovieVector3,
    at: IAutoMovieVector3,
    color: string,
  ): void {
    builder.box(id, size, at, { color });
    volume += size.x * size.y * size.z;
  }

  /** Connect two cross-sectional strip bounds into a closed convex panel. */
  function panel(
    id: string,
    stations: readonly [number, number],
    edges: readonly [readonly [number, number], readonly [number, number]],
    low: number,
    high: number,
    color: string,
  ): void {
    const corners: IAutoMovieVector3[] = [];
    for (const index of [0, 1] as const)
      for (const x of edges[index])
        corners.push(v(x, low, stations[index]), v(x, high, stations[index]));

    const cell: AutoMovieArchetypeConvexCell.ICell =
      AutoMovieArchetypeConvexCell.of(corners);
    builder.convex(id, cell, undefined, { color });
    volume += cell.volume;
  }

  // The deck and ceiling meet the walls without filling the interior.
  for (const [id, from, to, fromHalf, toHalf] of [
    ["cabin", rear, shoulder, half, half],
    ["nose", shoulder, nose, half, noseHalf],
  ] as const) {
    const stations: readonly [number, number] = [from, to];
    const full: readonly [
      readonly [number, number],
      readonly [number, number],
    ] = [
      [-fromHalf, fromHalf],
      [-toHalf, toHalf],
    ];
    panel(`${id}-deck`, stations, full, -PANEL, 0, deck);
    panel(
      `${id}-roof`,
      stations,
      full,
      d.cabinHeight,
      d.cabinHeight + PANEL,
      hull,
    );
    panel(
      `${id}-port`,
      stations,
      [
        [fromHalf - PANEL, fromHalf],
        [toHalf - PANEL, toHalf],
      ],
      0,
      d.cabinHeight,
      hull,
    );
    panel(
      `${id}-starboard`,
      stations,
      [
        [-fromHalf, PANEL - fromHalf],
        [-toHalf, PANEL - toHalf],
      ],
      0,
      d.cabinHeight,
      hull,
    );
  }

  // The windscreen closes the blunt front of the scenic cabin.
  const sill: number = d.cabinHeight * 0.48;
  const windscreenHeight: number = d.cabinHeight * 0.36;
  box(
    "nose-sill",
    v(2 * noseHalf, sill, PANEL),
    v(0, sill / 2, nose - PANEL / 2),
    hull,
  );
  box(
    "windscreen",
    v(2 * noseHalf, windscreenHeight, PANEL),
    v(0, sill + windscreenHeight / 2, nose - PANEL / 2),
    glazing,
  );
  const brow: number = d.cabinHeight - sill - windscreenHeight;
  box(
    "nose-brow",
    v(2 * noseHalf, brow, PANEL),
    v(0, d.cabinHeight - brow / 2, nose - PANEL / 2),
    hull,
  );

  // The rear wall is solid around the aperture. The leaf closes on its
  // exterior face so a quarter turn leaves the passage between the jambs clear.
  const openingHalf: number = d.hatchWidth / 2;
  const jamb: number = half - openingHalf - PANEL;
  for (const side of [-1, 1] as const)
    box(
      side < 0 ? "rear-starboard" : "rear-port",
      v(jamb, d.cabinHeight, PANEL),
      v(side * (openingHalf + jamb / 2), d.cabinHeight / 2, rear + PANEL / 2),
      hull,
    );
  const lintel: number = d.cabinHeight - d.hatchHeight;
  box(
    "rear-lintel",
    v(d.hatchWidth, lintel, PANEL),
    v(0, d.hatchHeight + lintel / 2, rear + PANEL / 2),
    hull,
  );
  box(
    "hatch-leaf",
    v(d.hatchWidth, d.hatchHeight, PANEL),
    v(0, d.hatchHeight / 2, rear - PANEL / 2),
    hatch,
  );
  const gripRadius: number = 0.016;
  const gripLength: number = 0.18;
  const grip: IAutoMovieVector3 = v(
    openingHalf - 0.15,
    1.03,
    rear - PANEL - 2 * gripRadius,
  );
  builder.rod(
    "hatch-grip",
    gripRadius,
    v(grip.x, grip.y - gripLength / 2, grip.z),
    v(grip.x, grip.y + gripLength / 2, grip.z),
    { color: glazing },
  );
  volume += Math.PI * gripRadius ** 2 * gripLength;
  const bracketDepth: number = rear - PANEL - grip.z;
  for (const end of [-1, 1] as const)
    box(
      end < 0 ? "hatch-grip-bottom" : "hatch-grip-top",
      v(2 * gripRadius, 2 * gripRadius, bracketDepth),
      v(grip.x, grip.y + (end * gripLength) / 2, grip.z + bracketDepth / 2),
      glazing,
    );
  const walkwayZ: number = rear - d.walkwayLength / 2;
  box(
    "walkway",
    v(d.hatchWidth, PANEL, d.walkwayLength),
    v(0, -PANEL / 2, walkwayZ),
    deck,
  );

  // Keep the centerline clear between the rear hatch and the crew station.
  const stationX: number = half - 0.6;
  const consoleZ: number = shoulder + 0.02;
  const seatEdge: number = consoleZ - 0.66;
  const seatHeight: number = 0.46;
  const seatWidth: number = 0.52;
  const seatDepth: number = 0.48;
  const seatBack: number = 0.5;
  const consoleHeight: number = 0.86;
  const consoleWidth: number = 0.72;
  const consoleDepth: number = 0.44;
  box(
    "seat-base",
    v(0.24, seatHeight - PANEL, 0.24),
    v(stationX, (seatHeight - PANEL) / 2, seatEdge - seatDepth / 2),
    deck,
  );
  box(
    "seat-pan",
    v(seatWidth, PANEL, seatDepth),
    v(stationX, seatHeight - PANEL / 2, seatEdge - seatDepth / 2),
    glazing,
  );
  box(
    "seat-back",
    v(seatWidth, seatBack, PANEL),
    v(stationX, seatHeight + seatBack / 2, seatEdge - seatDepth + PANEL / 2),
    glazing,
  );
  box(
    "console-base",
    v(0.24, consoleHeight - PANEL, 0.24),
    v(stationX, (consoleHeight - PANEL) / 2, consoleZ),
    deck,
  );
  box(
    "console-top",
    v(consoleWidth, PANEL, consoleDepth),
    v(stationX, consoleHeight - PANEL / 2, consoleZ),
    glazing,
  );

  // Bracket both grips off the starboard wall on the side clear of furniture.
  const wallX: number = -half + PANEL;
  const railStandOff: number = 0.1;
  const railHeight: number = 1.63;
  const railLength: number = 0.32;
  const railColor: string = "#dfb144";
  for (const [id, setback] of [
    ["aftHandrail", 1.2],
    ["forwardHandrail", 3.6],
  ] as const) {
    const rail: IAutoMovieVector3 = v(
      wallX + railStandOff,
      railHeight,
      rear + setback,
    );
    const aft: number = rail.z - railLength / 2;
    const forward: number = rail.z + railLength / 2;
    builder.rod(
      id,
      gripRadius,
      v(rail.x, rail.y, aft),
      v(rail.x, rail.y, forward),
      { color: railColor },
    );
    volume += Math.PI * gripRadius ** 2 * railLength;
    for (const [end, z] of [
      ["aft", aft],
      ["forward", forward],
    ] as const)
      box(
        `${id}-${end}-bracket`,
        v(railStandOff, 2 * gripRadius, 2 * gripRadius),
        v(wallX + railStandOff / 2, rail.y, z),
        railColor,
      );

    builder.affordance({
      id,
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(rail, v(1, 0, 0), v(0, 0, 1)),
      extent: null,
      grip: "power",
      aperture: 2 * gripRadius,
      length: railLength,
    });
  }

  builder.affordance({
    id: "boardingWalkway",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, walkwayZ)),
    extent: null,
    width: d.hatchWidth,
    depth: d.walkwayLength,
  });
  builder.affordance({
    id: "boardingOpening",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, rear)),
    extent: null,
    width: d.hatchWidth,
    height: d.hatchHeight,
  });
  builder.affordance({
    id: "boardingHatch",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.upright(
      v(-openingHalf, d.hatchHeight / 2, rear),
    ),
    extent: null,
    travel: 90,
    parts: ["hatch-leaf", "hatch-grip", "hatch-grip-bottom", "hatch-grip-top"],
  });
  builder.affordance({
    id: "boardingHandle",
    kind: "handle",
    symmetry: "none",
    frame: AutoMovieArchetypeFrame.facing(grip, v(0, 0, -1), v(0, 1, 0)),
    extent: null,
    grip: "power",
    aperture: 2 * gripRadius,
    length: gripLength,
    rides: "boardingHatch",
  });
  builder.affordance({
    id: "cabinFloor",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0, (rear + shoulder) / 2)),
    extent: null,
    width: d.hatchWidth,
    depth: shoulder - rear,
  });
  builder.affordance({
    id: "crewSeat",
    kind: "seat",
    frame: AutoMovieArchetypeFrame.upright(v(stationX, seatHeight, seatEdge)),
    extent: null,
    width: seatWidth,
    depth: seatDepth,
    back: seatBack,
  });
  builder.affordance({
    id: "controlConsole",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      v(stationX, consoleHeight, consoleZ),
    ),
    extent: null,
    width: consoleWidth,
    depth: consoleDepth,
  });
  return builder.build(draw.derive("mass", volume * ALUMINIUM_DENSITY));
}

/** The spacecraft's typed contacts, dimensions and fictional staging bands. */
export namespace createSpacecraft {
  /**
   * Contacts for the walking route, hatch articulation, cabin mobility and
   * forward crew station.
   */
  export type Affordance =
    | "boardingWalkway"
    | "boardingOpening"
    | "boardingHatch"
    | "boardingHandle"
    | "cabinFloor"
    | "aftHandrail"
    | "forwardHandrail"
    | "crewSeat"
    | "controlConsole";
  /**
   * Drawn dimensions, in metres. Length excludes the walkway and width is at
   * the cabin.
   */
  export type DrawnDimension =
    | "length"
    | "width"
    | "cabinHeight"
    | "hatchWidth"
    | "hatchHeight"
    | "walkwayLength";
  /** The drawn dimensions plus the derived scenic mass in kilograms. */
  export type Dimension = DrawnDimension | "mass";
  /**
   * Optional fixed dimensions in metres. Omitted fields are drawn from their
   * bands.
   */
  export interface IParams extends Partial<Record<DrawnDimension, number>> {
    /** The scene model id, which defaults to spacecraft. */
    id?: string;
  }

  /** Units of the controlled dimensions and derived mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    cabinHeight: "m",
    hatchWidth: "m",
    hatchHeight: "m",
    walkwayLength: "m",
    mass: "kg",
  };

  /**
   * Set design bounds. The references identify the visual cue each dimension
   * supports.
   */
  export const BANDS: Readonly<
    Record<DrawnDimension, IAutoMovieArchetypeBand>
  > = {
    length: AutoMovieArchetypeBand.metres(
      6,
      9,
      `Fictional set length for a blunt tapered silhouette. Analogy: ${CAPSULE}`,
    ),
    width: AutoMovieArchetypeBand.metres(
      3.4,
      5,
      `Fictional cabin width for the central route beside the crew station. Analogy: ${CREW_COMPARTMENT}`,
    ),
    cabinHeight: AutoMovieArchetypeBand.metres(
      2.45,
      3.25,
      `Fictional standing floor-to-ceiling height for cabin scenes. Analogy: ${CREW_COMPARTMENT}`,
    ),
    hatchWidth: AutoMovieArchetypeBand.metres(
      1.25,
      1.6,
      `Fictional clear opening sized for an upright performer. Analogy: ${CAPSULE}`,
    ),
    hatchHeight: AutoMovieArchetypeBand.metres(
      1.95,
      2.2,
      `Fictional clearance for the boarding performer. Analogy: ${CAPSULE}`,
    ),
    walkwayLength: AutoMovieArchetypeBand.metres(
      2,
      4,
      `Fictional run for a full boarding stride before the threshold. Analogy: ${PASSAGE}`,
    ),
  };
}
