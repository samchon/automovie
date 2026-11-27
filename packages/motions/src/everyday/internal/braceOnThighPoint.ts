import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../../actions/internal/stand";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanHand } from "../../posture/internal/HumanHand";
import { handReach } from "./handReach";
import { palmSagitta } from "./palmSagitta";

/*
 * Where a palm braces on its own thigh just above the knee, the hand support of
 * a low posture (Kingma, Faber and van Dieen 2016, J Biomech 49:881, on
 * supporting the trunk with a hand on the thigh "just above the knee"), read on
 * the solved leg: the palm's centre half the body's own hand length above the
 * knee on the thigh's front, so the heel of the hand rests just above the
 * kneecap and the fingers reach toward it; the outward normal there, and the
 * thigh's direction toward the knee the fingers lie along.
 * Parameter body: The body, for its thigh regions.
 * Parameter side: The thigh.
 * Returns: A reader of the resolved thigh, knee and shoulder bones. The result
 * gives the clearance-adjusted palm site, normal and knee direction.
 */
export function braceOnThighPoint(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  supporting?: IAutoMovieVector3,
): IRead {
  const region: IAutoMovieMotionHumanBody["surfaces"]["regions"]["thighFrontLeft"] =
    body.surfaces.regions[
      side === "left" ? "thighFrontLeft" : "thighFrontRight"
    ];
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
    body,
    side,
    "palm",
    "flat",
  );
  const elbow: number =
    ((stand.relaxed(body)[`${side}LowerArm`]?.[0] ?? 0) * Math.PI) / 180;
  const reach: number = Math.sqrt(
    m.upperArm * m.upperArm +
      m.forearm * m.forearm +
      2 * m.upperArm * m.forearm * Math.cos(elbow),
  );
  const neutral: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  // The palm stands off by its colliders' reach past it and by the thigh's
  // curve under its sides (`palmSagitta`), so its thumb and little finger
  // clear the thigh too.
  const depth: number =
    Math.max(
      0,
      handReach(
        body,
        neutral,
        side,
        Quaternion.identity(),
        "palm",
        "flat",
      )(palm.normal),
    ) + palmSagitta(body);
  return (
    bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  ): IBrace => {
    const thigh: IAutoMovieResolvedBone = bones.get(`${side}UpperLeg`)!;
    const knee: IAutoMovieVector3 = bones.get(`${side}LowerLeg`)!.worldPosition;
    const onThigh: IAutoMovieVector3 = Vector3.add(
      thigh.worldPosition,
      Quaternion.rotateVector(thigh.worldRotation, region.point),
    );

    const along: IAutoMovieVector3 = Vector3.subtract(
      knee,
      thigh.worldPosition,
    );
    const axis: IAutoMovieVector3 = Vector3.normalize(along);
    // A thigh surface can taper toward the knee. Its skin normal then
    // has an axial component; the contact section itself is perpendicular
    // to the line of the femur so a ray through it keeps its height.
    const skinNormal: IAutoMovieVector3 = Quaternion.rotateVector(
      thigh.worldRotation,
      region.normal,
    );
    const anterior: IAutoMovieVector3 = Vector3.normalize(
      Vector3.addScaled(skinNormal, axis, -Vector3.dot(skinNormal, axis)),
    );
    const lateral: IAutoMovieVector3 = Vector3.normalize(
      Vector3.cross(axis, anterior),
    );
    const shoulder: IAutoMovieVector3 = bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const fromKnee: IAutoMovieVector3 = Vector3.subtract(onThigh, knee);
    const radial: IAutoMovieVector3 = Vector3.addScaled(
      fromKnee,
      axis,
      -Vector3.dot(fromKnee, axis),
    );
    // The arm approaches on the shoulder's side of the front surface.
    // Project its lateral line onto the thigh cross-section so the
    // forearm can descend alongside the hip on an upright kneeling thigh.
    const bearing =
      supporting === undefined
        ? undefined
        : Vector3.addScaled(supporting, axis, -Vector3.dot(supporting, axis));
    const normal: IAutoMovieVector3 =
      bearing !== undefined && Vector3.dot(bearing, bearing) > 0
        ? Vector3.normalize(bearing)
        : Vector3.normalize(
            Vector3.addScaled(
              Vector3.scale(anterior, Math.abs(Vector3.dot(radial, anterior))),
              lateral,
              Vector3.dot(Vector3.subtract(shoulder, knee), lateral),
            ),
          );
    const front: IAutoMovieVector3 = Vector3.addScaled(
      knee,
      normal,
      Vector3.length(radial),
    );
    const rotation: IAutoMovieQuaternion = HumanHand.align(palm, {
      normal: Vector3.scale(normal, -1),
      forward: along,
    });
    const wrist: IAutoMovieVector3 = Vector3.subtract(
      Vector3.addScaled(front, normal, depth),
      Quaternion.rotateVector(rotation, palm.point),
    );

    // The nearer intersection with the shoulder-to-palm reach sphere
    // raises the site on an upright kneeling thigh.
    const d: IAutoMovieVector3 = Vector3.subtract(wrist, shoulder);
    const b: number = Vector3.dot(axis, d);
    const disc: number = b * b - Vector3.dot(d, d) + reach * reach;
    const up: number = Math.max(
      m.hand / 2,
      disc >= 0 ? b - Math.sqrt(disc) : m.hand / 2,
    );
    const only: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      new Map([[region.bone, thigh]]);
    const span: number = m.thigh + m.hand;
    const colliders: ReturnType<typeof HumanColliders.reading> =
      HumanColliders.reading(body, only);
    const padded: (height: number) => IBrace = (height: number): IBrace => {
      const geometric: IAutoMovieVector3 = Vector3.addScaled(
        front,
        axis,
        -height,
      );
      const hit: ReturnType<typeof HumanColliders.cast> = colliders.cast(
        Vector3.addScaled(geometric, normal, span),
        Vector3.scale(normal, -1),
        2 * span,
      );
      if (hit === undefined)
        return {
          point: Vector3.addScaled(geometric, normal, depth),
          normal,
          rotation,
        };
      const facing: IAutoMovieVector3 =
        Vector3.dot(hit.normal, normal) > 0 ? hit.normal : normal;
      return {
        point: Vector3.addScaled(hit.point, facing, depth),
        normal: facing,
        rotation: HumanHand.align(palm, {
          normal: Vector3.scale(facing, -1),
          forward: along,
        }),
      };
    };
    const missed: (brace: IBrace) => boolean = (brace: IBrace): boolean =>
      Vector3.distance(
        Vector3.subtract(
          brace.point,
          Quaternion.rotateVector(brace.rotation, palm.point),
        ),
        shoulder,
      ) > reach;
    // Clearance along a tapered skin normal can lower the palm relative
    // to its ray. Place the padded palm, not the unpadded skin, above the
    // knee by its half hand length.
    const first: IBrace = padded(up);
    const height: number = Vector3.dot(
      Vector3.subtract(knee, first.point),
      axis,
    );
    const station: number = up + Math.max(0, m.hand / 2 - height);
    const nearest: IBrace = station === up ? first : padded(station);
    // Curvature changes both the surface point and its tangent plane.
    const top: number = Math.max(station, Vector3.length(along) - m.hand / 2);
    if (top > station && missed(nearest) && !missed(padded(top)))
      return padded(
        AutoMovieEngineMath.bracketedBisection(
          (height: number): boolean => missed(padded(height)),
          station,
          top,
          SITE_RESOLUTION,
        ),
      );
    return nearest;
  };
}

/*
 * The palm site and its orientation in the actual thigh's frame.
 */
interface IBrace {
  /*
   * World metres, out from the collider by the hand's contact depth.
   */
  point: IAutoMovieVector3;

  /*
   * The outward world normal of the thigh region.
   */
  normal: IAutoMovieVector3;

  /*
   * Rotation seating the open palm along this thigh.
   */
  rotation: IAutoMovieQuaternion;
}

/*
 * The bones displayed by a single braced posture.
 */
type IRead = (
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
) => IBrace;

/*
 * A tenth of a millimetre resolves the surface intersection below skin
 * tolerance.
 */
const SITE_RESOLUTION: number = 1e-4;
