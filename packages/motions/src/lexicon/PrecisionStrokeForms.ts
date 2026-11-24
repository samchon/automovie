import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStrikingHeld,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanTrunk } from "../compose/AutoMovieMotionHumanTrunk";
import { fitClearArmPose } from "../compose/fitClearArmPose";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingBlade } from "../striking/StrikingBlade";
import { StrikingHeld } from "../striking/StrikingHeld";
import { StrikingSupport } from "../striking/StrikingSupport";
import { PRECISION_STROKE_FORMS } from "./PRECISION_STROKE_FORMS";
import { addressPrecisionStroke } from "./addressPrecisionStroke";
import { coursePrecisionStroke } from "./coursePrecisionStroke";
import { holdPrecisionSwing } from "./holdPrecisionSwing";
import { precisionStrokeTool } from "./precisionStrokeTool";

/**
 * The precision stroke families: each row's fixed geometry, registered as the
 * row is made (`createPrecisionSportStroke`), and the address each one is
 * played from.
 *
 * The address is where the striker stands for a stroke to meet its ball: the
 * grip lies where the implement, as the hand holds it, puts its working point
 * on the contact with its face toward the shot (the bare hand's palm on the
 * contact itself), and the striking shoulder (both shoulders' middle for a
 * two-handed grip) lies within the arm's reach of the grip, on the line the
 * implement continues, so the arm and the implement meet the ball as one lever,
 * the arm-and-club model of the swing (Cochran and Stobbs 1968, The Search for
 * the Perfect Swing). From there the stance moves to the nearest place where
 * the arm planner finds the stroke's contact pose clear of the body
 * (`fitClearArmPose`). The family's stance is the facing the caller stands the
 * striker at. A take or a staging places its striker there; a scene that needs
 * an approach walks to it first. The stroke itself never steps.
 */
export namespace PrecisionStrokeForms {
  /**
   * Fixed geometry and provisional neutral timing for one stroke. Angles are
   * degrees, timing is seconds, and a linear draw is in forearm lengths.
   */
  export interface IForm {
    /** Implement's active working affordance. */
    point: string;

    /**
     * Working shaft direction at impact, down from horizontal. A cue points
     * along the shot.
     */
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

    /**
     * A stroke that uses the racket hand without fixing the free hand to its
     * handle.
     */
    oneHand?: true;

    /** A stroke whose striking surface is the bare hand: no implement is held. */
    bare?: true;
  }

  /** What an address is read from. */
  export interface IAddress {
    /** The striker's body. */
    body: IAutoMovieMotionHumanBody;

    /** The row played. */
    row: string;

    /** The striking hand. */
    side: AutoMovieHumanSide;

    /**
     * The striker's facing, degrees about +Y; the family's stance the caller
     * chooses.
     */
    yaw: number;

    /** The ball's centre at impact, world metres. */
    ball: IAutoMovieVector3;

    /** The ball's radius, metres. */
    radius: number;

    /** Where the shot goes, world metres. */
    toward: IAutoMovieVector3;

    /**
     * The implement in the striking hand's grip frame, as the hand will hold it
     * (`AutoMovieMotionHumanHeld.grasped`); none for a bare hand.
     */
    held?: IAutoMovieMotionHumanHeld.IHeld;
  }

  /**
   * The share of the arm's reach the grip lies within at impact: the chord of
   * an arm whose elbow is flexed about 36 degrees, cos 18 degrees for upper arm
   * and forearm of near-equal length, since a striking arm meets the ball with
   * its elbow slightly bent rather than locked; the same reach the stroke
   * address hinges to (`addressPrecisionStroke`). Provisional: no single
   * measured elbow angle at impact holds across these strokes.
   */
  export const ARM: number = 0.95;

  /**
   * The rounds the address places the stance, reads the stroke's pose at
   * contact and places the stance again: the hinge follows the grip's place
   * from the body, which moves little after the first round (provisional).
   */
  export const ADDRESSED: number = 4;

