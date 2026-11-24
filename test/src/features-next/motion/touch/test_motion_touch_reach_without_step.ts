import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanRefusal,
} from "@automovie/motions";

import { MOTION_HUMAN_LAW_STAGES_TOUCH } from "../../../features/internal/MOTION_HUMAN_LAW_STAGES_TOUCH";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import type { motionHumanLawSweep } from "../../../features/internal/motionHumanLawSweep";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

const { AutoMovieMotionHumanTouchEffector } = AutoMovieMotionHumanTouch;

/**
 * A planted touch uses a step only when a single bounded step makes the
 * original target reachable. The small woman keeps the former shoulder
 * touch scene facing the large man 0.55 m away.
 *
 * Scenarios:
 * 1. A point an arm's half length in front of the shoulder is reached
 *    without a step.
 * 2. At the unchanged partner's shoulder, one foot steps and returns.
 *    Its ground windows leave only those two swing intervals. At one
 *    quarter of the outward swing, horizontal travel is 53/512 of the
 *    grounded endpoints' displacement (Flash and Hogan 1985). Its advance
 *    closes the original gap by the hold, and the index tip reaches the
 *    shoulder within 10 mm beyond its skin pad.
 * 3. A target two statures away exceeds an arm and the single-step budget.
 *    It is refused on `target` with no successful substitute contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged reach branches, the single step's support windows, and the contact allowance.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the public touch on an authored world point and on an unchanged partner. Reads the displayed effector and feet and own ground contact schedule; catches a staged foot shuffle, missing or unbounded step, false contact or the wrong refusal.
 * @evidence contracts/development/testing.md#independent-expectations Body proportions bound the near and distant points. Tomita et al. 2024 Table 3 gives the step timing and Flash and Hogan's quintic gives its quarter share. The skin pad comes from the rig and the actual displayed shoulder supplies the target independently of the plan.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers planted success, a formerly refused partner shoulder on the same cast and placement, and deliberate beyond-step refusal. The seated-touch probe covers its own base.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory specification stages three public performances and reads only events and the relevant displayed bones.
 */
