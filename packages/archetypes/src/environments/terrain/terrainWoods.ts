import { AutoMovieEngineRandom, AutoMovieEnginePlanarRegion, pointInPolygon, surfaceHeightAt } from "@automovie/engine";

import type {
  IAutoMovieEnvironmentContribution,
  IAutoMovieEnvironmentModule,
  IAutoMovieExplicitInstanceTransform,
  IAutoMovieHeightRule,
  IAutoMovieInstancePrototypeDesign,
  IAutoMovieInstanceSetDesign,
  IAutoMovieModel,
  IAutoMoviePlanarPoint,
  IAutoMovieRandom,
  IAutoMovieTerrainRecipe,
  IAutoMovieVector3,
} from "@automovie/interface";

import { deriveArchetypeSeed } from "../../core/deriveArchetypeSeed";
import { createTree } from "../../nature/createTree";

/** One accepted site with its seeded order. */
interface ISite {
  /** The cell's fourth stream word, which orders the sites. */
  key: number;

  /** The cell's index, which breaks ties in that order. */
  index: number;

  /** The tree's placement relative to the terrain origin. */
  transform: IAutoMovieExplicitInstanceTransform;
}

/** Most trees one wood plants: the slot bound of an instance set. */
const MAX_TREES: number = 100_000;

/**
 * Most grid cells one wood scans. The scan visits every cell of the outline's
 * bounding box, so this bounds its work, as the terrain lattice's
 * million-sample budget bounds the bake.
 */
const MAX_CELLS: number = 1_000_000;

/**
 * Plant each named wood of a terrain recipe as one explicit instance set.
 *
 * Sites come from jittered grid sampling (Cook 1986, "Stochastic Sampling in
 * Computer Graphics", ACM Transactions on Graphics 5(1)): cells of side `1.5 *
 * spacing` start at the outline's lower plan corner, and each holds one site
 * jittered uniformly inside a centred square of side `0.5 * spacing`. Sites in
 * adjacent cells are then at least `1.5 s - 0.5 s = s` apart along the axis
 * that separates them, and sites in farther cells farther. A site is kept when
 * it lies inside the outline, its trunk disk lies on the parcel and
 * `protectedArea` finds no pad, path, hole or water within the trunk radius, so
 * a trail through the wood removes only the trees it touches. The trunk radius
 * is the largest among the weighted species, at the wood's scale.
 *
 * Every draw reads the counter stream of `AutoMovieEngineRandom.deriveSeed(seed, "woods",
 * name)` at the cell's index, so a site depends only on the seed, the recipe
 * and its cell: the block's first two words jitter it, the third chooses its
 * species by weight and the fourth orders it. With `count`, the first `count`
 * accepted sites in that seeded order are planted. Each tree's Y is the terrain
 * rule's height at its site, and its prototype names its species.
 *
 * @param context The placed scope, frame and seed.
 * @param recipe The parcel extent and its named woods in local plan metres.
 * @param ground The accepted world height rule of the finished ground.
 * @param protectedArea The first protected feature within a radius of a world
 *   plan point, or null.
 * @returns One prototype model per planted species and one instance set per
 *   wood.
 * @throws {Error} Naming the wood for a malformed outline, spacing, count,
 *   scale or species weight, a grid beyond `MAX_CELLS`, no accepted site, more
 *   than 100,000 accepted sites without a count, or a count above the accepted
 *   sites, giving how many fit.
 */
export function terrainWoods(
  context: IAutoMovieEnvironmentModule.IContext,
  recipe: IAutoMovieTerrainRecipe,
  ground: IAutoMovieHeightRule,
  protectedArea: (
    center: IAutoMoviePlanarPoint,
    radius: number,
  ) => string | null,
): Required<
  Pick<IAutoMovieEnvironmentContribution, "instanceSets" | "models">
