import type {
  IAutoMovieConicArc,
  IAutoMovieConicFieldJet,
  IAutoMovieConicHermite,
  IAutoMoviePolarSector,
  IAutoMovieViewConic,
} from "@automovie/interface";

import { AutoMovieConicArc } from "./AutoMovieConicArc";
import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieConicHermite } from "./AutoMovieConicHermite";
import { AutoMovieConicPreparation } from "./AutoMovieConicPreparation";

/**
 * Four rational conics with convex rational cubic G2 end approximations.
 *
 * Supports and shoulders remain exact. Only an incompatible guide curvature
 * changes a short conic end through AutoMovieConicHermite. Its native support
 * vanishes with the curvature contrast, so the composed source is jointly C2
 * for smooth input extents/shoulders on the admitted regular domain. This
 * source statement does not certify a later periodic spline or a physical
 * pole.
 */
export namespace AutoMovieViewConic {
  /** Prepare exact conics and only their necessary shared-curvature supports. */
  export function create(
    extents: readonly number[],
    shoulders: readonly number[],
    curvatures: readonly number[],
  ): IAutoMovieViewConic.ICurve {
    const curve: IAutoMovieViewConic.ICurve = prepareGeometry(
      AutoMovieConicFieldJet.NUMBER,
      extents,
      shoulders,
      curvatures,
    );

    // Geometry-only field preparation never pays for these numerical observations.
    for (const arc of curve.quarters)
      arc.parameters = Array.from(
        { length: 17 },
        (_: unknown, i: number): number =>
          i === 0
            ? 0
            : i === 16
              ? 1
              : turned(arc.extents[0], arc.extents[1], arc.shoulder, i / 16),
      );
    return curve;
  }

