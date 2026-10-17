import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { TorsoFamily } from "./TorsoFamily";
import { TorsoMath as M } from "./TorsoMath";

/** Four position edges and the lower physical-height jet in one normalized chart. */
type Patch = {
  /** Actual lower thorax arc. */
  bottom: C.Cubic;

  /** Shoulder arc or actual neck arc. */
  top: C.Cubic;

  /** Rising edge at transverse parameter zero. */
  inner: C.Cubic;

  /** Rising edge at transverse parameter one. */
  outer: C.Cubic;

  /** Actual lower dP/dy times physical dy/dv, in millimetres. */
  jet: C.Cubic;

  /** Actual upper neck dP/dmillimetre times the same chart scale, when the top edge belongs to the neck. */
  topJet?: C.Cubic;
};

/** Six boundary-derived upper-thorax fields. Four lateral fields connect quarter-neck supports to distinct lower half-sector supports; two central fields fill between them. A cubic Hermite correction consumes the actual lower control jet after compatible rising-edge derivatives are established. Restrictions are construction curves, with no emitted skin or clinical fit claim. */
export class TorsoUpperCourseFamily {
  /** Retain the actual generated edges and upstream world neck operator. */
  public constructor(
    private readonly trunk: TorsoFamily,
    private readonly generated: readonly C.Cubic[],
    private readonly neck: C.Boundary,
  ) {}

  /** Emit exact cubic restrictions, splitting at every edge breakpoint. Half-sector correspondence is one construction convention, without per-body fitted points. */
  public curves(): C.Cubic[] {
    const output: C.Cubic[] = [];
    const ay: number = this.trunk.rows.at(-1)!.y;
    const section: readonly C.Span[] = this.trunk.controls(ay);
    const derivative: readonly C.Span[] = this.trunk.controls(ay, true);
    for (const front of [true, false]) {
      const source: C.Cubic = this.named(
        front ? "upperSternalColumn" : "upperSpinalColumn",
      );
      const median: C.Cubic = this.normalize(source);
      const height: number = source.phaseIntervals.reduce(
        (sum: number, width: number): number => sum + width,
        0,
      );
      const approaches: C.Cubic[] = [];
      for (const side of ["left", "right"] as const) {
        const left: boolean = side === "left";
        const ni: number = front ? (left ? 0 : 3) : left ? 1 : 2;
        const bottom: C.Cubic = this.lower(section, front, left);
        const jet: C.Cubic = this.scaled(
          this.lower(derivative, front, left),
          height,
        );
        const offset: C.Span = M.hermite(
          M.sub(this.at(bottom, 0), this.at(median, 0)),
          M.sub(M.bez(this.neck.section.spans[ni]!, 0.5), this.at(median, 1)),
          M.sub(this.at(jet, 0), this.at(median, 0, true)),
          M.sub(
            M.mul(M.bez(this.neck.fullJ[ni]!, 0.5), height),
            this.at(median, 1, true),
          ),
          1,
        );
        const phase: number[] = M.cumulative(median.phaseIntervals);
        const inner: C.Cubic = M.cubic(
          side +
            ".neckApproach" +
            (front ? "Anterior" : "Posterior") +
            ".guide",
          median.spans.map((span: C.Span, j: number): C.Span => {
            const displacement: C.Span = this.piece(
              offset,
              phase[j]!,
              phase[j + 1]!,
            );
            return span.map(
              (point: C.Vector, k: number): C.Vector =>
                M.add(point, displacement[k]!),
            ) as unknown as C.Span;
          }),
          false,
          median.phaseIntervals,
        );
        approaches.push(inner);
        output.push(inner);
        const outer: C.Cubic = this.normalize(
          this.named(
            side +
              "." +
              (front ? "anteriorAxillaryFold" : "posteriorAxillaryFold"),
          ),
        );
        const top: C.Cubic = this.normalize(
          this.named(
            side +
              "." +
              (front ? "clavicleAnteriorDeltoid" : "scapularPosteriorDeltoid"),
          ),
        );
        output.push(
          ...this.restrictions(
            { bottom, top, inner, outer, jet },
            side + ".upperThorax" + (front ? "Anterior" : "Posterior"),
          ),
        );
      }
      // The two quarter-neck columns retain distinct lower supports. Central
      // fields follow actual neck half-spans instead of collapsing to a V.
      const bottom: C.Cubic = this.central(section, front);
      const jet: C.Cubic = this.scaled(this.central(derivative, front), height);
      const top: C.Cubic = this.neckArc(this.neck.section.spans, front);
      const topJet: C.Cubic = this.scaled(
        this.neckArc(this.neck.fullJ, front),
        height,
      );
      output.push(
        ...this.restrictions(
          {
            bottom,
            top,
            inner: approaches[0]!,
            outer: approaches[1]!,
            jet,
            topJet,
          },
          "median.upperThorax" + (front ? "Anterior" : "Posterior"),
        ),
      );
    }
    return output;
  }

