import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanLayerBasis } from "../../../internal/reference/layers/HumanLayerBasis";
import { HumanLayerBasisSingleton } from "../../../internal/reference/layers/HumanLayerBasisSingleton";
import { HumanLayerCompare } from "../../../internal/reference/layers/HumanLayerCompare";
import { HumanLayerFinding } from "../../../internal/HumanLayerFinding";
import { HumanLayerFold } from "../../../internal/reference/layers/HumanLayerFold";
import { HumanLayerIndex } from "../../../internal/HumanLayerIndex";
import { HumanLayerPlane } from "../../../internal/HumanLayerPlane";
import { HumanLayerPolygon } from "../../../internal/HumanLayerPolygon";
import { HumanLayerReport } from "../../../internal/reference/layers/HumanLayerReport";
import { HumanLayerSite } from "../../../internal/HumanLayerSite";
import { HumanReference } from "../../../internal/reference/bodies/HumanReference";

/** A point in space, mm. */
type V3 = HumanAnatomy.V3;

/** A point in a section's plane, mm. */
type V2 = [number, number];

/** The shared vector helpers, by a short name. */
const A: typeof HumanAnatomy = HumanAnatomy;

/** The shared polygon helpers, by a short name. */
const G: typeof HumanLayerPolygon = HumanLayerPolygon;

/** What every proof on one person reads. */
interface IProof {
  /** The reference alias. */
  id: string;

  /** The generated person's layers. */
  sites: HumanLayerSite.ISite[];

  /** The reference mesh. */
  mesh: HumanReference.IMesh;

  /** The reference mesh, indexed. */
  reference: HumanLayerIndex;

  /** The reference's population and survey sex. */
  basis: HumanLayerBasis.IBasis;

  /** The reference compared with itself. */
  self: HumanLayerReport.IReport;

  /** The generated bind skin. */
  skin: HumanAnatomy.ISkin;
}

/** One layer's comparison with its findings. */
interface IRead {
  /** The layer. */
  layer: HumanLayerReport.ILayer;

  /** Its findings. */
  findings: HumanLayerFinding.IFinding[];
}

