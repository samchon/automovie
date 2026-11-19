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
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingQuality } from "../striking/StrikingQuality";

/** The shared authorship contract. Cue strokes also name a supporting surface. */
type Stroke = IAutoMovieMotionHumanLexiconPrecisionSportParams.IStroke &
  Partial<
    Pick<IAutoMovieMotionHumanLexiconPrecisionSportParams.ICue, "bridge">
  >;

/**
 * Fixed geometry and provisional neutral timing for one sporty stroke. Angles are degrees,
 * timing is seconds, and a linear draw is in forearm lengths.
 */
interface IPrecisionForm {
  /** Implement's active working affordance. */
  point: string;

  /** Working shaft direction at impact, down from horizontal. A cue points along the shot. */
  down: number;

  /** Angular travel to and through the strike for the swinging rows. */
  sweep: number;

  /** Backward and forward travel for short linear rows. */
  draw: number;

  /** Trunk turn toward the shot during the swing. */
  turn: number;

  /** The outgoing ball's inclination above horizontal. */
  loft: number;

  /** Neutral time between action start and strike. */
  impact: number;
}

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
function row<P extends Stroke>(
  name: string,
  form: IPrecisionForm,
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

      const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
        context,
        side,
        params.tool,
      );
      const read: IAutoMovieMotionHumanStrikingHeld.ITool = StrikingHeld.read(
        held,
        { tip: form.point },
      );
      const face: IAutoMovieVector3 = AutoMovieMotionHumanHeld.point(
        held,
        form.point,
      ).direction;
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
      const across: IAutoMovieVector3 = Vector3.cross(up, direction);
      const down: number = (form.down * Math.PI) / 180;
      const sign: number = side === "right" ? 1 : -1;
      const axis: IAutoMovieVector3 = cue
        ? direction
        : Vector3.add(
            Vector3.scale(across, sign * Math.cos(down)),
            Vector3.scale(up, -Math.sin(down)),
          );
      const contact: IAutoMovieVector3 = Vector3.subtract(
        ball.centre,
        Vector3.scale(direction, ball.radius),
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

      const plan: IAutoMovieMotionHumanActionPlan = StrikingBlade.plan(
        context,
        {
          tool,
          clock,
          path,
          back: 0,
          advance: "none",
          line: direction,
          stay: false,
          stop: 1,
          turn: sign * form.turn,
          support: cue
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
      const posture: IAutoMovieMotionHumanActionPlan["posture"] = (
        t,
        channels,
        source,
        projection,
      ): IAutoMovieMotionHumanPosture => {
        const current: IAutoMovieMotionHumanPosture = plan.posture(
          t,
          channels,
          source,
          projection,
        );
        if (
          bridge === undefined ||
          bridgeEntry === undefined ||
          bridgeBones === undefined
        )
          return current;
        const influence: number = clock.envelope(
          ["start", "ready"],
          ["relax", "end"],
          t,
        );
        if (influence <= 0) return current;
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
          joints: HumanTrunk.incline(current.joints, 27 * influence, 0).joints,
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
          reason: `${params.tool}'s working point misses the ball surface by ${error.toFixed(3)} m`,
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
      return {
        ...plan,
        physicalWindow: {
          from: clock.at("strokeStart"),
          to: clock.at("strokeEnd"),
        },
        ...(bridge === undefined ? {} : { hands: [side, guide] }),
        posture,
        launches: [
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
    },
  };
}

/**
 * Bound sporting strokes for baseball, cricket, golf and pool. A row uses the implement's
 * named contact with the ball participating in the shared prop timeline. Studies inform the
 * distinction between full swings and short smooth strokes: Welch et al. 1995 (PMID 8580946),
 * Stuelcken et al. 2005 (PMID 15807374), Walsh et al. 2024 (ISBS 42.265), Robbins et al. 2025
 * (doi:10.3390/bioengineering12010069) and Haar et al. 2020 (doi:10.1038/s41598-020-76805-9).
 * Neutral lengths, angles and timing in this first pass are provisional. Stance and approach are composed separately.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the source of motion choices, the bound interaction, and provisional controls.
 * @evidence contracts/development/design.md#principled-representation Each row supplies a form to the held stroke planner, with dedicated arc and line paths and one witnessed launch.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The rows share the same timed contact and give cue its separate bridge target.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses existing grip, limb and prop flight machinery with the input ball's actual size and world frame.
 */
export namespace HumanPrecisionSport {
  /** A two-handed level bat swing through a pitch. */
  export const baseballHit: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["baseballHit"]
  > = row("baseballHit", {
    point: "strike",
    down: 4,
    sweep: 75,
    draw: 0,
    turn: 18,
    loft: 8,
    impact: 0.55,
  });

  /** A two-handed cricket drive through the post-bounce ball, from an authored front-foot stance. */
  export const cricketDrive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["cricketDrive"]
  > = row("cricketDrive", {
    point: "blade",
    down: 76,
    sweep: 55,
    draw: 0,
    turn: 9,
    loft: 0,
    impact: 0.55,
  });

  /** A two-handed full drive through the club face. */
  export const golfDrive: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["golfDrive"]
  > = row("golfDrive", {
    point: "face",
    down: 72,
    sweep: 102,
    draw: 0,
    turn: 25,
    loft: 13,
    impact: 0.85,
  });

  /** A compact two-handed chip with a steeper launch. */
  export const golfChip: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["golfChip"]
  > = row("golfChip", {
    point: "face",
    down: 78,
    sweep: 31,
    draw: 0,
    turn: 6,
    loft: 28,
    impact: 0.52,
  });

  /** A short putting stroke along the chosen green line. */
  export const golfPutt: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["golfPutt"]
  > = row("golfPutt", {
    point: "face",
    down: 79,
    sweep: 0,
    draw: 0.35,
    turn: 2,
    loft: 0,
    impact: 0.48,
  });

  /** A one-handed cue stroke with the other hand set on the table. */
  export const cueStroke: IAutoMovieMotionHumanActionLaw<
    IAutoMovieMotionHumanLexiconPrecisionSportParams["cueStroke"]
  > = row("cueStroke", {
    point: "tip",
    down: 0,
    sweep: 0,
    draw: 0.4,
    turn: 0,
    loft: 0,
    impact: 0.48,
  });
}
