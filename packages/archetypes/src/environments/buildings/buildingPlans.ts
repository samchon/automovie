import { AutoMovieEnginePlanarRegion } from "@automovie/engine";
import type {
  IAutoMovieProfilePoint,
  IAutoMovieRegionTriangulation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { buildingWalkable } from "./buildingWalkable";
import type { createBuilding } from "./createBuilding";

/**
 * Admit room footprints and storey elevations into a reusable local plan.
 *
 * Positive-area overlap excludes rooms at the same level. Edge and vertex
 * contact remain available to the shared wall construction.
 *
 * @param props Building-local authoring input, in metres.
 * @returns The normalized local plan.
 * @throws Error naming an invalid level, room or opening.
 */
export function buildingPlans(
  props: createBuilding.IProps,
): buildingPlans.IPlan {
  const color: string = props.color ?? "#c1b7a5";
  if ("footprint" in props)
    return {
      kind: "facade",
      region: draftRegion(props.footprint, "facade.footprint"),
      height: positive(props.height, "facade.height"),
      color,
    };

  const wall: number = positive(props.wallThickness ?? 0.15, "wallThickness");
  const slab: number = positive(props.slabThickness ?? 0.18, "slabThickness");
  const levels: buildingPlans.ILevel[] = [];
  const ids: Set<string> = new Set();
  if (props.levels.length === 0) throw new Error("building.levels is empty");
  for (const level of props.levels) {
    admitId(level.id, ids, "building.levels");
    const path: string = `level "${level.id}"`;
    const previous: buildingPlans.ILevel | undefined = levels.at(-1);
    // Every storey owns a floor slab below it and a ceiling slab above it.
    const minimum: number =
      previous === undefined
        ? 0
        : previous.elevation + previous.height + 2 * slab;
    const elevation: number = level.elevation ?? minimum;
    const height: number = positive(level.height ?? 2.8, `${path}.height`);
    if (previous !== undefined && elevation < minimum)
      throw new Error(
        `${path}.elevation must be finite and clear the previous storey and both slabs`,
      );
    const names: Set<string> = new Set();
    const rooms: buildingPlans.IRoom[] = [];
    for (const [id, footprint] of Object.entries(level.rooms)) {
      admitId(id, names, `${path}.rooms`);
      const region: buildingPlans.IRegion = draftRegion(
        footprint,
        `${path}.rooms.${id}`,
      );
      for (const other of rooms)
        if (interiorsMeet(region, other.region))
          throw new Error(
            `${path}: rooms "${other.id}" and "${id}" have overlapping interiors`,
          );
      rooms.push({ id, region, support: region });
    }
    if (rooms.length === 0) throw new Error(`${path}.rooms is empty`);
    const openings: createBuilding.Opening[] = structuredClone([
      ...(level.openings ?? []),
    ]);
    for (const opening of openings) {
      admitId(opening.id, names, `${path}.openings`);
      const [from, to] = opening.between;
      if (
        from === to ||
        !rooms.some((room: buildingPlans.IRoom): boolean => room.id === from) ||
        (to !== null &&
          !rooms.some((room: buildingPlans.IRoom): boolean => room.id === to))
      )
        throw new Error(
          `${path}.openings.${opening.id} names an invalid room pair`,
        );
    }
    levels.push({ id: level.id, elevation, height, rooms, openings });
  }
  const stairs: buildingPlans.IStair[] = [];
  const stairNames: Set<string> = new Set();
  for (const stair of props.stairs ?? []) {
    admitId(stair.id, stairNames, "building.stairs");
    stairs.push(prepareStair(stair, levels));
  }
  for (const level of levels)
    for (const room of level.rooms) {
      const floor: buildingPlans.IRegion = room.floor ?? room.region;
      room.support = buildingWalkable(
        room.region.rings,
        floor.rings,
        floor.anchor,
        wall / 2,
        `level "${level.id}".rooms.${room.id}`,
      );
    }
  return { kind: "plan", levels, stairs, wall, slab, color };
}

/** Normalized local geometry shared by the wall, slab and support assemblers. */
export namespace buildingPlans {
  /** An admitted planar region in XZ metres. */
  export interface IRegion {
    /**
     * Canonically wound triangulation, with the planar Y component standing for
     * Z.
     */
    readonly region: IAutoMovieRegionTriangulation;

    /** Outer ring followed by any holes, each in canonical winding. */
    readonly rings: IAutoMovieProfilePoint[][];

    /** Rectangle center or an interior point of the largest triangle. */
    readonly anchor: IAutoMovieProfilePoint;

    /** Min X and Z followed by Max X and Z, in metres. */
    readonly bounds: readonly [number, number, number, number];
  }

  /** A named room in one normalized level. */
  export interface IRoom {
    /** Path segment unique to this level. */
    readonly id: string;

    /** Room's local floor plan. */
    readonly region: IRegion;

    /** Walkable portion of the floor beyond the physical wall thickness. */
    support: Pick<IRegion, "rings" | "anchor">;

    /** Floor region after adding any generated stair voids. */
    floor?: IRegion;

    /** Ceiling region after adding any generated stair voids. */
    ceiling?: IRegion;
  }

  /** One normalized storey in local metres. */
  export interface ILevel {
    /** Path segment unique to this building. */
    readonly id: string;

    /** Finished floor above the local origin, metres. */
    readonly elevation: number;

    /** Clear storey height, metres. */
    readonly height: number;

    /** Admitted rooms in author order. */
    readonly rooms: readonly IRoom[];

    /** Owned copy of the aperture declarations. */
    readonly openings: readonly createBuilding.Opening[];
  }

  /** A stair with its resolved endpoints and exact adjoining slab cut. */
  export interface IStair {
    /** Stair id scoped by the building. */
    readonly id: string;

    /** Admitted logical room ids in ascent order. */
    readonly rooms: readonly [string, string];

    /** Building-local landing endpoints in metres. */
    readonly endpoints: readonly [IAutoMovieVector3, IAutoMovieVector3];

    /** Clear width across the flight in metres. */
    readonly width: number;

    /** Number of equal steps, including the upper tread. */
    readonly steps: number;

    /** Smaller clear height of the two attached rooms in metres. */
    readonly clearHeight: number;
  }

  /** Closed internal choice of interior building or facade mass. */
  export type IPlan =
    | {
        readonly kind: "facade";
        readonly region: IRegion;
        readonly height: number;
        readonly color: string;
      }
    | {
        readonly kind: "plan";
        readonly levels: readonly ILevel[];
        readonly stairs: readonly IStair[];
        readonly wall: number;
        readonly slab: number;
        readonly color: string;
      };
}

/** Resolve the levels and apply one stair corridor as both required slab holes. */
function prepareStair(
  stair: createBuilding.Stair,
  levels: readonly buildingPlans.ILevel[],
): buildingPlans.IStair {
  const path: string = `building.stairs.${stair.id}`;
  const lowerIndex: number = levels.findIndex(
    (level: buildingPlans.ILevel): boolean => level.id === stair.from[0],
  );
  const lower: buildingPlans.ILevel | undefined = levels[lowerIndex];
  const upper: buildingPlans.ILevel | undefined = levels[lowerIndex + 1];
  const room: buildingPlans.IRoom | undefined = lower?.rooms.find(
    (candidate: buildingPlans.IRoom): boolean => candidate.id === stair.from[1],
  );
  const landing: buildingPlans.IRoom | undefined = upper?.rooms.find(
    (candidate: buildingPlans.IRoom): boolean => candidate.id === stair.to[1],
  );
  if (
    lower === undefined ||
    upper?.id !== stair.to[0] ||
    room === undefined ||
    landing === undefined
  )
    throw new Error(
      `${path} must name rooms on adjacent levels in ascending order`,
    );
  const width: number = positive(stair.width, `${path}.width`);
  const [from, to] = stair.run;
  const dx: number = to[0] - from[0];
  const dz: number = to[1] - from[1];
  const run: number = positive(Math.hypot(dx, dz), `${path}.run`);
  // Rotating the along-run vector in the plan gives the same +X axis as
  // the span's right-handed +Z yaw. Use one corridor for both slab cuts.
  const x: number = ((dz / run) * width) / 2;
  const z: number = ((-dx / run) * width) / 2;
  const cut: readonly createBuilding.Point[] = [
    [from[0] - x, from[1] - z],
    [from[0] + x, from[1] + z],
    [to[0] + x, to[1] + z],
    [to[0] - x, to[1] - z],
  ];
  room.ceiling = addCut(room.ceiling ?? room.region, cut, `${path}.ceiling`);
  landing.floor = addCut(landing.floor ?? landing.region, cut, `${path}.floor`);
  return {
    id: stair.id,
    rooms: [`${lower.id}/${room.id}`, `${upper.id}/${landing.id}`],
    endpoints: [
      { x: from[0], y: lower.elevation, z: from[1] },
      { x: to[0], y: upper.elevation, z: to[1] },
    ],
    width,
    steps: stair.steps,
    clearHeight: Math.min(lower.height, upper.height),
  };
}

/**
 * Re-admit a slab with a new, strictly contained void along with its prior
 * holes.
 */
function addCut(
  region: buildingPlans.IRegion,
  cut: readonly createBuilding.Point[],
  path: string,
): buildingPlans.IRegion {
  /** Convert one stored canonical ring back to the compact plan input. */
  const ring = (
    points: readonly IAutoMovieProfilePoint[],
  ): createBuilding.Point[] =>
    points.map(({ x, y }): createBuilding.Point => [x, y]);
  return draftRegion(
    {
      polygon: ring(region.rings[0]!),
      holes: [...region.rings.slice(1).map(ring), cut],
    },
    path,
  );
}

/** Admit a strictly positive finite metre dimension and retain its value. */
function positive(value: number, path: string): number {
  if (value <= 0) throw new Error(`${path} must be positive and finite`);
  return value;
}

/** Admit a local anchor path segment against all earlier names at its level. */
function admitId(id: string, names: Set<string>, path: string): void {
  if (id.trim().length === 0 || id.includes("/") || id === "." || id === "..")
    throw new Error(`${path} has invalid path segment "${id}"`);
  if (names.has(id)) throw new Error(`${path} repeats name "${id}"`);
  names.add(id);
}

/**
 * Turn either footprint syntax into canonical rings, shared triangles and a
 * guaranteed interior frame origin.
 */
function draftRegion(
  footprint: createBuilding.Footprint,
  path: string,
): buildingPlans.IRegion {
  let outer: readonly createBuilding.Point[];
  let holes: readonly (readonly createBuilding.Point[])[] = [];
  let center: IAutoMovieProfilePoint | undefined;
  if ("polygon" in footprint) {
    outer = footprint.polygon;
    holes = footprint.holes ?? [];
  } else {
    const [x, z, width, depth] = footprint;
    const right: number = x + positive(width, `${path}.width`);
    const back: number = z + positive(depth, `${path}.depth`);
    outer = [
      [x, z],
      [right, z],
      [right, back],
      [x, back],
    ];
    center = { x: x + width / 2, y: z + depth / 2 };
  }
  let region: IAutoMovieRegionTriangulation;
  try {
    region = AutoMovieEnginePlanarRegion.triangulate({
      outer: outer.map(planPoint),
      holes: holes.map((ring): IAutoMovieProfilePoint[] => ring.map(planPoint)),
    });
  } catch (error) {
    throw new Error(
      `${path}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const rings: IAutoMovieProfilePoint[][] = region.rings.map(
    ({ start, count }): IAutoMovieProfilePoint[] =>
      region.points.slice(start, start + count),
  );
  const bounds: [number, number, number, number] = [
    Infinity,
    Infinity,
    -Infinity,
    -Infinity,
  ];
  for (const { x, y } of rings[0]!) {
    bounds[0] = Math.min(bounds[0], x);
    bounds[1] = Math.min(bounds[1], y);
    bounds[2] = Math.max(bounds[2], x);
    bounds[3] = Math.max(bounds[3], y);
  }
  return {
    region,
    rings,
    anchor: center ?? largestTriangleCenter(region),
    bounds,
  };
}

/** Interpret the second tuple ordinate as planar Y for the XZ analysis. */
function planPoint([x, y]: createBuilding.Point): IAutoMovieProfilePoint {
  return { x, y };
}

/**
 * Return the centroid of the largest admitted triangle, strictly in the plan
 * region.
 */
function largestTriangleCenter(
  region: IAutoMovieRegionTriangulation,
): IAutoMovieProfilePoint {
  let largest: number = -Infinity;
  let center: IAutoMovieProfilePoint = { x: 0, y: 0 };
  for (let i: number = 0; i < region.triangles.length; i += 3) {
    const [a, b, c] = triangle(region, i);
    const area: number = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    if (area > largest) {
      largest = area;
      center = {
        x: a.x + (b.x - a.x + c.x - a.x) / 3,
        y: a.y + (b.y - a.y + c.y - a.y) / 3,
      };
    }
  }
  return center;
}

/** Which two plan interiors share area rather than only an edge or vertex. */
function interiorsMeet(
  a: buildingPlans.IRegion,
  b: buildingPlans.IRegion,
): boolean {
  if (
    a.bounds[0] >= b.bounds[2] ||
    b.bounds[0] >= a.bounds[2] ||
    a.bounds[1] >= b.bounds[3] ||
    b.bounds[1] >= a.bounds[3]
  )
    return false;
  for (let i: number = 0; i < a.region.triangles.length; i += 3) {
    const first: readonly IAutoMovieProfilePoint[] = triangle(a.region, i);
    for (let j: number = 0; j < b.region.triangles.length; j += 3) {
      const second: readonly IAutoMovieProfilePoint[] = triangle(b.region, j);
      if (!separated(first, second) && !separated(second, first)) return true;
    }
  }
  return false;
}

/** Three corners from the admitted triangulation, starting at one index offset. */
function triangle(
  region: IAutoMovieRegionTriangulation,
  offset: number,
): readonly [
  IAutoMovieProfilePoint,
  IAutoMovieProfilePoint,
  IAutoMovieProfilePoint,
] {
  return [
    region.points[region.triangles[offset]!]!,
    region.points[region.triangles[offset + 1]!]!,
    region.points[region.triangles[offset + 2]!]!,
  ];
}

/** Test projections onto the three normalized edge normals in local metres. */
function separated(
  first: readonly IAutoMovieProfilePoint[],
  second: readonly IAutoMovieProfilePoint[],
): boolean {
  return first.some((a: IAutoMovieProfilePoint, edge: number): boolean => {
    const b: IAutoMovieProfilePoint = first[(edge + 1) % 3]!;
    const length: number = Math.hypot(b.x - a.x, b.y - a.y);
    const x: number = (a.y - b.y) / length;
    const y: number = (b.x - a.x) / length;
    /** Project relative to the edge origin to preserve local precision. */
    const project = (p: IAutoMovieProfilePoint): number =>
      (p.x - a.x) * x + (p.y - a.y) * y;
    const u: number[] = first.map(project);
    const v: number[] = second.map(project);
    return (
      Math.min(Math.max(...u), Math.max(...v)) <=
      Math.max(Math.min(...u), Math.min(...v)) + 1e-9
    );
  });
}
