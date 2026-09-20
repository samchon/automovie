import { IAutoMoviePlantingArrangement, IAutoMoviePlantingCluster, IAutoMoviePlantingPlacement, IAutoMovieQuaternion, IAutoMovieSoftBounds, IAutoMovieVector3 } from "@automovie/interface";
import { seededValue } from "../math/seededValue";

const SALT_PLACE_X = 0x706c6378;

const SALT_PLACE_Z = 0x706c637a;

const SALT_PLACE_YAW = 0x79617700;

const SALT_PLACE_SCALE = 0x73636c00;

/**
 * Arrange one planting cluster into deterministic full-TRS placements.
 *
 * Repetition is generated, never hand-duplicated. Slot `i` draws its candidate
 * positions from `(seed, i, attempt)` alone, so the arrangement is a pure
 * function of the cluster record; a candidate is accepted only when it keeps
 * `minSpacing` from every member already placed, and a slot that cannot be
 * placed in `attempts` tries is **refused and counted** rather than squeezed in
 * on top of a neighbour.
 *
 * Acceptance necessarily reads the members already placed, so the arrangement
 * is a function of the cluster as a whole rather than of each slot
 * independently — the authored slot order is the tie-break, and it is stable.
 *
 * The spacing test is answered through a uniform grid of side `minSpacing`, so
 * a candidate compares itself against the members of nine cells rather than
 * against every member placed so far. Any member closer than `minSpacing` must
 * lie in one of those nine, so the decision is identical to the exhaustive one;
 * what changes is that the declared budget of ten thousand members at
 * sixty-four attempts is bounded work rather than a quarter of a trillion
 * distance tests. A budget a caller can exhaust the machine inside is not a
 * budget.
 *
 * Each placement carries translation, a unit quaternion and a per-axis scale,
 * which is exactly what GPU instancing consumes. Nothing is reduced to a yaw
 * angle or one uniform number on the way out.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Resolves a declared planting population into bounded member placements.
 * @evidence requirements/map/vegetation-and-ecology.md#map-vegetation-individual-cluster `arrangePlantingCluster` emits stable per-member transforms from the declared cluster count, bounds, seed, scale, tilt, and spacing refusal rule.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Produces the deterministic arrangement consumed by interior planting placement.
 * @evidence specifications/world-and-site/ecology-weather-and-calendar.md#world-site-vegetation-layer-form-input The cluster arrangement materializes individually addressable vegetation placements while preserving the caller's bounded form and spacing inputs.
 * @author Samchon
 */
export const arrangePlantingCluster = (
  cluster: IAutoMoviePlantingCluster,
): IAutoMoviePlantingArrangement => {
  const placements: IAutoMoviePlantingPlacement[] = [];
  const spacing = cluster.minSpacing * cluster.minSpacing;
  // With no spacing rule nothing can ever be refused, so no index is built and
  // no neighbourhood is walked: `dx² + dz² < 0` has no solutions.
  const occupied =
    cluster.minSpacing > 0
      ? new Map<string, { x: number; z: number }[]>()
      : null;
  let rejected = 0;
  for (let slot = 0; slot < cluster.count; ++slot) {
    let placed = false;
    for (let attempt = 0; attempt < cluster.attempts && !placed; ++attempt) {
      const x =
        cluster.anchor.x +
        (2 * seededValue(cluster.seed, slot, attempt, SALT_PLACE_X) - 1) *
          cluster.extent.x;
      const z =
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
        const [cx, cz] = cell(cluster.minSpacing, x, z);
        const key = `${cx},${cz}`;
        const bucket = occupied.get(key);
        if (bucket === undefined) occupied.set(key, [{ x, z }]);
        else bucket.push({ x, z });
      }
      placements.push({
        id: `${cluster.id}#${slot}`,
        slot,
        translation: { x, y: cluster.anchor.y, z },
        rotation: yaw(
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
    bounds: extents(placements.map((placement) => placement.translation)),
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
const cell = (side: number, x: number, z: number): [number, number] => [
  Math.floor(x / side),
  Math.floor(z / side),
];

/**
 * Whether an accepted member already stands closer than the minimum spacing.
 *
 * The grid side is the spacing itself, so a member within that distance can
 * only be in the candidate's own cell or one of the eight around it. Walking
 * those nine answers exactly what walking every member would, at a cost that
 * does not grow with the size of the bed.
 */
const crowded = (
  occupied: Map<string, { x: number; z: number }[]>,
  side: number,
  spacing: number,
  x: number,
  z: number,
): boolean => {
  const [cx, cz] = cell(side, x, z);
  for (let dx = -1; dx <= 1; ++dx)
    for (let dz = -1; dz <= 1; ++dz) {
      const bucket = occupied.get(`${cx + dx},${cz + dz}`);
      if (bucket === undefined) continue;
      for (const other of bucket) {
        const ox = other.x - x;
        const oz = other.z - z;
        if (ox * ox + oz * oz < spacing) return true;
      }
    }
  return false;
};

/**
 * A seeded turn about `+y`, blended toward identity by `amount`.
 *
 * The half-angle `φ` is drawn straight from the rational parameterization of
 * the circle — `(cos φ, sin φ) = ((1 − t²)/(1 + t²), 2t/(1 + t²))` on the first
 * quadrant, lifted to the second by the quarter-turn swap — so a full turn is
 * covered without a single call to a transcendental function and without a
 * rejection loop whose failure arm no test could ever reach. The distribution
 * is uniform in the half-tangent rather than in the angle, which is a stated
 * property of the jitter, not an approximation of a uniform one.
 *
 * Blending is a normalized quaternion interpolation toward identity. `amount`
 * is therefore a fraction of a rotation rather than a scaled angle, which is
 * what keeps the whole derivation free of trigonometry.
 */
const yaw = (sample: number, amount: number): IAutoMovieQuaternion => {
  const doubled = 2 * sample;
  const half = Math.floor(doubled);
  const t = doubled - half;
  const denominator = 1 + t * t;
  const cosine = (1 - t * t) / denominator;
  const sine = (2 * t) / denominator;
  // `half === 1` lifts the first quadrant into the second by the quarter-turn
  // rotation `(c, s) -> (-s, c)`, so `φ` sweeps the whole half-turn that a full
  // turn of the branch corresponds to.
  const w = half === 0 ? cosine : -sine;
  const y = half === 0 ? sine : cosine;
  const blended = {
    x: 0,
    y: amount * (w < 0 ? -y : y),
    z: 0,
    w: 1 - amount + amount * (w < 0 ? -w : w),
  };
  const length = Math.sqrt(blended.y * blended.y + blended.w * blended.w);
  return { x: 0, y: blended.y / length, z: 0, w: blended.w / length };
};

/** One sample mapped into `[min, max]`. */
const between = (min: number, max: number, sample: number): number =>
  min + (max - min) * sample;

/** The world box a point list occupies, or `null` for an empty list. */
const extents = (points: IAutoMovieVector3[]): IAutoMovieSoftBounds | null => {
  if (points.length === 0) return null;
  const low = { x: Infinity, y: Infinity, z: Infinity };
  const high = { x: -Infinity, y: -Infinity, z: -Infinity };
  for (const point of points) {
    low.x = Math.min(low.x, point.x);
    low.y = Math.min(low.y, point.y);
    low.z = Math.min(low.z, point.z);
    high.x = Math.max(high.x, point.x);
    high.y = Math.max(high.y, point.y);
    high.z = Math.max(high.z, point.z);
  }
  return { min: low, max: high };
};
