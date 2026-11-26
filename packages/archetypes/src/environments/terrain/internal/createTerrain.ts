import { AutoMovieEngineSpace, AutoMovieEngineRandom, Quaternion, validateSpace, AutoMovieEngineMath } from "@automovie/engine";

import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieFootprint,
  IAutoMovieHeightRule,
  IAutoMovieSpace,
  IAutoMovieSurface,
  IAutoMovieTerrainRecipe,
  IAutoMovieTransform,
  IAutoMovieValidation,
  IAutoMovieVector3,
  IAutoMovieWorldRoute,
  IAutoMovieWorldSurface,
} from "@automovie/interface";

import { admitTerrainRoute } from "../admitTerrainRoute";
import { bakeTerrainHeight } from "../bakeTerrainHeight";
import { prepareTerrainGrades } from "../prepareTerrainGrades";
import { terrainTrees } from "../terrainTrees";
import { terrainWoods } from "../terrainWoods";

/** Default coarse appearance for bare, dry ground. */
const EARTH: string = "#85846a";

/** Default coarse appearance for still inland water. */
const WATER: string = "#618ca2";

/** Default permitted vertical mesh error in metres. */
const MESH_TOLERANCE: number = 0.01;

/** A placed grade path ready to check against the approved ground lattice. */
type IPath = ReturnType<typeof prepareTerrainGrades>["paths"][number];

/**
 * The base relief before grades: an analytic rule or a sampler with its first
 * bake pitch.
 */
interface ITerrainBase {
  /**
   * The analytic rule of level or planar relief; undefined when the relief must
   * be baked.
   */
  rule: IAutoMovieHeightRule | undefined;

  /**
   * The first bake pitch in metres the relief alone needs; infinite for an
   * analytic rule.
   */
  pitch: number;

  /** The base height in world metres at a world plan point. */
  sample: (point: { x: number; z: number }) => number;

  /**
   * What the author can change when the bake's sample budget refuses this
   * relief.
   */
  advice?: string;
}

/**
 * Create a world-aligned terrain module with named placement and route frames.
 *
 * The module origin is its southwest plan corner. Resolve building elevations
 * independently before placing pads or paths at those building frames. The
 * returned support surfaces and world pieces use the same heights and area.
 * Material regions replace the parent patch within their footprints. A cut
 * excludes ground in both outputs, and still water uses its own nonwalkable
 * patch. An optional tree disk produces a compact instance recipe, and an
 * optional wood an explicit one whose trees each clear those features.
 *
 * @param recipe Extent, optional relief and features in module-local metres.
 * @returns A definition to place in a composed environment.
 */
