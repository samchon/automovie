/**
 * One planned row-target application inside `applyHumanBodyShapeRows`.
 *
 * The planner records every active channel endpoint and corrective first, in
 * application order, so an unavailable source target refuses before the first
 * buffer write. The gain is already non-negative: a negative channel weight
 * selects the negative endpoint and contributes its absolute value.
 *
 * @author Samchon
 */
export interface IHumanBodyShapeTargetGain {
  /** Basis row-target name: a channel endpoint or a corrective target. */
  target: string;

  /** Non-negative multiplier applied to every offset of `target`. */
  gain: number;
}
