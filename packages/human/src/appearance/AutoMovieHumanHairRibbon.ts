import { AutoMovieHumanCardBuilder } from "./AutoMovieHumanCardBuilder";

/** Rotation-minimizing card frames and finite-strip width bounds, in millimetres. */
export class AutoMovieHumanHairRibbon {
  /** Transport one outward initial frame along the actual emitted guide. */
  public static frame(
    points: ReadonlyArray<readonly number[]>,
    initialNormal: readonly number[],
  ): { sides: V[]; normals: V[] } {
    const tangents: V[] = points.map(
      (_: readonly number[], k: number): V =>
        unit(
          sub(
            points[Math.min(k + 1, points.length - 1)]!,
            points[Math.max(k - 1, 0)]!,
          ),
        ),
    );
    let normal: V = unit(
      sub(initialNormal, scale(tangents[0]!, dot(initialNormal, tangents[0]!))),
    );
    let side: V = unit(cross(normal, tangents[0]!));
    const sides: V[] = [side];
    const normals: V[] = [normal];
    for (let k: number = 1; k < points.length; ++k) {
      const a: V = tangents[k - 1]!;
      const b: V = tangents[k]!;
      const v: V = cross(a, b);
      const cosine: number = dot(a, b);
      if (cosine <= -1 + 1e-8)
        throw new Error(
          "Hair guide reverses before its ribbon frame can be transported",
        );
      side = add(
        side,
        add(cross(v, side), scale(cross(v, cross(v, side)), 1 / (1 + cosine))),
      );
      side = unit(sub(side, scale(b, dot(side, b))));
      normal = unit(cross(b, side));
      sides.push(side);
      normals.push(normal);
    }
    return { sides, normals };
  }

  /**
   * Bound one width scale using every triangle's signed area A*w+B*w².
   * This regularizes the emitted finite strip, not its continuous contact or
   * global self-intersection. Centres, atlas and material are unchanged.
   */
  public static regularize(
    card: AutoMovieHumanCardBuilder.ICard,
  ): AutoMovieHumanCardBuilder.ICard {
    const full: number[] = facing(card, 1);
    const half: number[] = facing(card, 0.5);
    const coefficients: Array<{ a: number; b: number }> = full.map(
      (value: number, k: number): { a: number; b: number } => {
        const a: number = 4 * half[k]! - value;
        return { a, b: value - a };
      },
    );
    const sign: number = Math.sign(
      coefficients.find(
        (p: { a: number; b: number }): boolean => Math.abs(p.a) > 1e-10,
      )?.a ?? 0,
    );
    if (
      sign === 0 ||
      coefficients.some(
        (p: { a: number; b: number }): boolean => sign * p.a <= 1e-10,
      )
    )
      throw new Error(
        "Hair guide needs refinement before a consistently oriented strip can be emitted",
      );
    let widthScale: number = 1;
    for (const p of coefficients)
      if (sign * p.b < 0)
        widthScale = Math.min(widthScale, 0.95 * (-p.a / p.b));
    const result: AutoMovieHumanCardBuilder.ICard = {
      ...card,
      widths: card.widths.map((width: number): number => width * widthScale),
    };
    if (
      facing(result, 1).some((value: number): boolean => sign * value <= 1e-9)
    )
      throw new Error(
        "Hair strip remains degenerate after its analytic width bound",
      );
    return result;
  }

  /**
   * Distance-integrated gravity followed by comb attraction.
   * A bob can settle over its actual root's anterior head depth, millimetres:
   * gravity ramps linearly from zero to its full rate over that distance.
   * The exact integral uses nominal advance distance before curl and clearance
   * corrections, not a number of guide rows or final polyline arclength.
   */
  public static advance(
    direction: readonly number[],
    radial: readonly number[],
    style: "crop" | "short" | "bob",
    stepMm: number,
    settleMm: number = 0,
    travelledMm: number = 0,
  ): V {
    let d: V = unit(direction);
    const rate: number =
      style === "bob" ? 0.035 : style === "short" ? 0.012 : 0;
    const gravityIntegral: (distanceMm: number) => number = (
      distanceMm: number,
    ): number =>
      settleMm <= 0
        ? distanceMm
        : distanceMm < settleMm
          ? (distanceMm * distanceMm) / (2 * settleMm)
          : distanceMm - settleMm / 2;
    const gravityMm: number =
      gravityIntegral(travelledMm + stepMm) - gravityIntegral(travelledMm);
    if (rate !== 0 && Math.abs(d[1]) < 1 - 1e-14) {
      const y: number = Math.tanh(Math.atanh(d[1]) - rate * gravityMm);
      const horizontal: number = Math.sqrt((1 - y * y) / (1 - d[1] * d[1]));
      d = [d[0] * horizontal, y, d[2] * horizontal];
    }
    const outward: number = dot(d, radial);
    if (outward > 0 && outward < 1 - 1e-12 && style !== "bob") {
      // The previous 0.6 turn acted once per segment. Exponential decay makes
      // this conventional attraction depend on distance, not subdivision count.
      const after: number = outward * Math.exp((Math.log(0.4) * stepMm) / 10);
      const tangent: V = unit(sub(d, scale(radial, outward)));
      d = add(
        scale(radial, after),
        scale(tangent, Math.sqrt(1 - after * after)),
      );
    }
    return d;
  }
}

type V = [number, number, number];
function add(a: readonly number[], b: readonly number[]): V {
  return [a[0]! + b[0]!, a[1]! + b[1]!, a[2]! + b[2]!];
}
function sub(a: readonly number[], b: readonly number[]): V {
  return [a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!];
}
function scale(a: readonly number[], n: number): V {
  return [a[0]! * n, a[1]! * n, a[2]! * n];
}
function dot(a: readonly number[], b: readonly number[]): number {
  return a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
}
function cross(a: readonly number[], b: readonly number[]): V {
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}
function unit(v: readonly number[]): V {
  const length: number = Math.hypot(...v);
  if (!(length > 1e-10))
    throw new Error("Hair guide has a degenerate direction");
  return scale(v, 1 / length);
}
function facing(
  card: AutoMovieHumanCardBuilder.ICard,
  widthScale: number,
): number[] {
  const rows: V[][] = card.points.map(
    (point: readonly number[], k: number): V[] =>
      [-1, 1].map(
        (sign: number): V =>
          add(
            point,
            scale(card.sides[k]!, (sign * card.widths[k]! * widthScale) / 2),
          ),
      ),
  );
  const result: number[] = [];
  for (let k: number = 0; k + 1 < rows.length; ++k) {
    const a: V = rows[k]![0]!;
    const b: V = rows[k]![1]!;
    const c: V = rows[k + 1]![0]!;
    const d: V = rows[k + 1]![1]!;
    const first: V = unit(
      add(scale(card.normals[k]!, 2), card.normals[k + 1]!),
    );
    const second: V = unit(
      add(card.normals[k]!, scale(card.normals[k + 1]!, 2)),
    );
    result.push(
      dot(cross(sub(b, a), sub(d, a)), first),
      dot(cross(sub(d, a), sub(c, a)), second),
    );
  }
  return result;
}
