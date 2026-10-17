import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { AutoMovieFootMath64 as M } from "../family/AutoMovieFootMath64";
import { AutoMovieFootProfile64 as P } from "../family/AutoMovieFootProfile64";
import type { IAutoMovieFootDimensions64 as D } from "../family/IAutoMovieFootDimensions64";
import type { IAutoMovieFootIdentityBridge64 as I } from "./IAutoMovieFootIdentityBridge64";

/**
 * Derive five toe recipes and four shared webs from independent physical dimensions.
 *
 * Root, proximal-pad, distal-pad and tip-base rows sample a common taper; they
 * are not inferred IP joints. Rest splay becomes lateral offsets through tan(angle).
 * A 0.01-foot-length root gap, 0.25 taper, pad transition and 0.45 cap rounding are
 * geometric conventions. Branch midpoints interpolate the actual same-family
 * parent-course intersections and toe root heights. Each neighbouring pair shares
 * one saddle. The caller supplies the same forefoot row and dimensional scales
 * later consumed by the family; no saved or separately fitted section is used.
 * No additional skeleton bones are created.
 */
export function buildAutoMovieFootIdentityToes64(
  r: I.Resolved,
  parentCourse: D.Course,
  dimensions: D.Dimensions,
): Pick<D.Side, "toes" | "branches"> {
  const m: I.Independent = r.measurements;
  const toes: Record<string, D.Toe> = {};
  const saddles: D.Side["branches"]["saddles"] extends Readonly<infer T>
    ? T
    : never = {};
  const fan: D.Side["branches"]["fan"] extends Readonly<infer T> ? T : never =
    {};
  const gap: number = 0.01 * r.footLengthMm;
  const localFrame: M.Frame = {
    origin: [0, 0, 0],
    basis: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
  };
  const parent: C.Span[] = P.closed(
    P.main(parentCourse, dimensions, r.parentW),
    localFrame.basis[1],
    localFrame.basis[0],
  );
  const smooth: (t: number) => number = (t: number): number => {
    const v: number = Math.max(0, Math.min(1, t));
    return v * v * (3 - 2 * v);
  };
  for (let i: number = 0; i < 5; i++) {
    const name: string = String(i + 1);
    const width: number = m.toeBreadthMm[i]!;
    const extent: number = r.projectedToeLengthMm[i]!;
    const root: number = r.rootW[i]!;
    const profiles: Record<string, D.ToeProfile> = {};
    for (let k: number = 0; k < 4; k++) {
      const fraction: number = k / 4;
      const distance: number = gap + (extent - gap) * fraction;
      const rootSole: number = Math.max(
        m.toePadHeightMm,
        r.toeJointHeightAboveFloorMm - 0.55 * m.toeThicknessMm[i]!,
      );
      profiles[["root", "proximalPad", "distalPad", "tipBase"][k]!] = {
        fraction,
        breadthRatio: 1 - 0.25 * fraction,
        thicknessRatio: 1.1 - 0.25 * fraction,
        centerOutwardOffsetRatio:
          (Math.tan(m.toeSplayRad[i]!) * distance) / width,
        soleHeightAboveFloor_mm:
          rootSole + (m.toePadHeightMm - rootSole) * smooth(fraction / 0.65),
        roofPeakFraction: 0.5,
        soleContactFraction: 0.5,
        outerWallHeightFraction: 0.5,
        innerWallHeightFraction: 0.5,
      };
    }
    toes[name] = {
      rootLongitudinalRatio: root / r.webReach,
      rootOutwardRatio: r.toeCenterU[i]! / r.footBreadthMm,
      projectedExtentAfterWeb_mm: extent,
      breadth_mm: width,
      thickness_mm: m.toeThicknessMm[i]!,
      rootGap_mm: gap,
      tipOutwardOffsetRatio: (Math.tan(m.toeSplayRad[i]!) * extent) / width,
      tipHeightRatio: 0.38 + m.toePadHeightMm / m.toeThicknessMm[i]!,
      capRoundingRatio: 0.45,
      profiles,
    };
    const rootSole: number = Math.max(
      m.toePadHeightMm,
      r.toeJointHeightAboveFloorMm - 0.55 * m.toeThicknessMm[i]!,
    );
    const parentDorsal: number =
      M.crossing(parent, localFrame, r.toeCenterU[i]!, true).point[1] -
      r.floorLocalY;
    const parentPlantar: number =
      M.crossing(parent, localFrame, r.toeCenterU[i]!, false).point[1] -
      r.floorLocalY;
    fan[name] = {
      outwardRatio: r.toeCenterU[i]! / r.footBreadthMm,
      longitudinalRatio:
        (r.parentW + (root + gap - r.parentW) / 2) / r.webReach,
      dorsalHeightAboveFloor_mm:
        (parentDorsal + rootSole + 1.1 * m.toeThicknessMm[i]!) / 2,
      plantarHeightAboveFloor_mm: (parentPlantar + rootSole) / 2,
    };
    if (i < 4)
      saddles[name] = {
        outwardRatio:
          (r.toeCenterU[i]! + width / 2 + m.webGapMm / 2) / r.footBreadthMm,
        heightAboveFloor_mm:
          m.toePadHeightMm +
          0.25 * Math.min(m.toeThicknessMm[i]!, m.toeThicknessMm[i + 1]!),
        longitudinalRatio:
          (Math.min(root, r.rootW[i + 1]!) + gap - 0.004 * r.footLengthMm) /
          r.webReach,
      };
  }
  return {
    toes,
    branches: { parentLongitudinalRatio: r.parentW / r.webReach, saddles, fan },
  };
}
