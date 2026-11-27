import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPutDown,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmReach } from "../../compose/AutoMovieMotionHumanArmReach";
import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { HumanRefusal } from "../../law/HumanRefusal";
import { poseBones } from "../../posture/internal/poseBones";
import { HumanGrasp } from "../HumanGrasp";
import { pickUp } from "./pickUp";
import { putDown } from "./putDown";
import { putDownTarget } from "./putDownTarget";

/**
 * The wrist a put down lays its prop with: the rigid hand-to-prop offset the
 * grip keeps (the displayed hand and prop at the start), then the hand that
 * holds the prop at its destination by that offset. A declared resting attitude
 * is laid exactly, at the asked heading or the nearest the arm meets
 * (`AutoMovieMotionHumanArmReach.attitude`); a placement on the performer's
 * bone or another prop's socket is laid on that frame; a free placement keeps
 * an authored heading, or rests at whichever heading the arm can lay it down at
 * exactly (`HumanGrasp.reachable` over `putDown.HEADINGS`).
 *
 * @param context The put down's context.
 * @param side The holding hand.
 * @param body The performer's body.
 * @param held The entry posture.
 * @returns The hand, the grip's offset, the elbow's hint, the destination's
 *   kind and the chosen wrist.
 * @throws {HumanRefusal} When no destination is named.
 */
