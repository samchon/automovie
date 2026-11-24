import {
  DEFAULT_HUMANOID_ROM,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Vector3,
  preparePoseResolution,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSelfAction,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGesture,
  HumanChain,
  AutoMovieMotionHumanGaze,
} from "@automovie/motions";
import { resolveHumanPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../features/internal/motionHumanLaw";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

const { gestureSignal, gestureStroke } = AutoMovieMotionHumanGesture;

/**
 * Eyes-only recruitment still applies the original weighted zero-cervical
 * target before solving actual eye directions in that resulting head frame.
 *
 * Scenarios:
 * 1. Authored neck/head abduction10/-6 is blended toward zero by head
 *    weight0,1/2,1, giving10/-6,5/-3,0/0. These literals do not assume that
 *    the body's zero-head pitch correction is zero or redefine recruitment.
 * 2. Alternating/repeated reachable world targets retain those cervical
 *    values while each actually displayed eye forward reaches its current
 *    target. A supplied genuine FK operation and an ordinary call both work.
 * 3. Earlier issued joint-tuple edits cannot alter the source or replay;
 *    every new cervical tuple is independent of the previous issue.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines original eyes-only recruitment versus weighted cervical application, clinical-degree literals, current displayed world-direction oracle, same-body loan scope and fresh tuple/input ownership in three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls real public HumanGaze.aim on a canonical Human with nonzero authored cervical joints and weights0/0.5/1 in changing order, with/without a genuine FK reader. Literal neck/head abduction catches an omitted cervical path in eyes mode; full raw displayed FK and independent forward/direction arithmetic require actual current eye solving. Previous-output poison and source equality expose leaked tuple storage.
 * @evidence contracts/development/testing.md#independent-expectations The original cervical writer targets abduction0 in every mode, so linear blending is base*(1-weight):10/-6 become5/-3 at1/2 and0/0 at1. Existing zero-head rest correction affects flexion/twist only and is not used as an expected value. A unit quaternion sends forwardZ to(2(xz+wy),2(yz-wx),1-2(x²+y²)); normalized target-minus-eye is its independent geometric expectation at1e-9 component precision. Clinical literals allow1e-12 degrees, without changing gaze limits or fitting bounds.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers nonzero positive/negative cervical inputs, zero/partial/full head weight, eyes-only recruitment, target A/B/A and both FK-source forms, actual displayed eyes, fresh cervical tuples and prior-output poison. Broader recruitment ranges/timing and population coverage remain with gaze/look feature tests; no new eyes-mode policy is introduced.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable motion unit borrows an immutable canonical Human and owns all raw joints/targets/output edits. It uses public aiming/resolution plus full raw FK, patches no foreign method/global or shared ROM and starts no host, compiler or renderer.
 */
export function test_motion_gesture_channels(): void {
  checkChannelSignals();
  checkGestureFrame();
  checkAuthoredChannels();
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { rightLowerArm: [25, 0, 0], neck: [6, 10, 4], head: [8, -6, -3] },
    limbs: {},
  };
  const unchanged: string = JSON.stringify(posture);
  const neutral: IAutoMovieResolvedBone[] = displayed(body, {
    ...posture,
    joints: {},
  });
  const left: IAutoMovieVector3 = neutral.find(
    (bone: IAutoMovieResolvedBone): boolean => bone.bone === "leftEye",
  )!.worldPosition;
  const right: IAutoMovieVector3 = neutral.find(
    (bone: IAutoMovieResolvedBone): boolean => bone.bone === "rightEye",
  )!.worldPosition;
  const origin: IAutoMovieVector3 = {
    x: (left.x + right.x) / 2,
    y: (left.y + right.y) / 2,
    z: (left.z + right.z) / 2,
  };
  const operation: ReturnType<typeof preparePoseResolution> =
    preparePoseResolution();
  let previous: IAutoMovieMotionHumanPosture | undefined;
  for (const borrowed of [false, true])
    for (const [weight, offset] of [
      [0.5, 0.4],
      [0, -0.3],
      [1, 0],
      [0.5, 0.4],
    ] as const) {
      const target: IAutoMovieVector3 = {
        x: origin.x + offset,
        y: origin.y,
        z: origin.z + 3,
      };
      const actual: IAutoMovieMotionHumanPosture = AutoMovieMotionHumanGaze.HumanGaze.aim(
        body,
        posture,
        target,
        "eyes",
        { eyes: 1, head: weight, trunk: 0 },
        borrowed ? operation : undefined,
      );
      TestValidator.predicate(
        `eyes-only cervical blend preserves literal abduction at headweight${weight}, loan=${borrowed}`,
        nclose(actual.joints.neck![1], 10 * (1 - weight), 1e-12) &&
          nclose(actual.joints.head![1], -6 * (1 - weight), 1e-12),
      );
      TestValidator.equals(
        "gaze retains the independent arm gesture",
        actual.joints.rightLowerArm,
        posture.joints.rightLowerArm,
      );
      for (const eye of displayed(body, actual).filter(
        (bone: IAutoMovieResolvedBone): boolean =>
          bone.bone === "leftEye" || bone.bone === "rightEye",
      )) {
        const delta: IAutoMovieVector3 = {
          x: target.x - eye.worldPosition.x,
          y: target.y - eye.worldPosition.y,
          z: target.z - eye.worldPosition.z,
        };
        const length: number = Math.hypot(delta.x, delta.y, delta.z);
        const { x, y, z, w }: IAutoMovieResolvedBone["worldRotation"] =
          eye.worldRotation;
        const forward: IAutoMovieVector3 = {
          x: 2 * (x * z + w * y),
          y: 2 * (y * z - w * x),
          z: 1 - 2 * (x * x + y * y),
        };
        TestValidator.predicate(
          `actual displayed${eye.bone} follows the current target after cervical blending`,
          vclose(
            forward,
            { x: delta.x / length, y: delta.y / length, z: delta.z / length },
            1e-9,
          ),
        );
      }
      if (previous !== undefined)
        TestValidator.predicate(
          "a later gaze cannot borrow or repair an earlier issued cervical tuple",
          actual.joints.head !== previous.joints.head &&
            actual.joints.neck !== previous.joints.neck &&
            Object.is(previous.joints.head![1], 777),
        );
      Object.defineProperty(actual.joints.head!, "1", { value: 777 });
      previous = actual;
      TestValidator.equals(
        "gaze reads preserve the original authored cervical input",
        JSON.stringify(posture),
        unchanged,
      );
    }
}

