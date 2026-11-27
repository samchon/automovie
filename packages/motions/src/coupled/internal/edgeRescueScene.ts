import { AutoMovieGravity, Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEdgeRescue,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lieDown } from "../../floor/internal/lieDown";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { stuntFallPose } from "../../reaction/internal/stuntFallPose";

/*
 * The edge rescue's shared scene, the same for both roles: the lip and the
 * edge's frame, the timeline (the hang, the release, the catch, the haul and
 * the kneel) and the grip's path. The faller's hands hang on the lip; at
 * release they fall freely until the grip, most of an arm below the lip where
 * the prone rescuer's hand reaches, stops them over `ARREST`. The haul draws
 * the grip up `LIFT` past the lip and back `BACK` over the top. The pull over
 * the lip reaches the rescuer reduced by the capstan `e^(mu pi / 2)` of the arm
 * wrapped over it, and the rescuer's own weight holds it by friction; a pull it
 * cannot hold, or a reach that leaves the rescuer's centre of mass less than
 * `MARGIN` behind the lip, is refused.
 */
export namespace edgeRescueScene {
  /*
   * The scene.
   */
  export interface IScene {
    /*
     * The lip under the faller's hands, world metres.
     */
    lip: IAutoMovieVector3;

    /*
     * How far past the lip the prone rescuer's shoulders lie, metres.
     */
    reach: number;

    /*
     * Unit horizontal out over the drop.
     */
    out: IAutoMovieVector3;

    /*
     * Unit along the edge.
     */
    along: IAutoMovieVector3;

    /*
     * The release, seconds.
     */
    release: number;

    /*
     * The catch, seconds.
     */
    caught: number;

    /*
     * The grip's arrest ends and the haul starts, seconds.
     */
    haul: number;

    /*
     * The haul ends and the kneel starts, seconds.
     */
    kneel: number;

    /*
     * The scene's end, seconds.
     */
    end: number;

    /*
     * Whether the catch holds.
     */
    holds: boolean;

    /*
     * The grip at the catch, world metres.
     */
    grip: IAutoMovieVector3;

    /*
     * The grip at a second of the haul, world metres.
     */
    gripAt(seconds: number): IAutoMovieVector3;
  }

