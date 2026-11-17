import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanProp } from "../perform/IHumanProp";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";

/**
 * Where a wearable sits once worn: its `wear` socket on the body region it
 * goes onto, the socket's `+Y` toward the body (into the region, against the
 * region's outward normal), and the thing turned so its front faces the way
 * the body faces (`createWearable`'s contacts: a hat's crown inside on the
 * head's crown, a pair of spectacles' bridge on the nose's bridge).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is placed where and how it is turned.
 * @evidence contracts/development/design.md#principled-representation The wearable's frame in the world, from its own socket and the body's own region.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Cold frames, fixed-entry frame/site readers and changing-posture preparation serve dress and grasp-use searches through one wear-socket/region/alignment owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The socket is the wearable's own contact and the place the body's own region; no offset is typed.
 */
export namespace HumanWorn {
  /**
   * The frame a wearable takes on a posture's region.
   *
   * @param body The body.
   * @param posture The posture the region is read on.
   * @param prop The wearable.
   * @param region The region it goes onto.
   * @param turn A turn about the region's normal from facing the body's way, degrees; 0 when absent.
   * @returns The wearable's world frame.
   * @throws {HumanRefusal} When the wearable declares no `wear` socket.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The socket's `+Y` turned onto the region's inward normal exactly and the wearable's front (its `+Z`, or its `+Y` where the socket runs along `Z`) onto the body's forward (or up) as nearly as that allows (`HumanHand.align`); the origin follows so the socket lies on the region's point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup, one alignment, one translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A wearable without its socket is refused with its contacts.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed socket/region preparation and one actual requested turn; repeated-turn callers explicitly use prepare so they pay its region FK only once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to the same prepared geometry/turn owner as grasp search; this cold facade retains no preparation across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function frame(
    body: IHumanBody,
    posture: IHumanPosture,
    prop: IHumanProp,
    region: AutoMovieHumanoidRegion,
    turn: number = 0,
  ): IHumanProp.IFrame {
    return prepare(body, posture, prop, region)(turn);
  }

  /**
   * Prepare a wearable's fixed socket and region before trying its turns.
   *
   * @param body The unchanged body.
   * @param posture The unchanged posture whose region receives the wearable.
   * @param prop The wearable with its declared wear socket.
   * @param region The body region receiving that socket.
   * @returns A world-frame builder accepting turns in degrees about the region normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fixed geometry, the turn's unit and axis and the operation-owned builder.
   * @evidence contracts/development/implementation.md#principled-implementation The original wear-socket alignment and region placement are independent of turn; each call composes the requested turn with that same alignment and translates the actual socket onto the region.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admission and fixed alignment precede the turn-specific rigid transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing sockets retain the original refusal and each turn retains its original quaternion normalization and translation.
   * @evidence contracts/development/implementation.md#efficient-algorithms One socket search and region FK serve all T turns, followed by O(1) work per actual turn; no fitted arm result is stored.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the fixed body, posture, prop and region share their geometry; differing turns still compute their own frame.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous grasp search owns a constant-size alignment, region frame and socket offset; releasing its builder releases them without a global cache.
   */
  export function prepare(
    body: IHumanBody,
    posture: IHumanPosture,
    prop: IHumanProp,
    region: AutoMovieHumanoidRegion,
  ): (turn: number) => IHumanProp.IFrame {
    return prepareSite(body, posture, prop, region).frame;
  }

  /**
   * Prepare the actual receiving region and its turned wearable frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes unchanged body/posture/prop/region for a synchronous turn search; frame reads actual degree turns and point returns an independent world-metre receiving site.
   * @evidence contracts/development/implementation.md#principled-implementation The same original socket lookup, actual body-region observation and wear alignment own both the original transformed frame and the receiving point used to judge it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fixed geometry owner returns a turn builder plus a copied-site reader; prepare/frame remain facades of this original alignment/placement body.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The site is the original actual region observation, never a point reconstructed from an achieved wearable pose. Every requested turn retains original normalization/translation and all missing-socket refusals.
   * @evidence contracts/development/implementation.md#efficient-algorithms One socket search, region FK and alignment serve all T turns and site judgements; each frame and requested site copy costs constant work, without repeating region FK per score. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed immutable body/posture/prop/region prove the shared receiving geometry; every turn remains actual and copied sites prevent output mutation from changing later frames.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous owner releases constant-size region/alignment/socket data with its builder; frame/site outputs are fresh numeric records without a body reader, query history or external handle.
   */
  export function prepareSite(body: IHumanBody, posture: IHumanPosture,
    prop: IHumanProp, region: AutoMovieHumanoidRegion): {
    frame: (turn: number) => IHumanProp.IFrame;
    point: () => IAutoMovieVector3;
  } {
    const wear: IAutoMovieAffordance = socketOf(prop);
    const at: ReturnType<typeof HumanTrunk.region> = HumanTrunk.region(
      body,
      posture,
      region,
    );
    const aligned: IAutoMovieQuaternion = alignment(wear)(at, posture.yaw);
    const frame: (turn: number) => IHumanProp.IFrame = (turn: number): IHumanProp.IFrame => {
      return placed(at, aligned, wear, turn);
    };
    return { frame, point: (): IAutoMovieVector3 => ({ ...at.point }) };
  }

