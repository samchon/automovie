import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBrace,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { standUpright } from "../actions/standUpright";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { HumanPhysics } from "../law/HumanPhysics";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanFrame } from "../posture/HumanFrame";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { HumanTrunk } from "./HumanTrunk";
import { braceArms } from "./braceArms";
import { braceBody } from "./braceBody";
import { gestureHands } from "./gestureHands";
import { prepareGroundedBalance } from "./prepareGroundedBalance";

/** The record of `IPlanFootAtResult`'s site. */
type IPlanFootAtResult = { ankle: IAutoMovieVector3; planted: boolean };

/** The record of `IPlanFootAt`'s site. */
type IPlanFootAt = { ankle: IAutoMovieVector3; planted: boolean };

/**
 * Bracing for an expected impact, push or a falling body: the stance widens and
 * staggers along the line of the coming force, the body lowers and leans into
 * it, and the hands come up in front, all set before the force arrives.
 *
 * People preparing for a predictable perturbation adjust their posture in
 * advance, anticipatory postural adjustments (Massion 1992, Prog Neurobiol
 * 38:35): they enlarge the base of support along the expected force, lower the
 * centre of mass and lean against the force, keeping the feet in place once set
 * (Horak and Nashner 1986, J Neurophysiol 55:1369; Maki and McIlroy 1997, Phys
 * Ther 77:488, on changing the base of support). The goals: the foot on the
 * side away from the force steps back along the force's line by `STAGGER` leg
 * lengths and out until the feet stand a shoulder width apart (a staggered,
 * wider base); the pelvis drops until the knees flex `KNEE` degrees over the
 * middle of the new base. A requested hip or lumbar correction uses the actual
 * bearing sole or soles. The trunk inclines 10 degrees toward the force; and
 * both palms come up ahead of the chest's front surface (its sternum region)
 * along the force, facing it for an `impact` or a `push`, turned up and lower
 * to receive a `catchBody`. The arms rise from the entry's and hold the palms
 * there as one trajectory planned clear of the body
 * (`AutoMovieMotionHumanArmPlanned`, through `gestureHands.planned`), so no
 * forearm passes through the trunk on the way. Step size, drop and lean have no
 * measured source (Massion describes the adjustments, not these magnitudes).
 * The stepping foot swings over 0.4 s, a walking swing (Perry and Burnfield;
 * Pachi and Ji 2005), with a 3 cm lift, and the set is reached at `set`, 0.5 s
 * after the start, the end of the 400 to 500 ms in which early postural
 * adjustments precede a predictable impact (Krishnan, Latash and Aruin 2012),
 * and held for the rest of the action.
 *
 * The force comes from `toward` (a person, prop or point the force comes from)
 * or from straight ahead when absent.
 */
export namespace brace {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "brace";

  /** Cancel table: a brace is standing and may become standing again. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    stand: [
      {
        window: [0, 1],
        kind: "inertialize",
        entry: 0,
        blend: AutoMovieMotionHumanInterrupt.BLENDS.deliberate,
      },
    ],
  };

  /**
   * Knee flexion of the set posture, degrees (provisional: a slightly bent
   * ready stance, read from no measured source).
   */
  export const KNEE: number = 25;

  /**
   * How far the rear foot steps back along the force's line, leg lengths
   * (provisional).
   */
  export const STAGGER: number = 0.3;

  /**
   * Lead time to the set posture, seconds: the early postural adjustments to a
   * predictable impact begin 400 to 500 ms before it (Krishnan, Latash and
   * Aruin 2012, Clin Neurophysiol 123:1016), so the set is reached at the end
   * of that window.
   */
  export const SET: number = 0.5;

  /**
   * How long the stepping foot swings, seconds: 40 % of a stride, the swing's
   * share of the gait cycle (Perry and Burnfield 2010, Gait Analysis, ch. 1),
   * at the 1.8 to 2.0 steps a second of pedestrians (Pachi and Ji 2005, Struct
   * Eng 83(3):36), 0.40 to 0.44 s.
   */
  export const SWING: number = 0.4;

  /**
   * The least the set posture is held after it is reached, seconds
   * (provisional: long enough to read as held, read from no measured source).
   */
  export const HELD: number = 0.2;

  /** The brace's length when the caller names none, seconds (provisional). */
  export const SECONDS: number = 1.5;

