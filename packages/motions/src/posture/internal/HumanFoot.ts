import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanFoot, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanFootOutline } from "./HumanFootOutline";
import { HumanFootRotation } from "./HumanFootRotation";
import { humanFootBones } from "./humanFootBones";
import { humanFootOffset } from "./humanFootOffset";
import { prepareHumanFootAnkle } from "./prepareHumanFootAnkle";
import { prepareHumanFootAt } from "./prepareHumanFootAt";
import { prepareHumanFootHeight } from "./prepareHumanFootHeight";
import { prepareHumanFootPivot } from "./prepareHumanFootPivot";
import { prepareHumanFootPoint } from "./prepareHumanFootPoint";
import { prepareHumanFootSole } from "./prepareHumanFootSole";
import { readHumanFoot } from "./readHumanFoot";

/*
 * A foot on the floor as a rigid rocker: where its ankle and its sole points
 * are when it pivots about its heel or its ball by a pitch, at a heading.
 *
 * Gait analysis describes stance as three rockers (Perry and Burnfield, Gait
 * Analysis, 2nd ed.): the heel rocker, where the foot rolls down about the heel
 * after initial contact; the ankle rocker, foot flat while the tibia advances;
 * and the forefoot rocker, where the heel rises and the foot turns about the
 * metatarsal heads until toe-off. Each is a rotation of the rigid foot about a
 * floor point, so the contact point stays fixed while the ankle moves, which is
 * what keeps a planted foot from sliding.
 *
 * The foot's geometry is read from the body's own sockets: the heel and ball
 * points relative to the ankle joint at rest, and `mtp`, the toes' joint, the
 * metatarsophalangeal axis the forefoot rocker turns about with the toes flat
 * (Perry and Burnfield), above the ball's floor point. A socket riding the toes
 * bone (the toe tip, when the profile jointed the toes) bends at the ball by
 * the toes' flexion: through the forefoot rocker the toes extend at the
 * metatarsophalangeal joints and stay flat on the floor while the heel rises
 * (Perry and Burnfield), so a walk extends them by the rocker's angle. `pitch`
 * is in degrees about the foot's lateral axis, positive lifting the toes;
 * `toes` is the toes' flexion from the foot in degrees, positive lifting them;
 * `heading` is the foot's yaw about +Y in degrees (0 faces +Z).
 */
export namespace HumanFoot {
  /*
   * Bound base/socket geometry for one unchanged synchronous displayed-bone
   * reading (`readHumanFoot`); release it with that evaluation.
   */
  export const reading: typeof readHumanFoot = readHumanFoot;

  /*
   * The ankle alone of a foot pivoting about a fixed sole point, for a search
   * over pitches (`prepareHumanFootAnkle`); the reader overwrites the record it
   * returns.
   */
  export const prepareAnkle: typeof prepareHumanFootAnkle =
    prepareHumanFootAnkle;

  /*
   * A fixed-articulation reader over a varying world contact
   * (`prepareHumanFootAt`), preserving fresh placement outputs.
   */
  export const prepareAt: typeof prepareHumanFootAt = prepareHumanFootAt;

