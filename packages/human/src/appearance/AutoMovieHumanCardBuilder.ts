import { IAutoMovieMesh } from "@automovie/interface";

import { IAutoMovieHumanConstructionNet } from "../structures/IAutoMovieHumanConstructionNet";

/**
 * Accumulates hair cards, strips of quads along guide curves, into one mesh in emission order.
 *
 * A card is a ribbon along a polyline: at each guide point it spans its width across the given side direction, so two vertices per point and two triangles per segment, wound counterclockwise seen from the side its normals face, whichever way its side direction runs. Texture `x` runs across the card within the card's atlas column and `y` follows travelled guide distance through its declared root-tip window, the direction the hair material's anisotropy follows. The transported centre normal is tilted across the strip by the conventional side ratio 0.25 and normalized, representing a rounded lock instead of one flat specular plate. This shading field changes no guide or width (Scheuermann 2004, "Practical Real-Time Hair Rendering and Shading", SIGGRAPH sketch). Cards are kept in the order they are added, which is the order the renderer draws them, so a caller adds them from the scalp outward.
 *
 * @author Samchon
 */
export class AutoMovieHumanCardBuilder {
  private readonly positions_: number[] = [];
  private readonly normals_: number[] = [];
  private readonly uvs_: number[] = [];
  private readonly indices_: number[] = [];
  private readonly cards_: Array<{ base: number; count: number }> = [];
  private readonly quads_: number[] = [];
  private readonly poles_: number[] = [];
  private readonly roots_: number[] = [];
  private readonly curves_: IAutoMovieHumanConstructionNet.ICurve[] = [];
  private degenerateCapTriangles_: number = 0;
  private inconsistentCapTriangles_: number = 0;

  /**
   * Add one card.
   *
   * @param card The guide points, their side directions and normals, widths, and the card's texture column
   */
  public card(card: AutoMovieHumanCardBuilder.ICard): void {
    const n: number = card.points.length;
    const base: number = this.positions_.length / 3;
    this.cards_.push({ base, count: n });
    const distances: number[] = [0];
    for (let i: number = 1; i < n; ++i)
      distances.push(
        distances[i - 1]! +
          Math.hypot(
            ...card.points[i]!.map(
              (value: number, axis: number): number =>
                value - card.points[i - 1]![axis]!,
            ),
          ),
      );
    const length: number = distances[n - 1]!;
    if (!(length > 0)) throw new Error("Hair card has no root-to-tip length");
    for (let i: number = 0; i < n; ++i) {
      const p: readonly number[] = card.points[i]!;
      const s: readonly number[] = card.sides[i]!;
      const half: number = card.widths[i]! / 2;
      const y: number = distances[i]! / length;
      for (const k of [-1, 1]) {
        this.positions_.push(
          p[0]! + k * half * s[0]!,
          p[1]! + k * half * s[1]!,
          p[2]! + k * half * s[2]!,
        );
        // A card represents a rounded bundle. Equal normals at both edges
        // make its entire finite width share one flat specular plate. Tilt
        // only the shading field across the actual transported side; the
        // centre guide, strip topology and material coefficients stay owned.
        const normal: number[] = card.normals[i]!.map(
          (value: number, axis: number): number => value + k * 0.25 * s[axis]!,
        );
        const normalLength: number = Math.hypot(...normal);
        this.normals_.push(
          ...normal.map((value: number): number => value / normalLength),
        );
        this.uvs_.push(
          k < 0 ? card.column[0] : card.column[1],
          card.v[0] + y * (card.v[1] - card.v[0]),
        );
      }
    }
    // wind the triangles so their geometric front faces the given normals; a double-sided material flips the shading normal on back faces, so a card wound against its normals would shade from inside
    const P: (i: number) => number[] = (i: number): number[] =>
      this.positions_.slice(3 * i, 3 * i + 3);
    const [p0, p1, p3]: number[][] = [P(base), P(base + 1), P(base + 3)];
    const e1: number[] = [p1[0]! - p0[0]!, p1[1]! - p0[1]!, p1[2]! - p0[2]!];
    const e2: number[] = [p3[0]! - p0[0]!, p3[1]! - p0[1]!, p3[2]! - p0[2]!];
    const g: number[] = [
      e1[1]! * e2[2]! - e1[2]! * e2[1]!,
      e1[2]! * e2[0]! - e1[0]! * e2[2]!,
      e1[0]! * e2[1]! - e1[1]! * e2[0]!,
    ];
    const facing: number =
      g[0]! * (2 * card.normals[0]![0]! + card.normals[1]![0]!) +
      g[1]! * (2 * card.normals[0]![1]! + card.normals[1]![1]!) +
      g[2]! * (2 * card.normals[0]![2]! + card.normals[1]![2]!);
    for (let i: number = 0; i + 1 < n; ++i) {
      const a: number = base + 2 * i;
      if (facing >= 0) this.indices_.push(a, a + 1, a + 3, a, a + 3, a + 2);
      else this.indices_.push(a, a + 3, a + 1, a, a + 2, a + 3);
    }
  }

