import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { qclose } from "../internal/qclose";
import { vclose } from "../internal/vclose";

/**
 * A person may signal with one hand and watch a partner during a crouch or
 * kneel while the original posture carries the body (#3575).
 *
 * Scenarios:
 * 1. A count and a head-only look start at the named low hold over both
 *    crouch depths, half kneeling and sitting back on the heels. At the
 *    signal stroke's midpoint the right wrist is raised from its thigh rest
 *    and the head has turned. The pelvis, feet, idle wrist and contact
 *    windows match the same carrier alone. Standing entry and an explicit
 *    cut from a stand both appear.
 * 2. A bow claiming the root and trunk over a crouch is refused on `over`.
 * 3. A right-hand signal scheduled when the right palm bears on the floor
 *    in a support sequence is refused on `over`, naming the claimed arm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the public composition, the admitted carriers and the two refused claims.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the planned overlays, the declared support windows, the displayed bones at the stroke midpoint and the returned refusal kind and axis.
 * @evidence contracts/development/testing.md#independent-expectations The carrier-only composition gives the invariance of its own parts; a stop signal raises the hand off its rest, and a head-only look turns the head.
 * @evidence contracts/development/testing.md#distinguishing-cases Two crouch depths and two kneeling bases pair with the boundary body fixtures; a trunk claim distinguishes whole-body gestures and a bearing hand distinguishes a required support.
 * @evidence contracts/development/testing.md#execution-ownership The motion runner discovers this CPU-only spec. Each paired case plans one arm trajectory and reads two displayed poses for comparison.
 */
export function test_human_motion_lowered_gesture(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const [name, kind] of [
    ["f-small", "one"],
    ["m-large", "partial"],
    ["f-tall", "full"],
    ["m-average", "sitBack"],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const start: IAutoMovieMotionHumanChain = HumanChain.subject("counter");
    const entry: IAutoMovieMotionHumanChain =
      kind === "partial" || kind === "sitBack"
        ? start.stand({ seconds: 1 })
        : start;
    const event: "lowest" | "settled" =
      kind === "partial" || kind === "full" ? "lowest" : "settled";
    const carrier: IAutoMovieMotionHumanChain =
      kind === "partial" || kind === "full"
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
                .gesture({ kind: "stopPalm", side: "right", count: 1 })
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
                  with: "head",
                  seconds: 2,
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
      all.check(
        `${name} ${kind}: the signal starts at the carrier's low hold`,
        Math.abs(signal.start - instant(lowered, event)) <= 1e-6,
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
          `${name} ${kind}: ${bone} stays with the carrier through the count`,
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
  const feet: readonly [
    { readonly part: "leftFoot"; readonly kind: "bear" },
    { readonly part: "rightFoot"; readonly kind: "bear" },
  ] = [
    { part: "leftFoot", kind: "bear" },
    { part: "rightFoot", kind: "bear" },
  ];
  for (const [chain, claim] of [
    [
      start
        .crouch({ hold: 3 })
        .over(
          (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            upper.gesture({ kind: "bow" }),
        ),
      "trunk",
    ],
    [
      start
        .support(
          {
            stances: [
              { contacts: feet },
              {
                contacts: [
                  ...feet,
                  { part: "leftHand", kind: "bear" },
                  { part: "rightHand", kind: "bear" },
                ],
              },
              { contacts: feet },
            ],
          },
          "braced",
        )
        .over(
          (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            upper
              .gesture({ kind: "stopPalm", side: "right" })
              .sync({ of: "braced", event: "stance1" }),
        ),
      "rightArm",
    ],
  ] as const) {
    let caught: unknown;
    try {
      perform(body, chain);
    } catch (error) {
      caught = error;
    }
    all.check(
      `${claim} cannot be taken from its carrier, received ${String(caught)}`,
      caught instanceof HumanRefusal &&
        caught.kind === "channel" &&
        caught.axis === "over" &&
        Array.isArray(caught.value) &&
        caught.value.includes(claim),
    );
  }
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
