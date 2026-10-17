import {
  AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { ITorsoCurveConstruction as D } from "./ITorsoCurveConstruction";
import type { ITorsoMeasurements as T } from "./ITorsoMeasurements";
import { TorsoFamily } from "./TorsoFamily";
import { TorsoMath as M } from "./TorsoMath";
import { TorsoUpperCourseFamily } from "./TorsoUpperCourseFamily";

/** Construct median, shoulder and axillary courses and the owned arm cuts.
 * Actual world neck P/J and physical parent gauges remain the sole placement
 * authorities. The upper course field derives every displayed restriction from
 * these same boundaries; it emits curves and does not construct a skin surface.
 */
export function constructAutoMovieTorsoUpper64(
  p: T.Value,
  family: TorsoFamily,
  local: TorsoFamily,
  origin: C.Vector,
  basis: readonly C.Vector[],
  context: AutoMovieCurveParentContext,
  neck: C.Boundary,
): {
  /** Actual upper courses and restrictions in world millimetres. */
  curves: C.Cubic[];

  /** Owned bilateral quarter-arm cuts with physical full-J. */
  boundaries: D["delivery"]["boundaries"];

  /** Original normalized collar P/Q arithmetic before the physical conversion. */
  rawCollars: D["rawCollars"];
} {
  const curves: C.Cubic[] = [];
  const ay: number = family.rows.at(-1)!.y;
  const ns: readonly C.Span[] = neck.section.spans;
  const nd: readonly C.Span[] = neck.fullJ;
  const ny: number = M.dot(M.sub(ns[0]![0], origin), basis[1]!);
  for (const [lane, ni, name] of [
    [4, 0, "upperSternalColumn"],
    [10, 2, "upperSpinalColumn"],
  ] as const) {
    const supports: C.Vector[] = [family.sample(ay, lane)],
      heights: number[] = [ay];
    for (const feature of Object.values(p.upperMedian[name]!.features)) {
      const y: number = ay + feature.heightFraction * (ny - ay),
        z: number =
          local.sample(ay, lane)[2] + feature.depthChangeOverHeight * (ny - ay);
      supports.push(M.add(origin, M.columns(basis, [0, y, z])));
      heights.push(y);
    }
    supports.push(ns[ni]![0]);
    heights.push(ny);
    curves.push(
      M.semantic(
        name,
        supports,
        heights,
        M.bez(family.controls(ay, true)[lane]!, 0),
        nd[ni]![0],
        [],
        basis,
        "mm",
      ),
    );
  }
  const boundaries: { bone: string; value: C.Boundary }[] = [];
  const rawCollars: Record<string, D["rawCollars"][string]> = {};
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1,
      bone: string = p.bones[side],
      collar: T.Collar = p.upperArms[side];
    const o: C.Vector = context.point(bone, collar.frame.origin),
      u: C.Vector = M.unit(context.direction(bone, collar.frame.basisX)),
      vz: C.Vector = context.direction(bone, collar.frame.basisZ);
    const v: C.Vector = M.unit(M.sub(vz, M.mul(u, M.dot(vz, u))));
    let normal: C.Vector = M.unit(M.cross(v, u));
    if (M.dot(normal, context.direction(bone, collar.frame.basisY)) < 0)
      normal = M.mul(normal, -1);
    const s: T.Collar["skin"] = collar.skin,
      uv: readonly (readonly [number, number])[] = [
        [s.positiveUHalfBreadthMm, s.positiveUDepthOffsetMm],
        [s.anteriorBreadthOffsetMm, s.anteriorHalfDepthMm],
        [-s.negativeUHalfBreadthMm, s.negativeUDepthOffsetMm],
        [s.posteriorBreadthOffsetMm, -s.posteriorHalfDepthMm],
      ],
      k: number = (4 * (Math.sqrt(2) - 1)) / 3;
    const supports: C.Vector[] = uv.map(
      (a: readonly [number, number]): C.Vector =>
        M.add(o, M.add(M.mul(u, a[0]), M.mul(v, a[1]))),
    );
    const handles: C.Vector[] = (
      [
        [1, 1],
        [0, -1],
        [1, -1],
        [0, 1],
      ] as const
    ).map(
      ([axis, direction]: readonly [0 | 1, 1 | -1], j: number): C.Vector =>
        M.mul(
          axis ? v : u,
          direction *
            k *
            Math.min(
              Math.abs(uv[(j + 1) % 4]![axis] - uv[j]![axis]),
              Math.abs(uv[j]![axis] - uv[(j + 3) % 4]![axis]),
            ),
        ),
    );
    const controls: C.Span[] = M.spans(supports, handles),
      h: C.Vector = M.mul(normal, collar.continuationHandleLengthMm),
      q: C.Span[] = controls.map(
        (span: C.Span): C.Span =>
          span.map((a: C.Vector): C.Vector => M.sub(a, h)) as unknown as C.Span,
      ),
      jet: C.Span[] = controls.map(
        (span: C.Span, i: number): C.Span =>
          span.map(
            (v: C.Vector, j: number): C.Vector =>
              M.mul(M.sub(q[i]![j]!, v), -3),
          ) as unknown as C.Span,
      );
    // Q=P-h and delta=-1/3 give raw J=3h; the projected mean converts it to physical mm derivatives.
    const jacobian: number =
      jet
        .flat()
        .reduce(
          (sum: number, a: C.Vector): number => sum + M.dot(a, normal),
          0,
        ) / 16;
    if (!Number.isFinite(jacobian) || jacobian <= 0)
      throw new Error("Resolved positive physical collar Jacobian required");
    const id: string = p.boundaryIds[side],
      section: C.Cubic = M.cubic(
        id,
        controls,
        true,
        [0.25, 0.25, 0.25, 0.25],
        "turn",
      );
    const boundary: C.Boundary = {
      id,
      section,
      fullJ: jet.map(
        (span: C.Span): C.Span =>
          span.map(
            (a: C.Vector): C.Vector => M.mul(a, 1 / jacobian),
          ) as unknown as C.Span,
      ),
      longitudinalAxis: normal,
      longitudinalUnit: "mm",
    };
    boundaries.push({ bone, value: boundary });
    rawCollars[side] = {
      p: controls,
      q,
      delta: -1 / 3,
      fullJ: jet,
      physicalMmPerParameter: jacobian,
    };
    curves.push(
      { ...section, name: "canonical." + side + ".upperArm.midTube" },
      M.cubic(
        side + ".upperArm.sharedJetContinuation",
        q,
        true,
        [0.25, 0.25, 0.25, 0.25],
        "turn",
      ),
    );
    const nc: number = sign > 0 ? 1 : 3,
      necklat: C.Vector = ns[nc]![0],
      neckfront: C.Vector = M.bez(ns[sign > 0 ? 0 : 3]!, 0.5),
      neckback: C.Vector = M.bez(ns[sign > 0 ? 1 : 2]!, 0.5),
      nfd: C.Vector = M.bez(nd[sign > 0 ? 0 : 3]!, 0.5),
      nbd: C.Vector = M.bez(nd[sign > 0 ? 1 : 2]!, 0.5);
    const poles: C.Vector[] = (
      side === "left" ? [0, 1, 2, 3] : [2, 1, 0, 3]
    ).map((j: number): C.Vector => controls[j]![0]);
    const span: number = M.length(M.sub(o, necklat));
    for (const [suffix, a, b, neckDerivative] of [
      ["trapeziusDeltoidCrest", necklat, poles[0]!, nd[nc]![0]],
      ["clavicleAnteriorDeltoid", neckfront, poles[1]!, nfd],
      ["scapularPosteriorDeltoid", neckback, poles[3]!, nbd],
    ] as const) {
      const course: T.Course = p.shoulders[side].courses[suffix]!,
        points: C.Vector[] = [a],
        normals: C.Vector[] = [];
      for (const r of Object.values(course.features)) {
        points.push(
          M.add(
            necklat,
            M.mul(
              M.columns(basis, [
                sign * r.lateralOffsetRatio,
                r.verticalOffsetRatio,
                r.anteriorOffsetRatio,
              ]),
              span,
            ),
          ),
        );
        const elevation: number = (r.surfaceNormalElevationDeg * Math.PI) / 180,
          azimuth: number = (r.surfaceNormalAzimuthDeg * Math.PI) / 180;
        normals.push(
          M.columns(basis, [
            Math.cos(elevation) * Math.cos(azimuth),
            Math.sin(elevation),
            Math.cos(elevation) * Math.sin(azimuth),
          ]),
        );
      }
      points.push(b);
      const ph: readonly number[] = course.phaseStations,
        firstDrop: number = M.dot(M.sub(points[1]!, a), basis[1]!);
      curves.push(
        M.semantic(
          side + "." + suffix,
          points,
          ph,
          M.mul(neckDerivative, firstDrop / (ph[1]! - ph[0]!)),
          M.mul(h, 3 / (ph.at(-1)! - ph.at(-2)!)),
          normals,
          basis,
        ),
      );
    }
    const branchFrame: T.Gauge = p.branchFrames[side];
    for (const [name, start, recordName, end] of [
      [
        "axillaryFloor",
        family.sample(ay, sign > 0 ? 0 : 8),
        "floorMid",
        poles[2]!,
      ],
      [
        "anteriorAxillaryFold",
        family.sample(ay, sign > 0 ? 2 : 6),
        "anteriorFoldMid",
        poles[1]!,
      ],
      [
        "posteriorAxillaryFold",
        family.sample(ay, sign > 0 ? 11 : 9),
        "posteriorFoldMid",
        poles[3]!,
      ],
    ] as const) {
      const r: T.Offset = p.externalBranches[side][recordName]!,
        middleLocal: C.Vector = M.add(
          branchFrame.origin,
          M.columns(
            [branchFrame.basisX, branchFrame.basisY, branchFrame.basisZ],
            M.mul(
              [
                r.lateralOffsetRatio,
                r.verticalOffsetRatio,
                r.anteriorOffsetRatio,
              ],
              p.trunkLengthMm,
            ),
          ),
        );
      const branch: C.Cubic = M.smooth(
        side + "." + name,
        [start, context.point(bone, middleLocal), end],
        h,
      );
      // The floor runs across the branch rather than rising through the
      // thorax-height chart. Only the two rising folds bound the upper field.
      if (name === "axillaryFloor") {
        curves.push(branch);
        continue;
      }
      const lane: number =
        name === "anteriorAxillaryFold"
          ? sign > 0
            ? 2
            : 6
          : sign > 0
            ? 11
            : 9;
      // Two equal branch intervals normalize to v in [0,1]. Hence the
      // first Bezier handle is (dP/dy)*(ny-ay)/6. The ending owner handle
      // and all actual branch supports retain their original authority.
      const startJet: C.Vector = M.mul(
        M.bez(family.controls(ay, true)[lane]!, 0),
        (ny - ay) / 6,
      );
      curves.push({
        ...branch,
        spans: branch.spans.map(
          (span: C.Span, index: number): C.Span =>
            index === 0
              ? [span[0], M.add(span[0], startJet), span[2], span[3]]
              : span,
        ),
      });
    }
  }
  curves.push(...new TorsoUpperCourseFamily(family, curves, neck).curves());
  return { curves, boundaries, rawCollars };
}
