import { AutoMovieEnginePlanarRegion, Quaternion, AutoMovieEnginePlanarGeometry } from "@automovie/engine";
import type {
  IAutoMovieEnvironmentModule,
  IAutoMoviePlanarPoint,
  IAutoMovieTerrainRecipe,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * A resolved area with a level apron and a smooth transition to its
 * surroundings.
 */
interface IPad {
  /** Scoped diagnostic name. */
  id: string;

  /** World XZ stored under the shared planar X/Y names. */
  outline: IAutoMoviePlanarPoint[];

  /** Level world Y and shoulder width in metres. */
  height: number;
  shoulder: number;
  /** A separately built floor owns support inside this plateau. */
  cut: boolean;
}

/** Consecutive grade vertices and the length of their usable rise. */
interface ISegment {
  /** Endpoints in world metres. */
  from: IAutoMovieVector3;
  to: IAutoMovieVector3;

  /** Length and landing lengths in plan metres. */
  length: number;
  fromLanding: number;
  toLanding: number;
}

/** One resolved grade corridor sharing path coordinates with the runtime route. */
interface IPath {
  /** Stable local key and scoped diagnostic identity. */
  name: string;
  id: string;

  /** Corridor and shoulder metres. */
  radius: number;
  shoulder: number;

  /** Maximum absolute slope, in metres per metre, if constrained. */
  maxSlope: number | undefined;

  /** Ordered world waypoints and the hard anchors among them. */
  points: IAutoMovieVector3[];
  fixed: boolean[];

  /** Graded segments in order. */
  segments: ISegment[];
}

/** Prepared scene placement constraints and their base-height reader. */
interface ITerrainGrades {
  /** Narrowest apron or path feature whose bake requires more than one cell. */
  featureSize: number;

  /** Common level of all grade constraints, when every grade is at one height. */
  commonLevel: number | undefined;

  /** Resolved paths, in authored order. */
  paths: IPath[];

  /** Grade pads whose structures own support inside their footprint. */
  cuts: IAutoMovieVector3[][];

  /** One continuous blend away from the declared hard grade regions. */
  height: (point: { x: number; z: number }) => number;

  /**
   * Closest paved, raised or deliberately cleared source within a trunk's
   * protection radius.
   */
  protectedArea: (
    center: IAutoMoviePlanarPoint,
    radius: number,
  ) => string | null;
}

/**
 * Resolve grade authority before sampling any terrain cells.
 *
 * Pads first reserve a level apron over half their declared shoulder. Paths
 * take heights from that plan, or from a named frame that pins the exact
 * waypoint. A pinned waypoint gets a short level landing on each incident
 * segment. Adjacent shoulders use smoothstep falloff.
 *
 * @param context The terrain's world placement and environment-relative anchor
 *   lookup.
 * @param recipe Widths, ordered local plan coordinates, and named heights for
 *   the parcel.
 * @param base The finite, ungraded world-height sampler.
 * @returns Resolved paths and an evaluator for the shared ground lattice.
 */
export function prepareTerrainGrades(
  context: IAutoMovieEnvironmentModule.IContext,
  recipe: IAutoMovieTerrainRecipe,
  base: (point: { x: number; z: number }) => number,
): ITerrainGrades {
  const origin: IAutoMovieVector3 = context.frame.translation;
  const pads: IPad[] = Object.entries(recipe.pads ?? {}).map(
    ([name, pad]: [string, IAutoMovieTerrainRecipe.IPad]): IPad =>
      preparePad(context, recipe.size, "pads", name, pad),
  );
  const waters: IPad[] = Object.entries(recipe.water ?? {}).map(
    ([name, water]: [string, IAutoMovieTerrainRecipe.IWater]): IPad =>
      preparePad(context, recipe.size, "water", name, water),
  );
  const grades: IPad[] = [...pads, ...waters];
  for (let first: number = 0; first < grades.length; first += 1)
    for (let second: number = first + 1; second < grades.length; second += 1) {
      const a: IPad = grades[first]!;
      const b: IPad = grades[second]!;
      if (a.height !== b.height && AutoMovieEnginePlanarGeometry.polygonsOverlap(a.outline, b.outline))
        throw new Error(
          `Terrain grades "${a.id}" and "${b.id}" overlap at different heights.`,
        );
    }

  function padAt(point: IAutoMoviePlanarPoint): IPad | undefined {
    let chosen: IPad | undefined;
    for (const pad of grades) {
      if (ringDistance(point, pad.outline) > pad.shoulder / 2) continue;
      if (chosen !== undefined && chosen.height !== pad.height)
        throw new Error(
          `Terrain aprons "${chosen.id}" and "${pad.id}" overlap at different heights.`,
        );
      chosen = pad;
    }
    return chosen;
  }

  const paths: IPath[] = Object.entries(recipe.paths ?? {}).map(
    ([name, path]: [string, IAutoMovieTerrainRecipe.IPath]): IPath =>
      preparePath(context, name, path, base, padAt),
  );
  const holes: IAutoMoviePlanarPoint[][] = (recipe.holes ?? []).map(
    (ring: readonly IAutoMovieTerrainRecipe.IXzPoint[]): IAutoMoviePlanarPoint[] =>
      ring.map(
        ({ x, z }: IAutoMovieTerrainRecipe.IXzPoint): IAutoMoviePlanarPoint => ({
          x: origin.x + x,
          y: origin.z + z,
        }),
      ),
  );
  const levels: number[] = grades.map((pad: IPad): number => pad.height);
  let featureSize: number = Infinity;
  for (const pad of grades)
    featureSize = Math.min(featureSize, pad.shoulder / 2);
  for (const path of paths) {
    featureSize = Math.min(featureSize, path.radius, path.shoulder);
    for (const segment of path.segments) {
      if (segment.fromLanding > 0)
        featureSize = Math.min(featureSize, segment.fromLanding);
      if (segment.toLanding > 0)
        featureSize = Math.min(featureSize, segment.toLanding);
    }
    for (const point of path.points) levels.push(point.y);
  }
  return {
    featureSize,
    commonLevel: levels.every((level: number): boolean => level === levels[0])
      ? levels[0]
      : undefined,
    paths,
    cuts: pads
      .filter((pad: IPad): boolean => pad.cut)
      .map((pad: IPad): IAutoMovieVector3[] =>
        pad.outline.map(
          (point: IAutoMoviePlanarPoint): IAutoMovieVector3 => ({
            x: point.x,
            y: 0,
            z: point.y,
          }),
        ),
      ),
    height: ({ x, z }: { x: number; z: number }): number => {
      const point: IAutoMoviePlanarPoint = { x, y: z };
      const fixed: IPad | undefined = padAt(point);
      if (fixed !== undefined) return fixed.height;

      // Uncovered fractions multiply (Porter and Duff, Compositing Digital
      // Images, SIGGRAPH 1984, §4.1). Target heights retain their weighted mean.
      let coverage: number = 0;
      let weight: number = 0;
      let total: number = 0;
      for (const pad of grades) {
        const w: number = taper(
          (ringDistance(point, pad.outline) - pad.shoulder / 2) /
            (pad.shoulder / 2),
        );
        coverage += (1 - coverage) * w;
        weight += w;
        total += w * pad.height;
      }
      for (const path of paths) {
        const [distance, level]: readonly [number, number] = pathGrade(
          point,
          path,
        );
        const w: number = taper((distance - path.radius) / path.shoulder);
        coverage += (1 - coverage) * w;
        weight += w;
        total += w * level;
      }
      const ground: number = base({ x, z });
      if (weight === 0) return ground;
      return ground + coverage * (total / weight - ground);
    },
    protectedArea: (
      center: IAutoMoviePlanarPoint,
      radius: number,
    ): string | null => {
      for (const pad of grades)
        if (ringDistance(center, pad.outline) <= radius) return pad.id;
      for (const path of paths)
        if (pathGrade(center, path)[0] <= path.radius + radius) return path.id;
      const hole: number = holes.findIndex(
        (outline: IAutoMoviePlanarPoint[]): boolean =>
          ringDistance(center, outline) <= radius,
      );
      return hole === -1 ? null : `${context.id}/holes/${hole}`;
    },
  };
}

/**
 * Resolve a local pad ring through its optional named pose and establish its
 * plateau height.
 */
function preparePad(
  context: IAutoMovieEnvironmentModule.IContext,
  size: IAutoMovieTerrainRecipe.ISize,
  family: string,
  name: string,
  pad: IAutoMovieTerrainRecipe.IPad,
): IPad {
  const id: string = `${context.id}/${family}/${name}`;
  const frame: IAutoMovieTransform =
    pad.at === undefined ? context.frame : context.anchor(pad.at);
  if (frame.rotation.x !== 0 || frame.rotation.z !== 0)
    throw new Error(`Terrain grade "${id}" requires an upright pad frame.`);
  const outline: IAutoMoviePlanarPoint[] = pad.outline.map(
    ({ x, z }: IAutoMovieTerrainRecipe.IXzPoint): IAutoMoviePlanarPoint => {
      const point: IAutoMovieVector3 = Quaternion.rotateVector(frame.rotation, {
        x,
        y: 0,
        z,
      });
      return {
        x: frame.translation.x + point.x,
        y: frame.translation.z + point.z,
      };
    },
  );
  const failure: string | null = AutoMovieEnginePlanarRegion.failure(
    {
      outer: outline,
    },
    id,
  );
  if (failure !== null) throw new Error(failure);
  const origin: IAutoMovieVector3 = context.frame.translation;
  if (
    outline.some(
      (point: IAutoMoviePlanarPoint): boolean =>
        point.x < origin.x ||
        point.y < origin.z ||
        point.x > origin.x + size.width ||
        point.y > origin.z + size.depth,
    )
  )
    throw new Error(`Terrain grade "${id}" is outside its parcel.`);
  const height: number =
    pad.height === undefined
      ? frame.translation.y
      : typeof pad.height === "number"
        ? context.frame.translation.y + pad.height
        : context.anchor(pad.height.anchor).translation.y;
  const shoulder: number = pad.shoulder ?? 1;
  if (shoulder <= 0)
    throw new Error(
      `Terrain grade "${id}" requires a finite height and positive finite shoulder.`,
    );
  return { id, outline, height, shoulder, cut: pad.cut ?? false };
}

/**
 * Resolve waypoint heights, plateau entrances and the grade along each
 * successive segment.
 */
function preparePath(
  context: IAutoMovieEnvironmentModule.IContext,
  name: string,
  recipe: IAutoMovieTerrainRecipe.IPath,
  base: (point: { x: number; z: number }) => number,
  padAt: (point: IAutoMoviePlanarPoint) => IPad | undefined,
): IPath {
  const id: string = `${context.id}/paths/${name}`;
  const radius: number = recipe.width / 2;
  const shoulder: number = recipe.shoulder ?? radius;
  const maxSlope: number | undefined = recipe.maxSlope;
  if (
    recipe.points.length < 2 ||
    radius <= 0 ||
    shoulder <= 0 ||
    (maxSlope !== undefined && maxSlope < 0)
  )
    throw new Error(
      `Terrain path "${id}" requires at least two waypoints, positive widths and any slope limit to be finite and nonnegative.`,
    );
  const fixed: boolean[] = [];
  const points: IAutoMovieVector3[] = recipe.points.map(
    (
      point: IAutoMovieTerrainRecipe.IXzPoint | { anchor: string },
      index: number,
    ): IAutoMovieVector3 => {
      const origin: IAutoMovieVector3 = context.frame.translation;
      const anchored: IAutoMovieVector3 | undefined =
        "anchor" in point
          ? context.anchor(point.anchor).translation
          : undefined;
      const x: number = "anchor" in point ? anchored!.x : origin.x + point.x;
      const z: number = "anchor" in point ? anchored!.z : origin.z + point.z;
      const pad: IPad | undefined = padAt({ x, y: z });
      const y: number = anchored?.y ?? pad?.height ?? base({ x, z });
      if (pad !== undefined && anchored !== undefined && y !== pad.height)
        throw new Error(
          `Terrain path "${id}" waypoint ${index} conflicts with the level of "${pad.id}".`,
        );
      fixed.push(anchored !== undefined || pad !== undefined);
      return { x, y, z };
    },
  );
  const segments: ISegment[] = [];
  for (let index: number = 0; index + 1 < points.length; index += 1) {
    const from: IAutoMovieVector3 = points[index]!;
    const to: IAutoMovieVector3 = points[index + 1]!;
    const length: number = Math.hypot(to.x - from.x, to.z - from.z);
    if (length <= 0)
      throw new Error(
        `Terrain path "${id}" segment ${index} has no finite run.`,
      );
    const landing: number = Math.min(radius, length / 4);
    const fromLanding: number = fixed[index] ? landing : 0;
    const toLanding: number = fixed[index + 1] ? landing : 0;
    const required: number =
      Math.abs(to.y - from.y) / (length - fromLanding - toLanding);
    if (maxSlope !== undefined && required > maxSlope)
      throw new Error(
        `Terrain path "${id}" segment ${index} requires slope ${required} between its waypoint constraints (limit ${maxSlope}).`,
      );
    segments.push({ from, to, length, fromLanding, toLanding });
  }
  return { id, name, points, fixed, segments, radius, shoulder, maxSlope };
}

/** Unsigned distance to a closed polygon, including zero over its interior. */
function ringDistance(
  point: IAutoMoviePlanarPoint,
  outline: readonly IAutoMoviePlanarPoint[],
): number {
  if (AutoMovieEnginePlanarGeometry.pointInPolygon(point, outline)) return 0;
  let distance: number = Infinity;
  for (let edge: number = 0; edge < outline.length; edge += 1) {
    const a: IAutoMoviePlanarPoint = outline[edge]!;
    const b: IAutoMoviePlanarPoint = outline[(edge + 1) % outline.length]!;
    const dx: number = b.x - a.x;
    const dy: number = b.y - a.y;
    const length: number = Math.hypot(dx, dy);
    const along: number = projection(
      point.x - a.x,
      point.y - a.y,
      dx,
      dy,
      length,
    );
    distance = Math.min(
      distance,
      Math.hypot(
        point.x - a.x - (dx / length) * along,
        point.y - a.y - (dy / length) * along,
      ),
    );
  }
  return distance;
}

/** Distance and plateau-aware height at the closest point of a centerline. */
function pathGrade(
  point: IAutoMoviePlanarPoint,
  path: IPath,
): [number, number] {
  let distance: number = Infinity;
  let height: number = path.points[0]!.y;
  for (const segment of path.segments) {
    const { from, to, length, fromLanding, toLanding }: ISegment = segment;
    const dx: number = to.x - from.x;
    const dz: number = to.z - from.z;
    const along: number = projection(
      point.x - from.x,
      point.y - from.z,
      dx,
      dz,
      length,
    );
    const candidate: number = Math.hypot(
      point.x - from.x - (dx / length) * along,
      point.y - from.z - (dz / length) * along,
    );
    if (candidate >= distance) continue;
    distance = candidate;
    const progress: number = Math.max(
      0,
      Math.min(1, (along - fromLanding) / (length - fromLanding - toLanding)),
    );
    height = from.y * (1 - progress) + to.y * progress;
  }
  return [distance, height];
}

/** Arc position of the closest point on a finite segment. */
function projection(
  x: number,
  z: number,
  dx: number,
  dz: number,
  length: number,
): number {
  return Math.max(0, Math.min(length, x * (dx / length) + z * (dz / length)));
}

/** Cubic smoothstep complement on a normalized shoulder coordinate. */
function taper(progress: number): number {
  const t: number = Math.max(0, Math.min(1, progress));
  return 1 - t * t * (3 - 2 * t);
}
