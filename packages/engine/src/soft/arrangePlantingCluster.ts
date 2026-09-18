import { IAutoMoviePlantingArrangement, IAutoMoviePlantingCluster, IAutoMoviePlantingPlacement } from "@automovie/interface";
import { seededValue } from "../math/seededValue";

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

const SALT_PLACE_X = 0x706c6378;

const SALT_PLACE_Z = 0x706c637a;

const SALT_PLACE_YAW = 0x79617700;

const SALT_PLACE_SCALE = 0x73636c00;