export function createTerrain(
  recipe: IAutoMovieTerrainRecipe,
): IAutoMovieEnvironmentModule {
  return (
    context: IAutoMovieEnvironmentModule.IContext,
  ): IAutoMovieEnvironmentContribution => {
    const origin: IAutoMovieVector3 = context.frame.translation;
    const { x, y, z, w }: IAutoMovieTransform["rotation"] =
      context.frame.rotation;
    if (x !== 0 || y !== 0 || z !== 0 || Math.abs(w) !== 1)
      throw new Error(
        `Terrain "${context.id}" must be placed without rotation in the world-aligned plan.`,
      );
    const [width, depth]: IAutoMovieTerrainRecipe.Point = recipe.size;
    const right: number = origin.x + width;
    const far: number = origin.z + depth;
    const tolerance: number = recipe.meshTolerance ?? MESH_TOLERANCE;
    if (right <= origin.x || far <= origin.z || tolerance <= 0)
      throw new Error(
        `Terrain "${context.id}" requires a representable positive extent and mesh tolerance.`,
      );

    const base: ReturnType<typeof terrainBase> = terrainBase(context, recipe);
    const grades: ReturnType<typeof prepareTerrainGrades> =
      prepareTerrainGrades(context, recipe, base.sample);
    const rule: IAutoMovieHeightRule = terrainHeight(
      context,
      recipe,
      tolerance,
      base,
      grades,
    );
    const ring: (
      points: readonly IAutoMovieTerrainRecipe.Point[],
    ) => IAutoMovieVector3[] = (
      points: readonly IAutoMovieTerrainRecipe.Point[],
    ): IAutoMovieVector3[] =>
      points.map(
        ([px, pz]: IAutoMovieTerrainRecipe.Point): IAutoMovieVector3 => ({
          x: origin.x + px,
          y: 0,
          z: origin.z + pz,
        }),
      );
    const outer: IAutoMovieVector3[] = ring([
      [0, 0],
      [width, 0],
      [width, depth],
      [0, depth],
    ]);
    const landHoles: IAutoMovieVector3[][] = [
      ...(recipe.holes ?? []).map(ring),
      ...grades.cuts,
    ];
    const inlays: IAutoMovieSurface[] = Object.entries(
      recipe.regions ?? {},
    ).map(
      ([name, region]: [
        string,
        IAutoMovieTerrainRecipe.IRegion,
      ]): IAutoMovieSurface => ({
        id: `${context.id}/regions/${name}`,
        kind: "floor",
        polygon: ring(region.outline),
        height: rule,
        color: region.color,
      }),
    );
    const water: IAutoMovieSurface[] = Object.entries(recipe.water ?? {}).map(
      ([name, feature]: [
        string,
        IAutoMovieTerrainRecipe.IWater,
      ]): IAutoMovieSurface => ({
        id: `${context.id}/water/${name}`,
        kind: "floor",
        polygon: ring(feature.outline),
        height: { kind: "constant", value: origin.y + feature.height },
        color: feature.color ?? AutoMovieEngineMath.srgbHexToLinearColor(WATER),
      }),
    );
    landHoles.push(
      ...water.map(
        (surface: IAutoMovieSurface): IAutoMovieVector3[] => surface.polygon,
      ),
    );
    const ground: IAutoMovieSurface = {
      id: `${context.id}/ground`,
      kind: "floor",
      polygon: outer,
      holes: [
        ...landHoles,
        ...inlays.map(
          (surface: IAutoMovieSurface): IAutoMovieVector3[] => surface.polygon,
        ),
      ],
      height: rule,
      color: recipe.color ?? AutoMovieEngineMath.srgbHexToLinearColor(EARTH),
    };
    const space: IAutoMovieSpace = {
      id: context.id,
      surfaces: [ground, ...inlays, ...water],
      walkable: [
        ground.id,
        ...inlays.map((surface: IAutoMovieSurface): string => surface.id),
      ],
    };
    const validation: IAutoMovieValidation = validateSpace({ space });
    if (validation.success === false) {
      const failure: IAutoMovieValidation.IFailure["violations"][number] =
        validation.violations[0]!;
      throw new Error(
        `Terrain "${context.id}" ${failure.path}: ${failure.expected}.`,
      );
    }
    const land: IAutoMovieFootprint = AutoMovieEngineSpace.surfaceFootprint({
      ...ground,
      holes: landHoles,
    });
    const anchors: Record<string, IAutoMovieTransform> = Object.create(null);
    const routes: IAutoMovieWorldRoute[] = grades.paths.map(
      (path: IPath): IAutoMovieWorldRoute => {
        admitTerrainRoute(path, land, rule);
        anchors[`paths/${path.name}/start`] = routeEnd(path, rule, 0, 1);
        anchors[`paths/${path.name}/end`] = routeEnd(
          path,
          rule,
          path.points.length - 1,
          -1,
        );
        return {
          id: path.id,
          waypoints: path.points.map(
            ({
              x: px,
              z: pz,
            }: IAutoMovieVector3): { x: number; z: number } => ({
              x: px,
              z: pz,
            }),
          ),
          allowedFormationWidth: path.radius * 2,
        };
      },
    );
    for (const [name, [px, pz]] of Object.entries(recipe.amenities ?? {})) {
      const wx: number = origin.x + px;
      const wz: number = origin.z + pz;
      if (!AutoMovieEngineSpace.footprintContains(land, wx, wz))
        throw new Error(
          `Terrain amenity "${context.id}/amenities/${name}" must rest on parcel land.`,
        );
      anchors[`amenities/${name}`] = {
        ...context.frame,
        translation: {
          x: wx,
          y: AutoMovieEngineSpace.surfaceHeightAt({ height: rule }, wx, wz),
          z: wz,
        },
      };
    }
    const trees: ReturnType<typeof terrainTrees> = terrainTrees(
      context,
      recipe,
      rule,
      grades.protectedArea,
    );
    const woods: ReturnType<typeof terrainWoods> = terrainWoods(
      context,
      recipe,
      rule,
      grades.protectedArea,
    );
    return {
      anchors,
      spaces: [space],
      routes,
      surfaces: space.surfaces.flatMap(
        (surface: IAutoMovieSurface): IAutoMovieWorldSurface[] =>
          worldPieces(surface, space.walkable.includes(surface.id)),
      ),
      instanceSets: [...trees.instanceSets, ...woods.instanceSets],
      models: [...trees.models, ...woods.models],
    };
  };
}

