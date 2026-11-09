import { AutoMovieConicArc } from "./AutoMovieConicArc";
import { AutoMovieConicArcField } from "./AutoMovieConicArcField";
import { AutoMovieConicFieldJet } from "./AutoMovieConicFieldJet";
import { AutoMovieConicHermite } from "./AutoMovieConicHermite";
import { AutoMovieConicPreparation } from "./AutoMovieConicPreparation";
import type { AutoMoviePolarSector } from "./AutoMoviePolarSector";

/**
 * Four rational conics with convex rational cubic G2 end approximations.
 *
 * Supports and shoulders remain exact. Only an incompatible guide curvature
 * changes a short conic end through AutoMovieConicHermite. Its native support
 * vanishes with the curvature contrast, so the composed source is jointly C2
 * for smooth input extents/shoulders on the admitted regular domain. This
 * source statement does not certify a later periodic spline or a physical pole.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes source C2/error/admission from final phase fitting, longitudinal coefficient interpolation and pole regularity.
 * @evidence contracts/development/design.md#principled-representation Represents Four rational conics with convex rational cubic G2 end approximations: companion namespace of 16 members (`IRay`, `IQuarter`, `ICurve`, `create`, `prepareGeometry`, `radius`, ...); units and frames named in its text: second, local, radians, rational. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieViewConic` in packages/engine/src/geometry/construction/AutoMovieViewConic.ts; its surface is the 16 members listed and the text shows 15 other files naming it, mostly test (8), packages/engine (7), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.
 */
export namespace AutoMovieViewConic {
  /**
   * Selected quarter location, preserving the source's actual numeric clock.
   *
   * @evidence contracts/development/design.md#principled-representation Extends the shared numeric ray with the exact quarter and raw/G2 selection.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One descriptor is consumed by fixed-clock field readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No second inverse, implicit fallback or invented endpoint clock is hidden.
   * @evidence contracts/development/common.md#meaningful-documentation Angle is original-quarter local; distance is selected-end local; point and tangent are already restored to the original chart.
   */
  export interface IRay extends AutoMovieConicArc.IRay {
    /** Original quarter index in[0,3]. */
    quarter: number;

    /** Actual selected source piece. */
    kind: "conic" | "start" | "end";

    /** Original quarter-local polar angle, radians. */
    angle: number;

    /** Small angular distance in the selected end chart, radians. */
    distance: number;
  }

  /**
   * One source quarter and its disjoint initial/final C2 supports.
   *
   * @evidence contracts/development/design.md#principled-representation The positive extents/shoulder identify the original conic; each optional end holds its distinct convex G2 approximation and native boundary.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two extents, one shoulder, two optional ends and one native partition expose the complete prepared quarter.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Holds no sampled replacement curve or emitted mesh data.
   * @evidence contracts/development/common.md#meaningful-documentation Members state length, shoulder, optional-end and native-partition meanings.
   */
  export interface IQuarter<T = number> {
    /** First and second positive half extents, millimetres. */
    extents: readonly [T, T];

    /** Original conic shoulder in (0,1). */
    shoulder: T;

    /** Optional initial convex G2 end; null preserves the exact quadratic. */
    start: AutoMovieConicHermite.IPatch<T> | null;

    /** Optional reflected final convex G2 end, with the same ownership. */
    end: AutoMovieConicHermite.IPatch<T> | null;

    /** Original quadratic native-turn partition in create; empty in geometry-only prepareGeometry. */
    parameters: readonly number[];

    /** Shared radial second derivatives at the two zero-slope main guides, millimetres. */
    guides: readonly [T, T];

    /** Shared geometric guide curvatures; auxiliary branch jets at a tie are not derivatives of min. */
    curvatures: readonly [T, T];
  }

  /**
   * Prepared closed source with an explicit admission failure state.
   *
   * @evidence contracts/development/design.md#principled-representation Keeps four admitted quarter functions or the exact reason their positive-curvature/finite arithmetic premise failed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One discriminating nullable failure keeps source admission separate from radius reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A failure does not select a fallback shape, hidden quarter or sampled polygon.
   * @evidence contracts/development/common.md#meaningful-documentation States successful quarter count and failure meaning.
   */
  export interface ICurve<T = number> {
    /** Four source quarters on success; empty on admission failure. */
    quarters: readonly IQuarter<T>[];

    /** Original admission rule and numbers, or null. */
    failure: string | null;
  }