  /** Prepare only quarter geometry in the supplied scalar algebra. */
  export function prepareGeometry<T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
    curvatures: readonly T[],
  ): IAutoMovieViewConic.ICurve<T> {
    return AutoMovieConicPreparation.geometry(
      ops,
      extents,
      shoulders,
      curvatures,
    );
  }

  /** The original conic/G2-end source at a periodic angle. */
  export function radius(
    curve: IAutoMovieViewConic.ICurve,
    phi: number,
  ): IAutoMoviePolarSector.Jet {
    return read(curve, phi)?.radial ?? [NaN, NaN, NaN];
  }

  /** Same native radial value without requesting phase derivatives. */
  export function value(
    curve: IAutoMovieViewConic.ICurve,
    phi: number,
  ): number {
    const selected: Selection | null = selection(curve, phi);
    if (selected === null) return NaN;
    const { local, toEnd, arc, kind }: Selection = selected;
    if (local === 0) return arc.extents[0] > 0 ? arc.extents[0] : NaN;
    return kind === "conic"
      ? AutoMovieConicArc.value(
          arc.extents[0],
          arc.extents[1],
          arc.shoulder,
          local,
        )
      : AutoMovieConicHermite.value(
          kind === "start" ? arc.start! : arc.end!,
          kind === "start" ? local : toEnd,
        );
  }

  /** Numeric quarter and selected-piece location for one periodic polar query. */
  export function read(
    curve: IAutoMovieViewConic.ICurve,
    phi: number,
  ): IAutoMovieViewConic.IRay | null {
    const selected: Selection | null = selection(curve, phi);
    if (selected === null) return null;
    const { q, local, toEnd, arc, kind }: Selection = selected;
    let ray: IAutoMovieConicArc.IRay | null;
    if (kind === "start") {
      ray = AutoMovieConicHermite.locate(arc.start!, local);
    } else if (kind === "end") {
      const selected: IAutoMovieConicArc.IRay | null =
        AutoMovieConicHermite.locate(arc.end!, toEnd);
      ray =
        selected === null
          ? null
          : {
              ...selected,
              ...AutoMovieConicArcField.orient(
                AutoMovieConicFieldJet.NUMBER,
                selected,
                true,
              ),
              radial: [
                selected.radial[0],
                -selected.radial[1],
                selected.radial[2],
              ],
              reverse: true,
            };
    } else
      ray = AutoMovieConicArc.locate(
        arc.extents[0],
        arc.extents[1],
        arc.shoulder,
        local,
      );
    if (ray === null) return null;

    if (local === 0)
      ray = {
        ...ray,
        radial: [arc.extents[0], 0, arc.guides[0]],
        logCurvature: Math.log(arc.curvatures[0]),
      };
    return {
      ...ray,
      quarter: q,
      kind,
      angle: local,
      distance: ray.reverse ? toEnd : local,
    };
  }

  /** Value-only location in the identical selected quarter and source piece. */
  export function point(
    curve: IAutoMovieViewConic.ICurve,
    phi: number,
  ): Pick<IAutoMovieViewConic.IRay, "point" | "quarter"> | null {
    const selected: Selection | null = selection(curve, phi);
    if (selected === null) return null;
    const { q, local, toEnd, arc, kind }: Selection = selected;
    const p: readonly [number, number] | null =
      kind === "conic"
        ? AutoMovieConicArc.point(
            arc.extents[0],
            arc.extents[1],
            arc.shoulder,
            local,
          )
        : AutoMovieConicHermite.point(
            kind === "start" ? arc.start! : arc.end!,
            kind === "start" ? local : toEnd,
          );
    return p === null
      ? null
      : { point: kind === "end" ? [p[1], p[0]] : p, quarter: q };
  }

  /** Numeric branch data shared before either capability performs its inverse. */
  interface Selection {
    /** Original quarter. */ q: number;
    /** Original-quarter angle. */ local: number;
    /** Distance to its final end. */ toEnd: number;
    /** Selected source quarter. */ arc: IAutoMovieViewConic.IQuarter;
    /** Actual rational piece. */ kind: IAutoMovieViewConic.IRay["kind"];
  }

  /**
   * Preserve the existing signed small-distance arithmetic and branch
   * boundaries.
   */
  function selection(
    curve: IAutoMovieViewConic.ICurve,
    phi: number,
  ): Selection | null {
    if (curve.failure !== null) return null;
    const turn: number = 2 * Math.PI;
    const quarter: number = Math.PI / 2;
    const remainder: number = phi % turn;
    const index: number = Math.min(
      3,
      Math.floor(Math.abs(remainder) / quarter),
    );
    const distance: number = Math.abs(remainder) - index * quarter;
    const reflected: boolean = remainder < 0 && distance !== 0;
    const q: number = reflected
      ? 3 - index
      : remainder < 0
        ? (4 - index) % 4
        : index;
    const local: number = reflected ? quarter - distance : distance;
    const toEnd: number = reflected ? distance : quarter - local;
    const arc: IAutoMovieViewConic.IQuarter = curve.quarters[q]!;
    const kind: IAutoMovieViewConic.IRay["kind"] =
      local !== 0 && arc.start !== null && local < arc.start.angle
        ? "start"
        : local !== 0 && arc.end !== null && toEnd < arc.end.angle
          ? "end"
          : "conic";
    return { q, local, toEnd, arc, kind };
  }

  /** Original smaller-adjacent guide policy in the supplied scalar algebra. */
  export function curvatures<T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
  ): [T, T, T, T] {
    return AutoMovieConicPreparation.curvatures(ops, extents, shoulders);
  }

  /** Project prepared algebra-valued geometry to numeric lookup data. */
  export function primal<T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
    curve: IAutoMovieViewConic.ICurve<T>,
  ): IAutoMovieViewConic.ICurve {
    return {
      failure: curve.failure,
      quarters: curve.quarters.map(
        (
          arc: IAutoMovieViewConic.IQuarter<T>,
        ): IAutoMovieViewConic.IQuarter => ({
          extents: [ops.value(arc.extents[0]), ops.value(arc.extents[1])],
          shoulder: ops.value(arc.shoulder),
          start: projectedPatch(ops, arc.start),
          end: projectedPatch(ops, arc.end),
          parameters: [...arc.parameters],
          guides: [ops.value(arc.guides[0]), ops.value(arc.guides[1])],
          curvatures: [
            ops.value(arc.curvatures[0]),
            ops.value(arc.curvatures[1]),
          ],
        }),
      ),
    };
  }

  /**
   * Copy one prepared patch's primal values; no preparation formula is
   * repeated.
   */
  function projectedPatch<T>(
    ops: IAutoMovieConicFieldJet.IAlgebra<T>,
    patch: IAutoMovieConicHermite.IPatch<T> | null,
  ): IAutoMovieConicHermite.IPatch | null {
    return patch === null
      ? null
      : {
          extent: ops.value(patch.extent),
          deficit: ops.value(patch.deficit),
          height: ops.value(patch.height),
          native: ops.value(patch.native),
          angle: patch.angle,
          curvature: ops.value(patch.curvature),
          points: patch.points.map(
            (point: readonly [T, T]): readonly [number, number] => [
              ops.value(point[0]),
              ops.value(point[1]),
            ],
          ),
          weights: patch.weights.map((weight: T): number => ops.value(weight)),
        };
  }

  /**
   * Native conic-turn and G2-end boundary observations, which do not define an
   * interpolant.
   */
  export function samples(
    curve: IAutoMovieViewConic.ICurve,
  ): IAutoMoviePolarSector.IGuide[] {
    if (curve.failure !== null) return [];
    const result: IAutoMoviePolarSector.IGuide[] = [];
    for (let q: number = 0; q < 4; q++) {
      const arc: IAutoMovieViewConic.IQuarter = curve.quarters[q]!;
      const start: number = (q * Math.PI) / 2;
      const angles: number[] = [
        0,
        ...(arc.start === null ? [] : [arc.start.angle]),
        ...(arc.end === null ? [] : [Math.PI / 2 - arc.end.angle]),
      ];
      for (const parameter of arc.parameters.slice(1, -1))
        angles.push(
          AutoMovieConicArc.guide(
            arc.extents[0],
            arc.extents[1],
            arc.shoulder,
            parameter,
          ).angle,
        );
      for (const angle of [...new Set(angles)].sort(
        (a: number, b: number): number => a - b,
      )) {
        const phi: number = start + angle;
        if (phi >= 2 * Math.PI || result.at(-1)?.angle === phi) continue;
        const jet: IAutoMoviePolarSector.Jet = radius(curve, phi);
        result.push({
          angle: phi,
          value: jet[0],
          slope: jet[1],
          curvature: jet[2],
        });
      }
    }
    return result;
  }

  /**
   * The existing bounded native-turn partition, used only to split numerical
   * quadrature. Normalized extents preserve its angular meaning.
   */
  function turned(a: number, b: number, r: number, share: number): number {
    const scale: number = Math.max(a, b);
    const A: number = a / scale;
    const B: number = b / scale;
    const w: number = AutoMovieConicArcField.weight(
      AutoMovieConicFieldJet.NUMBER,
      r,
    );
    const target: number = share * Math.PI;
    let low: number = 0;
    let high: number = 1;
    for (let k: number = 0; k < 60; k++) {
      const t: number = (low + high) / 2;
      const s: number = 1 - t;
      const D: number = s * s + 2 * w * t * s + t * t;
      const D1: number = -2 * s + 2 * w * (1 - 2 * t) + 2 * t;
      const x: number = A * (s * s + 2 * w * t * s);
      const y: number = B * (2 * w * t * s + t * t);
      const dx: number = (-2 * s * A + 2 * w * (1 - 2 * t) * A) * D - x * D1;
      const dy: number = (2 * w * (1 - 2 * t) * B + 2 * t * B) * D - y * D1;
      if (Math.atan2(dy, dx) - Math.PI / 2 + Math.atan2(y, x) < target) low = t;
      else high = t;
    }
    return (low + high) / 2;
  }
}
