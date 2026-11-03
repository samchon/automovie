import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanLayerComposition } from "../../../internal/HumanLayerComposition";
import { HumanLayerContinuity } from "../../../internal/HumanLayerContinuity";
import { HumanLayerFinding } from "../../../internal/HumanLayerFinding";
import { HumanLayerPlane } from "../../../internal/HumanLayerPlane";
import { HumanLayerSite } from "../../../internal/HumanLayerSite";
import { HumanPeople } from "../../../internal/HumanPeople";

type V3 = HumanAnatomy.V3;

/** A loft: station to the section at that station as a function of phase. */
type Surface = (s: number) => (t: number) => V3;

/** A tessellated piece of a tube: flat positions and triangle indices. */
interface IPiece {
  /** Flat vertex positions, mm. */
  P: number[];

  /** Flat triangle vertex indices. */
  I: number[];
}

/**
 * Pins that every generated person's declared loft layers lie on the skin the
 * surface actually emits at their planes, on both pieces either side of each
 * layer, and keep across every layer the continuity their layers declare.
 *
 * Scenarios:
 * 1. An analytic tube read against its own tessellation gives no finding.
 * 2. A 3 mm inward dent of known phase gives +3.00 mm outside at that layer and phase only.
 * 3. A piece above a layer offset 2 mm gives a 2.00 mm seam gap on that side only.
 * 4. A tangent kink of 1 degree and a curvature step of 0.01 per mm read their size; the smooth tube reads neither.
 * 5. The emitted skin of a real person moved 0.5 mm along its normals moves the median section reading by -0.50 mm.
 * 6. Every person of `HumanPeople` is read, and every disagreement is listed by person, `chain/k`, phase and direction.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates every person of `HumanPeople` and reads, for every principal layer of every loft chain, the layer's declared section at uniform phases at most 3 mm apart round it (every 1 to 15 degrees; `AutoMovieHumanLoftChain.ring`, reliefs and lifts included) against the bind skin `AutoMovieHumanBodySurface` emitted, by `HumanLayerComposition.composition`: each phase's signed distance to the nearest emitted triangle; for an interior layer, its distance to the chain's own triangles on each side of the plane separately, so a piece that stops short of the shared section is named with its neighbour; for a planar layer wholly on the skin whose emitted section in the plane is one loop following the ring, that loop's taut-tape girth and area against the declared ring's (the tape bridges the tessellation's zigzag, which the point readings already bound); and the loft's tangent break, and where C2 is declared its curvature jump, across the layer at every phase. Phases off the skin join into runs and the test fails with every run and reading by person, `chain/k`, phase interval, bearing, value, limit and world point. Phases whose nearest skin is an open border (an aperture) or, inside a chain, another chain's skin (a root or web that replaces the base there) are counted for information, not compared. It catches a join, relief, aperture cut or tessellation that moves a layer's section off the skin, a seam where one piece does not reach its neighbour, and a tangent or curvature break the layers do not declare.
 * @evidence contracts/testing.md#independent-expectations The expectation is the construction's own declaration read against its own output, so the reading is a consistency check between two products, not a copy of either: the layer's section is evaluated by the loft's public chain function and the skin is the emitted mesh, measured by a separate plane slicer and nearest-triangle search (Ericson 2005). The distance limit is 1 mm, ISO 20685-1:2018 Table 4's smallest allowance (head and hand dimensions), below which no anthropometric reading resolves a difference and above the mesh's own chord error; girth limits are Table 4's 9 mm (trunk and thigh) and 4 mm (other circumferences); area limits are the declared perimeter times 1 mm. The tangent break limit is twice the finite differences' own truncation bound (`h/2 |n . P''|` on each side, h = 0.001 mm) plus 1e-6 rad; the curvature jump limit is the jump whose departure `dk x^2 / 2` over half the shorter neighbouring interval reaches 1 mm. Proved in this test on an analytic tube tessellated here, independent of the generator: the tube against its own mesh reads no finding with its largest distance within its chord sagitta; a 3 mm inward dent of known phase reads +3.00 mm outside at that layer and phase; a piece above a layer offset 2 mm reads a 2.00 mm seam gap on that side only; a tangent kink of 1 degree reads 1.00 degree and a curvature step of 0.01 per mm reads 0.0100 per mm, while the smooth tube reads neither. On a real person, the emitted skin moved 0.5 mm along its own vertex normals moves the median section reading by -0.50 mm. Oracle limits: the continuity reading needs the loft function, so it reads the chain functions the generator uses, which a defect in those functions shared by both sides would pass; the aperture and replaced classes rest on the mesh's borders and chain labels, so a wrong section that happens to lie over an opening or another chain goes uncompared.
 * @evidence contracts/testing.md#distinguishing-cases The people span both sexes and the ends of length and breadth; the layers span horizontal and bone-framed sections, lifted and relieved ones, chain ends at events and poles, and interior layers declared C1 and C2. The proofs cover a correct surface, a dent, a seam gap, a tangent kink, a curvature step and a known uniform offset. A pole or tip layer (ring within 2 mm) is not a section and is counted; a lifted layer's girth is not read, since its section leaves the plane; a layer whose shorter neighbouring interval is under the finite differences' reach (0.002 mm for the tangent, 0.15 mm for the curvature) is read without that reading. A departure narrower than 3 mm round the section can fall between readings. Comparison with private reference bodies belongs to `test_human_reference_layers`, surface crossings and openings to `test_human_skin_integrity`, the loft curves' own sampling to the `test_human_curve_*` tests; this test owns only the agreement of declared layers with the emitted skin and their declared continuity.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_layer_composition`, generating every person in process on the CPU from committed parameters, with no private data, renderer, browser or GPU.
 */
