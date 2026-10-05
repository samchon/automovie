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
 * @evidence contracts/common.md#principled-implementation The target table is the only list of answerable paths and the rule table the only instrument owner.
 * @evidence contracts/common.md#clear-and-simple-design One walk of the table against the supplied tree.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Observations refuse instead of being read as targets.
 * @evidence contracts/common.md#meaningful-documentation States the order, the orientation and the refusal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidence contracts/modeling.md#parameter-channels Pairs each named target with its bound solving channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidence contracts/modeling.md#spatial-conventions Values stay metres on the source-rest instrument.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation It renders nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Each binding's protocol and rule own the source statement.
 * @evidence contracts/anatomy.md#permitted-range Unregistered observations refuse by path and the request is left unchanged.
 * @evidence contracts/anatomy.md#parametric-authority Only named anatomical targets enter.
 * @author Samchon
 */
export function collectHumanBodyExteriorRequests(
  targets: IAutoMovieHumanBodyAnatomicalMeasurements | undefined,
): IAutoMovieHumanBodyExteriorRequest[] {
  return HUMAN_BODY_EXTERIOR_TARGETS.flatMap((binding) => {
    const value = binding.path.split(".").reduce<unknown>(
      (node, key) => (typeof node === "object" && node !== null ? (node as Record<string, unknown>)[key] : undefined),
      targets,
    );
    if (value === undefined) return [];
    const target = typia.assert<AutoMovieHumanBodySurfaceDimension<string>>(value);
    if (target.kind === "observed")
      throw new Error(`acquisition-not-registered:targets.${binding.path} (posture, plane and site)`);
    const authored = humanBodyMeasurementRule(binding.rule);
    if (authored === undefined) throw new Error(`The exterior binding ${binding.path} names no rule ${binding.rule}.`);
    const rule = binding.side === undefined ? authored : orientHumanBodyMeasurement(binding.rule, authored, binding.side);
    return [{ binding, rule, metres: target.metres }];
  });
}
