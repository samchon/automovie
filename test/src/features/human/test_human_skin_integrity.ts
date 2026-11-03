import { HumanPeople } from "../internal/HumanPeople";
import { HumanSkinIntegrity } from "../internal/HumanSkinIntegrity";

/**
 * Every person's bind skin is one closed, consistently outward, two-manifold
 * surface that nowhere passes through itself.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's bind skin and tests every pair of its triangles whose boxes meet, through a bounding volume hierarchy, for a crossing: an edge of one passing strictly through the other's interior; where edges meet edges exactly, the two triangles overlapping along their planes' common line; or two triangles in one plane overlapping. Pairs sharing an edge are skipped; pairs sharing a vertex are tested, so skin folded through a shared vertex is caught. It reads the whole mesh for edges used by more than two triangles, vertices where two sheets meet at a point, boundary loops other than the openings the body declares open, edges two neighbours wind the same way, patches whose normals face into the body by ray parity, triangles without area or too thin to keep their orientation in single precision, triangles repeated on the same vertices, positions no triangle uses, and non-finite or out-of-range data. Findings are grouped into connected patches and the test fails once with every patch by person, chain region and kind, with its triangle count, area and a point on it. It catches skin that passes through itself where two parts meet, a pushed-in or folded patch, holes, flipped or doubled triangles, fins and bowties. Any shape passes that is a closed, outward, non-crossing surface ending only at its declared open margins.
 * @evidence contracts/testing.md#independent-expectations What a closed skin is fixes every limit: two sheets of one skin do not pass through each other, every edge of a closed two-manifold has two triangles winding it oppositely, its outward normals see an even number of crossings to infinity, and it ends only where the body declares an open margin: an aperture without a closing pocket, whose boundary must wind once round the aperture's own axis within its margin's radius. Each margin is evaluated from the aperture's published harmonic series. Orientation predicates carry Shewchuk's floating-point error bounds, so contact within rounding is not a crossing, and an overlap along the planes' common line must exceed a billionth of the coordinates, far above double rounding and far below any modelled feature; a triangle is zero-area when its edge cross product lies within its rounding error, and a needle when its least altitude is within twice the displacement single-precision rounding gives a vertex, the precision a renderer draws in. No limit comes from the figure. The analytic controls below are each made red with exact counts: two crossing triangles give one pair, triangles whose edges pass exactly through each other's edges one pair, a fold through a shared vertex one pair, a flipped triangle three inconsistent edges and one inverted triangle, a doubled triangle one duplicate and three non-manifold edges, a fin one non-manifold edge and an open two-edge boundary, a removed triangle a three-edge hole, a pinched pair of octahedra one non-manifold vertex, a sliver one zero-area and an offset sliver one needle triangle, an extra position one unreferenced vertex; a cap pushed through a sphere, askew or along a mirror axis where every band edge meets a far edge exactly, gives one crossing patch whose pairs equal the exhaustive all-pairs count. On a copy of f1, each made defect adds exactly its own patch and leaves the twenty others unchanged: the 105 vertices within 30 mm of the belly pushed 400 mm back through the trunk add one trunk crossing of 284 triangles and 282 pairs, a flipped triangle three inconsistent edges and one inverted triangle, a doubled triangle a duplicate and three non-manifold edges, a fin one non-manifold edge and a two-edge open boundary. The four private reference bodies are not subjects here: their head parts hold mouth, eye and lash pieces that cross each other, lash cards that end as open boundaries, and contact at the axillae, so they read 41, 52, 42 and 38 crossing patches. Outside the head they show only small axilla contacts, two mirror-image patches on f2 (26 triangles each) and on m1 (5 each), and none on f1 or m2; the generated people's crossings at the ears, toes and left axilla are therefore not the observer's strictness. Oracle limits: a crossing within rounding of touching is missed, ray parity can misread a patch whose rays all leave through an opening, and an inside-out patch that is also crossed is reported as both.
 * @evidence contracts/testing.md#distinguishing-cases The controls hold the boundary cases: a clean subdivided sphere and octahedron, also far from the origin, pass; triangles touching at a point of a face, edges meeting at a single point, sharing a vertex or an edge without crossing, parallel a nanometre apart, or adjacent in one plane do not cross; a declared opening's margin passes and the same hole undeclared fails. All nine people at the bind, f1, f2, m1, m2 and the tall, short, wide, narrow and masculine people, so both ends of every length and breadth are read. `test_human_skin_integrity_posed` owns the same crossings under every pose, the pose test owns depth, stretch and folds under a pose, and the raw geometry tests own buffer finiteness against saved outputs.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_skin_integrity`, reading the cached people in process on the CPU with no renderer, browser or GPU; the controls are built in the test.
 */