  /**
   * Prepare fixed wearable geometry while its actual receiving posture moves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Fixes unchanged body/prop/region metadata; each call takes current authored posture, degree turn and optional same-person FK source and returns a fresh world frame.
   * @evidence contracts/development/implementation.md#principled-implementation The original wear socket and rest basis are posture-independent. A genuine fixed-region reader evaluates every actual current receiving surface, and the same alignment/placed owners preserve world-facing orientation and exact socket translation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Lazy socket admission precedes current region FK and lazy fixed-rest alignment; each query delegates original world alignment and turn placement without retaining its region observation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves socket-first refusal, current raw-region policy, along-Z threshold, world-first alignment admission, original quaternion normalization/grouping and every actual turn/target point; no body frame or fitted answer is reused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Across Q frames, socket lookup, rest basis and region-name binding occur once; every actual authored admission, current ancestor FK, world alignment and socket placement remains. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only immutable body/prop/region geometry proves fixed metadata equivalence; current posture, yaw, turn and optional FK loan stay query inputs, and changed fixed geometry requires another producer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan owns one fixed socket/rest basis and static region reader until release. Current region data and optional operation source release per call; fresh numeric frames retain no reader, query time, pose history or external handle.
   */
  export function prepareMoving(body: IHumanBody, prop: IHumanProp,
    region: AutoMovieHumanoidRegion): (posture: IHumanPosture, turn: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0]) => IHumanProp.IFrame {
    let wear: IAutoMovieAffordance | undefined;
    let read: ReturnType<typeof HumanTrunk.prepareRegion> | undefined;
    let align: ReturnType<typeof alignment> | undefined;
    return (posture: IHumanPosture, turn: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0]): IHumanProp.IFrame => {
      wear ??= socketOf(prop);
      read ??= HumanTrunk.prepareRegion(body, region);
      const at: ReturnType<typeof HumanTrunk.region> = read(posture, resolution);
      align ??= alignment(wear);
      return placed(at, align(at, posture.yaw), wear, turn);
    };
  }
}

/** Original socket admission shared by cold, fixed-entry and changing-posture readers. */
function socketOf(prop: IHumanProp): IAutoMovieAffordance {
  const affordances: readonly IAutoMovieAffordance[] = prop.affordances ?? [];
  const wear: IAutoMovieAffordance | undefined = affordances.find(
    (a: IAutoMovieAffordance): boolean => a.id === "wear");
  if (wear === undefined)
    throw new HumanRefusal({ kind: "affordance", axis: "prop", value: prop.subject,
      feasible: { kind: "alternatives", values: affordances.map((a: IAutoMovieAffordance): string => a.id) },
      reason: `${prop.subject} declares no wear socket to put on by`,
      fix: "dress in a wearable that declares where it is worn, as createWearable does" });
  return wear;
}

/** The original fixed wear basis aligned against each actual receiving region/yaw. */
function alignment(wear: IAutoMovieAffordance):
  (at: ReturnType<typeof HumanTrunk.region>, yaw: number) => IAutoMovieQuaternion {
  const into: IAutoMovieVector3 = Quaternion.rotateVector(wear.frame.rotation, { x: 0, y: 1, z: 0 });
  const along: boolean = Math.abs(into.z) > 0.9;
  const align: ReturnType<typeof HumanHand.prepareAlignment> = HumanHand.prepareAlignment({
    normal: into, forward: along ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: 1 },
  });
  return (at: ReturnType<typeof HumanTrunk.region>, yaw: number): IAutoMovieQuaternion => align({
    normal: Vector3.scale(at.normal, -1),
    forward: along ? { x: 0, y: 1, z: 0 }
      : HumanFrame.point({ origin: { x: 0, y: 0, z: 0 }, yaw }, { x: 0, y: 0, z: 1 }),
  });
}

/** Original requested turn and socket translation, with no added normalization or grouping. */
function placed(at: ReturnType<typeof HumanTrunk.region>, aligned: IAutoMovieQuaternion,
  wear: IAutoMovieAffordance, turn: number): IHumanProp.IFrame {
  const rotation: IAutoMovieQuaternion = Quaternion.normalize(
    Quaternion.multiply(Quaternion.fromAxisAngle(at.normal, turn), aligned));
  return { position: Vector3.subtract(at.point, Quaternion.rotateVector(rotation, wear.frame.translation)), rotation };
}
