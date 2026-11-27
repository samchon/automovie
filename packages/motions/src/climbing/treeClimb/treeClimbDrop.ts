import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanPreparedPlayback } from "../../perform/internal/HumanPreparedPlayback";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { poseBones } from "../../posture/internal/poseBones";
import { GymnasticsFlight } from "../../sport/internal/GymnasticsFlight";

/** Seconds the landing takes to absorb into the stand (provisional). */
const ABSORB: number = 0.4;

/**
 * How deep the hips dip in the absorb, a share of the hip height (provisional:
 * a soft landing's knee bend).
 */
const DIP: number = 0.18;

/** Time available for a higher foot to acquire the floor after touchdown. */
const SECOND_FOOT: number = ABSORB / 2;

/** The two independently observed floor sockets. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * Append a hang's release and drop to a plan that ends hanging: the body keeps
 * the hanging shape and falls freely until its lowest toe meets the ground (`t
 * = sqrt(2 h / g)`), then absorbs into the stand over `ABSORB` with the hips
 * dipping `DIP` and the stand's root on the toes' midpoint, so the feet land
 * under the stand they end in.
 *
 * @param context The action's context.
 * @param plan The plan ending in the hang.
 * @param ground The ground's height, world metres.
 * @returns The plan with the drop and landing appended.
 */
export function treeClimbDrop(
  context: Pick<IAutoMovieMotionHumanActionContext, "body">,
  plan: IAutoMovieMotionHumanActionPlan,
  ground: number,
): IAutoMovieMotionHumanActionPlan {
  const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
  const g: number = AutoMovieGravity.STANDARD;
  const release: number = plan.duration;
  const capture = (): IDrop => {
    const frozen: ReturnType<typeof GymnasticsFlight.freeze> =
      GymnasticsFlight.freeze(body, plan.posture(release));
    const hang: IAutoMovieMotionHumanPosture = frozen.posture;
    const bones: ReturnType<typeof poseBones> = poseBones(body, frozen.pose);
    const left: IAutoMovieVector3 = bones.get("leftToes")!.worldPosition;
    const right: IAutoMovieVector3 = bones.get("rightToes")!.worldPosition;
    const lowest = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanFoot.ISocket =>
      HumanFoot.sockets(body, bones, side).reduce(
        (
          a: IAutoMovieMotionHumanFoot.ISocket,
          b: IAutoMovieMotionHumanFoot.ISocket,
        ): IAutoMovieMotionHumanFoot.ISocket =>
          a.point.y <= b.point.y ? a : b,
      );
    const soles: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.ISocket> =
      { left: lowest("left"), right: lowest("right") };
    const scheduled: number = Math.max(0, Math.min(left.y, right.y) - ground);
    const height: number = Math.max(
      0,
      Math.min(soles.left.point.y, soles.right.point.y) - ground,
    );
    const landed: IAutoMovieMotionHumanPosture = {
      ...hang,
      root: { ...hang.root, y: hang.root.y - height },
    };
    const feet: IAutoMovieVector3 = {
      ...Vector3.lerp(left, right, 0.5),
      y: ground,
    };
    const end: IAutoMovieMotionHumanPosture = {
      ...stand.posture(body, feet, hang.yaw),
      limbs: {},
    };
    const joints: Set<keyof IAutoMovieMotionHumanPosture["joints"]> = new Set([
      ...Object.keys(landed.joints),
      ...Object.keys(end.joints),
    ] as (keyof IAutoMovieMotionHumanPosture["joints"])[]);
    const foot = (side: AutoMovieHumanSide): IFoot => {
      const { socket, point }: IAutoMovieMotionHumanFoot.ISocket = soles[side];
      const rotation: IAutoMovieQuaternion = bones.get(
        `${side}Foot`,
      )!.worldRotation;
      const knee: IAutoMovieVector3 = bones.get(
        `${side}LowerLeg`,
      )!.worldPosition;
      const bend: IAutoMovieVector3 = { ...knee, y: knee.y - height };
      const remaining: number = Math.max(0, point.y - height - ground);
      return {
        socket,
        anchor: { ...point, y: ground },
        rotation,
        flat: HumanFoot.rotation(HumanFoot.heading(rotation), 0),
        bend,
        remaining,
        after: remaining <= 1e-8 ? 0 : SECOND_FOOT,
      };
    };
    return {
      hang,
      height,
      scheduled,
      landed,
      end,
      joints,
      feet: { left: foot("left"), right: foot("right") },
    };
  };
  let drop: IDrop = capture();
  const fall: number = Math.sqrt((2 * drop.scheduled) / g);
  const touchdown: number = release + fall;
  const duration: number = touchdown + ABSORB;
  const scale = (share: number): number => (share * release) / duration;

  const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
    seconds,
    ...args
  ): IAutoMovieMotionHumanPosture => {
    const t: number = Math.max(0, Math.min(duration, seconds));
    if (t <= release) return plan.posture(t, ...args);
    const { hang, landed, end }: IDrop = drop;
    if (t < touchdown) {
      const s: number = t - release;
      // Keep the placed clock while landing on the refreshed predecessor
      // geometry. When the geometry is unchanged the launch rate is zero.
      const rate: number = (0.5 * g * fall * fall - drop.height) / fall;
      return {
        ...hang,
        root: { ...hang.root, y: hang.root.y + rate * s - 0.5 * g * s * s },
      };
    }
    const w: number = AutoMovieEngineMotionSampling.minimumJerkShare((t - touchdown) / ABSORB);
    const dip: number = DIP * body.measure.hipHeight * Math.sin(Math.PI * w);
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...end.joints };
    for (const bone of drop.joints) {
      const a: readonly [number, number, number] = landed.joints[bone] ?? [
        0, 0, 0,
      ];
      const b: readonly [number, number, number] = end.joints[bone] ?? [
        0, 0, 0,
      ];
      joints[bone] = [
        a[0] + (b[0] - a[0]) * w,
        a[1] + (b[1] - a[1]) * w,
        a[2] + (b[2] - a[2]) * w,
      ];
    }
    const root: IAutoMovieVector3 = Vector3.lerp(landed.root, end.root, w);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
    for (const side of SIDES) {
      const foot: IFoot = drop.feet[side];
      const elapsed: number = t - touchdown;
      const planted: boolean = elapsed + 1e-9 >= foot.after;
      const rotation: IAutoMovieQuaternion = Quaternion.slerp(
        foot.rotation,
        foot.flat,
        w,
      );
      const offset: IAutoMovieVector3 = HumanFoot.offset(
        body,
        side,
        foot.socket,
        joints[`${side}Toes`]?.[0] ?? 0,
      );
      const goal: IAutoMovieHumanLimbGoal = {
        point: Vector3.subtract(
          {
            ...foot.anchor,
            y:
              ground +
              (planted
                ? 0
                : foot.remaining *
                  (1 - AutoMovieEngineMotionSampling.minimumJerkShare(elapsed / foot.after))),
          },
          Quaternion.rotateVector(rotation, offset),
        ),
        bend: foot.bend,
        rotation,
        ...(planted ? { planted, contact: offset } : {}),
      };
      limbs[`${side}Leg`] = goal;
    }
    return {
      ...end,
      root: { ...root, y: root.y - dip },
      pitch: landed.pitch + (end.pitch - landed.pitch) * w,
      roll: landed.roll + (end.roll - landed.roll) * w,
      joints,
      limbs,
    };
  };
  const windows = (): IAutoMovieMotionHumanContactWindow[] => [
    ...plan.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow => ({
        ...window,
        from: scale(window.from),
        to: scale(window.to),
      }),
    ),
    ...SIDES.map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanContactWindow => ({
        part: `${side}Foot`,
        kind: "plant",
        socket: drop.feet[side].socket,
        support: { kind: "ground" },
        from: (touchdown + drop.feet[side].after) / duration,
        to: 1,
      }),
    ),
  ];
  let contacts: IAutoMovieMotionHumanContactWindow[] = windows();
  const result: IAutoMovieMotionHumanActionPlan = {
    duration,
    events: [
      ...plan.events.map(
        (event: IAutoMovieMotionEvent): IAutoMovieMotionEvent => ({
          ...event,
          share: scale(event.share),
        }),
      ),
      { name: "release", share: release / duration },
      { name: "touchdown", share: touchdown / duration },
    ],
    get contacts(): IAutoMovieMotionHumanContactWindow[] {
      return contacts;
    },
    base: { kind: "standing" },
    prepare: (): void => {
      plan.prepare?.();
      drop = capture();
      contacts = windows();
    },
    posture,
    yields: plan.yields ?? [],
  };
  return HumanPreparedPlayback.rebindPosture(result, plan, body);
}

