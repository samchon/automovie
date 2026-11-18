import { Quaternion, Vector3 } from "@automovie/engine";
import type {
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
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { seatedHands } from "./seatedHands";

/**
 * The geometry every seat law shares: where on a seat the body's seat
 * socket rests, the root that puts it there under a trunk pitch, whether a
 * seat suits the body, and the hands resting on the thighs.
 *
 * A seat is given as the sitting surface's frame the way an `IAutoMovieAffordance`
 * of kind `seat` states it: a world point at the middle of the front edge,
 * the heading the sitter faces, an optional depth back from the edge and an
 * optional backrest height. Sitting brings the body's `seat` socket (under
 * the ischial tuberosities) onto the seat; everything else follows by
 * inverse kinematics and the trunk's pitch.
 *
 * The socket rests `thigh - 0.05 m` behind the edge, corrected by the
 * socket's own offset from the hip joints, so with a level thigh the knee
 * stands 5 cm ahead of the front edge and the thigh is supported almost to
 * the knee (provisional clearance; seating standards keep the seat shorter
 * than the buttock-to-popliteal length); a shallower seat moves the socket
 * forward to 2 cm inside its depth.
 *
 * A seat is sat on with both feet on the floor when its height above the
 * floor under the feet (the ground, or the floor of a prop they stand on,
 * as a boat's) lies within 0.8 to 1.2 of the popliteal height, the ratio
 * the campaign sets (#3363): a lower
 * seat needs more trunk flexion and a longer rise (Janssen, Bussmann and
 * Stam 2002, Phys Ther 82:866) and is refused. A higher one is a high seat:
 * a bar stool, a saddle, a wall. The feet leave the floor for its rests or
 * hang, and the body gets onto it by a step up or a swing of a leg. The
 * popliteal height is the knee joint's height less the thigh's radius, where
 * the thigh's underside meets a level seat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the seat frame, the socket placement rule and the suitability band with sources.
 * @evidence contracts/development/design.md#principled-representation World-metre seat geometry and degree headings name the original socket/foot/hand targets; body-derived popliteal ratios keep low/ordinary/high-seat decisions in one geometric representation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Seat/base laws share only suitability, socket/root geometry and hand-placement facades here; native support-frame and seatedHands owners retain their existing responsibilities.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Original provisional seat clearances and suitability band remain named/documented, while body, posture, seat and hand types retain their owners without a scene/body-specific shape.
 */
export namespace seated {

  /**
   * Seat heights as shares of the popliteal height that are sat on with both
   * feet on the floor. Below the band a seat is refused; above it the seat
   * is a high one ({@link high}).
   */
  export const RATIO: readonly [number, number] = [0.8, 1.2];

  /** How far the knee stands ahead of the front edge with a level thigh, metres (provisional clearance, as the namespace states). */
  const KNEE_CLEAR: number = 0.05;

  /** How far inside a shallow seat's depth the socket stays, metres (provisional, as the namespace states). */
  const DEPTH_CLEAR: number = 0.02;

  /** How far above its standing height an ankle stands off the floor: half the thigh's radius, as a share of it (provisional). */
  const OFF_FLOOR: number = 0.5;

  /**
   * Whether a seated entry sits on a high seat with a foot off the floor, as
   * a bar stool or a saddle is sat on: the socket stands above the band and a
   * foot is unplanted or its ankle stands more than half the thigh's radius
   * above its standing height over the floor.
   *
   * @param body The body.
   * @param entry The seated entry.
   * @param socket The entry's seat socket, world metres.
   * @param under The floor's height under the feet, world metres.
   * @returns Whether the body is perched, so it gets off rather than rising or edging over its feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two conditions and what follows from them.
   * @evidence contracts/development/implementation.md#principled-implementation The socket's height ratio against the band's upper end and each foot's bearing and height against its standing height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ratio and one test per foot, the one owner the rise and the shift read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The height margin is the named provisional `OFF_FLOOR` share of the body's own thigh radius.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
        (side: "left" | "right"): boolean =>
          !entry.feet[side].planted ||
          entry.feet[side].ankle.y >
            under +
              body.measure.ankleHeight +
              OFF_FLOOR * body.measure.thighRadius,
      )
    );
  }

  /**
   * Whether a seat is a high one for a body: above the band, so the feet
   * cannot stay on the floor and the body gets onto it by a step up or a
   * swing of a leg, then sits with the feet on its rests or hanging, as on a
   * bar stool, a saddle or a wall.
   *
   * @param body The body.
   * @param seat The seat.
   * @param under The floor's height under the feet, world metres; the ground's 0 when absent.
   * @returns Whether the seat is above the band.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what a high seat is and what follows from it for the feet.
   * @evidence contracts/development/implementation.md#principled-implementation The same ratio to the popliteal height `check` reads, against the band's upper end, so a seat is refused, sat on from the floor or got onto by one measure.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One comparison.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the band's own constant.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function high(
    body: IAutoMovieMotionHumanBody,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    under: number = 0,
  ): boolean {
    return ratio(body, seat, under) > RATIO[1];
  }

  /**
   * The seat height's share of the popliteal height, the height measured
   * from the floor the feet stand on ({@link floor}).
   *
   * @param body The body.
   * @param seat The seat.
   * @param under The floor's height under the feet, world metres; the ground's 0 when absent.
   * @returns The ratio.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the ratio and the floor it is measured from.
   * @evidence contracts/development/implementation.md#principled-implementation The seat's height over the feet's floor divided by the popliteal height, the measure seat heights are set against (ANSI/HFES 100-2007).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One quotient.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The height is the body's own popliteal height, never a typed one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function ratio(
    body: IAutoMovieMotionHumanBody,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    under: number = 0,
  ): number {
    return (seat.at.y - under) / popliteal(body);
  }

  /**
   * The height of the floor the feet stand on at an entry, world metres: a
   * seat's height is measured from it, since the legs reach from the seat
   * down to it. On the ground it is the ground's 0; a foot planted on a
   * prop (a boat's floor, a stage, a deck) stands on that prop's floor,
   * which is read on its displayed bearing sockets, even with its heel raised.
   * The lowest such sole is the floor, as the lower foot reaches farthest.
   *
   * @param body The body.
   * @param entry The entry state.
   * @returns The floor's height, world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which floor is read and why the lowest sole sets it.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to `HumanSupportFrame.floor`, which reads the planted feet's displayed sole sockets.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to the support frame's owner.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the support frame owns the reading.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms What the support frame's reading costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A delegating facade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function floor(body: IAutoMovieMotionHumanBody, entry: IAutoMovieMotionHumanEntryState): number {
    return HumanSupportFrame.floor(body, entry);
  }

  /**
   * Refuse a seat too low to sit on from standing, naming the least height.
   * A fixed working seat is judged by physical reach; its sitting surface
   * must stand above the feet's floor. An ordinary seat uses the height band.
   *
   * @param body The body.
   * @param seat The seat.
   * @param under The floor's height under the feet, world metres; the ground's 0 when absent.
   * @throws {HumanRefusal} When the seat lies below its appropriate height range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the refusal and the least height it names.
   * @evidence contracts/development/implementation.md#principled-implementation An ordinary seat needs the height band's lower end times popliteal height above the floor. A working seat above the floor then proceeds to the seated joint reach test.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ratio and one refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A low seat is refused with the feasible range, never sat on lower than the body can.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
        fix: working ? "put the working seat above its floor" : "use a seat whose height suits this body",
      });
  }

  /**
   * Where the seat socket goes when seated, world metres: back from the
   * front edge as the class comment states, and raised above the surface by
   * however far the thighs' undersides hang below the socket at rest, since
   * a seated body bears on whichever is lower, the ischial tuberosities or
   * the backs of the thighs, and neither may sink into the seat.
   *
   * @param body The body.
   * @param seat The seat.
   * @returns The socket's seated point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the placement back from the edge, the lift and why each holds.
   * @evidence contracts/development/implementation.md#principled-implementation The thigh's length less `KNEE_CLEAR` behind the front edge, corrected by the socket's offset from the hip joints, capped `DEPTH_CLEAR` inside a shallow seat, and raised by however far the thigh's underside hangs below the socket.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance back, one lift and one frame placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both clearances are named provisional constants; every length is the body's own.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function point(body: IAutoMovieMotionHumanBody, seat: IAutoMovieMotionHumanSeated.ISeat): IAutoMovieVector3 {
    const socket: IAutoMovieVector3 = offset(body);
    const hipJoint: IAutoMovieVector3 = body.rest.get("leftUpperLeg")!;
    let back: number = body.measure.thigh - KNEE_CLEAR + hipJoint.z - socket.z;
    if (seat.depth !== undefined) back = Math.min(back, seat.depth - DEPTH_CLEAR);
    const lift: number = Math.max(
      0,
      socket.y - (hipJoint.y - body.measure.thighRadius),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the offset and its frame.
   * @evidence contracts/development/implementation.md#principled-implementation The hips' rest position plus the body's `seat` socket in the hips' frame, which is the rest frame's at rest.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The socket is the body's declared one.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function offset(body: IAutoMovieMotionHumanBody): IAutoMovieVector3 {
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the desired world-metre socket point, degree heading units and returned world rig origin under the existing rigid socket representation.
   * @evidence contracts/development/implementation.md#principled-implementation Solves at=root+headingRotation(offset(body)) for root by the original rigid-point subtraction, exactly inverting socket's representation without introducing a second FK or target model.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One canonical heading, owned body socket offset, quaternion-vector rotation and subtraction expose the effector-to-root relation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the original rest socket offset and heading policy; it neither alters a leg/arm goal nor claims to solve additional joint articulation or admit an unreachable seat.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant geometry and one fresh vector, without a rig traversal, numerical search or temporary posed map.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses offset and the canonical heading owner shared with socket; every actual point/heading is evaluated independently, without retaining another root answer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh vector and retains no body, input point, pose, callback, workspace, history or external handle.
   */
  export function root(
    body: IAutoMovieMotionHumanBody,
    at: IAutoMovieVector3,
    heading: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll">,
  ): IAutoMovieVector3 {
    return Vector3.subtract(
      at,
      Quaternion.rotateVector(
        resolveHumanPosture.heading(heading),
        offset(body),
      ),
    );
  }

  /**
   * The world seat socket of a posture.
   *
   * @param body The body.
   * @param posture The posture.
   * @returns World metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's frame.
   * @evidence contracts/development/implementation.md#principled-implementation The rest offset turned by the posture's heading and added to its root, the inverse of `root`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rotation and one sum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The trunk's joints are not read: the socket rides the pelvis, which the root and heading place.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function socket(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieVector3 {
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        resolveHumanPosture.heading(posture),
        offset(body),
      ),
    );
  }

  /**
   * Goals that lay each palm flat on the front of the same thigh, fingers
   * toward the knee, on a posture whose legs are solved first.
   *
   * @param body The body.
   * @param posture The posture with its leg goals.
   * @param side One hand when supplied; both when absent.
   * @param resolution Optional same-query FK source, released with this observation.
   * @param projection Optional genuine same-query ROM source; actual joints still project.
   * @returns Arm goals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the goal, the side choice and the borrowed sources.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to `seatedHands.hands`, which lays each palm on the solved thigh's front surface.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to the owner of seated hand placements.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the hand placements' owner states its rules.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms What the owner's solve costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A delegating facade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function hands(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side?: "left" | "right",
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    return seatedHands.hands(body, posture, side, resolution, projection);
  }

  /**
   * A posture whose hands have moved a share of the way from hanging, as the
   * posture's own joints hold them, to resting on the thighs: each wrist
   * travels on the straight line between the two placements and the hand
   * turns by spherical interpolation, so `share` from a minimum-jerk profile
   * gives a minimum-jerk reach.
   *
   * @param body The body.
   * @param posture The posture with its legs placed and no arm goals.
   * @param share 0 hanging to 1 on the thighs.
   * @param resolution Optional same-query FK source, released with this placement.
   * @param projection Optional genuine same-query ROM source; actual joints still project.
   * @returns The posture with arm goals, or unchanged at 0.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two endpoints, the path and the share's easing.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to `seatedHands.arms`, which interpolates each wrist linearly and its turn spherically.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to the owner of seated hand placements.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the hand placements' owner states its rules.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms What the owner's solve costs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A delegating facade.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function arms(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    share: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture {
    return seatedHands.arms(body, posture, share, resolution, projection);
  }

  /**
   * A seated posture's hands a share of the way from hanging to where they
   * rest: on the armrests of a seat that has them, on the thighs otherwise.
   * A body getting up pushes on its armrests until its seat leaves the
   * seat, as it rests on them sitting down.
   *
   * @param body The body.
   * @param posture The posture with its legs placed and no arm goals.
   * @param rests The seat's armrests, world metres; none when absent.
   * @param yaw The seat's heading, degrees.
   * @param share 0 hanging to 1 resting.
   * @param resolution Optional exact FK source borrowed only for this synchronous placement.
   * @param projection Optional genuine same-body ROM metadata from that placement.
   * @returns The posture with arm goals, or unchanged at 0; a hand on an armrest bears once it is down.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States where the hands rest and when.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the unchanged thigh and armrest placements to seatedHands, which measures only the active thigh targets.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to the owner of seated hand placements.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms What the chosen call costs.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work seatedHands shares one pose solve between thigh targets and hanging origins, forwarding optional current-query FK/ROM sources to actual admission/fit and FK without retaining them across postures.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rested(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    rests: Partial<Record<"left" | "right", IAutoMovieVector3>> | undefined,
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
   * length above the rest, the palm down and the fingers ahead along the
   * seat's heading, the hand bearing.
   *
   * @param body The body.
   * @param posture The posture with its legs placed.
   * @param side The hand.
   * @param rest The armrest's point, world metres.
   * @param yaw The seat's heading, degrees.
   * @returns The arm's goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the wrist's place, the hand's turn and the bearing.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to `seatedHands.armrest`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call to the owner of seated hand placements.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None: the hand placements' owner states its rules.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function armrest(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: "left" | "right",
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the height, what it is measured to and its standard.
   * @evidence contracts/development/implementation.md#principled-implementation The knee joint's height (ankle height plus shank) less the thigh's radius.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One sum of the body's measures.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every term is the body's own measure.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function popliteal(body: IAutoMovieMotionHumanBody): number {
    return (
      body.measure.ankleHeight + body.measure.shank - body.measure.thighRadius
    );
  }
}