export function test_human_layer_composition(): void {
  proveOnTube();

  const lines: string[] = [];
  const info: string[] = [];
  let proved: boolean = false;

  for (const name of HumanPeople.names()) {
    const skin: HumanAnatomy.ISkin = HumanAnatomy.bind(name);
    const sites: HumanLayerSite.ISite[] = HumanLayerSite.sites(name);
    const report: HumanLayerComposition.IComposition = HumanLayerComposition.composition({
      person: name,
      sites,
      skin,
      surface: HumanLayerContinuity.surface(name),
    });
    const c: HumanLayerComposition.IComposition["counts"] = report.counts;

    if (!proved) {
      proveOffset(name, skin, sites);
      proved = true;
    }

    lines.push(...report.findings.map(HumanLayerFinding.describe));
    info.push(
      `${name}: ${c.layers} layers (${c.poles} poles), ${c.points} phases: ${c.agree} on the skin, ${c.moved} off it, ${c.aperture} over an aperture, ${c.replaced} replaced by another chain, ${c.gap} with a seam gap; ` +
        `distance on the skin median ${report.sampling.median.toFixed(3)} mm, largest ${report.sampling.max.toFixed(3)} mm; largest tangent break ${report.continuity.break.toFixed(4)} deg, curvature jump ${report.continuity.jump.toExponential(2)} per mm`,
    );
  }

  console.log(info.join("\n"));

  if (lines.length !== 0)
    throw new Error(`${lines.length} layer readings disagree with the emitted skin or their declared continuity:\n${lines.join("\n")}\n\nCounts, for information:\n${info.join("\n")}`);
}

/** Radius of the analytic tube at a station, mm. */
function radius(s: number): [number, number] {
  return [40 + 5 * Math.sin(s / 30), 30 + 3 * Math.cos(s / 40)];
}

/** The analytic wavy tube along +Y. */
function tube(): Surface {
  return (s: number): ((t: number) => V3) =>
    (t: number): V3 => {
      const [a, b]: [number, number] = radius(s);

      return [a * Math.cos(t), s, b * Math.sin(t)];
    };
}

/** A straight elliptic cylinder along +Y with a radial term. */
function cylinder(extra: (s: number) => number): Surface {
  return (s: number): ((t: number) => V3) =>
    (t: number): V3 => {
      const e: number = extra(s);

      return [(40 + e) * Math.cos(t), s, (30 + e) * Math.sin(t)];
    };
}

/** Layer sites of the tube at its five stations. */
function tubeSites(surface: Surface): HumanLayerSite.ISite[] {
  return [0, 50, 100, 150, 200].map((y: number, k: number): HumanLayerSite.ISite => {
    const ring: V3[] = Array.from({ length: HumanLayerSite.PHASES }, (_: unknown, i: number): V3 =>
      surface(y)((2 * Math.PI * i) / HumanLayerSite.PHASES),
    );
    const centre: V3 = [0, y, 0];

    return {
      chain: "tube",
      layer: k,
      layers: 5,
      station: y,
      plane: HumanLayerPlane.chart([0, y, 0], [0, 1, 0], [1, 0, 0]),
      ring,
      centre,
      reach: Math.max(...ring.map((p: V3): number => HumanAnatomy.dist(p, centre))),
      lifted: false,
      large: false,
      dimension: "calf",
      continuity: k === 0 || k === 4 ? null : "C2",
      interval: 50,
    };
  });
}