  /*
   * Prepare the scene.
   * Parameter context: The action's context.
   * Parameter p: The parameters.
   * Parameter rescuer: The rescuer's body.
   * Parameter faller: The faller's body.
   * Returns: The scene.
   * If the edge is no ledge, the hang is too short, the
   * rescuer cannot hold the faller's pull, or the reach leaves too little
   * margin.
   */
  export function prepare(
    context: IAutoMovieMotionHumanActionContext,
    p: IAutoMovieMotionHumanEdgeRescue.IParams,
    rescuer: IAutoMovieMotionHumanBody,
    faller: IAutoMovieMotionHumanBody,
  ): IScene {
    const reader: IAutoMovieMotionHumanPropReader = context.prop(p.ledge);
    const edge: IAutoMovieAffordance | undefined =
      reader.prop.affordances?.find(
        (item: IAutoMovieAffordance): boolean =>
          item.id === p.edge && item.kind === "ledge",
      );
    if (edge === undefined)
      throw refusal("edge", p.edge, `${p.ledge} has no ledge ${p.edge}`);
    const world: IAutoMovieRigidTransform = reader.frame(context.start);
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      world.rotation,
      edge.frame.rotation,
    );
    const along: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
      x: 1,
      y: 0,
      z: 0,
    });
    const out: IAutoMovieVector3 = Quaternion.rotateVector(turn, {
      x: 0,
      y: 0,
      z: 1,
    });
    const lip: IAutoMovieVector3 = Vector3.add(
      Vector3.add(
        world.position,
        Quaternion.rotateVector(world.rotation, edge.frame.translation),
      ),
      Vector3.scale(along, p.along ?? 0),
    );
    const hold: number = p.hold ?? HOLD;
    if (!(hold >= DROP))
      throw refusal(
        "hold",
        hold,
        `the rescuer needs ${DROP} s to get down at the lip before the grip goes`,
      );

    // The pull the rescuer's supports must hold, and the margin behind the lip.
    const g: number = AutoMovieGravity.STANDARD;
    const pull: number =
      (faller.massModel.mass * g) / Math.exp((LIP_FRICTION * Math.PI) / 2);
    const holdable: number = GROUND_FRICTION * rescuer.massModel.mass * g;
    const holds: boolean = (p.outcome ?? "caught") === "caught";
    if (holds && pull > holdable)
      throw refusal(
        "partner",
        p.partner,
        `the faller's pull over the lip, ${pull.toFixed(0)} N, exceeds the ${holdable.toFixed(0)} N the rescuer's supports hold`,
      );
    const reach: number = p.reach ?? REACH;
    const margin: number = COM_BEHIND * rescuer.measure.hipHeight - reach;
    if (margin < MARGIN)
      throw refusal(
        "reach",
        reach,
        `the rescuer's centre of mass would lie ${margin.toFixed(3)} m behind the lip, under the ${MARGIN} m margin`,
      );

    // The grip most of an arm below the prone rescuer's shoulders, which lie
    // `reach` past the lip at the height the lying pose holds them over the
    // top.
    // The arm to the grip's centre in the hand: the upper arm, the forearm and
    // half the hand.
    const arm: number =
      rescuer.measure.upperArm +
      rescuer.measure.forearm +
      rescuer.measure.hand / 2;
    const shoulder: number = proneShoulder(rescuer);
    const grip: IAutoMovieVector3 = Vector3.add(
      Vector3.add(lip, Vector3.scale(out, reach)),
      { x: 0, y: shoulder - HANG * arm, z: 0 },
    );
    return timeline({ lip, reach, out, along, hold, holds, grip });
  }

  /*
   * Authored scene geometry and the caught or missed outcome.
   */
  export interface ITimeline extends Pick<
    IScene,
    "lip" | "reach" | "out" | "along" | "holds" | "grip"
  > {
    /*
     * Release time after the staged hang, seconds.
     */
    hold: number;
  }

  /*
   * Prepare the fall and haul clock from the placed lip and catch point.
   * Parameter props: Placed geometry, release instant and outcome.
   * Returns: The timed grip course, which reads no performer or scene.
   */
  export function timeline(props: ITimeline): IScene {
    const { lip, reach, out, along, hold: release, holds, grip } = props;
    const fall: number = Math.sqrt(
      (2 * Math.max(0, lip.y - grip.y)) / AutoMovieGravity.STANDARD,
    );
    const caught: number = release + fall;
    const haul: number = caught + ARREST;
    const kneel: number = haul + HAUL;
    const end: number = holds ? kneel + KNEEL : haul;
    const raised: IAutoMovieVector3 = Vector3.add(lip, {
      ...Vector3.scale(out, reach),
      y: LIFT,
    });
    const over: IAutoMovieVector3 = Vector3.add(lip, {
      ...Vector3.scale(out, -BACK),
      y: LIFT,
    });
    const rise: number = Vector3.distance(grip, raised);
    const retreat: number = Vector3.distance(raised, over);
    const span: number = rise + retreat;
    const gripAt: (seconds: number) => IAutoMovieVector3 = (
      seconds: number,
    ): IAutoMovieVector3 => {
      if (seconds <= haul) return grip;
      const u: number = Math.min(1, (seconds - haul) / HAUL);
      // Minimum jerk along the two stretches by length: up past the lip, then back.
      const s: number = (10 * u ** 3 - 15 * u ** 4 + 6 * u ** 5) * span;
      if (s < rise) return Vector3.lerp(grip, raised, s / rise);
      if (retreat === 0) return over;
      return Vector3.lerp(raised, over, (s - rise) / retreat);
    };
    return {
      lip,
      reach,
      out,
      along,
      release,
      caught,
      haul,
      kneel,
      end,
      holds,
      grip,
      gripAt,
    };
  }

  /*
   * How high a body lying prone holds its shoulder joints over the surface it
   * lies on.
   * Parameter body: The body.
   * Returns: Metres.
   */
  export function proneShoulder(body: IAutoMovieMotionHumanBody): number {
    const prone: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: lieDown.POSES.prone.pitch,
      roll: lieDown.POSES.prone.roll,
      joints: lieDown.POSES.prone.joints,
      limbs: {},
    };
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      resolveHumanPosture.seeded(body, prone).pose,
    );
    return (
      (bones.get("leftUpperArm")!.worldPosition.y +
        bones.get("rightUpperArm")!.worldPosition.y) /
        2 -
      stuntFallPose.lowest(body, prone)
    );
  }

  /*
   * The rescue's refusal.
   */
  function refusal(axis: string, value: unknown, reason: string): AutoMovieMotionHumanRefusal {
    return new AutoMovieMotionHumanRefusal({
      kind: "reach",
      axis,
      value,
      reason,
      fix: "brace a heavier rescuer, reach less far over, or let the catch miss",
    });
  }
}

/*
 * Seconds the faller hangs when the scene states none.
 */
const HOLD: number = 1.2;

/*
 * The least hang, seconds, the rescuer needs to get down at the lip
 * (provisional: a drop to prone).
 */
const DROP: number = 0.8;

/*
 * The rescuer's shoulder past the lip when the scene states none, metres.
 */
const REACH: number = 0.1;

/*
 * The share of the arm's length the hanging grip lies below the shoulders
 * (provisional: the arm reached down nearly straight).
 */
const HANG: number = 0.95;

/*
 * Seconds the catch takes to stop the fall in the grip (provisional).
 */
const ARREST: number = 0.3;

/*
 * Seconds of the haul to above the lip (provisional).
 */
const HAUL: number = 2;

/*
 * Seconds the faller takes to get a knee over and kneel up (provisional).
 */
const KNEEL: number = 1.2;

/*
 * How far above the lip the grip is hauled, metres (provisional: chest height
 * of a kneeling rescuer).
 */
const LIFT: number = 0.35;

/*
 * How far back from the lip the haul ends, metres (provisional).
 */
const BACK: number = 0.5;

/*
 * Static friction of the rescuer's clothing and skin on the top, dimensionless
 * (provisional).
 */
const GROUND_FRICTION: number = 0.6;

/*
 * Friction of the arm over the lip, dimensionless, wrapped through a quarter
 * turn (provisional).
 */
const LIP_FRICTION: number = 0.5;

/*
 * The rescuer's centre of mass behind the shoulders lying prone, hip heights
 * (provisional: about the navel).
 */
const COM_BEHIND: number = 0.45;

/*
 * The least margin the rescuer's centre of mass keeps behind the lip, metres
 * (provisional).
 */
const MARGIN: number = 0.15;
