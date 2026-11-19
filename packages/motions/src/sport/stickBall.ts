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
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { throwObjectCurve } from "../throwing/throwObjectCurve";

/** The producer's shaft axis in its model frame. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
/** The producer's open playing-face direction. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
/** The across-stick rotation axis. */
const SIDE: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
/** Stationary endpoint for the stroke's prepared curves. */
const REST: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/**
 * A hockey blade push or a lacrosse pocket exchange. The carrier owns
 * the foot plants or skating path. The two arm goals follow one rigid
 * stick frame, from its displayed starting pose through the working cue
 * to a follow-through. The ball remains the same named prop.
 *
 * The field push uses the FIH playing face and the ice push reads the puck's
 * radial dimension as well as the blade. The lacrosse scoop seats the
 * ball in the crosse, and the pass declares release on the same clock.
 * The teaching sources are FIH 2026 §2, IIHF 2026–27 §§10 and 13, and
 * USA Lacrosse's Learn the Basics. Phase shares, shaft inclination and
 * default speed are provisional film-staging values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Declares the working affordances, custody, scoped body channels and reference rules.
 * @evidence contracts/development/design.md#principled-representation The rigid stick geometry drives both hands and the same timestamp drives the ball effect.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the plan and its action transition contract.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Support and prop state remain with the carrier and the performance.
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
   * @throws {HumanRefusal} If a required affordance is absent, a duration or speed is invalid, or a grip is out of reach.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the data, result and refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A world cue determines the placed working frame, and each shaft grip remains local to that frame.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the cue and frame path before composing two arm goals and publishing custody.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ball and stick are named props with declared dimensions. Outside an arm-length bound the working position is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms One read of each prop and one two-arm admission at the working cue, plus sampling of a short frame path.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the shared clock, posture carrier, placed arm and prop trajectory owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps only prepared frames, clock and the arm goals. Retains no past sampled frames.
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
    const duration: number = HumanBound.above("seconds", params.seconds ?? 0.75, 0, "s");
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(duration, [
      { name: "stroke", seconds: duration * 0.55 },
      { name: "strokeEnd", seconds: duration * 0.85 },
    ]);
    const seconds: number = clock.at("stroke");
    const filmSecond: number = context.start + seconds;
    const base: IAutoMovieMotionHumanActionPlan = AutoMovieMotionHumanBase.under(context, duration);
    const cue: IAutoMovieMotionHumanPosture = base.posture(seconds);
    const head: AutoMovieHumanSide = params.hand ?? "right";
    const rear: AutoMovieHumanSide = head === "left" ? "right" : "left";

    const stick: IAutoMovieMotionHumanPropReader = context.prop(params.stick);
    const ball: IAutoMovieMotionHumanPropReader = context.prop(params.ball);
    const initial: IAutoMovieRigidTransform = stick.frame(context.start);
    const ballFrame: IAutoMovieRigidTransform = ball.frame(filmSecond);
    const ballShape: HumanBall.IBall = HumanBall.placed(ball.prop, () => ballFrame, "ball");
    const shaft: IAutoMovieAffordance = point(stick, "grip");
    const scoop: boolean = params.kind === "lacrosseScoop";
    const pocketPass: boolean = params.kind === "lacrossePass";
    const pocket: boolean = scoop || pocketPass;
    const ice: boolean = params.kind === "iceHockey";
    const working: IAutoMovieAffordance = point(stick, pocket ? "pocket" : "blade");
    if (scoop) point(stick, "scoop");
    if (pocketPass) {
      const separation: number = Vector3.length(Vector3.subtract(
        world(initial, working.frame.translation),
        ball.frame(context.start).position,
      ));
      if (separation > ballShape.radius / 2)
        throw new HumanRefusal({
          kind: "reach",
          axis: "ball",
          value: separation,
          reason: "the ball is outside the working pocket at the start of the pass",
          fix: "scoop or mount the ball into the crosse before this action",
        });
    }

    const forward: IAutoMovieVector3 = Quaternion.rotateVector(HumanFrame.turn(cue.yaw), FORWARD);
    const target: IAutoMovieVector3 | undefined = params.toward === undefined
      ? undefined
      : context.aim(params.toward, filmSecond).point;
    const delta: IAutoMovieVector3 = target === undefined
      ? forward
      : Vector3.subtract(target, ballShape.centre);
    const horizontal: IAutoMovieVector3 = { x: delta.x, y: 0, z: delta.z };
    HumanBound.above("toward", Vector3.length(horizontal), 0, "m");
    const line: IAutoMovieVector3 = Vector3.normalize(horizontal);
    const yaw: number = (Math.atan2(line.x, line.z) * 180) / Math.PI;

    const arm: number = body.measure.upperArm + body.measure.forearm;
    const side: number = head === "left" ? 1 : -1;
    // The ice blade's long edge stays horizontal. The crosse passes under
    // the loose ball with its open face turned nearly up.
    const pitch: number = scoop ? -80 : ice ? -35 : 0;
    const roll: number = pocketPass ? 148 * side : ice ? 0 : 28 * side;
    const rotation: IAutoMovieQuaternion = Quaternion.multiply(
      HumanFrame.turn(yaw),
      Quaternion.multiply(
        Quaternion.fromAxisAngle(SIDE, pitch),
        Quaternion.fromAxisAngle(FORWARD, roll),
      ),
    );
    const rim: IAutoMovieAffordance | undefined = ice ? point(ball, "rim") : undefined;
    const radial: number = rim === undefined
      ? ballShape.radius
      : HumanBound.above("rim", (rim.width ?? 0) / 2, 0, "m");
    const strokePoint: IAutoMovieVector3 = pocketPass
      ? Vector3.add(AutoMovieMotionHumanPlaced.shoulders(body, cue), Vector3.scale(line, 0.4 * arm))
      : scoop
        ? ballFrame.position
        : Vector3.subtract(ballShape.centre, Vector3.scale(line, radial));
    const workingPoint: IAutoMovieVector3 = ice
      ? {
          ...working.frame.translation,
          y: Math.min(working.frame.translation.y, ballShape.radius / Math.cos((pitch * Math.PI) / 180)),
        }
      : working.frame.translation;
    const impact: IAutoMovieRigidTransform = {
      position: Vector3.subtract(strokePoint, Quaternion.rotateVector(rotation, workingPoint)),
      rotation,
    };
    const travel: IAutoMovieVector3 = Vector3.add(
      Vector3.scale(line, arm * (scoop ? 0.16 : 0.32)),
      { x: 0, y: arm * (scoop ? 0.48 : pocketPass ? -0.16 : 0), z: 0 },
    );
    const followSpan: number = clock.at("strokeEnd") - seconds;
    const through: IAutoMovieVector3 = Vector3.scale(travel, 1 / followSpan);
    const approachPath: (share: number) => IAutoMovieVector3 =
      throwObjectCurve(initial.position, REST, impact.position, through, seconds);
    const followPath: (share: number) => IAutoMovieVector3 =
      throwObjectCurve(impact.position, through, Vector3.add(impact.position, travel), REST, followSpan);
    const approach: ReturnType<typeof AutoMovieMotionClock.prepare> =
      AutoMovieMotionClock.prepare(clock, "start", "stroke");
    const follow: ReturnType<typeof AutoMovieMotionClock.prepare> =
      AutoMovieMotionClock.prepare(clock, "stroke", "strokeEnd");
    /** The shared rigid frame sampled by both hands. */
    const tool = (posture: IAutoMovieMotionHumanPosture, at: number): IAutoMovieRigidTransform => {
      if (at <= seconds)
        return {
          position: approachPath(approach.linear(at)),
          rotation: Quaternion.slerp(initial.rotation, impact.rotation, approach.progress(at)),
        };
      return {
        position: Vector3.add(
          followPath(follow.linear(at)),
          Vector3.scale(Vector3.subtract(posture.root, cue.root), follow.progress(at)),
        ),
        rotation: impact.rotation,
      };
    };

    const gap: number = shaft.length === undefined ? 0 : Math.min(shaft.length / 3, 0.55 * arm);
    HumanBound.above("grip", gap, 0, "m");
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    const grips: IAutoMovieMotionHumanContactWindow[] = [];
    for (const hand of [head, rear]) {
      const grip: IAutoMovieVector3 = Vector3.add(shaft.frame.translation, Vector3.scale(UP, (hand === head ? -1 : 1) * gap / 2));
      const shoulder: IAutoMovieVector3 = AutoMovieMotionHumanPlaced.joint(body, cue, `${hand}UpperArm`);
      const reach: number = Vector3.length(Vector3.subtract(world(impact, grip), shoulder));
      const handOffset: number = Vector3.length(HumanHand.offset(body, hand, "grip", "fist").point);
      if (reach > arm + handOffset)
        throw new HumanRefusal({
          kind: "reach",
          axis: "stick",
          value: reach,
          reason: `the ${hand} hand cannot reach the shaft at the ball contact`,
          fix: "bring the ball within reach of the body on the declared support or change the heading",
        });
      primitives.push(...AutoMovieMotionHumanPlaced.arm({
        body,
        side: hand,
        from: 0,
        to: duration,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, hand),
        weight: () => 1,
        surface: "grip",
        shape: "fist",
        place: (posture: IAutoMovieMotionHumanPosture, at: number) => {
          const frame: IAutoMovieRigidTransform = tool(posture, at);
          return {
            point: world(frame, grip),
            facing: Quaternion.rotateVector(frame.rotation, Vector3.scale(SIDE, hand === "left" ? -1 : 1)),
            forward: Quaternion.rotateVector(frame.rotation, FORWARD),
          };
        },
      }));
      grips.push({ part: `${hand}Hand`, kind: "grip", from: 0, to: 1, support: { kind: "prop", subject: params.stick } });
    }

    const action: IAutoMovieMotionHumanActionPlan = composeAutoMovieMotionHumanAction({
      base,
      clock,
      contact: "stroke",
      primitives,
    });
    const contacts: IAutoMovieMotionHumanContactWindow[] = [...action.contacts, ...grips];
    if (scoop)
      return {
        ...action,
        contacts,
        mounts: [{ prop: params.ball, onto: params.stick, point: "pocket", from: seconds / duration }],
      };

    const speed: number = HumanBound.above("speed", params.speed ?? (pocketPass ? 6 : 3), 0, "m/s");
    const launch: IAutoMovieMotionPropLaunch = {
      prop: params.ball,
      seconds,
      point: pocketPass ? strokePoint : ballFrame.position,
      velocity: Vector3.add(
        Vector3.scale(pocketPass ? Vector3.normalize(target === undefined ? line : Vector3.subtract(target, strokePoint)) : line, speed),
        Vector3.scale(UP, pocketPass ? 0 : 0.3),
      ),
      ...(rim === undefined
        ? { sphere: { radius: ballShape.radius, centre: point(ball, "grip").frame.translation } }
        : {}),
    };
    return { ...action, contacts, launches: [launch] };
  }
}

/** Get a working point from the authored model, or report the missing point. */
function point(reader: IAutoMovieMotionHumanPropReader, id: string): IAutoMovieAffordance {
  const match: IAutoMovieAffordance | undefined = reader.prop.affordances?.find((value) => value.id === id);
  if (match === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "stick",
      value: reader.prop.subject,
      reason: `${reader.prop.subject} does not declare the ${id} affordance`,
      fix: "give the working stick and ball the sport's archetype affordances",
    });
  return match;
}

/** Apply a model's rigid frame to one of its local points. */
function world(frame: IAutoMovieRigidTransform, local: IAutoMovieVector3): IAutoMovieVector3 {
  return Vector3.add(frame.position, Quaternion.rotateVector(frame.rotation, local));
}
