import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPerformance,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanPerformance,
  AutoMovieMotionHumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { HumanPerformanceSchedule } from "../../../../../packages/motions/src/perform/internal/HumanPerformanceSchedule";
import { standingPerformanceState } from "../../internal/fixtures/standingPerformanceState";
import { nclose } from "../../internal/nclose";

/**
 * An action synced by its own named instant uses a plan at the accepted start.
 *
 * Scenarios:
 *
 * 1. Align a contracting timing law and an oscillating law with a real root.
 * 2. Refuse a discontinuous timing law whose sign change encloses no root.
 * 3. Preserve the feasible timing range when the event needs an earlier start.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names alignment of an action's named event and distinguishes contracting and oscillating timing laws, a discontinuity without a root, and a start required before the film.
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance with an action whose lead depends on film time. Reads its scheduled start and the named event of the final plan, and checks the located cut refusal for a discontinuous or too-early cue.
 * @evidence contracts/development/testing.md#independent-expectations With a 2 s cue the contracting and oscillating timing functions both give a 1.5 s launch and a 0.5 s lead. The discontinuous timing jumps from a 0.25 s lead to a 0.75 s lead at 1.5 s, so every resulting event lies outside the permitted target tolerance.
 */
export async function test_motions_perform_align_start_residual(): Promise<void> {
  const { state } = await standingPerformanceState();
  const performer = state.performers[0]!;
  const play = (
    lead: (start: number) => number,
    target: number = 2,
  ): IAutoMovieMotionHumanPerformance => {
    const law: IAutoMovieMotionHumanActionLaw = {
      name: "measureLead",
      interrupts: {},
      plan: (
        context: IAutoMovieMotionHumanActionContext,
      ): IAutoMovieMotionHumanActionPlan => {
        const delay: number = lead(context.start);
        const duration: number = delay + 0.25;
        return {
          duration,
          events: [{ name: "arrive", share: delay / duration }],
          contacts: [],
          posture: () => context.entry.posture,
        };
      },
    };
    return new AutoMovieMotionHumanPerformance({
      seed: "align-start-residual",
      performers: [performer],
      laws: [law],
      cues: { bell: [{ name: "beat", seconds: target }] },
      composition: {
        type: "at",
        anchor: "bell",
        offset: 0,
        event: "beat",
        align: "arrive",
        part: {
          type: "intent",
          intent: { subject: performer.subject, capability: law.name },
        },
      },
    });
  };

  const verify = (label: string, lead: (start: number) => number): void => {
    const placed = play(lead).segments(performer.subject)[0]!;
    const arrive = placed.plan.events.find((event) => event.name === "arrive")!;
    TestValidator.predicate(
      label,
      nclose(placed.start, 1.5, HumanPerformanceSchedule.CUT) &&
        nclose(
          placed.start + arrive.share * placed.plan.duration,
          2,
          HumanPerformanceSchedule.CUT,
        ),
    );
  };
  verify("contracting alignment", (start) => 0.5 + 0.25 * (start - 1.5));
  verify("continuous oscillation", (start) => Math.max(0, start - 1));

  const refused = (
    lead: (start: number) => number,
    target?: number,
  ): AutoMovieMotionHumanRefusal => {
    try {
      play(lead, target);
    } catch (error) {
      if (
        error instanceof AutoMovieMotionHumanRefusal &&
        error.kind === "cut" &&
        error.axis === "sync"
      )
        return error;
      throw error;
    }
    throw new Error("The cue should have been refused");
  };
  TestValidator.equals(
    "a discontinuity with opposite signs has no matching event",
    refused((start) => (start < 1.5 ? 0.25 : 0.75)).feasible,
    null,
  );
  TestValidator.equals(
    "a root before the film keeps the timing range",
    refused(() => 0.75, 0.5).feasible,
    { kind: "range", minimum: 0.75, maximum: null, unit: "s" },
  );
}