/**
 * Pins that every generated reference person's skin, cut at the plane of each
 * of its own loft layers, stays within the range real bodies take at that
 * section of its private reference body cut in the same plane: only gross
 * departures fail.
 *
 * Scenarios:
 * 1. The reference compared with itself gives no finding and zero deviation.
 * 2. A radial bump of known size over known phases at a left-arm layer reads that size outside at that layer and phase; a dent at a right-leg layer reads inside.
 * 3. A 5 mm in-plane shift of a trunk section reads a 5.000 mm centroid shift along it; a 5 % in-plane scale reads a perimeter ratio of 1.050.
 * 4. An inward V of 15 degrees at the trunk section's most forward point reads the made section's own excess and is flagged exactly when it passes its margin.
 * 5. Inward Vs of 10 and 15 degrees on a straight side read excess turnings of 40 and 60 degrees.
 * 6. The generated skin moved 5 mm forward moves every horizontal trunk centroid reading by 5 mm forward.
 * 7. Each of f1, f2, m1 and m2 is read at every layer and every gross departure is listed by person, `chain/k`, phase and direction.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates f1, f2, m1 and m2 at their public inputs and, for every principal layer of every loft chain, cuts the generated bind skin and the private reference mesh by the layer's plane (its frame, else horizontal at its station) by `HumanLayerCompare.compare`. The generated loop is the closed section nearest the layer's ring and the reference loop the closed section nearest the generated loop; when another loop of either side lies inside the other's chosen loop and not its own (a split thigh pair, an arm touching the trunk), the layer is counted as topology and not compared; where no generated loop follows the layer's ring (mean distance beyond a quarter of the ring's reach plus 1 mm) the plane names no section of the chain, the layer is counted as missing and the disagreement is `test_human_layer_composition`'s; a pole, an open section (an ear's shell, a cut the ball truncates) is counted likewise. Readings per layer: perimeter and taut-tape girth, area, centroid shift, and at every 2 mm of the generated loop (96 samples at least) the signed in-plane distance to the reference loop (outside positive), and the excess concave turning of both loops at 1 mm resampling. Samples beyond their limit join into runs, and the test fails with every run and reading, named by person, `chain/k`, the chain's own phase interval, bearing, value, limit, mean and world point (such as "f1 trunk/12 phase 40..55 deg, front-left: radius outside +12.0 mm"), with a per-chain RMS, p95 and largest fold for information. It catches a section too full, too thin, misplaced, dented, bumped or folded at a named layer and phase, which a whole-surface comparison spreads across a region.
 * @evidence contracts/testing.md#independent-expectations The layer plane only chooses where to cut and names the result; the layer's declared section is never an expected value, and the reference is an observation, not a target: a universal section may differ from it and read better, so every limit flags only a gross departure, never a residual or conditional spread, and nothing in a limit reads the generated skin. Every limit is 2.576 (two-sided 99 %) unconditional standard deviations over the population bodies as measured, neither scaled to this stature nor aligned, read at the reference's own cut edges and positions along them (the bodies share one vertex order): every body but this one, `c0` and the held-out `e3`, `e6`, or the four fitted heads for a section on head-only vertices. Radius: the spread, point by point, of each body's distance from its own section's centroid, invariant to rigid motion; a sample whose reference normal lies within 60 degrees of the plane's normal is grazed by the cut and is counted, not read. Girth, taut girth and area: the spread of the same quantity. Where the population barely varies (hands, digits, feet), each limit is floored by the nearest ANSUR 1988 measure's coefficient of variation for the person's sex (Gordon et al. 1989, `docs/sources/ansur-1988.md`, statistics in `HumanPopulation.SURVEY`: buttock, natural waist or chest by the trunk's joints, neck base, neck, head circumference, ear breadth, flexed biceps, elbow, flexed forearm, wrist, hand circumference, proximal thigh, knee, calf, foot breadth), applied at the section's own size: girth floor 2.576 CV times the reference perimeter, radius floor that over 2 pi, area floor the perimeter times the radius floor. Centroid: the arclength mean of the radius limits, since a translation by d reads as radius plus and minus d. Fold: an indicator of a gross fold only, not a match: the generated excess turning less the reference's own, against a margin of the larger of 45.2 degrees (the excess of the inward V whose sagitta over a 10 mm chord is `HumanAnatomyShared.CREASE`, 1 mm, the least that reads as a crease) and what 0.5 mm resampling adds to either loop; the population is not read for turning, since another body's points at this body's cut edges zigzag off a plane by fractions of a millimetre and that zigzag turns more than any fold. Proved in this test on every person: the reference against itself reads no finding and zero deviation; on a copy of the reference a radial bump of known size over a known phase window at a limb layer reads that size outside at that layer and phase, a dent reads inside; a 5 mm in-plane shift of the trunk section reads a 5.000 mm centroid shift along it; a 5 % in-plane scale reads a perimeter ratio of 1.050; an inward V of 15 degrees at the trunk section's most forward point reads the made section's own excess (cut by the separate slicer `HumanAnatomy.polylines`) within the two slicers' resampling difference and is flagged exactly when it passes its margin; inward Vs of 10 and 15 degrees on a straight side read 40 and 60 degrees within 0.5; and the generated skin moved 5 mm forward moves every trunk centroid reading by exactly 5 mm forward. Oracle limits: the population spans the parameter domain's ends and every stature, so trunk and limb limits are wide and a deviation there must be gross indeed; a population body read at the reference's cut edges gives a curve near, not in, a plane; a reference posed apart from the generated person (an arm at another angle) is cut obliquely and reads its pose as shape; topology layers go uncompared; only the generated loop's samples are read, so a narrow reference feature the generated loop lacks reads only at its base.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men at different statures and builds; layers horizontal and bone-framed on trunk, neck, head, limbs and digits; the proofs cover a correct section, outside, inside, shift, scale and fold defects, a 10-degree V whose 40 degrees fall under the 45.2-degree crease floor, and a known displacement of the real generated skin. Without private references the test prints that the comparison did not run and returns, since the data cannot ship; with references but fewer than 20 population bodies or without the four fitted heads, `HumanLayerBasis.build` throws instead of passing on no basis. Whole-surface departures belong to `test_human_reference_surface`, input measures at their sites to `test_human_anatomy_*`, the declared layers' agreement with the emitted skin to `test_human_layer_composition`; this test owns the reference comparison addressed by layer and phase.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_reference_layers`, reading the ignored `test/.shots` references and generating the four people in process on the CPU, with no renderer, browser or GPU.
 */
