import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieAffordance,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanStickBall,
  IAutoMovieMotionPropHold,
  IAutoMovieMotionPropLaunch,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBall } from "../ballStrike/HumanBall";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanGrip } from "../handling/HumanGrip";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { throwObjectCurve } from "../throwing/throwObjectCurve";
import { admitPuckContact } from "./admitPuckContact";
import { stickBallClock } from "./stickBallClock";
import { stickBallModel } from "./stickBallModel";
import { stickBallPoint } from "./stickBallPoint";

/**
 * A hockey blade push or a lacrosse pocket exchange. The carrier owns the foot
 * plants or skating path. The two arm goals follow one rigid stick frame, from
 * its displayed starting pose through the working cue to a follow-through. A
 * hand that does not already hold the stick first reaches its grip from the
 * entry arm, timed as a reach-to-grasp, while the stick waits; its grip opens
 * there. The follow-through turns the stick about the top hand's grip. Both
 * hands leave the stick held, so the actions that follow carry it. The ball
 * remains the same named prop.
 *
 * The field push uses the FIH playing face and the ice push reads the puck's
 * radial dimension as well as the blade. The lacrosse scoop seats the ball in
 * the crosse, and the pass declares release on the same clock. The teaching
 * sources are FIH 2026 §2, IIHF 2026–27 §§10 and 13, and USA Lacrosse's Learn
 * the Basics. Phase shares, shaft inclination and default speed are provisional
 * film-staging values.
 */
export namespace stickBall {
  /** This law's action name. */
  export const name: AutoMovieMotionHumanActionKey = "stickBall";

  /** The stroke owns both arms and hands while its carrier retains support. */
  export const overlay: boolean = true;

  /** After contact the performer may reset or begin another stick action. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stickBall: ["fromStrokeEnd", "quick"],
      stand: ["fromStrokeEnd", "smooth"],
    });

  /**
   * Plan the named tool's working contact and the ball's next state.
   *
   * @param context The body, authored props and optional support carrier.
   * @returns A sampled two-hand plan with a prop launch or pocket mount.
   * @throws {HumanRefusal} If a required affordance is absent, a duration or
   *   speed is invalid, a grip is out of reach, or the fitted ice blade misses
   *   the puck rim.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStickBall.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const { params, body } = context;
    if (params.stick === params.ball)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "ball",
        value: params.ball,
        reason: "the stick and the object it moves must be separate props",
        fix: "name distinct stick and ball subjects",
      });
    const duration: number = HumanBound.above(
      "duration",
      params.duration ?? 0.75,
      0,
      "s",
    );
    const head: AutoMovieHumanSide = params.hand ?? "right";
    const rear: AutoMovieHumanSide = head === "left" ? "right" : "left";
    const stick: IAutoMovieMotionHumanPropReader = context.prop(params.stick);
    const ball: IAutoMovieMotionHumanPropReader = context.prop(params.ball);
    const initial: IAutoMovieRigidTransform = stick.frame(context.start);
    const shaft: IAutoMovieAffordance = stickBallPoint(stick, "grip");
    const arm: number = body.measure.upperArm + body.measure.forearm;
    const gap: number =
      shaft.length === undefined ? 0 : Math.min(shaft.length / 3, 0.55 * arm);
    HumanBound.above("grip", gap, 0, "m");
    /** Each hand's grip on the shaft, in the stick's frame. */
    const gripOf: (hand: AutoMovieHumanSide) => IAutoMovieVector3 = (
      hand: AutoMovieHumanSide,
    ): IAutoMovieVector3 =>
      Vector3.add(
        shaft.frame.translation,
        Vector3.scale(stickBallModel.UP, ((hand === head ? -1 : 1) * gap) / 2),
      );

