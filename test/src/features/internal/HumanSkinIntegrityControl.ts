import { HumanSkinIntegrity } from "./HumanSkinIntegrity";
import { HumanSkinIntegrityMesh as Mesh } from "./HumanSkinIntegrityMesh";

/**
 * The analytic controls of the integrity audit: shapes whose defects are
 * known exactly, each audited and compared with the findings it must give,
 * kind by kind and count by count. A clean shape must give none; a made
 * defect must give exactly its own.
 */
export namespace HumanSkinIntegrityControl {
  /** What a control must report: a finding of a kind and, where fixed, its size. */
  interface IExpected {
    /** Kind of the finding. */
    kind: HumanSkinIntegrity.Kind;

    /** Triangles in its patch. */
    triangles?: number;

    /** Edges in its patch. */
    edges?: number;

    /** Vertices in its patch. */
    vertices?: number;

    /** Crossing pairs in its patch. */
    pairs?: number;
  }

  /** The sphere the made defects are cut into: level 3 is 1,280 triangles of radius 100 mm. */
  const SPHERE: HumanSkinIntegrity.IMesh = Mesh.icosphere(3, 100, [0, 0, 0]);

  /** Every control's mismatch, empty when all hold. */
  export function run(): string[] {
    const out: string[] = [];

    clean(out);
    touching(out);
    crossing(out);
    topology(out);
    openings(out);
    slivers(out);

    return out;
  }

  /** Compares the findings of a shape with the ones it must give, and records each mismatch. */
  function check(out: string[], name: string, found: HumanSkinIntegrity.IFinding[], expected: IExpected[]): void {
    const left: HumanSkinIntegrity.IFinding[] = [...found];

    // Every expected finding must be present, matched once.
    for (const e of expected) {
      const k: number = left.findIndex(
        (f: HumanSkinIntegrity.IFinding): boolean =>
          f.kind === e.kind &&
          (e.triangles === undefined || f.triangles === e.triangles) &&
          (e.edges === undefined || f.edges === e.edges) &&
          (e.vertices === undefined || f.vertices === e.vertices) &&
          (e.pairs === undefined || f.pairs === e.pairs),
      );

      if (k < 0) out.push(`control ${name}: expected ${JSON.stringify(e)}, not found`);
      else left.splice(k, 1);
    }

    // And nothing else may be.
    for (const f of left) out.push(`control ${name}: unexpected ${HumanSkinIntegrity.format(f)}`);
  }

  /** Audits a shape with no declared opening unless given. */
  function audit(mesh: HumanSkinIntegrity.IMesh, openings: HumanSkinIntegrity.IOpening[] = []): HumanSkinIntegrity.IFinding[] {
    return HumanSkinIntegrity.audit(mesh, openings);
  }

  /**
   * Checks only the crossings of a pair of triangles given by their
   * positions: six positions are two apart triangles, five share the first
   * triangle's first corner, four share its first edge.
   */
  function pair(out: string[], name: string, P: number[], expected: IExpected[]): void {
    const corners: number = P.length / 3;
    const I: number[] = corners === 5 ? [0, 1, 2, 0, 3, 4] : corners === 4 ? [0, 1, 2, 1, 0, 3] : [0, 1, 2, 3, 4, 5];

    check(out, name, HumanSkinIntegrity.intersections(Mesh.from(name, P, I)), expected);
  }

  /** Clean closed shapes, near and far from the origin, give no finding. */
  function clean(out: string[]): void {
    check(out, "sphere", audit(SPHERE), []);
    check(out, "sphere at 2 m", audit(Mesh.icosphere(3, 100, [1500, 1200, -800])), []);
    check(out, "octahedron", audit(Mesh.octahedron()), []);
  }