export function test_human_reference_layers(): void {
  const ids: string[] = HumanReference.available();

  if (ids.length === 0) {
    console.log("test_human_reference_layers: no private reference body in test/.shots; the layer section comparison did not run");

    return;
  }

  const lines: string[] = [];
  const info: string[] = [];

  for (const id of ids) {
    const mesh: HumanReference.IMesh = HumanReference.mesh(id);
    const views: HumanAnatomy.IViews = HumanAnatomy.views(id);
    const skin: HumanAnatomy.ISkin = views.bind();
    const reference: HumanLayerIndex = new HumanLayerIndex(mesh.P, mesh.I);
    const generated: HumanLayerIndex = new HumanLayerIndex(skin.P, skin.I);
    const sites: HumanLayerSite.ISite[] = HumanLayerSite.sites(views);
    const basis: HumanLayerBasis.IBasis = HumanLayerBasisSingleton.get(id);
    const self: HumanLayerReport.IReport = HumanLayerCompare.compare({ person: id, sites, generated: reference, reference, basis });

    info.push(prove({ id, sites, mesh, reference, basis, self, skin }));

    const report: HumanLayerReport.IReport = HumanLayerCompare.compare({ person: id, sites, generated, reference, basis });
    const status: Map<string, number> = new Map();

    for (const l of report.layers) status.set(l.status, (status.get(l.status) ?? 0) + 1);

    lines.push(...report.findings.map(HumanLayerFinding.describe));
    info.push(`${id}: ${report.layers.length} layers, ${[...status].map(([k, n]: [string, number]): string => `${n} ${k}`).join(", ")}; ${report.findings.length} findings`);
    info.push(...HumanLayerReport.summarize(report));
  }

  console.log(info.join("\n"));

  if (lines.length !== 0)
    throw new Error(`${lines.length} layer sections depart from their reference beyond the human spread:\n${lines.join("\n")}\n\nFor information:\n${info.join("\n")}`);
}

/** Every proof on one person; throws on the first that fails and returns a line of readings. */
function prove(p: IProof): string {
  const worst: number = proveSelf(p);
  const trunk: HumanLayerSite.ISite = middle(p, /^trunk$/, "trunk");
  const bump: string = proveLump(p, middle(p, /^arm\.left$/, "left arm"), 1);
  const dent: string = proveLump(p, middle(p, /^leg\.right$/, "right leg"), -1);
  const moves: { shift: number; ratio: number } = proveShiftAndScale(p, trunk);
  const fold: string = proveFold(p, trunk);
  const planar: number[] = proveStraight();
  const moved: number = proveDisplacement(p);

  return (
    `${p.id} proofs: self ${p.self.layers.length} layers, largest |radius| ${worst.toExponential(1)} mm; ${bump}; ${dent}; ` +
    `shift ${moves.shift.toFixed(3)} mm; scale ratio ${moves.ratio.toFixed(4)}; ${fold}; ` +
    `straight-side V 10 and 15 deg ${planar.map((x: number): string => x.toFixed(2)).join(" and ")} deg; skin +5 mm forward moved ${moved} trunk centroids by 5.000 mm`
  );
}