/** Resolve the actual displayed full hierarchy independently of the demanded trunk adapter. */
function displayed(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
): IAutoMovieResolvedBone[] {
  return resolvePose(
    resolveHumanPosture(body, posture),
    body.skeleton,
    HUMANOID_JOINT_AXES,
    HUMANOID_REST_FRAME,
  );
}

function checkChannelSignals(): void {
  const sum = (s: IAutoMovieMotionHumanGaze.ISplit): number =>
    s.eyes.yaw + s.head.yaw + s.trunk;
  const small = AutoMovieMotionHumanGaze.HumanGaze.split(10, 0);
  TestValidator.predicate(
    "small shift on the eyes",
    small.eyes.yaw === 10 && small.head.yaw === 0 && small.trunk === 0,
  );
  const middle = AutoMovieMotionHumanGaze.HumanGaze.split(40, 0);
  TestValidator.predicate(
    "middle shift recruits the head",
    middle.eyes.yaw === 15 && middle.head.yaw === 25 && middle.trunk === 0,
  );
  const large = AutoMovieMotionHumanGaze.HumanGaze.split(100, 0);
  TestValidator.predicate(
    "large shift recruits the trunk",
    large.eyes.yaw === 15 && large.head.yaw === 60 && large.trunk === 25,
  );
  const headOnly = AutoMovieMotionHumanGaze.HumanGaze.split(100, 0, "head");
  TestValidator.predicate(
    "head only leaves the excess on the eyes",
    headOnly.trunk === 0 &&
      headOnly.head.yaw === 60 &&
      headOnly.eyes.yaw === 40,
  );
  const eyesOnly = AutoMovieMotionHumanGaze.HumanGaze.split(50, -20, "eyes");
  TestValidator.predicate(
    "eyes only",
    eyesOnly.eyes.yaw === 50 &&
      eyesOnly.eyes.pitch === -20 &&
      eyesOnly.head.yaw === 0,
  );
  for (const [y, mode] of [
    [75, "auto"],
    [130, "head"],
    [30, "trunk"],
    [5, "eyes"],
  ] as const) {
    const s = AutoMovieMotionHumanGaze.HumanGaze.split(y, 25, mode);
    const m = AutoMovieMotionHumanGaze.HumanGaze.split(-y, 25, mode);
    TestValidator.predicate(
      "split sums to the direction",
      Math.abs(sum(s) - y) < 1e-12 &&
        Math.abs(s.eyes.pitch + s.head.pitch - 25) < 1e-12,
    );
    TestValidator.predicate(
      "split mirrors",
      Math.abs(m.eyes.yaw + s.eyes.yaw) < 1e-12 &&
        Math.abs(m.head.yaw + s.head.yaw) < 1e-12 &&
        Math.abs(m.trunk + s.trunk) < 1e-12,
    );
  }
  TestValidator.predicate(
    "main sequence",
    Math.abs(AutoMovieMotionHumanGaze.HumanGaze.saccade(10) - 0.043) < 1e-12 &&
      Math.abs(AutoMovieMotionHumanGaze.HumanGaze.saccade(-30) - 0.087) < 1e-12,
  );
  TestValidator.predicate(
    "head turns lengthen with amplitude",
    AutoMovieMotionHumanGaze.HumanGaze.turn(60) > AutoMovieMotionHumanGaze.HumanGaze.turn(20) &&
      AutoMovieMotionHumanGaze.HumanGaze.turn(20) > AutoMovieMotionHumanGaze.HumanGaze.turn(0),
  );

  TestValidator.predicate(
    "stroke ends at rest",
    gestureSignal.oscillation(0, 3) === 0 &&
      gestureSignal.oscillation(1, 3) === 0,
  );
  let jump: number = 0;
  for (let i: number = 1; i <= 1000; i++)
    jump = Math.max(
      jump,
      Math.abs(
        gestureSignal.oscillation(i / 1000, 3) -
          gestureSignal.oscillation((i - 1) / 1000, 3),
      ),
    );
  TestValidator.predicate(
    `stroke continuous (${jump.toFixed(4)})`,
    jump < 0.02,
  );
  for (const kind of Object.keys(
    gestureStroke.RHYTHM,
  ) as IAutoMovieMotionHumanGestureStroke.Kind[])
    TestValidator.predicate(
      `${kind} names its hands`,
      ["one", "both", "none"].includes(gestureStroke.HANDS[kind]),
    );
}

