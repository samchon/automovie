import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { poseBones, resolveHumanPosture } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";
import { qclose } from "../../../../features/internal/qclose";
import { vclose } from "../../../../features/internal/vclose";

/**
 * A public performer observation may request a few bones without publishing
 * the omitted free-limb fit as a complete displayed pose.
 *
 * Scenarios:
 * 1. A registered observer captures another performer's public reader during
 *    planning and calls it from its own posture. After construction settles,
 *    a head-only observation at an arbitrary
 *    instant returns exactly that bone; the following full public pose/bones
 *    must still fit the authored lifted foot within 0.001 metres.
 * 2. Reversing the full/partial query order at another exact instant preserves
 *    the same actual target. Repeated head observations cannot poison a later
 *    full pose through the existing exact-time pose cache.
 * 3. Mutating a returned partial head position cannot alter another partial
 *    map or the fresh full bone map at that same instant.
 * 4. The body's real mass-bearing bone set returns the same current world
 *    frames as full display and cannot publish an incomplete full-pose cache.
 * 5. During a real arm overlay, a head-only observation keeps the overlay's
 *    conservative complete solve. A following full pose still contains the
 *    literal10-degree arm write and the current lifted-foot task.
 * 6. A real cut at0.4s inertializes for0.2s into a different lifted-foot
 *    task. During the offset, partial-first full frames equal a separate
 *    complete performance; after0.6s the target's literal demand holds.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States post-construction timing, partial/full ownership, canonical Human, real mass demand, query order, active-overlay/cut fallback and the unchanged contact bound in six scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Uses actual registered laws, context.performer.bones and public HumanPerformance reads. It checks requested membership, foot contact after partial-first reads, mass-frame parity, reversed order, nested output isolation and the real overlay's literal arm write after a selected observation.
 * @evidence contracts/development/testing.md#independent-expectations The law explicitly asks a foot to rise0.06 metres and move forward0.04 from its initial world point. A complete fit must meet that actual goal within the existing0.001 metre bound, so returning an omitted-leg partial solve as full fails. During an active inertial offset, a separate complete-only performance supplies cache-equivalence expectations at1e-9; free endpoints need not meet the raw target until that offset ends. The subsequent literal target is0.09m up and0.02m forward. Ownership/parity supplement those geometric demands.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers head-before-full at a fresh settled instant, full-before-head, exact replay, partial-output edits, real mass-bone observations, a real active arm overlay and observations during/after a declared inertialized cut. Composer counters and the larger physical cut acceptance matrix retain separate owners.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable numerical unit uses the canonical Human fixture and actual public extension laws. The captured performer reader is invoked only inside the observer's posture at that same film second, as its supported contract requires; no internal module, test-only export, replacement or host is used.
 */
