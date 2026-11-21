import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { HumanRefusal } from "../law/HumanRefusal";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The precision stroke families: each row's fixed geometry, registered as
 * the row is made (`createPrecisionSportStroke`), and the address each one
 * is played from.
 *
 * The address is where the striker stands for a stroke to meet its ball:
 * the grip lies one implement length back from the contact along the
 * implement's working direction at impact (the bare hand's palm on the
 * contact itself), and the striking shoulder (both shoulders' middle for a
 * two-handed grip) lies within the arm's reach of the grip, on the line the
 * implement continues, so the arm and the implement meet the ball as one
 * lever, the arm-and-club model of the swing (Cochran and Stobbs 1968, The
 * Search for the Perfect Swing). The
 * family's stance is the facing the caller stands the striker at. A take or
 * a staging places its striker there; a scene that needs an approach walks
 * to it first. The stroke itself never steps.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the registry holds, how the address is found, its source and who uses it.
 * @evidence contracts/development/design.md#principled-representation A row's form is its fixed geometry; the address is a pure function of the form, the body, the ball and the facing.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The form record, the registry the rows fill and the address reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The shoulder's offset is read from the body's own quiet stance, not a fixed proportion.
 */
export namespace PrecisionStrokeForms {
  /**
   * Fixed geometry and provisional neutral timing for one stroke. Angles are
   * degrees, timing is seconds, and a linear draw is in forearm lengths.
   */
  export interface IForm {
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

    /** A stroke that uses the racket hand without fixing the free hand to its handle. */
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

    /** The striker's facing, degrees about +Y; the family's stance the caller chooses. */
    yaw: number;

    /** The ball's centre at impact, world metres. */
    ball: IAutoMovieVector3;

    /** The ball's radius, metres. */
    radius: number;

    /** Where the shot goes, world metres. */
    toward: IAutoMovieVector3;

    /** The implement's length from the grip to its working point, metres; 0 for a bare hand. */
    tool: number;
  }

  /** The share of the arm's length the grip lies within, the stroke address's own reach (`addressPrecisionStroke`). */
  export const ARM: number = 0.95;

  /** Each row's form by its name, filled as the rows are made. */
  export const FORMS: Map<string, IForm> = new Map();

  /**
   * The working direction of a row's implement at impact, from the grip to
   * the working point: along the shot for a cue; else down from the
   * horizontal by the row's angle, across the shot to the striking side for
   * a two-handed grip and to the other side for a one-handed one.
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

  /**
   * Where a striker stands to play a row at a ball: the floor point under
   * the root that puts the striking shoulder (the shoulders' middle for a
   * two-handed grip) on the implement's line, the arm's reach back from the
   * grip, the grip one implement length back from the contact.
   *
   * @param props The body, the row, the hand, the facing, the ball, the shot and the implement's length.
   * @returns The floor point, world metres.
   * @throws {HumanRefusal} For a row no stroke has registered.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the chain from the contact to the floor point and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The contact, the grip and the shoulder lie on one line along the implement's working direction; the shoulder's offset from the floor point is the body's own at quiet stance and the facing given.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Contact, grip, shoulder, then the stance's offset.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown row is refused, never given a default form.
   * @evidence contracts/development/implementation.md#efficient-algorithms One quiet-stance forward kinematics per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The working direction is the stroke's own (`axis`), the stance is `stand`'s.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function address(props: IAddress): IAutoMovieVector3 {
    const form: IForm | undefined = FORMS.get(props.row);
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
    const grip: IAutoMovieVector3 = Vector3.subtract(
      contact,
      Vector3.scale(working, props.tool),
    );
    const shoulder: IAutoMovieVector3 = Vector3.subtract(
      grip,
      Vector3.scale(working, ARM * reach(props.body)),
    );
    const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const bones: ReturnType<typeof poseBones> = poseBones(
      props.body,
      resolveHumanPosture(
        props.body,
        stand.posture(props.body, origin, props.yaw),
      ),
    );
    const left: IAutoMovieVector3 = bones.get("leftUpperArm")!.worldPosition;
    const right: IAutoMovieVector3 = bones.get("rightUpperArm")!.worldPosition;
    const offset: IAutoMovieVector3 =
      form.oneHand === true || form.bare === true
        ? props.side === "left"
          ? left
          : right
        : Vector3.scale(Vector3.add(left, right), 0.5);
    return { x: shoulder.x - offset.x, y: 0, z: shoulder.z - offset.z };
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