/** The tube tessellated from `from` to `to` mm at 1 mm stations and 2 degree phases, outward, optionally moved radially. */
function tessellate(surface: Surface, from: number, to: number, move: (s: number, t: number) => number = (): number => 0): IPiece {
  const piece: IPiece = { P: [], I: [] };
  const phases: number = 180;
  const rows: number = to - from + 1;

  for (let s: number = from; s <= to; s++)
    for (let j: number = 0; j < phases; j++) {
      const t: number = (2 * Math.PI * j) / phases;
      const p: V3 = surface(s)(t);
      const m: number = move(s, t);

      piece.P.push(p[0] + m * Math.cos(t), p[1], p[2] + m * Math.sin(t));
    }

  for (let i: number = 0; i + 1 < rows; i++)
    for (let j: number = 0; j < phases; j++) {
      const a: number = i * phases + j;
      const b: number = (i + 1) * phases + j;
      const c: number = i * phases + ((j + 1) % phases);
      const d: number = (i + 1) * phases + ((j + 1) % phases);

      piece.I.push(a, b, c, b, d, c);
    }

  return piece;
}

/** A tessellated piece list as a skin of the one chain "tube". */
function skinOf(pieces: IPiece[]): HumanLayerComposition.ISkin {
  const P: number[] = [];
  const I: number[] = [];

  for (const piece of pieces) {
    const base: number = P.length / 3;

    for (const c of piece.P) P.push(c);
    for (const v of piece.I) I.push(v + base);
  }

  return { P: Float64Array.from(P), I: Uint32Array.from(I), tri: new Int32Array(I.length / 3), chains: ["tube"] };
}

/** Red and green on the analytic tube, independent of the generator. */
function proveOnTube(): void {
  const smooth: Surface = tube();
  const sites: HumanLayerSite.ISite[] = tubeSites(smooth);
  const green: HumanLayerComposition.IComposition = HumanLayerComposition.composition({
    person: "tube",
    sites,
    skin: skinOf([tessellate(smooth, 0, 200)]),
    surface: (_c: string, s: number): ((t: number) => V3) => smooth(s),
  });

  // The chord sagitta of a 2 degree phase step on the largest radius, 45 mm, bounds a correct mesh's distance.
  const sagitta: number = 45 * (1 - Math.cos(Math.PI / 180));

  if (green.findings.length !== 0 || !(green.sampling.max <= sagitta + 1e-9))
    throw new Error(`the analytic tube against its own mesh reads ${green.findings.length} findings and ${green.sampling.max} mm (sagitta ${sagitta}):\n${green.findings.map(HumanLayerFinding.describe).join("\n")}`);

  // A 3 mm inward dent at station 100, phases 80 to 100 degrees.
  const dented: IPiece = tessellate(smooth, 0, 200, (s: number, t: number): number =>
    Math.abs(s - 100) <= 6 && t >= (78 * Math.PI) / 180 && t <= (102 * Math.PI) / 180 ? -3 : 0,
  );
  const dent: HumanLayerComposition.IComposition = HumanLayerComposition.composition({ person: "tube", sites, skin: skinOf([dented]) });
  const hit: HumanLayerFinding.IFinding | undefined = dent.findings.find(
    (f: HumanLayerFinding.IFinding): boolean => f.layer === 2 && f.reading === "section outside the skin",
  );

  if (
    hit === undefined ||
    dent.findings.some((f: HumanLayerFinding.IFinding): boolean => f.layer !== 2) ||
    Math.abs(hit.value - 3) > 0.05 ||
    hit.phase === null ||
    hit.phase[0] < 76 ||
    hit.phase[1] > 104
  )
    throw new Error(`a 3 mm dent at tube/2, phases 80 to 100, read: ${dent.findings.map(HumanLayerFinding.describe).join("; ") || "nothing"}`);

  // The piece above station 100 offset 2 mm outward leaves a seam gap above that layer only.
  const gap: HumanLayerComposition.IComposition = HumanLayerComposition.composition({
    person: "tube",
    sites,
    skin: skinOf([tessellate(smooth, 0, 100), tessellate(smooth, 100, 200, (): number => 2)]),
  });
  const seam: HumanLayerFinding.IFinding[] = gap.findings.filter((f: HumanLayerFinding.IFinding): boolean => f.reading.startsWith("seam gap"));

  if (seam.length !== 1 || seam[0]!.layer !== 2 || !seam[0]!.reading.includes("above") || Math.abs(seam[0]!.value - 2) > 0.05)
    throw new Error(`a 2 mm offset of the piece above tube/2 read: ${gap.findings.map(HumanLayerFinding.describe).join("; ") || "nothing"}`);

  proveContinuity(smooth);
}

