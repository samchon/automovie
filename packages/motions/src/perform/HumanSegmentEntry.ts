import { Quaternion, samplePoseVelocity } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanGraspUse,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMoviePoseState,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBase } from "../law/HumanBase";
import { humanRig } from "../posture/humanRig";
import { poseBones } from "../posture/poseBones";
import { HumanSegmentPose } from "./HumanSegmentPose";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/**
 * The state a person enters an action from: the displayed pose and its
 * rates at the entry second, the feet, the supports, the base and the holds,
 * read from the action being left (`HumanSegmentPose`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the file owns and what it reads from its siblings.
 * @evidence contracts/development/design.md#principled-representation One responsibility of a placed action's evaluation, over the records `HumanSegment` declares.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One entry constructor and one support reader use HumanSegment's existing records; the two rate-reading policies remain private.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the sibling owners; nothing is duplicated between them.
 */
export namespace HumanSegmentEntry {
  /**
   * The state a person enters an action from at a second.
   *
   * @param person The person.
   * @param previous Their previous action, if any.
   * @param seconds The entry second.
   * @param blend The inertialization the cut into the action decays over, seconds; absent for an action entered over another.
   * @returns The entry state.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines film-second entry, optional decay duration, displayed pose/rates and the feet/support/base/hold state returned to the next action.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the existing complete shown or cold-plus-continued one-sided pose/rate samples at STEP seconds. World foot velocity, acceleration and spin consume only the two foot frames and retain their original difference formulas; four demanded FK reads share exact scalar prerequisites under the same unchanged skeleton topology.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One same-body evaluation preparation reaches every actual source pose, raw posture, layer and four foot FK reads; then derive the two feet and one support list read by both the entry and its base classification.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the cold pose distinct from a continued instant, every source-pose evaluation, all four FK admissions and their fresh outputs. No rate sample, contact comparison, difference interval, normalization or fitted pose is replaced by a cached answer.
   * @evidence contracts/development/implementation.md#efficient-algorithms Existing complete pose/rate evaluations retain every solve/sample; four FK calls admit J authored joints and compute only foot ancestors/output. Repeated source poses share rig clamp metadata and exact FK prerequisites. Direct reads of the fixed three-sample tuple avoid temporary map/vector arrays. One O(C) support scan serves entry/base; hold scans retain their policy and speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The source pose and four FK inputs may differ in time and cold/near history; only rig metadata and exactly equal scalar dependencies share the explicit preparation. Shown's existing exact-time pose reads and continued's separate cold/refined instant remain unchanged. Base classification borrows the same current support list without mutating or retaining it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One entry-owned preparation holds rig metadata and last successful joint/world scalar snapshots per visited bone name, O(K) for K identities, until return or throw. The four fresh demanded maps are local; returned foot vectors/quaternions retain their original value ownership, while complete pose/posture/from-plan/support references remain as before. No reader or supplier enters the returned entry or a retained plan.
   */
  export function entry(
    person: IAutoMovieMotionHumanSegment.IPerson,
    previous: IAutoMovieMotionHumanSegment | undefined,
    seconds: number,
    blend?: number,
  ): IAutoMovieMotionHumanEntryState {
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    const prepared: prepareHumanSegmentPose.IPrepared = prepareHumanSegmentPose(body);

    // The difference interval of every rate read here, seconds.
    const step: number = HumanSegmentPose.STEP;

    // What was displayed up to the entry: the motion it leaves ends here.
    // Its rates are read on the leaving action's fits continued from the
    // entry's (`HumanSegmentPose.continued`), to the tolerance the cut's
    // inertialization asks, the reading the cut's offset takes too; a body
    // with no previous action, or one entered over it, reads its samples as
    // shown.
    const read: HumanSegmentPose.IContinued =
      previous !== undefined && blend !== undefined
        ? left(person, previous, seconds, blend, prepared)
        : shown(person, previous, seconds, step, prepared);
    const state: IAutoMoviePoseState = read.state;
    const posture: IAutoMovieMotionHumanPosture =
      previous === undefined
        ? person.initial
        : HumanSegmentPose.layered(
            person,
            previous.plan.posture(
              Math.min(
                previous.plan.duration,
                Math.max(0, seconds - previous.start),
              ),
              undefined,
              prepared.resolution,
              prepared.clamp,
            ),
            seconds,
            prepared.resolution,
            prepared.clamp,
          );
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      state.pose,
      prepared.resolution(),
      FEET,
    );
    const planted: (part: "leftFoot" | "rightFoot") => boolean = (
      part: "leftFoot" | "rightFoot",
    ): boolean => {
      if (previous === undefined) return true;
      const u: number = Math.min(
        1,
        Math.max(0, (seconds - previous.start) / previous.plan.duration),
      );
      return previous.plan.contacts.some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.part === part &&
          (c.kind === "plant" || c.kind === "pivot") &&
          u >= c.from - 1e-9 &&
          u <= c.to + 1e-9,
      );
    };

    // The same three samples the pose velocity was read from, so a foot's
    // rate is the one-sided difference of the motion that ends here.
    const instant: ReturnType<typeof poseBones> = poseBones(
      body,
      read.samples[0],
      prepared.resolution(),
      FEET,
    );
    const near: ReturnType<typeof poseBones> = poseBones(
      body,
      read.samples[1],
      prepared.resolution(),
      FEET,
    );
    const far: ReturnType<typeof poseBones> = poseBones(
      body,
      read.samples[2],
      prepared.resolution(),
      FEET,
    );
    const foot: (side: "left" | "right") => IAutoMovieMotionHumanEntryState.IFoot = (
      side: "left" | "right",
    ): IAutoMovieMotionHumanEntryState.IFoot => {
      const here: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const from: IAutoMovieResolvedBone = instant.get(`${side}Foot`)!;
      const a: IAutoMovieResolvedBone = near.get(`${side}Foot`)!;
      const b: IAutoMovieResolvedBone = far.get(`${side}Foot`)!;
      const rate: (x: number, y: number, z: number) => number = (
        x: number,
        y: number,
        z: number,
      ): number => (3 * x - 4 * y + z) / (2 * step);
      const bend: (x: number, y: number, z: number) => number = (
        x: number,
        y: number,
        z: number,
      ): number => (x - 2 * y + z) / (step * step);
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(
        from.worldRotation,
      );
      const turn: (bone: IAutoMovieResolvedBone) => IAutoMovieVector3 = (
        bone: IAutoMovieResolvedBone,
      ): IAutoMovieVector3 =>
        samplePoseVelocity.rotationVector(
          Quaternion.multiply(bone.worldRotation, inverse),
        );
      const ar: IAutoMovieVector3 = turn(a);
      const br: IAutoMovieVector3 = turn(b);
      return {
        ankle: here.worldPosition,
        rotation: here.worldRotation,
        planted: planted(`${side}Foot`),
        velocity: {
          x: rate(from.worldPosition.x, a.worldPosition.x, b.worldPosition.x),
          y: rate(from.worldPosition.y, a.worldPosition.y, b.worldPosition.y),
          z: rate(from.worldPosition.z, a.worldPosition.z, b.worldPosition.z),
        },
        acceleration: {
          x: bend(from.worldPosition.x, a.worldPosition.x, b.worldPosition.x),
          y: bend(from.worldPosition.y, a.worldPosition.y, b.worldPosition.y),
          z: bend(from.worldPosition.z, a.worldPosition.z, b.worldPosition.z),
        },
        spin: {
          x: rate(0, ar.x, br.x),
          y: rate(0, ar.y, br.y),
          z: rate(0, ar.z, br.z),
        },
      };
    };

    // The root's acceleration by the one-sided second difference of the same
    // three samples; a body with no previous action stands at rest.
    const p0: IAutoMovieVector3 = read.samples[0].root?.translation ?? {
      x: 0,
      y: 0,
      z: 0,
    };
    const p1: IAutoMovieVector3 = read.samples[1].root?.translation ?? {
      x: 0,
      y: 0,
      z: 0,
    };
    const p2: IAutoMovieVector3 = read.samples[2].root?.translation ?? {
      x: 0,
      y: 0,
      z: 0,
    };
    const second: (x: number, y: number, z: number) => number = (
      x: number,
      y: number,
      z: number,
    ): number => (x - 2 * y + z) / (step * step);
    const acceleration: IAutoMovieVector3 =
      previous === undefined
        ? { x: 0, y: 0, z: 0 }
        : {
            x: second(p0.x, p1.x, p2.x),
            y: second(p0.y, p1.y, p2.y),
            z: second(p0.z, p1.z, p2.z),
          };
    const feet: IAutoMovieMotionHumanEntryState["feet"] = {
      left: foot("left"),
      right: foot("right"),
    };
    const bearing: IAutoMovieMotionHumanEntryState.ISupport[] = supports(previous, seconds);
    return {
      seconds,
      pose: state.pose,
      velocity: state.velocity,
      acceleration,
      posture,
      feet,
      supports: bearing,
      base:
        previous === undefined
          ? { kind: "standing" }
          : HumanBase.after({
              declared: previous.plan.base,
              entered: previous.context.entry.base,
              supports: bearing,
              share: (seconds - previous.start) / previous.plan.duration,
            }),
      holds: Object.fromEntries(
        person.holds
          .filter(
            (h: IAutoMovieMotionHumanSegment.IHeld): boolean =>
              h.from <= seconds && seconds < h.until,
          )
          .map((h: IAutoMovieMotionHumanSegment.IHeld): ["left" | "right", string] => [
            h.side,
            h.prop,
          ]),
      ),
      uses: Object.fromEntries(
        person.holds.flatMap(
          (h: IAutoMovieMotionHumanSegment.IHeld): [["left" | "right", IAutoMovieMotionHumanGraspUse.IUse]] | [] =>
            h.from <= seconds && seconds < h.until && h.use !== undefined
              ? [[h.side, h.use]]
              : [],
        ),
      ),
      ...(previous === undefined
        ? {}
        : {
            from: {
              name: previous.name,
              family: previous.law.family ?? previous.name,
              params: previous.params,
              plan: previous.plan,
              start: previous.start,
              share: Math.min(
                1,
                Math.max(
                  0,
                  (seconds - previous.start) / previous.plan.duration,
                ),
              ),
            },
          }),
    };
  }

  /**
   * What the body rests on as an action is left at a second: the supports
   * its plan declares open there, a grip and a strike aside; both feet on
   * the ground before any action.
   *
   * @param previous The action left, if any.
   * @param seconds The film second.
   * @returns The supports.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States initial ground plants and current non-grip/non-strike supports at film seconds.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the previous plan's actual contact windows at its clamped share, retaining the existing 1e-9 comparison allowance and declared contact/support representations.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Return two initial ground plants or one ordered contact filter and projection.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps duplicates and order, excludes only grip/strike kinds and does not alter window endpoints or invent a support for an existing action.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans C contact windows in O(C) time and returns O(A) wrappers for A active supports; the initial case has two entries.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call reads current windows and creates its own result; no support snapshot is cached across changing placement or queries.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no state. The returned array/wrappers are fresh; existing contact support payloads stay borrowed, while initial ground payloads are new.
   */
  export function supports(
    previous: IAutoMovieMotionHumanSegment | undefined,
    seconds: number,
  ): IAutoMovieMotionHumanEntryState.ISupport[] {
    if (previous === undefined)
      return (["leftFoot", "rightFoot"] as const).map(
        (part: "leftFoot" | "rightFoot"): IAutoMovieMotionHumanEntryState.ISupport => ({
          part,
          kind: "plant",
          support: { kind: "ground" },
        }),
      );
    const u: number = Math.min(
      1,
      Math.max(0, (seconds - previous.start) / previous.plan.duration),
    );
    return previous.plan.contacts
      .filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.kind !== "grip" &&
          c.kind !== "strike" &&
          u >= c.from - 1e-9 &&
          u <= c.to + 1e-9,
      )
      .map(
        (c: IAutoMovieMotionHumanContactWindow): IAutoMovieMotionHumanEntryState.ISupport => ({
          part: c.part,
          kind: c.kind,
          support: c.support,
        }),
      );
  }

  /**
   * The state a body leaves at a second read from its poses as shown, each
   * sample read once: the reading of a body with no previous action, which
   * stands in its initial posture, or of one entered over its action.
   *
   * @param person The person.
   * @param previous Their previous action, if any.
   * @param seconds The second.
   * @param step The difference interval, seconds.
   * @returns The state and the samples it was read from.
   */
  function shown(
    person: IAutoMovieMotionHumanSegment.IPerson,
    previous: IAutoMovieMotionHumanSegment | undefined,
    seconds: number,
    step: number,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): HumanSegmentPose.IContinued {
    const poses: Map<number, IAutoMoviePose> = new Map();
    const read: (t: number) => IAutoMoviePose = (t: number): IAutoMoviePose => {
      let pose: IAutoMoviePose | undefined = poses.get(t);
      if (pose === undefined) {
        pose =
          previous === undefined
            ? HumanSegmentPose.initial(person, undefined, prepared)
            : HumanSegmentPose.of(person, previous, t, prepared);
        poses.set(t, pose);
      }
      return pose;
    };
    const state: IAutoMoviePoseState = samplePoseVelocity(
      read,
      seconds,
      step,
      "before",
      humanRig(person.performer.body),
    );
    return {
      state,
      samples: [read(seconds), read(seconds - step), read(seconds - 2 * step)],
    };
  }

  /**
   * The state a body leaves an action in at a second, its rates read on the
   * action's fits continued from the second's own (`HumanSegmentPose.continued`)
   * to the tolerance an inertialization over `blend` asks.
   *
   * @param person The person.
   * @param previous The action left.
   * @param seconds The second.
   * @param blend The inertialization the state feeds, seconds.
   * @returns The state and the continued samples it was read from.
   */
  function left(
    person: IAutoMovieMotionHumanSegment.IPerson,
    previous: IAutoMovieMotionHumanSegment,
    seconds: number,
    blend: number,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): HumanSegmentPose.IContinued {
    return HumanSegmentPose.continued(
      (t: number, near?: HumanSegmentPose.INear): HumanSegmentPose.ISeeded =>
        HumanSegmentPose.seeded(person, previous, t, near, prepared),
      seconds,
      "before",
      humanRig(person.performer.body),
      blend,
    );
  }
}

/** Entry foot rates consume no world frames outside these two end bones. */
const FEET: ReadonlySet<AutoMovieHumanoidBone> = new Set(["leftFoot", "rightFoot"]);
