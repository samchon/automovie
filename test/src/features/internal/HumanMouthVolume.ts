import { Box3, Ray, ShapeUtils, Triangle, Vector2, Vector3 } from "three";

/** Closed-volume containment and distance to the actual tissue triangles. */
export namespace HumanMouthVolume {
  /** Calibration point in millimetres. */
  export type Vec3 = [number, number, number];

  /** A validated surface and explicitly capped aperture. */
  export class Reader {
    private readonly indices: number[];
    private readonly root: INode;
    private readonly physical: number;
    private readonly triangle: Triangle = new Triangle();
    private readonly target: Vector3 = new Vector3();
    private readonly barycentric: Vector3 = new Vector3();

    /**
     * @param positions Immutable tissue vertices in calibration millimetres.
     * @param indices Actual tissue triangles, including any real pockets.
     * @param rims Only the deliberately open aperture loops, in either
     *   direction. Caps classify volume but never count as tissue.
     */
    public constructor(
      private readonly positions: readonly number[],
      indices: readonly number[],
      rims: readonly (readonly number[])[],
    ) {
      this.physical = indices.length / 3;
      this.indices = [...indices];
      for (const rim of rims) this.indices.push(...cap(positions, rim, indices));
      closed(this.indices, positions.length / 3);
      this.root = build(positions, this.indices, Array.from({ length: this.indices.length / 3 }, (_: unknown, index: number): number => index));
    }

    /** True Euclidean distance to actual tissue; synthetic caps are excluded. */
    public distance(point: Vec3): number {
      const p: Vector3 = new Vector3(...point);
      let nearest: number = Infinity;
      const visit: (node: INode) => void = (node: INode): void => {
        if (node.box.distanceToPoint(p) > nearest) return;
        if (node.triangles !== null) {
          for (const index of node.triangles) {
            if (index >= this.physical) continue;
            this.read(index).closestPointToPoint(p, this.target);
            nearest = Math.min(nearest, p.distanceTo(this.target));
          }
          return;
        }
        const children: INode[] = [node.left!, node.right!];
        if (children[0]!.box.distanceToPoint(p) > children[1]!.box.distanceToPoint(p)) children.reverse();
        visit(children[0]!);
        visit(children[1]!);
      };
      visit(this.root);
      return nearest;
    }

    /**
     * Inside the explicitly closed volume. A ray on a triangle edge is
     * ambiguous and discarded; a second generic direction must agree.
     */
    public contains(point: Vec3): boolean {
      const p: Vector3 = new Vector3(...point);
      const directions: Vec3[] = [[1, 0, 0], [0, 1, 0], [0, 0, 1], [1, Math.SQRT2, Math.sqrt(3)], [Math.sqrt(5), 1, Math.sqrt(7)], [Math.sqrt(11), Math.sqrt(13), 1]];
      let answer: boolean | undefined;
      let agreed: number = 0;
      for (const direction of directions) {
        const ray: Ray = new Ray(p, new Vector3(...direction).normalize());
        const hits: number[] = [];
        let ambiguous: boolean = false;
        const visit: (node: INode) => void = (node: INode): void => {
          if (ambiguous || !ray.intersectsBox(node.box)) return;
          if (node.triangles !== null) {
            for (const index of node.triangles) {
              const triangle: Triangle = this.read(index);
              if (ray.intersectTriangle(triangle.a, triangle.b, triangle.c, false, this.target) === null) continue;
              triangle.getBarycoord(this.target, this.barycentric);
              // A dimensionless numerical guard only; no geometric clearance
              // or containment limit is widened by this edge classification.
              if (Math.min(this.barycentric.x, this.barycentric.y, this.barycentric.z) <= 64 * Number.EPSILON) {
                ambiguous = true;
                return;
              }
              const distance: number = p.distanceTo(this.target);
              if (distance > 64 * Number.EPSILON * Math.max(1, p.length())) hits.push(distance);
            }
            return;
          }
          visit(node.left!);
          visit(node.right!);
        };
        visit(this.root);
        if (ambiguous) continue;
        hits.sort((a: number, b: number): number => a - b);
        let crossings: number = 0;
        let previous: number = -Infinity;
        for (const hit of hits) {
          if (hit - previous <= 64 * Number.EPSILON * Math.max(1, hit)) continue;
          crossings++;
          previous = hit;
        }
        const inside: boolean = crossings % 2 === 1;
        if (answer !== undefined && inside !== answer) throw new Error("Closed-volume rays disagree; the surface may intersect itself");
        answer = inside;
        if (++agreed === 2) return inside;
      }
      throw new Error("Closed-volume containment has too few unambiguous rays");
    }

    /** Reuse one triangle only during a synchronous query. */
    private read(index: number): Triangle {
      this.triangle.a.fromArray(this.positions, 3 * this.indices[3 * index]!);
      this.triangle.b.fromArray(this.positions, 3 * this.indices[3 * index + 1]!);
      this.triangle.c.fromArray(this.positions, 3 * this.indices[3 * index + 2]!);
      return this.triangle;
    }
  }

