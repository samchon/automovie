import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "./AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "./IAutoMovieHumanSkeleton";

/**
 * Forearm rotation from the canonical rest, palm down, to the anatomical position, palm forward, degrees about the rest arm's +X on both sides: supination from the thumb-up neutral, the posture the carrying angle is measured in (Kaewpornsawan et al. 2018, Siriraj Med J 70(4):284-288: elbow fully extended, forearm supinated). Grade: conventional, the anatomical position's definition.
 */
const SUPINATION: number = -90;

/**
 * Tilt a forearm's joint axes so supinating it into the anatomical position opens the carrying angle, while the rest forearm stays straight.
 *
 * The carrying angle is defined and measured with the forearm supinated; with the palm turned toward the thigh or down it shrinks and disappears, because the radius turns about an axis from the radial head to the head of the ulna, which is oblique to the line from the elbow's centre to the wrist's (Kaewpornsawan et al. 2018 measured it only supinated). The canonical T-pose rest keeps the forearm straight and horizontal with the palm down, so a pose authored for any humanoid starts from the same rest, and the angle lives in the forearm's declared axes instead: the twist axis is tilted off the bone by the cone angle whose 90-degree turn moves the forearm by the carrying angle, `sin² α = 1 - cos θ`, in the plane that makes supination swing the hand away from the body. Flexion and abduction keep their right angles to it, so the elbow's hinge is oblique by the same small angle, as the trochlea's is. The three axes are turned as one rigid frame, so they stay orthonormal and a zero angle returns them unchanged.
 *
 * @param axes The forearm's axes in the canonical T-pose rest: flexion +Y, abduction +Z, twist +X
 * @param side Which forearm; the left one points along +X, the right along -X
 * @param carryingAngle Carrying angle in degrees, positive valgus
 * @returns The tilted axes in the same frame
 */
export function tiltAutoMovieHumanForearmAxes(
  axes: IAutoMovieHumanSkeleton.IAxes,
  side: "left" | "right",
  carryingAngle: number,
): IAutoMovieHumanSkeleton.IAxes {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  const theta: number = (carryingAngle * Math.PI) / 180;
  if (Math.abs(Math.sin(theta)) < 1e-12) return axes;
  const s: number = side === "left" ? 1 : -1;
  // rest direction and its direction once supinated, valgus turning away from the body
  const d: IAutoMovieVector3 = V.of(s, 0, 0);
  const target: IAutoMovieVector3 = V.rotateZ(
    d,
    V.of(0, 0, 0),
    s * carryingAngle,
  );
  const m: IAutoMovieVector3 = V.normalize(V.offset(d, [target, 1]));
  const n: IAutoMovieVector3 = V.normalize(V.cross(d, target));
  const cone: number = Math.asin(Math.sqrt(1 - Math.cos(theta)));
  const beta: number = Math.acos(
    Math.min(1, Math.cos(cone) / Math.cos(theta / 2)),
  );
  let best: IAutoMovieVector3 = V.of(1, 0, 0);
  let error: number = Infinity;
  for (const sign of [1, -1])
    for (const flip of [1, -1]) {
      const a: IAutoMovieVector3 = V.offset(
        V.of(0, 0, 0),
        [m, flip * Math.cos(beta)],
        [n, flip * sign * Math.sin(beta)],
      );
      if (a.x <= 0) continue;
      const moved: IAutoMovieVector3 = rotate(d, a, SUPINATION);
      const miss: number = V.distance(moved, target);
      if (miss < error) {
        error = miss;
        best = a;
      }
    }
  // the rigid turn carrying +X onto the tilted twist axis
  const pivot: IAutoMovieVector3 = V.cross(V.of(1, 0, 0), best);
  const angle: number =
    (Math.asin(Math.hypot(pivot.x, pivot.y, pivot.z)) * 180) / Math.PI;
  const turn: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 => rotate(v, V.normalize(pivot), angle);
  return {
    flexion: turn(axes.flexion),
    abduction: turn(axes.abduction),
    twist: turn(axes.twist),
  };
}

/**
 * Rotate a direction about a unit axis by Rodrigues' formula.
 *
 * @param v Direction to rotate
 * @param axis Unit axis
 * @param degrees Angle, right-handed about the axis
 * @returns The rotated direction
 */
function rotate(
  v: IAutoMovieVector3,
  axis: IAutoMovieVector3,
  degrees: number,
): IAutoMovieVector3 {
  const r: number = (degrees * Math.PI) / 180;
  const c: number = Math.cos(r);
  const k: IAutoMovieVector3 = AutoMovieHumanVector.cross(axis, v);
  const dot: number = AutoMovieHumanVector.dot(axis, v);
  return AutoMovieHumanVector.of(
    v.x * c + k.x * Math.sin(r) + axis.x * dot * (1 - c),
    v.y * c + k.y * Math.sin(r) + axis.y * dot * (1 - c),
    v.z * c + k.z * Math.sin(r) + axis.z * dot * (1 - c),
  );
}
