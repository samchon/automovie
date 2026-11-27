import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanMaterialContact } from "../../posture/HumanMaterialContact";

/** World up for the heading and reference slope. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** Small tolerance for the entering boots' material gap, metres. */
const CONTACT: number = 0.005;

/** Angular agreement required between the material and authored plane. */
const NORMAL: number = Math.cos(0.25 * Quaternion.DEG2RAD);

/**
 * Resolve a fixed finite ski deck and its actual tangent at the entry. The
 * authored heading and grade must describe that same plane.
 */
export function prepareGlideSlope(
  context: Pick<IAutoMovieMotionHumanActionContext, "prop" | "start">,
  subject: string,
  expected: IAutoMovieQuaternion,
): prepareGlideSlope.ISlope {
  const refuse = (reason: string): never => {
    throw new HumanRefusal({
      kind: "affordance",
      axis: "slope",
      value: subject,
      reason,
      fix: "stage both boots on a finite deck whose grade matches the glide",
    });
  };
  const read: IAutoMovieMotionHumanPropReader = context.prop(subject);
  const faces: IAutoMovieAffordance[] = (read.prop.affordances ?? []).filter(
    (site: IAutoMovieAffordance): boolean =>
      site.kind === "surface" &&
      HumanMaterialContact.perimeter(site) !== undefined,
  );
  const named: IAutoMovieAffordance | undefined =
    faces.find((site: IAutoMovieAffordance): boolean => site.id === "top") ??
    (faces.length === 1 ? faces[0] : undefined);
  if (
    named === undefined ||
    read.prop.fixed !== true ||
    read.prop.motion !== undefined ||
    read.prop.hasArticulations === true
  )
    return refuse(`${subject} needs one fixed, finite bearing surface`);
  const face: HumanMaterialContact.IFace | undefined =
    HumanMaterialContact.prepare(read, named.id, context.start)?.at(
      context.start,
    );
  if (face === undefined)
    return refuse(`${subject} has no finite face at ${named.id}`);
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    face.frame.rotation,
    UP,
  );
  if (Vector3.dot(normal, Quaternion.rotateVector(expected, UP)) < NORMAL)
    return refuse(
      `${subject}/${named.id} does not match the authored grade and heading`,
    );
  const heading: IAutoMovieVector3 = Quaternion.rotateVector(expected, {
    x: 0,
    y: 0,
    z: 1,
  });
  const right: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(normal, heading),
  );
  const ahead: IAutoMovieVector3 = Vector3.cross(right, normal);
  const rotation: IAutoMovieQuaternion = AutoMovieEngineMath.quaternionFromBasis(
    right,
    normal,
    ahead,
  );
  const bounds: prepareGlideSlope.IEdge[] = face.outline.map(
    (a: IAutoMovieVector3, index: number): prepareGlideSlope.IEdge => {
      const b: IAutoMovieVector3 =
        face.outline[(index + 1) % face.outline.length]!;
      const x: number = a.z - b.z;
      const z: number = b.x - a.x;
      const local: IAutoMovieVector3 = Vector3.normalize({ x, y: 0, z });
      const oriented: number[] = face.outline.map(
        (point: IAutoMovieVector3): number =>
          Vector3.dot(local, Vector3.subtract(point, a)),
      );
      const positive: boolean = oriented.every(
        (value: number): boolean => value >= -1e-9,
      );
      if (
        !positive &&
        !oriented.every((value: number): boolean => value <= 1e-9)
      )
        return refuse(
          `${subject}/${named.id} needs a convex supporting outline`,
        );
      return {
        point: HumanMaterialContact.world(face, a),
        normal: Quaternion.rotateVector(
          face.frame.rotation,
          positive ? local : Vector3.scale(local, -1),
        ),
      };
    },
  );
  return {
    rotation,
    point: named.id,
    enter: (position: IAutoMovieVector3): IAutoMovieVector3 => {
      const distance: number = Vector3.dot(
        Vector3.subtract(position, face.frame.position),
        normal,
      );
      if (Math.abs(distance) > CONTACT)
        return refuse(
          `an entering sole is ${(Math.abs(distance) * 1000).toFixed(1)} mm from ${named.id}`,
        );
      return Vector3.addScaled(position, normal, -distance);
    },
    travel: (start, local, distance, curvature): void => {
      const turn: number = curvature * distance;
      for (const edge of bounds) {
        const x: number = Vector3.dot(edge.normal, right);
        const z: number = Vector3.dot(edge.normal, ahead);
        const base: number = Vector3.dot(
          edge.normal,
          Vector3.subtract(start, edge.point),
        );
        const from: number = base + x * local.x + z * local.z;
        let minimum: number = Math.min(from, from + z * distance);
        if (curvature !== 0) {
          const radial: number = local.x - 1 / curvature;
          const cos: number = x * radial + z * local.z;
          const sin: number = x * local.z - z * radial;
          const signed = (angle: number): number =>
            from +
            cos * (-2 * Math.sin(angle / 2) ** 2) +
            sin * Math.sin(angle);
          minimum = Math.min(from, signed(turn));
          const extremum: number = Math.atan2(sin, cos);
          for (let half: number = -2; half <= 2; ++half) {
            const angle: number = extremum + half * Math.PI;
            if (Math.min(0, turn) < angle && angle < Math.max(0, turn))
              minimum = Math.min(minimum, signed(angle));
          }
        }
        if (minimum < -1e-8)
          return refuse(
            `a sole's path leaves the finite surface ${subject}/${named.id}`,
          );
      }
    },
  };
}

/** The admitted plane and its use by the continuous path. */
export namespace prepareGlideSlope {
  /** One convex edge with its inward tangent normal. */
  export interface IEdge {
    /** A fixed point on the edge in world metres. */
    point: IAutoMovieVector3;
    /** The edge's inward tangent direction. */
    normal: IAutoMovieVector3;
  }

  /** The actual material the feet bear on and its preparation checks. */
  export interface ISlope {
    /** The slope normal and entry heading as the glide's tangent frame. */
    rotation: IAutoMovieQuaternion;
    /** The name of the staged bearing feature. */
    point: string;
    /** Validate and project an entering world contact onto the plane. */
    enter(position: IAutoMovieVector3): IAutoMovieVector3;
    /** Check a contact's entire straight or circular path against the deck. */
    travel(
      origin: IAutoMovieVector3,
      local: IAutoMovieVector3,
      distance: number,
      curvature: number,
    ): void;
  }
}
