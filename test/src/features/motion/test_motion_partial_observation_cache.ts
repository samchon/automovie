import { type IAutoMovieResolvedBone, resolvePose } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type IHumanActionContext,
  type IHumanActionLaw,
  type IHumanActionPlan,
  type IHumanBody,
  type IHumanPosture,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { nclose } from "../internal/nclose";

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
 *
 * @evidence contracts/development/common.md#meaningful-documentation States post-construction observation timing, selected versus complete pose ownership, canonical Human source, arbitrary seek order and unchanged metre contact bound across three scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Uses only actual registered laws, context.performer.bones requested sets and public HumanPerformance pose/bones. It observes requested membership, full displayed foot contact after partial-first reads, reversed query order and nested returned-transform isolation.
 * @evidence contracts/development/testing.md#independent-expectations The law explicitly asks a foot to rise0.06 metres and move forward0.04 from its initial world point. A complete fit must meet that actual goal within the existing0.001 metre bound, so returning an omitted-leg partial solve as full fails. Ownership comparisons supplement this geometric oracle and do not supply target expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers selected-head before full at an unsettled-cache instant after construction, full before selected-head at a second instant, repeated exact queries and returned partial-transform mutation. The earlier composer test owns dependency counters; physical overlay/cut acceptance remains in full motion specifications.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable numerical unit uses the canonical Human fixture and actual public extension laws. The captured performer reader is invoked only inside the observer's posture at that same film second, as its supported contract requires; no internal module, test-only export, replacement or host is used.
 */
export function test_motion_partial_observation_cache(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const neutral: IAutoMoviePose = resolveHumanPosture(body, {
    root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0, joints: {}, limbs: {},
  });
  const rest: IAutoMovieResolvedBone[] = resolvePose(neutral, body.skeleton);
  const foot: IAutoMovieVector3 = rest.find(
    (value: IAutoMovieResolvedBone): boolean => value.bone === "leftFoot",
  )!.worldPosition;
  const knee: IAutoMovieVector3 = rest.find(
    (value: IAutoMovieResolvedBone): boolean => value.bone === "leftLowerLeg",
  )!.worldPosition;
  const target: IAutoMovieVector3 = { x: foot.x, y: foot.y + 0.06, z: foot.z + 0.04 };
  const selected: ReadonlySet<AutoMovieHumanoidBone> = new Set(["head"]);
  const observed: {
    reader?: IHumanActionContext.IPerformer;
    partial?: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  } = {};
  const moving: IHumanActionLaw = {
    name: "observedFreeLeg", interrupts: {},
    plan: (context: IHumanActionContext): IHumanActionPlan => ({
      duration: 1, events: [], contacts: [],
      posture: (): IHumanPosture => ({
        root: { ...context.entry.posture.root }, yaw: 0, pitch: 0, roll: 0,
        joints: { head: [15, 0, 0] },
        limbs: { leftLeg: { point: { ...target },
          bend: { x: knee.x, y: knee.y, z: knee.z + 0.3 } } },
      }),
    }),
  };
  const observer: IHumanActionLaw = {
    name: "captureBoneReader", interrupts: {},
    plan: (context: IHumanActionContext): IHumanActionPlan => {
      const reader: IHumanActionContext.IPerformer = context.performer("A");
      observed.reader = reader;
      return { duration: 1, events: [], contacts: [],
        posture: (seconds: number): IHumanPosture => {
          observed.partial = reader.bones(context.start + seconds, selected);
          return context.entry.posture;
        } };
    },
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "partial-observation-cache",
    performers: [
      { subject: "A", body: { ...body }, at: { x: 0, y: 0, z: 0 }, yaw: 0,
        proficiency: { level: "trained" } },
      { subject: "B", body: { ...body }, at: { x: 3, y: 0, z: 0 }, yaw: 0,
        proficiency: { level: "trained" } },
    ],
    laws: [moving, observer],
    composition: { kind: "parallel", parts: [
      HumanChain.subject("A").registered("observedFreeLeg").node,
      HumanChain.subject("B").registered("captureBoneReader").node,
    ] },
  });
  TestValidator.predicate("observer captures the supported performer reader", observed.reader !== undefined);
  const firstTime: number = 0.731234;
  const partial: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = partialAt(firstTime);
  TestValidator.equals("requested observation returns only its named bone", Array.from(partial.keys()), ["head"]);
  const originalX: number = partial.get("head")!.worldPosition.x;
  partial.get("head")!.worldPosition.x = 123;
  complete(firstTime);
  const replay: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = partialAt(firstTime);
  TestValidator.predicate("partial output mutation cannot alter another observation",
    replay !== partial && replay.get("head") !== partial.get("head") &&
    replay.get("head")!.worldPosition !== partial.get("head")!.worldPosition &&
    nclose(replay.get("head")!.worldPosition.x, originalX, 1e-12),
  );
  complete(firstTime);
  const secondTime: number = 0.423456;
  complete(secondTime);
  partialAt(secondTime);
  complete(secondTime);

  /** Invoke the cross-performer observation only from its owning public posture. */
  function partialAt(seconds: number): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    performance.posture("B", seconds);
    return observed.partial!;
  }

  /** Verify actual full displayed contact after either selected/full read order. */
  function complete(seconds: number): void {
    const pose: IAutoMoviePose = performance.pose("A", seconds);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = performance.bones("A", seconds);
    const actual: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
    const resolved: IAutoMovieVector3 = resolvePose(pose, body.skeleton).find(
      (value: IAutoMovieResolvedBone): boolean => value.bone === "leftFoot",
    )!.worldPosition;
    TestValidator.predicate("a complete read retains the actual free-leg task after selected observations",
      Math.hypot(actual.x - target.x, actual.y - target.y, actual.z - target.z) <= 0.001 &&
      Math.hypot(resolved.x - target.x, resolved.y - target.y, resolved.z - target.z) <= 0.001,
    );
  }
}