  /** Median triangle tree; its boxes serve both distance and ray queries. */
  interface INode {
    /** Enclosure of every triangle below this node. */
    box: Box3;
    /** Triangle numbers at a leaf, otherwise null. */
    triangles: number[] | null;
    /** Lower median child, otherwise null at a leaf. */
    left: INode | null;
    /** Upper median child, otherwise null at a leaf. */
    right: INode | null;
  }

  /** Partition triangle centroids along the longest enclosure dimension. */
  function build(P: readonly number[], I: readonly number[], triangles: number[]): INode {
    const box: Box3 = new Box3();
    const point: Vector3 = new Vector3();
    for (const triangle of triangles)
      for (let corner: number = 0; corner < 3; corner++) box.expandByPoint(point.fromArray(P, 3 * I[3 * triangle + corner]!));
    if (triangles.length <= 12) return { box, triangles, left: null, right: null };
    const size: Vector3 = box.getSize(point);
    const axis: number = size.x >= size.y && size.x >= size.z ? 0 : size.y >= size.z ? 1 : 2;
    const centre: (triangle: number) => number = (triangle: number): number => P[3 * I[3 * triangle]! + axis]! + P[3 * I[3 * triangle + 1]! + axis]! + P[3 * I[3 * triangle + 2]! + axis]!;
    triangles.sort((a: number, b: number): number => centre(a) - centre(b));
    const middle: number = Math.floor(triangles.length / 2);
    return { box, triangles: null, left: build(P, I, triangles.slice(0, middle)), right: build(P, I, triangles.slice(middle)) };
  }

  /** A cap is explicit geometry for classification, never an inferred tissue. */
  function cap(P: readonly number[], rim: readonly number[], tissue: readonly number[]): number[] {
    if (rim.length < 3 || new Set(rim).size !== rim.length) throw new Error("An aperture cap needs one simple boundary loop");
    const normal: Vector3 = new Vector3();
    for (let i: number = 0; i < rim.length; i++) {
      const a: Vector3 = new Vector3().fromArray(P, 3 * rim[i]!);
      const b: Vector3 = new Vector3().fromArray(P, 3 * rim[(i + 1) % rim.length]!);
      normal.x += (a.y - b.y) * (a.z + b.z);
      normal.y += (a.z - b.z) * (a.x + b.x);
      normal.z += (a.x - b.x) * (a.y + b.y);
    }
    const absolute: Vec3 = [Math.abs(normal.x), Math.abs(normal.y), Math.abs(normal.z)];
    const drop: number = absolute.indexOf(Math.max(...absolute));
    const axes: number[] = [0, 1, 2].filter((axis: number): boolean => axis !== drop);
    const contour: Vector2[] = rim.map((index: number): Vector2 => new Vector2(P[3 * index + axes[0]!]!, P[3 * index + axes[1]!]!));
    const triangles: number[][] = ShapeUtils.triangulateShape(contour, []);
    if (triangles.length !== rim.length - 2) throw new Error("The aperture projection is not a simple polygon");
    const requested: Set<string> = new Set(rim.map((index: number, i: number): string => `${Math.min(index, rim[(i + 1) % rim.length]!)}:${Math.max(index, rim[(i + 1) % rim.length]!)}`));
    const directed: Set<string> = new Set();
    for (let triangle: number = 0; triangle < tissue.length; triangle += 3)
      for (let corner: number = 0; corner < 3; corner++) {
        const a: number = tissue[triangle + corner]!;
        const b: number = tissue[triangle + (corner + 1) % 3]!;
        if (requested.has(`${Math.min(a, b)}:${Math.max(a, b)}`)) directed.add(`${a}:${b}`);
      }
    const out: number[] = triangles.flatMap((triangle: number[]): number[] => triangle.map((index: number): number => rim[index]!));
    // Earcut's orientation is independent of the tissue's directed boundary.
    const same: boolean = out.some((index: number, i: number): boolean => directed.has(`${index}:${out[3 * Math.floor(i / 3) + (i + 1) % 3]}`));
    if (same)
      for (let i: number = 0; i < out.length; i += 3) [out[i], out[i + 1]] = [out[i + 1]!, out[i]!];
    return out;
  }

  /** Refuse an undeclared opening, repeated face or non-manifold edge. */
  function closed(indices: readonly number[], count: number): void {
    const edges: Map<number, { count: number; balance: number }> = new Map();
    for (let triangle: number = 0; triangle < indices.length; triangle += 3)
      for (let corner: number = 0; corner < 3; corner++) {
        const a: number = indices[triangle + corner]!;
        const b: number = indices[triangle + (corner + 1) % 3]!;
        if (a === b || a < 0 || b < 0 || a >= count || b >= count) throw new Error("A closed volume has an invalid triangle edge");
        const key: number = Math.min(a, b) * count + Math.max(a, b);
        const edge: { count: number; balance: number } = edges.get(key) ?? { count: 0, balance: 0 };
        edge.count++;
        edge.balance += a < b ? 1 : -1;
        edges.set(key, edge);
      }
    const invalid: number = [...edges.values()].filter((edge): boolean => edge.count !== 2 || edge.balance !== 0).length;
    if (invalid > 0) throw new Error(`A closed volume has ${invalid} undeclared open or non-manifold edges`);
  }
}
