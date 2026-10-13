import { validateSoftNumeric as numeric } from "./validateSoftNumeric";
import { validateSoftInteger as integer } from "./validateSoftInteger";
import { validateSoftVector as vector } from "./validateSoftVector";
import { IAutoMoviePlantingCluster, IAutoMovieValidation } from "@automovie/interface";
import { ViolationCollector } from "../validation/ViolationCollector";
import { PLANTING_MAX_ATTEMPTS } from "./constants/PLANTING_MAX_ATTEMPTS";
import { PLANTING_MAX_MEMBERS } from "./constants/PLANTING_MAX_MEMBERS";
/** Admit a typed cluster's finite region, positive scale intervals, safe seed and bounded member/attempt counts. It does not prove all requested placements fit; arrangement returns explicit rejected slots when sampling cannot satisfy spacing.
 *
 * @evidence contracts/common.md#principled-implementation Finite/range and safe-integer predicates accumulate authored-value findings in field order, using the canonical member/attempt caps; arbitrary huge finite coordinates remain admitted even where downstream arithmetic loses precision.
 * @evidence contracts/common.md#clear-and-simple-design Cluster shape admission belongs to this gate; canonical soft scalar/integer/vector owners preserve identical predicates, messages and traversal order across recipe and cluster validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No coordinate clamp, count reduction or invented placement turns an impossible request into success; the original claim that admission prevents all rejected arrangements is not supported.
 * @evidence contracts/common.md#meaningful-documentation States typed-input scope, cap policy, ordered findings and geometric feasibility/precision limits.
 * @evidence contracts/performance.md#efficient-algorithms A fixed field set and three scale axes take constant work and bounded finding storage, independent of requested member count.
 * @evidence contracts/performance.md#reuse-equivalent-work One collector and scalar predicate owner serve all fields within the call; mutable cluster records are not retained behind an identity verdict cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only validation findings transfer; input fields are read without mutation and no placement grid or geometry is allocated.
 *
 * @author Samchon
 */
export const validatePlantingCluster: (props: { cluster: IAutoMoviePlantingCluster; }) => IAutoMovieValidation = (props: {
  cluster: IAutoMoviePlantingCluster;
}): IAutoMovieValidation => {
  const { cluster }: typeof props = props;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

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
