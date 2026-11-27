import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";

/*
 * Live small-craft contacts for grips which ride a prop or its articulated
 * parts.
 */
export namespace AquaticProp {
  /*
   * The model placements and grip geometry at one film instant.
   */
  export interface IContacts {
    /*
     * The moving prop's rigid frame.
     */
    frame: IAutoMovieRigidTransform;
    /*
     * A required named affordance and its world placement.
     */
    require(id: string, kind: IAutoMovieAffordance["kind"]): IContact;
  }

  /*
   * Where a hand may slide along a long round handle: toward the shoulder,
   * within the handle's length.
   */
  export interface IReach {
    /*
     * The holding arm's shoulder, world metres.
     */
    shoulder: IAutoMovieVector3;

    /*
     * The handle's graspable length, metres.
     */
    length: number;
  }

  /*
   * One named affordance and its frame in world space.
   */
  export interface IContact {
    /*
     * The named contact in the provider's current model frame.
     */
    affordance: IAutoMovieAffordance;
    /*
     * The same contact placed in world metres and its current world rotation.
     */
    world: Pick<IAutoMovieTransform, ContactWorld>;
  }

  /*
   * Compose contact frames with the prop's current world frame. A planner that
   * drives its own articulation supplies those same writer values explicitly,
   * so its endpoints also resolve while the plan is being placed.
   */
  export function at(
    carrier: IAutoMovieMotionHumanPropReader,
    seconds: number,
    driven?: Readonly<Record<string, number>>,
  ): IContacts {
    const frame: IAutoMovieRigidTransform = carrier.frame(seconds);
    const state: Readonly<Record<string, number>> =
      carrier.state?.(seconds) ?? {};
    const articulated: boolean =
      Object.keys(state).length > 0 || driven !== undefined;
    const affordances: readonly IAutoMovieAffordance[] =
      (articulated
        ? carrier.prop.articulate?.({ ...state, ...driven }).affordances
        : undefined) ??
      carrier.prop.affordances ??
      [];
    return {
      frame,
      require(id: string, kind: IAutoMovieAffordance["kind"]): IContact {
        const affordance: IAutoMovieAffordance | undefined = affordances.find(
          (candidate: IAutoMovieAffordance): boolean => candidate.id === id,
        );
        if (affordance?.kind !== kind)
          throw new AutoMovieMotionHumanRefusal({
            kind: "affordance",
            axis: "support",
            value: `${carrier.prop.subject}.${id}`,
            feasible: {
              kind: "alternatives",
              values: affordances
                .filter((a) => a.kind === kind)
                .map((a) => a.id),
            },
            reason: `this crew station requires a ${kind} contact at ${id}`,
            fix: "register a craft or prop with the named station contact",
          });
        const placed = articulated
          ? undefined
          : carrier.prop.point?.(id, seconds);
        return {
          affordance,
          world: {
            translation:
              placed?.point ??
              AutoMovieEngineVector3.add(
                frame.position,
                AutoMovieEngineQuaternion.rotateVector(
                  frame.rotation,
                  affordance.frame.translation,
                ),
              ),
            rotation:
              placed?.rotation ??
              AutoMovieEngineQuaternion.multiply(frame.rotation, affordance.frame.rotation),
          },
        };
      },
    };
  }

  /*
   * Fit the hand's grip center to a rotating handle on a moving hull. The hand
   * may give at its rotation limit while its anatomical grip stays on the axis
   * of the handle.
   */
  export function hold(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    handle: IContact["world"],
    reach?: IReach,
  ): IAutoMovieHumanLimbGoal {
    // A hand may take a long round handle anywhere along it: it slides to
    // the point of the handle nearest the shoulder.
    if (reach !== undefined) {
      const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(handle.rotation, {
        x: 1,
        y: 0,
        z: 0,
      });
      const along: number = Math.max(
        -reach.length / 2,
        Math.min(
          reach.length / 2,
          AutoMovieEngineVector3.dot(
            AutoMovieEngineVector3.subtract(reach.shoulder, handle.translation),
            axis,
          ),
        ),
      );
      handle = {
        ...handle,
        translation: AutoMovieEngineVector3.add(
          handle.translation,
          AutoMovieEngineVector3.scale(axis, along),
        ),
      };
    }
    const grip: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
      body,
      side,
      "grip",
    );
    const rotation: IAutoMovieQuaternion = HumanHand.align(grip, {
      normal: AutoMovieEngineQuaternion.rotateVector(handle.rotation, { x: 0, y: -1, z: 0 }),
      forward: AutoMovieEngineQuaternion.rotateVector(handle.rotation, { x: 1, y: 0, z: 0 }),
    });
    const point: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
      handle.translation,
      AutoMovieEngineQuaternion.rotateVector(rotation, grip.point),
    );
    return {
      point,
      rotation,
      contact: grip.point,
      bend: AutoMovieEngineVector3.add(
        point,
        AutoMovieEngineQuaternion.rotateVector(humanPostureHeading(posture), {
          x: side === "left" ? 0.24 : -0.24,
          y: -0.22,
          z: -0.14,
        }),
      ),
    };
  }
}

/*
 * The alternatives of `ContactWorld`'s site.
 */
type ContactWorld = "translation" | "rotation";
