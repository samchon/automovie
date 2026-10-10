import typia from "typia";

import { humanBodyMeasurementRule } from "../../measure/humanBodyMeasurementRule";
import { orientHumanBodyMeasurement } from "../../measure/orientHumanBodyMeasurement";
import type { AutoMovieHumanBodySurfaceDimension } from "../measurements/AutoMovieHumanBodySurfaceDimension";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { HUMAN_BODY_EXTERIOR_TARGETS } from "./HUMAN_BODY_EXTERIOR_TARGETS";
import type { IAutoMovieHumanBodyExteriorRequest } from "./IAutoMovieHumanBodyExteriorRequest";

/**
 * Collect the bound surface targets a set of anatomical measurements
 * supplies, in table order.
 *
 * Each `HUMAN_BODY_EXTERIOR_TARGETS` path present in `targets` becomes one
 * request with its rule oriented to the binding's side. An observed value on
 * a bound path refuses as `acquisition-not-registered`, because no posture,
 * plane or site of an acquisition is registered on the source skin. Paths
 * without a binding are left to the caller.
 *
 * @author Samchon
 */
export function collectHumanBodyExteriorRequests(
  targets: IAutoMovieHumanBodyAnatomicalMeasurements | undefined,
): IAutoMovieHumanBodyExteriorRequest[] {
  return HUMAN_BODY_EXTERIOR_TARGETS.flatMap((binding) => {
    const value = binding.path
      .split(".")
      .reduce<unknown>(
        (node, key) =>
          typeof node === "object" && node !== null
            ? (node as Record<string, unknown>)[key]
            : undefined,
        targets,
      );
    if (value === undefined) return [];
    const target =
      typia.assert<AutoMovieHumanBodySurfaceDimension<string>>(value);
    if (target.kind === "observed")
      throw new Error(
        `acquisition-not-registered:targets.${binding.path} (posture, plane and site)`,
      );
    const authored = humanBodyMeasurementRule(binding.rule);
    if (authored === undefined)
      throw new Error(
        `The exterior binding ${binding.path} names no rule ${binding.rule}.`,
      );
    const rule =
      binding.side === undefined
        ? authored
        : orientHumanBodyMeasurement(binding.rule, authored, binding.side);
    return [{ binding, rule, metres: target.metres }];
  });
}