/** Green: the reference against itself reads nothing; returns its largest in-plane deviation. */
function proveSelf(p: IProof): number {
  let worst: number = 0;
  let worstGirth: number = 0;

  for (const l of p.self.layers) {
    for (const r of l.radial) worst = Math.max(worst, Math.abs(r));

    if (l.status === "compared") worstGirth = Math.max(worstGirth, Math.abs(l.girth));
  }

  if (p.self.findings.length !== 0 || worst > 1e-6 || worstGirth > 1e-6)
    throw new Error(`${p.id}'s reference against itself reads ${p.self.findings.length} findings, ${worst} mm, girth ${worstGirth} mm:\n${p.self.findings.slice(0, 20).map(HumanLayerFinding.describe).join("\n")}`);

  return worst;
}

/** The middle compared layer of the chains a pattern names. */
function middle(p: IProof, chain: RegExp, what: string): HumanLayerSite.ISite {
  const ok: Set<string> = new Set(
    p.self.layers.filter((l: HumanLayerReport.ILayer): boolean => l.status === "compared").map((l: HumanLayerReport.ILayer): string => `${l.chain}/${l.layer}`),
  );
  const list: HumanLayerSite.ISite[] = p.sites.filter((s: HumanLayerSite.ISite): boolean => chain.test(s.chain) && ok.has(`${s.chain}/${s.layer}`));

  if (list.length === 0) throw new Error(`${p.id} has no compared ${what} layer to prove on`);

  return list[Math.floor(list.length / 2)]!;
}

/** One layer compared with the reference, the generated skin replaced by a made copy of the reference's positions. */
function read(p: IProof, site: HumanLayerSite.ISite, P: Float64Array): IRead {
  return HumanLayerCompare.compareSite(p.id, site, new HumanLayerIndex(P, p.mesh.I), p.reference, p.basis);
}

/** Whether a point stands within a band of a layer's plane. */
function near(site: HumanLayerSite.ISite, p: V3, band: number): boolean {
  return Math.abs(A.dot(A.sub(p, site.plane.origin), site.plane.normal)) <= band;
}

/** Bearing of a point about a layer's centre in its chart, radians. */
function angle(site: HumanLayerSite.ISite, p: V3): number {
  const q: V2 = HumanLayerPlane.local(site.plane, p);
  const c: V2 = HumanLayerPlane.local(site.plane, site.centre);

  return Math.atan2(q[1] - c[1], q[0] - c[0]);
}

/** Whether an angle lies on the arc running counter-clockwise from `a` to `b`. */
function within(x: number, a: number, b: number): boolean {
  const turn: number = 2 * Math.PI;
  const t: number = (((x - a) % turn) + turn) % turn;
  const w: number = (((b - a) % turn) + turn) % turn;

  return t <= w;
}

/** Red: a radial bump or dent of known size over phases 75 to 105 degrees reads its size at that layer and phase. */
function proveLump(p: IProof, site: HumanLayerSite.ISite, sign: 1 | -1): string {
  const base: HumanLayerReport.ILayer = p.self.layers.find((l: HumanLayerReport.ILayer): boolean => l.chain === site.chain && l.layer === site.layer)!;
  const size: number = Math.max(6, 1.5 * base.limits.radius[1]);
  const kind: string = sign > 0 ? "bump" : "dent";
  let a: number = angle(site, site.ring[75 * (HumanLayerSite.PHASES / 360)]!);
  let b: number = angle(site, site.ring[105 * (HumanLayerSite.PHASES / 360)]!);

  // The window is the shorter arc between the two bearings, whichever way the phase runs.
  if (!within(b, a, a + Math.PI)) [a, b] = [b, a];

  const P: Float64Array = HumanLayerIndex.displaced(p.mesh.P, (q: V3): V3 | null =>
    near(site, q, 12) && within(angle(site, q), a, b) ? A.scale(A.unit(A.reject(A.sub(q, site.centre), site.plane.normal)), sign * size) : null,
  );
  const got: IRead = read(p, site, P);
  const hit: HumanLayerFinding.IFinding | undefined = got.findings.find(
    (f: HumanLayerFinding.IFinding): boolean => f.reading === (sign > 0 ? "radius outside" : "radius inside"),
  );

  if (
    hit === undefined ||
    !(Math.abs(hit.value) >= 0.8 * size && Math.abs(hit.value) <= size + 0.2) ||
    hit.phase === null ||
    !overlaps(hit.phase, [75, 105])
  )
    throw new Error(`${p.id}: a ${kind} of ${size.toFixed(1)} mm at ${site.chain}/${site.layer} phases 75..105 read: ${got.findings.map(HumanLayerFinding.describe).join("; ") || "nothing"}`);

  return `${site.chain}/${site.layer} ${kind} ${(sign * size).toFixed(1)} read ${hit.value.toFixed(2)} at phase ${hit.phase[0].toFixed(0)}..${hit.phase[1].toFixed(0)}`;
}

