import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionPropHold,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../../body/internal/readHumanBone";
import { HumanGrip } from "../../handling/internal/HumanGrip";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";

/*
 * Read the prop a hand holds at an action's entry.
 * Parameter context: The action's context.
 * Parameter side: The holding hand.
 * Parameter prop: The prop's subject id.
 * Returns: The prop in the hand's grip frame.
 * An `affordance` refusal when that hand does not hold
 * that prop at the entry, naming what it holds; a `participant` refusal on
 * `side` when the body has no bone for that hand, naming the hands it has.
 */
export function AutoMovieMotionHumanHeld(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  side: AutoMovieHumanSide,
  prop: string,
): IAutoMovieMotionHumanHeld.IHeld {
  const held: string | undefined = context.entry.holds[side];
  if (held !== prop)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "prop",
      value: prop,
      feasible: {
        kind: "alternatives",
        values: held === undefined ? [] : [held],
      },
      reason: `the ${side} hand ${held === undefined ? "holds nothing" : `holds ${held}`}, not ${prop}`,
      fix: `pick ${prop} up with the ${side} hand first, or perform the action with the hand that holds it`,
    });
  // A body without that hand's bone has no frame to hold anything in.
  const handless = (): IAutoMovieMotionHumanRefusal =>
    new HumanRefusal({
      kind: "participant",
      axis: "side",
      value: side,
      feasible: {
        kind: "alternatives",
        values: (["left", "right"] as const).filter(
          (other: AutoMovieHumanSide): boolean =>
            readHumanBone(context.body, `${other}Hand`) !== undefined,
        ),
      },
      reason: `the body has no ${side}Hand bone to hold ${prop} in`,
      fix: "perform the action with a hand the body has, or with a body whose skeleton has that hand",
    });
  if (readHumanBone(context.body, `${side}Hand`) === undefined)
    throw handless();
  const read: IAutoMovieMotionHumanPropReader = context.prop(prop);
  const world: IAutoMovieRigidTransform = read.frame(context.entry.seconds);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    context.body,
    context.entry.pose,
    undefined,
    HumanHand.frameBones(context.body, side, "grip"),
  );
  const rotation: IAutoMovieQuaternion | undefined = bones.get(
    `${side}Hand`,
  )?.worldRotation;
  if (rotation === undefined) throw handless();
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
  return {
    prop,
    side,
    frame: {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(
          world.position,
          HumanHand.frame(context.body, bones, side, "grip").point,
        ),
      ),
      rotation: Quaternion.normalize(
        Quaternion.multiply(inverse, world.rotation),
      ),
    },
    affordances: read.prop.affordances ?? [],
  };
}

/*
 * The prop a hand holds as an action enters, in that hand's own frame: the one
 * reading every action that works with a held thing starts from, whether it
 * brings a glass's lip to the mouth or a blade's point to a target.
 *
 * A held prop is rigid in the hand from the instant its grip closed, so the
 * prop's frame, and with it every point and direction the prop declares, is a
 * constant of the hand's grip frame for as long as it is held. The grip frame
 * is the performance's own: the grip socket's point with the hand bone's
 * rotation, the frame a held prop is carried in. It is read once, at the
 * action's entry, from the displayed prop and the displayed hand, so an action
 * aims what the film shows whichever way the hand took the prop.
 *
 * Whether the hand holds the prop is the entry state's fact
 * (`IHumanEntryState.holds`), never a judgment from how near it lies.
 */
export namespace AutoMovieMotionHumanHeld {
  /*
   * A prop in the grip frame of a hand that has not taken it yet: a grasp's
   * candidate wrist, the prop where it lies, the offset the grip would keep
   * once it closed there.
   * Parameter body: The body.
   * Parameter side: The hand.
   * Parameter prop: The prop's subject id.
   * Parameter lying: The prop's world frame.
   * Parameter affordances: The prop's contacts, in its own frame.
   * Parameter wrist: The candidate hand's wrist, world.
   * Returns: The prop in that hand's grip frame.
   */
  export function grasped(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    prop: string,
    lying: IAutoMovieRigidTransform,
    affordances: readonly IAutoMovieAffordance[],
    wrist: IAutoMovieMotionHumanHeld.IGraspedWrist,
  ): IAutoMovieMotionHumanHeld.IHeld {
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(wrist.rotation);
    const socket: IAutoMovieVector3 = Vector3.add(
      wrist.point,
      Quaternion.rotateVector(
        wrist.rotation,
        HumanHand.offset(body, side, "grip").point,
      ),
    );
    return {
      prop,
      side,
      frame: {
        position: Quaternion.rotateVector(
          inverse,
          Vector3.subtract(lying.position, socket),
        ),
        rotation: Quaternion.normalize(
          Quaternion.multiply(inverse, lying.rotation),
        ),
      },
      affordances,
    };
  }

  /*
   * One of the prop's contacts in the hand's grip frame.
   * Parameter held: The held prop.
   * Parameter id: The affordance's id.
   * Returns: Its point from the grip socket, metres, and the unit direction its
   * `+Y` runs, both in the hand bone's axes.
   * An `affordance` refusal when the prop declares no
   * such contact, listing the ones it has.
   */
  export function point(
    held: IAutoMovieMotionHumanHeld.IHeld,
    id: string,
  ): IAutoMovieMotionHumanHeld.IPointResult {
    const found: IAutoMovieAffordance | undefined = held.affordances.find(
      (affordance: IAutoMovieAffordance): boolean => affordance.id === id,
    );
    if (found === undefined)
      throw new HumanRefusal({
        kind: "affordance",
        axis: "point",
        value: `${held.prop}.${id}`,
        feasible: {
          kind: "alternatives",
          values: held.affordances.map(
            (affordance: IAutoMovieAffordance): string => affordance.id,
          ),
        },
        reason: `${held.prop} declares no contact named ${id}`,
        fix: "name one of the prop's contacts, or hold a prop that declares it",
      });
    return {
      point: Vector3.add(
        held.frame.position,
        Quaternion.rotateVector(held.frame.rotation, found.frame.translation),
      ),
      direction: Vector3.normalize(
        Quaternion.rotateVector(
          held.frame.rotation,
          Quaternion.rotateVector(found.frame.rotation, { x: 0, y: 1, z: 0 }),
        ),
      ),
    };
  }

  /*
   * The grip window that keeps the prop in its hand through a whole action.
   * Parameter held: The held prop.
   * Returns: The contact window.
   */
  export function grip(
    held: IAutoMovieMotionHumanHeld.IHeld,
  ): IAutoMovieMotionHumanContactWindow {
    return {
      part: `${held.side}Hand`,
      kind: "grip",
      from: 0,
      to: 1,
      support: { kind: "prop", subject: held.prop },
    };
  }

  /*
   * The hold the prop is left in when the action ends, with the fingers the
   * hand had closed on it at the entry and the use that grip was chosen for,
   * since the grip is the same one.
   * Parameter context: The action's context.
   * Parameter held: The held prop.
   * Returns: The hold for the plan.
   */
  export function hold(
    context: Pick<IAutoMovieMotionHumanActionContext, "entry">,
    held: IAutoMovieMotionHumanHeld.IHeld,
  ): IAutoMovieMotionPropHold {
    const use: IAutoMovieMotionPropHold["use"] = context.entry.uses[held.side];
    return {
      side: held.side,
      prop: held.prop,
      from: 0,
      fingers: HumanGrip.fingers(context.entry.pose, held.side),
      ...(use === undefined ? {} : { use }),
    };
  }
}

/*
 * The alternatives of `OfContext`'s site.
 */
type OfContext = "body" | "entry" | "prop";
