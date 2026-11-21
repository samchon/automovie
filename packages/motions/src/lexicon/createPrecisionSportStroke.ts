import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanLexiconPrecisionSportParams,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBall } from "../ballStrike/HumanBall";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingQuality } from "../striking/StrikingQuality";
import { PrecisionStrokeForms } from "./PrecisionStrokeForms";
import { addressPrecisionStroke } from "./addressPrecisionStroke";
import { coursePrecisionStroke } from "./coursePrecisionStroke";

/** The shared authorship contract. Cue strokes also name a supporting surface. */
type Stroke = IAutoMovieMotionHumanLexiconPrecisionSportParams.IHand &
  Partial<
    Pick<IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke, "tool">
  > &
  Partial<
    Pick<IAutoMovieMotionHumanLexiconPrecisionSportParams.ICue, "bridge">
  >;

/** The held implement an implement row names; a bare-hand row names none. */
function implement(params: Stroke): string {
  if (params.tool !== undefined) return params.tool;
  throw new HumanRefusal({
    kind: "parameter",
    axis: "tool",
    value: params.tool,
    reason: "an implement stroke needs the implement its hand holds",
    fix: "name the held implement in tool",
  });
}

/** The cue's least lean over the bed while the bridge hand bears on it, degrees; provisional. */
const BRIDGE_INCLINE: number = 27;

/** Positive, finite authored timing and speed, with admission kept at the stroke. */
function positive(axis: string, value: number): number {
  if (Number.isFinite(value) && value > 0) return value;
  throw new HumanRefusal({
    kind: "parameter",
    axis,
    value,
    reason: `${axis} must be finite and positive`,
    fix: `give a positive ${axis}`,
  });
}

/**
 * Build one row of the held stroke planner. All rows use a resolved ball surface, with a witnessed
 * hand-to-implement-to-ball chain at the authored event. The line and arc paths share the holding
 * and fitting machinery of StrikingBlade.
 */
