import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { placeHumanHandSurface } from "../posture/placeHumanHandSurface";

/**
 * What an arm primitive is given: a hand surface's target, the origin the
 * hand leaves from and returns to, and the wrist goal the two make.
 *
 * The members are `AutoMovieMotionHumanArm`'s, which names them; they live
 * here so the carry, the move and the phrases read them without reading
 * each other.
 */
export namespace AutoMovieMotionHumanArmTarget {
  /**
   * Where a hand surface is on a pose, as an origin in a floor frame.
   *
   * @param body The body.
   * @param bones The pose's resolved bones.
   * @param frame The performer's floor frame at that pose.
   * @param side The hand.
   * @param surface The surface.
   * @returns The origin.
   */
  export function origin(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, "worldPosition" | "worldRotation">
    >,
    frame: IAutoMovieMotionHumanFrame,
    side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface,
  ): IAutoMovieMotionHumanArmTarget.IOrigin {
    return {
      point: HumanFrame.local(
        frame,
        HumanHand.frame(body, bones, side, surface, "relaxed").point,
      ),
      rotation: Quaternion.multiply(
        HumanFrame.turn(-frame.yaw),
        bones.get(`${side}Hand`)!.worldRotation,
      ),
    };
  }

  /**
   * An origin's surface point in the world on a posture.
   *
   * @param posture The posture whose root and heading carry the origin.
   * @param from The origin.
   * @returns The world point, metres.
   */
  export function point(
    posture: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">,
    from: IAutoMovieMotionHumanArmTarget.IOrigin,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      { origin: posture.root, yaw: posture.yaw },
      from.point,
    );
  }

  /**
   * The limb goal that puts a hand surface on its target: the wrist placed
   * for the asked rotation, and the surface declared as the goal's contact so
   * the resolver keeps it on the point when the rotation is out of range.
   *
   * @param body The body.
   * @param side The arm.
   * @param target The target.
   * @returns The goal.
   */
  export function goal(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    target: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "curl">,
  ): IAutoMovieHumanLimbGoal {
    if (target.offset !== undefined)
      return fromWrist(
        placeHumanHandSurface(target.offset, target.point, target.rotation),
        target.bend,
        { ...target.offset },
      );
    const wrist: IAutoMovieMotionHumanHand.IWrist = HumanHand.place(
      body,
      side,
      target.surface,
      target.point,
      target.rotation,
      target.shape,
    );
    const contact: IAutoMovieVector3 = HumanHand.offset(
      body,
      side,
      target.surface,
      target.shape,
    ).point;
    return fromWrist(wrist, target.bend, contact);
  }

  /**
   * Keep an already placed wrist and its actual elbow hint as a contact goal.
   *
   * @param wrist Actual wrist point/rotation from the owning surface placement.
   * @param bend Actual world-metre elbow hint, including a completed default search.
   * @param contact Original hand-local surface offset in metres.
   * @returns A fresh goal wrapper borrowing these numerical payloads; a contact shorter than 1e-9 metres is absent.
   */
  export function fromWrist(wrist: IAutoMovieMotionHumanHand.IWrist, bend: IAutoMovieVector3,
    contact: IAutoMovieVector3): IAutoMovieHumanLimbGoal {
    return assembled(wrist, bend, contact, !(Vector3.length(contact) < 1e-9));
  }

  /**
   * Prepare a fixed hand surface, shape, rotation and bend for varying points.
   * The body's geometry stays unchanged for this reader's lifetime; changed
   * hand geometry or fixed values require new preparation.
   *
   * @param body The body that supplies the actual hand surface offset once.
   * @param side The fixed acting arm.
   * @param target Fixed world rotation/bend and local surface/shape, without the varying surface point or curl.
   * @returns Fresh original wrist/contact goals for each actual world surface point in metres.
   */
  export function prepareGoal(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    target: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "point" | "curl">,
  ): (point: IAutoMovieVector3) => IAutoMovieHumanLimbGoal {
    const contact: IAutoMovieVector3 = { ...HumanHand.offset(
      body, side, target.surface, target.shape,
    ).point };
    const place: (point: IAutoMovieVector3) => IAutoMovieMotionHumanHand.IWrist =
      placeHumanHandSurface.prepare(contact, target.rotation);
    const bend: IAutoMovieVector3 = { ...target.bend };
    const hasContact: boolean = !(Vector3.length(contact) < 1e-9);
    return (point: IAutoMovieVector3): IAutoMovieHumanLimbGoal => {
      const wrist: IAutoMovieMotionHumanHand.IWrist = place(point);
      return assembled(wrist, { ...bend }, hasContact ? { ...contact } : contact, hasContact);
    };
  }

  /**
   * Prepare a fixed local hand surface while world placement keeps varying.
   */
  export function prepareSurfaceGoal(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface, shape: IAutoMovieMotionHumanHand.Shape):
    (target: Pick<IAutoMovieMotionHumanArmTarget.ITarget, "point" | "rotation" | "bend">) => IAutoMovieHumanLimbGoal {
    const contact: IAutoMovieVector3 = { ...HumanHand.offset(body, side, surface, shape).point };
    const hasContact: boolean = !(Vector3.length(contact) < 1e-9);
    return (target: Pick<IAutoMovieMotionHumanArmTarget.ITarget, "point" | "rotation" | "bend">): IAutoMovieHumanLimbGoal =>
      assembled(placeHumanHandSurface(contact, target.point, target.rotation), target.bend,
        hasContact ? { ...contact } : contact, hasContact);
  }

  /**
   * Emit target rows of one body, side, surface and shape, each carrying the
   * surface's hand-local offset read once for all of them.
   */
  export function prepareTarget(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface, shape: IAutoMovieMotionHumanHand.Shape):
    (placement: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "surface" | "shape">) => IAutoMovieMotionHumanArmTarget.ITarget {
    const offset: IAutoMovieVector3 = Object.freeze({ ...HumanHand.offset(body, side, surface, shape).point });
    return (placement: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "surface" | "shape">): IAutoMovieMotionHumanArmTarget.ITarget =>
      ({ surface, shape, ...placement, offset });
  }

  /**
   * Emit sided target rows of one body, side, surface and shape, each
   * carrying the surface's hand-local offset read once for all of them.
   */
  export function prepareSidedTarget(body: IAutoMovieMotionHumanBody, side: AutoMovieHumanSide,
    surface: IAutoMovieMotionHumanHand.Surface, shape: IAutoMovieMotionHumanHand.Shape):
    (placement: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "surface" | "shape">) => IAutoMovieMotionHumanArmTarget.ISided {
    const offset: IAutoMovieVector3 = Object.freeze({ ...HumanHand.offset(body, side, surface, shape).point });
    return (placement: Omit<IAutoMovieMotionHumanArmTarget.ITarget, "surface" | "shape">): IAutoMovieMotionHumanArmTarget.ISided =>
      ({ side, surface, shape, ...placement, offset });
  }
}

/** The one goal field assembly; preparation may share the fixed contact decision. */
function assembled(wrist: IAutoMovieMotionHumanHand.IWrist, bend: IAutoMovieVector3,
  contact: IAutoMovieVector3, hasContact: boolean): IAutoMovieHumanLimbGoal {
  return { point: wrist.point, rotation: wrist.rotation, bend,
    ...(hasContact ? { contact } : {}) };
}