  /** Triangles that touch without crossing give none, and ones that do give one pair each. */
  function touching(out: string[]): void {
    const one: IExpected[] = [{ kind: "self-intersection", triangles: 2, pairs: 1 }];

    pair(out, "vertex touching a face", [0, 0, 0, 4, 0, 0, 0, 4, 0, 1, 1, 0, 1, 1, 2, 2, 1, 2], []);
    pair(out, "parallel a nanometre apart", [0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 1e-6, 4, 0, 1e-6, 0, 4, 1e-6], []);
    pair(out, "edges meeting at a point", [0, 0, 0, 4, 0, 0, 0, 4, 0, 2, 2, -1, 2, 2, 1, 6, 6, 0], []);
    pair(out, "shared vertex apart", [0, 0, 0, 4, 0, 0, 0, 4, 0, -1, -1, -1, -1, -1, 1], []);
    pair(out, "shared edge at a right angle", [0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4], []);
    pair(out, "coplanar neighbours", [0, 0, 0, 4, 0, 0, 0, 4, 0, -4, 0, 0, 0, -4, 0], []);
    pair(out, "crossing triangles", [0, 0, 0, 4, 0, 0, 0, 4, 0, 1, 1, -1, 1, 1, 1, 3, 3, 0.5], one);
    pair(out, "fold through a shared vertex", [0, 0, 0, 4, 0, 0, 0, 4, 0, 1, 1, -1, 1, 1, 1], one);
    pair(out, "edges through edges", [0, 0, 0, 4, 0, 0, 0, 4, 0, 2, 2, -1, 2, 2, 1, -2, -2, 0], one);
    pair(out, "coplanar overlap", [0, 0, 0, 4, 0, 0, 0, 4, 0, 1, 1, 0, 5, 1, 0, 1, 5, 0], one);
  }

  /** A pushed-in cap crosses the sphere, askew and along a mirror axis, as often as an exhaustive search finds. */
  function crossing(out: string[]): void {
    // Along a mirror axis every edge of the pushed band passes exactly through an edge of the far side.
    const caps: [string, number[]][] = [
      ["pushed-in cap", [-205.4, 27.3, 14.7]],
      ["pushed-in cap along a mirror axis", [-210, 0, 0]],
    ];

    for (const [name, push] of caps) {
      // Every vertex of the cap, the part of the sphere within 25 degrees of +X, moves by the push.
      const P: Float64Array = SPHERE.P.slice();

      for (let v: number = 0; v < P.length / 3; v++)
        if (P[3 * v]! > 100 * Math.cos((25 * Math.PI) / 180))
          for (let k: number = 0; k < 3; k++) P[3 * v + k] = P[3 * v + k]! + push[k]!;

      const pushed: HumanSkinIntegrity.IMesh = { ...SPHERE, P };
      const exhaustive: number = HumanSkinIntegrity.pairs(pushed, true).length;

      check(out, name, audit(pushed), [{ kind: "self-intersection", pairs: exhaustive }]);

      if (exhaustive === 0) out.push(`control ${name}: the exhaustive search found no crossing`);
    }
  }

  /** Flipped, doubled, finned, removed, loose and pinched parts each give exactly their own finding. */
  function topology(out: string[]): void {
    const T: number = SPHERE.I.length / 3;

    // One triangle turned over: its three edges wind the same way as their neighbours', and it faces in.
    const flipped: Uint32Array = SPHERE.I.slice();

    [flipped[1], flipped[2]] = [flipped[2]!, flipped[1]!];
    check(out, "flipped triangle", audit({ ...SPHERE, I: flipped }), [
      { kind: "inconsistent winding", edges: 3 },
      { kind: "inverted", triangles: 1 },
    ]);

    // Every triangle turned over: one consistent sheet facing in.
    const inside: Uint32Array = SPHERE.I.slice();

    for (let t: number = 0; t < T; t++) [inside[3 * t + 1], inside[3 * t + 2]] = [inside[3 * t + 2]!, inside[3 * t + 1]!];

    check(out, "inside-out sphere", audit({ ...SPHERE, I: inside }), [{ kind: "inverted", triangles: T }]);

    // A triangle twice: a duplicate, and its three edges used four times in all.
    const first: number[] = [SPHERE.I[0]!, SPHERE.I[1]!, SPHERE.I[2]!];

    check(out, "duplicated triangle", audit(Mesh.extend(SPHERE, [], first)), [
      { kind: "duplicate triangle", triangles: 2 },
      { kind: "non-manifold edge", edges: 3 },
    ]);

    // A fin: one more triangle on an edge that already has two, over a new apex.
    const a: number = SPHERE.I[0]!;
    const b: number = SPHERE.I[1]!;
    const apex: number[] = [0, 1, 2].map((k: number): number => (1.1 * (SPHERE.P[3 * a + k]! + SPHERE.P[3 * b + k]!)) / 2);

    check(out, "fin on an edge", audit(Mesh.extend(SPHERE, apex, [b, a, SPHERE.P.length / 3])), [
      { kind: "non-manifold edge", edges: 1, triangles: 3 },
      { kind: "open boundary", edges: 2 },
    ]);

    // A triangle removed leaves a three-edge hole; a position nothing uses is a loose vertex.
    check(out, "removed triangle", audit({ ...SPHERE, I: SPHERE.I.slice(3), tri: SPHERE.tri.slice(1) }), [
      { kind: "open boundary", edges: 3, triangles: 3 },
    ]);
    check(out, "extra position", audit(Mesh.extend(SPHERE, [0, 0, 0], [])), [{ kind: "unreferenced vertex", vertices: 1 }]);

    // Two octahedra sharing one vertex join two sheets at a point.
    const o: HumanSkinIntegrity.IMesh = Mesh.octahedron();
    const P: number[] = [...o.P];
    const I: number[] = [...o.I];
    const map: number[] = [0, 1, 2, 3, 4, 5].map((v: number): number => {
      if (v === 1) return 0;

      P.push(o.P[3 * v]! + 200, o.P[3 * v + 1]!, o.P[3 * v + 2]!);

      return P.length / 3 - 1;
    });

    for (const v of o.I) I.push(map[v]!);

    // Joined only at a point, the two are also two components by shared edges.
    check(out, "pinched octahedra", audit(Mesh.from("pinched", P, I)), [
      { kind: "non-manifold vertex", vertices: 1 },
      { kind: "separate component", triangles: 8 },
    ]);
  }

