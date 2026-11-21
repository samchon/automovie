import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanUnseat,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { KnockdownFloor } from "../reaction/KnockdownFloor";
import { HumanMountedFrame } from "./HumanMountedFrame";
import { HumanUnseatFlight } from "./HumanUnseatFlight";

/**
 * The shapes of a rider leaving a saddle (`HumanUnseat`): the slump over the neck, the flight's blend from the carried seat into the lie or the stand, a hand reaching the floor or the mane, the flank clearance a sideways fall must keep, and the drag behind a stirrup. Every angle and time is a provisional stage reading.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each shape and that the values are provisional.
 * @evidence contracts/development/design.md#principled-representation Postures blended by shares, and one drag plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The shapes `HumanUnseat` reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The lie is the caller's fitted knockdown lie; the stirrup is the carrier's own contact.
 */
export namespace HumanUnseatPose {
  /** Seconds a rider takes to slump over the neck (provisional). */
  export const SLUMP: number = 0.8;

  /** Seconds before the landing the falling side's hand meets the floor (provisional). */
  export const TOUCH: number = 0.08;

  /** Seconds the dragged body takes from the saddle to its lie behind the stirrup (provisional). */
  export const DRAW: number = 0.4;

  /** A standing shape: upright with the joints at rest. */
  export const STAND: KnockdownFloor.IFold = { pitch: 0, joints: {} };

  /** The slump's trunk and neck flexion, degrees (provisional). */
  const FLEX: Readonly<Record<"spine" | "chest" | "neck", number>> = {
    spine: 35,
    chest: 25,
    neck: 30,
  };

