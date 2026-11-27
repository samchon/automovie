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
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBall } from "../../ballStrike/internal/HumanBall";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { StrikingBlade } from "../../striking/internal/StrikingBlade";
import { StrikingHeld } from "../../striking/internal/StrikingHeld";
import { PrecisionStrokeForms } from "./PrecisionStrokeForms";
import { PrecisionStrokeKeys } from "./PrecisionStrokeKeys";
import { addressPrecisionStroke } from "./addressPrecisionStroke";
import { coursePrecisionStroke } from "./coursePrecisionStroke";
import { precisionStrokeTool } from "./precisionStrokeTool";

/**
 * Build one row of the held stroke planner. All rows use a resolved ball
 * surface, with a witnessed hand-to-implement-to-ball chain at the authored
 * event. The line and arc paths share the holding and fitting machinery of
 * StrikingBlade.
 */
export function createPrecisionSportStroke<P extends Stroke>(
  name: string,
  form: PrecisionStrokeForms.IForm,
): IAutoMovieMotionHumanActionLaw<P> {
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
      const clock: IAutoMovieMotionClock = PrecisionStrokeForms.clock(impact);
      const prop = context.prop(params.ball);
      const incoming: IAutoMovieRigidTransform = prop.frame(seconds);
      const ball: HumanBall.IBall = HumanBall.placed(
        prop.prop,
        (): IAutoMovieRigidTransform => incoming,
        "ball",
      );
      const toward: IAutoMovieVector3 = Vector3.subtract(
        context.aim(params.target, seconds).point,
        ball.centre,
      );
      const horizontal: IAutoMovieVector3 = { ...toward, y: 0 };
      if (!(Vector3.length(horizontal) > 0))
        throw new HumanRefusal({
          kind: "parameter",
          axis: "target",
          value: params.target,
          reason: "the shot needs a horizontal direction away from the ball",
          fix: "give a target with a distinct horizontal position",
        });
      const direction: IAutoMovieVector3 = Vector3.normalize(horizontal);

      // The implement as the hand holds it, or the bare palm, read as the
      // address reads it (`precisionStrokeTool`).
      const held: IAutoMovieMotionHumanHeld.IHeld | undefined =
        form.bare === true
          ? undefined
          : AutoMovieMotionHumanHeld(context, side, implement(params));
      const entryBones: ReturnType<typeof poseBones> = poseBones(
        body,
        context.entry.pose,
        undefined,
        new Set<AutoMovieHumanoidBone>([`${side}Hand`, `${side}UpperArm`]),
      );
      const { tool, face, support }: precisionStrokeTool.IStrokeTool =
        precisionStrokeTool(body, side, form, held, context.entry.pose);
      const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
      const sign: number = side === "right" ? 1 : -1;
      // A swinging miss passes one ball's diameter under the ball.
      const contact: IAutoMovieVector3 = Vector3.subtract(
        ball.centre,
        Vector3.add(
          Vector3.scale(direction, ball.radius),
          Vector3.scale(up, params.miss === true ? 2 * ball.radius : 0),
        ),
      );
      // The swing as the address judged it (`PrecisionStrokeForms.swing`):
      // the backswing and the follow-through held in front of the trunk and
      // within reach, linear rows as much as swinging ones.
      const swept: (
        progress: number,
      ) => IAutoMovieMotionHumanStrikingHeld.IHandFrame =
        PrecisionStrokeForms.swing({
          body,
          form,
          side,
          tool,
          contact,
          direction,
          entry: context.entry.posture,
          shoulder: entryBones.get(`${side}UpperArm`)!.worldPosition,
        });

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
          support,
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
          swept(1).point,
          bridge,
          bridge === undefined ? 0 : BRIDGE_INCLINE,
          bridge === undefined ? Infinity : 0,
        );
      const open: IAutoMovieMotionHumanPosture["joints"] = HumanHand.shape(
        side,
        "flat",
      );
      // A second hand the entry leaves off the implement (a putter carried in
      // one hand to the address) joins its handle over the address and
      // leaves it over the recovery, from and to its own place at the entry,
      // by the stroke's own presence, as the striking hand leaves its hold
      // (`StrikingBlade`) and the bridge hand its entry: the support goal
      // sits on the implement throughout, so read at the stroke's ends it
      // reached the free hand across the upright trunk to the holding hand's
      // side, the forearm through the spine where the arm course must land.
      const freedBones: ReturnType<typeof poseBones> | undefined =
        bridge === undefined &&
        held !== undefined &&
        context.entry.holds[guide] !== implement(params)
          ? poseBones(
              body,
              context.entry.pose,
              undefined,
              new Set<AutoMovieHumanoidBone>([
                `${guide}Hand`,
                `${guide}LowerArm`,
              ]),
            )
          : undefined;
      const joined = (
        current: IAutoMovieMotionHumanPosture,
        influence: number,
      ): IAutoMovieMotionHumanPosture => {
        const goal: IAutoMovieHumanLimbGoal | undefined =
          current.limbs[`${guide}Arm`];
        if (freedBones === undefined || goal === undefined || influence >= 1)
          return current;
        const hand: IAutoMovieResolvedBone = freedBones.get(`${guide}Hand`)!;
        return {
          ...current,
          limbs: {
            ...current.limbs,
            [`${guide}Arm`]: {
              ...goal,
              point: Vector3.lerp(hand.worldPosition, goal.point, influence),
              rotation: Quaternion.slerp(
                hand.worldRotation,
                goal.rotation ?? hand.worldRotation,
                influence,
              ),
              bend: Vector3.lerp(
                freedBones.get(`${guide}LowerArm`)!.worldPosition,
                goal.bend,
                influence,
              ),
            },
          },
        };
      };
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
        // A bare hand meets the ball open and firm, with the heel and palm of
        // a float serve or the fingers of a set, never the fist a bare strike
        // closes, whose curled fingers stand off the palm into the thigh the
        // swing passes (provisional: no measured digit angles).
        const raw: IAutoMovieMotionHumanPosture = plan.posture(
          t,
          channels,
          source,
          projection,
        );
        const planned: IAutoMovieMotionHumanPosture =
          held === undefined
            ? { ...raw, joints: { ...raw.joints, ...open } }
            : raw;
        if (influence <= 0) return joined(planned, 0);
        // The swing's key poses (address, top, contact, finish): two hands
        // on one implement coil the trunk away from the shot to the top of
        // the backswing, uncoil it square into the contact and turn it on
        // toward the shot to the finish, so the arms stay across the front of
        // the chest instead of through it (`PrecisionStrokeKeys`).
        const keyed: IAutoMovieMotionHumanPosture =
          form.oneHand === true || held === undefined || form.sweep === 0
            ? address(planned, influence)
            : // The keys' turn returns with the address over the recovery,
              // by the same influence: held to the end, the finish's turn left
              // the trunk turned under an arm already back at its entry
              // angles, the forearm through the spine, and the trunk jumped
              // back where the stroke's posture hands over.
              StrikingBlade.turned(
                address(planned, influence),
                influence *
                  sign *
                  (PrecisionStrokeKeys.FINISH *
                    clock.progress("stroke", "strokeEnd", t) -
                    PrecisionStrokeKeys.COIL *
                      clock.progress("start", "ready", t) *
                      (1 - clock.progress("strokeStart", "stroke", t))),
              );
        const current: IAutoMovieMotionHumanPosture = keyed;
        if (
          bridge === undefined ||
          bridgeEntry === undefined ||
          bridgeBones === undefined
        )
          return joined(current, influence);
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
            HumanHand.frame(body, entryBones, side, "grip").point,
            form.oneHand === true || held === undefined ? undefined : guide,
          );
    },
  };
}

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

/**
 * The cue's least lean over the bed while the bridge hand bears on it, degrees;
 * provisional.
 */
const BRIDGE_INCLINE: number = 27;

/**
 * Positive, finite authored timing and speed, with admission kept at the
 * stroke.
 */
function positive(axis: string, value: number): number {
  if (value > 0) return value;
  throw new HumanRefusal({
    kind: "parameter",
    axis,
    value,
    reason: `${axis} must be finite and positive`,
    fix: `give a positive ${axis}`,
  });
}