export const test_human_skin_integrity = (): void => {
  const failures: string[] = controls();
  const findings: HumanSkinIntegrity.IFinding[] = [];
  for (const name of HumanPeople.names()) {
    try {
      findings.push(...HumanSkinIntegrity.person(name));
    } catch (error) {
      failures.push(`${name} could not be audited: ${(error as Error).message}`);
    }
  }
  const lines: string[] = [...failures, ...HumanSkinIntegrity.sort(findings).map(HumanSkinIntegrity.format)];
  if (lines.length)
    throw new Error(
      `${findings.length} skin integrity findings and ${failures.length} control or audit failures:\n${lines.join("\n")}`,
    );
};

/** What a control must report: each kind's patch count and, where fixed, the patch's size. */
interface IExpected {
  kind: HumanSkinIntegrity.Kind;
  triangles?: number;
  edges?: number;
  vertices?: number;
  pairs?: number;
}

/** Every analytic control's mismatch, empty when all hold. */
function controls(): string[] {
  const out: string[] = [];
  const check = (
    name: string,
    found: HumanSkinIntegrity.IFinding[],
    expected: IExpected[],
  ): void => {
    const left: HumanSkinIntegrity.IFinding[] = [...found];
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
    for (const f of left) out.push(`control ${name}: unexpected ${HumanSkinIntegrity.format(f)}`);
  };
  const audit = (mesh: HumanSkinIntegrity.IMesh, openings: HumanSkinIntegrity.IOpening[] = []): HumanSkinIntegrity.IFinding[] =>
    HumanSkinIntegrity.audit(mesh, openings);

  // Green shapes.
  const sphere: HumanSkinIntegrity.IMesh = icosphere(3, 100, [0, 0, 0]);
  check("sphere", audit(sphere), []);
  check("sphere at 2 m", audit(icosphere(3, 100, [1500, 1200, -800])), []);
  check("octahedron", audit(octahedron()), []);

  // Pairs.
  const pair = (name: string, P: number[], I: number[], expected: IExpected[]): void =>
    check(name, HumanSkinIntegrity.intersections(mesh(name, P, I)), expected);
  pair("crossing triangles", [0, 0, 0, 4, 0, 0, 0, 4, 0, 1, 1, -1, 1, 1, 1, 3, 3, 0.5], [0, 1, 2, 3, 4, 5], [
    { kind: "self-intersection", triangles: 2, pairs: 1 },
  ]);
  pair("vertex touching a face", [0, 0, 0, 4, 0, 0, 0, 4, 0, 1, 1, 0, 1, 1, 2, 2, 1, 2], [0, 1, 2, 3, 4, 5], []);
  pair("parallel a nanometre apart", [0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 1e-6, 4, 0, 1e-6, 0, 4, 1e-6], [0, 1, 2, 3, 4, 5], []);
  pair("fold through a shared vertex", [0, 0, 0, 4, 0, 0, 0, 4, 0, 1, 1, -1, 1, 1, 1], [0, 1, 2, 0, 3, 4], [
    { kind: "self-intersection", triangles: 2, pairs: 1 },
  ]);
  pair("edges through edges", [0, 0, 0, 4, 0, 0, 0, 4, 0, 2, 2, -1, 2, 2, 1, -2, -2, 0], [0, 1, 2, 3, 4, 5], [
    { kind: "self-intersection", triangles: 2, pairs: 1 },
  ]);
  pair("edges meeting at a point", [0, 0, 0, 4, 0, 0, 0, 4, 0, 2, 2, -1, 2, 2, 1, 6, 6, 0], [0, 1, 2, 3, 4, 5], []);
  pair("shared vertex apart", [0, 0, 0, 4, 0, 0, 0, 4, 0, -1, -1, -1, -1, -1, 1], [0, 1, 2, 0, 3, 4], []);
  pair("shared edge at a right angle", [0, 0, 0, 4, 0, 0, 0, 4, 0, 0, 0, 4], [0, 1, 2, 1, 0, 3], []);
  pair("coplanar overlap", [0, 0, 0, 4, 0, 0, 0, 4, 0, 1, 1, 0, 5, 1, 0, 1, 5, 0], [0, 1, 2, 3, 4, 5], [
    { kind: "self-intersection", triangles: 2, pairs: 1 },
  ]);
  pair("coplanar neighbours", [0, 0, 0, 4, 0, 0, 0, 4, 0, -4, 0, 0, 0, -4, 0], [0, 1, 2, 0, 3, 4], []);

  // Made defects on the sphere.
  const T: number = sphere.I.length / 3;
  const flipped: Uint32Array = sphere.I.slice();
  [flipped[1], flipped[2]] = [flipped[2]!, flipped[1]!];
  check("flipped triangle", audit({ ...sphere, I: flipped }), [
    { kind: "inconsistent winding", edges: 3 },
    { kind: "inverted", triangles: 1 },
  ]);
  const inside: Uint32Array = sphere.I.slice();
  for (let t: number = 0; t < T; t++) [inside[3 * t + 1], inside[3 * t + 2]] = [inside[3 * t + 2]!, inside[3 * t + 1]!];
  check("inside-out sphere", audit({ ...sphere, I: inside }), [{ kind: "inverted", triangles: T }]);
  check("duplicated triangle", audit(extend(sphere, [], [sphere.I[0]!, sphere.I[1]!, sphere.I[2]!])), [
    { kind: "duplicate triangle", triangles: 2 },
    { kind: "non-manifold edge", edges: 3 },
  ]);
  {
    const a: number = sphere.I[0]!;
    const b: number = sphere.I[1]!;
    const apex: number[] = [0, 1, 2].map((k: number): number => 1.1 * (sphere.P[3 * a + k]! + sphere.P[3 * b + k]!) / 2);
    check("fin on an edge", audit(extend(sphere, apex, [b, a, sphere.P.length / 3])), [
      { kind: "non-manifold edge", edges: 1, triangles: 3 },
      { kind: "open boundary", edges: 2 },
    ]);
  }
  check("removed triangle", audit({ ...sphere, I: sphere.I.slice(3), tri: sphere.tri.slice(1) }), [
    { kind: "open boundary", edges: 3, triangles: 3 },
  ]);
  check("extra position", audit(extend(sphere, [0, 0, 0], [])), [{ kind: "unreferenced vertex", vertices: 1 }]);
  {
    // The fan round one vertex removed: an opening there passes, one declared
    // at the opposite pole does not, and the centre is left unused either way.
    const v: number = sphere.I[0]!;
    const keep: number[] = [];
    for (let t: number = 0; t < T; t++)
      if (sphere.I[3 * t] !== v && sphere.I[3 * t + 1] !== v && sphere.I[3 * t + 2] !== v) keep.push(t);
    const holed: HumanSkinIntegrity.IMesh = {
      ...sphere,
      I: Uint32Array.from(keep.flatMap((t: number): number[] => [sphere.I[3 * t]!, sphere.I[3 * t + 1]!, sphere.I[3 * t + 2]!])),
      tri: new Int32Array(keep.length),
    };
    const c: [number, number, number] = [sphere.P[3 * v]!, sphere.P[3 * v + 1]!, sphere.P[3 * v + 2]!];
    const r: number = Math.hypot(...c);
    const opening = (sign: number): HumanSkinIntegrity.IOpening => ({
      name: "control",
      centre: [sign * c[0], sign * c[1], sign * c[2]],
      forward: [(sign * c[0]) / r, (sign * c[1]) / r, (sign * c[2]) / r],
      radius: 0.2 * r,
    });
    check("declared opening", audit(holed, [opening(1)]), [{ kind: "unreferenced vertex", vertices: 1 }]);
    check("undeclared opening", audit(holed, [opening(-1)]), [
      { kind: "unreferenced vertex", vertices: 1 },
      { kind: "open boundary", edges: 5 },
    ]);
  }
  {
    // Two octahedra sharing one vertex, which joins two sheets at a point.
    const o: HumanSkinIntegrity.IMesh = octahedron();
    const P: number[] = [...o.P];
    const I: number[] = [...o.I];
    const map: number[] = [0, 1, 2, 3, 4, 5].map((v: number): number => {
      if (v === 1) return 0;
      P.push(o.P[3 * v]! + 200, o.P[3 * v + 1]!, o.P[3 * v + 2]!);
      return P.length / 3 - 1;
    });
    for (const v of o.I) I.push(map[v]!);
    check("pinched octahedra", audit(mesh("pinched", P, I)), [{ kind: "non-manifold vertex", vertices: 1 }]);
  }
  {
    // A sliver on the octahedron's edge from +X to +Y: its third vertex at the
    // exact midpoint has no area, and lifted a micrometre it is a needle.
    for (const [name, lift, kind] of [
      ["zero-area sliver", 0, "zero-area triangle"],
      ["needle sliver", 1e-6, "needle triangle"],
    ] as [string, number, HumanSkinIntegrity.Kind][]) {
      const o: HumanSkinIntegrity.IMesh = octahedron();
      const P: number[] = [...o.P, 50, 50, lift];
      const m: number = 6;
      const I: number[] = [];
      for (let t: number = 0; t < o.I.length / 3; t++) {
        const f: number[] = [o.I[3 * t]!, o.I[3 * t + 1]!, o.I[3 * t + 2]!];
        const k: number = [0, 1, 2].findIndex((j: number): boolean => f[j] === 0 && f[(j + 1) % 3] === 2);
        if (k < 0) {
          I.push(...f);
          continue;
        }
        const c: number = f[(k + 2) % 3]!;
        I.push(0, m, c, m, 2, c, 0, 2, m);
        // The neighbour across the edge keeps the edge; the sliver closes it.
      }
      // The sliver's own edges: 0-2 shared with the neighbour, 0-m and m-2 with the split face.
      check(name, audit(mesh(name, P, I)), [{ kind, triangles: 1 }]);
    }
  }
  // A cap of the sphere pushed 210 mm back through its far side: askew, and
  // along a mirror axis, where every edge of the pushed band passes exactly
  // through an edge of the far side.
  for (const [name, push] of [
    ["pushed-in cap", [-205.4, 27.3, 14.7]],
    ["pushed-in cap along a mirror axis", [-210, 0, 0]],
  ] as [string, number[]][]) {
    const P: Float64Array = sphere.P.slice();
    for (let v: number = 0; v < P.length / 3; v++)
      if (P[3 * v]! > 100 * Math.cos((25 * Math.PI) / 180))
        for (let k: number = 0; k < 3; k++) P[3 * v + k] = P[3 * v + k]! + push[k]!;
    const pushed: HumanSkinIntegrity.IMesh = { ...sphere, P };
    const exhaustive: number = HumanSkinIntegrity.pairs(pushed, true).length;
    check(name, audit(pushed), [{ kind: "self-intersection", pairs: exhaustive }]);
    if (exhaustive === 0) out.push(`control ${name}: the exhaustive search found no crossing`);
  }
  return out;
}

