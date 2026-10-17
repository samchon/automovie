import {
  AutoMoviePchipField64,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

/** Binary64 vector, cubic Bernstein and shape-preserving Hermite operations used by the torso family. Vector operands share a frame; chart widths and derivative units are explicit at each caller. These helpers do not admit a clinical body or certify curve regularity. */
export namespace TorsoMath {
  /** Cyclic support correspondence shared by every section and longitudinal guide, beginning at subject-left lateral and proceeding across the front, right lateral and back. */
  export const lanes: readonly string[] = [
    "lateralLeft",
    "anteriorRootInnerLeft",
    "anteriorRootOuterLeft",
    "anteriorLeft",
    "sternalMedian",
    "anteriorRight",
    "anteriorRootOuterRight",
    "anteriorRootInnerRight",
    "lateralRight",
    "posteriorRight",
    "spinalMedian",
    "posteriorLeft",
  ];

  /** Add vectors expressed in the same frame and physical units. */
  export function add(a: C.Vector, b: C.Vector): C.Vector {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  }

  /** Subtract vectors expressed in the same frame; subtraction performs no parent conversion. */
  export function sub(a: C.Vector, b: C.Vector): C.Vector {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  }

  /** Scale a vector by a scalar; a derivative's units change only through the caller's explicit chart scale. */
  export function mul(a: C.Vector, s: number): C.Vector {
    return [a[0] * s, a[1] * s, a[2] * s];
  }

  /** Return the scalar product in the operands' shared orthonormal frame; units are the product of their units. */
  export function dot(a: C.Vector, b: C.Vector): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }

  /** Return the oriented cross product in the operands' shared right-handed frame; magnitude is retained. */
  export function cross(a: C.Vector, b: C.Vector): C.Vector {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  }

  /** Return the Euclidean magnitude in the input vector's units. */
  export function length(a: C.Vector): number {
    return Math.sqrt(dot(a, a));
  }

  /** Normalize a finite, nonzero construction direction. Throws for a zero or nonfinite magnitude instead of inventing an axis. */
  export function unit(a: C.Vector): C.Vector {
    const n: number = length(a);
    if (!Number.isFinite(n) || n <= 0)
      throw new Error("Finite nonzero construction direction required");
    return mul(a, 1 / n);
  }

  /** Apply three basis columns to local vector components. Origins are handled separately so the same operation also transforms derivatives. */
  export function columns(columns: readonly C.Vector[], p: C.Vector): C.Vector {
    return add(
      add(mul(columns[0]!, p[0]), mul(columns[1]!, p[1])),
      mul(columns[2]!, p[2]),
    );
  }

  /** Project a vector onto an orthonormal basis by dot products. This is a transpose, so the caller must supply a proper orthonormal gauge. */
  export function inverseColumns(
    columns: readonly C.Vector[],
    p: C.Vector,
  ): C.Vector {
    return [dot(columns[0]!, p), dot(columns[1]!, p), dot(columns[2]!, p)];
  }

  /** Evaluate four cubic Bernstein controls at local t. The supported construction callers use t in [0,1]; this helper neither clamps t nor changes the enclosing phase chart. */
  export function bez(p: C.Span, t: number): C.Vector {
    return add(
      add(mul(p[0], (1 - t) ** 3), mul(p[1], 3 * (1 - t) ** 2 * t)),
      add(mul(p[2], 3 * (1 - t) * t * t), mul(p[3], t ** 3)),
    );
  }

  /** Differentiate a cubic with respect to its local t. Divide by the enclosing phase interval to obtain the derivative per unit phase. */
  export function angularDerivative(p: C.Span, t: number): C.Vector {
    return add(
      add(
        mul(sub(p[1], p[0]), 3 * (1 - t) ** 2),
        mul(sub(p[2], p[1]), 6 * (1 - t) * t),
      ),
      mul(sub(p[3], p[2]), 3 * t * t),
    );
  }

  /** Build a closed cubic cycle from supports and one-third derivatives. Each outgoing and incoming handle is multiplied by its span's phase width, preserving the shared endpoint derivative when gains agree. */
  export function spans(
    p: readonly C.Vector[],
    h: readonly C.Vector[],
    widths: readonly number[] = p.map((): number => 1),
  ): C.Span[] {
    return p.map(
      (v: C.Vector, j: number): C.Span => [
        v,
        add(v, mul(h[j]!, widths[j]!)),
        sub(p[(j + 1) % p.length]!, mul(h[(j + 1) % p.length]!, widths[j]!)),
        p[(j + 1) % p.length]!,
      ],
    );
  }

  /** Group consecutive scalar triples as vectors. The family supplies a multiple of three components in the declared lane order. */
  export function unflatten(values: readonly number[]): C.Vector[] {
    const result: C.Vector[] = [];
    for (let i: number = 0; i < values.length; i += 3)
      result.push([values[i]!, values[i + 1]!, values[i + 2]!]);
    return result;
  }

  /** Convert endpoint values and derivatives into cubic controls using width/3. Derivatives are per unit of the same chart as width, so the output retains the endpoint-value units. */
  export function hermite(
    a: C.Vector,
    b: C.Vector,
    da: C.Vector,
    db: C.Vector,
    width: number,
  ): C.Span {
    return [a, add(a, mul(da, width / 3)), sub(b, mul(db, width / 3)), b];
  }

  /** Accumulate strictly positive finite phase widths. Throws if addition loses increasing order or overflows; phase correspondence is not repaired or renormalized here. */
  export function cumulative(widths: readonly number[]): number[] {
    const result: number[] = [0];
    for (const width of widths) {
      const next: number = result.at(-1)! + width;
      if (
        !Number.isFinite(width) ||
        width <= 0 ||
        !Number.isFinite(next) ||
        next <= result.at(-1)!
      )
        throw new Error("Resolved increasing phase required");
      result.push(next);
    }
    return result;
  }

  /** Package finite cubic controls with their actual positive phase intervals. Controls use millimetres; phaseUnit labels the caller's chart and is not a conversion. Throws on a mismatched interval count or nonfinite controls. */
  export function cubic(
    name: string,
    spans: readonly C.Span[],
    closed: boolean,
    widths: readonly number[],
    phaseUnit: C.Cubic["phaseUnit"] = "normalized",
  ): C.Cubic {
    cumulative(widths);
    if (widths.length !== spans.length || !spans.flat(2).every(Number.isFinite))
      throw new Error("Invalid actual cubic field");
    return {
      type: "cubicBezier",
      name,
      closed,
      unit: "mm",
      phaseUnit,
      phaseIntervals: widths,
      spans,
    };
  }

  /** Interpolate an open semantic course in a proper local basis, then project interior tangents into their supplied planes. Explicit first/last derivatives replace endpoint estimates and retain the phase units; a zero projection is not repaired. */
  export function semantic(
    name: string,
    points: readonly C.Vector[],
    phase: readonly number[],
    first: C.Vector,
    last: C.Vector,
    normals: readonly C.Vector[],
    basis: readonly C.Vector[],
    unit: C.Cubic["phaseUnit"] = "normalized",
  ): C.Cubic {
    const pchip: AutoMoviePchipField64 = new AutoMoviePchipField64(
      phase,
      points.map(
        (p: C.Vector): C.Vector => inverseColumns(basis, sub(p, points[0]!)),
      ),
    );
    const d: C.Vector[] = phase.map(
      (p: number): C.Vector =>
        columns(basis, pchip.at(p, true) as unknown as C.Vector),
    );
    normals.forEach((normal: C.Vector, i: number): void => {
      const n: C.Vector = unitVector(normal);
      d[i + 1] = sub(d[i + 1]!, mul(n, dot(d[i + 1]!, n)));
    });
    d[0] = first;
    d[d.length - 1] = last;
    const widths: number[] = phase
      .slice(1)
      .map((v: number, i: number): number => v - phase[i]!);
    return cubic(
      name,
      widths.map(
        (w: number, i: number): C.Span =>
          hermite(points[i]!, points[i + 1]!, d[i]!, d[i + 1]!, w),
      ),
      false,
      widths,
      unit,
    );
  }
  /** Normalize a supplied semantic tangent-plane normal using the same finite nonzero-direction requirement. */
  function unitVector(p: C.Vector): C.Vector {
    return unit(p);
  }

  /** Build an open junction guide using chord directions and handles of 0.27 times the shorter adjacent chord. The 0.27 factor is a common engineering roundness convention; last supplies the owner's actual endpoint handle displacement, not a per-millimetre derivative. */
  export function smooth(
    name: string,
    p: readonly C.Vector[],
    last: C.Vector,
  ): C.Cubic {
    const h: C.Vector[] = p.map((v: C.Vector, j: number): C.Vector => {
      const prev: C.Vector = p[Math.max(0, j - 1)]!,
        next: C.Vector = p[Math.min(p.length - 1, j + 1)]!,
        amount: number =
          0.27 *
          Math.min(
            length(sub(j ? p[j]! : next, j ? prev : v)),
            length(
              sub(j < p.length - 1 ? next : v, j < p.length - 1 ? v : prev),
            ),
          );
      return mul(unit(sub(next, prev)), amount);
    });
    h[h.length - 1] = last;
    return cubic(
      name,
      p
        .slice(0, -1)
        .map(
          (v: C.Vector, j: number): C.Span => [
            v,
            add(v, h[j]!),
            sub(p[j + 1]!, h[j + 1]!),
            p[j + 1]!,
          ],
        ),
      false,
      p.slice(1).map((): number => 1),
    );
  }
}