  /**
   * The stance steps the address tries on either side of the arm-and-club
   * place, nearest first and further back before nearer, before it bisects:
   * four steps of a quarter of the arm's reach (`SCAN_STEP`) cover a whole
   * reach each way (provisional).
   */
  export const SCAN: number = 4;

  /** The scan's step, a share of the arm's reach (`reach`); provisional. */
  export const SCAN_STEP: number = 1 / 4;

  /**
   * The bisections between a refused and a clear stance: three cut the step to
   * an eighth, under 25 mm for an adult's reach (provisional).
   */
  export const BISECT: number = 3;

  /**
   * The working direction of a row's implement at impact, from the grip to the
   * working point: along the shot for a cue; else down from the horizontal by
   * the row's angle, across the shot to the striking side for a two-handed grip
   * and to the other side for a one-handed one.
   *
   * @param form The row's form.
   * @param side The striking hand.
   * @param direction The shot's horizontal direction, unit.
   * @returns The unit working direction.
   */
  export function axis(
    form: IForm,
    side: AutoMovieHumanSide,
    direction: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    if (form.point === "tip") return direction;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const across: IAutoMovieVector3 = Vector3.cross(up, direction);
    const down: number = (form.down * Math.PI) / 180;
    const sign: number = side === "right" ? 1 : -1;
    const reach: number = form.oneHand === true ? -sign : sign;
    return Vector3.add(
      Vector3.scale(across, reach * Math.cos(down)),
      Vector3.scale(up, -Math.sin(down)),
    );
  }

  /** What a stroke's swing is laid from. */
  export interface ISwing {
    /** The striker's body. */
    body: IAutoMovieMotionHumanBody;

    /** The row's form. */
    form: IForm;

    /** The striking hand. */
    side: AutoMovieHumanSide;

    /** The implement as the striking hand holds it, or the bare hand. */
    tool: IAutoMovieMotionHumanStrikingHeld.ITool;

    /** Where the working point meets the ball, world metres. */
    contact: IAutoMovieVector3;

    /** The shot's horizontal direction, unit. */
    direction: IAutoMovieVector3;

    /** The stance the stroke enters from: its root and its facing. */
    entry: IAutoMovieMotionHumanPosture;

    /** The striking shoulder at that stance, world metres. */
    shoulder: IAutoMovieVector3;
  }

