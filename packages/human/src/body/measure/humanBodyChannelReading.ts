import { HUMAN_BODY_EXTERIOR_TARGETS } from "../anatomy/surface/HUMAN_BODY_EXTERIOR_TARGETS";
import type { IAutoMovieHumanBodyMeasuredChannelReading } from "../structures/IAutoMovieHumanBodyMeasuredChannelReading";
import { humanBodyMeasurementRule } from "./humanBodyMeasurementRule";

/**
 * The instrument a body channel is measured and solved by, or undefined for
 * a channel with none.
 *
 * A channel named by its own rule (`measureThighCirc`) reads that rule as
 * authored. A one-sided source channel without a rule of its own
 * (`footScaleDepthRight`) reads the rule and side the exterior target table
 * binds it to, so the editor's millimetre control, the inverse and the
 * numerical exterior share one binding and the rule table keeps no mirrored
 * copy. A channel the table binds to two different readings refuses by
 * name, because its control would not know which quantity it states.
 *
 * @author Samchon
 */
export function humanBodyChannelReading(
  channel: string,
): IAutoMovieHumanBodyMeasuredChannelReading | undefined {
  if (humanBodyMeasurementRule(channel) !== undefined) return { rule: channel };
  const bound = HUMAN_BODY_EXTERIOR_TARGETS.filter(
    (target) => target.channel === channel,
  );
  const first = bound[0];
  if (first === undefined) return undefined;
  if (
    bound.some(
      (target) => target.rule !== first.rule || target.side !== first.side,
    )
  )
    throw new Error(
      `The body channel ${channel} is bound to more than one measurement.`,
    );
  return first.side === undefined
    ? { rule: first.rule }
    : { rule: first.rule, side: first.side };
}
