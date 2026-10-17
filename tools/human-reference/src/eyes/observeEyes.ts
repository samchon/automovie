import { fileURLToPath } from "node:url";

import type { Plane } from "../geometry/Plane.ts";
import type { Polyline } from "../geometry/Polyline.ts";
import type { V2 } from "../geometry/V2.ts";
import type { V3 } from "../geometry/V3.ts";
import { add } from "../geometry/add.ts";
import { cross } from "../geometry/cross.ts";
import { dist } from "../geometry/dist.ts";
import { dot } from "../geometry/dot.ts";
import { lerp } from "../geometry/lerp.ts";
import { mul } from "../geometry/mul.ts";
import { norm } from "../geometry/norm.ts";
import { planeFrame } from "../geometry/planeFrame.ts";
import { sub } from "../geometry/sub.ts";
import { to2 } from "../geometry/to2.ts";
import type { AuxiliarySurface } from "../headneck/AuxiliarySurface.ts";
import type { HeadContext } from "../headneck/HeadContext.ts";
import { P } from "../headneck/P.ts";
import { createRegion } from "../headneck/createRegion.ts";
import { isoContour } from "../headneck/isoContour.ts";
import { polyLen } from "../headneck/polyLen.ts";
import type { LoopRecord } from "../schema/LoopRecord.ts";
import type { RegionFile } from "../schema/RegionFile.ts";
import { orientLoop } from "../schema/orientLoop.ts";
import { auxiliaryEyeAxis } from "./auxiliaryEyeAxis.ts";
import { radialSkinPath } from "./radialSkinPath.ts";

/**
 * Observes auxiliary-globe intersection contours and outward radial source skin arcs.
 * Signed vertex distance is linearly interpolated on skin triangles. The zero
 * contour approximates the component intersection and does not identify the full
 * visible fissure, clinical canthi or a lid crease. Every failed radial stays absent.
 *
 * @evidence contracts/common.md#principled-implementation Classifies inside by closest-point direction relative to the closed auxiliary globe, selects its most anterior closed scalar contour and cuts skin through the same eye-axis frame.
 * @evidence contracts/common.md#clear-and-simple-design Each eye shares one axis, aperture frame and radial family; exact source observations remain separate from cubic fitting and clinical feature naming.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Imports no private path, identity list or source topology catalogue; missing sections remain explicit and aperture extrema receive geometric names.
 * @evidence contracts/common.md#meaningful-documentation States the linearly interpolated distance protocol, right-handed radial frame, source scope and unresolved anatomical correspondence.
 * @evidence contracts/performance.md#efficient-algorithms Two eye distance fields and 96 full source cuts dominate execution; nearest-globe queries use admitted BVHs and output storage follows the observed section points.
 * @evidence contracts/performance.md#reuse-equivalent-work Both eye observations reuse one admitted skin context and its auxiliary BVHs; each eye's aperture frame is computed once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary fields and cuts live inside this operation; the returned observation arrays contain no process, file or GPU handle.
 */
