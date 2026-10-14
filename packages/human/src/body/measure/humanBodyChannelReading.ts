import { HUMAN_BODY_EXTERIOR_TARGETS } from "../anatomy/surface/HUMAN_BODY_EXTERIOR_TARGETS";
import type { IAutoMovieHumanBodyMeasuredChannelReading } from "../structures/IAutoMovieHumanBodyMeasuredChannelReading";
import { humanBodyMeasurementRule } from "./humanBodyMeasurementRule";

/**
 * The instrument a body channel is measured and solved by, or undefined when none is declared.
 *
 * A channel with its own rule takes that rule before exterior-table bindings. Otherwise matching exterior targets supply their shared rule and optional side; inconsistent bindings refuse by channel name. Editors, inverses and exterior measurements share this relationship rather than maintaining mirrored instruments. The returned record identifies an instrument and does not establish that the current basis can actually measure it.
 *
 * @evidence contracts/common.md#principled-implementation Own-rule precedence is followed by complete matching exterior-target agreement on rule/side, with missing bindings returning undefined and conflicting bindings refusing.
 * @evidence contracts/common.md#clear-and-simple-design One lookup connects source channel names to the existing rule/orientation owners used by metric controls and inverses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An ambiguous table cannot silently choose its first reading, and a declared instrument cannot certify current geometry or anatomical availability.
 * @evidence contracts/common.md#meaningful-documentation The prose gives precedence, missing/conflicting behavior, optional side and the distinction between declared and measurable instruments.
 * @evidence contracts/performance.md#efficient-algorithms Own-rule lookup is constant expected work; fallback filtering and agreement scan the exterior target table linearly without evaluating geometry.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing rule and exterior tables remain the sole authorities shared by editors, source solvers and endpoint reporting.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The matching-target array expires and only a small copied rule/side record escapes, with no retained geometry cache or task.
 *
 * @author Samchon
 */
export function humanBodyChannelReading(
  channel: string,
): IAutoMovieHumanBodyMeasuredChannelReading | undefined {
  if (humanBodyMeasurementRule(channel) !== undefined) return { rule: channel };
  const bound: (typeof HUMAN_BODY_EXTERIOR_TARGETS)[number][] =
    HUMAN_BODY_EXTERIOR_TARGETS.filter(
      (target: (typeof HUMAN_BODY_EXTERIOR_TARGETS)[number]): boolean =>
        target.channel === channel,
    );
  const first: (typeof bound)[number] | undefined = bound[0];
  if (first === undefined) return undefined;
  if (
    bound.some(
      (target: (typeof bound)[number]): boolean =>
        target.rule !== first.rule || target.side !== first.side,
    )
  )
    throw new Error(
      `The body channel ${channel} is bound to more than one measurement.`,
    );
  return first.side === undefined
    ? { rule: first.rule }
    : { rule: first.rule, side: first.side };
}
