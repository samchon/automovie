import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieBodyMeasure,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSeated,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanSupportFrame } from "../carrier/HumanSupportFrame";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import type { prepareSeatedPalms } from "./prepareSeatedPalms";
import { seatedHands } from "./seatedHands";

/** The alternatives of `RootHeading`'s site. */
type RootHeading = "yaw" | "pitch" | "roll";

/** What the seat socket's place reads of a body: its rest and its surfaces. */
type IRest = Pick<IAutoMovieMotionHumanBody, "rest" | "surfaces">;

/**
 * The geometry every seat law shares: where on a seat the body's seat socket
 * rests, the root that puts it there under a trunk pitch, whether a seat suits
 * the body, and the hands resting on the thighs.
 *
 * A seat is given as the sitting surface's frame the way an
 * `IAutoMovieAffordance` of kind `seat` states it: a world point at the middle
 * of the front edge, the heading the sitter faces, an optional depth back from
 * the edge and an optional backrest height. Sitting brings the body's `seat`
 * socket (under the ischial tuberosities) onto the seat; everything else
 * follows by inverse kinematics and the trunk's pitch.
 *
 * The socket rests `thigh - 0.05 m` behind the edge, corrected by the socket's
 * own offset from the hip joints, so with a level thigh the knee stands 5 cm
 * ahead of the front edge and the thigh is supported almost to the knee
 * (provisional clearance; seating standards keep the seat shorter than the
 * buttock-to-popliteal length); a shallower seat moves the socket forward to 2
 * cm inside its depth.
 *
 * A seat is sat on with both feet on the floor when its height above the floor
 * under the feet (the ground, or the floor of a prop they stand on, as a
 * boat's) lies within 0.8 to 1.2 of the popliteal height, the ratio the
 * campaign sets: a lower seat needs more trunk flexion and a longer rise
 * (Janssen, Bussmann and Stam 2002, Phys Ther 82:866) and is refused. A higher
 * one is a high seat: a bar stool, a saddle, a wall. The feet leave the floor
 * for its rests or hang, and the body gets onto it by a step up or a swing of a
 * leg. The popliteal height is the knee joint's height less the thigh's radius,
 * where the thigh's underside meets a level seat.
 */
export namespace seated {
  /** What the popliteal height reads of a body. */
  export interface IPopliteal {
    /** The ankle height, the shank and the thigh's radius, metres. */
    measure: Pick<
      IAutoMovieBodyMeasure,
      "ankleHeight" | "shank" | "thighRadius"
    >;
  }

  /**
   * Seat heights as shares of the popliteal height that are sat on with both
   * feet on the floor. Below the band a seat is refused; above it the seat is a
   * high one ({@link high}).
   */
  export const RATIO: readonly [number, number] = [0.8, 1.2];

  /**
   * How far the knee stands ahead of the front edge with a level thigh, metres
   * (provisional clearance, as the namespace states).
   */
  const KNEE_CLEAR: number = 0.05;

  /**
   * How far inside a shallow seat's depth the socket stays, metres
   * (provisional, as the namespace states).
   */
  const DEPTH_CLEAR: number = 0.02;

  /**
   * How far above its standing height an ankle stands off the floor: half the
   * thigh's radius, as a share of it (provisional).
   */
  const OFF_FLOOR: number = 0.5;

  /**
   * Whether a seated entry sits on a high seat with a foot off the floor, as a
   * bar stool or a saddle is sat on: the socket stands above the band and a
   * foot is unplanted or its ankle stands more than half the thigh's radius
   * above its standing height over the floor.
   *
   * @param body The body.
   * @param entry The seated entry.
   * @param socket The entry's seat socket, world metres.
   * @param under The floor's height under the feet, world metres.
   * @returns Whether the body is perched, so it gets off rather than rising or
   *   edging over its feet.
   */
  export function perched(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
    socket: IAutoMovieVector3,
    under: number,
  ): boolean {
    return (
      (socket.y - under) / popliteal(body) > RATIO[1] &&
      (["left", "right"] as const).some(
        (side: AutoMovieHumanSide): boolean =>
          !entry.feet[side].planted ||
          entry.feet[side].ankle.y >
            under +
              body.measure.ankleHeight +
              OFF_FLOOR * body.measure.thighRadius,
      )
    );
  }

  /**
   * Whether a seat is a high one for a body: above the band, so the feet cannot
   * stay on the floor and the body gets onto it by a step up or a swing of a
   * leg, then sits with the feet on its rests or hanging, as on a bar stool, a
   * saddle or a wall.
   *
   * @param body The body.
   * @param seat The seat.
   * @param under The floor's height under the feet, world metres; the ground's
   *   0 when absent.
   * @returns Whether the seat is above the band.
   */
  export function high(
    body: seated.IPopliteal,
    seat: Pick<IAutoMovieMotionHumanSeated.ISeat, "at">,
    under: number = 0,
  ): boolean {
    return ratio(body, seat, under) > RATIO[1];
  }

