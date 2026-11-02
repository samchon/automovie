import { AutoMovieHumanNasalConstruction as N } from "./AutoMovieHumanNasalConstruction";

/** A physical alar hood, bounded by an inner rim and a facial attachment. */
export namespace AutoMovieHumanAlarAttachment {

  /** World-space Cartesian coordinates in the head construction's millimetres. */
  export type Point = N.Point;

  /** A boundary value and its derivatives in the owner's physical parameter. */
  export interface Jet {
 
    /** The physical world-space point at this boundary or intersection. */
    point: Point;
 
    /** The physical first cross derivative used to join adjacent surface spans. */
    tangent: Point;
 
    /** The physical second cross derivative, in inverse millimetres for arc-length parameters. */
    curvature: Point; 
  }

  /** Physical source geometry and numerical sampling for this construction. */
  export interface Input {

    /** The source frame locating the rim and its positive lateral direction. */
    frame: N.Frame;

    /** The shared physical aperture curve, or planar forward/lateral samples for the planar owner. */
    rim?: readonly [number, number][];

    /** Actual source aperture boundary, including all nonplanar base rise. */
    rimWorld?: readonly Point[];

    /** Optional source-curve derivatives in world coordinates. */
    rimTangents?: readonly Point[];

    /** The requested positive lateral skin extent, in source-frame millimetres. */
    outerHalfWidth: number;

    /** Actual non-nasal face boundary and derivatives, never width targets. */
    face: readonly Jet[];

    /** Cross-span subdivisions used when emitting the physical hood mesh. */
    columns?: number;
  }

  /** The connected alar skin and the geometric diagnostics needed by its consumer. */
  export interface Hood {

    /** The exact physical opening boundary copied into the generated skin. */
    inner: Point[];

    /** The outer cartilage boundary; final visibility requires assembled-skin verification. */
    crest: Point[];

    /** The separately owned posterior facial boundary of the skin patch. */
    attachment: Point[];

    /** The actual emitted vertices and triangles used by geometric observers. */
    mesh: N.Mesh;

    /** Cartilage radius derived from positive available lateral clearance, in millimetres. */
    radius: number;

    /** Normalized physical derivatives along the actual opening boundary. */
    tangents: Point[];

    /** Source normals projected perpendicular to each actual boundary tangent. */
    directors: Point[];

    /** Unit row directions from each rim toward the outer cartilage. */
    outward: Point[];

    /** Measured from every actual emitted triangle vertex in the source frame. */
    lateralSupport: number;

    /** Observed mesh support minus requested outer half-width; nonzero errors are retained. */
    lateralError: number;

    /** Cross derivatives are with respect to physical distance. */
    innerJet: Jet[];

    /** Physical cross-distance position and derivatives at the cartilage transition. */
    crestJet: Jet[];

    /** Adjacent-face cross-distance position and derivatives copied at the attachment. */
    faceJet: Jet[];

    /** Evaluate a physical cross span on its closed unit interval without flattening its row frame. */
    cross: (row: number, branch: "cartilage" | "attachment", t: number) => Point;

    /** Sorted positive ray parameters for every actual triangle intersection. */
    hits: (origin: Point, direction: Point) => number[];

    /** Return the outer ray envelope and its branch count; hidden branches remain an integration concern. */
    radial: (origin: Point, direction: Point) => {
 
    /** The physical world-space point at this boundary or intersection. */
    point?: Point;
 
    /** Number of positive surface intersections represented by the envelope query. */
    branches: number };

    /** A sufficient geometric certificate, not a measurement tolerance. */
    boundedCartilage: boolean;
  }

