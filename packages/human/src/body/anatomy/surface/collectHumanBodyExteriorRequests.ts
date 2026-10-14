import typia from "typia";

import { humanBodyMeasurementRule } from "../../measure/humanBodyMeasurementRule";
import { orientHumanBodyMeasurement } from "../../measure/orientHumanBodyMeasurement";
import type { AutoMovieHumanBodySurfaceDimension } from "../measurements/AutoMovieHumanBodySurfaceDimension";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import { HUMAN_BODY_EXTERIOR_TARGETS } from "./HUMAN_BODY_EXTERIOR_TARGETS";
import type { IAutoMovieHumanBodyExteriorRequest } from "./IAutoMovieHumanBodyExteriorRequest";
import type { IAutoMovieHumanBodyExteriorTarget } from "./IAutoMovieHumanBodyExteriorTarget";
import type { IAutoMovieHumanBodyMeasurement } from "../../structures/IAutoMovieHumanBodyMeasurement";

/**
 * Collect the bound surface targets a set of anatomical measurements supplies, in table order.
 *
 * Each `HUMAN_BODY_EXTERIOR_TARGETS` path present in `targets` becomes one request with its rule oriented to the binding's side. An observed value on a bound path refuses as `acquisition-not-registered`, because no posture, plane or site of an acquisition is registered on the source skin. Paths without a binding are left to the caller.
 *
 * @evidence contracts/common.md#principled-implementation Ordered authored paths select admitted target values; own-rule lookup and side orientation preserve instrument meaning, while observed acquisitions fail explicitly.
 * @evidence contracts/common.md#clear-and-simple-design This collection boundary owns path traversal and target/rule correspondence, delegating schema admission and mirroring to existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unbound paths are not approximated, nonexistent rules fail, and a target is never relabeled as a registered observation.
 * @evidence contracts/common.md#meaningful-documentation The prose states table order, omission, side orientation, observed failure and the caller's responsibility for unbound paths.
 * @evidence contracts/performance.md#efficient-algorithms For B bindings and path depth D, collection costs O(B*D) property lookups plus supplied-value admission and rule lookup/orientation; the full table scan finds every supported condition.
 * @evidence contracts/performance.md#reuse-equivalent-work Both sides reuse the authored rule table and mirror helper; results are not cached because supplied target subtrees decide request equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Path arrays and admitted targets are local; at most B request records escape without retaining the full anatomy document or any runtime task.
 * @author Samchon
 */
export function collectHumanBodyExteriorRequests(
  targets: IAutoMovieHumanBodyAnatomicalMeasurements | undefined,
): IAutoMovieHumanBodyExteriorRequest[] {
  return HUMAN_BODY_EXTERIOR_TARGETS.flatMap((binding: IAutoMovieHumanBodyExteriorTarget): IAutoMovieHumanBodyExteriorRequest[] => {
    const value: unknown = binding.path
      .split(".")
      .reduce<unknown>(
        (node: unknown, key: string): unknown =>
          typeof node === "object" && node !== null
            ? (node as Record<string, unknown>)[key]
            : undefined,
        targets,
      );
    if (value === undefined) return [];
    const target: AutoMovieHumanBodySurfaceDimension<string> =
      typia.assert<AutoMovieHumanBodySurfaceDimension<string>>(value);
    if (target.kind === "observed")
      throw new Error(
        `acquisition-not-registered:targets.${binding.path} (posture, plane and site)`,
      );
    const authored: IAutoMovieHumanBodyMeasurement | undefined = humanBodyMeasurementRule(binding.rule);
    if (authored === undefined)
      throw new Error(
        `The exterior binding ${binding.path} names no rule ${binding.rule}.`,
      );
    const rule: IAutoMovieHumanBodyMeasurement =
      binding.side === undefined
        ? authored
        : orientHumanBodyMeasurement(binding.rule, authored, binding.side);
    return [{ binding, rule, metres: target.metres }];
  });
}