/** Red: a known shift and scale of the trunk section read their size. */
function proveShiftAndScale(p: IProof, trunk: HumanLayerSite.ISite): { shift: number; ratio: number } {
  const shiftBy: V3 = A.scale(trunk.plane.u, 5);
  const shifted: HumanLayerReport.ILayer = read(
    p,
    trunk,
    HumanLayerIndex.displaced(p.mesh.P, (q: V3): V3 | null => (near(trunk, q, 40) ? shiftBy : null)),
  ).layer;

  if (A.dist(shifted.shift, shiftBy) > 0.01)
    throw new Error(`${p.id}: a 5 mm shift at ${trunk.chain}/${trunk.layer} read ${shifted.shift.map((c: number): string => c.toFixed(3)).join(", ")}`);

  const scaled: HumanLayerReport.ILayer = read(
    p,
    trunk,
    HumanLayerIndex.displaced(p.mesh.P, (q: V3): V3 | null =>
      near(trunk, q, 40) ? A.scale(A.reject(A.sub(q, trunk.centre), trunk.plane.normal), 0.05) : null,
    ),
  ).layer;

  if (Math.abs(scaled.ratio - 1.05) > 1e-3) throw new Error(`${p.id}: a 5 % scale at ${trunk.chain}/${trunk.layer} read a perimeter ratio of ${scaled.ratio}`);

  return { shift: shifted.centroid, ratio: scaled.ratio };
}

/**
 * Red: an inward V of 15 degrees at the trunk section's most forward point.
 *
 * On a real section the V's walls meet the section's own curvature and the
 * mesh's 5 to 10 mm cut spacing, so its turning is not exactly 4 beta; the
 * reading must equal the made section's own excess, cut by the separate
 * slicer `HumanAnatomy.polylines`, less the reference's, and be flagged
 * exactly when it passes its margin.
 */
function proveFold(p: IProof, trunk: HumanLayerSite.ISite): string {
  const loop: V2[] = nearestLoop(
    p.reference.slice(trunk.plane, trunk.centre, 2 * trunk.reach + 30).filter((l: HumanLayerIndex.ILoop): boolean => l.closed && l.points.length >= 3),
    trunk,
  );
  const front: (q: V2) => number = (q: V2): number => A.dot(HumanLayerPlane.world(trunk.plane, q), [1, 0, 0]);
  const far: V2 = loop.reduce((a: V2, q: V2): V2 => (front(q) > front(a) ? q : a));
  const copy: Float64Array = vee(p, trunk, loop, project(loop, far).x, (15 * Math.PI) / 180);
  const fold: IRead = read(p, trunk, copy);
  const flagged: boolean = fold.findings.some((f: HumanLayerFinding.IFinding): boolean => f.reading === "fold");
  const made: number = independentExcess(copy, p.mesh.I, trunk, 0) - independentExcess(p.mesh.P, p.mesh.I, trunk, 0);

  // Two slicers start their loops at different points, so 1 mm resampling falls differently at the V's corners: allow the spread of the made reading over starts a quarter of the loop apart.
  const starts: number[] = [0, 1, 2, 3].map(
    (k: number): number => independentExcess(copy, p.mesh.I, trunk, k / 4) - independentExcess(p.mesh.P, p.mesh.I, trunk, k / 4),
  );
  const tolerance: number = 0.5 + Math.max(...starts) - Math.min(...starts);

  if (Math.abs(fold.layer.fold - made) > tolerance || !(made > 30) || flagged !== fold.layer.fold > fold.layer.limits.fold)
    throw new Error(
      `${p.id}: an inward V of 15 degrees at ${trunk.chain}/${trunk.layer} read excess ${fold.layer.fold.toFixed(1)} deg against the made section's ${made.toFixed(1)} within ${tolerance.toFixed(1)} (limit ${fold.layer.limits.fold.toFixed(1)}), flagged ${flagged}`,
    );

  return `V 15 deg read +${fold.layer.fold.toFixed(1)} deg, made ${made.toFixed(1)} (limit ${fold.layer.limits.fold.toFixed(1)}, flagged ${flagged})`;
}

