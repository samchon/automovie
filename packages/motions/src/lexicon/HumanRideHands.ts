import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRide,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { seated as seatSocket } from "../everyday/seated";
import { HumanRefusal } from "../law/HumanRefusal";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
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
  /** Fixed-seat thorax excursion from finish to catch (Agius et al. 2023, §4.1), degrees. */
  const ROWING: readonly [number, number] = [-28, 49];

  /** Each hand's current, complete support-relative hold. */
  type Grips = Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanMountRider.IHoldGrip>>;

  /** A holding hand's affordance and resting geometry, fixed for this ride. */
  interface IHandle {
    /** The named point within the support. */
    id: string;

    /** The point and normal in the support's frame at rest. */
    rest: IAutoMovieMotionHumanProp["points"][string];

    /** The handle's own aperture and orientation, when published. */
    affordance?: IAutoMovieAffordance;
  }

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
     * The trunk's forward lean that brings the holding hands in reach of
     * what they hold, read by `gripAt` at a film second, the support in its
     * frame then, degrees: the grips are followed as they move, as a rower
     * leans to the catch the oar's handle comes to (`HumanMountReach.reach`).
     */
    lean: (
      grips: Grips,
      frame: IAutoMovieRigidTransform,
    ) => number;

    /** What each holding hand holds, where the support has it at a film second in its frame then. */
    gripsAt: (
      film: number,
      frame: IAutoMovieRigidTransform,
    ) => Grips;

    /** Each holding hand's fingers, closed on the support's colliders. */
    closures: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>
    >;

    /** Turn the original posture about its seat socket by this many degrees. */
    bow: (degrees: number) => IAutoMovieMotionHumanPosture;
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
   * @evidence contracts/development/implementation.md#efficient-algorithms The fingers are closed once, where the ride begins; each second reads each grip once (`gripsAt`), and the lean is computed from those reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanMountRider.lean`, `leant` and `closed`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The record holds the support's reader and the closures only.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>,
    on: string,
    support: IAutoMovieMotionHumanPropReader,
    seated: IAutoMovieMotionHumanPosture,
    origin: IAutoMovieRigidTransform,
  ): IHands {
    const handles: Partial<Record<AutoMovieHumanSide, IHandle>> = {};
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
        handles[side] = {
          id,
          rest: support.prop.points[id]!,
          affordance: support.prop.affordances?.find(
            (a: IAutoMovieAffordance): boolean => a.id === id,
          ),
        };
    }

    const base = context.entry.base;
    const fixedSeat: boolean = base.kind === "seated" && base.seat?.workingSeat === true;
    // In fixed-seat rowing most thorax inclination comes from the pelvic
    // swing (Agius et al. 2023, §4.1), about the seat that stays planted.
    let bearing: IAutoMovieVector3 | undefined;
    const bow = (degrees: number): IAutoMovieMotionHumanPosture => {
      if (degrees === 0) return seated;
      if (!fixedSeat) return HumanMountRider.leant(seated, degrees);
      const angles: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll"> = {
        yaw: seated.yaw,
        pitch: seated.pitch + degrees,
        roll: seated.roll,
      };
      return {
        ...seated,
        ...angles,
        root: seatSocket.root(
          context.body,
          bearing ??= seatSocket.socket(context.body, seated),
          angles,
        ),
      };
    };
    const holding: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => handles[side] !== undefined,
    );
    const reach: (
      points: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
    ) => number = HumanMountReach.reach(context.body, seated, holding, bow, fixedSeat ? ROWING : undefined);

    // What a hand holds, where the support has it at a film second: the point and its normal, and the axis a handle is wrapped about, its frame's +X, carried with the support.
    const gripAt = (
      { id, rest, affordance }: IHandle,
      film: number,
      frame: IAutoMovieRigidTransform,
    ): IAutoMovieMotionHumanMountRider.IHoldGrip => {
      const part: IAutoMovieMotionHumanProp.IPlacedPoint | undefined = support.prop.point?.(id, film);
      const handle: IAutoMovieQuaternion | undefined = part?.rotation ??
        (affordance === undefined ? undefined : Quaternion.multiply(frame.rotation, affordance.frame.rotation));
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
                handle,
                { x: 1, y: 0, z: 0 },
              ),
            }),
      };
    };

    // The lean for what the hands hold at a second: carried back into the frame the rider sat down in, where the circles of `reach` were read.
    const lean = (
      grips: Grips,
      frame: IAutoMovieRigidTransform,
    ): number => {
      if (holding.length === 0) return 0;
      const back: IAutoMovieQuaternion = Quaternion.multiply(
        origin.rotation,
        Quaternion.inverse(frame.rotation),
      );
      const points: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
      for (const side of holding) {
        const grip: IAutoMovieMotionHumanMountRider.IHoldGrip | undefined =
          grips[side];
        if (grip === undefined) continue;
        const point: IAutoMovieVector3 = Vector3.add(origin.position, Quaternion.rotateVector(back, Vector3.subtract(grip.point, frame.position)));
        points[side] = fixedSeat
          ? HumanMountRider.wrist(context.body, seated, {
              ...grip,
              point,
              normal: Quaternion.rotateVector(back, grip.normal),
              axis: grip.axis === undefined ? undefined : Quaternion.rotateVector(back, grip.axis),
            }).point
          : point;
      }
      return reach(points);
    };

    // Each grip keeps the side the fingers closed over when taken. A
    // world-forward sign test at every stroke could flip the hand on an oar.
    const across: Partial<Record<AutoMovieHumanSide, NonNullable<IAutoMovieMotionHumanMountRider.IHoldGrip["across"]>>> = {};
    const gripsAt = (
      film: number,
      frame: IAutoMovieRigidTransform,
    ): Grips => {
      const grips: Grips = {};
      for (const side of holding) {
        const grip: IAutoMovieMotionHumanMountRider.IHoldGrip = gripAt(handles[side]!, film, frame);
        const handed: IAutoMovieMotionHumanMountRider.IHoldGrip["across"] = across[side];
        grips[side] = handed === undefined ? grip : { ...grip, across: handed };
      }
      return grips;
    };

    // Each holding hand's fingers, closed once on the support's own colliders where it stands when the ride begins.
    const closures: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>
    > = {};
    const begun: Grips = gripsAt(context.start, origin);
    if (holding.length > 0) {
      const forward: IAutoMovieVector3 = Quaternion.rotateVector(
        resolveHumanPosture.heading(seated),
        { x: 0, y: 0, z: 1 },
      );
      for (const side of holding) {
        const grip: IAutoMovieMotionHumanMountRider.IHoldGrip = begun[side]!;
        if (grip.axis === undefined) continue;
        const handed: NonNullable<IAutoMovieMotionHumanMountRider.IHoldGrip["across"]> = Vector3.dot(Vector3.cross(grip.axis, grip.normal), forward) < 0 ? -1 : 1;
        across[side] = handed;
        begun[side] = { ...grip, across: handed };
      }
    }
    const set: IAutoMovieMotionHumanPosture = bow(lean(begun, origin));
    for (const side of holding) {
      const id: string = handles[side]!.id;
      if ((support.prop.shapes ?? []).length === 0)
        throw new HumanRefusal({
          kind: "affordance",
          axis: "hands",
          value: id,
          feasible: null,
          reason: `${on} declares no colliders; a hand that holds closes its fingers on them`,
          fix: "give the support the shapes the fingers close on, or leave the hands free",
        });
      const grip: IAutoMovieMotionHumanMountRider.IHoldGrip = begun[side]!;
      closures[side] = HumanMountRider.closed(
        context.body,
        side,
        set,
        grip,
        support.prop.shapes!,
        origin,
      );
    }
    return { lean, gripsAt, closures, bow };
  }
}
