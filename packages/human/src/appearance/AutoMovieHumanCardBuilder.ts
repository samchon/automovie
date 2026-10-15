import { IAutoMovieMesh } from "@automovie/interface";

/**
 * Accumulates hair cards, strips of quads along guide curves, into one mesh in emission order.
 *
 * A card is a ribbon along a polyline: at each guide point it spans its width across the given side direction, so two vertices per point and two triangles per segment, wound counterclockwise seen from the side its normals face. Texture `x` runs across the card within the card's atlas column and `y` from 0 at the root to 1 at the tip, which is the direction the hair material's anisotropy follows. Normals are given per point rather than taken from the strip, so a card lying on the scalp shades like the head it covers instead of like a flat ribbon (Scheuermann 2004, "Practical Real-Time Hair Rendering and Shading", SIGGRAPH sketch). Cards are kept in the order they are added, which is the order the renderer draws them, so a caller adds them from the scalp outward.
 *
 * @author Samchon
 */
export class AutoMovieHumanCardBuilder {
  private readonly positions_: number[] = [];
  private readonly normals_: number[] = [];
  private readonly uvs_: number[] = [];
  private readonly indices_: number[] = [];

  /**
   * Add one card.
   *
   * @param card The guide points, their side directions and normals, widths, and the card's texture column
   */
  public card(card: AutoMovieHumanCardBuilder.ICard): void {
    const n: number = card.points.length;
    const base: number = this.positions_.length / 3;
    for (let i: number = 0; i < n; ++i) {
      const p: readonly number[] = card.points[i]!;
      const s: readonly number[] = card.sides[i]!;
      const half: number = card.widths[i]! / 2;
      const y: number = i / (n - 1);
      for (const k of [-1, 1]) {
        this.positions_.push(p[0]! + k * half * s[0]!, p[1]! + k * half * s[1]!, p[2]! + k * half * s[2]!);
        this.normals_.push(...card.normals[i]!);
        this.uvs_.push(k < 0 ? card.column[0] : card.column[1], card.v[0] + y * (card.v[1] - card.v[0]));
      }
    }
    for (let i: number = 0; i + 1 < n; ++i) {
      const a: number = base + 2 * i;
      this.indices_.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
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
