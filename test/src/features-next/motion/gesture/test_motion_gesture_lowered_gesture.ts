import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { qclose } from "../../../features/internal/qclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * A person may signal with one hand and watch a partner during a crouch or
 * kneel while the original posture carries the body (#3575).
 *
 * Scenarios:
 * 1. A wave or stop signal and head-only look start at the low hold in a full crouch,
 *    a half-kneel with one foot flat, and a sit-back kneel cut from a stand.
 *    At mid-stroke the wrist rises and the head turns while the carrier
 *    keeps its pose and contacts.
 * 2. A bow claiming the trunk over a crouch is refused on `over`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the low carriers, entry paths, free parts and refused trunk claim.
 * @evidence contracts/development/testing.md#behavioral-verification Composes a local gesture and gaze at the hold, checks the displayed wrist and head against the unlayered posture, and reads the typed refusal for a whole-body gesture.
 * @evidence contracts/development/testing.md#independent-expectations The unlayered carrier gives the expected invariant bone transforms and contact windows. The selected one-hand signal lifts the wrist and a head-only look rotates the head at the sampled stroke midpoint.
 * @evidence contracts/development/testing.md#distinguishing-cases The full crouch uses standing contacts. The two kneels differ in bearing posture and entry path. The crouch-depth spec owns depth geometry and the support-overlay spec owns bearing-hand refusals.
 * @evidence contracts/development/testing.md#execution-ownership The motion runner discovers this in-memory unit. Each carrier uses two performances and one displayed pose per performance.
 */
export function test_motion_gesture_lowered_gesture(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const [name, kind] of [
    ["f-tall", "full"],
    ["f-small", "one"],
    ["m-average", "sitBack"],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const start: IAutoMovieMotionHumanChain = HumanChain.subject("counter");
    const entry: IAutoMovieMotionHumanChain =
      kind === "sitBack" ? start.stand({ hold: 1 }) : start;
    const event: "lowest" | "settled" = kind === "full" ? "lowest" : "settled";
    const carrier: IAutoMovieMotionHumanChain =
      kind === "full"
        ? entry.crouch({ depth: kind, hold: 3 }, "low")
        : entry.kneel({ kind, hold: 3, rise: false }, "low");

    try {
      const plain: IAutoMovieMotionHumanPerformance = perform(body, carrier);
      const signalled: IAutoMovieMotionHumanPerformance = perform(
        body,
        carrier
          .over(
            (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
              upper
                .gesture({
                  kind: kind === "full" ? "wave" : "stopPalm",
                  hand: "right",
                  count: 1,
                })
                .sync({ of: "low", event }),
          )
          .over(
            (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
              upper
                .look({
                  target: {
                    kind: "point",
                    at: { x: 1, y: 0.5, z: 1 },
                    frame: "world",
                  },
                  recruit: "head",
                  duration: 2,
                })
                .sync({ of: "low", event }),
          ),
      );
      const lowered: IAutoMovieMotionHumanSegment = signalled
        .segments("counter")
        .at(-1)!;
      const [signal, gaze] = signalled.overlays("counter");
      if (signal === undefined || gaze === undefined) {
        all.check(`${name} ${kind}: both overlays were placed`, false);
        continue;
      }
      const hold: number = instant(lowered, event);
      all.check(
        `${name} ${kind}: both overlays start at the carrier's low hold`,
        Math.abs(signal.start - hold) <= 1e-6 &&
          Math.abs(gaze.start - hold) <= 1e-6,
      );
      all.equals(
        `${name} ${kind}: the gesture claims its own arm and hand`,
        [...signal.channels].sort((a: string, b: string): number =>
          a.localeCompare(b),
        ),
        ["rightArm", "rightHand"],
      );
      all.equals(`${name} ${kind}: gaze claims the head`, gaze.channels, [
        "head",
      ]);
      all.equals(
        `${name} ${kind}: the carrier's support windows are preserved`,
        lowered.plan.contacts,
        plain.segments("counter").at(-1)!.plan.contacts,
      );

      // Use a named interval in the gesture plan to read one pose per run.
      const stroke: number =
        (instant(signal, "strokeStart") + instant(signal, "strokeEnd")) / 2;
      const posed: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
        signalled.bones("counter", stroke);
      const alone: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
        plain.bones("counter", stroke);
      for (const bone of [
        "hips",
        "leftFoot",
        "rightFoot",
        "leftHand",
      ] as const) {
        const actual: IAutoMovieResolvedBone = posed.get(bone)!;
        const original: IAutoMovieResolvedBone = alone.get(bone)!;
        all.check(
          `${name} ${kind}: ${bone} stays with the carrier through the gesture`,
          vclose(actual.worldPosition, original.worldPosition) &&
            qclose(actual.worldRotation, original.worldRotation),
        );
      }
      all.check(
        `${name} ${kind}: the signalling wrist rises off the thigh`,
        posed.get("rightHand")!.worldPosition.y >
          alone.get("rightHand")!.worldPosition.y,
      );
      all.check(
        `${name} ${kind}: the gaze changes the head's rotation`,
        !qclose(
          posed.get("head")!.worldRotation,
          alone.get("head")!.worldRotation,
        ),
      );
    } catch (error) {
      all.check(`${name} ${kind}: ${String(error)}`, false);
    }
  }

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const start: IAutoMovieMotionHumanChain = HumanChain.subject("counter");
  let caught: unknown;
  try {
    perform(
      body,
      start
        .crouch({ hold: 3 })
        .over(
          (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            upper.gesture({ kind: "bow" }),
        ),
    );
  } catch (error) {
    caught = error;
  }
  all.check(
    `the trunk stays with the crouch, received ${String(caught)}`,
    caught instanceof HumanRefusal &&
      caught.kind === "channel" &&
      caught.axis === "over" &&
      Array.isArray(caught.value) &&
      caught.value.includes("trunk"),
  );
  all.assert("a lowered carrier yields its free upper-body channels");
}

/** Builds both versions of the performance from identical entry conditions. */
function perform(
  body: IAutoMovieMotionHumanBody,
  chain: IAutoMovieMotionHumanChain,
): IAutoMovieMotionHumanPerformance {
  return new HumanPerformance({
    seed: "lowered-gesture",
    performers: [
      {
        subject: "counter",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: chain.node,
  });
}

/** Converts an authored event to a film second. */
function instant(segment: IAutoMovieMotionHumanSegment, event: string): number {
  const share: number = segment.plan.events.find(
    (each): boolean => each.name === event,
  )!.share;
  return segment.start + share * segment.plan.duration;
}
