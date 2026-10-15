import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The hand's control cage while it is drawn: vertices with the skin point each must reach, and quads, all in the hand's own frame.
 *
 * The frame is the left hand's, the same numbers serving both sides: `x` distal along the hand, `y` palmar, `z` radial. A loop of vertices runs counterclockwise about the direction it is extruded along on the left hand, palmar first, then ulnar, dorsal and radial, so every quad here winds counterclockwise seen from outside the left hand; the right hand, the mirror image, reverses them when the cage is placed. Targets are points of the limit surface, not control points: the cage is solved afterwards so its limit passes through them.
 *
 * @author Samchon
 */
export class AutoMovieHumanHandSketch {
  private readonly targets_: IAutoMovieVector3[] = [];
  private readonly faces_: Array<[number, number, number, number]> = [];

  /**
   * Add a vertex.
   *
   * @param target Skin point it must reach, hand frame, millimetres
   * @returns Its index
   */
  public vertex(target: IAutoMovieVector3): number {
    this.targets_.push(target);
    return this.targets_.length - 1;
  }

  /**
   * Add a loop of vertices.
   *
   * @param targets Skin points in loop order
   * @returns Their indices
   */
  public loop(targets: IAutoMovieVector3[]): number[] {
    return targets.map((t: IAutoMovieVector3): number => this.vertex(t));
  }

  /**
   * Add one quad.
   *
   * @param corners Corners counterclockwise seen from outside the left hand
   */
  public quad(corners: [number, number, number, number]): void {
    this.faces_.push(corners);
  }

  /**
   * Join two loops of equal count with one quad per span.
   *
   * @param from The loop nearer the wrist
   * @param to The next loop distally, its vertex `k` facing vertex `k` of `from`
   * @param skip Spans left open, by the index of their first vertex
   */
  public bridge(from: number[], to: number[], skip: ReadonlySet<number> = new Set()): void {
    const n: number = from.length;
    if (to.length !== n) throw new Error(`hand bridge needs equal loops, got ${n} and ${to.length}`);
    for (let k: number = 0; k < n; ++k)
      if (!skip.has(k)) this.quad([from[k]!, from[(k + 1) % n]!, to[(k + 1) % n]!, to[k]!]);
  }

  /**
   * Join a loop to a larger loop distal to it, every span of the smaller one facing one or three spans of the larger.
   *
   * A three-span sector is two quads split by the edge from the smaller loop's first vertex to the larger loop's third: the larger loop's second vertex keeps one face toward the wrist, so a valence 5 vertex there becomes regular, and the smaller loop's first vertex gains valence 5.
   *
   * @param from The smaller loop, nearer the wrist
   * @param to The larger loop, its vertex 0 facing vertex 0 of `from`
   * @param spans Spans of `to` each span of `from` faces, 1 or 3
   */
  public taper(from: number[], to: number[], spans: number[]): void {
    const m: number = from.length;
    const n: number = to.length;
    if (spans.length !== m || spans.reduce((a: number, b: number): number => a + b, 0) !== n)
      throw new Error(`hand taper spans must cover ${n} spans in ${m}`);
    let i: number = 0;
    spans.forEach((span: number, j: number): void => {
      const a: number = from[j]!;
      const b: number = from[(j + 1) % m]!;
      const at = (s: number): number => to[(i + s) % n]!;
      if (span === 1) this.quad([a, b, at(1), at(0)]);
      else {
        this.quad([a, b, at(3), at(2)]);
        this.quad([a, at(2), at(1), at(0)]);
      }
      i += span;
    });
  }

  /**
   * Close a loop of eight with four quads around one apex.
   *
   * Vertices 0, 2, 4 and 6 of the loop, its palmar, ulnar, dorsal and radial ones, stay regular; the four between become valence 3.
   *
   * @param loop The loop, counterclockwise about the direction the cap faces
   * @param apex Skin point of the apex
   * @returns The apex vertex
   */
  public cap(loop: number[], apex: IAutoMovieVector3): number {
    if (loop.length !== 8) throw new Error(`hand cap needs a loop of 8, got ${loop.length}`);
    const c: number = this.vertex(apex);
    for (let k: number = 0; k < 4; ++k) this.quad([loop[2 * k]!, loop[2 * k + 1]!, loop[(2 * k + 2) % 8]!, c]);
    return c;
  }

  /**
   * Move a vertex's skin point.
   *
   * @param index Vertex index
   * @param target Its new skin point
   */
  public move(index: number, target: IAutoMovieVector3): void {
    this.targets_[index] = target;
  }

  /**
   * Skin point of a vertex.
   *
   * @param index Vertex index
   * @returns Its target
   */
  public target(index: number): IAutoMovieVector3 {
    return this.targets_[index]!;
  }

  /**
   * Every target, by vertex index.
   *
   * @returns The targets; not a copy
   */
  public targets(): readonly IAutoMovieVector3[] {
    return this.targets_;
  }

  /**
   * Every quad.
   *
   * @returns The quads; not a copy
   */
  public faces(): ReadonlyArray<readonly [number, number, number, number]> {
    return this.faces_;
  }
}
