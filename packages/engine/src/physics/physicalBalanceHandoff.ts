import type {
  IAutoMoviePhysicalRecoveryState,
  IAutoMovieStepPlanner,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IAutoMoviePhysicalBalanceTrace } from "./IAutoMoviePhysicalBalanceTrace";
import { physicalRecoverySwing } from "./internal/physicalRecoverySwing";
import { resolvePhysicalRecoveryStep } from "./internal/resolvePhysicalRecoveryStep";

/**
 * The balance controller's handoff phase (`advancePhysicalBalance`): authored
 * motion taking endpoints back. A step under way on an endpoint the authored
 * motion now owns cancels every step under way, counted neither as a landing
 * nor as a fall; an endpoint's retained landing offset is handed back to the
 * authored motion and the handoff recorded.
 *
 * @param input The recovery's state, the endpoints authored motion owns this
 *   substep, the present local seconds and the trace to record into, if any.
 * @returns The state after the handoff, a new one, or the input itself when
 *   nothing is handed back; the input is never written.
 */
export function physicalBalanceHandoff(input: {
  state: Readonly<IAutoMoviePhysicalRecoveryState>;
  unavailable?: readonly string[];
  seconds: number;
  trace?: IAutoMoviePhysicalBalanceTrace[];
}): IAutoMoviePhysicalRecoveryState {
  let state: IAutoMoviePhysicalRecoveryState = input.state;
  const owned: IAutoMovieStepPlanner.IStep[] = physicalRecoverySwing(state);
  if (
    owned.some(
      (step: IAutoMovieStepPlanner.IStep): boolean =>
        input.unavailable?.includes(step.bone) ?? false,
    )
  ) {
    // Authored motion now owns this endpoint. A recovery request cannot keep
    // replacing an authored limb action or scheduled swing, nor count its
    // cancellation as a fall; every step under way is withdrawn.
    const next: IAutoMoviePhysicalRecoveryState = {
      ...state,
      steps: owned.reduce(
        (
          steps: IAutoMoviePhysicalRecoveryState["steps"],
          step: IAutoMovieStepPlanner.IStep,
        ): IAutoMoviePhysicalRecoveryState["steps"] =>
          resolvePhysicalRecoveryStep(steps, step.bone, {
            seconds: input.seconds,
            status: "cancelled",
          }),
        state.steps,
      ),
      swing: undefined,
      outsideSince: undefined,
      failedLanding: undefined,
      revision: (state.revision ?? 0) + 1,
    };
    delete next.swings;
    state = next;
    input.trace?.push({
      kind: "cancelled",
      seconds: input.seconds,
      bones: owned.map((step: IAutoMovieStepPlanner.IStep): string => step.bone),
    });
  }
  for (const bone of input.unavailable ?? [])
    if (state.offsets[bone]) {
      // The offsets keep the null prototype the state starts them with.
      const offsets: Record<string, IAutoMovieVector3> = Object.assign(
        Object.create(null) as Record<string, IAutoMovieVector3>,
        state.offsets,
      );
      delete offsets[bone];
      state = {
        ...state,
        offsets,
        handoffs: [
          ...(state.handoffs ?? []),
          { bone, seconds: input.seconds },
        ],
        revision: (state.revision ?? 0) + 1,
      };
    }
  return state;
}