  /** Build the physical owner from its source boundaries; invalid clearance or degenerate frames fail explicitly. */
  export function create(input: Input): Hood {
    const count: number = input.rimWorld?.length ?? input.rim?.length ?? 0;
    if (count < 8 || input.face.length !== count || (input.rimTangents !== undefined && input.rimTangents.length !== count))
      throw new Error("The inner rim and actual face boundary need matching closed samples.");
    const rim: Point[] = input.rimWorld !== undefined ? input.rimWorld.map((p): Point => [...p])
      : input.rim!.map((p): Point => N.add(input.frame.origin, N.add(N.scale(input.frame.forward, p[0]), N.scale(input.frame.lateral, p[1]))));
    if (!rim.every((p): boolean => p.every(Number.isFinite))) throw new Error("The actual inner rim must be finite.");
    const radius: number = (input.outerHalfWidth - Math.max(...rim.map((p): number => N.dot(N.sub(p, input.frame.origin), input.frame.lateral)))) / 2;
    if (!(radius > 0)) throw new Error("The existing rim leaves no positive alar wall clearance.");
    const columns: number = input.columns ?? 32;
    if (columns < 4 || !Number.isInteger(columns)) throw new Error("Invalid surface sampling.");
    const inner: Point[] = [];
    const crest: Point[] = [];
    const innerJet: Jet[] = [];
    const crestJet: Jet[] = [];
    const normals: Point[] = [];
    const tangents: Point[] = [];
    const directors: Point[] = [];
    const controls: Point[][] = [];
    let boundedCartilage: boolean = true;
    const frame: N.Frame = input.frame;
    for (let i: number = 0; i < count; i++) {
      const point: Point = rim[i]!;
      const a: Point = rim[(i + count - 1) % count]!;
      const b: Point = rim[(i + 1) % count]!;
      const derivative: Point = input.rimTangents?.[i] ?? N.sub(b, a);
      if (!derivative.every(Number.isFinite) || !(Math.hypot(...derivative) > 0)) throw new Error("The actual rim has a degenerate tangent.");
      const along: Point = N.normalized(derivative);
      const projected: Point = N.sub(frame.normal, N.scale(along, N.dot(frame.normal, along)));
      if (!(Math.hypot(...projected) > 0)) throw new Error("The source normal is parallel to the actual rim tangent.");
      const director: Point = N.normalized(projected);
      const outward: Point = N.normalized(N.cross(along, director));
      const top: Point = N.add(point, N.scale(outward, 2 * radius));
      const end: Jet = input.face[i]!;
      const run: number = Math.hypot(...N.sub(end.point, top));
      if (!(run > 0) || ![...end.point, ...end.tangent, ...end.curvature].every(Number.isFinite))
        throw new Error("The actual facial boundary requires finite nonzero attachment spans.");
      const start: Jet = { point: top, tangent: N.scale(director, -1), curvature: N.scale(outward, -1 / radius) };
      const bezier: Point[] = [
        top,
        N.add(top, N.scale(start.tangent, run / 5)),
        N.add(top, N.add(N.scale(start.tangent, 2 * run / 5), N.scale(start.curvature, run * run / 20))),
        N.add(end.point, N.add(N.scale(end.tangent, -2 * run / 5), N.scale(end.curvature, run * run / 20))),
        N.add(end.point, N.scale(end.tangent, -run / 5)),
        end.point,
      ];
      // The convex-hull property proves the attachment does not replace the
      // outer cartilage with a larger support. The caller supplies a face
      // boundary that passes this condition; we never move it to manufacture it.
      if (bezier.some((q): boolean => N.dot(N.sub(q, top), outward) > 1e-12)) boundedCartilage = false;
      inner.push([...point]); crest.push(top); normals.push(outward); tangents.push(along); directors.push(director); controls.push(bezier);
      innerJet.push({ point: [...point], tangent: [...director], curvature: N.scale(outward, 1 / radius) });
      crestJet.push(start);
    }
    const cross = (row: number, branch: "cartilage" | "attachment", t: number): Point => {
      if (!(t >= 0 && t <= 1)) throw new Error("The physical cross span has a finite domain.");
      if (branch === "attachment") return deCasteljau(controls[row]!, t);
      if (t === 0) return [...inner[row]!];
      if (t === 1) return [...crest[row]!];
      const angle: number = Math.PI * (1 - t);
      return N.add(inner[row]!, N.add(N.scale(normals[row]!, radius * (1 + Math.cos(angle))), N.scale(directors[row]!, radius * Math.sin(angle))));
    };
    const points: Point[] = [];
    const triangles: [number, number, number][] = [];
    const stride: number = 2 * columns + 1;
    for (let row: number = 0; row < inner.length; row++) {
      for (let column: number = 0; column < stride; column++) {
        points.push(column <= columns ? cross(row, "cartilage", column / columns) : cross(row, "attachment", (column - columns) / columns));
        if (column + 1 < stride) {
          const a: number = row * stride + column;
          const b: number = ((row + 1) % inner.length) * stride + column;
          triangles.push([a, b, a + 1], [a + 1, b, b + 1]);
        }
      }
    }
    const mesh: N.Mesh = { points, triangles };
    const index: N.MeshIndex = new N.MeshIndex(mesh);
    const lateralSupport: number = Math.max(...points.map((p): number => N.dot(N.sub(p, frame.origin), frame.lateral)));
    const hits = (origin: Point, direction: Point): number[] => index.intersections(origin, direction);
    return {
      inner, crest, attachment: input.face.map((j): Point => [...j.point]), mesh, radius, tangents, directors, outward: normals, lateralSupport, lateralError: lateralSupport - input.outerHalfWidth,
      innerJet, crestJet, faceJet: input.face.map((j): Jet => ({ point: [...j.point], tangent: [...j.tangent], curvature: [...j.curvature] })),
      cross, hits, boundedCartilage,
      radial: (origin: Point, direction: Point): {
 
    /** The physical world-space point at this boundary or intersection. */
    point?: Point;
 
    /** Number of positive surface intersections represented by the envelope query. */
    branches: number } => {
        const values: number[] = hits(origin, direction);
        return { branches: values.length, point: values.length === 0 ? undefined : N.add(origin, N.scale(direction, values[values.length - 1]!)) };
      },
    };
  }
  function deCasteljau(controls: Point[], t: number): Point {
    const work: Point[] = controls.map((p): Point => [...p]);
    for (let width: number = work.length - 1; width > 0; width--)
      for (let i: number = 0; i < width; i++) work[i] = N.add(N.scale(work[i]!, 1 - t), N.scale(work[i + 1]!, t));
    return work[0]!;
  }
}
