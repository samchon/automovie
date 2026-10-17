import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { FaceMath as F } from "./FaceMath";
import type { IAutoMovieFaceMeasurements as M } from "./IAutoMovieFaceMeasurements";

/** Emit bilateral aperture margins, roll/fold supports and brow-region courses. Each arch is the original cubic endpoint line plus even 4*t*(1-t) and odd 4*t*(1-t)*(2*t-1) perturbations. An exact de Casteljau split at t=1/2 preserves the cubic and records two normalized widths of 0.5. Positive X is subject-left. This emits neither eye-component rings nor an eyeball, iris or contact surface.
 *
 * @param spec Native-mm projected canthal extents, signed profile coefficients and shared support offsets; required depth roles must be present.
 * @returns Fourteen open native Bernstein courses; midpoint splits retain exact handles.
 * @author Samchon
 */
export function generateFaceEyes(spec: M.Eyes): F.Curve[] {
  const curves: F.Curve[] = [];
  const arch: (
    name: string,
    anchor: C.Vector,
    w: number,
    rise: number,
    recession: number,
    h: number,
    k: number,
    z: number,
    v: number,
  ) => void = (
    name: string,
    anchor: C.Vector,
    w: number,
    rise: number,
    recession: number,
    h: number,
    k: number,
    z: number,
    v: number,
  ): void => {
    const b: C.Vector = [w, rise + 4 * (h - k), recession + 4 * (z - v)];
    const c: C.Vector = [0, -4 * h + 12 * k, -4 * z + 12 * v];
    const e: C.Vector = [0, -8 * k, -8 * v];
    const controls: F.V[] = [
      F.vec(anchor),
      F.add(anchor, F.mul(b, 1 / 3)),
      F.add(F.add(anchor, F.mul(b, 2 / 3)), F.mul(c, 1 / 3)),
      F.add(F.add(F.add(anchor, b), c), e),
    ];
    const q: F.V[] = [0, 1, 2].map(
      (i: number): F.V => F.mul(F.add(controls[i]!, controls[i + 1]!), 0.5),
    );
    const r: F.V[] = [0, 1].map(
      (i: number): F.V => F.mul(F.add(q[i]!, q[i + 1]!), 0.5),
    );
    const m: F.V = F.mul(F.add(r[0]!, r[1]!), 0.5);
    curves.push({
      name: "eye." + name,
      closed: false,
      normalizedWidths: [0.5, 0.5],
      spans: [
        [controls[0]!, q[0]!, r[0]!, m],
        [m, r[1]!, q[2]!, controls[3]!],
      ],
    });
  };
  for (const side of ["left", "right"] as const) {
    const e: M.Eye = spec.eyes[side];
    const direction: number = side === "left" ? 1 : -1;
    const width: number = e.projectedApertureWidthMm;
    const rise: number =
      width * Math.tan((e.canthalSlantDegrees * Math.PI) / 180);
    const anchor: C.Vector = e.placement.medialAnchorMm;
    for (const which of ["upper", "lower"] as const) {
      const sign: number = which === "upper" ? 1 : -1;
      const shape: M.Lid = e[which];
      const roles: (keyof M.Lid["depth"])[] = [
        "aperture-margin",
        "lid-roll",
        which === "upper" ? "lid-fold" : "infraorbital-transition",
      ];
      const offsets: number[] = [
        spec.supports.marginArchOffsetMm,
        spec.supports.rollArchOffsetMm,
        which === "upper"
          ? spec.supports.upperFoldArchOffsetMm
          : spec.supports.lowerTransitionArchOffsetMm,
      ];
      roles.forEach((role: keyof M.Lid["depth"], i: number): void => {
        const depth: M.Depth = shape.depth[role]!;
        arch(
          side + "-" + which + "-" + role,
          anchor,
          direction * width,
          rise,
          e.placement.canthalRecessionMm,
          shape.archHeightMm + sign * offsets[i]!,
          shape.archSkewMm,
          depth.bulgeMm,
          depth.skewMm,
        );
      });
    }
    const b: M.Eyes["supports"]["brow"] = spec.supports.brow;
    const depth: M.Eye["browDepth"] = e.browDepth;
    arch(
      side + "-brow-region-support",
      [
        anchor[0] - direction * b.medialExtensionWidthRatio * width,
        anchor[1] + b.heightAboveMedialProxyMm,
        depth.medialZMm,
      ],
      direction * b.widthRatio * width,
      rise - b.tailDropMm,
      depth.recessionMm,
      b.archHeightMm,
      b.archSkewMm,
      depth.bulgeMm,
      depth.skewMm,
    );
  }
  return curves;
}