> {
  const instanceSets: IAutoMovieInstanceSetDesign[] = [];
  const models: IAutoMovieModel[] = [];
  const origin: IAutoMovieVector3 = context.frame.translation;
  const [width, depth]: IAutoMovieTerrainRecipe.Point = recipe.size;
  for (const [name, woods] of Object.entries(recipe.woods ?? {})) {
    const id: string = `${context.id}/woods/${name}`;
    const scale: number = woods.scale ?? 1;
    const spacing: number = woods.spacing;
    if (!(spacing > 0))
      throw new Error(`Terrain woods "${id}" need a positive finite spacing.`);
    if (!(scale > 0))
      throw new Error(`Terrain woods "${id}" need a positive finite scale.`);
    if (
      woods.count !== undefined &&
      !(woods.count >= 1 && woods.count <= MAX_TREES)
    )
      throw new Error(
        `Terrain woods "${id}" need a count from one to 100,000: ${woods.count}.`,
      );
    const outline: IAutoMoviePlanarPoint[] = woods.outline.map(
      ([x, z]: IAutoMovieTerrainRecipe.Point): IAutoMoviePlanarPoint => ({
        x,
        y: z,
      }),
    );
    const failure: string | null = AutoMovieEnginePlanarRegion.failure(
      {
        outer: outline,
      },
      id,
    );
    if (failure !== null) throw new Error(failure);
    if (
      outline.some(
        (p: IAutoMoviePlanarPoint): boolean =>
          !(p.x > 0 && p.y > 0 && p.x < width && p.y < depth),
      )
    )
      throw new Error(
        `Terrain woods "${id}" need an outline strictly inside the parcel.`,
      );

    // The weighted species in a fixed order, each with its own prototype.
    const seed: string = AutoMovieEngineRandom.deriveSeed(
      String(context.seed ?? 0),
      "woods",
      name,
    );
    const weights: [createTree.Kind, number][] = createTree.KINDS.flatMap(
      (kind: createTree.Kind): [createTree.Kind, number][] => {
        const weight: number | undefined = (woods.species ?? { whiteOak: 1 })[
          kind
        ];
        return weight === undefined ? [] : [[kind, weight]];
      },
    );
    if (
      weights.length === 0 ||
      Object.keys(woods.species ?? {}).some(
        (kind: string): boolean =>
          !createTree.KINDS.some(
            (known: createTree.Kind): boolean => known === kind,
          ),
      ) ||
      weights.some(
        ([, weight]: [createTree.Kind, number]): boolean => !(weight > 0),
      )
    )
      throw new Error(
        `Terrain woods "${id}" need positive finite weights for whiteOak or douglasFir.`,
      );
    const total: number = weights.reduce(
      (sum: number, [, weight]: [createTree.Kind, number]): number =>
        sum + weight,
      0,
    );
    const prototypes: ReturnType<typeof createTree>[] = weights.map(
      ([kind]: [createTree.Kind, number]): ReturnType<typeof createTree> =>
        createTree(
          { id: `${id}/${kind}`, kind },
          deriveArchetypeSeed(context.seed ?? 0, "woods", name, kind),
        ),
    );
    const trunk: number = Math.max(
      ...prototypes.map(
        (tree: ReturnType<typeof createTree>): number =>
          (tree.dimensions.dbh! * scale) / 2,
      ),
    );

    // The jittered grid over the outline's bounding box.
    const minX: number = Math.min(
      ...outline.map((p: IAutoMoviePlanarPoint): number => p.x),
    );
    const maxX: number = Math.max(
      ...outline.map((p: IAutoMoviePlanarPoint): number => p.x),
    );
    const minZ: number = Math.min(
      ...outline.map((p: IAutoMoviePlanarPoint): number => p.y),
    );
    const maxZ: number = Math.max(
      ...outline.map((p: IAutoMoviePlanarPoint): number => p.y),
    );
    const cell: number = 1.5 * spacing;
    const columns: number = Math.ceil((maxX - minX) / cell);
    const rows: number = Math.ceil((maxZ - minZ) / cell);
    if (!(columns * rows <= MAX_CELLS))
      throw new Error(
        `Terrain woods "${id}" need ${columns * rows} grid cells, more than ${MAX_CELLS}; widen the spacing or shrink the outline.`,
      );
    const random: IAutoMovieRandom = AutoMovieEngineRandom.createRandom(seed);
    const sites: ISite[] = [];
    for (let row: number = 0; row < rows; ++row)
      for (let column: number = 0; column < columns; ++column) {
        const index: number = row * columns + column;
        const [jx, jz, pick, key]: [number, number, number, number] =
          random.block(index);
        const x: number =
          minX +
          (column + 0.5) * cell +
          (jx / 4294967296 - 0.5) * 0.5 * spacing;
        const z: number =
          minZ + (row + 0.5) * cell + (jz / 4294967296 - 0.5) * 0.5 * spacing;
        if (
          !pointInPolygon({ x, y: z }, outline) ||
          x - trunk < 0 ||
          z - trunk < 0 ||
          x + trunk > width ||
          z + trunk > depth
        )
          continue;
        const wx: number = origin.x + x;
        const wz: number = origin.z + z;
        if (protectedArea({ x: wx, y: wz }, trunk) !== null) continue;

        // Spend the species draw across the weights in table order; the last
        // species takes what remains.
        let remaining: number = (pick / 4294967296) * total;
        let species: createTree.Kind = weights[weights.length - 1]![0];
        for (const [kind, weight] of weights.slice(0, -1)) {
          if (remaining < weight) {
            species = kind;
            break;
          }
          remaining -= weight;
        }
        sites.push({
          key,
          index,
          transform: {
            id: `cell-${column}-${row}`,
            translation: {
              x,
              y: surfaceHeightAt({ height: ground }, wx, wz),
              z,
            },
            rotation: { x: 0, y: 0, z: 0, w: 1 },
            scale: { x: scale, y: scale, z: scale },
            prototype: species,
          },
        });
      }
    sites.sort(
      (a: ISite, b: ISite): number => a.key - b.key || a.index - b.index,
    );
    if (sites.length === 0)
      throw new Error(`Terrain woods "${id}" have no site to plant.`);
    const count: number = woods.count ?? sites.length;
    if (count > sites.length)
      throw new Error(
        `Terrain woods "${id}" cannot plant ${count} trees (${sites.length} sites fit).`,
      );
    if (count > MAX_TREES)
      throw new Error(
        `Terrain woods "${id}" accept ${sites.length} sites, more than ${MAX_TREES}; set a count or widen the spacing.`,
      );
    for (const tree of prototypes) models.push({ ...tree });
    instanceSets.push({
      id,
      model: prototypes[0]!.id,
      prototypes: weights.map(
        ([kind, weight]: [
          createTree.Kind,
          number,
        ]): IAutoMovieInstancePrototypeDesign => ({
          id: kind,
          model: `${id}/${kind}`,
          weight,
        }),
      ),
      count,
      layout: {
        kind: "explicit",
        transforms: sites
          .slice(0, count)
          .map(
            (site: ISite): IAutoMovieExplicitInstanceTransform =>
              site.transform,
          ),
      },
      anchor: { x: origin.x, y: 0, z: origin.z },
      facingDeg: 0,
      seed: AutoMovieEngineRandom.createRandom(AutoMovieEngineRandom.deriveSeed(seed, "slots")).uint32(0),
      variation: {
        scale: { min: scale, max: scale },
        palette: ["#ffffff"],
        traits: [],
      },
    });
  }
  return { instanceSets, models };
}