/** The drop's displayed hang, floor landing, and stand. */
interface IDrop {
  /** Resolved hanging angles with the old support goals released. */
  hang: IAutoMovieMotionHumanPosture;
  /** The vertical gap to the lower toe in metres. */
  height: number;
  /** The toe-bone height used to publish the action's existing fall clock. */
  scheduled: number;
  /** The hanging shape where the foot meets the floor. */
  landed: IAutoMovieMotionHumanPosture;
  /** The stance at the end of absorption. */
  end: IAutoMovieMotionHumanPosture;
  /** All displayed joints read by the absorption blend. */
  joints: ReadonlySet<keyof IAutoMovieMotionHumanPosture["joints"]>;
  /** Contact sockets and landing acquisitions by foot. */
  feet: Record<AutoMovieHumanSide, IFoot>;
}

/** A foot's first physical floor point and its prepared landing. */
interface IFoot {
  /** The lowest socket of the displayed foot at touchdown. */
  socket: IAutoMovieMotionHumanFoot.Socket;
  /** The fixed world contact point in metres. */
  anchor: IAutoMovieVector3;
  /** The hanging foot's rotation. */
  rotation: IAutoMovieQuaternion;
  /** The flat foot by the end of absorption. */
  flat: IAutoMovieQuaternion;
  /** The displayed knee as the leg arrives. */
  bend: IAutoMovieVector3;
  /** The second foot's remaining translation down to its floor socket. */
  remaining: number;
  /** Seconds after the first touchdown until this foot bears load. */
  after: number;
}