function checkAuthoredChannels(): void {
  const body = motionHumanBody("m-average");
  // Each law is performed after a stand and its plan read from its segment:
  // a raised arm's laid course may need more time than the law first plans,
  // which the performance gives it by replanning at a slower tempo
  // (`stretches`), so a plan taken from the law outside a performance is
  // refused where the performed one is not.
  const authored = (
    params: IAutoMovieMotionHumanSelfAction.IParams,
  ): IAutoMovieMotionHumanActionPlan =>
    motionHumanLaw
      .perform(
        "channels",
        [{ subject: "a", body }],
        HumanChain.subject("a").stand({ hold: 1 }).selfAction(params),
      )
      .performance.segments("a")[1]!.plan;
  const at = (plan: IAutoMovieMotionHumanActionPlan, name: string) =>
    plan.events.find((e) => e.name === name)!.share * plan.duration;
  for (const [kind, bone] of [
    ["neckRoll", "neck"],
    ["shoulderRoll", "rightShoulder"],
  ] as const) {
    const plan = authored({ kind }),
      start = at(plan, "strokeStart"),
      end = at(plan, "strokeEnd");
    const initial = resolveHumanPosture(body, plan.posture(0)).joints;
    const channel = (joints: typeof initial, joint: AutoMovieHumanoidBone) => {
      const j = joints.find((v) => v.bone === joint);
      return [j?.flexion ?? 0, j?.abduction ?? 0, j?.twist ?? 0];
    };
    const neutral = channel(initial, bone),
      elbow = channel(initial, "rightLowerArm"),
      rom = DEFAULT_HUMANOID_ROM[bone]!;
    for (const phase of [0, 0.25, 0.5, 0.75, 2]) {
      const joints = resolveHumanPosture(
        body,
        plan.posture(start + (phase * (end - start)) / 2),
      ).joints;
      const angles = channel(joints, bone),
        other = channel(joints, "rightLowerArm");
      TestValidator.predicate(
        kind + " circular channel " + phase,
        nclose(
          angles[0]! - neutral[0]!,
          (rom.flexion!.max * Math.cos(2 * Math.PI * phase)) / 4,
        ) &&
          nclose(
            angles[1]! - neutral[1]!,
            (rom.abduction!.max * Math.sin(2 * Math.PI * phase)) / 4,
          ) &&
          other.every((value, i) => nclose(value, elbow[i]!)),
      );
    }
  }
  const bone = (bones: IAutoMovieResolvedBone[], name: AutoMovieHumanoidBone) =>
    bones.find((b) => b.bone === name)!.worldPosition;
  for (const kind of ["stretch", "victory"] as const) {
    const plan = authored({ kind });
    const [entry, ready, end] = [0, at(plan, "ready"), plan.duration].map((t) =>
      displayed(body, plan.posture(t)),
    );
    for (const side of ["left", "right"] as const) {
      const wrist = bone(ready!, `${side}Hand`);
      TestValidator.predicate(
        kind + " raises and releases " + side,
        wrist.y > bone(ready!, `${side}UpperArm`).y &&
          (side === "left" ? wrist.x > 0 : wrist.x < 0) &&
          Vector3.distance(
            bone(entry!, `${side}Hand`),
            bone(end!, `${side}Hand`),
          ) <= 0.01,
      );
    }
  }
  const pump = authored({ kind: "fistPump", hand: "left" }),
    start = at(pump, "strokeStart"),
    period = (at(pump, "strokeEnd") - start) / 3;
  const [entry, down, release] = [
    start,
    start + period / 2,
    start + period,
  ].map((t) => displayed(body, pump.posture(t)));
  TestValidator.predicate(
    "a unilateral pump drops and returns its hand without moving the free arm",
    bone(down!, "leftHand").y < bone(entry!, "leftHand").y &&
      Vector3.distance(bone(release!, "leftHand"), bone(entry!, "leftHand")) <=
        0.01 &&
      Vector3.distance(bone(down!, "rightHand"), bone(entry!, "rightHand")) <=
        0.01,
  );
}
/** Heading acts on the displayed gesture. Cues translate both gaze events together. */
function checkGestureFrame(): void {
  const body = motionHumanBody("m-average"),
    actor = HumanChain.subject("a");
  const wave = actor.gesture({ kind: "wave" });
  const orig = motionHumanLaw.perform(
    "gesture-frame",
    [{ subject: "a", body }],
    wave,
  );
  const shift = { x: 3, y: 0, z: -2 };
  const turned = motionHumanLaw.perform(
    "gesture-frame",
    [{ subject: "a", body, yaw: 90, at: shift }],
    wave,
  );
  let worst = 0;
  for (let t = 0; t <= orig.duration; t += 0.25) {
    const target = turned.bones("a", t);
    for (const [bone, value] of orig.bones("a", t)) {
      const p = value.worldPosition,
        q = target.get(bone)!.worldPosition;
      worst = Math.max(
        worst,
        Math.hypot(q.x - (shift.x + p.z), q.y - p.y, q.z - (shift.z - p.x)),
      );
    }
  }
  TestValidator.predicate(
    "gesture is covariant under a quarter turn and translation",
    worst <= 0.001 && Math.abs(orig.duration - turned.duration) <= 1e-6,
  );
  const target = {
    kind: "point" as const,
    at: { x: 1, y: body.measure.shoulderHeight, z: 2 },
    frame: "world" as const,
  };
  const look = (cue?: GazeCue) =>
    motionHumanLaw.perform(
      "cue",
      [{ subject: "a", body }],
      actor.look({ target, cue }),
    );
  const ordinary = look();
  const onset = motionHumanLaw.event(ordinary, "gazeOn"),
    settled = motionHumanLaw.event(ordinary, "settled");
  for (const cue of ["seen", "signal"] as const) {
    const film = look(cue);
    const lag = motionHumanLaw.event(film, "gazeOn") - onset;
    TestValidator.predicate(
      cue + " delays both gaze events equally",
      lag >= 0.1 - 1e-9 &&
        Math.abs(motionHumanLaw.event(film, "settled") - settled - lag) <= 1e-9,
    );
  }
}
type GazeCue = "seen" | "signal";