export function observeEyes(context: HeadContext): RegionFile {
  const result: RegionFile = createRegion(
    context,
    "face-eyes",
    fileURLToPath(import.meta.url),
    ["paired auxiliary globe components"],
  );
  result.owner = "eyes";
  for (const side of ["l", "r"] as const) {
    const eye: AuxiliarySurface = context.eyes[side];
    const axis: ReturnType<typeof auxiliaryEyeAxis> = auxiliaryEyeAxis(eye);
    const field: Float64Array = new Float64Array(
      context.s.vertices.length,
    ).fill(NaN);
    context.s.vertices.forEach((point: V3, index: number): void => {
      if (dist(point, axis.c) > 30) return;
      const closest: ReturnType<AuxiliarySurface["idx"]["closest"]> =
        eye.idx.closest(point);
      field[index] =
        dot(sub(point, closest.q), sub(closest.q, axis.c)) < 0
          ? -closest.d
          : closest.d;
    });
    const candidates: Polyline[] = isoContour(context.s, field, 0).filter(
      (polyline: Polyline): boolean =>
        polyline.closed && polyline.pts.length > 20,
    );
    let aperture: Polyline | undefined;
    let anterior: number = -Infinity;
    for (const candidate of candidates) {
      const height: number =
        candidate.pts.reduce(
          (sum: number, point: Polyline["pts"][number]): number =>
            sum + dot(sub(point.p, axis.c), axis.a),
          0,
        ) / candidate.pts.length;
      if (height > anterior) {
        aperture = candidate;
        anterior = height;
      }
    }
    if (!aperture)
      throw new Error(
        `No closed auxiliary-globe distance contour for eye ${side}`,
      );
    const points: V3[] = P(aperture);
    const centre: V3 = mul(
      points.reduce((sum: V3, point: V3): V3 => add(sum, point), [0, 0, 0]),
      1 / points.length,
    );
    const frame: Plane = planeFrame(centre, axis.a, [0, 1, 0]);
    const ordered: LoopRecord = orientLoop(
      frame,
      aperture,
      "other",
      to2(frame, centre),
    );
    result.loops.push({
      id: `face-eyes.${side}.aperture`,
      name: `${side} auxiliary-globe distance-field aperture`,
      kind: "aperture",
      side,
      pose: "native-A",
      closed: true,
      frame: { origin: centre, normal: frame.n, u: frame.u, v: frame.v },
      confidence: "medium",
      points: ordered.points,
      method:
        "Most anterior closed zero contour of linearly interpolated signed skin-vertex distance to the auxiliary globe; CCW in the declared frame, phase zero at inferior -v. Continuous globe-intersection residual is not bounded by this vertex field.",
    });
    const medialSign: number = side === "l" ? -1 : 1;
    const medial: V3 = ordered.points.reduce(
      (best: V3, point: V3): V3 =>
        medialSign * point[0] > medialSign * best[0] ? point : best,
    );
    const lateral: V3 = ordered.points.reduce(
      (best: V3, point: V3): V3 =>
        medialSign * point[0] < medialSign * best[0] ? point : best,
    );
    result.landmarks.push(
      {
        id: `face-eyes.lm.${side}.aperture-medial-extreme`,
        name: `${side} medial aperture x extreme`,
        p: medial,
        pose: "native-A",
        method:
          "Extreme global x on the declared distance-field contour; not a clinical canthus",
        confidence: "high",
      },
      {
        id: `face-eyes.lm.${side}.aperture-lateral-extreme`,
        name: `${side} lateral aperture x extreme`,
        p: lateral,
        pose: "native-A",
        method:
          "Extreme global x away from the midline on that contour; not a clinical canthus",
        confidence: "high",
      },
      {
        id: `face-eyes.lm.${side}.auxiliary-apex`,
        name: `${side} auxiliary protrusion average (not skin)`,
        p: axis.apex,
        pose: "native-A",
        method:
          "Mean farthest forward auxiliary-globe vertices under auxiliaryEyeAxis; auxiliary geometry",
        confidence: "medium",
      },
    );
    const family: string = `face-eyes.${side}.radial`;
    result.families.push({
      id: family,
      kind: "radial",
      axis: "Line through the aperture centroid along the auxiliary-eye protrusion axis",
      fraction0: "phase zero inferior (-v)",
      fraction1: "phase360; fraction=degrees/360",
      reference:
        "v is superior projected, u=v cross eye-axis; each radial cut has u=radial, v=eye-axis, normal=u cross v",
      phaseLabels: {
        "0": "inferior",
        "90": "+u",
        "180": "superior",
        "270": "-u",
      },
    });
    for (let phase: number = 0; phase < 360; phase += 7.5) {
      const angle: number = ((phase - 90) * Math.PI) / 180;
      const radial: V3 = add(
        mul(frame.u, Math.cos(angle)),
        mul(frame.v, Math.sin(angle)),
      );
      const normal: V3 = norm(cross(radial, axis.a));
      const plane: Plane = { origin: centre, n: normal, u: radial, v: axis.a };
      let crossing: V3 | undefined;
      for (let index: number = 0; index < ordered.points.length; index++) {
        const start: V3 = ordered.points[index];
        const end: V3 = ordered.points[(index + 1) % ordered.points.length];
        const startDistance: number = dot(sub(start, centre), normal);
        const endDistance: number = dot(sub(end, centre), normal);
        if (startDistance > 0 === endDistance > 0) continue;
        const point: V3 = lerp(
          start,
          end,
          startDistance / (startDistance - endDistance),
        );
        if (dot(sub(point, centre), radial) > 0) crossing = point;
      }
      const path: ReturnType<typeof radialSkinPath> = crossing
        ? radialSkinPath(context, plane, crossing, centre, axis.c, axis.a)
        : null;
      if (!path || path.points.length < 4) {
        result.limits.push(
          `${family}.${phase}: no qualified outward radial source arc; no inferred replacement`,
        );
        continue;
      }
      const uv: V2[] = path.points.map(
        (point: V3): V2 => [
          dot(sub(point, centre), radial),
          dot(sub(point, centre), axis.a),
        ],
      );
      result.sections.push({
        id: `${family}.${String(Math.round(phase * 10)).padStart(4, "0")}`,
        family,
        station: {
          fraction: phase / 360,
          deg: phase,
          definition:
            "Angle about the auxiliary-eye axis, degrees; no physical axial station is implied",
        },
        pose: "native-A",
        plane: { origin: centre, normal, u: radial, v: axis.a },
        status: "clipped",
        statusNote: `Outward source-plane arc to34mm radial reach or60mm path length; aperture host residual ${path.hostResidualMm}mm`,
        loops: [
          {
            role: "clipped-arc",
            closed: false,
            points: path.points,
            uv,
            perimeter: polyLen(path.points),
            convexPerimeter: null,
            area: null,
            breadthU:
              Math.max(...uv.map((point: V2): number => point[0])) -
              Math.min(...uv.map((point: V2): number => point[0])),
            depthV:
              Math.max(...uv.map((point: V2): number => point[1])) -
              Math.min(...uv.map((point: V2): number => point[1])),
          },
        ],
      });
    }
    result.measures!.push({
      id: `face-eyes.measure.aperture-chord-${side}`,
      name: `${side} distance-field aperture x-extreme chord`,
      value: dist(medial, lateral),
      unit: "mm",
      pose: "native-A",
      method:
        "3D chord of this auxiliary-globe intersection proxy; not clinical fissure width",
    });
  }
  result.limits.push(
    "The auxiliary-globe zero contour differs from the complete visible palpebral boundary. Clinical canthi, pigment, lashes and brow hair are not identified.",
    "Radial source curves can include undercuts and folds. Their curvature reversals alone do not establish an anatomical lid crease or sulcus.",
    "Legacy curvature candidate courses are not copied into this producer; they need independent semantic qualification before they can constrain named anatomical coefficients.",
    "These raw source observations are not cubic controls, a generated surface or proof of collision-free shared collars.",
  );
  return result;
}
