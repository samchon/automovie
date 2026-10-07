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
 * @evidence contracts/common.md#principled-implementation One lookup joins the rule table and the target table, so editor controls and the exterior generator never disagree about a channel's quantity.
 * @evidence contracts/common.md#clear-and-simple-design Own rule first, then the single table binding.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An ambiguous binding refuses instead of picking one.
 * @evidence contracts/common.md#meaningful-documentation States both sources, their order and the refusal.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping It defines no part.
 * @evidence contracts/modeling.md#parameter-channels Maps a source channel to the named measurement it is typed by.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions It carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The editor displays the control.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The rule owns its definition.
 * @evidenceExclude contracts/anatomy.md#permitted-range The inverse owns admission.
 * @evidence contracts/anatomy.md#parametric-authority A channel is offered only as a named measurement, never as a raw weight.
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