/** The mesh with an inward V of half-width 30 mm and wall angle `beta` pressed into a section loop at an arclength. */
function vee(p: IProof, site: HumanLayerSite.ISite, loop: V2[], centre: number, beta: number): Float64Array {
  const total: number = G.perimeter(loop);

  return HumanLayerIndex.displaced(p.mesh.P, (q: V3): V3 | null => {
    if (!near(site, q, 40)) return null;

    const at: { x: number; normal: V2; distance: number } = project(loop, HumanLayerPlane.local(site.plane, q));

    if (at.distance > 15) return null;

    const along: number = Math.abs(at.x - centre);
    const depth: number = Math.max(0, 30 - Math.min(along, total - along)) * Math.tan(beta);

    if (depth === 0) return null;

    return A.add(A.scale(site.plane.u, -depth * at.normal[0]), A.scale(site.plane.v, -depth * at.normal[1]));
  });
}

/** The turning arithmetic exactly: inward Vs of 10 and 15 degrees on the straight side of a 400 mm square read 4 beta. */
function proveStraight(): number[] {
  const planar: number[] = [10, 15].map((beta: number): number => {
    const q: V2[] = [];

    for (let x: number = -200; x < 200; x += 0.5) q.push([x, -200 + Math.max(0, 30 - Math.abs(x)) * Math.tan((beta * Math.PI) / 180)]);

    q.push([200, -200], [200, 200], [-200, 200]);

    return (G.turning(q, HumanLayerFold.TURN_STEP).excess * 180) / Math.PI;
  });

  if (Math.abs(planar[0]! - 40) > 0.5 || Math.abs(planar[1]! - 60) > 0.5)
    throw new Error(`inward Vs of 10 and 15 degrees on a straight side read excess turnings of ${planar.map((x: number): string => x.toFixed(2)).join(" and ")} deg, not 40 and 60`);

  return planar;
}

/** A known displacement of the real generated skin: 5 mm forward moves every horizontal trunk centroid reading by 5 mm forward. */
function proveDisplacement(p: IProof): number {
  const trunks: HumanLayerSite.ISite[] = p.sites.filter((s: HumanLayerSite.ISite): boolean => s.chain === "trunk" && Math.abs(s.plane.normal[1]) > 0.999);
  const gen: HumanLayerIndex = new HumanLayerIndex(p.skin.P, p.skin.I);
  const forward: HumanLayerIndex = new HumanLayerIndex(
    Float64Array.from(p.skin.P, (c: number, i: number): number => (i % 3 === 0 ? c + 5 : c)),
    p.skin.I,
  );
  let moved: number = 0;

  for (const s of trunks) {
    const a: HumanLayerReport.ILayer = HumanLayerCompare.compareSite(p.id, s, gen, p.reference, p.basis).layer;
    const b: HumanLayerReport.ILayer = HumanLayerCompare.compareSite(p.id, s, forward, p.reference, p.basis).layer;

    if (a.status !== "compared" || b.status !== "compared") continue;

    const d: V3 = A.sub(b.shift, a.shift);

    if (A.dist(d, [5, 0, 0]) > 0.01)
      throw new Error(`${p.id}: the generated skin moved 5 mm forward moved ${s.chain}/${s.layer}'s centroid reading by ${d.map((c: number): string => c.toFixed(3)).join(", ")}`);

    moved++;
  }

  if (moved === 0) throw new Error(`${p.id}: no horizontal trunk layer compared to prove the known displacement on`);

  return moved;
}