  /**
   * Prepare exact conics and only their necessary shared-curvature supports.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the shared positive geometric curvatures and each own endpoint law to prepare disjoint rational G2 ends before native t=1/2; exact shoulder points remain outside those ends.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns the four-quarter source or its original named premise failure.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Admits finite positive inputs without normalization to a new shape; a zero shared curvature or failed numerical support remains a failure.
   * @evidence contracts/development/common.md#meaningful-documentation States input ownership and named failure behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight fixed-size end preparations and 60 bisections for each of 60 retained native-turn interior parameters.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Prepares each end and native partition once for every later source or length reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns only four copied records; failed local preparation releases its temporary records.
   */
  export function create(
    extents: readonly number[],
    shoulders: readonly number[],
    curvatures: readonly number[],
  ): ICurve {
    const curve: ICurve = prepareGeometry(
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

  /**
   * Prepare only quarter geometry in the supplied scalar algebra.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The same positive input admission and G2 preparation serves NUMBER and source Hessians.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Geometry preparation is separate from the numeric adapter's native-turn partition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No observation partition, length quadrature or girth solve is performed.
   * @evidence contracts/development/common.md#meaningful-documentation Supplied curvatures are the chosen original guide policy; their tie jets remain auxiliary branch jets.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight constant-size end preparations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each prepared end is shared by numeric projection and source readings.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Four fixed-size records and empty partition arrays are caller-owned.
   */
  export function prepareGeometry<T>(
    ops: AutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
    curvatures: readonly T[],
  ): ICurve<T> {
    return AutoMovieConicPreparation.geometry(
      ops,
      extents,
      shoulders,
      curvatures,
    );
  }

  /**
   * The original conic/G2-end source at a periodic angle.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the original rational quarter or its sole active G2 end; reflected evaluation changes only the first angular derivative's sign.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One evaluator serves source validity, observations and production section sampling; native arclength reads the identical pieces.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never flips a point or clamps its value; an unadmitted/nonfinite query returns a nonfinite jet for the caller's diagnostic path.
   * @evidence contracts/development/common.md#meaningful-documentation States periodic angle, radial derivative order and explicit nonfinite failure result.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant quarter lookup and a closed-form conic ray, or at most 64 bisections inside one short G2 end.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses prepared rational controls/weights without repeating admission.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one three-number jet and retains no query state.
   */
  export function radius(curve: ICurve, phi: number): AutoMoviePolarSector.Jet {
    return read(curve, phi)?.radial ?? [NaN, NaN, NaN];
  }

  /**
   * Same native radial value without requesting phase derivatives.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The unchanged periodic selection dispatches to each actual conic/G2 scalar kernel; guide values retain their exact extent override.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Shares selection and inverse owners with radius while exposing only a scalar capability.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the raw normalized native-point norm and scale order, rather than a norm reconstructed from restored Point0; no clamp, geometry fallback or arbitrary callback memoization is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation Returns a source length or NaN on source/query/value failure; phase-derivative admission belongs to radius.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed selection and the original inverse omit unused tangent and polar2 work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the caller's unchanged prepared quarters.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A scalar query retains no state.
   */
  export function value(curve: ICurve, phi: number): number {
    const selected: Selection | null = selection(curve, phi);
    if (selected === null) return NaN;
    const { local, toEnd, arc, kind }: Selection = selected;
    if (local === 0)
      return Number.isFinite(arc.extents[0]) && arc.extents[0] > 0
        ? arc.extents[0]
        : NaN;
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

  /**
   * Numeric quarter and selected-piece location for one periodic polar query.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the existing signed small-distance lookup and one native or log-odds inverse.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The numeric radius adapter and source reader consume one branch descriptor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Tiny negative phases retain their small end distance; no trigonometric reconstruction is needed by the source lift.
   * @evidence contracts/development/common.md#meaningful-documentation Angle is the original quarter-local angle; distance is the selected end's small local angle; reflection is already in point/tangent/radial.
   * @evidence contracts/development/implementation.md#efficient-algorithms One quarter lookup and at most64 numeric-only bisections.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The descriptor reuses one final point, tangent, radial jet and curvature reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only fixed numeric data escapes; no preparation or cache is retained.
   */
  export function read(curve: ICurve, phi: number): IRay | null {
    const selected: Selection | null = selection(curve, phi);
    if (selected === null) return null;
    const { q, local, toEnd, arc, kind }: Selection = selected;
    let ray: AutoMovieConicArc.IRay | null;
    if (kind === "start") {
      ray = AutoMovieConicHermite.locate(arc.start!, local);
    } else if (kind === "end") {
      const selected: AutoMovieConicArc.IRay | null =
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

  /**
   * Value-only location in the identical selected quarter and source piece.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Shares the signed periodic lookup and each piece's exact numeric inverse/point kernel with read.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A point and quarter tag suffice for Cartesian values without a fabricated ray jet.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves tiny negative end distances, physical restoration and one end reflection; no guide override replaces coordinates.
   * @evidence contracts/development/common.md#meaningful-documentation Coordinates remain in the original local quarter; the consumer applies its quarter rotation once. Invalid source/query/point returns null.
   * @evidence contracts/development/implementation.md#efficient-algorithms One piece selection and the unchanged bounded inverse omit unused tangent, radial2 and curvature work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same private selection serves full and point readers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh pair/tag with no retained source or phase state.
   */
  export function point(
    curve: ICurve,
    phi: number,
  ): Pick<IRay, "point" | "quarter"> | null {
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
    /** Selected source quarter. */ arc: IQuarter;
    /** Actual rational piece. */ kind: IRay["kind"];
  }

  /** Preserve the existing signed small-distance arithmetic and branch boundaries. */
  function selection(curve: ICurve, phi: number): Selection | null {
    if (curve.failure !== null || !Number.isFinite(phi)) return null;
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
    const arc: IQuarter = curve.quarters[q]!;
    const kind: IRay["kind"] =
      local !== 0 && arc.start !== null && local < arc.start.angle
        ? "start"
        : local !== 0 && arc.end !== null && toEnd < arc.end.angle
          ? "end"
          : "conic";
    return { q, local, toEnd, arc, kind };
  }

  /**
   * Original smaller-adjacent guide policy in the supplied scalar algebra.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each guide selects the smaller rational endpoint curvature by its primal value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One policy serves numeric ViewSection and differentiated geometry preparation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts At a tie the selected auxiliary tuple is not advertised as a derivative of min.
   * @evidence contracts/development/common.md#meaningful-documentation The returned four entries use inverse source length units; the whole geometric field owns tie limits.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eight constant-size endpoint calculations.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All specializations share the same rational curvature formula.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns four caller-owned scalars.
   */
  export function curvatures<T>(
    ops: AutoMovieConicFieldJet.IAlgebra<T>,
    extents: readonly T[],
    shoulders: readonly T[],
  ): [T, T, T, T] {
    return AutoMovieConicPreparation.curvatures(ops, extents, shoulders);
  }

  /**
   * Project prepared algebra-valued geometry to numeric lookup data.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Projects primal controls and weights from the same preparation rather than preparing another source.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One numeric view of the prepared field supplies branch selection and the sole inverse.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No principal reinterpolation, length solve or native-turn partition is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation The projection copies numeric values and retains no algebra table or source tuples.
   * @evidence contracts/development/implementation.md#efficient-algorithms Four quarters and at most eight fixed-size patches.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses every already prepared source control.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Fresh numeric records are caller-owned and structured-cloneable.
   */
  export function primal<T>(
    ops: AutoMovieConicFieldJet.IAlgebra<T>,
    curve: ICurve<T>,
  ): ICurve {
    return {
      failure: curve.failure,
      quarters: curve.quarters.map(
        (arc: IQuarter<T>): IQuarter => ({
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

  /** Copy one prepared patch's primal values; no preparation formula is repeated. */
  function projectedPatch<T>(
    ops: AutoMovieConicFieldJet.IAlgebra<T>,
    patch: AutoMovieConicHermite.IPatch<T> | null,
  ): AutoMovieConicHermite.IPatch | null {
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
   * Native conic-turn and G2-end boundary observations, which do not define an interpolant.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the retained native-turn partition and optional G2-end boundaries solely as observations; every guide reads the same composed source.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The public section's observation list has one owner and no alternate shape interpretation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Fixed initial observations never stand in for the conic or its convexity proof.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes quadrature observations from former polar Hermite construction guides.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 72 observations reuse the retained native parameters with conic guides and bounded G2-end radius reads.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The section retains these observations for display and continuity readers; native length uses the retained parameter partition.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a bounded list of guide values and retains no global arrays.
   */
  export function samples(curve: ICurve): AutoMoviePolarSector.IGuide[] {
    if (curve.failure !== null) return [];
    const result: AutoMoviePolarSector.IGuide[] = [];
    for (let q: number = 0; q < 4; q++) {
      const arc: IQuarter = curve.quarters[q]!;
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
        const jet: AutoMoviePolarSector.Jet = radius(curve, phi);
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

  /** The existing bounded native-turn partition, used only to split numerical quadrature. Normalized extents preserve its angular meaning. */
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
