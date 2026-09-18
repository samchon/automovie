import { IAutoMoviePlantingCluster, IAutoMovieValidation, IAutoMovieVector3 } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { PLANTING_MAX_ATTEMPTS } from "./PLANTING_MAX_ATTEMPTS";
import { PLANTING_MAX_MEMBERS } from "./PLANTING_MAX_MEMBERS";

/**
 * Validate one planting cluster's count, region, spacing rule and variation.
 *
 * A cluster is the arrangement half of the same product: the recipe says what a
 * plant is, the cluster says how many stand where. Refusing an impossible
 * arrangement here is what keeps {@link arrangePlantingCluster} from silently
 * returning fewer members than an author believed they had asked for.
 *
 * @evidence requirements/interior/soft-materials-plants-and-deformation.md#interior-plant-placement-state Refuses impossible member counts, regions, spacing, and variation before placement.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-soft-furnishing-planting Validates the bounded arrangement half of an interior planting.
 * @author Samchon
 */
export const validatePlantingCluster = (props: {
  cluster: IAutoMoviePlantingCluster;
}): IAutoMovieValidation => {
  const { cluster } = props;
  const out = new ViolationCollector();
  const root = "$input";

  if (cluster.id.trim().length === 0)
    out.push("type", `${root}.id`, "cluster id must be non-empty", cluster.id);
  if (cluster.domain.trim().length === 0)
    out.push(
      "type",
      `${root}.domain`,
      "cluster must cite a planting recipe",
      cluster.domain,
    );
  integer(
    out,
    `${root}.count`,
    "member count",
    cluster.count,
    1,
    PLANTING_MAX_MEMBERS,
  );
  vector(out, `${root}.anchor`, cluster.anchor);
  numeric(
    out,
    `${root}.extent.x`,
    "extent x",
    cluster.extent.x,
    0,
    false,
    Infinity,
  );
  numeric(
    out,
    `${root}.extent.z`,
    "extent z",
    cluster.extent.z,
    0,
    false,
    Infinity,
  );
  if (!Number.isSafeInteger(cluster.seed))
    out.push(
      "type",
      `${root}.seed`,
      "cluster seed must be a safe integer",
      cluster.seed,
    );
  numeric(
    out,
    `${root}.minSpacing`,
    "minimum spacing",
    cluster.minSpacing,
    0,
    false,
    Infinity,
  );
  integer(
    out,
    `${root}.attempts`,
    "placement attempts",
    cluster.attempts,
    1,
    PLANTING_MAX_ATTEMPTS,
  );
  for (const axis of ["x", "y", "z"] as const) {
    numeric(
      out,
      `${root}.scale.min.${axis}`,
      `minimum scale ${axis}`,
      cluster.scale.min[axis],
      0,
      true,
      Infinity,
    );
    numeric(
      out,
      `${root}.scale.max.${axis}`,
      `maximum scale ${axis}`,
      cluster.scale.max[axis],
      cluster.scale.min[axis],
      false,
      Infinity,
    );
  }
  numeric(
    out,
    `${root}.yawJitter`,
    "yaw jitter",
    cluster.yawJitter,
    0,
    false,
    1,
  );

  return out.toValidation();
};

/** Every component of an authored vector must be a real number. */
const vector = (
  out: ViolationCollector,
  path: string,
  value: IAutoMovieVector3,
): void => {
  for (const axis of ["x", "y", "z"] as const)
    numeric(
      out,
      `${path}.${axis}`,
      `${axis} component`,
      value[axis],
      -Infinity,
      false,
      Infinity,
    );
};

/** A finite scalar inside `[min, max]`, or `(min, max]` when `exclusive`. */
const numeric = (
  out: ViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  exclusive: boolean,
  max: number,
): void => {
  if (
    !Number.isFinite(value) ||
    (exclusive ? value <= min : value < min) ||
    value > max
  )
    out.push(
      "range",
      path,
      `${label} must be finite within ${exclusive ? "(" : "["}${min}, ${max}]`,
      value,
    );
};

/** A safe integer inside `[min, max]`. */
const integer = (
  out: ViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  max: number,
): void => {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    out.push(
      "type",
      path,
      `${label} must be an integer within [${min}, ${max}]`,
      value,
    );
};