  /** Emit the explicit triangular fan at the scalp chart's one shared pole. */
  public pole(
    points: readonly [
      readonly [number, number, number],
      readonly [number, number, number],
      readonly [number, number, number],
    ],
    normals: readonly [
      readonly [number, number, number],
      readonly [number, number, number],
      readonly [number, number, number],
    ],
    column: readonly [number, number],
  ): void {
    const base: number = this.positions_.length / 3;
    this.poles_.push(base);
    for (let k: number = 0; k < 3; ++k) {
      this.positions_.push(...points[k]!);
      this.normals_.push(...normals[k]!);
      this.uvs_.push(
        k === 2 ? (column[0] + column[1]) / 2 : column[k]!,
        k === 2 ? 0.6 : 0.4,
      );
    }
    const a: readonly number[] = points[0];
    const u: number[] = points[1].map(
      (value: number, axis: number): number => value - a[axis]!,
    );
    const v: number[] = points[2].map(
      (value: number, axis: number): number => value - a[axis]!,
    );
    const g: number[] = [
      u[1]! * v[2]! - u[2]! * v[1]!,
      u[2]! * v[0]! - u[0]! * v[2]!,
      u[0]! * v[1]! - u[1]! * v[0]!,
    ];
    const facing: number = g.reduce(
      (sum: number, value: number, axis: number): number =>
        sum +
        value * (normals[0][axis]! + normals[1][axis]! + normals[2][axis]!),
      0,
    );
    if (facing === 0) ++this.degenerateCapTriangles_;
    this.indices_.push(
      ...(facing >= 0
        ? [base, base + 1, base + 2]
        : [base, base + 2, base + 1]),
    );
  }

