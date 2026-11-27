import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDrawFromCarrier,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrehension,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBase } from "../../compose/AutoMovieMotionHumanBase";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanGrip } from "../HumanGrip";
import { drawFromCarrierPulling } from "./drawFromCarrierPulling";

/**
 * The draw over a carrier: a seated rider drawing from a carrier worn on its
 * body. The carrier action keeps the body; the draw claims only its hands and
 * arms, and their goals ride the bone the carrier is worn on, so the hands
 * follow the line as the body moves under the rider. The path is the grounded
 * draw's, carried into that bone's frame at the entry; the trunk's turn of a
 * long draw is the carrier's, so it is left out.
 */
export function drawFromCarrierOver(
  over: drawFromCarrierOver.IOver,
): IAutoMovieMotionHumanActionPlan {
  const {
    context,
    side,
    prop,
    from,
    line,
    duration,
    transport,
    bend,
    use,
    pulled,
    retreat,
  }: drawFromCarrierOver.IOver = over;
  const worn: IAutoMovieMotionHumanProp["worn"] = context.prop(from.prop).prop
    .worn;
  const frame: AutoMovieHumanoidBone =
    worn !== undefined && worn.subject === context.subject ? worn.bone : "hips";
  const at: IAutoMovieResolvedBone = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([frame]),
  ).get(frame)!;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(at.worldRotation);
  const local: (p: IAutoMovieVector3) => IAutoMovieVector3 = (
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Quaternion.rotateVector(inverse, Vector3.subtract(p, at.worldPosition));
  const turn: (q: IAutoMovieQuaternion) => IAutoMovieQuaternion = (
    q: IAutoMovieQuaternion,
  ): IAutoMovieQuaternion =>
    Quaternion.normalize(Quaternion.multiply(inverse, q));
  const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(
    context,
    duration,
  );
  const part: IAutoMovieMotionHumanContactWindow["part"] = `${side}Hand`;
  const goal: (
    wrist: IAutoMovieMotionHumanPrehension.ITransport,
    elbow: IAutoMovieVector3,
    t: number,
  ) => IAutoMovieHumanLimbGoal = (
    wrist: IAutoMovieMotionHumanPrehension.ITransport,
    elbow: IAutoMovieVector3,
    t: number,
  ): IAutoMovieHumanLimbGoal => ({
    point: local(wrist.wrist(t)),
    rotation: turn(wrist.turn(t)),
    bend: local(elbow),
    on: frame,
  });
  return {
    duration,
    events: [
      { name: "unseated", share: 0 },
      { name: "drawn", share: 1 },
    ],
    contacts: [
      ...base.contacts,
      {
        part,
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "prop", subject: prop, carries: false },
      },
      {
        part,
        kind: "grip",
        from: 1,
        to: 1,
        support: { kind: "prop", subject: prop },
      },
      ...(pulled === null
        ? []
        : [
            {
              part: pulled.part,
              kind: "grip" as const,
              from: 0,
              to: 1,
              support: { kind: "prop" as const, subject: from.prop },
            },
          ]),
    ],
    channels: [
      `${side}Arm`,
      `${side}Hand`,
      ...(pulled === null
        ? []
        : ([`${pulled.side}Arm`, `${pulled.side}Hand`] as const)),
    ],
    mounts: [{ prop, onto: from.prop, point: from.slide, from: 0 }],
    ...(pulled === null
      ? {}
      : { wears: [{ prop: from.prop, bone: pulled.bone, from: 1 }] }),
    drives: [
      {
        prop: from.prop,
        articulation: from.slider,
        from: 0,
        to: 1,
        travel: (seconds: number): number =>
          Vector3.length(line) *
          minimumJerk(Math.min(1, Math.max(0, seconds / duration))).s,
      },
    ],
    holds: [
      {
        side,
        prop,
        from: 1,
        fingers: HumanGrip.fingers(context.entry.pose, side),
        ...(use === undefined ? {} : { use }),
      },
    ],
    posture: (
      seconds: number,
      channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): IAutoMovieMotionHumanPosture => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      const posture: IAutoMovieMotionHumanPosture = base.posture(
        t,
        channels,
        resolution,
        projection,
      );
      return {
        ...posture,
        limbs: {
          ...posture.limbs,
          [`${side}Arm`]: goal(transport, bend, t),
          ...(pulled === null || retreat === null
            ? {}
            : { [`${pulled.side}Arm`]: goal(retreat, pulled.bend, t) }),
        },
      };
    },
  };
}

/** `drawFromCarrierOver` and its records. */
export namespace drawFromCarrierOver {
  /** What a draw over a carrier is planned from, as the grounded draw read it. */
  export interface IOver {
    /** The action's context, its carrier present. */
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrawFromCarrier>;
    /** The drawing hand. */
    side: AutoMovieHumanSide;
    /** The drawn object. */
    prop: string;
    /** The carrier and its affordances. */
    from: IAutoMovieMotionHumanDrawFromCarrier.IFrom;
    /** The draw line, world metres at the entry. */
    line: IAutoMovieVector3;
    /** The draw's length, seconds. */
    duration: number;
    /** The drawing wrist's transport, world at the entry. */
    transport: IAutoMovieMotionHumanPrehension.ITransport;
    /** The drawing elbow's hint, world at the entry. */
    bend: IAutoMovieVector3;
    /** The hand's use of the object. */
    use: IAutoMovieMotionPropHold["use"];
    /** The other hand's pull, when it pulls. */
    pulled: drawFromCarrierPulling.IPulled | null;
    /** The pulling wrist's transport, world at the entry. */
    retreat: IAutoMovieMotionHumanPrehension.ITransport | null;
  }
}
