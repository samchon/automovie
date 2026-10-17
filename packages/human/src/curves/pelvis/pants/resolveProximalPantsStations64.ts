import { AutoMovieCurveMath64 as M } from "@automovie/engine";

import type { PelvisMeasurements as P } from "../family/PelvisMeasurements";
import { PelvisSectionRules as S } from "../family/PelvisSectionRules";

/** Derive proximal support measurements from one crown and the actual tube port.
 * The virtual upper-thigh tape does not describe two circles in a merged mass.
 * Three exterior support priors connect the independent body-floor envelope
 * to each midpoint port with its physical jet. The medial opening starts at
 * the shared median crown. These are neutral authoring relations, not fitted
 * reference controls or individually measured proximal sections. The actual
 * longitudinal family subsequently owns every emitted section and derivative.
 *
 * @author Samchon
 */
export function resolveProximalPantsStations64(
  /** Mutable named measurements owned by this construction, with midpoint stations and distal derivative context already resolved. */
  p: P.Input,
  /** Actual sixteen-span floor course generated from the independent pelvis dimensions. */
  floor: readonly M.Span[],
  /** Independent median crown support-plane height, millimetres. */
  crownY: number,
): {
  /** Lower chart height obtained by mirroring the floor-to-crown physical drop, millimetres. */
  nearY: number;
  /** The proximal girth-proxy removal and ownership qualification. */
  qualification: string;
} {
  const root: M.V = p.frame.origin_mm;
  const floorY: number = floor[0]![0][1];
  const nearY: number = 2 * crownY - floorY;
  const medianX: number = root[0] + p.frame.medianLateralFromOrigin_mm;
  const crownZ: number = (floor[6]![0][2] + floor[14]![0][2]) / 2;
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const mid: P.PairedStation = p.pairedStations[side][0]!;
    const native: M.V[] = S.paired(mid, p.frame);
    const distal: M.V[] = S.paired(p.thighDerivativeContext[side], p.frame);
    const midY: number = native[0]![1];
    const length: number = floorY - midY;
    if (!(midY < nearY && nearY < crownY && crownY < floorY))
      throw new Error(
        "The crown-owned proximal chart has no ordered physical height domain",
      );
    const jets: M.V[] = native.map(
      (point: M.V, i: number): M.V =>
        M.scale(M.sub(point, distal[i]!), 1 / (midY - distal[i]![1])),
    );
    const bodyNodes: number[] =
      side === "left" ? [0, 3, 14, 15] : [12, 9, 14, 13];
    const rails: M.Span[] = [0, 1, 3].map(
      (node: number): M.Span =>
        M.hermite(
          native[node]!,
          floor[bodyNodes[node]!]![0],
          jets[node]!,
          [0, 1, 0],
          length,
        ),
    );
    const depth: number = crownY - midY;
    const reach: number = sign * (native[2]![0] - medianX);
    const ratio: number = (-2 * depth * sign * jets[2]![0]) / reach;
    if (!(reach > 0 && ratio > 0 && Number.isFinite(ratio)))
      throw new Error(
        "The measured midpoint medial position and jet need another opening chart",
      );
    const medialZ: M.Span = M.hermite(
      native[2]!,
      [medianX, crownY, crownZ],
      jets[2]!,
      [0, 1, 0],
      depth,
    );
    const station: (height: number, name: string) => P.PairedStation = (
      height: number,
      name: string,
    ): P.PairedStation => {
      const t: number = (height - midY) / length;
      const outer: M.V = M.cubic(rails[0]!, t);
      const anterior: M.V = M.cubic(rails[1]!, t);
      const posterior: M.V = M.cubic(rails[2]!, t);
      // A parabolic opening has a horizontal tangent at its crown. A positive
      // rational reach law retains the midpoint dX/dY without a width clamp.
      // This is a station prior, not a claim that the final physical-Y cubic
      // interpolation is this non-polynomial height inverse.
      const s: number = Math.sqrt((crownY - height) / depth);
      const inner: M.V = M.cubic(medialZ, (height - midY) / depth);
      inner[0] = medianX + (sign * reach * s) / (ratio + (1 - ratio) * s);
      inner[1] = height;
      const breadth: number = sign * (outer[0] - inner[0]);
      const apDepth: number = anterior[2] - posterior[2];
      const cx: number = (outer[0] + inner[0]) / 2;
      const cz: number = (anterior[2] + posterior[2]) / 2;
      if (!(breadth > 0 && apDepth > 0 && sign * (inner[0] - medianX) > 0))
        throw new Error(
          "The derived proximal exterior supports are not ordered",
        );
      return {
        name,
        sideSign: sign,
        heightFromFrame_mm: height - root[1],
        centerLateralFromFrame_mm: cx - root[0],
        centerFrontFromFrame_mm: cz - root[2],
        breadth_mm: breadth,
        depth_mm: apDepth,
        outerDepthPhase: (outer[2] - cz) / (apDepth / 2),
        innerDepthPhase: (inner[2] - cz) / (apDepth / 2),
        frontLateralPhase: (anterior[0] - cx) / (breadth / 2),
        backLateralPhase: (posterior[0] - cx) / (breadth / 2),
      };
    };
    // Place the first interior support on the physical scale R/|Jx| rather
    // than across half a long interval. With this shared rule the clamped
    // midpoint inner control retains at least two thirds of its positive
    // reach. This changes station spacing, never a measured width or jet.
    const span: number = nearY - midY;
    const firstStep: number =
      span / (2 + (span * Math.abs(jets[2]![0])) / reach);
    p.pairedStations[side] = [
      mid,
      station(midY + firstStep, "thighUpper"),
      station(nearY, "nearCrotch"),
    ];
  }
  return {
    nearY,
    qualification:
      "Proximal open-arc supports from the body envelope, median crown and unchanged actual midpoint P/full-J context. Upper tape is not imposed as a closed ring. Parabolic/rational opening is an explicit station prior; the generated cubic support/handle field owns actual courses. No stance, girth cap or per-identity offset.",
  };
}
