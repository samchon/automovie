import type { IAutoMovieAffordance, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanProp, IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMountReach } from "./HumanMountReach";
import { HumanMountRider } from "./HumanMountRider";

/**
 * The hands of a ride (`HumanRide`): the support's points they are told to
 * hold, checked against the support, the trunk's lean that brings them in
 * reach, where each point is at a film second, and the fingers closed on
 * the support's own colliders where the ride begins.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read for the hands and what each part gives.
 * @evidence contracts/development/design.md#principled-representation The ride's holding hands as one record built once per plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and its builder, read by the ride.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every point, radius and axis is the support's own.
 */
export namespace HumanRideHands {
  /**
   * The ride's holding hands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states what it gives.
   * @evidence contracts/development/design.md#principled-representation The lean, the grip reader and the closed fingers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by the ride.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The grip is read again at each second, so a moving part is followed.
   */
  export interface IHands {
    /**
     * The trunk's forward lean that brings the holding hands in reach at a
     * film second, the support in its frame then, degrees: the grips are
     * followed as they move, as a rower leans to the catch the oar's handle
     * comes to (`HumanMountReach.reach`).
     */
    lean: (film: number, frame: IAutoMovieMotionHumanProp.IFrame) => number;

    /** What a hand holds, where the support has it at a film second in its frame then. */
    gripAt: (
      id: string,
      film: number,
      frame: IAutoMovieMotionHumanProp.IFrame,
    ) => Parameters<typeof HumanMountRider.hold>[3];

    /** Each holding hand's fingers, closed on the support's colliders. */
    closures: Partial<Record<"left" | "right", IAutoMovieMotionHumanPosture["joints"]>>;
  }

  /**
   * Read the hands of a ride.
   *
   * @param context The ride's context, for the body, the start and the hands asked.
   * @param on The support's subject id.
   * @param support The support.
   * @param seated The seated posture the ride is entered with.
   * @param origin The support's frame when the ride begins.
   * @returns The hands.
   * @throws {HumanRefusal} When a hand names a point the support lacks, or the support declares no colliders to close on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The grip is the support's point carried by its frame, a moving part's own reading preferred; the lean and the closure are `HumanMountRider`'s.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The points checked, the lean, the reader, then one closure per hand.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A hand on a missing point, or fingers with nothing to close on, is refused rather than left open.
   * @evidence contracts/development/implementation.md#efficient-algorithms The fingers are closed once, where the ride begins.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanMountRider.lean`, `leant` and `closed`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The record holds the support's reader and the closures only.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<{
      hands?: Partial<Record<"left" | "right", string>>;
    }>,
    on: string,
    support: IAutoMovieMotionHumanActionContext.IProp,
    seated: IAutoMovieMotionHumanPosture,
    origin: IAutoMovieMotionHumanProp.IFrame,
  ): IHands {
    const grips: Partial<Record<"left" | "right", IAutoMovieVector3>> = {};
    for (const side of ["left", "right"] as const) {
      const id: string | undefined = context.params.hands?.[side];
      if (id !== undefined && support.prop.points[id] === undefined)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "hands",
          value: id,
          feasible: {
            kind: "alternatives",
            values: Object.keys(support.prop.points),
          },
          reason: `${on} has no point ${id} for the ${side} hand`,
          fix: "name one of the support's points",
        });
      if (id !== undefined)
        grips[side] = Vector3.add(
          origin.position,
          Quaternion.rotateVector(
            origin.rotation,
            support.prop.points[id]!.point,
          ),
        );
    }

    // A rider whose arms do not reach what the hands hold leans the trunk forward until they do, as a cyclist does to the bar, at every instant the grips have moved to.
    const holding: ("left" | "right")[] = (["left", "right"] as const).filter(
      (side: "left" | "right"): boolean => grips[side] !== undefined,
    );
    const reach: (
      points: Partial<Record<"left" | "right", IAutoMovieVector3>>,
    ) => number = HumanMountReach.reach(context.body, seated, holding);

    // What a hand holds, where the support has it at a film second: the point and its normal, and the axis a handle is wrapped about, its frame's +X, carried with the support.
    const gripAt = (
      id: string,
      film: number,
      frame: IAutoMovieMotionHumanProp.IFrame,
    ): Parameters<typeof HumanMountRider.hold>[3] => {
      const rest: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =
        support.prop.points[id]!;
      const part:
        | { point: IAutoMovieVector3; normal: IAutoMovieVector3 }
        | undefined = support.prop.point?.(id, film);
      const affordance: IAutoMovieAffordance | undefined =
        support.prop.affordances?.find(
          (a: IAutoMovieAffordance): boolean => a.id === id,
        );
      const handle: IAutoMovieQuaternion | undefined =
        affordance?.frame.rotation;
      return {
        point:
          part?.point ??
          Vector3.add(
            frame.position,
            Quaternion.rotateVector(frame.rotation, rest.point),
          ),
        normal:
          part?.normal ?? Quaternion.rotateVector(frame.rotation, rest.normal),

        // The grip's own radius, half the width across it the object states.
        ...(affordance?.aperture === undefined
          ? {}
          : { radius: affordance.aperture / 2 }),
        ...(handle === undefined
          ? {}
          : {
              axis: Quaternion.rotateVector(
                Quaternion.multiply(frame.rotation, handle),
                { x: 1, y: 0, z: 0 },
              ),
            }),
      };
    };

    // The lean at a film second: what the hands hold then, carried back into the frame the rider sat down in, where the circles of `reach` were read.
    const lean = (film: number, frame: IAutoMovieMotionHumanProp.IFrame): number => {
      const back: IAutoMovieQuaternion = Quaternion.multiply(
        origin.rotation,
        Quaternion.inverse(frame.rotation),
      );
      const points: Partial<Record<"left" | "right", IAutoMovieVector3>> = {};
      for (const side of holding)
        points[side] = Vector3.add(
          origin.position,
          Quaternion.rotateVector(
            back,
            Vector3.subtract(
              gripAt(context.params.hands![side]!, film, frame).point,
              frame.position,
            ),
          ),
        );
      return reach(points);
    };

    // Each holding hand's fingers, closed once on the support's own colliders where it stands when the ride begins.
    const closures: Partial<Record<"left" | "right", IAutoMovieMotionHumanPosture["joints"]>> =
      {};
    for (const side of ["left", "right"] as const) {
      const id: string | undefined = context.params.hands?.[side];
      if (id === undefined) continue;
      if ((support.prop.shapes ?? []).length === 0)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "hands",
          value: id,
          feasible: null,
          reason: `${on} declares no colliders; a hand that holds closes its fingers on them`,
          fix: "give the support the shapes the fingers close on, or leave the hands free",
        });
      closures[side] = HumanMountRider.closed(
        context.body,
        side,
        HumanMountRider.leant(seated, lean(context.start, origin)),
        gripAt(id, context.start, origin),
        support.prop.shapes!,
        origin,
      );
    }
    return { lean, gripAt, closures };
  }
}
