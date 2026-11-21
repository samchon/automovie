import { Quaternion, Vector3, convexHull2D } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { prepareHumanFootHull } from "../posture/prepareHumanFootHull";

/** Rotated point comparisons, in metres, for the supporting planes of the hull. */
const POINT_PRECISION: number = 1e-9;

/** Zero roll and toe flexion within the arithmetic precision of posed angles, degrees. */
const ANGLE_PRECISION: number = 1e-8;

/** One hull point in metres relative to the ankle. */
interface ISolePoint {
  /** Actual convex hull point. */
  point: IAutoMovieVector3;

  /** Contact region when the profile separates heel and forefoot geometry. */
  region: "heel" | "forefoot" | undefined;
}

/** An exact two-region sole plane reached by rocking on a single real point. */
interface ISole {
  /** Pitch in degrees, positive toes up. */
  pitch: number;

  /** Fixed convex hull point in the ankle's frame, metres. */
  local: IAutoMovieVector3;

  /** The same point in the displayed entry pose, world metres. */
  entry: IAutoMovieVector3;
}

/**
 * Find a heel and forefoot plane on the foot's actual hulls. During the
 * rocker the same point must be lowest at both ends. With zero roll and
 * toe flexion, every height difference is a sinusoid of pitch, so an arc
 * shorter than half a turn preserves the nonnegative endpoint differences.
 *
 * @param body The rig and its unchanged physical profile.
 * @param side The foot whose two bearing regions are required.
 * @param foot The displayed entry ankle and rotation.
 * @param flexion Displayed toe flexion in degrees.
 * @returns The nearest compatible pitch and entry witness, or undefined when no such rocker exists.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the fixed witness, frames, units, supported geometry and fallback.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the sagittal convex hull's ascending edges as support lines. Actual points establish a common heel and forefoot plane and an unchanged entry witness.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares the existing convex hull and quaternion readers. The rocker consumes the prepared point and pitch.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses actual hull points. Unknown carrier frames, articulated entries and incompatible planes return no rocker solution.
 * @evidence contracts/development/implementation.md#efficient-algorithms Computes the hull and checks its edges during preparation. Sampling needs neither pass.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The calculation is local to the current geometry and entry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The rocker retains one entry point, one local point and one pitch.
 */
export function prepareStandSole(
  body: IAutoMovieMotionHumanBody,
  side: "left" | "right",
  foot: IAutoMovieMotionHumanEntryState.IFoot,
  flexion: number,
): ISole | undefined {
  const pitch: number = HumanFoot.pitch(foot.rotation);
  if (
    !foot.planted ||
    Math.abs(HumanFoot.roll(foot.rotation)) > ANGLE_PRECISION ||
    Math.abs(flexion) > ANGLE_PRECISION
  )
    return undefined;

  const hull: ReturnType<typeof prepareHumanFootHull> = prepareHumanFootHull(
    body,
    side,
  );
  if (!hull) return undefined;
  const ankle: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
  const points: ISolePoint[] = hull.map(
    (vertex: (typeof hull)[number]): ISolePoint => ({
      region: vertex.region,
      point: Vector3.add(
        Vector3.subtract(body.rest.get(vertex.bone)!, ankle),
        vertex.local,
      ),
    }),
  );

  const initial: number[] = points.map(({ point }: ISolePoint): number =>
    Quaternion.rotateVectorY(foot.rotation, point),
  );
  const low: number = Math.min(...initial);
  const contour: IAutoMovieVector3[] = convexHull2D(
    points.map(
      ({ point }: ISolePoint): IAutoMovieVector3 => ({
        x: point.z,
        y: 0,
        z: point.y,
      }),
    ),
  );

  let answer: ISole | undefined;
  let nearest: number = Infinity;
  for (let i: number = 0; i < contour.length; i++) {
    const back: IAutoMovieVector3 = contour[i]!;
    const front: IAutoMovieVector3 = contour[(i + 1) % contour.length]!;
    if (front.x <= back.x) continue;
    const angle: number = Math.atan2(back.z - front.z, front.x - back.x);
    const degrees: number = (angle * 180) / Math.PI;
    const travel: number = Math.abs(pitch - degrees);
    if (travel >= nearest || travel >= 180) continue;

    const sin: number = Math.sin(angle);
    const cos: number = Math.cos(angle);
    const height: number = back.z * cos + back.x * sin;
    let heel: number = Infinity;
    let forefoot: number = -Infinity;
    let contact: IAutoMovieVector3 | undefined;
    for (let k: number = 0; k < points.length; k++) {
      const { point, region }: ISolePoint = points[k]!;
      if (Math.abs(point.y * cos + point.z * sin - height) > POINT_PRECISION)
        continue;
      if (region === "heel") heel = Math.min(heel, point.z);
      if (region === "forefoot") forefoot = Math.max(forefoot, point.z);
      if (region && !contact && initial[k]! <= low + POINT_PRECISION)
        contact = point;
    }
    if (!contact || forefoot <= heel + POINT_PRECISION) continue;
    nearest = travel;
    answer = {
      pitch: degrees,
      local: contact,
      entry: Vector3.add(
        foot.ankle,
        Quaternion.rotateVector(foot.rotation, contact),
      ),
    };
  }
  return answer;
}