  /**
   * The seat height's share of the popliteal height, the height measured from
   * the floor the feet stand on ({@link floor}).
   *
   * @param body The body.
   * @param seat The seat.
   * @param under The floor's height under the feet, world metres; the ground's
   *   0 when absent.
   * @returns The ratio.
   */
  export function ratio(
    body: seated.IPopliteal,
    seat: Pick<IAutoMovieMotionHumanSeated.ISeat, "at">,
    under: number = 0,
  ): number {
    return (seat.at.y - under) / popliteal(body);
  }

  /**
   * The height of the floor the feet stand on at an entry, world metres: a
   * seat's height is measured from it, since the legs reach from the seat down
   * to it. On the ground it is the ground's 0; a foot planted on a prop (a
   * boat's floor, a stage, a deck) stands on that prop's floor, which is read
   * on its displayed bearing sockets, even with its heel raised. The lowest
   * such sole is the floor, as the lower foot reaches farthest.
   *
   * @param body The body.
   * @param entry The entry state.
   * @returns The floor's height, world metres.
   */
  export function floor(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
  ): number {
    return HumanSupportFrame.floor(body, entry);
  }

  /**
   * Refuse a seat too low to sit on from standing, naming the least height. A
   * fixed working seat is judged by physical reach; its sitting surface must
   * stand above the feet's floor. An ordinary seat uses the height band.
   *
   * @param body The body.
   * @param seat The seat.
   * @param under The floor's height under the feet, world metres; the ground's
   *   0 when absent.
   * @throws {HumanRefusal} When the seat lies below its appropriate height
   *   range.
   */
  export function check(
    body: IAutoMovieMotionHumanBody,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    under: number = 0,
  ): void {
    const r: number = ratio(body, seat, under);
    const working: boolean = seat.workingSeat === true;
    const least: number = working ? under : under + RATIO[0] * popliteal(body);
    if (working ? seat.at.y <= least : seat.at.y < least)
      throw new HumanRefusal({
        kind: "reach",
        axis: "seat",
        value: seat.at.y,
        feasible: {
          kind: "range",
          minimum: least,
          maximum: null,
          unit: "m",
        },
        reason: working
          ? "The working seat must be above the floor that supports the feet"
          : `A seat ${(seat.at.y - under).toFixed(3)} m high is ${r.toFixed(2)} of this body's popliteal height; seats from ${(least - under).toFixed(3)} m up suit it`,
        fix: working
          ? "put the working seat above its floor"
          : "use a seat whose height suits this body",
      });
  }

  /**
   * Where the seat socket goes when seated, world metres: back from the front
   * edge as the class comment states, and raised above the surface by however
   * far the thighs' undersides hang below the socket at rest, since a seated
   * body bears on whichever is lower, the ischial tuberosities or the backs of
   * the thighs, and neither may sink into the seat.
   *
   * @param body The body.
   * @param seat The seat.
   * @returns The socket's seated point.
   */
  export function point(
    body: IRest & {
      measure: Pick<
        IAutoMovieMotionHumanBody["measure"],
        "thigh" | "thighRadius"
      >;
    },
    seat: IAutoMovieMotionHumanSeated.ISeat,
  ): IAutoMovieVector3 {
    const socket: IAutoMovieVector3 = offset(body);
    const hipJoint: IAutoMovieVector3 = body.rest.get("leftUpperLeg")!;
    let back: number = body.measure.thigh - KNEE_CLEAR + hipJoint.z - socket.z;
    if (seat.depth !== undefined)
      back = Math.min(back, seat.depth - DEPTH_CLEAR);
    const lift: number = Math.max(
      0,
      socket.y - (hipJoint.y - body.measure.thighRadius),
    );
    // On a tipped or tilted seat, as a saddle on a grade, the place lies along the surface.
    if (seat.pitch !== undefined || seat.roll !== undefined)
      return Vector3.add(
        seat.at,
        Quaternion.rotateVector(
          humanPostureHeading({
            yaw: seat.yaw,
            pitch: seat.pitch ?? 0,
            roll: seat.roll ?? 0,
          }),
          { x: 0, y: lift, z: -back },
        ),
      );
    return HumanFrame.point(
      { origin: seat.at, yaw: seat.yaw },
      { x: 0, y: lift, z: -back },
    );
  }

  /**
   * The seat socket's offset from the root at rest, metres.
   *
   * @param body The body.
   * @returns The offset.
   */
  export function offset(body: IRest): IAutoMovieVector3 {
    return Vector3.add(
      body.rest.get("hips")!,
      body.surfaces.sockets.seat.point,
    );
  }

