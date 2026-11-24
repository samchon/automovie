import {
  AutoMovieHumanoidSurfaceRays,
  Quaternion,
  type RigidCarrierSample,
  Vector3,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanMountRider,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanRide,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { seated as seatSocket } from "../everyday/seated";
import { HumanMountReach } from "./HumanMountReach";
import { HumanMountRider } from "./HumanMountRider";
import { closeRideHandGrips } from "./closeRideHandGrips";
import { crossRideReinGrip } from "./crossRideReinGrip";
import { fixedSeatGripPosture } from "./fixedSeatGripPosture";
import { fixedSeatGripReach } from "./fixedSeatGripReach";
import { fixedSeatWorkingPostures } from "./fixedSeatWorkingPostures";
import { measureRidePalmDepth } from "./measureRidePalmDepth";
import { readRideHandles } from "./readRideHandles";
import { sideRideGrips } from "./sideRideGrips";

/** The alternatives of `OfBowAngles`'s site. */
type OfBowAngles = "yaw" | "pitch" | "roll";

/**
 * The hands of a ride (`HumanRide`): the support's points they are told to
 * hold, checked against the support, the trunk's lean that brings them in
 * reach, where each point is at a film second, and the fingers closed on the
 * support's own colliders where the ride begins.
 */
export namespace HumanRideHands {
  /**
   * Fixed-seat thorax excursion from finish to catch (Agius et al. 2023, §4.1),
   * degrees.
   */
  const ROWING: readonly [number, number] = [-28, 49];

  /**
   * Material-aware round handles and rein contacts over the ride's ordinary
   * hold geometry.
   */
  export interface IMaterialGrip
    extends IAutoMovieMotionHumanMountRider.IHoldGrip {
    /**
     * Metres from the palm centreline to its skin at the authored holding
     * station.
     */
    palmDepth?: number;
    /** A rein meets the body's actual wrist-relative palm surface. */
    reinPalm?: IAutoMovieMotionHumanHand.IFrame;
    /**
     * Degrees a rein's hold turns about its outward normal from fingers square
     * across the line: the angle the line crosses the fist at
     * (`crossRideReinGrip`); none holds the fingers square.
     */
    cross?: number;
  }

  /** Each hand's current, complete support-relative hold. */
  type Grips = Partial<Record<AutoMovieHumanSide, IMaterialGrip>>;

  /**
   * Where a law is entered with hands already holding: the pose displayed
   * there, the hands that hold in it and the posture the law before wrote.
   */
  export interface IShown {
    /** The pose displayed where the plan begins. */
    pose: IAutoMoviePose;

    /** The hands that hold in it. */
    holding: ReadonlySet<AutoMovieHumanSide>;

    /**
     * The posture the law before wrote there, whose arm goals asked the holding
     * hands' turns.
     */
    posture: IAutoMovieMotionHumanPosture;
  }

  /** A holding hand's affordance and resting geometry, fixed for this ride. */
  export interface IHandle {
    /** The holding hand. */
    side: AutoMovieHumanSide;

    /**
     * The hand's measured palm depth to the held surface, metres; absent until
     * a full articulated frame has been observed.
     */
    palmDepth?: number;
    /** The canonical palm frame retained for a rein over all pose reads. */
    reinPalm?: IAutoMovieMotionHumanHand.IFrame;
    /**
     * The angle a rein crosses the palm at, degrees, chosen once where the ride
     * begins (`IMaterialGrip.cross`).
     */
    cross?: number;
    /** The named point within the support. */
    id: string;

    /** The point and normal in the support's frame at rest. */
    rest: IAutoMovieMotionHumanProp["points"][string];

    /** The handle's own aperture and orientation, when published. */
    affordance?: IAutoMovieAffordance;
  }

  /** The ride's holding hands. */
  export interface IHands {
    /**
     * The planted working-seat alternatives when pelvic inclination exceeds the
     * legs' reach.
     */
    alternatives?: NonNullable<ReturnType<typeof fixedSeatWorkingPostures>>;
    /**
     * The trunk's forward lean that brings the holding hands in reach of what
     * they hold, read by `gripAt` at a film second, the support in its frame
     * then, degrees: the grips are followed as they move, as a rower leans to
     * the catch the oar's handle comes to (`HumanMountReach.reach`).
     */
    posture(
      grips: Grips,
      frame: IAutoMovieRigidTransform,
      taken: number,
      heldAt?: number,
    ): IAutoMovieMotionHumanPosture;

    /**
     * What each holding hand holds, where the support has it at a film second
     * in its frame then.
     */
    gripsAt: (
      film: number,
      frame: IAutoMovieRigidTransform,
      sample?: RigidCarrierSample.IRead,
    ) => Grips;

    /** Each holding hand's fingers, closed on the support's colliders. */
    closures: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>
    >;
  }

  /**
   * Read the hands of a ride.
   *
   * @param context The ride's context, for the body, the start and the hands
   *   asked.
   * @param on The support's subject id.
   * @param support The support.
   * @param seated The seated posture the ride is entered with.
   * @param origin The support's frame when the ride begins.
   * @param take Seconds a hand takes to reach what it holds.
   * @param shown For a law entered with hands already holding: the pose
   *   displayed where the plan begins and the hands that hold there. Each such
   *   rein keeps the crossing it is displayed with (`crossRideReinGrip`); none
   *   when every hand takes its hold.
   * @returns The hands.
   * @throws {HumanRefusal} When a hand names a point the support lacks, the
   *   support declares no colliders to close on, or no crossing of a rein the
   *   hand takes lies within its arm's ranges.
   */
  export function of(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanRide.IParams>,
    on: string,
    support: IAutoMovieMotionHumanPropReader,
    seated: IAutoMovieMotionHumanPosture,
    origin: IAutoMovieRigidTransform,
    take: number,
    shown?: IShown,
  ): IHands {
    const handles: Partial<Record<AutoMovieHumanSide, IHandle>> =
      readRideHandles(context.body, on, support, context.params.hands);

    const base = context.entry.base;
    const fixedSeat: boolean =
      base.kind === "seated" && base.seat?.workingSeat === true;
    // In fixed-seat rowing most thorax inclination comes from the pelvic
    // swing (Agius et al. 2023, §4.1), about the seat that stays planted.
    let bearing: IAutoMovieVector3 | undefined;
    const bow = (degrees: number): IAutoMovieMotionHumanPosture => {
      if (degrees === 0) return seated;
      if (!fixedSeat) return HumanMountRider.leant(seated, degrees);
      const angles: Pick<IAutoMovieMotionHumanPosture, OfBowAngles> = {
        yaw: seated.yaw,
        pitch: seated.pitch + degrees,
        roll: seated.roll,
      };
      return {
        ...seated,
        ...angles,
        root: seatSocket.root(
          context.body,
          (bearing ??= seatSocket.socket(context.body, seated)),
          angles,
        ),
      };
    };
    const holding: AutoMovieHumanSide[] = (["left", "right"] as const).filter(
      (side: AutoMovieHumanSide): boolean => handles[side] !== undefined,
    );
    const reach: (
      points: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
    ) => number = HumanMountReach.reach(
      context.body,
      seated,
      holding,
      bow,
      fixedSeat ? ROWING : undefined,
    );

    const seat: IAutoMovieAffordance | undefined =
      fixedSeat && holding.length === 2
        ? support.prop.affordances?.find(
            (a: IAutoMovieAffordance): boolean => a.id === context.params.seat,
          )
        : undefined;
    const check: ReturnType<typeof fixedSeatGripReach> =
      seat === undefined
        ? undefined
        : fixedSeatGripReach(context.body, seated, seat, origin);

    // What a hand holds, where the support has it at a film second: the point and its normal, and the axis a handle is wrapped about, its frame's +X, carried with the support.
    let surfaces:
      | ReturnType<typeof AutoMovieHumanoidSurfaceRays.tools>
      | undefined;
    const gripAt = (
      held: IHandle,
      film: number,
      frame: IAutoMovieRigidTransform,
      sample?: RigidCarrierSample.IRead,
    ): IMaterialGrip => {
      const { id, rest, affordance } = held;
      const placed: IAutoMovieTransform | undefined = sample?.point(id);
      const part: IAutoMovieMotionHumanProp.IPlacedPoint | undefined =
        placed === undefined
          ? support.prop.point?.(id, film)
          : {
              point: placed.translation,
              rotation: placed.rotation,
              normal: Quaternion.rotateVector(placed.rotation, {
                x: 0,
                y: 1,
                z: 0,
              }),
            };
      const handle: IAutoMovieQuaternion | undefined =
        part?.rotation ??
        (affordance === undefined
          ? undefined
          : Quaternion.multiply(frame.rotation, affordance.frame.rotation));
      const material: boolean =
        fixedSeat &&
        part?.rotation !== undefined &&
        affordance?.kind === "handle" &&
        affordance.rides !== undefined &&
        affordance.symmetry === "round" &&
        affordance.aperture !== undefined;
      if (material && held.palmDepth === undefined) {
        // Measure the same longitudinal station the holding law authors, at the
        // skin of this hand. The shape stays in its rest frame throughout a ride.
        surfaces ??= AutoMovieHumanoidSurfaceRays.tools(
          context.body.skeleton,
          context.body.profile,
        );
        held.palmDepth = measureRidePalmDepth(
          context.body,
          held.side,
          surfaces,
        );
      }
      return {
        ...(material ? { palmDepth: held.palmDepth } : {}),
        ...(held.reinPalm === undefined ? {} : { reinPalm: held.reinPalm }),
        ...(held.cross === undefined ? {} : { cross: held.cross }),
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
              axis: Quaternion.rotateVector(handle, { x: 1, y: 0, z: 0 }),
            }),
      };
    };

    // The lean for what the hands hold at a second: carried back into the frame the rider sat down in, where the circles of `reach` were read.
    type WristPoints = Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>>;
    const wristPoints = (
      grips: Grips,
      frame: IAutoMovieRigidTransform,
      heldAt?: number,
    ): WristPoints => {
      const back: IAutoMovieQuaternion = Quaternion.multiply(
        origin.rotation,
        Quaternion.inverse(frame.rotation),
      );
      const points: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> = {};
      for (const side of holding) {
        const grip: IMaterialGrip | undefined = grips[side];
        if (grip === undefined) continue;
        const point: IAutoMovieVector3 = Vector3.add(
          origin.position,
          Quaternion.rotateVector(
            back,
            Vector3.subtract(grip.point, frame.position),
          ),
        );
        points[side] =
          fixedSeat || grip.reinPalm !== undefined
            ? HumanMountRider.wrist(context.body, seated, {
                ...grip,
                point,
                normal: Quaternion.rotateVector(back, grip.normal),
                axis:
                  grip.axis === undefined
                    ? undefined
                    : Quaternion.rotateVector(back, grip.axis),
              }).point
            : point;
      }
      if (
        heldAt !== undefined &&
        check !== undefined &&
        seat !== undefined &&
        points.left !== undefined &&
        points.right !== undefined
      )
        check(
          points.left,
          points.right,
          support.prop.point === undefined
            ? undefined
            : (): IAutoMovieRigidTransform | undefined => {
                const current:
                  | IAutoMovieMotionHumanProp.IPlacedPoint
                  | undefined = support.prop.point!(seat.id, heldAt);
                if (current?.rotation === undefined) return undefined;
                return {
                  position: Vector3.add(
                    origin.position,
                    Quaternion.rotateVector(
                      back,
                      Vector3.subtract(current.point, frame.position),
                    ),
                  ),
                  rotation: Quaternion.multiply(back, current.rotation),
                };
              },
        );
      return points;
    };

    const lean = (
      grips: Grips,
      frame: IAutoMovieRigidTransform,
      heldAt?: number,
    ): number =>
      holding.length === 0 ? 0 : reach(wristPoints(grips, frame, heldAt));

    // Each grip keeps the side the fingers closed over when taken. A
    // world-forward sign test at every stroke could flip the hand on an oar.
    const across: Partial<
      Record<
        AutoMovieHumanSide,
        NonNullable<IAutoMovieMotionHumanMountRider.IHoldGrip["across"]>
      >
    > = {};
    const gripsAt = (
      film: number,
      frame: IAutoMovieRigidTransform,
      sample?: RigidCarrierSample.IRead,
    ): Grips => {
      const grips: Grips = {};
      for (const side of holding) {
        const grip: IAutoMovieMotionHumanMountRider.IHoldGrip = gripAt(
          handles[side]!,
          film,
          frame,
          sample,
        );
        const handed: IAutoMovieMotionHumanMountRider.IHoldGrip["across"] =
          across[side];
        grips[side] = handed === undefined ? grip : { ...grip, across: handed };
      }
      return grips;
    };

    // Each holding hand's fingers are closed once on the support's own colliders where it stands when the ride begins (`closeRideHandGrips`).

    const begun: Grips = gripsAt(context.start, origin);
    Object.assign(across, sideRideGrips(begun, seated));
    for (const side of holding)
      if (across[side] !== undefined)
        begun[side] = { ...begun[side]!, across: across[side] };
    // The angle each rein crosses its palm at, chosen once where the hold begins (`crossRideReinGrip`), kept by its handle for every second after.
    let reaching: IAutoMovieMotionHumanPosture | undefined;
    for (const side of holding) {
      const handle: IHandle = handles[side]!;
      const grip: IMaterialGrip | undefined = begun[side];
      if (handle.reinPalm === undefined || grip?.axis === undefined) continue;
      handle.cross = crossRideReinGrip(
        context.body,
        side,
        (reaching ??= bow(lean(begun, origin))),
        grip,
        handle.reinPalm,
        shown?.holding.has(side) === true ? shown : undefined,
      );
      begun[side] = { ...grip, cross: handle.cross };
    }
    let working: ReturnType<typeof fixedSeatGripPosture>;
    let alternatives: ReturnType<typeof fixedSeatWorkingPostures>;
    if (
      check !== undefined &&
      seat !== undefined &&
      context.params.duration >= take
    ) {
      const heldAt: number = context.start + take;
      const heldFrame: IAutoMovieRigidTransform = support.frame(heldAt);
      const points: WristPoints = wristPoints(
        gripsAt(heldAt, heldFrame),
        heldFrame,
        heldAt,
      );
      const seatFrame: IAutoMovieRigidTransform = {
        position: Vector3.add(
          origin.position,
          Quaternion.rotateVector(origin.rotation, seat.frame.translation),
        ),
        rotation: Quaternion.multiply(origin.rotation, seat.frame.rotation),
      };
      working = fixedSeatGripPosture(
        context.body,
        seated,
        (bearing ??= seatSocket.socket(context.body, seated)),
        seatFrame,
        reach(points),
        points,
      );
      const design: typeof working = working;
      if (
        design !== undefined &&
        points.left &&
        points.right &&
        !context.params.feet
      ) {
        const wrists: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
          left: points.left,
          right: points.right,
        };
        const shifted: number = reach({
          left: Vector3.subtract(wrists.left, design.shift),
          right: Vector3.subtract(wrists.right, design.shift),
        });
        alternatives = fixedSeatWorkingPostures(
          context.body,
          (degree: number): IAutoMovieMotionHumanPosture => {
            const base: IAutoMovieMotionHumanPosture = bow(degree);
            return {
              ...base,
              root: Vector3.add(base.root, design.shift),
              joints: { ...base.joints, ...design.joints(degree, 1, wrists) },
            };
          },
          origin,
          shifted,
          wrists,
        );
      }
    }
    function posture(
      grips: Grips,
      frame: IAutoMovieRigidTransform,
      taken: number,
      heldAt?: number,
    ): IAutoMovieMotionHumanPosture {
      if (working === undefined) return bow(lean(grips, frame, heldAt) * taken);
      const points: WristPoints = wristPoints(grips, frame, heldAt);
      if (points.left === undefined || points.right === undefined)
        return bow(reach(points) * taken);
      const shift: IAutoMovieVector3 = Vector3.scale(working.shift, taken);
      const degrees: number =
        reach({
          left: Vector3.subtract(points.left, shift),
          right: Vector3.subtract(points.right, shift),
        }) * taken;
      const at: IAutoMovieMotionHumanPosture = bow(degrees);
      return {
        ...at,
        root: Vector3.add(at.root, shift),
        joints: { ...at.joints, ...working.joints(degrees, taken, points) },
      };
    }
    const ids: Partial<Record<AutoMovieHumanSide, string>> = {};
    const declared: Partial<Record<AutoMovieHumanSide, IAutoMovieAffordance>> =
      {};
    for (const side of holding) {
      ids[side] = handles[side]!.id;
      if (handles[side]!.affordance !== undefined)
        declared[side] = handles[side]!.affordance;
    }
    const closures: Partial<
      Record<AutoMovieHumanSide, IAutoMovieMotionHumanPosture["joints"]>
    > = closeRideHandGrips(
      context.body,
      on,
      support,
      bow(lean(begun, origin)),
      begun,
      ids,
      declared,
      origin,
    );
    return {
      posture,
      gripsAt,
      closures,
      ...(alternatives === undefined ? {} : { alternatives }),
    };
  }
}
