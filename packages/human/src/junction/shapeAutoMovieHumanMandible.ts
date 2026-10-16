import { IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHumanLandmarks } from "../measure/IAutoMovieHumanLandmarks";
import { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_JAWLINE } from "./AUTOMOVIE_HUMAN_JAWLINE";
import { AUTOMOVIE_HUMAN_NECK_COLUMN } from "./AUTOMOVIE_HUMAN_NECK_COLUMN";
import { IAutoMovieHumanRingLayout } from "./IAutoMovieHumanRingLayout";
import { IAutoMovieHumanRingShape } from "./IAutoMovieHumanRingShape";
import { shapeAutoMovieHumanRadialSection } from "./shapeAutoMovieHumanRadialSection";

/**
 * The mandibular outline as an internal head guide, never a part boundary.
 *
 * The plane passes through menton and both gonia; the existing jawline and
 * neck-column formulas fix its contour. No cage point is pinned to this guide.
 *
 * @param measurements Resolved dimensions, millimetres
 * @param skeleton Shared rest skeleton
 * @returns The guide's radial section in model millimetres
 */
export function shapeAutoMovieHumanMandible(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
): IAutoMovieHumanRingShape {
  const landmarks: IAutoMovieHumanLandmarks = skeleton.landmarks;
  const joint: (bone: string) => IAutoMovieVector3 = (bone: string): IAutoMovieVector3 =>
    skeleton.joints.find(
      (j: IAutoMovieHumanSkeleton.IJoint): boolean => j.bone === bone,
    )!.position;
  const a: IAutoMovieVector3 = landmarks.right.gonion.position;
  const b: IAutoMovieVector3 = landmarks.left.gonion.position;
  const c: IAutoMovieVector3 = landmarks.menton.position;
  const planeNormal: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.cross(
      AutoMovieHumanVector.offset(b, [a, -1]),
      AutoMovieHumanVector.offset(c, [a, -1]),
    ),
  );
  const bone: IAutoMovieVector3 = AutoMovieHumanVector.offset(joint("head"), [
    joint("neck"),
    -1,
  ]);
  const distance: number =
    AutoMovieHumanVector.dot(
      AutoMovieHumanVector.offset(a, [joint("neck"), -1]),
      planeNormal,
    ) / AutoMovieHumanVector.dot(bone, planeNormal);
  const origin: IAutoMovieVector3 = AutoMovieHumanVector.offset(joint("neck"), [
    bone,
    distance,
  ]);
  const reference: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(AutoMovieHumanVector.of(0, 0, 1), [
      planeNormal,
      -planeNormal.z,
    ]),
  );
  const binormal: IAutoMovieVector3 = AutoMovieHumanVector.cross(
    planeNormal,
    reference,
  );
  const layout: IAutoMovieHumanRingLayout = {
    site: "neckTop",
    side: null,
    part: "head",
    count: 28,
    start: "anterior",
    frame: { origin, normal: planeNormal, reference },
    directions: Array.from(
      { length: 28 },
      (_: unknown, k: number): IAutoMovieVector3 =>
        AutoMovieHumanVector.offset(
          AutoMovieHumanVector.of(0, 0, 0),
          [reference, Math.cos((k * 2 * Math.PI) / 28)],
          [binormal, Math.sin((k * 2 * Math.PI) / 28)],
        ),
    ),
  };
  const across: (d: IAutoMovieVector3) => [number, number] = (d: IAutoMovieVector3): [number, number] => {
    const x: number = AutoMovieHumanVector.dot(d, reference);
    return [x, Math.sqrt(Math.max(0, 1 - x * x))];
  };
  const mean: number =
    measurements.identity.body.neckCircumference / (2 * Math.PI);
  const axis: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(joint("head"), [joint("neck"), -1]),
  );
  const normal: IAutoMovieVector3 = layout.frame.normal;
  const inPlane: (p: IAutoMovieVector3) => [number, number] = (p: IAutoMovieVector3): [number, number] => {
    const d: IAutoMovieVector3 = AutoMovieHumanVector.offset(p, [origin, -1]);
    const w: number = AutoMovieHumanVector.dot(d, reference);
    const off: IAutoMovieVector3 = AutoMovieHumanVector.offset(
      d,
      [reference, -w],
      [normal, -AutoMovieHumanVector.dot(d, normal)],
    );
    return [Math.hypot(off.x, off.y, off.z), w];
  };
  // the soft chin at gnathion, its depth from the measured tragion-gnathion distance
  const tragion: IAutoMovieVector3 = landmarks.left.tragion.position;
  const nasion: IAutoMovieVector3 = landmarks.nasion.position;
  const gnathionY: number =
    landmarks.menton.position.y +
    AUTOMOVIE_HUMAN_JAWLINE.gnathionAboveMenton *
      measurements.identity.head.faceHeight;
  const reach3: number =
    AUTOMOVIE_HUMAN_JAWLINE.gnathionDepth *
    AutoMovieHumanVector.distance(nasion, tragion);
  const gnathionZ: number =
    tragion.z +
    Math.sqrt(
      Math.max(
        0,
        reach3 * reach3 -
          (tragion.x - nasion.x) ** 2 -
          (gnathionY - tragion.y) ** 2,
      ),
    );
  const [, chin]: [number, number] = inPlane(
    AutoMovieHumanVector.of(nasion.x, gnathionY, gnathionZ),
  );
  const [jawU, jawW]: [number, number] = inPlane(landmarks.left.gonion.position);
  const tilt: number = Math.abs(AutoMovieHumanVector.dot(normal, axis));
  const column: { across: number; front: number; back: number } = {
    across: AUTOMOVIE_HUMAN_NECK_COLUMN.across * mean,
    front: AUTOMOVIE_HUMAN_NECK_COLUMN.front * mean,
    back: (AUTOMOVIE_HUMAN_NECK_COLUMN.back * mean) / Math.max(0.5, tilt),
  };
  const n: number = AUTOMOVIE_HUMAN_JAWLINE.exponent;
  // the jawline: a superellipse quadrant from the chin back to the gonion, its centre level with the gonion
  const onJaw: (rho: number, c: number, s: number) => number = (rho: number, c: number, s: number): number =>
    Math.pow(Math.max(0, (rho * c - jawW) / (chin - jawW)), n) +
    Math.pow((rho * s) / jawU, n) -
    1;
  return shapeAutoMovieHumanRadialSection(layout, {
    origin,
    radius: (d: IAutoMovieVector3): number => {
      const [c, s]: [number, number] = across(d);
      let jaw: number = 0;
      if (c > 0 || jawW < 0) {
        let lo: number = 0;
        let hi: number = 4 * Math.max(chin, jawU);
        for (let i: number = 0; i < 60; ++i) {
          const m: number = (lo + hi) / 2;
          if (onJaw(m, c, s) < 0) lo = m;
          else hi = m;
        }
        jaw = (lo + hi) / 2;
      }
      const reach: number = jaw * c >= jawW ? jaw : 0;
      const neck: number =
        1 /
        Math.sqrt(
          (c * c) / (c >= 0 ? column.front : column.back) ** 2 +
            (s * s) / column.across ** 2,
        );
      return smoothMax(reach, neck, AUTOMOVIE_HUMAN_NECK_COLUMN.blend * mean);
    },
    girth: null,
  });
}

/** Smooth maximum used by the existing jaw and neck-column outline. */
const smoothMax: (a: number, b: number, k: number) => number = (a: number, b: number, k: number): number => {
  const h: number = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.max(a, b) + (h * h * k) / 4;
};