  /** Restrict the actual section at fixed half-sectors; reversal changes angular direction, not the physical dP/dy values. */
  private lower(
    section: readonly C.Span[],
    front: boolean,
    left: boolean,
  ): C.Cubic {
    const spans: C.Span[] = front
      ? left
        ? [this.piece(section[3]!, 0.5, 0), this.piece(section[2]!, 1, 0)]
        : [this.piece(section[4]!, 0.5, 1), section[5]!]
      : left
        ? [this.piece(section[10]!, 0.5, 1)]
        : [this.piece(section[9]!, 0.5, 0)];
    const widths: number[] = front
      ? left
        ? [this.trunk.widths[3]! / 2, this.trunk.widths[2]!]
        : [this.trunk.widths[4]! / 2, this.trunk.widths[5]!]
      : [this.trunk.widths[left ? 10 : 9]! / 2];
    return this.normalize(M.cubic("lowerEdge", spans, false, widths));
  }

  /** Join actual half-sectors around the front or rear median. */
  private central(section: readonly C.Span[], front: boolean): C.Cubic {
    const indices: readonly number[] = front ? [3, 4] : [10, 9];
    const spans: C.Span[] = front
      ? [this.piece(section[3]!, 0.5, 1), this.piece(section[4]!, 0, 0.5)]
      : [this.piece(section[10]!, 0.5, 0), this.piece(section[9]!, 1, 0.5)];
    return this.normalize(
      M.cubic(
        "centralLowerEdge",
        spans,
        false,
        indices.map((j: number): number => this.trunk.widths[j]! / 2),
      ),
    );
  }

  /** Follow actual neck half-spans from subject-left to subject-right. */
  private neckArc(spans: readonly C.Span[], front: boolean): C.Cubic {
    const widths: readonly number[] = this.neck.section.phaseIntervals;
    const indices: readonly number[] = front ? [0, 3] : [1, 2];
    return this.normalize(
      M.cubic(
        "centralNeckEdge",
        front
          ? [this.piece(spans[0]!, 0.5, 0), this.piece(spans[3]!, 1, 0.5)]
          : [this.piece(spans[1]!, 0.5, 1), this.piece(spans[2]!, 0, 0.5)],
        false,
        indices.map((j: number): number => widths[j]! / 2),
      ),
    );
  }

  /** Emit shared field restrictions using the same lower angular chart for P and J. */
  private restrictions(p: Patch, prefix: string): C.Cubic[] {
    const curves: C.Cubic[] = [];
    for (const v of [0.25, 0.5, 0.75]) {
      const knots: number[] = this.knots(p.bottom, p.top);
      curves.push(
        M.cubic(
          prefix + ".cross" + v + ".guide",
          knots.slice(1).map((b: number, j: number): C.Span => {
            const a: number = knots[j]!;
            return M.hermite(
              this.value(p, a, v),
              this.value(p, b, v),
              this.du(p, a, v),
              this.du(p, b, v, true),
              b - a,
            );
          }),
          false,
          knots.slice(1).map((b: number, j: number): number => b - knots[j]!),
        ),
      );
    }
    for (const u of [1 / 3, 2 / 3]) {
      const knots: number[] = this.knots(p.inner, p.outer);
      curves.push(
        M.cubic(
          prefix + ".rise" + u + ".guide",
          knots.slice(1).map((b: number, j: number): C.Span => {
            const a: number = knots[j]!;
            return M.hermite(
              this.value(p, u, a),
              this.value(p, u, b),
              this.dv(p, u, a),
              this.dv(p, u, b, true),
              b - a,
            );
          }),
          false,
          knots.slice(1).map((b: number, j: number): number => b - knots[j]!),
        ),
      );
    }
    return curves;
  }

