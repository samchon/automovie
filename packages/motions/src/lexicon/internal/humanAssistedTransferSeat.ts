import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanAssistedTransfer,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionTarget,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { supportContact } from "../../actions/internal/supportContact";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanObject } from "../../perform/HumanObject";
import { HumanFrame } from "../../posture/internal/HumanFrame";

/*
 * The staged seats of an assisted transfer: resolving a named seat on the
 * actual placed model into its interior contact and the foot stance in front of
 * it, and reading where the helped performer already sits.
 */
export namespace humanAssistedTransferSeat {
  /*
   * Which seat of the transfer: the one the receiver leaves or the one it
   * reaches.
   */
  export type End = "from" | "to";

  /*
   * The discriminant of a prop target.
   */
  export interface IPropKind {
    /*
     * A named point on a staged prop.
     */
    kind: "prop";
  }

  /*
   * A named point on a staged prop, as a motion target.
   */
  export type PropTarget = Extract<IAutoMovieMotionTarget, IPropKind>;

  /*
   * Actual seated contact and the foot stance immediately in front of it.
   */
  export interface ISeat {
    /*
     * Original model affordance address.
     */
    target: PropTarget;

    /*
     * Seat descriptor used by the existing seated actions.
     */
    seat: IAutoMovieMotionHumanSeated.ISeat;

    /*
     * World contact inside the seat.
     */
    at: IAutoMovieVector3;

    /*
     * Heading of the seat relative to the original performer in degrees.
     */
    turn: number;

    /*
     * Left and right foot placements outside the facing edge.
     */
    feet: readonly IAutoMovieMotionHumanSupport.IContact[];
  }

  /*
   * Reject a model reference at the source or destination that exposed it.
   */
  export function refuse(axis: string, value: unknown, reason: string): never {
    throw new HumanRefusal({
      kind: "affordance",
      axis,
      value,
      reason,
      fix: "stage a reachable chair and care surface with named seats",
    });
  }

  /*
   * Resolve the named seat from the actual model and build its interior and
   * floor targets.
   */
  export function place(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAssistedTransfer.IRoleParams>,
    axis: End,
  ): ISeat {
    const ref: IAutoMovieMotionHumanAssistedTransfer.ISeatReference =
      context.params[axis];
    const placed: ReturnType<typeof context.prop> = context.prop(ref.prop);
    const affordances: IAutoMovieAffordance[] = [
      ...(placed.prop.affordances ?? []),
    ];
    const model: IAutoMovieMotionHumanObject.IModel = { affordances };
    const candidate: IAutoMovieAffordance | undefined = affordances.find(
      (value: IAutoMovieAffordance): boolean =>
        value.id === ref.point && value.kind === "seat",
    );
    if (
      candidate === undefined ||
      candidate.depth === undefined ||
      candidate.width === undefined
    )
      return refuse(
        axis,
        ref.point,
        "the staged affordance has no bounded seat",
      );
    const frame: IAutoMovieRigidTransform = placed.frame(context.start);
    const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
      model,
      { position: frame.position, rotation: frame.rotation },
      ref.point,
    );
    const vertical: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.multiply(frame.rotation, candidate.frame.rotation),
      { x: 0, y: 1, z: 0 },
    );
    if (
      vertical.y < 0.999 ||
      seat.at.y <= 0 ||
      seat.at.y >= context.body.measure.stature * 0.4
    )
      return refuse(
        axis,
        ref.point,
        "the seat is not level and within the admitted grounded transfer height",
      );
    const turns: number = seat.yaw - context.entry.posture.yaw;
    const turn: number = ((((turns + 180) % 360) + 360) % 360) - 180;
    const along: number = ref.along ?? 0;
    if (!(Math.abs(along) < candidate.width / 2))
      return refuse(
        axis,
        along,
        "the requested seated station lies beyond the edge",
      );
    const local: IAutoMovieMotionHumanFrame = {
      origin: seat.at,
      yaw: seat.yaw,
    };
    const floor: readonly IAutoMovieVector3[] = supportContact.onFloors(
      context.body,
      context.entry.posture,
      ["leftFoot", "rightFoot"],
    );
    const station: number = Math.min(
      candidate.depth / 2,
      context.body.measure.stature * 0.1,
    );
    const spacing: number = Vector3.distance(floor[0]!, floor[1]!) / 2;
    const feet: IAutoMovieMotionHumanSupport.IContact[] = (
      ["left", "right"] as const
    ).map(
      (side: AutoMovieHumanSide): IAutoMovieMotionHumanSupport.IContact => ({
        part: `${side}Foot`,
        kind: "bear",
        target: {
          kind: "point",
          frame: "world",
          at: HumanFrame.point(local, {
            x: along + (side === "left" ? spacing : -spacing),
            y: -seat.at.y,
            z: station,
          }),
          normal: { x: 0, y: 1, z: 0 },
        },
      }),
    );
    return {
      target: { kind: "prop", subject: ref.prop, point: ref.point },
      seat: { ...seat, at: HumanFrame.point(local, { x: along, y: 0, z: 0 }) },
      at: HumanFrame.point(local, { x: along, y: 0, z: -station }),
      turn,
      feet,
    };
  }

  /*
   * Read the actual projected seat contact supplied by the preceding sit.
   */
  export function occupied(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAssistedTransfer.IRoleParams>,
    from: ISeat,
  ): IAutoMovieVector3 {
    if (
      context.entry.base.kind !== "seated" ||
      context.entry.base.seat === undefined ||
      Vector3.distance(context.entry.base.seat.at, from.seat.at) > 0.01
    )
      return refuse(
        "from",
        from.target.point,
        "the helped actor must already be seated on the named source",
      );
    const contact: IAutoMovieMotionHumanSupport.IContact = {
      part: "seat",
      kind: "bear",
      target: from.target,
    };
    const point: IAutoMovieVector3 = supportContact.points(
      context.body,
      context.entry.posture,
      [{ contact, at: from.at }],
    )[0]!;
    return { ...point, y: from.seat.at.y };
  }
}
