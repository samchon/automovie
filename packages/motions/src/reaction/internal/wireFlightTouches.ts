import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
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

import { HumanRefusal } from "../../law/HumanRefusal";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { mixHumanPosture } from "../../posture/internal/mixHumanPosture";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/** The flight stage and its typed target reader. */
type TouchContext = "body" | "aim" | "start";

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
    context: Pick<IAutoMovieMotionHumanActionContext, TouchContext>,
    held: IAutoMovieMotionHumanActionPlan,
    seconds: number,
    root: (t: number) => IAutoMovieVector3,
    touches: readonly IAutoMovieMotionHumanWireFlight.ITouch[],
  ): IAutoMovieMotionHumanActionPlan {
    const window: number = Math.min(TOUCH, seconds / 4);
    const plateau: number = window / 4;
    const admitted: readonly IAdmitted[] = touches.map(
      (touch: IAutoMovieMotionHumanWireFlight.ITouch, k: number): IAdmitted => {
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
        const side: AutoMovieHumanSide = touch.part.startsWith("left")
          ? "left"
          : "right";
        const limb: AutoMovieHumanLimb = `${side}${leg ? "Leg" : "Arm"}`;
        return {
          touch,
          at,
          leg,
          side,
          limb,
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
    const placed: readonly IPlaced[] = admitted.map(
      ({ side, ...p }: IAdmitted): IPlaced => ({
        ...p,
        ramp: {
          in: [
            key(side, p.leg, p.limb, p.at - plateau - window),
            key(side, p.leg, p.limb, p.at - plateau),
          ],
          out: [
            key(side, p.leg, p.limb, p.at + plateau),
            key(side, p.leg, p.limb, p.at + plateau + window),
          ],
        },
      }),
    );

    // The flight's own joint and bend at each ramp endpoint are resolved
    // during preparation and stored in the root's frame.
    function key(
      side: AutoMovieHumanSide,
      leg: boolean,
      limb: AutoMovieHumanLimb,
      at: number,
    ): IRampKey {
      const posture: IAutoMovieMotionHumanPosture = held.posture(
        Math.min(seconds, Math.max(0, at)),
      );
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(
        humanPostureHeading(posture),
      );
      const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
        Quaternion.rotateVector(inverse, Vector3.subtract(point, posture.root));
      const own: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
      if (own !== undefined)
        return {
          point: local(own.point),
          bend: local(own.bend),
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
        point: local(shown.get(end)!.worldPosition),
        bend: local(shown.get(middle)!.worldPosition),
      };
    }
    const ramped = (
      ramp: IRampKeys,
      posture: IAutoMovieMotionHumanPosture,
      coming: boolean,
      w: number,
    ): IAutoMovieHumanLimbGoal => {
      // The ramp's share of its way from one end to the other.
      const [a, b]: readonly [IRampKey, IRampKey] = coming
        ? ramp.in
        : ramp.out;
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
                from: Math.max(0, p.at - plateau) / seconds,
                to: Math.min(seconds, p.at + plateau) / seconds,
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
            Math.max(0, 1 - (Math.abs(seconds_ - p.at) - plateau) / window),
          );
          if (w <= 0) continue;
          // The touch eases in from where the flight's own limb is: a goal
          // only the touch set would be taken whole by the mix, so the limb
          // would leap onto the surface as the ramp starts. Where the flight
          // writes no goal of its own for the limb, its shaped joints place
          // the joint and the knee or elbow the ramp leaves (`ramped`).
          if (posture.limbs[p.limb] === undefined && w < 1)
            posture = {
              ...posture,
              limbs: {
                ...posture.limbs,
                [p.limb]: ramped(p.ramp, posture, seconds_ < p.at, w),
              },
            };
          posture = mixHumanPosture(
            posture,
            {
              ...posture,
              limbs: {
                ...posture.limbs,
                [p.limb]: {
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
            AutoMovieEngineMotionSampling.minimumJerkShare(w),
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
    readonly touch: IAutoMovieMotionHumanWireFlight.ITouch;
    /** Its second in the flight. */
    readonly at: number;
    /** Whether a foot touches. */
    readonly leg: boolean;
    /** The limb channel this touch writes. */
    readonly limb: AutoMovieHumanLimb;
    /** The prepared ramp endpoints in the flight's root frame. */
    readonly ramp: IRampKeys;
    /** The wrist's or the ankle's goal there, world metres. */
    readonly point: IAutoMovieVector3;
  }

  /** An admitted contact awaiting its fixed ramp endpoint reads. */
  interface IAdmitted extends Omit<IPlaced, "ramp"> {
    /** The side of the body, used to select the joint and bend bones. */
    readonly side: AutoMovieHumanSide;
  }
}
