import { Quaternion, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
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

import { HumanBase } from "../../law/internal/HumanBase";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { humanRig } from "../../posture/internal/humanRig";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanSegmentPose } from "./HumanSegmentPose";
import { prepareHumanSegmentPose } from "./prepareHumanSegmentPose";

/*
 * The state a person enters an action from: the displayed pose and its rates at
 * the entry second, the feet, the supports, the base and the holds, read from
 * the action being left (`HumanSegmentPose`). The next action's posture keeps
 * native breathing separate from the displayed state.
 */
export namespace HumanSegmentEntry {
  /*
   * The state a person enters an action from at a second.
   * Parameter person: The person.
   * Parameter previous: Their previous action, if any.
   * Parameter seconds: The entry second.
   * Parameter blend: The inertialization the cut into the action decays over,
   * seconds; absent for an action entered over another.
   * Returns: The displayed state and the posture the next action carries.
   */
  export function entry(
    person: IAutoMovieMotionHumanSegment.IPerson,
    previous: IAutoMovieMotionHumanSegment | undefined,
    seconds: number,
    blend?: number,
  ): IAutoMovieMotionHumanEntryState {
    const body: IAutoMovieMotionHumanBody = person.performer.body;
    const prepared: prepareHumanSegmentPose.IPrepared =
      prepareHumanSegmentPose(body);

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
    // A continuing action takes the underlying posture. Native breath is
    // evaluated at the display second, including at the cut sampled above.
    const posture: IAutoMovieMotionHumanPosture =
      previous === undefined
        ? person.initial
        : HumanSegmentPose.entryPosture(
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
      HumanBoneGroups.FEET,
    );
    const planted: (part: EntryPlantedPart) => boolean = (
      part: EntryPlantedPart2,
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
    const frames = (pose: IAutoMoviePose): ReturnType<typeof poseBones> =>
      pose === state.pose
        ? bones
        : poseBones(body, pose, prepared.resolution(), HumanBoneGroups.FEET);
    const instant: ReturnType<typeof poseBones> = frames(read.samples[0]);
    const near: ReturnType<typeof poseBones> = frames(read.samples[1]);
    const far: ReturnType<typeof poseBones> = frames(read.samples[2]);
    const foot: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanEntryState.IFoot = (
      side: AutoMovieHumanSide,
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
        AutoMovieEngineMotionSampling.samplePoseVelocityRotationVector(
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
    const bearing: IAutoMovieMotionHumanEntryState.ISupport[] = supports(
      previous,
      seconds,
    );
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
          .map(
            (
              h: IAutoMovieMotionHumanSegment.IHeld,
            ): [AutoMovieHumanSide, string] => [h.side, h.prop],
          ),
      ),
      uses: Object.fromEntries(
        person.holds.flatMap(
          (h: IAutoMovieMotionHumanSegment.IHeld): EntryResult =>
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

  /*
   * What the body rests on as an action is left at a second: the supports its
   * plan declares open there, preserving each one's frame, region, socket and
   * load. Grips and strikes are excluded. Before any action, both feet bear on
   * the ground.
   * Parameter previous: The action left, if any.
   * Parameter seconds: The film second.
   * Returns: The supports.
   */
  export function supports(
    previous: ISupportsPrevious | undefined,
    seconds: number,
  ): IAutoMovieMotionHumanEntryState.ISupport[] {
    if (previous === undefined)
      return (["leftFoot", "rightFoot"] as const).map(
        (part: SupportsPart): IAutoMovieMotionHumanEntryState.ISupport => ({
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
        (
          c: IAutoMovieMotionHumanContactWindow,
        ): IAutoMovieMotionHumanEntryState.ISupport => ({
          part: c.part,
          kind: c.kind,
          support: c.support,
          ...(c.region === undefined ? {} : { region: c.region }),
          ...(c.socket === undefined ? {} : { socket: c.socket }),
          ...(c.material === undefined ? {} : { material: c.material }),
          ...(c.load === undefined ? {} : { load: c.load }),
        }),
      );
  }

  /*
   * What `supports` reads of the action left: its start and its plan's
   * contacts.
   */
  export type ISupportsPrevious = Pick<
    IAutoMovieMotionHumanSegment,
    "start"
  > & {
    /*
     * The plan's duration and contact windows.
     */
    plan: Pick<IAutoMovieMotionHumanSegment["plan"], "duration" | "contacts">;
  };

  /*
   * The state a body leaves at a second read from its poses as shown, each
   * sample read once: the reading of a body with no previous action, which
   * stands in its initial posture, or of one entered over its action.
   * Parameter person: The person.
   * Parameter previous: Their previous action, if any.
   * Parameter seconds: The second.
   * Parameter step: The difference interval, seconds.
   * Returns: The state and the samples it was read from.
   */
  function shown(
    person: IAutoMovieMotionHumanSegment.IPerson,
    previous: IAutoMovieMotionHumanSegment | undefined,
    seconds: number,
    step: number,
    prepared: prepareHumanSegmentPose.IPrepared,
  ): HumanSegmentPose.IContinued {
    const rig: ReturnType<typeof humanRig> = humanRig(person.performer.body);
    if (previous === undefined) {
      const pose: IAutoMoviePose = HumanSegmentPose.initial(
        person,
        undefined,
        prepared,
      );
      return {
        state: AutoMovieEngineMotionSampling.samplePoseVelocity(
          (): IAutoMoviePose => pose,
          seconds,
          step,
          "before",
          rig,
        ),
        samples: [pose, pose, pose],
      };
    }
    const poses: Map<number, IAutoMoviePose> = new Map();
    const read: (t: number) => IAutoMoviePose = (t: number): IAutoMoviePose => {
      let pose: IAutoMoviePose | undefined = poses.get(t);
      if (pose === undefined) {
        pose = HumanSegmentPose(person, previous, t, prepared);
        poses.set(t, pose);
      }
      return pose;
    };
    const state: IAutoMoviePoseState = AutoMovieEngineMotionSampling.samplePoseVelocity(
      read,
      seconds,
      step,
      "before",
      rig,
    );
    return {
      state,
      samples: [read(seconds), read(seconds - step), read(seconds - 2 * step)],
    };
  }

  /*
   * The state a body leaves an action in at a second, its rates read on the
   * action's fits continued from the second's own
   * (`HumanSegmentPose.continued`) to the tolerance an inertialization over
   * `blend` asks.
   * Parameter person: The person.
   * Parameter previous: The action left.
   * Parameter seconds: The second.
   * Parameter blend: The inertialization the state feeds, seconds.
   * Returns: The state and the continued samples it was read from.
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

/*
 * The alternatives of `SupportsPart`'s site.
 */
type SupportsPart = "leftFoot" | "rightFoot";

/*
 * The alternatives of `EntryResult`'s site.
 */
type EntryResult =
  | [[AutoMovieHumanSide, IAutoMovieMotionHumanGraspUse.IUse]]
  | [];

/*
 * The alternatives of `EntryPlantedPart2`'s site.
 */
type EntryPlantedPart2 = "leftFoot" | "rightFoot";

/*
 * The alternatives of `EntryPlantedPart`'s site.
 */
type EntryPlantedPart = "leftFoot" | "rightFoot";