/** Whether two phase intervals in degrees, each possibly wrapping, overlap. */
function overlaps(a: [number, number], b: [number, number]): boolean {
  const span: (x: [number, number]) => number[] = (x: [number, number]): number[] => {
    const out: number[] = [];
    const w: number = (((x[1] - x[0]) % 360) + 360) % 360;

    for (let d: number = 0; d <= w; d++) out.push(Math.round(x[0] + d) % 360);

    return out;
  };
  const set: Set<number> = new Set(span(a));

  return span(b).some((d: number): boolean => set.has(d));
}

/** The closed loop among cut loops that follows a layer's ring most closely, counter-clockwise. */
function nearestLoop(loops: HumanLayerIndex.ILoop[], site: HumanLayerSite.ISite): V2[] {
  const ring: V2[] = site.ring.map((q: V3): V2 => HumanLayerPlane.local(site.plane, q));
  const flat: V2[][] = loops.map((l: HumanLayerIndex.ILoop): V2[] => l.points.map((q: V3): V2 => HumanLayerPlane.local(site.plane, q)));

  return G.orient(flat[G.argmin(flat.map((q: V2[]): number => ringDistance(ring, q)))]!);
}

/** Sum of ring points' distances to a loop, from every eighth point. */
function ringDistance(ring: V2[], q: V2[]): number {
  let d: number = 0;

  for (let i: number = 0; i < ring.length; i += 8) d += Math.abs(G.signedDistance(q, ring[i]!).distance);

  return d;
}

/** Excess turning, degrees, of a mesh's closed section at a site nearest the site's ring, cut by `HumanAnatomy.polylines`, its loop started at a fraction of its points. */
function independentExcess(P: Float64Array, I: Uint32Array, site: HumanLayerSite.ISite, start: number): number {
  const skin: HumanAnatomy.ISkin = { name: "made", P, I, tri: new Int32Array(I.length / 3), chains: [], joints: new Map() };
  const ring: V2[] = site.ring.map((q: V3): V2 => HumanLayerPlane.local(site.plane, q));
  const loops: V2[][] = A.polylines(skin, site.plane.origin, site.plane.normal)
    .filter((c: { points: V3[]; closed: boolean }): boolean => c.closed && c.points.length >= 3)
    .map((c: { points: V3[]; closed: boolean }): V2[] => c.points.map((q: V3): V2 => HumanLayerPlane.local(site.plane, q)));
  const best: V2[] = loops[G.argmin(loops.map((q: V2[]): number => ringDistance(ring, q)))]!;
  const k: number = Math.floor(start * best.length);

  return (G.turning([...best.slice(k), ...best.slice(0, k)], HumanLayerFold.TURN_STEP).excess * 180) / Math.PI;
}

/** A point's nearest place on a closed counter-clockwise loop: arclength position, outward normal there and distance. */
function project(loop: V2[], p: V2): { x: number; normal: V2; distance: number } {
  let best: number = Infinity;
  let x: number = 0;
  let normal: V2 = [1, 0];
  let at: number = 0;

  for (let i: number = 0; i < loop.length; i++) {
    const a: V2 = loop[i]!;
    const b: V2 = loop[(i + 1) % loop.length]!;
    const ex: number = b[0] - a[0];
    const ey: number = b[1] - a[1];
    const ll: number = ex * ex + ey * ey;
    const len: number = Math.sqrt(ll);
    const f: number = ll === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * ex + (p[1] - a[1]) * ey) / ll));
    const d: number = Math.hypot(p[0] - a[0] - f * ex, p[1] - a[1] - f * ey);

    if (d < best && len > 0) {
      best = d;
      x = at + f * len;
      normal = [ey / len, -ex / len];
    }

    at += len;
  }

  return { x, normal, distance: best };
}