/**
 * Select the authoritative height and choose sufficient sampling density for
 * relief and local grades.
 */
function terrainHeight(
  context: IAutoMovieEnvironmentModule.IContext,
  recipe: IAutoMovieTerrainRecipe,
  tolerance: number,
  base: ReturnType<typeof terrainBase>,
  grades: ReturnType<typeof prepareTerrainGrades>,
): IAutoMovieHeightRule {
  if (
    base.rule !== undefined &&
    (grades.featureSize === Infinity ||
      (base.rule.kind === "constant" && grades.commonLevel === base.rule.value))
  )
    return base.rule;
  // The cell diagonal stays within the smallest hard apron or waypoint landing.
  const pitch: number = Math.min(base.pitch, grades.featureSize / Math.SQRT2);
  return bakeTerrainHeight(
    context.id,
    context.frame.translation,
    recipe.size,
    pitch,
    tolerance,
    grades.height,
    base.advice,
  );
}

/** Define an analytic base without allocating the sampled relief record. */
function terrainBase(
  context: IAutoMovieEnvironmentModule.IContext,
  recipe: IAutoMovieTerrainRecipe,
): ITerrainBase {
  const origin: IAutoMovieVector3 = context.frame.translation;
  const relief: IAutoMovieTerrainRecipe.Relief = recipe.relief ?? {
    kind: "level",
  };
  const base: number = origin.y + (relief.height ?? 0);
  if (relief.kind === "rolling") {
    const { amplitude, wavelength }: { amplitude: number; wavelength: number } =
      relief;
    if (amplitude <= 0 || wavelength <= 0)
      throw new Error(
        `Terrain "${context.id}" requires positive finite rolling amplitude and wavelength.`,
      );
    const random: ReturnType<typeof AutoMovieEngineRandom.createRandom> =
      AutoMovieEngineRandom.createRandom(
        AutoMovieEngineRandom.deriveSeed(String(context.seed ?? 0), "terrain"),
      );
    const phaseX: number = 2 * Math.PI * random.float(0);
    const phaseZ: number = 2 * Math.PI * random.float(1);
    const frequency: number = (2 * Math.PI) / wavelength;
    return {
      rule: undefined,
      // Eight samples per sinusoidal wavelength supply initial spatial resolution before the cell error check.
      pitch: wavelength / 8,
      sample: ({ x, z }: { x: number; z: number }): number =>
        base +
        amplitude *
          Math.sin(frequency * (x - origin.x) + phaseX) *
          Math.cos(frequency * (z - origin.z) + phaseZ),
    };
  }
  if (relief.kind === "noise") return noiseBase(context, relief, base);
  const rule: IAutoMovieHeightRule =
    relief.kind === "level"
      ? { kind: "constant", value: base }
      : {
          kind: "plane",
          originHeight:
            base - relief.slope[0] * origin.x - relief.slope[1] * origin.z,
          slopeX: relief.slope[0],
          slopeZ: relief.slope[1],
        };
  return {
    rule,
    pitch: Infinity,
    sample: ({ x, z }: { x: number; z: number }): number =>
      AutoMovieEngineSpace.surfaceHeightAt({ height: rule }, x, z),
  };
}