export function test_motion_dynamics_partial_pose_observation(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const neutral: IAutoMoviePose = resolveHumanPosture(body, {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });
  const rest: IAutoMovieResolvedBone[] = Array.from(
    poseBones(body, neutral).values(),
  );
  const foot: IAutoMovieVector3 = rest.find(
    (value: IAutoMovieResolvedBone): boolean => value.bone === "leftFoot",
  )!.worldPosition;
  const knee: IAutoMovieVector3 = rest.find(
    (value: IAutoMovieResolvedBone): boolean => value.bone === "leftLowerLeg",
  )!.worldPosition;
  const target: IAutoMovieVector3 = {
    x: foot.x,
    y: foot.y + 0.06,
    z: foot.z + 0.04,
  };
  const selected: ReadonlySet<AutoMovieHumanoidBone> = new Set(["head"]);
  const observed: IObservation = { demand: selected };
  const moving: IAutoMovieMotionHumanActionLaw = {
    name: "observedFreeLeg",
    interrupts: {},
    yields: ["rightArm"],
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => ({
      duration: 1,
      events: [],
      contacts: [],
      posture: (): IAutoMovieMotionHumanPosture => ({
        root: { ...context.entry.posture.root },
        yaw: 0,
        pitch: 0,
        roll: 0,
        joints: { head: [15, 0, 0] },
        limbs: {
          leftLeg: {
            point: { ...target },
            bend: { x: knee.x, y: knee.y, z: knee.z + 0.3 },
          },
        },
      }),
    }),
  };
  const observer: IAutoMovieMotionHumanActionLaw = {
    name: "captureBoneReader",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => {
      const reader: IAutoMovieMotionHumanPerformerReader =
        context.performer("A");
      observed.reader = reader;
      return {
        duration: 1,
        events: [],
        contacts: [],
        posture: (seconds: number): IAutoMovieMotionHumanPosture => {
          observed.partial = reader.bones(
            context.start + seconds,
            observed.demand,
          );
          return context.entry.posture;
        },
      };
    },
  };
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "partial-observation-cache",
    performers: [
      {
        subject: "A",
        body: { ...body },
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "B",
        body: { ...body },
        at: { x: 3, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    laws: [moving, observer],
    composition: {
      kind: "parallel",
      parts: [
        HumanChain.subject("A").registered("observedFreeLeg").node,
        HumanChain.subject("B").registered("captureBoneReader").node,
      ],
    },
  });
  TestValidator.predicate(
    "observer captures the supported performer reader",
    observed.reader !== undefined,
  );
  const firstTime: number = 3 / 4;
  const partial: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    partialAt(firstTime);
  TestValidator.equals(
    "requested observation returns only its named bone",
    Array.from(partial.keys()),
    ["head"],
  );
  const originalX: number = partial.get("head")!.worldPosition.x;
  partial.get("head")!.worldPosition.x = 123;
  complete(firstTime);
  const replay: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    partialAt(firstTime);
  TestValidator.predicate(
    "partial output mutation cannot alter another observation",
    replay !== partial &&
      replay.get("head") !== partial.get("head") &&
      replay.get("head")!.worldPosition !==
        partial.get("head")!.worldPosition &&
      nclose(replay.get("head")!.worldPosition.x, originalX, 1e-12),
  );
  const secondTime: number = 1 / 4;
  complete(secondTime);
  partialAt(secondTime);
  complete(secondTime);
  const massBones: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    body.massModel.segments.map(
      (
        segment: IAutoMovieResolveCenterOfMass.ISegment,
      ): AutoMovieHumanoidBone => segment.bone,
    ),
  );
  observed.demand = massBones;
  const massTime: number = 1 / 2;
  const mass: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    partialAt(massTime);
  TestValidator.predicate(
    "actual mass observation returns every requested mass frame only",
    mass.size === massBones.size &&
      Array.from(mass.keys()).every((name: AutoMovieHumanoidBone): boolean =>
        massBones.has(name),
      ),
  );
  complete(massTime);
  const displayed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    performance.bones("A", massTime);
  TestValidator.predicate(
    "partial mass frames equal the subsequent complete display",
    Array.from(mass).every(
      ([name, value]: [
        AutoMovieHumanoidBone,
        IAutoMovieResolvedBone,
      ]): boolean => {
        const full: IAutoMovieResolvedBone | undefined = displayed.get(name);
        return (
          full !== undefined &&
          vclose(value.worldPosition, full.worldPosition, 1e-9) &&
          qclose(value.worldRotation, full.worldRotation, 1e-9)
        );
      },
    ),
  );

  const armOverlay: IAutoMovieMotionHumanActionLaw = {
    name: "observedArmOverlay",
    interrupts: {},
    overlay: true,
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => ({
      duration: 1,
      events: [],
      contacts: [],
      channels: ["rightArm"],
      posture: (): IAutoMovieMotionHumanPosture => ({
        ...context.entry.posture,
        joints: { ...context.entry.posture.joints, rightUpperArm: [10, 0, 0] },
        limbs: {},
      }),
    }),
  };
  observed.demand = selected;
  const overlaid: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "partial-observation-overlay",
    performers: performance.performers.map(
      (
        performer: IAutoMovieMotionHumanPerformance["performers"][number],
      ): IAutoMovieMotionHumanPerformance["performers"][number] => ({
        ...performer,
      }),
    ),
    laws: [moving, observer, armOverlay],
    composition: {
      kind: "parallel",
      parts: [
        HumanChain.subject("A")
          .registered("observedFreeLeg")
          .over(
            (upper: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
              upper.registered("observedArmOverlay"),
          ).node,
        HumanChain.subject("B").registered("captureBoneReader").node,
      ],
    },
  });
  const overlayTime: number = 0.512345;
  overlaid.posture("B", overlayTime);
  TestValidator.equals(
    "active overlay observations keep only requested outputs",
    Array.from(observed.partial!.keys()),
    ["head"],
  );
  const overlayPose: IAutoMoviePose = overlaid.pose("A", overlayTime);
  const overlayFoot: IAutoMovieVector3 = overlaid
    .bones("A", overlayTime)
    .get("leftFoot")!.worldPosition;
  const arm: number | null | undefined = overlayPose.joints.find(
    (value: IAutoMoviePose["joints"][number]): boolean =>
      value.bone === "rightUpperArm",
  )?.flexion;
  TestValidator.predicate(
    "partial reads never omit a necessary active overlay from the full cache",
    arm !== null &&
      arm !== undefined &&
      nclose(arm, 10, 1e-7) &&
      Math.hypot(
        overlayFoot.x - target.x,
        overlayFoot.y - target.y,
        overlayFoot.z - target.z,
      ) <= 0.001,
  );

  const cutTarget: IAutoMovieVector3 = {
    x: foot.x,
    y: foot.y + 0.09,
    z: foot.z + 0.02,
  };
  const sourceLaw: IAutoMovieMotionHumanActionLaw = {
    ...moving,
    name: "observedCutSource",
    interrupts: {
      any: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.2 }],
    },
  };
  const targetLaw: IAutoMovieMotionHumanActionLaw = {
    name: "observedCutTarget",
    interrupts: {},
    plan: (
      context: IAutoMovieMotionHumanActionContext,
    ): IAutoMovieMotionHumanActionPlan => ({
      duration: 1,
      events: [],
      contacts: [],
      posture: (): IAutoMovieMotionHumanPosture => ({
        root: { ...context.entry.posture.root },
        yaw: 0,
        pitch: 0,
        roll: 0,
        joints: { head: [-10, 0, 0] },
        limbs: {
          leftLeg: {
            point: { ...cutTarget },
            bend: { x: knee.x, y: knee.y, z: knee.z + 0.3 },
          },
        },
      }),
    }),
  };
  const cut: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "partial-observation-cut",
    performers: performance.performers.map(
      (
        performer: IAutoMovieMotionHumanPerformance["performers"][number],
      ): IAutoMovieMotionHumanPerformance["performers"][number] => ({
        ...performer,
      }),
    ),
    laws: [sourceLaw, targetLaw, observer],
    composition: {
      kind: "parallel",
      parts: [
        HumanChain.subject("A")
          .registered("observedCutSource")
          .until({ share: 0.4 })
          .registered("observedCutTarget").node,
        HumanChain.subject("B").registered("captureBoneReader").node,
      ],
    },
  });
  const fullCut: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "partial-observation-cut",
    performers: [{ ...performance.performers[0]!, body: { ...body } }],
    laws: [sourceLaw, targetLaw],
    composition: HumanChain.subject("A")
      .registered("observedCutSource")
      .until({ share: 0.4 })
      .registered("observedCutTarget").node,
  });
  TestValidator.predicate(
    "the declared cut keeps its exact authored boundary",
    nclose(cut.segments("A")[0]!.end, 0.4, 1e-12) &&
      nclose(cut.segments("A")[1]!.start, 0.4, 1e-12),
  );
  for (const seconds of [0.47, 0.731234]) {
    const whole: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      fullCut.bones("A", seconds);
    cut.posture("B", seconds);
    TestValidator.equals(
      "cut observations expose only the requested head",
      Array.from(observed.partial!.keys()),
      ["head"],
    );
    const raw: IAutoMovieMotionHumanPosture = cut.posture("A", seconds);
    const frames: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      cut.bones("A", seconds);
    const point: IAutoMovieVector3 = frames.get("leftFoot")!.worldPosition;
    const wanted: IAutoMovieVector3 = raw.limbs.leftLeg!.point;
    TestValidator.predicate(
      "selected observation preserves every actual full transition frame",
      frames.size === whole.size &&
        Array.from(whole).every(
          ([name, expected]: [
            AutoMovieHumanoidBone,
            IAutoMovieResolvedBone,
          ]): boolean => {
            const actual: IAutoMovieResolvedBone | undefined = frames.get(name);
            return (
              actual !== undefined &&
              vclose(actual.worldPosition, expected.worldPosition, 1e-9) &&
              qclose(actual.worldRotation, expected.worldRotation, 1e-9)
            );
          },
        ),
    );
    if (seconds > 0.6)
      TestValidator.predicate(
        "completed inertialization exposes the target law's literal current demand",
        vclose(wanted, cutTarget, 1e-12) &&
          nclose(raw.joints.head![0], -10, 1e-9) &&
          Math.hypot(
            point.x - cutTarget.x,
            point.y - cutTarget.y,
            point.z - cutTarget.z,
          ) <= 0.001,
      );
  }

  /** Invoke the cross-performer observation only from its owning public posture. */
  function partialAt(
    seconds: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    performance.posture("B", seconds);
    return observed.partial!;
  }

  /** Verify actual full displayed contact after either selected/full read order. */
  function complete(seconds: number): void {
    const pose: IAutoMoviePose = performance.pose("A", seconds);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones("A", seconds);
    const actual: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
    const resolved: IAutoMovieVector3 = poseBones(body, pose).get(
      "leftFoot",
    )!.worldPosition;
    TestValidator.predicate(
      "a complete read retains the actual free-leg task after selected observations",
      Math.hypot(
        actual.x - target.x,
        actual.y - target.y,
        actual.z - target.z,
      ) <= 0.001 &&
        Math.hypot(
          resolved.x - target.x,
          resolved.y - target.y,
          resolved.z - target.z,
        ) <= 0.001,
    );
  }
}

interface IObservation {
  reader?: IAutoMovieMotionHumanPerformerReader;
  partial?: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  demand: ReadonlySet<AutoMovieHumanoidBone>;
}