export function createPrecisionSportStroke<P extends Stroke>(
  name: string,
  form: PrecisionStrokeForms.IForm,
): IAutoMovieMotionHumanActionLaw<P> {
  PrecisionStrokeForms.FORMS.set(name, form);
  return {
    name,
    interrupts: StrikingHeld.follows("strokeEnd"),
    physical: true,
    plan(
      context: IAutoMovieMotionHumanActionContext<P>,
    ): IAutoMovieMotionHumanActionPlan {
      const { body, params } = context;
      const side: AutoMovieHumanSide = params.hand ?? "right";
      const guide: AutoMovieHumanSide = side === "right" ? "left" : "right";
      const cue: boolean = form.point === "tip";
      const impact: number = positive("impact", params.impact ?? form.impact);
      const speed: number = positive("speed", params.speed);
      const seconds: number = context.start + impact;
      const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
        prepare: 0.64 * impact,
        attack: 0.36 * impact,
        follow: 0.36 * impact,
        retract: 0.5 * impact,
      });
      const prop = context.prop(params.ball);
      const incoming: IAutoMovieRigidTransform = prop.frame(seconds);
      const ball: HumanBall.IBall = HumanBall.placed(
        prop.prop,
        (): IAutoMovieRigidTransform => incoming,
        "ball",
      );
      const toward: IAutoMovieVector3 = Vector3.subtract(
        context.aim(params.toward, seconds).point,
        ball.centre,
      );
      const horizontal: IAutoMovieVector3 = { ...toward, y: 0 };
      if (!(Vector3.length(horizontal) > 0))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "toward",
          value: params.toward,
          reason: "the shot needs a horizontal direction away from the ball",
          fix: "give a target with a distinct horizontal position",
        });
      const direction: IAutoMovieVector3 = Vector3.normalize(horizontal);

      // A held implement strikes with its named working point and face; a
      // bare hand strikes with its grip socket and the palm's normal, read
      // in the hand bone's frame at the entry pose.
      const held: IAutoMovieMotionHumanHeld.IHeld | undefined =
        form.bare === true
          ? undefined
          : AutoMovieMotionHumanHeld.of(context, side, implement(params));
      const read: IAutoMovieMotionHumanStrikingHeld.ITool =
        held === undefined
          ? StrikingHeld.bare(body, side)
          : StrikingHeld.read(held, { tip: form.point });
      const entryBones: ReturnType<typeof poseBones> = poseBones(
        body,
        context.entry.pose,
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
      );
      const face: IAutoMovieVector3 =
        held === undefined
          ? Quaternion.rotateVector(
              Quaternion.inverse(entryBones.get(`${side}Hand`)!.worldRotation),
              HumanHand.frame(body, entryBones, side, "palm").normal,
            )
          : AutoMovieMotionHumanHeld.point(held, form.point).direction;
      const tool: IAutoMovieMotionHumanStrikingHeld.ITool = cue
        ? read
        : {
            ...read,
            axis: Vector3.normalize(
              Vector3.subtract(
                read.axis,
                Vector3.scale(face, Vector3.dot(read.axis, face)),
              ),
            ),
            edge: face,
          };
      const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
      const sign: number = side === "right" ? 1 : -1;
      const axis: IAutoMovieVector3 = PrecisionStrokeForms.axis(
        form,
        side,
        direction,
      );
      // A swinging miss passes one ball's diameter under the ball.
      const contact: IAutoMovieVector3 = Vector3.subtract(
        ball.centre,
        Vector3.add(
          Vector3.scale(direction, ball.radius),
          Vector3.scale(up, params.miss === true ? 2 * ball.radius : 0),
        ),
      );
      const arc: IAutoMovieVector3 = Vector3.cross(axis, direction);
      const radius: number = tool.length + body.measure.forearm * 0.25;
      const pivot: IAutoMovieVector3 = Vector3.subtract(
        contact,
        Vector3.scale(axis, radius),
      );
      const path = (
        progress: number,
      ): IAutoMovieMotionHumanStrikingHeld.IHandFrame => {
        if (form.sweep === 0)
          return StrikingHeld.hand(
            tool,
            0,
            Vector3.add(
              contact,
              Vector3.scale(
                direction,
                (progress - 1) * form.draw * body.measure.forearm,
              ),
            ),
            axis,
            cue ? up : direction,
          );
        const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          arc,
          (progress - 1) * form.sweep,
        );
        const along: IAutoMovieVector3 = Quaternion.rotateVector(
          rotation,
          axis,
        );
        const edge: IAutoMovieVector3 = Quaternion.rotateVector(
          rotation,
          direction,
        );
        return StrikingHeld.hand(
          tool,
          0,
          Vector3.add(pivot, Vector3.scale(along, radius)),
          along,
          edge,
        );
      };

      // The follow-through sweeps in front of the trunk: past the contact the
      // swing goes on only while the hand stays ahead of the trunk's front,
      // half the chest's depth before the root's frontal plane, and holds
      // where it would pass into the trunk.
      const forward: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: context.entry.posture.yaw },
        { x: 0, y: 0, z: 1 },
      );
      const front = (progress: number): number =>
        Vector3.dot(
          Vector3.subtract(path(progress).point, context.entry.posture.root),
          forward,
        ) -
        body.measure.chestDepth / 2;
      let cap: number = Infinity;
      if (form.sweep !== 0 && front(1) > 0 && !(front(2) > 0)) {
        let ahead: number = 1;
        let behind: number = 2;
        for (let i: number = 0; i < 40; i++) {
          const middle: number = (ahead + behind) / 2;
          if (front(middle) > 0) ahead = middle;
          else behind = middle;
        }
        cap = ahead;
      }
      const swept = (
        progress: number,
      ): IAutoMovieMotionHumanStrikingHeld.IHandFrame =>
        path(Math.min(progress, cap));

      const plan: IAutoMovieMotionHumanActionPlan = StrikingBlade.plan(
        context,
        {
          tool,
          clock,
          path: swept,
          back: 0,
          advance: "none",
          line: direction,
          stay: false,
          stop: 1,
          turn: sign * form.turn,
          support:
            cue || form.oneHand === true || held === undefined
              ? null
              : {
                  handle: "axis",
                  offset: {
                    x: -2 * StrikingQuality.fist(body.measure.hand),
                    y: 0,
                    z: 0,
                  },
                },
        },
      );

      // The cue slides while the second hand bears on a fixed point on the bed or rail.
      const bridge: IAutoMovieVector3 | undefined =
        params.bridge === undefined
          ? undefined
          : context.aim(params.bridge, seconds).point;
      const bridgeRotation: IAutoMovieQuaternion = HumanHand.rotation(guide, {
        fingers: direction,
        palm: Vector3.scale(up, -1),
      });
      const bridgeBones: ReturnType<typeof poseBones> | undefined =
        bridge === undefined
          ? undefined
          : poseBones(
              body,
              context.entry.pose,
              undefined,
              new Set<AutoMovieHumanoidBone>([`${guide}Hand`]),
            );
      const bridgeEntry: IAutoMovieVector3 | undefined =
        bridgeBones === undefined
          ? undefined
          : HumanHand.frame(body, bridgeBones, guide, "palm").point;
      // A ball below the standing hand's reach, a golf ball on the ground or
      // a cue ball on the bed, is played from an address stance. A bridged
      // cue keeps at least its lean over the bed with the pelvis upright.
      const address: ReturnType<typeof addressPrecisionStroke> =
        addressPrecisionStroke(
          body,
          context.entry.posture,
          context.entry.feet,
          side,
          path(1).point,
          bridge,
          bridge === undefined ? 0 : BRIDGE_INCLINE,
          bridge === undefined ? Infinity : 0,
        );
      const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
        t,
        channels,
        source,
        projection,
      ): IAutoMovieMotionHumanPosture => {
        const influence: number = clock.envelope(
          ["start", "ready"],
          ["relax", "end"],
          t,
        );
        const planned: IAutoMovieMotionHumanPosture = plan.posture(
          t,
          channels,
          source,
          projection,
        );
        if (influence <= 0) return planned;
        const current: IAutoMovieMotionHumanPosture = address(
          planned,
          influence,
        );
        if (
          bridge === undefined ||
          bridgeEntry === undefined ||
          bridgeBones === undefined
        )
          return current;
        const goal: IAutoMovieHumanLimbGoal =
          AutoMovieMotionHumanArmTarget.goal(body, guide, {
            surface: "palm",
            shape: "relaxed",
            point: Vector3.lerp(bridgeEntry, bridge, influence),
            rotation: Quaternion.slerp(
              bridgeBones.get(`${guide}Hand`)!.worldRotation,
              bridgeRotation,
              influence,
            ),
            bend: AutoMovieMotionHumanBend.hang(body, current, guide),
          });
        return {
          ...current,
          limbs: { ...current.limbs, [`${guide}Arm`]: goal },
        };
      };
      const requested: ReadonlySet<AutoMovieHumanoidBone> =
        new Set<AutoMovieHumanoidBone>(
          bridge === undefined
            ? [`${side}Hand`]
            : [`${side}Hand`, `${guide}Hand`],
        );
      const posed: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture.seeded(
          body,
          posture(impact),
          undefined,
          {},
          undefined,
          requested,
        ).pose,
        undefined,
        requested,
      );
      const achieved: IAutoMovieMotionHumanStrikingHeld.IHandFrame = {
        point: HumanHand.frame(body, posed, side, "grip").point,
        rotation: posed.get(`${side}Hand`)!.worldRotation,
      };
      const actual: IAutoMovieVector3 = StrikingHeld.point(tool, achieved);
      const error: number = Vector3.length(Vector3.subtract(actual, contact));
      const tolerance: number = Math.min(0.012, 0.2 * ball.radius);
      if (error > tolerance)
        throw new HumanRefusal({
          kind: "reach",
          axis: "ball",
          value: error,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: tolerance,
            unit: "m",
          },
          reason: `${params.tool ?? `the ${side} hand`}'s working point misses the ball surface by ${error.toFixed(3)} m`,
          fix: "position the performer or choose a grip that reaches the ball at impact",
        });
      const facing: number = Vector3.dot(
        Quaternion.rotateVector(achieved.rotation, face),
        direction,
      );
      if (facing < 0.95)
        throw new HumanRefusal({
          kind: "reach",
          axis: "tool",
          value: facing,
          feasible: { kind: "range", minimum: 0.95, maximum: 1, unit: "" },
          reason:
            "the fitted implement meets the ball across its working direction",
          fix: "align the stance and the grip so the working surface faces the shot",
        });

      if (bridge !== undefined) {
        const miss: number = Vector3.length(
          Vector3.subtract(
            HumanHand.frame(body, posed, guide, "palm").point,
            bridge,
          ),
        );
        if (miss > 0.015)
          throw new HumanRefusal({
            kind: "reach",
            axis: "bridge",
            value: miss,
            feasible: { kind: "range", minimum: 0, maximum: 0.015, unit: "m" },
            reason: `the cue bridge misses its planted palm target by ${miss.toFixed(3)} m`,
            fix: "place the bridge in reach of the guide hand",
          });
      }

      const loft: number = (form.loft * Math.PI) / 180;
      const goals: IAutoMovieMotionHumanActionPlan = {
        ...plan,
        physicalWindow: {
          from: clock.at("strokeStart"),
          to: clock.at("strokeEnd"),
        },
        ...(bridge === undefined ? {} : { hands: [side, guide] }),
        posture,
        launches:
          params.miss === true
            ? []
            : [
                {
                  prop: params.ball,
                  seconds: impact,
                  point: incoming.position,
                  rotation: incoming.rotation,
                  velocity: Vector3.add(
                    Vector3.scale(direction, speed * Math.cos(loft)),
                    Vector3.scale(up, speed * Math.sin(loft)),
                  ),
                  sphere: {
                    radius: ball.radius,
                    centre: Quaternion.rotateVector(
                      Quaternion.inverse(incoming.rotation),
                      Vector3.subtract(ball.centre, incoming.position),
                    ),
                  },
                },
              ],
      };
      // The cue's bridge hand bears on a fixed point of the bed, so the cue
      // stroke keeps its fitted arms; every other stroke lays its arms as one
      // course on the stroke's goals, both hands on a two-handed grip.
      return cue
        ? goals
        : coursePrecisionStroke(
            goals,
            body,
            side,
            context.entry.pose,
            clock,
            form.oneHand === true || held === undefined ? undefined : guide,
          );
    },
  };
}