/** A mesh from flat arrays, every triangle in one chain. */
function mesh(name: string, P: number[], I: number[]): HumanSkinIntegrity.IMesh {
  return { name, P: Float64Array.from(P), I: Uint32Array.from(I), tri: new Int32Array(I.length / 3), chains: ["control"] };
}

/** A mesh with positions and triangles appended. */
function extend(base: HumanSkinIntegrity.IMesh, P: number[], I: number[]): HumanSkinIntegrity.IMesh {
  return mesh(base.name, [...base.P, ...P], [...base.I, ...I]);
}

/** The regular octahedron with vertices at 100 mm on each axis, wound outward. */
function octahedron(): HumanSkinIntegrity.IMesh {
  const P: number[] = [100, 0, 0, -100, 0, 0, 0, 100, 0, 0, -100, 0, 0, 0, 100, 0, 0, -100];
  const I: number[] = [];
  for (const x of [0, 1])
    for (const y of [2, 3])
      for (const z of [4, 5]) {
        const odd: boolean = (x + y + z) % 2 === 0;
        I.push(x, ...(odd ? [y, z] : [z, y]));
      }
  return mesh("octahedron", P, I);
}

/** An icosahedron subdivided `level` times onto a sphere, wound outward. */
function icosphere(level: number, radius: number, centre: [number, number, number]): HumanSkinIntegrity.IMesh {
  const g: number = (1 + Math.sqrt(5)) / 2;
  const P: number[][] = [
    [-1, g, 0], [1, g, 0], [-1, -g, 0], [1, -g, 0],
    [0, -1, g], [0, 1, g], [0, -1, -g], [0, 1, -g],
    [g, 0, -1], [g, 0, 1], [-g, 0, -1], [-g, 0, 1],
  ].map((p: number[]): number[] => p.map((c: number): number => c / Math.hypot(...p)));
  let F: number[][] = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];
  for (let l: number = 0; l < level; l++) {
    const middle: Map<string, number> = new Map();
    const mid = (a: number, b: number): number => {
      const key: string = `${Math.min(a, b)},${Math.max(a, b)}`;
      const found: number | undefined = middle.get(key);
      if (found !== undefined) return found;
      const m: number[] = [0, 1, 2].map((k: number): number => (P[a]![k]! + P[b]![k]!) / 2);
      const len: number = Math.hypot(...m);
      P.push(m.map((c: number): number => c / len));
      middle.set(key, P.length - 1);
      return P.length - 1;
    };
    F = F.flatMap(([a, b, c]: number[]): number[][] => {
      const ab: number = mid(a!, b!);
      const bc: number = mid(b!, c!);
      const ca: number = mid(c!, a!);
      return [[a!, ab, ca], [b!, bc, ab], [c!, ca, bc], [ab, bc, ca]];
    });
  }
  return mesh(
    "sphere",
    P.flatMap((p: number[]): number[] => p.map((c: number, k: number): number => centre[k]! + radius * c)),
    F.flat(),
  );
}