  /*
   * The sole sockets of Socket, as data.
   */
  export const SOCKETS: readonly ["heel", "ball", "toe"] = [
    "heel",
    "ball",
    "toe",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanFoot.Socket>[];

  /*
   * A foot's three sole sockets on displayed bones, heel first, each placed on
   * the bone it rides: the toe socket of a profile with jointed toes moves with
   * the toes bone, not with the foot.
   * Parameter body: The body.
   * Parameter bones: The displayed bones.
   * Parameter side: The foot.
   * Returns: The heel, the ball and the toe.
   */
  export function sockets(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanFoot.ISocket[] {
    return (["heel", "ball", "toe"] as const).map(
      (
        socket: IAutoMovieMotionHumanFoot.Socket,
      ): IAutoMovieMotionHumanFoot.ISocket => {
        const frame: IAutoMovieHumanoidSurfaces.IFrame =
          body.surfaces.sockets[
            `${socket}${side === "left" ? "Left" : "Right"}`
          ];
        return {
          socket,
          point: AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
            frame,
            bones.get(frame.bone)!,
          ),
        };
      },
    );
  }

  /*
   * The height above a foot's lowest sole point within which a part of the sole
   * is on the floor, metres: under half the 12.9 mm mean minimum toe clearance
   * of the swinging foot in normal walking (Winter 1992, Foot trajectory in
   * human gait, Physical Therapy 72(1):45-53), so a foot at the lowest point of
   * a normal swing is not read as on the floor.
   */
  export const BEARING: number = 0.006;

  /*
   * The base of support of displayed bones: the area within the outlines of the
   * feet where they bear on the floor (Winter, Biomechanics and Motor Control
   * of Human Movement, 4th ed., ch. 4: the base of support is the area bounded
   * by the outline of the feet in contact with the ground), the points whose
   * convex hull a margin of stability is measured to (Hof, Gazendam and Sinke
   * 2005).
   *
   * Place the sole collider outline on the displayed bones. A foot without a
   * collider outline uses its sole sockets. Points within `BEARING` of the
   * lowest point bear, so lifting the heel shifts support to the forefoot.
   * Parameter body: The body.
   * Parameter bones: The displayed bones.
   * Parameter sides: The feet that bear; both when absent.
   * Returns: The left foot's bearing points, then the right foot's, world
   * metres.
   */
  export function base(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    sides: readonly AutoMovieHumanSide[] = ["left", "right"],
  ): IAutoMovieVector3[] {
    return readHumanFoot(body, bones).base(sides);
  }

  /*
   * The points a placed foot stands on, flat with its toes flat: its sole
   * sockets and the corners of its outline (`outline`), world metres.
   * Parameter body: The body.
   * Parameter side: The foot.
   * Parameter foot: The foot's placement.
   * Returns: The heel, the ball and the toe, then the outline's corners.
   */
  export function sole(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ): IAutoMovieVector3[] {
    return prepareHumanFootSole(body, side)(foot);
  }

  /*
   * The height of a placed foot's lowest sole point, flat-toed (`sole`): the
   * point a swing's clearance is measured at, as gait measures the swinging
   * foot's clearance at its lowest point (Winter 1992).
   * Parameter body: The body.
   * Parameter side: The foot.
   * Parameter foot: The foot's placement.
   * Returns: The least height of its sole's points, world metres.
   */
  export function lowest(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    foot: IAutoMovieMotionHumanFoot.IPlacement,
  ): number {
    return Math.min(
      ...sole(body, side, foot).map(
        (point: IAutoMovieVector3): number => point.y,
      ),
    );
  }

  /*
   * Flat-toed sole geometry over changing foot placements
   * (`prepareHumanFootSole`), shared only for unchanged body-local geometry.
   */
  export const prepareSole: typeof prepareHumanFootSole = prepareHumanFootSole;

  /*
   * A foot's outline on its sole, the corners of its colliders seen from below
   * as frames on its bones (`HumanFootOutline`).
   */
  export const outline: typeof HumanFootOutline = HumanFootOutline;

  /*
   * A placement turned on the floor about its ankle's vertical.
   * Parameter foot: The placement.
   * Parameter degrees: The turn about +Y, degrees.
   * Returns: The turned placement; the same one for no turn.
   */
  export function turned(
    foot: IAutoMovieMotionHumanFoot.IPlacement,
    degrees: number,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    if (degrees === 0) return foot;
    return {
      ankle: foot.ankle,
      rotation: Quaternion.normalize(
        Quaternion.multiply(YAW(degrees), foot.rotation),
      ),
    };
  }

  /*
   * The foot's rotation from rest for a heading, a pitch and a roll.
   * Parameter heading: Degrees about +Y.
   * Parameter pitch: Degrees, positive toes up.
   * Parameter roll: Degrees about the foot's forward axis, positive lifting its
   * outer border on the left foot's side (+X at rest); none when absent.
   * Returns: The rotation.
   */
  export const rotation: (
    heading: number,
    pitch: number,
    roll?: number,
  ) => IAutoMovieQuaternion = HumanFootRotation;

  /*
   * Prepare the exact height component of one fixed articulated socket for
   * actual clearance-only queries.
   */
  export const prepareHeight: typeof prepareHumanFootHeight =
    prepareHumanFootHeight;

  /*
   * Actual socket/outline frame bone membership for one unchanged
   * displayed-foot observation.
   */
  export const bones: typeof humanFootBones = humanFootBones;

  /*
   * The roll of a foot's rotation about its forward axis, degrees, as
   * `rotation` takes it: the rise of its lateral axis.
   * Parameter rotation: The foot's rotation.
   * Returns: Degrees.
   */
  export function roll(rotation: IAutoMovieQuaternion): number {
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    return (Math.asin(Math.max(-1, Math.min(1, lateral.y))) * 180) / Math.PI;
  }

  /*
   * A foot's heading from its rotation, read off its lateral axis: a pitch
   * leaves that axis level, so the heading holds when a folded shank carries
   * the foot's pitch past vertical, where its forward axis points backward.
   * Parameter rotation: The foot's world rotation, a heading and a pitch.
   * Returns: Degrees about +Y.
   */
  export function heading(rotation: IAutoMovieQuaternion): number {
    const lateral: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    return (Math.atan2(-lateral.z, lateral.x) * 180) / Math.PI;
  }

  /*
   * A foot's pitch from its rotation, about the lateral axis `heading` reads,
   * so it runs past ±90° where the foot points past vertical.
   * Parameter rotation: The foot's world rotation, a heading and a pitch.
   * Returns: Degrees, positive toes up.
   */
  export function pitch(rotation: IAutoMovieQuaternion): number {
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return pitchAt(toes, heading(rotation));
  }

  /*
   * Read heading and toes-up pitch from the same foot rotation, sharing the
   * lateral-axis heading needed by both values.
   * Parameter rotation: The foot's world rotation.
   * Returns: A fresh degree-valued pair, preserving pitch beyond vertical.
   */
  export function headingPitch(
    rotation: IAutoMovieQuaternion,
  ): IHeadingPitchResult {
    const angle: number = heading(rotation);
    const toes: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
      x: 0,
      y: 0,
      z: 1,
    });
    return { heading: angle, pitch: pitchAt(toes, angle) };
  }

  /*
   * A sole point's offset from the ankle in the foot's rest frame, the toes
   * flexed by an angle.
   * Parameter body: The body.
   * Parameter side: The foot.
   * Parameter point: Which sole point.
   * Parameter toes: The toes' flexion, degrees, positive lifting them.
   * Returns: The offset, metres.
   */
  export const offset: typeof humanFootOffset = humanFootOffset;

  /*
   * Fixed body/socket geometry over varying actual toe angles, owned by
   * humanFootOffset.prepare.
   */
  export const prepareOffset: typeof humanFootOffset.prepare =
    humanFootOffset.prepare;

  /*
   * A point a foot pivots about: a named sole point, or a point in the foot's
   * rest frame from the ankle (an edge, `edge`).
   */
  export type Pivot =
    | "heel"
    | "ball"
    | "toe"
    | "sole"
    | "mtp"
    | IAutoMovieVector3;

  /*
   * A forefoot edge in the foot's rest frame from the ankle: the ball's sole
   * point carried across the foot by half its breadth across the metatarsal
   * heads (`IAutoMovieBodyMeasure.footBreadth`), toward its +X border or its -X
   * one. A foot rolled past the ankle's range bears on that edge, so a contact
   * window declares it as the point held
   * (`IAutoMovieMotionHumanContactWindow.socket`) and the foot pivots about
   * it.
   * Parameter body: The body.
   * Parameter side: The foot.
   * Parameter border: +1 for the +X border, -1 for the -X one.
   * Parameter half: How far the edge lies from the sole's midline, metres; half the
   * foot's breadth when absent.
   * Returns: The edge, metres in the foot's rest frame from the ankle.
   */
  export function edge(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    border: number,
    half: number = body.measure.footBreadth / 2,
  ): IAutoMovieVector3 {
    // The edge runs along the forefoot from the ball to the toe; a foot
    // rolled about its long axis bears on whichever of its two ends lies
    // lower in the foot's frame, the other standing no lower.
    const ball: IAutoMovieVector3 = offset(body, side, "ball", 0);
    const toe: IAutoMovieVector3 = offset(body, side, "toe", 0);
    const low: IAutoMovieVector3 = toe.y < ball.y ? toe : ball;
    return { ...low, x: low.x + Math.sign(border) * half };
  }

  /*
   * The foot placed by pivoting about a sole point fixed on the floor.
   * Parameter body: The body.
   * Parameter side: The foot.
   * Parameter pivot: Which sole point stays on the floor.
   * Parameter at: Where that point is, world metres.
   * Parameter heading: The foot's heading, degrees.
   * Parameter pitch: The pitch, degrees, positive toes up.
   * Parameter toes: The toe joint flexion, degrees; zero when absent.
   * Parameter roll: The foot roll, degrees; zero when absent.
   * Returns: The foot's placement.
   */
  export function pivot(
    body: humanFootOffset.IBody,
    side: AutoMovieHumanSide,
    pivot: Pivot,
    at: IAutoMovieVector3,
    heading: number,
    pitch: number,
    toes: number = 0,
    roll: number = 0,
  ): IAutoMovieMotionHumanFoot.IPlacement {
    const r: IAutoMovieQuaternion = rotation(heading, pitch, roll);
    const local: IAutoMovieVector3 =
      typeof pivot === "string" ? offset(body, side, pivot, toes) : pivot;
    return {
      ankle: Vector3.subtract(at, Quaternion.rotateVector(r, local)),
      rotation: r,
    };
  }

  /*
   * Prepare rigid sole geometry for repeated pitch trials under one fixed
   * heading, toe flexion, roll and default contact (`prepareHumanFootPivot`).
   */
  export const preparePivot: typeof prepareHumanFootPivot =
    prepareHumanFootPivot;

  /*
   * Where the ankle goes, and how far the toes extend, when a planted foot
   * reaches a rotation other than the one asked for: the foot turns about its
   * contact, which stays where the goal put it, and the toes take back the
   * pitch the foot lost, so they stay on the floor. When the shank leans past
   * the ankle's dorsal range, this is the heel-off of the terminal stance
   * rocker (Perry and Burnfield): the heel rises about the ball and the toes
   * dorsiflex at the metatarsophalangeal joints.
   * Parameter asked: The rotation the goal asked for.
   * Parameter reached: The rotation the limb reached.
   * Parameter anchor: The contact's world point under the asked rotation.
   * Parameter contact: The contact in the foot's rest frame, relative to the ankle.
   * Returns: The ankle point and the toes' added flexion, degrees, positive
   * lifting them.
   */
  export function heelOff(
    asked: IAutoMovieQuaternion,
    reached: IAutoMovieQuaternion,
    anchor: IAutoMovieVector3,
    contact: IAutoMovieVector3,
  ): IAutoMovieMotionHumanFoot.IHeelOffResult {
    return {
      ankle: Vector3.subtract(
        anchor,
        Quaternion.rotateVector(reached, contact),
      ),
      toes: Math.max(0, pitch(asked) - pitch(reached)),
    };
  }

  /*
   * A sole point's world position for a placed foot.
   * Parameter body: The body.
   * Parameter side: The foot.
   * Parameter point: Which sole point.
   * Parameter foot: The foot's placement.
   * Parameter toes: The toes' flexion, degrees, positive lifting them.
   * Returns: The point, world metres.
   */
  export function point(
    body: humanFootOffset.IBody,
    side: AutoMovieHumanSide,
    point: PointPoint,
    foot: IAutoMovieMotionHumanFoot.IPlacement,
    toes: number = 0,
  ): IAutoMovieVector3 {
    return prepareHumanFootPoint(body, side, point, toes)(foot);
  }

  /*
   * Prepare a sole point whose body, socket and toe flexion remain fixed
   * (`prepareHumanFootPoint`).
   */
  export const preparePoint: typeof prepareHumanFootPoint =
    prepareHumanFootPoint;

  /*
   * Pitch projected along the same lateral-axis heading, in clinical degrees.
   */
  function pitchAt(toes: IAutoMovieVector3, angle: number): number {
    const yaw: number = (angle * Math.PI) / 180;
    return (
      (Math.atan2(toes.y, toes.x * Math.sin(yaw) + toes.z * Math.cos(yaw)) *
        180) /
      Math.PI
    );
  }
}

/*
 * The alternatives of `PointPoint`'s site.
 */
type PointPoint = "heel" | "ball" | "toe" | "sole" | "mtp";

/*
 * The record of `IHeadingPitchResult`'s site.
 */
type IHeadingPitchResult = {
  heading: number;
  pitch: number;
};

/*
 * The unchanged world-up axis shared only as axis-angle scalar preparation.
 */
const YAW: ReturnType<typeof Quaternion.prepareAxisAngle> =
  Quaternion.prepareAxisAngle({ x: 0, y: 1, z: 0 });
