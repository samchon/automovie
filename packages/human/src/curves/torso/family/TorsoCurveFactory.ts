import {
  AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieCurveRegion64 as R } from "../../IAutoMovieCurveRegion64";
import type { ITorsoCurveConstruction } from "./ITorsoCurveConstruction";
import type { ITorsoMeasurements as T } from "./ITorsoMeasurements";
import { TorsoFamily } from "./TorsoFamily";
import { TorsoMath as M } from "./TorsoMath";
import { constructAutoMovieTorsoMassBorders64 } from "./constructAutoMovieTorsoMassBorders64";
import { constructAutoMovieTorsoUpper64 } from "./constructAutoMovieTorsoUpper64";

/** Ordered cubic control fields in one world frame; position and derivative units belong to the enclosing boundary chart. */
type Spans = readonly C.Span[];
/** Construct the dimensional torso family and its three owned boundaries using actual parent frames. The real face-owned four-span neck operator is required. Internal axillary core, external shoulder/axillary guides and engineering continuation sections remain distinct semantic quantities; these curves alone do not establish a skin surface. */
export class TorsoCurveFactory implements R.Factory {
  /** Region identity used by the parent context to bind the face neck and publish waist and bilateral upper-arm boundaries. */
  public readonly region: string = "chest-waist-shoulder";

  /** Retain the resolved internal dimensional record; construction resolves its bone gauges through the supplied context. */
  public constructor(private readonly measures: T.Value) {}