/**
 * Fractal gradient-noise relief: `base + amplitude * noise(p / wavelength)`
 * over local plan coordinates, so it never leaves the mean plus or minus the
 * amplitude, and the same environment seed reproduces it.
 */
function noiseBase(
  context: IAutoMovieEnvironmentModule.IContext,
  relief: Extract<IAutoMovieTerrainRecipe.Relief, { kind: "noise" }>,
  base: number,
): ITerrainBase {
  const origin: IAutoMovieVector3 = context.frame.translation;
  const { amplitude, wavelength }: { amplitude: number; wavelength: number } =
    relief;
  const octaves: number = relief.octaves ?? 4;
  const roughness: number = relief.roughness ?? 0.5;
  if (!(amplitude > 0))
    throw new Error(
      `Terrain "${context.id}" requires a positive finite noise amplitude: ${amplitude}.`,
    );
  if (!(wavelength > 0))
    throw new Error(
      `Terrain "${context.id}" requires a positive finite noise wavelength: ${wavelength}.`,
    );
  if (!(octaves >= 1 && octaves <= 8))
    throw new Error(
      `Terrain "${context.id}" requires noise octaves to be an integer from 1 to 8: ${octaves}.`,
    );
  if (!(roughness > 0 && roughness < 1))
    throw new Error(
      `Terrain "${context.id}" requires noise roughness strictly between 0 and 1: ${roughness}.`,
    );
  const noise: (x: number, y: number) => number = AutoMovieEngineRandom.createFractalNoise2(
    AutoMovieEngineRandom.deriveSeed(String(context.seed ?? 0), "terrain"),
    octaves,
    roughness,
  );
  const finest: number = wavelength / 2 ** (octaves - 1);
  return {
    rule: undefined,
    // Eight samples per finest wavelength, the rolling relief's rule, before
    // the cell error check refines the lattice.
    pitch: finest / 8,
    sample: ({ x, z }: { x: number; z: number }): number =>
      base +
      amplitude *
        noise((x - origin.x) / wavelength, (z - origin.z) / wavelength),
    advice: `Its noise relief's finest wavelength is ${finest} m: fewer octaves coarsen the first lattice, and a larger meshTolerance stops its refinement sooner.`,
  };
}

/**
 * Split only holed footprints because compact world surfaces carry one outer
 * ring each.
 */
function worldPieces(
  surface: IAutoMovieSurface,
  walkable: boolean,
): IAutoMovieWorldSurface[] {
  const polygons: IAutoMovieVector3[][] =
    (surface.holes?.length ?? 0) === 0
      ? [surface.polygon]
      : AutoMovieEngineSpace.footprintConvexPieces(AutoMovieEngineSpace.surfaceFootprint(surface));
  return polygons.map(
    (polygon: IAutoMovieVector3[], index: number): IAutoMovieWorldSurface => ({
      id: index === 0 ? surface.id : `${surface.id}/piece/${index}`,
      polygon: polygon.map(
        ({ x, z }: IAutoMovieVector3): { x: number; z: number } => ({ x, z }),
      ),
      height: surface.height!,
      walkable,
    }),
  );
}

/** A terminal frame's forward axis follows the direction of travel. */
function routeEnd(
  path: IPath,
  rule: IAutoMovieHeightRule,
  index: number,
  direction: number,
): IAutoMovieTransform {
  const point: IAutoMovieVector3 = path.points[index]!;
  const other: IAutoMovieVector3 = path.points[index + direction]!;
  const yaw: number =
    (Math.atan2(
      (other.x - point.x) * direction,
      (other.z - point.z) * direction,
    ) *
      180) /
    Math.PI;
  return {
    translation: {
      ...point,
      y: AutoMovieEngineSpace.surfaceHeightAt({ height: rule }, point.x, point.z),
    },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw),
    scale: { x: 1, y: 1, z: 1 },
  };
}
