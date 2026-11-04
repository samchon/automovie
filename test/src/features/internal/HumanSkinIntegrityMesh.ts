import type { HumanSkinIntegrity } from "./HumanSkinIntegrity";

/**
 * Analytic triangle meshes that need no generated person: the shapes the
 * integrity controls are built on, each closed, wound outward and free of
 * every defect the audit names.
 */
export namespace HumanSkinIntegrityMesh {
  /** A mesh from flat arrays, every triangle in one chain named `control`. */
  export function from(name: string, P: number[], I: number[]): HumanSkinIntegrity.IMesh {
    return { name, P: Float64Array.from(P), I: Uint32Array.from(I), tri: new Int32Array(I.length / 3), chains: ["control"] };
  }

  /** A mesh with positions and triangles appended to a base mesh's. */
  export function extend(base: HumanSkinIntegrity.IMesh, P: number[], I: number[]): HumanSkinIntegrity.IMesh {
    return from(base.name, [...base.P, ...P], [...base.I, ...I]);
  }

  /** The regular octahedron with vertices at 100 mm on each axis, wound outward. */
  export function octahedron(): HumanSkinIntegrity.IMesh {
    const P: number[] = [100, 0, 0, -100, 0, 0, 0, 100, 0, 0, -100, 0, 0, 0, 100, 0, 0, -100];
    const I: number[] = [];

    // One face for each choice of a vertex on x, on y and on z; the parity of the choice orients it outward.
    for (const x of [0, 1])
      for (const y of [2, 3])
        for (const z of [4, 5]) {
          const even: boolean = (x + y + z) % 2 === 0;

          I.push(x, ...(even ? [y, z] : [z, y]));
        }

    return from("octahedron", P, I);
  }

  /** An icosahedron subdivided `level` times onto a sphere, wound outward. */
  export function icosphere(level: number, radius: number, centre: [number, number, number]): HumanSkinIntegrity.IMesh {
    // The icosahedron's twelve vertices on the unit sphere and its twenty faces.
    const golden: number = (1 + Math.sqrt(5)) / 2;
    const P: number[][] = [
      [-1, golden, 0], [1, golden, 0], [-1, -golden, 0], [1, -golden, 0],
      [0, -1, golden], [0, 1, golden], [0, -1, -golden], [0, 1, -golden],
      [golden, 0, -1], [golden, 0, 1], [-golden, 0, -1], [-golden, 0, 1],
    ].map((p: number[]): number[] => p.map((c: number): number => c / Math.hypot(...p)));
    let F: number[][] = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];

    // Each round splits every face in four at its edge midpoints, pushed out to the sphere.
    for (let l: number = 0; l < level; l++) {
      const middle: Map<string, number> = new Map();

      // The vertex at the pushed-out midpoint of an edge, made once however many faces share the edge.
      function mid(a: number, b: number): number {
        const key: string = `${Math.min(a, b)},${Math.max(a, b)}`;
        const found: number | undefined = middle.get(key);

        if (found !== undefined) return found;

        const m: number[] = [0, 1, 2].map((k: number): number => (P[a]![k]! + P[b]![k]!) / 2);
        const length: number = Math.hypot(...m);

        P.push(m.map((c: number): number => c / length));
        middle.set(key, P.length - 1);

        return P.length - 1;
      }

      F = F.flatMap(([a, b, c]: number[]): number[][] => {
        const ab: number = mid(a!, b!);
        const bc: number = mid(b!, c!);
        const ca: number = mid(c!, a!);

        return [[a!, ab, ca], [b!, bc, ab], [c!, ca, bc], [ab, bc, ca]];
      });
    }

    return from(
      "sphere",
      P.flatMap((p: number[]): number[] => p.map((c: number, k: number): number => centre[k]! + radius * c)),
      F.flat(),
    );
  }
}
