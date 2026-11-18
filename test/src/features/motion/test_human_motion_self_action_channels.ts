import { DEFAULT_HUMANOID_ROM, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSelfAction,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain } from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanLaw } from "../internal/motionHumanLaw";
import { nclose } from "../internal/nclose";

/**
 * Self actions write the parts that express the gesture over a held base.
 * A quarter cycle separates the two components of a roll, and a raised
 * stance distinguishes two working arms from a single pumping arm.
 *
 * Scenarios:
 * 1. The default two rolls of the neck or shoulders reach the four signed
 *    extrema of the named joints in the documented order and light range.
 *    The right elbow keeps its local attitude.
 * 2. Both arms reach overhead on stretch and victory. The raised wrists
 *    lie on opposite sides, and the gesture returns both hands to their
 *    original pose within the 10 mm skin bound.
 * 3. A left fist pump repeats three times by default. The left hand drops
 *    and returns during one period, while the right arm stays at rest.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the five gestures, the neutral base and what distinguishes the written parts and phases.
 * @evidence contracts/development/testing.md#behavioral-verification Performs the self-action law through a public chain and reads displayed local angles or world wrist positions at published events and independent phase fractions. Detects an inactive or wrong channel, wrong repetition, wrong phase sign and a failure to return.
 * @evidence contracts/development/testing.md#independent-expectations Trigonometric extrema and the public rig's positive flexion and abduction limits give circle values. The arm observations compare to each body's displayed shoulder and to the independently observed incoming pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both closed roll variants, both hands or one hand, and default repetition with no artificial matrix of side and count values. The mirror test covers the corresponding right-hand pump.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable in-memory test prepares the same polygon body once and performs five short films through the public action law.
 */
export function test_human_motion_self_action_channels(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  /** One gesture on the same starting stance and neutral manner. */
  const perform: (
    params: IAutoMovieMotionHumanSelfAction.IParams,
  ) => motionHumanLaw.IFilm = (
    params: IAutoMovieMotionHumanSelfAction.IParams,
  ): motionHumanLaw.IFilm =>
    motionHumanLaw.perform(
      "self-action",
      [{ subject: "a", body }],
      HumanChain.subject("a").selfAction(params),
    );

  for (const [kind, bone] of [
    ["neckRoll", "neck"],
    ["shoulderRoll", "rightShoulder"],
  ] as const) {
    const film: motionHumanLaw.IFilm = perform({ kind });
    const start: number = motionHumanLaw.event(film, "strokeStart");
    const period: number =
      (motionHumanLaw.event(film, "strokeEnd") - start) / 2;
    const neutral: IAutoMovieJointPose | undefined = joint(film, 0, bone);
    const elbow: IAutoMovieJointPose | undefined = joint(
      film,
      0,
      "rightLowerArm",
    );
    const range: NonNullable<
      (typeof DEFAULT_HUMANOID_ROM)[AutoMovieHumanoidBone]
    > = DEFAULT_HUMANOID_ROM[bone]!;
    // The documented light rung is one quarter of the positive range.
    const flex: number = range.flexion!.max / 4;
    const across: number = range.abduction!.max / 4;
    for (const [cycle, x, y] of [
      [0, 1, 0],
      [1 / 4, 0, 1],
      [1 / 2, -1, 0],
      [3 / 4, 0, -1],
      [2, 1, 0],
    ] as const) {
      const seconds: number = start + cycle * period;
      const angle: IAutoMovieJointPose | undefined = joint(film, seconds, bone);
      const f: number = (angle?.flexion ?? 0) - (neutral?.flexion ?? 0);
      const a: number = (angle?.abduction ?? 0) - (neutral?.abduction ?? 0);
      all.check(
        `${kind}, cycle ${cycle}: flexion/abduction ${f}/${a} degrees`,
        nclose(f, flex * x) && nclose(a, across * y),
      );
      const free: IAutoMovieJointPose | undefined = joint(
        film,
        seconds,
        "rightLowerArm",
      );
      all.check(
        `${kind} leaves the right elbow still`,
        nclose(free?.flexion ?? 0, elbow?.flexion ?? 0) &&
          nclose(free?.abduction ?? 0, elbow?.abduction ?? 0) &&
          nclose(free?.twist ?? 0, elbow?.twist ?? 0),
      );
    }
  }

  for (const kind of ["stretch", "victory"] as const) {
    const film: motionHumanLaw.IFilm = perform({ kind });
    const ready: number = motionHumanLaw.event(film, "ready");
    const shown: motionHumanLaw.Bones = film.bones("a", ready);
    for (const side of ["left", "right"] as const) {
      const wrist: AutoMovieHumanoidBone = `${side}Hand`;
      const raised: IAutoMovieVector3 = shown.get(wrist)!.worldPosition;
      const shoulder: IAutoMovieVector3 = shown.get(
        `${side}UpperArm`,
      )!.worldPosition;
      const start: IAutoMovieVector3 = film
        .bones("a", 0)
        .get(wrist)!.worldPosition;
      const end: IAutoMovieVector3 = film
        .bones("a", film.duration)
        .get(wrist)!.worldPosition;
      all.check(
        `${kind} raises the ${side} hand above its shoulder and on its own side`,
        raised.y > shoulder.y &&
          (side === "left" ? raised.x > 0 : raised.x < 0),
      );
      all.check(
        `${kind} returns the ${side} hand within 10 mm`,
        Vector3.distance(start, end) <= 0.01,
      );
    }
  }

  const pump: motionHumanLaw.IFilm = perform({
    kind: "fistPump",
    side: "left",
  });
  const start: number = motionHumanLaw.event(pump, "strokeStart");
  const period: number = (motionHumanLaw.event(pump, "strokeEnd") - start) / 3;
  const before: motionHumanLaw.Bones = pump.bones("a", start);
  const dropped: motionHumanLaw.Bones = pump.bones("a", start + period / 2);
  const after: motionHumanLaw.Bones = pump.bones("a", start + period);
  all.check(
    "one of the default three fist pumps drops at half period and returns",
    dropped.get("leftHand")!.worldPosition.y <
      before.get("leftHand")!.worldPosition.y &&
      Vector3.distance(
        after.get("leftHand")!.worldPosition,
        before.get("leftHand")!.worldPosition,
      ) <= 0.01,
  );
  all.check(
    "the free hand stays at rest during the left fist pump",
    Vector3.distance(
      dropped.get("rightHand")!.worldPosition,
      before.get("rightHand")!.worldPosition,
    ) <= 0.01,
  );
  all.assert("the self actions move only the channels they own");
}

/** The actual displayed joint angles, after all ordinary pose resolution. */
function joint(
  film: motionHumanLaw.IFilm,
  seconds: number,
  bone: AutoMovieHumanoidBone,
): IAutoMovieJointPose | undefined {
  return film.performance
    .pose("a", seconds)
    .joints.find((j: IAutoMovieJointPose): boolean => j.bone === bone);
}
