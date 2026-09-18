import { IAutoMovieFluidDomain, IAutoMoviePlantingCluster, IAutoMoviePlantingDomain, IAutoMoviePlantingInstallation, IAutoMoviePlantingPlacement, IAutoMovieSoftAnalysis, IAutoMovieValidation, IAutoMovieVector3 } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { arrangePlantingCluster } from "./arrangePlantingCluster";
import { growPlanting } from "./growPlanting";
import { validatePlantingCluster } from "./validatePlantingCluster";
import { validatePlantingDomain } from "./validatePlantingDomain";
import { IAutoMoviePlantingFrame } from "./IAutoMoviePlantingFrame";

/**
 * Lower one bound installation to everything a renderer needs, beside an honest
 * account of what was derived.
 *
 * One structure is grown and every member instances it, which is what makes a
 * bed of forty ferns forty transforms rather than forty trees. A recipe that
 * does not validate, a cluster that does not validate, a cluster paired with a
 * recipe it does not cite, and an installation paired with a cluster it does
 * not place each produce `not-run` with a reason and no geometry at all: a
 * plant nobody could derive must never arrive looking like a plant somebody
 * did.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Lowers a valid recipe and cluster into prototype structure and member placement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Produces the renderer boundary while preserving not-run outcomes.
 * @author Samchon
 */
export const lowerPlantingInstallation = (props: {
  installation: IAutoMoviePlantingInstallation;
  cluster: IAutoMoviePlantingCluster;
  domain: IAutoMoviePlantingDomain;
}): IAutoMoviePlantingFrame => {
  const { installation, cluster, domain } = props;
  const analysis = (
    status: IAutoMovieSoftAnalysis["status"],
    reason: string | null,
  ): IAutoMovieSoftAnalysis => ({
    domain: domain.id,
    kind: "planting",
    status,
    reason,
    unsupported: [],
  });
  if (validatePlantingDomain({ domain }).success === false)
    return {
      installation: installation.id,
      analysis: analysis(
        "not-run",
        `planting recipe "${domain.id}" did not validate, so nothing was grown`,
      ),
      plant: null,
      arrangement: null,
    };
  if (validatePlantingCluster({ cluster }).success === false)
    return {
      installation: installation.id,
      analysis: analysis(
        "not-run",
        `planting cluster "${cluster.id}" did not validate, so nothing was arranged`,
      ),
      plant: null,
      arrangement: null,
    };
  // The three records arrive separately, so every pairing is checked rather
  // than trusted: arranging one recipe by another's seed, or reporting one
  // bed's members under another installation's identity, would produce a frame
  // that looks derived and answers for nothing that was authored.
  if (cluster.domain !== domain.id)
    return {
      installation: installation.id,
      analysis: analysis(
        "not-run",
        `planting cluster "${cluster.id}" grows recipe "${cluster.domain}", not the supplied "${domain.id}"`,
      ),
      plant: null,
      arrangement: null,
    };
  if (installation.cluster !== cluster.id)
    return {
      installation: installation.id,
      analysis: analysis(
        "not-run",
        `planting installation "${installation.id}" places cluster "${installation.cluster}", not the supplied "${cluster.id}"`,
      ),
      plant: null,
      arrangement: null,
    };
  return {
    installation: installation.id,
    analysis: analysis("derived", null),
    plant: growPlanting(domain),
    arrangement: arrangePlantingCluster(cluster),
  };
};

/** Re-path one nested validation onto the address the binding knows it by. */
const repath = (
  out: ViolationCollector,
  path: string,
  validation: IAutoMovieValidation,
): void => {
  if (validation.success === true) return;
  for (const item of validation.violations)
    out.items.push({ ...item, path: item.path.replace("$input", path) });
};

/**
 * The eight corners of one derived canopy, carried into world space by one
 * member's own transform.
 *
 * The recipe's bounds are in the recipe's frame with the trunk's base at the
 * origin, so every corner is rotated by the member's unit quaternion, scaled
 * per axis, and translated. A rotated box therefore widens rather than being
 * silently re-fitted, exactly as a staged prop's clearance volume does.
 */
const corners = (
  bounds: { min: IAutoMovieVector3; max: IAutoMovieVector3 },
  placement: IAutoMoviePlantingPlacement,
): IAutoMovieVector3[] => {
  const { x: qx, y: qy, z: qz, w: qw } = placement.rotation;
  const out: IAutoMovieVector3[] = [];
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const sx = x * placement.scale.x;
        const sy = y * placement.scale.y;
        const sz = z * placement.scale.z;
        // q * v * q⁻¹, written as the cross-product form so no matrix has to be
        // built for eight points.
        const tx = 2 * (qy * sz - qz * sy);
        const ty = 2 * (qz * sx - qx * sz);
        const tz = 2 * (qx * sy - qy * sx);
        out.push({
          x: placement.translation.x + sx + qw * tx + qy * tz - qz * ty,
          y: placement.translation.y + sy + qw * ty + qz * tx - qx * tz,
          z: placement.translation.z + sz + qw * tz + qx * ty - qy * tx,
        });
      }
  return out;
};

/**
 * The free-surface elevation of one fluid domain under a world point, or `null`
 * when that domain cannot answer for the point at all.
 *
 * Read from the authored bed and depth rather than from a solve: a binding is a
 * statement about the design, and integrating a pond to decide whether a reed
 * is planted in it would make the answer depend on a shot second nobody named.
 *
 * `null` covers both ways the question can be unanswerable — a point outside
 * the lattice, and a lattice whose bed or depth array does not reach the cell —
 * because a fluid domain arrives here from another binding's validation and
 * this one must not read past the end of an array and compare against `NaN`. A
 * comparison against `NaN` is false, which would make a malformed pond report
 * every reed as properly planted.
 */
const freeSurfaceAt = (
  domain: IAutoMovieFluidDomain,
  point: { x: number; y: number; z: number },
): number | null => {
  const column = Math.floor(
    (point.x - domain.grid.origin.x) / domain.grid.cellX,
  );
  const row = Math.floor((point.z - domain.grid.origin.z) / domain.grid.cellZ);
  if (column < 0 || column >= domain.grid.columns) return null;
  if (row < 0 || row >= domain.grid.rows) return null;
  const cell = row * domain.grid.columns + column;
  const level = domain.grid.origin.y + domain.bed[cell] + domain.depth[cell];
  return Number.isFinite(level) ? level : null;
};