export function putDownWrist(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDown.IParams>,
  side: AutoMovieHumanSide,
  body: IAutoMovieMotionHumanBody,
  held: IAutoMovieMotionHumanPosture,
): putDownWrist.IWrist {
  // The hand-to-prop offset the grip keeps, from the displayed frames now.
  const hand: IAutoMovieResolvedBone = poseBones(
    body,
    context.entry.pose,
    undefined,
    new Set<AutoMovieHumanoidBone>([`${side}Hand`]),
  ).get(`${side}Hand`)!;
  const prop: IAutoMovieRigidTransform = context
    .prop(context.params.prop)
    .frame(context.start);
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(hand.worldRotation);
  const offset: IAutoMovieRigidTransform = {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(prop.position, hand.worldPosition),
    ),
    rotation: Quaternion.multiply(inverse, prop.rotation),
  };

  // The prop's resting frame, then the hand that holds it there.
  const heading: (q: IAutoMovieQuaternion) => number = (
    q: IAutoMovieQuaternion,
  ): number => {
    const f: IAutoMovieVector3 = Quaternion.rotateVector(q, {
      x: 0,
      y: 0,
      z: 1,
    });
    return (Math.atan2(f.x, f.z) * 180) / Math.PI;
  };
  // Turn the prop's declared rest attitude to the requested heading.
  const authored: IAutoMovieQuaternion = context.prop(context.params.prop).prop
    .frame.rotation;
  const declaredHeading: number = heading(authored);
  const unhold: IAutoMovieQuaternion = Quaternion.inverse(offset.rotation);
  const holding: (yaw: number) => IAutoMovieMotionHumanHand.IWrist = (
    yaw: number,
  ): IAutoMovieMotionHumanHand.IWrist => {
    const rest: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, yaw - declaredHeading),
        authored,
      ),
    );
    const r: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(rest, unhold),
    );
    return {
      point: Vector3.subtract(
        context.params.to!,
        Quaternion.rotateVector(r, offset.position),
      ),
      rotation: r,
    };
  };

  // An authored heading is kept; otherwise the prop may rest at whichever
  // heading the arm can lay it down at exactly.
  const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    body,
    held,
    side,
  );
  const on: IAutoMovieMotionHumanPutDown.IParams["on"] = context.params.on;
  const onto: IAutoMovieMotionHumanPutDown.IParams["onto"] =
    context.params.onto;
  const wearing: IAutoMovieRigidTransform | undefined = putDownTarget(
    context,
    (): IAutoMoviePose => context.entry.pose,
  );
  if (wearing === undefined && context.params.to === undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "to",
      value: "absent",
      feasible: { kind: "alternatives", values: ["at", "on", "onto"] },
      reason:
        "a put down names where the prop goes: a place, a bone or another prop's socket",
      fix: "give `at`, a world point, `on`, a bone of the performer and the prop's frame on it, or `onto`, another prop's socket",
    });
  // A declared resting attitude is laid exactly, through the same grip.
  const attitude: IAutoMovieQuaternion | undefined =
    wearing === undefined ? context.params.rotation : undefined;
  const chosen: IAutoMovieMotionHumanHand.IWrist =
    attitude !== undefined
      ? ((): IAutoMovieMotionHumanHand.IWrist => {
          const asked: IAutoMovieQuaternion = Quaternion.normalize(
            Quaternion.multiply(Quaternion.normalize(attitude), unhold),
          );
          const at: (r: IAutoMovieQuaternion) => IAutoMovieVector3 = (
            r: IAutoMovieQuaternion,
          ): IAutoMovieVector3 =>
            Vector3.subtract(
              context.params.to!,
              Quaternion.rotateVector(r, offset.position),
            );
          // An authored resting attitude with no authored heading rests
          // alike at any heading about the vertical (a card face up): the
          // hand takes the heading nearest the asked one at which the arm
          // meets the attitude, or the placement is refused
          // (`AutoMovieMotionHumanArmReach`). An authored heading is laid
          // exactly.
          const r: IAutoMovieQuaternion =
            context.params.yaw !== undefined
              ? asked
              : AutoMovieMotionHumanArmReach.attitude({
                  body,
                  posture: held,
                  side,
                  bend: AutoMovieMotionHumanBend.hang(body, held, side),
                  requested: asked,
                  axis: { x: 0, y: 1, z: 0 },
                  wrist: at,
                  name: "rotation",
                }).rotation;
          return { point: at(r), rotation: r };
        })()
      : wearing !== undefined
        ? ((): IAutoMovieMotionHumanHand.IWrist => {
            const r: IAutoMovieQuaternion = Quaternion.normalize(
              Quaternion.multiply(
                wearing.rotation,
                Quaternion.inverse(offset.rotation),
              ),
            );
            return {
              point: Vector3.subtract(
                wearing.position,
                Quaternion.rotateVector(r, offset.position),
              ),
              rotation: r,
            };
          })()
        : context.params.yaw === undefined
          ? HumanGrasp.reachable(
              body,
              held,
              side,
              bend,
              (turn: number): IAutoMovieMotionHumanHand.IWrist =>
                holding(heading(prop.rotation) + turn),
              undefined,
              undefined,
              // The heading is free the whole way round, so every one is
              // the arm's to choose from, nearest the prop's own first.
              putDown.HEADINGS,
              undefined,
              // A turn that puts the wrist beyond the arm, which the reach
              // below refuses, is tried only when every turn does.
              pickUp.reaches(context, side),
            ).wrist
          : holding(context.params.yaw);
  return { hand, offset, bend, on, onto, attitude, chosen };
}

/** The records of putDownWrist. */
export namespace putDownWrist {
  /** The wrist a put down lays its prop with, and what it was chosen from. */
  export interface IWrist {
    /** The holding hand at the start, displayed. */
    hand: IAutoMovieResolvedBone;

    /** The prop in the hand's frame, the grip's rigid offset. */
    offset: IAutoMovieRigidTransform;

    /** The elbow's hint, world. */
    bend: IAutoMovieVector3;

    /** The bone of the performer the prop is put on, if any. */
    on: IAutoMovieMotionHumanPutDown.IParams["on"];

    /** The other prop's socket the prop is set on, if any. */
    onto: IAutoMovieMotionHumanPutDown.IParams["onto"];

    /** The authored resting attitude laid exactly, if any. */
    attitude: IAutoMovieQuaternion | undefined;

    /** The placing wrist. */
    chosen: IAutoMovieMotionHumanHand.IWrist;
  }
}