    // A hand that does not hold the stick at the entry (`entry.holds`) takes
    // its grip first, timed as a reach-to-grasp onto the shaft (McIntosh,
    // Mon-Williams and Tresilian 2018, `AutoMovieMotionHumanTiming.aimed`),
    // while the stick waits where it stands; the stroke then runs on its own
    // shares. A hand that holds it keeps it from the entry.
    const reaching: AutoMovieHumanSide[] = [head, rear].filter(
      (hand: AutoMovieHumanSide): boolean =>
        context.entry.holds[hand] !== params.stick,
    );
    let taken: number = 0;
    for (const hand of reaching) {
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        context.entry.pose,
        undefined,
        HumanHand.frameBones(body, hand, "grip"),
      );
      taken = Math.max(
        taken,
        AutoMovieMotionHumanTiming.aimed(
          Vector3.length(
            Vector3.subtract(
              stickBallModel.world(initial, gripOf(hand)),
              HumanHand.frame(body, bones, hand, "grip").point,
            ),
          ),
          shaft.width ?? 0,
        ),
      );
    }
    const clock: IAutoMovieMotionClock = stickBallClock(taken, duration);
    const seconds: number = clock.at("stroke");
    const filmSecond: number = context.start + seconds;
    const base: IAutoMovieMotionHumanActionPlan =
      AutoMovieMotionHumanBase.under(context, clock.duration);
    const cue: IAutoMovieMotionHumanPosture = base.posture(seconds);

    const ballFrame: IAutoMovieRigidTransform = ball.frame(filmSecond);
    const ballShape: HumanBall.IBall = HumanBall.placed(
      ball.prop,
      () => ballFrame,
      "ball",
    );
    const scoop: boolean = params.kind === "lacrosseScoop";
    const pocketPass: boolean = params.kind === "lacrossePass";
    const pocket: boolean = scoop || pocketPass;
    const ice: boolean = params.kind === "iceHockey";
    const working: IAutoMovieAffordance = stickBallPoint(
      stick,
      pocket ? "pocket" : "blade",
    );
    if (scoop) stickBallPoint(stick, "scoop");
    if (pocketPass) {
      const mount: ReturnType<
        NonNullable<IAutoMovieMotionHumanPropReader["mountAt"]>
      > = ball.mountAt?.(context.start);
      if (mount?.prop !== params.stick || mount.point !== "pocket")
        throw new HumanRefusal({
          kind: "affordance",
          axis: "ball",
          value: params.ball,
          reason:
            "the passing crosse must already carry the ball in its pocket",
          fix: "scoop the ball or mount it to this crosse's pocket before passing",
        });
      const separation: number = Vector3.length(
        Vector3.subtract(
          stickBallModel.world(initial, working.frame.translation),
          ball.frame(context.start).position,
        ),
      );
      if (separation > ballShape.radius / 2)
        throw new HumanRefusal({
          kind: "reach",
          axis: "ball",
          value: separation,
          reason:
            "the ball is outside the working pocket at the start of the pass",
          fix: "scoop or mount the ball into the crosse before this action",
        });
    }

    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      HumanFrame.turn(cue.yaw),
      stickBallModel.FORWARD,
    );
    const target: IAutoMovieVector3 | undefined =
      params.target === undefined
        ? undefined
        : context.aim(params.target, filmSecond).point;
    const delta: IAutoMovieVector3 =
      target === undefined
        ? forward
        : Vector3.subtract(target, ballShape.centre);
    const horizontal: IAutoMovieVector3 = { x: delta.x, y: 0, z: delta.z };
    HumanBound.above("target", Vector3.length(horizontal), 0, "m");
    const line: IAutoMovieVector3 = Vector3.normalize(horizontal);
    const yaw: number = (Math.atan2(line.x, line.z) * 180) / Math.PI;

    const side: number = head === "left" ? 1 : -1;
    // The ice blade's long edge stays horizontal. The crosse passes under
    // the loose ball with its open face turned nearly up.
    const pitch: number = scoop ? -80 : ice ? -35 : 0;
    const roll: number = pocketPass ? 148 * side : ice ? 0 : 28 * side;
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      HumanFrame.turn(yaw),
      Quaternion.multiply(
        Quaternion.fromAxisAngle(stickBallModel.SIDE, pitch),
        Quaternion.fromAxisAngle(stickBallModel.FORWARD, roll),
      ),
    );
    const rim: IAutoMovieAffordance | undefined = ice
      ? stickBallPoint(ball, "rim")
      : undefined;
    const radial: number =
      rim === undefined
        ? ballShape.radius
        : HumanBound.above("rim", (rim.width ?? 0) / 2, 0, "m");
    const strokePoint: IAutoMovieVector3 = pocketPass
      ? Vector3.add(
          AutoMovieMotionHumanPlaced.shoulders(body, cue),
          Vector3.scale(line, 0.4 * arm),
        )
      : scoop
        ? ballFrame.position
        : Vector3.subtract(ballShape.centre, Vector3.scale(line, radial));
    const workingPoint: IAutoMovieVector3 = ice
      ? {
          ...working.frame.translation,
          y: Math.min(
            working.frame.translation.y,
            ballShape.radius / Math.cos((pitch * Math.PI) / 180),
          ),
        }
      : working.frame.translation;
    const impact: IAutoMovieRigidTransform = {
      position: Vector3.subtract(
        strokePoint,
        Quaternion.rotateVector(rotation, workingPoint),
      ),
      rotation,
    };
    const travel: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(line, arm * (scoop ? 0.16 : 0.32)),
      { x: 0, y: arm * (scoop ? 0.48 : pocketPass ? -0.16 : 0), z: 0 },
    );
    const followSpan: number = clock.at("strokeEnd") - seconds;
    const through: IAutoMovieVector3 = Vector3.scale(travel, 1 / followSpan);
    const approachPath: (share: number) => IAutoMovieVector3 = throwObjectCurve(
      initial.position,
      stickBallModel.REST,
      impact.position,
      through,
      seconds - taken,
    );
    const followPath: (share: number) => IAutoMovieVector3 = throwObjectCurve(
      impact.position,
      through,
      Vector3.add(impact.position, travel),
      stickBallModel.REST,
      followSpan,
    );
    const approach: ReturnType<typeof AutoMovieMotionClock.prepare> =
      AutoMovieMotionClock.prepare(clock, "gripped", "stroke");
    const follow: ReturnType<typeof AutoMovieMotionClock.prepare> =
      AutoMovieMotionClock.prepare(clock, "stroke", "strokeEnd");
    // The follow-through turns the stick about the top hand's grip, the
    // lever a shot is played with (the bottom hand pushes, the top hand
    // holds the pivot: Lomond, Turcotte and Pearsall 2007, Sports Biomech
    // 6:225), so the working point runs on along the travel while the top
    // hand stays where the stroke left it. Translated whole instead, the
    // stick would carry the top hand across the body, through the other arm.
    const pivot: IAutoMovieVector3 = stickBallModel.world(impact, gripOf(rear));
    const outward: IAutoMovieVector3 = Vector3.subtract(
      stickBallModel.world(impact, workingPoint),
      pivot,
    );
    const along: IAutoMovieVector3 = Vector3.normalize(travel);
    const hinge: IAutoMovieVector3 = Vector3.cross(outward, along);
    const lever: number = Vector3.length(outward);
    const levered: boolean = Vector3.length(hinge) > 1e-6 * lever && lever > 0;
    /** The shared rigid frame sampled by both hands. */
    const tool = (
      posture: IAutoMovieMotionHumanPosture,
      at: number,
    ): IAutoMovieRigidTransform => {
      if (at <= taken) return initial;
      if (at <= seconds)
        return {
          position: approachPath(approach.linear(at)),
          rotation: Quaternion.slerp(
            initial.rotation,
            impact.rotation,
            approach.progress(at),
          ),
        };
      const carried: IAutoMovieVector3 = Vector3.scale(
        Vector3.subtract(posture.root, cue.root),
        follow.progress(at),
      );
      const moved: IAutoMovieVector3 = Vector3.subtract(
        followPath(follow.linear(at)),
        impact.position,
      );
      if (!levered)
        return {
          position: Vector3.add(Vector3.add(impact.position, moved), carried),
          rotation: impact.rotation,
        };
      // The working point's advance along the travel is an arc of the lever.
      const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        Vector3.normalize(hinge),
        (Vector3.dot(moved, along) / lever) * (180 / Math.PI),
      );
      return {
        position: Vector3.add(
          Vector3.add(
            pivot,
            Quaternion.rotateVector(
              turn,
              Vector3.subtract(impact.position, pivot),
            ),
          ),
          carried,
        ),
        rotation: Quaternion.multiply(turn, impact.rotation),
      };
    };

    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    const grips: IAutoMovieMotionHumanContactWindow[] = [];
    // The stick stays in both hands after the stroke, carried with the
    // trunk by the actions that follow until one takes a hand over.
    const holds: IAutoMovieMotionPropHold[] = [];
    const taking: ReturnType<typeof AutoMovieMotionClock.prepare> | undefined =
      taken > 0
        ? AutoMovieMotionClock.prepare(clock, "start", "gripped")
        : undefined;
    for (const hand of [head, rear]) {
      const grip: IAutoMovieVector3 = gripOf(hand);
      const takes: boolean = taking !== undefined && reaching.includes(hand);
      const shoulder: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.joint(
        body,
        cue,
        `${hand}UpperArm`,
      );
      const reach: number = Vector3.length(
        Vector3.subtract(stickBallModel.world(impact, grip), shoulder),
      );
      const handOffset: number = Vector3.length(
        HumanHand.offset(body, hand, "grip", "fist").point,
      );
      if (reach > arm + handOffset)
        throw new HumanRefusal({
          kind: "reach",
          axis: "stick",
          value: reach,
          reason: `the ${hand} hand cannot reach the shaft at the ball contact`,
          fix: "bring the ball within reach of the body on the declared support or change the heading",
        });
      primitives.push(
        ...AutoMovieMotionHumanPlaced.arm({
          body,
          side: hand,
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, hand),
          weight: (at: number): number => (takes ? taking!.progress(at) : 1),
          surface: "grip",
          shape: "fist",
          place: (posture: IAutoMovieMotionHumanPosture, at: number) => {
            const frame: IAutoMovieRigidTransform = tool(posture, at);
            return {
              point: stickBallModel.world(frame, grip),
              facing: Quaternion.rotateVector(
                frame.rotation,
                Vector3.scale(stickBallModel.SIDE, hand === "left" ? -1 : 1),
              ),
              forward: Quaternion.rotateVector(
                frame.rotation,
                stickBallModel.FORWARD,
              ),
            };
          },
        }),
      );
      grips.push({
        part: `${hand}Hand`,
        kind: "grip",
        from: takes ? taken / clock.duration : 0,
        to: 1,
        support: { kind: "prop", subject: params.stick },
      });
      holds.push({
        side: hand,
        prop: params.stick,
        from: takes ? taken / clock.duration : 0,
        fingers: takes
          ? HumanHand.shape(hand, "fist")
          : HumanGrip.fingers(context.entry.pose, hand),
      });
    }

    const action: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base,
        clock,
        contact: "stroke",
        primitives,
      });
    if (ice)
      admitPuckContact(
        context,
        action,
        initial,
        working,
        strokePoint,
        line,
        seconds,
        taken,
      );
    const contacts: IAutoMovieMotionHumanContactWindow[] = [
      ...action.contacts,
      ...grips,
    ];
    if (scoop)
      return {
        ...action,
        contacts,
        holds,
        mounts: [
          {
            prop: params.ball,
            onto: params.stick,
            point: "pocket",
            from: seconds / clock.duration,
          },
        ],
      };

    const speed: number = HumanBound.above(
      "speed",
      params.speed ?? (pocketPass ? 6 : 3),
      0,
      "m/s",
    );
    const launch: IAutoMovieMotionPropLaunch = {
      prop: params.ball,
      seconds,
      point: pocketPass ? strokePoint : ballFrame.position,
      velocity: Vector3.add(
        Vector3.scale(
          pocketPass
            ? Vector3.normalize(
                target === undefined
                  ? line
                  : Vector3.subtract(target, strokePoint),
              )
            : line,
          speed,
        ),
        Vector3.scale(stickBallModel.UP, pocketPass ? 0 : 0.3),
      ),
      ...(rim === undefined
        ? {
            sphere: {
              radius: ballShape.radius,
              centre: stickBallPoint(ball, "grip").frame.translation,
            },
          }
        : {}),
    };
    return { ...action, contacts, holds, launches: [launch] };
  }
}