  /**
   * A stroke's striking hand frame by its swing's progress: the backswing from
   * 0 to the contact at 1 and the follow-through on to 2, along the shot for a
   * linear row (its draw, in forearm lengths) and about the working point's
   * pivot for a swinging one (its sweep). A swinging row's backswing and
   * follow-through keep the whole arm in front of the trunk and within reach:
   * the swing goes back and on only while the arm's line from its shoulder to
   * the hand stays ahead of the trunk's front (the shoulder lies on the root's
   * frontal plane, so the line's middle is half the chest's depth ahead when
   * the hand is a whole depth ahead) and the hand within the arm's reach of the
   * striking shoulder as it stood, and holds where the arm would pass into the
   * trunk or out of reach (`holdPrecisionSwing`). A linear row's short draw is
   * laid as it is.
   *
   * @param props The swing's body, row, hand, implement, contact, shot and
   *   stance.
   * @returns The hand frame by progress, world metres.
   */
  export function swing(
    props: ISwing,
  ): (progress: number) => IAutoMovieMotionHumanStrikingHeld.IHandFrame {
    const { body, form, side, tool, contact, direction } = props;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const cue: boolean = form.point === "tip";
    const working: IAutoMovieVector3 = axis(form, side, direction);
    const arc: IAutoMovieVector3 = Vector3.cross(working, direction);
    const radius: number = tool.length + body.measure.forearm * 0.25;
    const pivot: IAutoMovieVector3 = Vector3.subtract(
      contact,
      Vector3.scale(working, radius),
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
          working,
          cue ? up : direction,
        );
      const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        arc,
        (progress - 1) * form.sweep,
      );
      return StrikingHeld.hand(
        tool,
        0,
        Vector3.add(
          pivot,
          Vector3.scale(Quaternion.rotateVector(rotation, working), radius),
        ),
        Quaternion.rotateVector(rotation, working),
        Quaternion.rotateVector(rotation, direction),
      );
    };
    if (form.sweep === 0) return path;
    const forward: IAutoMovieVector3 = HumanFrame.forward(props.entry.yaw);
    return holdPrecisionSwing(path, (progress: number): number =>
      Math.min(
        Vector3.dot(
          Vector3.subtract(path(progress).point, props.entry.root),
          forward,
        ) - body.measure.chestDepth,
        reach(body) -
          Vector3.length(
            Vector3.subtract(path(progress).point, props.shoulder),
          ),
      ),
    );
  }

  /**
   * Where a striker stands to play a row at a ball: the floor point under the
   * root that puts the striking shoulder (the shoulders' middle for a
   * two-handed grip) on the implement's line, the arm's reach back from the
   * grip, the grip where the held implement puts its working point on the
   * contact; then the nearest stance along that line, further back first, whose
   * contact pose the arm planner finds clear (`contact`), closed on by
   * bisection.
   *
   * @param props The body, the row, the hand, the facing, the ball, the shot
   *   and the implement as the hand holds it.
   * @returns The floor point, world metres.
   * @throws {HumanRefusal} For a row no stroke has registered, or when no
   *   stance within the scan gives a clear contact pose, with the planner's
   *   reason at the line's place.
   */
  export function address(props: IAddress): IAutoMovieVector3 {
    const form: IForm | undefined = PRECISION_STROKE_FORMS[props.row];
    if (form === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "row",
        value: props.row,
        reason: `no precision stroke is named ${props.row}`,
        fix: "name a registered precision stroke row",
      });
    const direction: IAutoMovieVector3 = Vector3.normalize({
      x: props.toward.x - props.ball.x,
      y: 0,
      z: props.toward.z - props.ball.z,
    });
    const working: IAutoMovieVector3 = axis(form, props.side, direction);
    const contact: IAutoMovieVector3 = Vector3.subtract(
      props.ball,
      Vector3.scale(direction, props.radius),
    );
    // The shoulder is read from the stroke's own pose at contact: the quiet
    // stance at the facing given, hinged at the hips to the grip as the
    // stroke's address hinges it (`addressPrecisionStroke`) and turned toward
    // the shot by the row's trunk turn. The hinge depends on where the grip
    // lies from the body, so the stance is placed, the pose read, and the
    // stance placed again until the shoulder stands on its place.
    const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const stance: IAutoMovieMotionHumanPosture = stand.posture(
      props.body,
      origin,
      props.yaw,
    );
    const feet: Readonly<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>
    > = AutoMovieMotionHumanTrunk.footing(props.body, stance);
    // The stroke's own tool and its hand frame at the contact, as the stroke
    // reads them (`precisionStrokeTool`): the grip lies where the tool's
    // working point meets the ball with its face toward the shot.
    const stroke: precisionStrokeTool.IStrokeTool = precisionStrokeTool(
      props.body,
      props.side,
      form,
      props.held,
      resolveHumanPosture(props.body, stance),
    );
    const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame =
      StrikingHeld.hand(
        stroke.tool,
        0,
        contact,
        working,
        form.point === "tip" ? { x: 0, y: 1, z: 0 } : direction,
      );
    const grip: IAutoMovieVector3 = frame.point;
    const sign: number = props.side === "right" ? 1 : -1;
    const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      sign * form.turn,
    );
    const span: number = ARM * reach(props.body);
    const back: IAutoMovieVector3 = Vector3.normalize({
      x: -working.x,
      y: 0,
      z: -working.z,
    });
    let at: IAutoMovieVector3 = origin;
    for (let i: number = 0; i < ADDRESSED; i++) {
      const local: IAutoMovieVector3 = Vector3.subtract(grip, at);
      const posture: IAutoMovieMotionHumanPosture =
        form.point === "tip"
          ? stance
          : addressPrecisionStroke(
              props.body,
              stance,
              feet,
              props.side,
              local,
              undefined,
              0,
              Infinity,
            )(stance, 1);
      const bones: ReturnType<typeof poseBones> = poseBones(
        props.body,
        resolveHumanPosture(props.body, posture),
      );
      const left: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
      const right: IAutoMovieVector3 =
        bones.get("rightUpperArm")!.worldPosition;
      const standing: IAutoMovieVector3 =
        form.oneHand === true || form.bare === true
          ? props.side === "left"
            ? left
            : right
          : Vector3.scale(Vector3.add(left, right), 0.5);
      const offset: IAutoMovieVector3 = Vector3.add(
        { x: posture.root.x, y: 0, z: posture.root.z },
        Quaternion.rotateVector(
          turn,
          Vector3.subtract(standing, {
            x: posture.root.x,
            y: 0,
            z: posture.root.z,
          }),
        ),
      );

      // A one-handed arm reaches out from the shoulder at its height: the
      // shoulder lies the arm's reach from the grip, the rest of that reach
      // across the floor back along the implement's line. Two hands on one
      // implement hang the arms along it (the arm-and-club line), so the
      // shoulders lie over the line's own horizontal run of the reach, the
      // hinge setting their height. A grip lower than the reach below a
      // one-handed shoulder also lies on that run.
      const drop: number = offset.y - grip.y;
      const across: number =
        (form.oneHand === true || form.bare === true) && Math.abs(drop) < span
          ? Math.sqrt(span * span - drop * drop)
          : Math.max(
              span * Math.hypot(working.x, working.z),
              // Hanging arms lie in front of the chest, never inside it.
              props.body.measure.chestDepth / 2 +
                props.body.measure.upperArmRadius +
                props.body.measure.forearmRadius,
            );
      const shoulder: IAutoMovieVector3 = Vector3.add(
        grip,
        Vector3.scale(back, across),
      );
      at = { x: shoulder.x - offset.x, y: 0, z: shoulder.z - offset.z };
    }
    // A cue's bridged stroke keeps its fitted arms (`createPrecisionSportStroke`).
    if (form.point === "tip") return at;

    // The arm-and-club place is where the lever lines up; the stance is
    // where the arms meet the ball clear of the body. The stroke's contact
    // pose at a stance moved `s` metres back along the line is judged by the
    // arm planner (`fitClearArmPose`); the nearest clear stance is the
    // address, the scan stepping further back first and then nearer, and the
    // bisection closing on the boundary from the refused side.
    const judge = (s: number): fitClearArmPose.Verdict =>
      PrecisionStrokeForms.contact(
        props,
        form,
        stroke,
        contact,
        direction,
        Vector3.add(at, Vector3.scale(back, s)),
      );
    const first: fitClearArmPose.Verdict = judge(0);
    if (first.clear) return at;
    const step: number = SCAN_STEP * reach(props.body);
    for (let k: number = 1; k <= SCAN; k++)
      for (const way of [1, -1]) {
        if (!judge(way * k * step).clear) continue;
        let refused: number = way * (k - 1) * step;
        let clear: number = way * k * step;
        for (let i: number = 0; i < BISECT; i++) {
          const middle: number = (refused + clear) / 2;
          if (judge(middle).clear) clear = middle;
          else refused = middle;
        }
        return Vector3.add(at, Vector3.scale(back, clear));
      }
    throw new HumanRefusal({
      kind: "reach",
      axis: "ball",
      value: props.ball,
      feasible: null,
      reason: `no stance within ${(SCAN * step).toFixed(2)} m of the ${props.row} address meets the ball with the arms clear: ${first.refusal.reason}`,
      fix: "move the ball, or choose a row whose implement reaches it with the arms clear of the body",
    });
  }

  /**
   * The planner's verdict on a stroke's contact pose from one stance: the quiet
   * stance there, turned toward the shot by the row's turn and hinged to the
   * grip as the stroke turns and hinges it at the contact, with the striking
   * hand holding the tool on its swing's contact frame (`swing`) and a second
   * hand on the handle where one grips it.
   *
   * @param props The address asked.
   * @param form The row's form.
   * @param stroke The stroke's tool.
   * @param contacted Where the working point meets the ball, world metres.
   * @param direction The shot's horizontal direction, unit.
   * @param at The stance's floor point, world metres.
   * @returns The planner's verdict (`fitClearArmPose`).
   */
  export function contact(
    props: IAddress,
    form: IForm,
    stroke: precisionStrokeTool.IStrokeTool,
    contacted: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    at: IAutoMovieVector3,
  ): fitClearArmPose.Verdict {
    const stance: IAutoMovieMotionHumanPosture = stand.posture(
      props.body,
      at,
      props.yaw,
    );
    const sign: number = props.side === "right" ? 1 : -1;
    const other: AutoMovieHumanSide = props.side === "right" ? "left" : "right";
    // The swing as the stroke lays it from this stance (`swing`), its grip
    // judged at the contact with the row's turn.
    const path: (
      progress: number,
    ) => IAutoMovieMotionHumanStrikingHeld.IHandFrame = swing({
      body: props.body,
      form,
      side: props.side,
      tool: stroke.tool,
      contact: contacted,
      direction,
      entry: stance,
      shoulder: poseBones(
        props.body,
        resolveHumanPosture(props.body, stance),
      ).get(`${props.side}UpperArm`)!.worldPosition,
    });
    const hinge: ReturnType<typeof addressPrecisionStroke> =
      addressPrecisionStroke(
        props.body,
        stance,
        AutoMovieMotionHumanTrunk.footing(props.body, stance),
        props.side,
        path(1).point,
        undefined,
        0,
        Infinity,
      );
    const frame: IAutoMovieMotionHumanStrikingHeld.IHandFrame = path(1);
    const posture: IAutoMovieMotionHumanPosture = hinge(
      StrikingBlade.turned(stance, sign * form.turn),
      1,
    );
    return fitClearArmPose({
      body: props.body,
      posture: {
        ...posture,
        limbs: {
          ...posture.limbs,
          [`${props.side}Arm`]: StrikingHeld.goal(
            props,
            stroke.tool,
            frame,
            0,
            AutoMovieMotionHumanBend.hang(props.body, posture, props.side),
          ),
          ...(stroke.support === null
            ? {}
            : {
                [`${other}Arm`]: StrikingSupport.goal(
                  props.body,
                  posture,
                  stroke.tool,
                  frame,
                  stroke.support,
                ),
              }),
        },
      },
      side: props.side,
      ...(stroke.support === null
        ? {}
        : { second: other, grasp: coursePrecisionStroke.GRASP }),
    });
  }

  /**
   * A precision stroke's phrase on its clock: the preparation, the attack to
   * the contact, the follow-through and the return, shares of the time from the
   * stroke's start to its contact (provisional).
   *
   * @param impact Seconds from the stroke's start to its contact; positive.
   * @returns The clock, whose `stroke` is the contact.
   */
  export function clock(impact: number): IAutoMovieMotionClock {
    return AutoMovieMotionClock.phrase({
      prepare: 0.64 * impact,
      attack: 0.36 * impact,
      follow: 0.36 * impact,
      retract: 0.5 * impact,
    });
  }

  /**
   * The arm's reach from the shoulder to the grip in the palm, metres: the
   * upper arm, the forearm and half the hand.
   *
   * @param body The body.
   * @returns Metres.
   */
  export function reach(body: IAutoMovieMotionHumanBody): number {
    return body.measure.upperArm + body.measure.forearm + body.measure.hand / 2;
  }
}
