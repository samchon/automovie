import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPutDown,
  IAutoMoviePose,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { poseBones } from "../posture/poseBones";

/**
 * The rigid frame a prop is set on: a bone of the performer or another
 * prop's socket. The placement and the grasp chosen for it read this same
 * frame, with both sockets posed by their articulations at the entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two frame owners, the consumers and the instant at which articulations are read.
 * @evidence contracts/development/design.md#principled-representation Rigid composition in SE(3): the placed prop P and its socket V satisfy P V = S at the receiving socket S.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One frame reader, shared by putDown's plan and demands.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No prop or body size is named; sockets and bones are the authored data.
 */
export namespace putDownTarget {
  /**
   * The prop's fixed placing frame, or undefined for a free world placement.
   *
   * @param context The authored destination, body, props and entry second.
   * @param pose The body at that entry, including a prospective grasp's stance.
   * @returns The placing frame, world metres and a unit quaternion.
   * @throws {HumanRefusal} On onto when either named socket is absent.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frames, instant, missing-destination result and refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Composes a worn offset with its posed bone; for a socket placement composes the receiver frame and socket, then the inverse of the placed prop's own socket.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The bone case, the receiving socket, then the inverse source socket.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Each socket is read from its prop's posed affordances, rather than substituting its rest frame.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward-kinematics read for a worn destination, or one linear affordance lookup on each of two props.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanPropFrame's rigid composition and the props' articulation owners.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure reader that retains nothing.
   */
  export function of(
    context: Pick<
      IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDown.IParams>,
      "params" | "body" | "prop" | "start"
    >,
    pose: IAutoMoviePose,
  ): IAutoMovieMotionHumanProp.IFrame | undefined {
    const onto: IAutoMovieMotionHumanPutDown.IParams["onto"] =
      context.params.onto;
    if (onto === undefined) {
      const on: IAutoMovieMotionHumanPutDown.IParams["on"] = context.params.on;
      if (on === undefined) return undefined;
      return HumanPropFrame.compose(
        HumanPropFrame.bone(poseBones(context.body, pose).get(on.bone)!),
        on.offset,
      );
    }

    const socket = (prop: string, id: string): IAutoMovieAffordance => {
      const record: IAutoMovieMotionHumanActionContext.IProp =
        context.prop(prop);
      const contacts: readonly IAutoMovieAffordance[] =
        record.prop.articulate === undefined
          ? (record.prop.affordances ?? [])
          : record.prop.articulate(record.state?.(context.start) ?? {})
              .affordances;
      const found: IAutoMovieAffordance | undefined = contacts.find(
        (a: IAutoMovieAffordance): boolean => a.id === id,
      );
      if (found === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "onto",
          value: `${prop}.${id}`,
          feasible: {
            kind: "alternatives",
            values: contacts.map((a: IAutoMovieAffordance): string => a.id),
          },
          reason: `${prop} has no socket named ${id}`,
          fix: "name a socket the prop declares",
        });
      return found;
    };
    const receiver: IAutoMovieAffordance = socket(onto.prop, onto.point);
    const destination: IAutoMovieMotionHumanProp.IFrame =
      HumanPropFrame.compose(context.prop(onto.prop).frame(context.start), {
        position: receiver.frame.translation,
        rotation: receiver.frame.rotation,
      });
    if (onto.via === undefined) return destination;

    const source: IAutoMovieAffordance = socket(context.params.prop, onto.via);
    const rotation: IAutoMovieMotionHumanProp.IFrame["rotation"] =
      Quaternion.normalize(
        Quaternion.multiply(
          destination.rotation,
          Quaternion.inverse(source.frame.rotation),
        ),
      );
    return {
      position: Vector3.subtract(
        destination.position,
        Quaternion.rotateVector(rotation, source.frame.translation),
      ),
      rotation,
    };
  }
}