  /**
   * The seated posture slumped over the neck by a share.
   *
   * @param posture The carried seat.
   * @param share 0 upright to 1 slumped.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the slump.
   * @evidence contracts/development/implementation.md#principled-implementation The spine, chest and neck flex forward by `FLEX` times the share.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture.
   */
  export function slumped(
    posture: IAutoMovieMotionHumanPosture,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0) return posture;
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      ...posture.joints,
    };
    for (const [bone, flex] of Object.entries(FLEX) as [
      keyof typeof FLEX,
      number,
    ][]) {
      const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      joints[bone] = [was[0] + flex * share, was[1], was[2]];
    }
    return { ...posture, joints };
  }

  /**
   * The flying posture: the carried seat blended into a lie or a stand by a share, turned to its facing and placed at the root.
   *
   * @param from The posture at the release.
   * @param to The lie or stand.
   * @param facing The final heading, degrees.
   * @param root The root now.
   * @param share 0 at the release to 1 at the landing.
   * @returns The posture, with no limb goals: the saddle's holds are let go.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the blend and the dropped holds.
   * @evidence contracts/development/implementation.md#principled-implementation Joint angles and the pitch interpolated, the heading by its shortest turn, the roll back to level.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One pass over the joints.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the joints.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture.
   */
  export function flying(
    from: IAutoMovieMotionHumanPosture,
    to: KnockdownFloor.IFold,
    facing: number,
    root: IAutoMovieVector3,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    const bones: Set<string> = new Set([
      ...Object.keys(from.joints),
      ...Object.keys(to.joints),
    ]);
    for (const bone of bones as Set<
      keyof IAutoMovieMotionHumanPosture["joints"]
    >) {
      const a: readonly [number, number, number] = from.joints[bone] ?? [
        0, 0, 0,
      ];
      const b: readonly [number, number, number] = (
        to.joints as IAutoMovieMotionHumanPosture["joints"]
      )[bone] ?? [0, 0, 0];
      joints[bone] = [
        a[0] + (b[0] - a[0]) * share,
        a[1] + (b[1] - a[1]) * share,
        a[2] + (b[2] - a[2]) * share,
      ];
    }
    const turn: number =
      ((((facing - from.yaw + 180) % 360) + 360) % 360) - 180;
    return {
      ...from,
      root,
      yaw: from.yaw + turn * share,
      pitch: from.pitch + (to.pitch - from.pitch) * share,
      roll: from.roll * (1 - share),
      joints,
      limbs: {},
    };
  }

  /**
   * A hand reaching for a point by a share: its arm goal moves from where the hand hangs to the point.
   *
   * @param posture The posture.
   * @param side The hand.
   * @param point The point, world metres.
   * @param share 0 hanging to 1 at the point.
   * @returns The posture with the arm's goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the reach.
   * @evidence contracts/development/implementation.md#principled-implementation The hand's rest offset from the hips turned by the posture's heading, blended to the point; the elbow bends back and out.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One goal.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture.
   */
  export function reach(
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    point: IAutoMovieVector3,
    share: number,
  ): IAutoMovieMotionHumanPosture {
    if (share <= 0) return posture;
    const turn: IAutoMovieQuaternion = resolveHumanPosture.heading(posture);
    const sign: number = side === "left" ? 1 : -1;
    const hanging: IAutoMovieVector3 = Vector3.add(
      posture.root,
      Quaternion.rotateVector(turn, { x: sign * 0.25, y: -0.1, z: 0 }),
    );
    return {
      ...posture,
      limbs: {
        ...posture.limbs,
        [`${side}Arm`]: {
          point: Vector3.lerp(hanging, point, share),
          bend: Quaternion.rotateVector(turn, { x: sign, y: 0, z: -1 }),
          planted: share >= 1,
        },
      },
    };
  }

  /**
   * Where the falling side's hand meets the floor: beside the hip, out by the shoulder's half width and the arm.
   *
   * @param posture The posture.
   * @param side The falling side.
   * @param body The body.
   * @returns World metres, on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the point.
   * @evidence contracts/development/implementation.md#principled-implementation The body's own measures turned by the posture's heading, dropped to the floor.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One offset.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a new point.
   */
  export function beside(
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieVector3 {
    const sign: number = side === "left" ? 1 : -1;
    const out: IAutoMovieVector3 = Quaternion.rotateVector(
      resolveHumanPosture.heading({ yaw: posture.yaw, pitch: 0, roll: 0 }),
      {
        x:
          sign * (body.measure.shoulderHalfWidth + 0.5 * body.measure.upperArm),
        y: 0,
        z: 0,
      },
    );
    return { ...Vector3.add(posture.root, out), y: body.measure.forearmRadius };
  }

  /**
   * The root's height standing.
   *
   * @param body The body.
   * @returns Metres above the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the height.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation The body's hip height.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One read.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure read.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function standingHeight(body: IAutoMovieMotionHumanBody): number {
    return body.measure.hipHeight;
  }

  /**
   * Refuse a sideways fall whose root would cross the carrier's flank below the seat: inside the half width the rider's feet straddle, lower than the seat.
   *
   * @param body The body.
   * @param entry The seated entry posture.
   * @param origin The carrier contact's frame at the act's start.
   * @param carrier The carrier contact's frame reader.
   * @param release The release, film seconds.
   * @param flight The flight.
   * @throws {HumanRefusal} When the flight passes through the flank.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the test and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Eight samples of the flight, each read in the carrier contact's frame at its own second, against the straddle's half width taken from the entry's feet.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The flank is the straddle's, a lower bound of the carrier's width.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight frame readings.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Run once per plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function clearsFlank(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanPosture,
    origin: IAutoMovieRigidTransform,
    carrier: HumanMountedFrame.Reader,
    release: number,
    flight: HumanUnseatFlight.IFlight,
  ): void {
    const local = (
      frame: IAutoMovieRigidTransform,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(point, frame.position),
      );
    const feet: number[] = (["left", "right"] as const)
      .map((side) => entry.limbs[`${side}Leg`]?.point)
      .filter((p): p is IAutoMovieVector3 => p !== undefined)
      .map((p: IAutoMovieVector3): number => Math.abs(local(origin, p).x));
    const flank: number =
      feet.length === 0
        ? body.measure.hipHalfWidth
        : Math.max(...feet) - body.measure.shankRadius;
    for (let k: number = 1; k <= 8; ++k) {
      const t: number = (flight.land * k) / 8;
      const p: IAutoMovieVector3 = local(
        carrier(release + t),
        HumanUnseatFlight.at(flight, t),
      );
      if (Math.abs(p.x) < flank && p.y < 0)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "push",
          value: Vector3.length(flight.push),
          feasible: null,
          reason: `the fall crosses the carrier's flank ${t.toFixed(3)} s after the release`,
          fix: "push the fall harder to the side, or fall backward or forward",
        });
    }
  }

  /**
   * The drag's inputs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The law's context, carrier, seated sampler, release, stirrup, side, breakaway, lie, the fitted lie, its root height and the window builder.
   * @evidence contracts/development/design.md#principled-representation The plan's shared state.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `drag`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IDrag {
    /** The law's context. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanUnseat>;

    /** The carrier. */
    support: IAutoMovieMotionHumanPropReader;

    /** The carrier contact's frame reader. */
    carrier: HumanMountedFrame.Reader;

    /** The seated posture at a local second. */
    seatedAt: (t: number) => IAutoMovieMotionHumanPosture;

    /** The release, local seconds. */
    release: number;

    /** The stirrup contact. */
    stirrup: string;

    /** The dragged foot's side. */
    side: AutoMovieHumanSide;

    /** Seconds after the release the stirrup lets go; never when absent. */
    free: number | undefined;

    /** Seconds lying after the stop. */
    lie: number;

    /** The fitted lie. */
    lying: KnockdownFloor.IFold;

    /** The lying root's height. */
    floor: number;

    /** The contact window builder. */
    window: (
      part: string,
      kind: IAutoMovieMotionHumanContactWindow["kind"],
      from: number,
      to: number,
      on?: string,
    ) => IAutoMovieMotionHumanContactWindow;
  }

  /**
   * A drag: from the release the body is drawn over `DRAW` onto its back behind the stirrup, the foot held in it and the head away from the carrier, sliding as the carrier goes; a breakaway stirrup lets the foot go at `free` and the body slides to a stop.
   *
   * @param props The inputs.
   * @returns The plan.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the drag, its release and its windows.
   * @evidence contracts/development/implementation.md#principled-implementation The lying root a leg's length behind the stirrup along the carrier's level heading, the foot's goal the stirrup's own point; after the breakaway the root slides with the velocity it had (`HumanUnseatFlight`).
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Windows, then the sampler.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The stirrup is read where the carrier has it.
   * @evidence contracts/development/implementation.md#efficient-algorithms One stirrup and one carrier reading per sample.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The breakaway slide is solved once.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The plan retains the carrier reader.
   */
  export function drag(props: IDrag): IAutoMovieMotionHumanActionPlan {
    const {
      context,
      support,
      carrier,
      seatedAt,
      release,
      side,
      lie,
      lying,
      floor,
    } = props;
    const legLength: number =
      context.body.measure.thigh + context.body.measure.shank;
    const dragged = (film: number): IAutoMovieMotionHumanPosture => {
      const foot: IAutoMovieVector3 = HumanMountedFrame.contact(
        support,
        props.stirrup,
        film,
      );
      const ahead: IAutoMovieVector3 = Quaternion.rotateVector(
        carrier(film).rotation,
        { x: 0, y: 0, z: 1 },
      );
      const level: IAutoMovieVector3 = Vector3.normalize({
        x: ahead.x,
        y: 0,
        z: ahead.z,
      });
      const root: IAutoMovieVector3 = {
        ...Vector3.subtract(foot, Vector3.scale(level, legLength)),
        y: floor,
      };
      const yaw: number = (Math.atan2(level.x, level.z) * 180) / Math.PI;
      const shown: IAutoMovieMotionHumanPosture = {
        ...seatedAt(release),
        root,
        yaw,
        pitch: lying.pitch,
        roll: 0,
        joints: { ...(lying.joints as IAutoMovieMotionHumanPosture["joints"]) },
        limbs: {},
      };
      return {
        ...shown,
        limbs: {
          [`${side}Leg`]: {
            point: foot,
            bend: { x: 0, y: 1, z: 0 },
            planted: true,
          },
        },
      };
    };
    const freed: number | undefined =
      props.free === undefined ? undefined : release + props.free;
    const slide: HumanUnseatFlight.IFlight | undefined =
      freed === undefined
        ? undefined
        : HumanUnseatFlight.of(
            dragged(context.start + freed).root,
            Vector3.scale(
              Vector3.subtract(
                dragged(context.start + freed + 1 / 240).root,
                dragged(context.start + freed - 1 / 240).root,
              ),
              120,
            ),
            { x: 0, y: 0, z: 0 },
            floor,
          );
    const duration: number =
      freed === undefined ? release + DRAW + lie : freed + slide!.stop + lie;
    const on: string = context.params.on;
    return {
      duration,
      events: [
        { name: "release", share: release / duration },
        ...(freed === undefined
          ? []
          : [{ name: "free", share: freed / duration }]),
      ],
      contacts: [
        props.window("seat", "seat", 0, release / duration, on),
        props.window(
          `${side}Foot`,
          "plant",
          0,
          freed === undefined ? 1 : freed / duration,
          on,
        ),
        props.window("back", "lie", (release + DRAW) / duration, 1),
      ],
      base: { kind: "lying" },
      posture: (time: number): IAutoMovieMotionHumanPosture => {
        const t: number = Math.max(0, Math.min(duration, time));
        if (t <= release) return seatedAt(t);
        if (freed !== undefined && t > freed)
          return {
            ...dragged(context.start + freed),
            root: HumanUnseatFlight.at(slide!, t - freed),
            limbs: {},
          };
        const shown: IAutoMovieMotionHumanPosture = dragged(context.start + t);
        return t >= release + DRAW
          ? shown
          : mixHumanPosture(
              seatedAt(release),
              shown,
              minimumJerk.share((t - release) / DRAW),
            );
      },
    };
  }
}
