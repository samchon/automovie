import { builtPointBounds } from "../architecture/builtPointBounds";
import { plantingYaw } from "./plantingYaw";
import { IAutoMoviePlantingArrangement, IAutoMoviePlantingCluster, IAutoMoviePlantingPlacement, IAutoMovieVector3 } from "@automovie/interface";
import { seededValue } from "../math/seededValue";
const SALT_PLACE_X: number = 0x706c6378;

const SALT_PLACE_Z: number = 0x706c637a;

const SALT_PLACE_YAW: number = 0x79617700;

const SALT_PLACE_SCALE: number = 0x73636c00;

/** Generate seeded full-TRS members in authored slot order, counting slots rejected after their attempt limit. A minSpacing grid tests nearby accepted positions; returned bounds enclose placement origins, not scaled plant geometry. Production planting validation consumes the arrangement.
 *
 * @evidence contracts/common.md#principled-implementation Seed/slot/attempt keyed candidates and a nine-cell spacing test preserve sequential acceptance. The grid argument assumes representable cell indices and finite coordinate squares; admitted huge finite inputs can violate these numeric premises, so exhaustive equivalence is not universal.
 * @evidence contracts/common.md#clear-and-simple-design Arrangement owns placement and spacing while growPlanting owns recipe-local geometry; one canonical planting yaw owner serves both leaf roll and member yaw.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed slots are counted, not squeezed into a neighbour; zero spacing deliberately skips the grid, and no claim of constant bucket occupancy or arbitrary-finite numeric safety hides remaining limitations.
 * @evidence contracts/common.md#meaningful-documentation States slot order, rejected members, full TRS, origin-only bounds and grid precision premises.
 * @evidence contracts/performance.md#efficient-algorithms For N slots and A attempts, fixed nine-cell lookup still costs each visited bucket population; worst-case O(N*A*N) comparisons and O(N) placement/grid storage, with no unmeasured universal speedup claim.
 * @evidence contracts/performance.md#reuse-equivalent-work Accepted origins populate one per-call grid reused across later candidates; slot/path seeded yaw is shared code, while mutable cluster inputs invalidate the entire arrangement and have no retained cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Placements and bounds are fresh caller-owned records; the grid and intermediate origin list are discarded, with no instances or GPU handles retained.
 *
 * @author Samchon
 */
export const arrangePlantingCluster: (cluster: IAutoMoviePlantingCluster) => IAutoMoviePlantingArrangement = (
  cluster: IAutoMoviePlantingCluster,
): IAutoMoviePlantingArrangement => {
  const placements: IAutoMoviePlantingPlacement[] = [];
  const spacing: number = cluster.minSpacing * cluster.minSpacing;
  // With no spacing rule nothing can ever be refused, so no index is built and
  // no neighbourhood is walked: `dx² + dz² < 0` has no solutions.
  const occupied: Map<string, { x: number; z: number; }[]> | null =
    cluster.minSpacing > 0
      ? new Map<string, { x: number; z: number }[]>()
      : null;
  let rejected: number = 0;
  for (let slot: number = 0; slot < cluster.count; ++slot) {
    let placed: boolean = false;
    for (let attempt: number = 0; attempt < cluster.attempts && !placed; ++attempt) {
      const x: number =
        cluster.anchor.x +
        (2 * seededValue(cluster.seed, slot, attempt, SALT_PLACE_X) - 1) *
          cluster.extent.x;
      const z: number =
        cluster.anchor.z +
        (2 * seededValue(cluster.seed, slot, attempt, SALT_PLACE_Z) - 1) *
          cluster.extent.z;
      if (
        occupied !== null &&
        crowded(occupied, cluster.minSpacing, spacing, x, z)
      )
        continue;
      placed = true;
      if (occupied !== null) {
        const [cx, cz]: ReturnType<typeof cell> = cell(cluster.minSpacing, x, z);
        const key: string = `${cx},${cz}`;
        const bucket: { x: number; z: number; }[] | undefined = occupied.get(key);
        if (bucket === undefined) occupied.set(key, [{ x, z }]);
        else bucket.push({ x, z });
      }
      placements.push({
        id: `${cluster.id}#${slot}`,
        slot,
        translation: { x, y: cluster.anchor.y, z },
        rotation: plantingYaw(
          seededValue(cluster.seed, slot, SALT_PLACE_YAW),
          cluster.yawJitter,
        ),
        scale: {
          x: between(
            cluster.scale.min.x,
            cluster.scale.max.x,
            seededValue(cluster.seed, slot, SALT_PLACE_SCALE, 0),
          ),
          y: between(
            cluster.scale.min.y,
            cluster.scale.max.y,
            seededValue(cluster.seed, slot, SALT_PLACE_SCALE, 1),
          ),
          z: between(
            cluster.scale.min.z,
            cluster.scale.max.z,
            seededValue(cluster.seed, slot, SALT_PLACE_SCALE, 2),
          ),
        },
      });
    }
    if (placed === false) ++rejected;
  }
  return {
    cluster: cluster.id,
    domain: cluster.domain,
    placements,
    rejected,
    bounds: builtPointBounds(placements.map((placement: IAutoMoviePlantingPlacement): IAutoMovieVector3 => placement.translation)),
  };
};

/**
 * The uniform-grid key one ground position falls in.
 *
 * The neighbourhood walk offsets the two integer indices rather than the two
 * coordinates: `floor((x + side)/side)` and `floor(x/side) + 1` are the same
 * rational number and not always the same double, and a neighbourhood that
 * misses a cell is a spacing rule that silently stops holding.
 */
const cell: (side: number, x: number, z: number) => [number, number] = (side: number, x: number, z: number): [number, number] => [
  Math.floor(x / side),
  Math.floor(z / side),
];

/**
 * Whether an accepted member already stands closer than the minimum spacing.
 *
 * The grid side is the spacing itself, so a member within that distance can
 * only be in the candidate's own cell or one of the eight around it. Walking
 * those nine answers exactly what walking every member would under representable-grid premises; visited bucket populations determine the cost, which
 * can grow with the size of an ungated or numerically degenerate bed.
 */
const crowded: (occupied: Map<string, { x: number; z: number; }[]>, side: number, spacing: number, x: number, z: number) => boolean = (
  occupied: Map<string, { x: number; z: number }[]>,
  side: number,
  spacing: number,
  x: number,
  z: number,
): boolean => {
  const [cx, cz]: ReturnType<typeof cell> = cell(side, x, z);
  for (let dx: number = -1; dx <= 1; ++dx)
    for (let dz: number = -1; dz <= 1; ++dz) {
      const bucket: { x: number; z: number; }[] | undefined = occupied.get(`${cx + dx},${cz + dz}`);
      if (bucket === undefined) continue;
      for (const other of bucket) {
        const ox: number = other.x - x;
        const oz: number = other.z - z;
        if (ox * ox + oz * oz < spacing) return true;
      }
    }
  return false;
};

/** One sample mapped into `[min, max]`. */
const between: (min: number, max: number, sample: number) => number = (min: number, max: number, sample: number): number =>
  min + (max - min) * sample;