/**
 * A tangent kink of 1 degree and a curvature step of 0.01 per mm at station
 * 100 of a straight elliptic cylinder, where both are exact; the smooth wavy
 * tube reads neither.
 */
function proveContinuity(smooth: Surface): void {
  const phases: number = HumanLayerSite.PHASES;
  const tolerance: number = HumanLayerComposition.COMPOSITION;
  const smoothRead: HumanLayerContinuity.IReading = HumanLayerContinuity.continuity(smooth, 100, 50, phases, tolerance);
  const kinked: Surface = cylinder((s: number): number => Math.max(0, s - 100) * Math.tan(Math.PI / 180));
  const stepped: Surface = cylinder((s: number): number => (0.01 * Math.max(0, s - 100) ** 2) / 2);
  const kink: HumanLayerContinuity.IReading = HumanLayerContinuity.continuity(kinked, 100, 50, phases, tolerance);
  const step: HumanLayerContinuity.IReading = HumanLayerContinuity.continuity(stepped, 100, 50, phases, tolerance);
  const deg: number = 180 / Math.PI;
  const at: number = phases / 4;
  let smoothExcess: number = -Infinity;
  let smoothBreak: number = 0;
  let smoothJump: number = 0;

  for (let i: number = 0; i < phases; i++) {
    smoothExcess = Math.max(smoothExcess, smoothRead.breaks[i]! - smoothRead.limits[i]!);
    smoothBreak = Math.max(smoothBreak, smoothRead.breaks[i]!);
    smoothJump = Math.max(smoothJump, smoothRead.jumps[i]!);
  }

  if (
    smoothExcess > 0 ||
    smoothJump > smoothRead.jumpLimit ||
    Math.abs(kink.breaks[0]! * deg - 1) > 0.01 ||
    Math.abs(kink.breaks[at]! * deg - 1) > 0.01 ||
    Math.abs(step.jumps[0]! - 0.01) > 0.0005 ||
    Math.abs(step.jumps[at]! - 0.01) > 0.0005 ||
    step.jumps[0]! <= step.jumpLimit
  )
    throw new Error(
      `continuity proof failed: smooth break ${smoothBreak * deg} deg, jump ${smoothJump}; ` +
        `kink ${kink.breaks[0]! * deg}, ${kink.breaks[at]! * deg} deg; step ${step.jumps[0]}, ${step.jumps[at]} (limit ${step.jumpLimit})`,
    );
}

/** A known offset of a real person's emitted skin moves the reading by that offset. */
function proveOffset(name: string, skin: HumanAnatomy.ISkin, sites: HumanLayerSite.ISite[]): void {
  // Every fourth layer is enough for a median and keeps the proof to a quarter of a reading.
  const some: HumanLayerSite.ISite[] = sites.filter((_: HumanLayerSite.ISite, i: number): boolean => i % 4 === 0);
  const normals: Float64Array = HumanAnatomy.vertexNormals(skin);
  const P: Float64Array = Float64Array.from(skin.P, (c: number, i: number): number => c + 0.5 * normals[i]!);
  const before: HumanLayerComposition.IComposition = HumanLayerComposition.composition({ person: name, sites: some, skin });
  const moved: HumanLayerComposition.IComposition = HumanLayerComposition.composition({ person: name, sites: some, skin: { ...skin, P } });
  const change: number[] = [];

  for (let i: number = 0; i < before.distances.length; i++) {
    const a: number = before.distances[i]!;
    const b: number = moved.distances[i]!;

    if (Math.abs(a) <= HumanLayerComposition.COMPOSITION && Math.abs(b) <= HumanLayerComposition.COMPOSITION + 0.5) change.push(b - a);
  }

  change.sort((x: number, y: number): number => x - y);

  const median: number = change[Math.floor(change.length / 2)] ?? NaN;

  if (!(Math.abs(median + 0.5) <= 0.05))
    throw new Error(`${name}'s skin moved 0.5 mm outward moved the median section reading by ${median} mm over ${change.length} phases, not -0.5 mm`);
}