  /**
   * The root that puts the seat socket on a point under a heading and pitch.
   *
   * @param body The body.
   * @param at Where the socket goes, world metres.
   * @param heading Yaw, pitch and roll, degrees.
   * @returns The root.
   */
  export function root(
    body: IRest,
    at: IAutoMovieVector3,
    heading: Pick<IAutoMovieMotionHumanPosture, RootHeading>,
  ): IAutoMovieVector3 {
    return Vector3.subtract(
      at,
      Quaternion.rotateVector(humanPostureHeading(heading), offset(body)),
    );
  }

  /**
   * The world seat socket of a posture.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns World metres.
   */
  export function socket(
    body: IRest,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 {
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(humanPostureHeading(posture), offset(body)),
    );
  }

  /**
   * Goals that lay each palm flat on the front of the same thigh, fingers
   * toward the knee, on a posture whose legs are solved first.
   *
   * @param body The body.
   * @param posture The posture with its leg goals.
   * @param side One hand when supplied; both when absent.
   * @param resolution Optional same-query FK source, released with this
   *   observation.
   * @param projection Optional genuine same-query ROM source; actual joints
   *   still project.
   * @param palms The contact geometry prepared for this seated phase.
   * @returns Arm goals.
   */
  export function hands(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side?: AutoMovieHumanSide,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    palms?: ReturnType<typeof prepareSeatedPalms>,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    return seatedHands.hands(
      body,
      posture,
      side,
      resolution,
      projection,
      palms,
    );
  }

  /**
   * A posture whose hands have moved a share of the way from hanging, as the
   * posture's own joints hold them, to resting on the thighs: each wrist
   * travels on the straight line between the two placements and the hand turns
   * by spherical interpolation, so `share` from a minimum-jerk profile gives a
   * minimum-jerk reach.
   *
   * @param body The body.
   * @param posture The posture with its legs placed and no arm goals.
   * @param share 0 hanging to 1 on the thighs.
   * @param resolution Optional same-query FK source, released with this
   *   placement.
   * @param projection Optional genuine same-query ROM source; actual joints
   *   still project.
   * @param palms The flat palms and the thigh skin prepared once for the law
   *   (`prepareSeatedPalms`), which every read places on the thighs as they
   *   are: the palm's reach is its hand shape's alone and the skin rides its
   *   thigh, so neither is read again per second. Absent, each read measures
   *   them.
   * @returns The posture with arm goals, or unchanged at 0.
   */
  export function arms(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
    palms?: ReturnType<typeof prepareSeatedPalms>,
  ): IAutoMovieMotionHumanPosture {
    return seatedHands.arms(
      body,
      posture,
      share,
      resolution,
      projection,
      palms,
    );
  }

  /**
   * A seated posture's hands a share of the way from hanging to where they
   * rest: on the armrests of a seat that has them, on the thighs otherwise. A
   * body getting up pushes on its armrests until its seat leaves the seat, as
   * it rests on them sitting down.
   *
   * @param body The body.
   * @param posture The posture with its legs placed and no arm goals.
   * @param rests The seat's armrests, world metres; none when absent.
   * @param yaw The seat's heading, degrees.
   * @param share 0 hanging to 1 resting.
   * @param resolution Optional exact FK source borrowed only for this
   *   synchronous placement.
   * @param projection Optional genuine same-body ROM metadata from that
   *   placement.
   * @returns The posture with arm goals, or unchanged at 0; a hand on an
   *   armrest bears once it is down.
   */
  export function rested(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    rests: Partial<Record<AutoMovieHumanSide, IAutoMovieVector3>> | undefined,
    yaw: number,
    share: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    return seatedHands.rested(
      body,
      posture,
      rests,
      yaw,
      share,
      resolution,
      projection,
    );
  }

  /**
   * The goal that rests a hand on its armrest: the wrist a fifth of a hand's
   * length above the rest, the palm down and the fingers ahead along the seat's
   * heading, the hand bearing.
   *
   * @param body The body.
   * @param posture The posture with its legs placed.
   * @param side The hand.
   * @param rest The armrest's point, world metres.
   * @param yaw The seat's heading, degrees.
   * @returns The arm's goal.
   */
  export function armrest(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    rest: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieHumanLimbGoal {
    return seatedHands.armrest(body, posture, side, rest, yaw);
  }

  /**
   * The popliteal height at rest, metres: the floor to the underside of the
   * thigh just behind the knee, the knee joint's height less the thigh's
   * radius, the height a seat is measured against (seated anthropometry,
   * ANSI/HFES 100-2007).
   *
   * @param body The body.
   * @returns Metres.
   */
  export function popliteal(body: seated.IPopliteal): number {
    return (
      body.measure.ankleHeight + body.measure.shank - body.measure.thighRadius
    );
  }
}
