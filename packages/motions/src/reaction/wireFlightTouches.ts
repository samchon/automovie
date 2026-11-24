import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWireFlight,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { mixHumanPosture } from "../posture/mixHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A wire flight's touches (`IAutoMovieMotionHumanWireFlight.ITouch`): each hand
 * or foot meets its surface around its share of the flight, coming in and going
 * out over `TOUCH` on either side, from the flight's own limb.
 */
export namespace wireFlightTouches {
  /**
   * How long a touch comes in before its share and goes out after, seconds:
   * authored.
   */
  export const TOUCH: number = 0.3;

  /**
   * The shoulder's height on a standing body, in statures (Drillis and Contini
   * 1966: 0.818).
   */
  export const SHOULDER: number = 0.818;

  /**
   * The ankle's height above the sole, in statures (Drillis and Contini 1966:
   * 0.039).
   */
  export const ANKLE: number = 0.039;

  /**
   * How far the wrist stands off a surface the palm lies on, metres: a palm's
   * half thickness.
   */
  export const PALM: number = 0.015;

  /**
   * The flight's plan with its touches.
   *
   * @param context The action's context.
   * @param held The flight's plan.
   * @param seconds The flight's time, seconds.
   * @param root The root's point at a second of the flight.
   * @param touches The touches.
   * @returns The plan with the touches.
   * @throws {HumanRefusal} On a touch's `at` outside the flight, and on its
   *   `target` beyond the limb's reach from the path.
   */
  export function apply(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWireFlight.IParams>,
    held: IAutoMovieMotionHumanActionPlan,
    seconds: number,
    root: (t: number) => IAutoMovieVector3,
    touches: readonly IAutoMovieMotionHumanWireFlight.ITouch[],
  ): IAutoMovieMotionHumanActionPlan {
    const window: number = Math.min(TOUCH, seconds / 4);
    const placed: readonly IPlaced[] = touches.map(
      (touch: IAutoMovieMotionHumanWireFlight.ITouch, k: number): IPlaced => {
        if (!(touch.at >= 0 && touch.at <= 1))
          throw new HumanRefusal({
            kind: "parameter",
            axis: `touches.${k}.at`,
            value: touch.at,
            feasible: { kind: "range", unit: "share", minimum: 0, maximum: 1 },
            reason: "a touch happens at a share of the flight",
            fix: "give a share between 0 and 1",
          });
        const at: number = touch.at * seconds;
        const leg: boolean =
          touch.part === "leftFoot" || touch.part === "rightFoot";
        const aim: ReturnType<typeof context.aim> = context.aim(
          touch.target,
          context.start + at,
        );
        // The hip or the shoulder, from the root along the body's axis.
        const base: IAutoMovieVector3 = Vector3.add(root(at), {
          x: 0,
          y: leg
            ? context.body.measure.hipHeight
            : SHOULDER * context.body.measure.stature,
          z: 0,
        });
        const reach: number = leg
          ? context.body.measure.hipHeight
          : context.body.measure.upperArm + context.body.measure.forearm;
        const gap: number = Vector3.distance(base, aim.point);
        if (gap > reach)
          throw new HumanRefusal({
            kind: "reach",
            axis: `touches.${k}.target`,
            value: gap,
            feasible: { kind: "range", unit: "m", minimum: 0, maximum: reach },
            reason: `the ${touch.part} would meet its surface ${gap.toFixed(2)} m from its joint on the path; it reaches ${reach.toFixed(2)} m`,
            fix: "bring the path closer to the surface at that share",
          });
        return {
          touch,
          at,
          leg,
          point: Vector3.add(
            aim.point,
            Vector3.scale(
              aim.normal,
              leg ? ANKLE * context.body.measure.stature : PALM,
            ),
          ),
        };
      },
    );
    // A touch's ramp starts from the flight's own limb: its joint and its
    // knee or elbow, read at each ramp's two ends on the first read of the
    // ramp, in the root's frame, and interpolated between them, carried by
    // the root as the flight moves on: keys solved once and read many times,
    // as an animation curve's are, never a posture resolved per second.
    const keys: Map<IPlaced, IRampKeys> = new Map();
    const local = (
      posture: IAutoMovieMotionHumanPosture,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.inverse(humanPostureHeading(posture)),
        Vector3.subtract(point, posture.root),
      );
    const key = (
      side: AutoMovieHumanSide,
      leg: boolean,
      limb: AutoMovieHumanLimb,
      at: number,
    ): IRampKey => {
      const posture: IAutoMovieMotionHumanPosture = held.posture(
        Math.min(seconds, Math.max(0, at)),
      );
      const own: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
      if (own !== undefined)
        return {
          point: local(posture, own.point),
          bend: local(posture, own.bend),
        };
      const end: AutoMovieHumanoidBone = `${side}${leg ? "Foot" : "Hand"}`;
      const middle: AutoMovieHumanoidBone = `${side}${leg ? "LowerLeg" : "LowerArm"}`;
      const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        poseBones(
          context.body,
          resolveHumanPosture(context.body, posture),
          undefined,
          new Set<AutoMovieHumanoidBone>([end, middle]),
        );
      return {
        point: local(posture, shown.get(end)!.worldPosition),
        bend: local(posture, shown.get(middle)!.worldPosition),
      };
    };
    const ramped = (
      p: IPlaced,
      side: AutoMovieHumanSide,
      limb: AutoMovieHumanLimb,
      posture: IAutoMovieMotionHumanPosture,
      coming: boolean,
      w: number,
    ): IAutoMovieHumanLimbGoal => {
      let found: IRampKeys | undefined = keys.get(p);
      if (found === undefined) {
        const plateau: number = window / 4;
        found = {
          in: [
            key(side, p.leg, limb, p.at - plateau - window),
            key(side, p.leg, limb, p.at - plateau),
          ],
          out: [
            key(side, p.leg, limb, p.at + plateau),
            key(side, p.leg, limb, p.at + plateau + window),
          ],
        };
        keys.set(p, found);
      }
      // The ramp's share of its way from one end to the other.
      const [a, b]: readonly [IRampKey, IRampKey] = coming
        ? found.in
        : found.out;
      const u: number = coming ? w : 1 - w;
      const turn: IAutoMovieQuaternion = humanPostureHeading(posture);
      const world = (
        from: IAutoMovieVector3,
        to: IAutoMovieVector3,
      ): IAutoMovieVector3 =>
        Vector3.add(
          posture.root,
          Quaternion.rotateVector(
            turn,
            Vector3.add(from, Vector3.scale(Vector3.subtract(to, from), u)),
          ),
        );
      return { point: world(a.point, b.point), bend: world(a.bend, b.bend) };
    };
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...held.contacts,
      ...placed.flatMap((p: IPlaced): IAutoMovieMotionHumanContactWindow[] =>
        p.touch.target.kind === "prop"
          ? [
              {
                part: p.touch.part,
                kind: "plant",
                from: Math.max(0, p.at - window / 4) / seconds,
                to: Math.min(seconds, p.at + window / 4) / seconds,
                support: { kind: "prop", subject: p.touch.target.subject },
              },
            ]
          : [],
      ),
    ];
    return {
      ...held,
      contacts,
      physicalWindow: null,
      posture: (
        seconds_: number,
        channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        let posture: IAutoMovieMotionHumanPosture = held.posture(
          seconds_,
          channels,
          resolution,
          projection,
        );
        for (const p of placed) {
          // Full on its surface for the plateau the contact spans, ramping in
          // and out over `window` on either side of it.
          const w: number = Math.min(
            1,
            Math.max(0, 1 - (Math.abs(seconds_ - p.at) - window / 4) / window),
          );
          if (w <= 0) continue;
          const side: AutoMovieHumanSide = p.touch.part.startsWith("left")
            ? "left"
            : "right";
          const limb: AutoMovieHumanLimb = `${side}${p.leg ? "Leg" : "Arm"}`;
          // The touch eases in from where the flight's own limb is: a goal
          // only the touch set would be taken whole by the mix, so the limb
          // would leap onto the surface as the ramp starts. Where the flight
          // writes no goal of its own for the limb, its shaped joints place
          // the joint and the knee or elbow the ramp leaves (`ramped`).
          if (posture.limbs[limb] === undefined && w < 1)
            posture = {
              ...posture,
              limbs: {
                ...posture.limbs,
                [limb]: ramped(p, side, limb, posture, seconds_ < p.at, w),
              },
            };
          posture = mixHumanPosture(
            posture,
            {
              ...posture,
              limbs: {
                ...posture.limbs,
                [limb]: {
                  point: p.point,
                  bend: Vector3.add(p.point, {
                    x: 0,
                    y: p.leg ? 0.3 : -0.2,
                    z: 0,
                  }),
                  planted: w >= 1,
                },
              },
            },
            minimumJerk.share(w),
          );
        }
        return posture;
      },
    };
  }

  /**
   * A ramp's end: the flight's own limb joint and its knee or elbow, in the
   * root's frame, metres.
   */
  interface IRampKey {
    /** The wrist or ankle. */
    point: IAutoMovieVector3;
    /** The elbow or knee. */
    bend: IAutoMovieVector3;
  }

  /** A touch's ramp keys: the two ends of its ramp in and of its ramp out. */
  interface IRampKeys {
    /** The ramp in's start and end. */
    in: readonly [IRampKey, IRampKey];
    /** The ramp out's start and end. */
    out: readonly [IRampKey, IRampKey];
  }

  /** One touch placed on the flight. */
  interface IPlaced {
    /** The authored touch. */
    touch: IAutoMovieMotionHumanWireFlight.ITouch;
    /** Its second in the flight. */
    at: number;
    /** Whether a foot touches. */
    leg: boolean;
    /** The wrist's or the ankle's goal there, world metres. */
    point: IAutoMovieVector3;
  }
}