  /**
   * Retain the cap's four actual skin corners/normals and select a consistent
   * diagonal when one exists. Unresolved winding and exact zero-area triangles
   * remain explicit in diagnostics; no threshold removes geometry and no
   * individual triangle is rewound to hide a folded cell.
   */
  public quad(
    points: ReadonlyArray<readonly [number, number, number]>,
    normals: ReadonlyArray<readonly [number, number, number]>,
    column: readonly [number, number],
  ): void {
    const base: number = this.positions_.length / 3;
    this.quads_.push(base);
    for (let k: number = 0; k < 4; ++k) {
      this.positions_.push(...points[k]!);
      this.normals_.push(...normals[k]!);
      this.uvs_.push(column[k % 2]!, k < 2 ? 0.4 : 0.6);
    }
    const candidates: number[][] = [
      [0, 1, 3, 0, 3, 2],
      [0, 1, 2, 1, 3, 2],
    ];
    const signed: (ids: number[]) => number[] = (ids: number[]): number[] =>
      [0, 3].map((k: number): number => {
        const a: readonly number[] = points[ids[k]!]!;
        const b: readonly number[] = points[ids[k + 1]!]!;
        const c: readonly number[] = points[ids[k + 2]!]!;
        const x: number[] = b.map((v: number, j: number): number => v - a[j]!);
        const y: number[] = c.map((v: number, j: number): number => v - a[j]!);
        const n: number[] = [0, 1, 2].map(
          (j: number): number =>
            normals[ids[k]!]![j]! +
            normals[ids[k + 1]!]![j]! +
            normals[ids[k + 2]!]![j]!,
        );
        return (
          (x[1]! * y[2]! - x[2]! * y[1]!) * n[0]! +
          (x[2]! * y[0]! - x[0]! * y[2]!) * n[1]! +
          (x[0]! * y[1]! - x[1]! * y[0]!) * n[2]!
        );
      });
    const choice: number[] | undefined = candidates.find(
      (ids: number[]): boolean => {
        const area: number[] = signed(ids);
        return (
          area.every((a: number): boolean => a >= 0) ||
          area.every((a: number): boolean => a <= 0)
        );
      },
    );
    const selected: number[] =
      choice === undefined ? [0, 1, 3, 0, 3, 2] : choice;
    const areas: number[] = signed(selected);
    const forward: boolean =
      (areas.find((a: number): boolean => a !== 0) ?? 1) > 0;
    for (let k: number = 0; k < 2; ++k) {
      if (areas[k] === 0) ++this.degenerateCapTriangles_;
      if ((forward ? 1 : -1) * areas[k]! < 0) ++this.inconsistentCapTriangles_;
      const tri: number[] = selected.slice(3 * k, 3 * k + 3);
      this.indices_.push(
        ...(forward ? tri : [tri[0]!, tri[2]!, tri[1]!]).map(
          (index: number): number => base + index,
        ),
      );
    }
  }

  /** Record an actual skin root and its normal before the card's lift, millimetres. */
  public root(position: readonly number[], normal: readonly number[]): void {
    this.roots_.push(
      ...position,
      ...position.map(
        (value: number, k: number): number => value + 0.8 * normal[k]!,
      ),
    );
  }

  /** Record a generating feature or plane course, model millimetres, without fitting new controls. */
  public curve(
    kind: IAutoMovieHumanConstructionNet.Kind,
    name: string,
    points: number[],
    closed: boolean = false,
  ): void {
    this.curves_.push({ kind, name, points, closed });
  }

  /**
   * Inspect the same emitted cards as separate guide, width, root and cap edges.
   * All output is world rest metres. No sampled/saved network is read back into
   * generation, and no per-card Three object is needed by the consumer.
   */
  public inspect(part: string): IAutoMovieHumanConstructionNet[] {
    const guides: number[] = [];
    const guideEdges: number[] = [];
    const widths: number[] = [];
    const capEdges: number[] = [];
    for (const card of this.cards_) {
      const start: number = guides.length / 3;
      for (let k: number = 0; k < card.count; ++k) {
        const a: number = card.base + 2 * k;
        for (let axis: number = 0; axis < 3; ++axis)
          guides.push(
            (this.positions_[3 * a + axis]! +
              this.positions_[3 * (a + 1) + axis]!) /
              2000,
          );
        widths.push(a, a + 1);
        if (k !== 0) {
          guideEdges.push(start + k - 1, start + k);
          widths.push(a - 2, a, a - 1, a + 1);
        }
      }
    }
    for (const base of this.quads_)
      capEdges.push(
        base,
        base + 1,
        base + 1,
        base + 3,
        base + 3,
        base + 2,
        base + 2,
        base,
      );
    for (const base of this.poles_)
      capEdges.push(base, base + 1, base + 1, base + 2, base + 2, base);
    const capVertices: number = Math.max(
      0,
      ...this.quads_.map((base: number): number => base + 4),
      ...this.poles_.map((base: number): number => base + 3),
    );
    const rootEdges: number[] = [];
    for (let k: number = 0; k < this.roots_.length / 3; k += 2)
      rootEdges.push(k, k + 1);
    return [
      {
        part: `${part}.guides`,
        side: null,
        curves: this.curves_.map(
          (
            curve: IAutoMovieHumanConstructionNet.ICurve,
          ): IAutoMovieHumanConstructionNet.ICurve => ({
            ...curve,
            points: curve.points.map((value: number): number => value / 1000),
          }),
        ),
        cage: { positions: guides, edges: guideEdges },
      },
      {
        part: `${part}.widths`,
        side: null,
        curves: [],
        cage: {
          positions: this.positions_.map(
            (value: number): number => value / 1000,
          ),
          edges: widths,
        },
      },
      {
        part: `${part}.roots`,
        side: null,
        curves: [],
        cage: {
          positions: this.roots_.map((value: number): number => value / 1000),
          edges: rootEdges,
        },
      },
      {
        part: `${part}.cap`,
        side: null,
        curves: [],
        cage: {
          positions: this.positions_
            .slice(0, 3 * capVertices)
            .map((value: number): number => value / 1000),
          edges: capEdges,
        },
      },
    ];
  }