  /** Return the same generated curves and owned boundaries as constructDetailed, excluding its diagnostic intermediate fields. Positions use millimetres in world space; boundary full-J uses a physical millimetre longitudinal chart. */
  public construct(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): R.Result {
    return this.constructDetailed(context, upstream).delivery;
  }
  /** Generate the lower section family, upper branch field, two lower-mass proxies and owned waist/arm boundaries. Canonical neck and its full-J are consumed directly; adjacent controls are evaluated with explicit deltas before decoding. Each lower-mass border is a 32-piece Hermite approximation of a varying-height family restriction, with selected-sample error only. Throws for a missing/incompatible neck or nonpositive physical collar Jacobian. */
  public constructDetailed(
    context: AutoMovieCurveParentContext,
    upstream: ReadonlyMap<string, C.Boundary>,
  ): ITorsoCurveConstruction {
    const p: T.Value = this.measures,
      root: string = p.bones.root;
    const origin: C.Vector = context.point(root, p.frame.origin),
      basis: readonly C.Vector[] = [
        p.frame.basisX,
        p.frame.basisY,
        p.frame.basisZ,
      ].map((v: C.Vector): C.Vector => context.direction(root, v));
    const family: TorsoFamily = new TorsoFamily(p, origin, basis),
      local: TorsoFamily = new TorsoFamily(
        p,
        [0, 0, 0],
        [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
      ),
      curves: C.Cubic[] = [];
    const ys: number[] = family.rows
      .slice(1)
      .map((row: { name: string; y: number }): number => row.y);
    // The last emitted section is an internal axillary core, not an exterior skin contour.
    for (const row of family.rows.slice(1))
      curves.push(
        M.cubic(
          row.name + ".section",
          family.controls(row.y),
          true,
          family.widths,
        ),
      );
    for (let j: number = 0; j < 12; j++)
      curves.push(
        M.cubic(
          M.lanes[j] + ".meridian",
          family.longitudinal(j, 0, ys),
          false,
          ys.slice(1).map((y: number, i: number): number => y - ys[i]!),
          "mm",
        ),
      );
    for (const j of [0, 1, 2, 5, 6, 7, 8, 11])
      curves.push(
        M.cubic(
          "quarter" + j + ".meridian",
          family.longitudinal(j, 0.5, ys),
          false,
          ys.slice(1).map((y: number, i: number): number => y - ys[i]!),
          "mm",
        ),
      );
    const borders: ReturnType<typeof constructAutoMovieTorsoMassBorders64> =
      constructAutoMovieTorsoMassBorders64(p, family);
    curves.push(...borders.curves);
    const neck: C.Boundary | undefined = upstream.get(p.boundaryIds.neck);
    if (!neck)
      throw new Error(
        "Actual published mid-neck section/full-J is required before torso construction",
      );
    if (
      neck.longitudinalUnit !== "mm" ||
      neck.section.phaseUnit !== "turn" ||
      neck.section.spans.length !== 4 ||
      neck.fullJ.length !== 4
    )
      throw new Error("Actual four-sector physical neck operator required");
    const ns: readonly C.Span[] = neck.section.spans,
      nd: readonly C.Span[] = neck.fullJ;
    // A physical -5 mm step generates Q; decoding retains every supplied neck derivative control.
    const neckQ: C.Span[] = this.offset(ns, nd, -5),
      decodedNeck: C.Boundary = { ...neck, fullJ: this.decode(ns, neckQ, -5) };
    curves.push({ ...neck.section, name: "canonical.neck.midTube" });
    curves.push(
      M.cubic(
        "neck.sharedJetContinuation",
        neckQ,
        true,
        neck.section.phaseIntervals,
        "turn",
      ),
    );
    for (let j: number = 0; j < 4; j++) {
      const a: C.Vector = ns[j]![0],
        d: C.Vector = M.mul(nd[j]![0], -5);
      curves.push(
        M.cubic(
          "neck.sharedJetColumn" + j,
          [
            [
              a,
              M.add(a, M.mul(d, 1 / 3)),
              M.add(a, M.mul(d, 2 / 3)),
              M.add(a, d),
            ],
          ],
          false,
          [5],
          "mm",
        ),
      );
    }
    const upper: ReturnType<typeof constructAutoMovieTorsoUpper64> =
      constructAutoMovieTorsoUpper64(
        p,
        family,
        local,
        origin,
        basis,
        context,
        neck,
      );
    curves.push(...upper.curves);
    const boundaries: { bone: string; value: C.Boundary }[] = [
      ...upper.boundaries,
    ];
    const rawCollars: ITorsoCurveConstruction["rawCollars"] = upper.rawCollars;
    const waistId: string = p.boundaryIds.waist,
      waistY: number = family.rows[1]!.y,
      widths: number[] = this.oneTurn(family.widths);
    boundaries.unshift({
      bone: root,
      value: {
        id: waistId,
        section: M.cubic(
          waistId,
          family.controls(waistY),
          true,
          widths,
          "turn",
        ),
        fullJ: family.controls(waistY, true),
        longitudinalUnit: "mm",
        longitudinalAxis: basis[1]!,
      },
    });
    return {
      delivery: {
        groups: [{ part: this.region, side: null, primitives: curves }],
        boundaries,
      },
      consumedNeck: neck,
      decodedNeck,
      rawCollars,
      family,
      foldMaximumSelectedApproximationErrorMm:
        borders.maximumSelectedApproximationErrorMm,
    };
  }
  /** Recover every control derivative as (Q-P)/delta in the declared longitudinal chart. Delta is explicit and must correspond to the generated adjacent controls; this operation performs no chart admission or frame alignment. */
  private decode(p: Spans, q: Spans, delta: number): C.Span[] {
    return p.map(
      (span: C.Span, i: number): C.Span =>
        span.map(
          (v: C.Vector, j: number): C.Vector =>
            M.mul(M.sub(q[i]![j]!, v), 1 / delta),
        ) as unknown as C.Span,
    );
  }
  /** Generate adjacent control values Q=P+delta*J in the same world frame. Delta has the longitudinal parameter's units, so position controls remain millimetres. */
  private offset(p: Spans, j: Spans, delta: number): C.Span[] {
    return p.map(
      (span: C.Span, i: number): C.Span =>
        span.map(
          (v: C.Vector, k: number): C.Vector =>
            M.add(v, M.mul(j[i]![k]!, delta)),
        ) as unknown as C.Span,
    );
  }
  /** Rescale positive family angular widths by their common total and close the last interval against accumulated binary64 rounding. Positions are unchanged; derivative consumers use the published one-turn chart. */
  private oneTurn(widths: readonly number[]): number[] {
    const total: number = widths.reduce(
        (s: number, w: number): number => s + w,
        0,
      ),
      result: number[] = widths.map((w: number): number => w / total);
    result[result.length - 1] =
      1 -
      result.slice(0, -1).reduce((s: number, w: number): number => s + w, 0);
    M.cumulative(result);
    return result;
  }
}