  /** The fan round one vertex removed is an opening only where it is declared. */
  function openings(out: string[]): void {
    const v: number = SPHERE.I[0]!;
    const keep: number[] = [];

    for (let t: number = 0; t < SPHERE.I.length / 3; t++)
      if (SPHERE.I[3 * t] !== v && SPHERE.I[3 * t + 1] !== v && SPHERE.I[3 * t + 2] !== v) keep.push(t);

    const holed: HumanSkinIntegrity.IMesh = {
      ...SPHERE,
      I: Uint32Array.from(keep.flatMap((t: number): number[] => [SPHERE.I[3 * t]!, SPHERE.I[3 * t + 1]!, SPHERE.I[3 * t + 2]!])),
      tri: new Int32Array(keep.length),
    };

    // The opening at the hole passes; the same at the opposite pole does not, and the removed vertex stays unused either way.
    const c: [number, number, number] = [SPHERE.P[3 * v]!, SPHERE.P[3 * v + 1]!, SPHERE.P[3 * v + 2]!];
    const r: number = Math.hypot(...c);

    function opening(sign: number): HumanSkinIntegrity.IOpening {
      return {
        name: "control",
        centre: [sign * c[0], sign * c[1], sign * c[2]],
        forward: [(sign * c[0]) / r, (sign * c[1]) / r, (sign * c[2]) / r],
        radius: 0.2 * r,
      };
    }

    check(out, "declared opening", audit(holed, [opening(1)]), [{ kind: "unreferenced vertex", vertices: 1 }]);
    check(out, "undeclared opening", audit(holed, [opening(-1)]), [
      { kind: "unreferenced vertex", vertices: 1 },
      { kind: "open boundary", edges: 5 },
    ]);
  }

  /** A third vertex at the midpoint of an octahedron edge has no area, and lifted a micrometre it is a needle. */
  function slivers(out: string[]): void {
    const cases: [string, number, HumanSkinIntegrity.Kind][] = [
      ["zero-area sliver", 0, "zero-area triangle"],
      ["needle sliver", 1e-6, "needle triangle"],
    ];

    for (const [name, lift, kind] of cases) {
      // The edge from +X (0) to +Y (2) is split at the new vertex; the sliver closes the old edge.
      const o: HumanSkinIntegrity.IMesh = Mesh.octahedron();
      const P: number[] = [...o.P, 50, 50, lift];
      const mid: number = 6;
      const I: number[] = [];

      for (let t: number = 0; t < o.I.length / 3; t++) {
        const f: number[] = [o.I[3 * t]!, o.I[3 * t + 1]!, o.I[3 * t + 2]!];
        const k: number = [0, 1, 2].findIndex((j: number): boolean => f[j] === 0 && f[(j + 1) % 3] === 2);

        if (k < 0) {
          I.push(...f);
          continue;
        }

        const c: number = f[(k + 2) % 3]!;

        I.push(0, mid, c, mid, 2, c, 0, 2, mid);
      }

      check(out, name, audit(Mesh.from(name, P, I)), [{ kind, triangles: 1 }]);
    }
  }
}