  /** Resolve an actual edge; missing ownership is an explicit failure. */
  private named(name: string): C.Cubic {
    const curve: C.Cubic | undefined = this.generated.find(
      (c: C.Cubic): boolean => c.name === name,
    );
    if (!curve) throw new Error("Actual upper-thorax edge required: " + name);
    return curve;
  }

  /** Restrict a cubic to oriented [a,b] with its actual first derivative law. */
  private piece(span: C.Span, a: number, b: number): C.Span {
    return M.hermite(
      M.bez(span, a),
      M.bez(span, b),
      M.angularDerivative(span, a),
      M.angularDerivative(span, b),
      b - a,
    );
  }

  /** Convert dP/dy controls to dP/dv with one physical-height scale. */
  private scaled(curve: C.Cubic, height: number): C.Cubic {
    return {
      ...curve,
      spans: curve.spans.map(
        (span: C.Span): C.Span =>
          span.map(
            (point: C.Vector): C.Vector => M.mul(point, height),
          ) as unknown as C.Span,
      ),
    };
  }

  /** Normalize an edge chart while retaining its control values. */
  private normalize(curve: C.Cubic): C.Cubic {
    const total: number = curve.phaseIntervals.reduce(
      (s: number, w: number): number => s + w,
      0,
    );
    const widths: number[] = curve.phaseIntervals.map(
      (w: number): number => w / total,
    );
    widths[widths.length - 1] =
      1 -
      widths.slice(0, -1).reduce((s: number, w: number): number => s + w, 0);
    return M.cubic(curve.name, curve.spans, false, widths);
  }

  /** Combine edge breakpoints so every restriction piece remains cubic. */
  private knots(a: C.Cubic, b: C.Cubic): number[] {
    return [
      ...new Set([
        ...M.cumulative(a.phaseIntervals),
        ...M.cumulative(b.phaseIntervals),
      ]),
    ].sort((x: number, y: number): number => x - y);
  }

  /** Evaluate a value or derivative per normalized edge parameter. */
  private at(
    curve: C.Cubic,
    t: number,
    derivative: boolean = false,
    leftLimit: boolean = false,
  ): C.Vector {
    const phase: number[] = M.cumulative(curve.phaseIntervals);
    let i: number = 0;
    while (
      i < curve.spans.length - 1 &&
      (t > phase[i + 1]! || (!leftLimit && t === phase[i + 1]!))
    )
      i++;
    const local: number =
      t === 1 ? 1 : (t - phase[i]!) / curve.phaseIntervals[i]!;
    return derivative
      ? M.mul(
          M.angularDerivative(curve.spans[i]!, local),
          1 / curve.phaseIntervals[i]!,
        )
      : M.bez(curve.spans[i]!, local);
  }

  /** Position-blend rising derivative before consuming the lower jet. */
  private baseDv(
    p: Patch,
    u: number,
    v: number,
    leftLimit: boolean = false,
  ): C.Vector {
    const correction: C.Vector = M.sub(
      M.add(M.mul(this.at(p.top, 0), 1 - u), M.mul(this.at(p.top, 1), u)),
      M.add(M.mul(this.at(p.bottom, 0), 1 - u), M.mul(this.at(p.bottom, 1), u)),
    );
    return M.sub(
      M.add(
        M.sub(this.at(p.top, u), this.at(p.bottom, u)),
        M.add(
          M.mul(this.at(p.inner, v, true, leftLimit), 1 - u),
          M.mul(this.at(p.outer, v, true, leftLimit), u),
        ),
      ),
      correction,
    );
  }

