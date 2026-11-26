import {
  type IAutoMovieValidatePlantingCluster,
  IAutoMovieValidation,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AutoMovieEngineViolationCollector } from "../validation/AutoMovieEngineViolationCollector";
import { PLANTING_MAX_ATTEMPTS } from "./constants/PLANTING_MAX_ATTEMPTS";
import { PLANTING_MAX_MEMBERS } from "./constants/PLANTING_MAX_MEMBERS";
import { validateSoftInteger as integer } from "./validateSoftInteger";
import { validateSoftNumeric as numeric } from "./validateSoftNumeric";
import { validateSoftVector as vector } from "./validateSoftVector";

/**
 * Admit a typed cluster's finite region, positive scale intervals, safe seed
 * and bounded member/attempt counts. It does not prove all requested placements
 * fit; arrangement returns explicit rejected slots when sampling cannot satisfy
 * spacing.
 */
export function validatePlantingCluster(
  props: IAutoMovieValidatePlantingCluster.IProps,
): IAutoMovieValidation {
  const { cluster }: typeof props = props;
  const out: IAutoMovieViolationCollector = new AutoMovieEngineViolationCollector();
  const root: string = "$input";

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
  const seed: number = Math.trunc(cluster.seed);
  if (!(seed === cluster.seed && Math.abs(seed) <= Number.MAX_SAFE_INTEGER))
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
}