  /**
   * When the stepping foot leaves and lands, seconds from the start: a `SWING`
   * long step that lands as the set is reached.
   */
  export const STEP: readonly [number, number] = [SET - SWING, SET];

  /**
   * The stepping foot's lift at mid-swing, metres (provisional: a shuffle's
   * clearance, read from no measured source).
   */
  export const LIFT: number = 0.03;

  /**
   * The trunk's inclination into a force from straight ahead, degrees
   * (provisional).
   */
  export const LEAN: number = 10;

  /**
   * How far ahead of the sternum the palms come up, a share of the arm (upper
   * arm and forearm) (provisional: the elbows bent, not reaching).
   */
  export const AHEAD: number = 0.55;

  /**
   * How far out from the sternum each palm stands, a share of the half shoulder
   * width (provisional: just inside the shoulders).
   */
  export const SPREAD: number = 0.9;

  /**
   * How far below the sternum the palms come to receive a falling body, a share
   * of stature (provisional).
   */
  export const RECEIVE: number = 0.1;

  /**
   * The elbows' outward hint, a share of the upper arm (provisional: read from
   * no measured source).
   */
  export const ELBOW_OUT: number = 0.2;

  /**
   * Plan a brace: the rear foot's step, the lowered and centred set root, and
   * postures that reach the set at `SET` seconds with the palms up toward the
   * force, then hold it.
   *
   * @param context The action's context.
   * @returns The plan; a duration shorter than `SET + HELD` is raised to it.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanBrace.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const p: IAutoMovieMotionHumanBrace.IParams = context.params;
    const duration: number = Math.max(SET + HELD, p.hold ?? SECONDS);
    const yaw: number = context.entry.posture.yaw;
    const feet: Record<AutoMovieHumanSide, IAutoMovieVector3> = stand.feet(
      body,
      context.entry,
      yaw,
    );
    const middle: IAutoMovieVector3 = {
      x: (feet.left.x + feet.right.x) / 2,
      y: 0,
      z: (feet.left.z + feet.right.z) / 2,
    };

    // The force's line: toward the source, on the floor.
    const source: IAutoMovieVector3 =
      p.target === undefined
        ? HumanFrame.point({ origin: middle, yaw }, { x: 0, y: 0, z: 1 })
        : context.aim(p.target, context.start).point;
    const toward: IAutoMovieVector3 = Vector3.normalize({
      x: source.x - middle.x,
      y: 0,
      z: source.z - middle.z,
    });
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      { x: 1, y: 0, z: 0 },
    );

    // The foot farther from the source steps back along the line and out.
    const back: AutoMovieHumanSide =
      Vector3.dot(Vector3.subtract(feet.left, feet.right), toward) < 0
        ? "left"
        : "right";
    const out: IAutoMovieVector3 = Vector3.scale(
      left,
      back === "left" ? 1 : -1,
    );
    const leg: number = m.thigh + m.shank;
    const across: number = Math.abs(
      Vector3.dot(Vector3.subtract(feet.left, feet.right), out),
    );
    const widen: number = Math.max(0, 2 * m.shoulderHalfWidth - across);
    const placed: IAutoMovieVector3 = Vector3.add(
      feet[back],
      Vector3.add(
        Vector3.scale(toward, -STAGGER * leg),
        Vector3.scale(out, widen),
      ),
    );
    const swing: readonly [number, number] = STEP;
    const footAt: (side: AutoMovieHumanSide, t: number) => IPlanFootAt = (
      side: AutoMovieHumanSide,
      t: number,
    ): IPlanFootAtResult => {
      if (side !== back || t <= swing[0])
        return { ankle: feet[side], planted: true };
      if (t >= swing[1]) return { ankle: placed, planted: true };
      const u: number = (t - swing[0]) / (swing[1] - swing[0]);
      const ankle: IAutoMovieVector3 = Vector3.lerp(
        feet[side],
        placed,
        minimumJerk.share(u),
      );
      return {
        ankle: { ...ankle, y: ankle.y + LIFT * Math.sin(Math.PI * u) },
        planted: false,
      };
    };

    // The pelvis settles over the new base, lowered; the trunk leans into the force.
    const centre: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw },
      {
        x: (body.rest.get("leftFoot")!.x + body.rest.get("rightFoot")!.x) / 2,
        y: 0,
        z: (body.rest.get("leftFoot")!.z + body.rest.get("rightFoot")!.z) / 2,
      },
    );
    const settled: IAutoMovieVector3 = Vector3.lerp(
      feet[back === "left" ? "right" : "left"],
      placed,
      0.5,
    );
    const start: IAutoMovieVector3 = context.entry.posture.root;
    const bent: number = Math.sqrt(
      m.thigh * m.thigh +
        m.shank * m.shank +
        2 * m.thigh * m.shank * Math.cos((KNEE * Math.PI) / 180),
    );
    const lean: number = LEAN;
    const forward: number =
      (Math.atan2(toward.x, toward.z) * 180) / Math.PI - yaw;
    const upright: IAutoMovieMotionHumanPosture["joints"] =
      standUpright(body).joints;
    const relaxed: IAutoMovieMotionHumanPosture["joints"] = {
      ...stand.relaxed(body),
      ...upright,
    };
    const legsAt: ReturnType<typeof stand.prepareLegs> = stand.prepareLegs(
      body,
      yaw,
    );
    const bearing: number = Math.cos((forward * Math.PI) / 180);

    // The geometric set root is lowered over the middle of the final stance.
    const goal: IAutoMovieVector3 = ((): IAutoMovieVector3 => {
      const resolution: ReturnType<typeof prepareHumanPoseResolution> =
        prepareHumanPoseResolution();
      const tilt: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
        relaxed,
        lean * bearing,
      );
      const setAt: (root: IAutoMovieVector3) => IAutoMovieMotionHumanPosture = (
        root: IAutoMovieVector3,
      ): IAutoMovieMotionHumanPosture => {
        return lowerHumanPosture(
          body,
          {
            root,
            yaw,
            pitch: tilt.pitch,
            roll: 0,
            joints: tilt.joints,
            limbs: legsAt(root, {
              left: back === "left" ? placed : feet.left,
              right: back === "right" ? placed : feet.right,
            }),
          },
          lowerHumanPosture.KNEE,
          resolution,
        );
      };
      const at: IAutoMovieVector3 = {
        x: settled.x - centre.x,
        y: settled.y - m.ankleHeight - stand.DROP - (leg - bent),
        z: settled.z - centre.z,
      };
      // The set curve ends on the root the set feet are reachable from, so
      // the stepping leg's landing at `SET` asks lowering for no new drop.
      return setAt(at).root;
    })();

    const events: IAutoMovieMotionHumanActionPlan["events"] = [
      { name: "set", share: SET / duration },
    ];
    const window: HumanPhysics.Window = HumanPhysics.prepare(
      p,
      {},
      context.start,
      { duration, events },
      context.instant,
    );
    const adjust: ReturnType<typeof prepareGroundedBalance> =
      prepareGroundedBalance(body, window, (t: number) =>
        t > swing[0] && t < swing[1]
          ? [back === "left" ? "right" : "left"]
          : ["left", "right"],
      );

    const bodyAt: braceBody.BodyAt = braceBody({
      body,
      duration,
      yaw,
      start,
      goal,
      relaxed,
      lean,
      bearing,
      footAt,
      legsAt,
      adjust,
      window,
      swing,
      back,
      SET,
    });
    const { arms, planned }: braceArms.IArms = braceArms({
      context,
      body,
      m,
      p,
      duration,
      toward,
      left,
      back,
      swing,
      events,
      window,
      bodyAt,
      SET,
      AHEAD,
      SPREAD,
      RECEIVE,
      ELBOW_OUT,
    }); // Once the heel has accepted the load and the set is reached, the body
    // stays in the same stance. Optional balance keeps its live window.
    const heldFrom: number = Math.max(SET, swing[1] + swing[0]);
    if (window === null && heldFrom <= duration) {
      let held: IAutoMovieMotionHumanPosture;
      HumanPreparedPlayback.attach(planned, body, {
        mode: "posture",
        prepare: (): void => {
          held = bodyAt(heldFrom);
        },
        phases: [
          {
            from: heldFrom,
            to: duration,
            sample: (seconds, _channels, resolution) =>
              prepareHumanPoseResolution.isNativeSource(resolution)
                ? {
                    posture: gestureHands.written(
                      structuredClone(held),
                      arms,
                      seconds,
                    ),
                  }
                : undefined,
          },
        ],
      });
    }
    return planned;
  }
}
