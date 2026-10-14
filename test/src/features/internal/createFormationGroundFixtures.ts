import type { IAutoMovieFormationPlacement } from "@automovie/engine";
import type {
  IAutoMovieFormationMotion,
  IAutoMovieSpace,
} from "@automovie/interface";

/** One square floor centred on the origin, walkable everywhere. */
function field(half: number): IAutoMovieSpace {
  return {
    id: "field",
    surfaces: [
      {
        id: "ground",
        kind: "floor",
        polygon: [
          { x: -half, y: 0, z: -half },
          { x: half, y: 0, z: -half },
          { x: half, y: 0, z: half },
          { x: -half, y: 0, z: half },
        ],
        anchor: { x: 0, y: 0, z: 0 },
        rampTo: null,
      },
    ],
    walkable: ["ground"],
  };
}

/** Four actual line slots at the authored reach; no bounding-box proxy is created. */
function unit(
  reach: number,
  id: string = "army",
): IAutoMovieFormationPlacement {
  return {
    id,
    count: 4,
    layout: {
      kind: "line",
      files: 2,
      ranks: 2,
      spacing: { lateral: 2 * reach, depth: reach },
    },
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 0,
  };
}

/** One cue carrying a unit along +z between seconds one and three. */
function march(
  metres: number,
  formation: string = "army",
): IAutoMovieFormationMotion {
  return {
    id: `${formation}-advance`,
    formation,
    action: "advance",
    start: 1,
    end: 3,
    from: {
      translation: { x: 0, y: 0, z: 0 },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    to: {
      translation: { x: 0, y: 0, z: metres },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    easing: "easeInOut",
  };
}

/** Turn the same cue without translation; its long unit can leave ground between endpoints. */
function turn(
  degrees: number,
  formation: string = "army",
): IAutoMovieFormationMotion {
  return {
    ...march(0, formation),
    to: {
      translation: { x: 0, y: 0, z: 0 },
      facingOffsetDeg: degrees,
      spacingScale: { lateral: 1, depth: 1 },
    },
  };
}

/** Carry the unit along the straight authored segment without turning. */
function carry(
  from: { x: number; z: number },
  to: { x: number; z: number },
): IAutoMovieFormationMotion {
  return {
    ...march(0),
    from: {
      translation: { x: from.x, y: 0, z: from.z },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
    to: {
      translation: { x: to.x, y: 0, z: to.z },
      facingOffsetDeg: 0,
      spacingScale: { lateral: 1, depth: 1 },
    },
  };
}

/** Four line slots with a long depth and narrow width, retaining the authored seeds and anchor. */
function lance(
  length: number,
  halfWidth: number,
): IAutoMovieFormationPlacement {
  return {
    id: "army",
    count: 4,
    layout: {
      kind: "line",
      files: 2,
      ranks: 2,
      spacing: { lateral: 2 * halfWidth, depth: length },
    },
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 0,
  };
}

/** Scatter slots within the authored disc; the enclosing square's corners are not members. */
function disc(radius: number, count: number): IAutoMovieFormationPlacement {
  return {
    id: "army",
    count,
    layout: { kind: "scatter", radius, seed: 7 },
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 11,
  };
}

/** Arc slots stand on the authored radius rather than the enclosing square. */
function bow(radius: number, count: number): IAutoMovieFormationPlacement {
  return {
    id: "army",
    count,
    layout: { kind: "arc", radius, arcDegrees: 180 },
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 3,
  };
}

/** Wedge row r holds columns -r through r, with the original row-count population. */
function wedge(rows: number, spacing: number): IAutoMovieFormationPlacement {
  return {
    id: "army",
    count: rows * rows,
    layout: {
      kind: "wedge",
      depth: rows,
      spacing: { lateral: spacing, depth: spacing },
    },
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
    seed: 5,
  };
}

/** A triangular floor carrying the authored wedge without its empty bounding corners. */
function slope(width: number, depth: number): IAutoMovieSpace {
  return {
    id: "slope",
    surfaces: [
      {
        id: "ground",
        kind: "floor",
        polygon: [
          { x: 0, y: 0, z: 0 },
          { x: width, y: 0, z: depth },
          { x: -width, y: 0, z: depth },
        ],
        anchor: { x: 0, y: 0, z: 0 },
        rampTo: null,
      },
    ],
    walkable: ["ground"],
  };
}

/** Two crossed walkable arms leave the quadrants between them unsupported. */
function crossroads(arm: number, halfWidth: number): IAutoMovieSpace {
  return {
    id: "crossroads",
    surfaces: [
      {
        id: "north-road",
        kind: "floor",
        polygon: [
          { x: -halfWidth, y: 0, z: -arm },
          { x: halfWidth, y: 0, z: -arm },
          { x: halfWidth, y: 0, z: arm },
          { x: -halfWidth, y: 0, z: arm },
        ],
        anchor: { x: 0, y: 0, z: 0 },
        rampTo: null,
      },
      {
        id: "east-road",
        kind: "floor",
        polygon: [
          { x: -arm, y: 0, z: -halfWidth },
          { x: arm, y: 0, z: -halfWidth },
          { x: arm, y: 0, z: halfWidth },
          { x: -arm, y: 0, z: halfWidth },
        ],
        anchor: { x: 0, y: 0, z: 0 },
        rampTo: null,
      },
    ],
    walkable: ["north-road", "east-road"],
  };
}

/** A square on its point, independently bounded by |x|+|z| <= reach. */
function diamond(reach: number): IAutoMovieSpace {
  return {
    id: "diamond",
    surfaces: [
      {
        id: "ground",
        kind: "floor",
        polygon: [
          { x: -reach, y: 0, z: 0 },
          { x: 0, y: 0, z: -reach },
          { x: reach, y: 0, z: 0 },
          { x: 0, y: 0, z: reach },
        ],
        anchor: { x: 0, y: 0, z: 0 },
        rampTo: null,
      },
    ],
    walkable: ["ground"],
  };
}

/**
 * Expose the original formation-ground test's existing input constructors.
 * Every call creates only the requested in-memory layout, cue or floor; values,
 * polygon order, ids and seeds retain the original scenarios' authored meaning.
 * The returned constructor references are shared, while their record results
 * remain fresh. No engine output, geometry asset or expected answer is generated.
 */
export function createFormationGroundFixtures(): {
  field: typeof field;
  unit: typeof unit;
  march: typeof march;
  turn: typeof turn;
  carry: typeof carry;
  lance: typeof lance;
  disc: typeof disc;
  bow: typeof bow;
  wedge: typeof wedge;
  slope: typeof slope;
  crossroads: typeof crossroads;
  diamond: typeof diamond;
} {
  return {
    field,
    unit,
    march,
    turn,
    carry,
    lance,
    disc,
    bow,
    wedge,
    slope,
    crossroads,
    diamond,
  };
}