export function test_motion_touch_reach_without_step(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-small");
  const partner: IAutoMovieMotionHumanBody = motionHumanBody("m-large");
  const shoulder: IAutoMovieVector3 = body.rest.get("rightUpperArm")!;
  const arm: number = body.measure.upperArm + body.measure.forearm;
  /** A target in front of the standing shoulder, with the normal facing back. */
  const at: (z: number) => motionHumanLaw.IFilm = (
    z: number,
  ): motionHumanLaw.IFilm =>
    motionHumanLaw.perform(
      "touch-step-boundary",
      [{ subject: "a", body }],
      HumanChain.subject("a").touch({
        target: {
          kind: "point",
          at: { ...shoulder, z: shoulder.z + z },
          frame: "world",
          normal: { x: 0, y: 0, z: -1 },
        },
        kind: "hold",
        hand: "right",
      }),
    );
  const near: motionHumanLaw.IFilm = at(arm / 2);
  const planted: readonly IAutoMovieMotionHumanContactWindow[] = groundPlants(
    near.performance.segments("a")[0]!,
  );
  all.check(
    "one full ground plant on each foot for a point already in reach",
    planted.length === 2 &&
      planted.every(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.from === 0 && w.to === 1,
      ),
  );
  const nearSeconds: number = motionHumanLaw.event(near, "ready");
  const palm: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
    body,
    near.bones("a", nearSeconds),
    "right",
    AutoMovieMotionHumanTouch.touch.EFFECTORS.palm,
  );
  const palmPad: number = AutoMovieMotionHumanTouchEffector.pad(
    body,
    "right",
    AutoMovieMotionHumanTouch.touch.EFFECTORS.palm,
  );
  const nearPoint: IAutoMovieVector3 = {
    ...shoulder,
    z: shoulder.z + arm / 2 - palmPad,
  };
  const nearGap: number = Vector3.distance(palm, nearPoint);
  all.check(
    `the planted touch reaches its fixed target within 10 mm (${nearGap * 1000} mm)`,
    nearGap <= 0.01,
  );

  // The touch's own axes since #3505: the effector and the hand (formerly
  // `with` and `side`, which the stage no longer asks for, so the touch fell
  // back to the palm of its default hand).
  const pick: Readonly<Record<string, string>> = {
    kind: "stroke",
    effector: "fingertips",
    tangent: "up",
    hand: "right",
  };
  const staged: motionHumanLawSweep.IScene =
    MOTION_HUMAN_LAW_STAGES_TOUCH.touch!(
      (parameter: string): OptionalLabel => pick[parameter],
      body,
      partner,
    );
  try {
    const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
      "sweep-2",
      staged.people,
      staged.composition,
      staged.props,
    );
    const span: IAutoMovieMotionHumanSegment =
      film.performance.segments("a")[0]!;
    const ready: number = motionHumanLaw.event(film, "ready");
    const plants: readonly IAutoMovieMotionHumanContactWindow[] =
      groundPlants(span);
    const fixed: OptionalContact = plants.find(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.from === 0 && w.to === 1,
    );
    const steps: readonly IAutoMovieMotionHumanContactWindow[] = plants.filter(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.part !== fixed?.part,
    );
    all.check(
      "one foot stays planted and the other has three plant windows",
      fixed !== undefined && steps.length === 3,
    );
    if (fixed !== undefined && steps.length === 3) {
      const [
        first,
        middle,
        last,
      ]: readonly IAutoMovieMotionHumanContactWindow[] = steps;
      const spanSeconds: number = ready - span.start;
      // Healthy controls reaching with a step, medians in ms, Tomita et al.
      // 2024 Tables 2–3, DOI 10.1177/15459683241231528.
      const off: number = 262.51 / 993.46;
      const on: number = (262.51 + 454.62) / 993.46;
      all.check(
        "ground windows bracket the measured reach and return swings",
        first!.from === 0 &&
          last!.to === 1 &&
          middle!.to < last!.from &&
          nclose(first!.to * span.plan.duration, off * spanSeconds) &&
          nclose(middle!.from * span.plan.duration, on * spanSeconds),
      );
      const foot: AutoMovieHumanoidBone =
        steps[0]!.part === "leftFoot" ? "leftFoot" : "rightFoot";
      const start: IAutoMovieVector3 = film
        .bones("a", span.start)
        .get(foot)!.worldPosition;
      const arrived: IAutoMovieVector3 = film
        .bones("a", ready)
        .get(foot)!.worldPosition;
      const back: IAutoMovieVector3 = film
        .bones("a", span.end)
        .get(foot)!.worldPosition;
      // The swing's horizontal travel, with the vertical lift independent.
      const quarter: IAutoMovieVector3 = film
        .bones("a", span.start + (off + (on - off) / 4) * spanSeconds)
        .get(foot)!.worldPosition;
      const expected: IAutoMovieVector3 = Vector3.addScaled(
        start,
        Vector3.subtract(arrived, start),
        53 / 512,
      );
      all.check(
        "the swing has minimum-jerk horizontal progress at a quarter of the swing",
        vclose(quarter, { ...expected, y: quarter.y }, 0.005),
      );
      all.check(
        "the advancing foot moves toward the unchanged partner and returns within the 10 mm skin bound",
        arrived.z > start.z && Vector3.distance(start, back) <= 0.01,
      );
    }
    const frame: IAutoMovieMotionHumanBody["surfaces"]["regions"]["shoulderLeft"] =
      partner.surfaces.regions.shoulderLeft;
    const surface: ReturnType<typeof resolveAutoMovieHumanoidSurfaces.place> =
      resolveAutoMovieHumanoidSurfaces.place(
        frame,
        film.bones("b", ready).get(frame.bone)!,
      );
    const shown: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.point(
      body,
      film.bones("a", ready),
      "right",
      AutoMovieMotionHumanTouch.touch.EFFECTORS.fingertips,
    );
    const pad: number = AutoMovieMotionHumanTouchEffector.pad(
      body,
      "right",
      AutoMovieMotionHumanTouch.touch.EFFECTORS.fingertips,
    );
    const gap: number = Vector3.distance(
      shown,
      Vector3.addScaled(surface.point, surface.normal, pad),
    );
    all.check(
      `the index tip is ${gap * 1000} mm from its padded shoulder target`,
      gap <= 0.01,
    );
  } catch (error: unknown) {
    all.check(
      `the original shoulder scene should admit the adjustment step: ${String(error)}`,
      false,
    );
  }

  let refused: unknown;
  try {
    at(2 * body.measure.stature);
  } catch (error: unknown) {
    refused = error;
  }
  all.check(
    `outside one step, touch names its unreachable target: ${String(refused)}`,
    refused instanceof HumanRefusal &&
      refused.kind === "reach" &&
      refused.axis === "target",
  );
  all.assert(
    "touch spends an adjustment step only when it closes the same reach",
  );
}

/** Ground plants declared by the touch alone. */
function groundPlants(
  span: IAutoMovieMotionHumanSegment,
): readonly IAutoMovieMotionHumanContactWindow[] {
  return span.plan.contacts.filter(
    (w: IAutoMovieMotionHumanContactWindow): boolean =>
      w.kind === "plant" && w.support.kind === "ground",
  );
}

/** An optional named action or support label. */
type OptionalLabel = string | undefined;

/** A support interval when the gait declares one. */
type OptionalContact = IAutoMovieMotionHumanContactWindow | undefined;