  /** Actual emitted population and guide resolution, without claiming fine-curl fidelity. */
  public statistics(): {
    cards: number;
    capQuads: number;
    capPoleTriangles: number;
    degenerateCapTriangles: number;
    inconsistentCapTriangles: number;
    triangles: number;
    maximumSegments: number;
    maximumGuideStepMm: number;
  } {
    let maximumSegments: number = 0;
    let maximumGuideStepMm: number = 0;
    for (const card of this.cards_) {
      maximumSegments = Math.max(maximumSegments, card.count - 1);
      for (let k: number = 1; k < card.count; ++k) {
        const a: number = 3 * (card.base + 2 * k);
        const b: number = a - 6;
        const delta: number[] = [0, 1, 2].map(
          (axis: number): number =>
            (this.positions_[a + axis]! +
              this.positions_[a + 3 + axis]! -
              this.positions_[b + axis]! -
              this.positions_[b + 3 + axis]!) /
            2,
        );
        maximumGuideStepMm = Math.max(maximumGuideStepMm, Math.hypot(...delta));
      }
    }
    return {
      cards: this.cards_.length,
      capQuads: this.quads_.length,
      capPoleTriangles: this.poles_.length,
      degenerateCapTriangles: this.degenerateCapTriangles_,
      inconsistentCapTriangles: this.inconsistentCapTriangles_,
      triangles: this.indices_.length / 3,
      maximumSegments,
      maximumGuideStepMm,
    };
  }

  /**
   * The cards so far as one mesh.
   *
   * @returns Mesh in millimetres, model frame at rest, without skin
   */
  public build(): IAutoMovieMesh {
    return {
      positions: [...this.positions_],
      normals: [...this.normals_],
      uvs: [...this.uvs_],
      indices: [...this.indices_],
      skin: null,
    };
  }
}
/**
 * Types and constants of {@link AutoMovieHumanCardBuilder}.
 */
export namespace AutoMovieHumanCardBuilder {
  /**
   * One card along a guide.
   *
   * @author Samchon
   */
  export interface ICard {
    /** Guide points from root to tip, millimetres; at least two. */
    points: ReadonlyArray<readonly [number, number, number]>;

    /** Unit direction across the card at each point. */
    sides: ReadonlyArray<readonly [number, number, number]>;

    /** Shading normal at each point. */
    normals: ReadonlyArray<readonly [number, number, number]>;

    /** Card width at each point, millimetres. */
    widths: readonly number[];

    /** Texture `x` of the card's two edges. */
    column: readonly [number, number];

    /** Texture `y` at the root and at the tip. */
    v: readonly [number, number];
  }
}