  /** Prescribed boundary jet minus the position blend's derivative. Compatible rising edges make corner residuals vanish. Shoulder top edges have no invented transverse jet. */
  private residual(
    p: Patch,
    u: number,
    derivative: boolean = false,
    leftLimit: boolean = false,
    top: boolean = false,
  ): C.Vector {
    const jet: C.Cubic | undefined = top ? p.topJet : p.jet;
    if (!jet) return [0, 0, 0];
    const v: number = top ? 1 : 0;
    if (!derivative) return M.sub(this.at(jet, u), this.baseDv(p, u, v));
    const corner: C.Vector = M.sub(
      M.sub(this.at(p.top, 1), this.at(p.bottom, 1)),
      M.sub(this.at(p.top, 0), this.at(p.bottom, 0)),
    );
    return M.sub(
      this.at(jet, u, true, leftLimit),
      M.sub(
        M.add(
          M.sub(
            this.at(p.top, u, true, leftLimit),
            this.at(p.bottom, u, true, leftLimit),
          ),
          M.sub(this.at(p.outer, v, true), this.at(p.inner, v, true)),
        ),
        corner,
      ),
    );
  }

  /** Add cubic Hermite boundary-jet corrections to the same position field. The central fields also consume every actual top-neck derivative control. */
  private value(p: Patch, u: number, v: number): C.Vector {
    const corners: C.Vector = M.add(
      M.mul(
        M.add(
          M.mul(this.at(p.bottom, 0), 1 - u),
          M.mul(this.at(p.bottom, 1), u),
        ),
        1 - v,
      ),
      M.mul(
        M.add(M.mul(this.at(p.top, 0), 1 - u), M.mul(this.at(p.top, 1), u)),
        v,
      ),
    );
    return M.add(
      M.add(
        M.sub(
          M.add(
            M.add(
              M.mul(this.at(p.bottom, u), 1 - v),
              M.mul(this.at(p.top, u), v),
            ),
            M.add(
              M.mul(this.at(p.inner, v), 1 - u),
              M.mul(this.at(p.outer, v), u),
            ),
          ),
          corners,
        ),
        M.mul(this.residual(p, u), v * (1 - v) ** 2),
      ),
      M.mul(this.residual(p, u, false, false, true), v * v * (v - 1)),
    );
  }

  /** Differentiate that same corrected field across the thorax. */
  private du(
    p: Patch,
    u: number,
    v: number,
    leftLimit: boolean = false,
  ): C.Vector {
    const correction: C.Vector = M.add(
      M.mul(M.sub(this.at(p.bottom, 1), this.at(p.bottom, 0)), 1 - v),
      M.mul(M.sub(this.at(p.top, 1), this.at(p.top, 0)), v),
    );
    return M.add(
      M.add(
        M.sub(
          M.add(
            M.add(
              M.mul(this.at(p.bottom, u, true, leftLimit), 1 - v),
              M.mul(this.at(p.top, u, true, leftLimit), v),
            ),
            M.sub(this.at(p.outer, v), this.at(p.inner, v)),
          ),
          correction,
        ),
        M.mul(this.residual(p, u, true, leftLimit), v * (1 - v) ** 2),
      ),
      M.mul(this.residual(p, u, true, leftLimit, true), v * v * (v - 1)),
    );
  }

  /** Differentiate that same corrected field toward the neck/shoulder. */
  private dv(
    p: Patch,
    u: number,
    v: number,
    leftLimit: boolean = false,
  ): C.Vector {
    return M.add(
      M.add(
        this.baseDv(p, u, v, leftLimit),
        M.mul(this.residual(p, u), (1 - v) * (1 - 3 * v)),
      ),
      M.mul(this.residual(p, u, false, false, true), v * (3 * v - 2)),
    );
  }
}
