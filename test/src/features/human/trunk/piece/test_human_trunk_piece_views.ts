import { AutoMovieHumanTrunkViewPart } from "../../../../../../packages/human/src/generation/trunk/AutoMovieHumanTrunkViewPart";
import type { IAutoMovieHumanTrunkViews } from "../../../../../../packages/human/src/generation/trunk/IAutoMovieHumanTrunkViews";
import { AutoMovieLoftChain, AutoMovieViewSection, type IAutoMovieLoftChain } from "@automovie/engine";

/**
 * The trunk base lofted from its views holds every view knot at its site: the
 * half breadth, the front and back profiles and the taut-tape girth read back
 * on the emitted chain, the chain closes at the perineum, and malformed views
 * or a tape its box cannot reach are reported, never thrown.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds `AutoMovieHumanTrunkViewPart.create` from made views of two people and reads the emitted `trunk` chain as an anthropometrist would, with `AutoMovieLoftChain.ring` at each site's height over 2048 phases: the left and right lateral extremes (half breadth and its reflection), the forward and backward extremes (front and back profiles) and the convex hull's perimeter (the taut tape); it reads the ring 1 mm above the perineum against the perineum point. It catches a site that is not a layer, a profile or breadth placed off its knot, an axis that shifts the section, a tape solved on the wrong box, a side not reflected, and a bottom that does not close. Any construction whose emitted sections touch these knots passes, whatever it does between them.
 * @evidence contracts/testing.md#independent-expectations Each expectation is the view's own knot, the input the construction must honour at its site (#3047 invariant). Limit 0.1 mm: the emitted section is the periodic cubic B-spline interpolating the operator's quintic polar section at 256 uniform angles, about 3.5 mm apart on these sections, whose interpolation error is of order `h^4 kappa^3`, far under 0.01 mm at the trunk's curvatures; the 2048-phase polygon's own shortfall on the perimeter, about `L h^2 kappa^2 / 24`, is likewise under 0.01 mm. The made people take ANSUR II's female and male means (`docs/sources/ansur-ii.md`: heights; chest, waist and hip breadth; chest, waist and buttock depth), each tape the Ramanujan perimeter of its box's ellipse or a fuller shoulder inside the box's reach; their forward places and the untaped sites' sizes are made and stated in the fixture. Oracle limit: it reads the sites only; the outlines between sites are the operator's (`test_human_lofting_view_section`).
 * @evidence contracts/testing.md#distinguishing-cases Green: both people, tapes at the ellipse and at a fuller shoulder, untaped sites with a given shoulder. Red proof: the same reading against views whose waist breadth, chest depth and hip tape are each moved by 1 mm must fail on exactly those three rows, so a 1 mm error cannot pass. Refused: a site below the perineum, a site whose back stands before its front, and a tape under its box's rhombus each give a diagnostic and no throw; the last still lofts at the reach's end. Whole-figure identity on the generated skin within ANSUR II's allowable errors is the trunk identity test's, once the trunk is wired.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_trunk_piece_views`; it lofts the part in process and starts no host, browser or GPU.
 */
export function test_human_trunk_piece_views(): void {
  const failures: string[] = [];

  // Green on both made people.
  for (const person of PEOPLE) {
    const result: AutoMovieHumanTrunkViewPart.IResult = AutoMovieHumanTrunkViewPart.create(person.views);
    if (result.diagnostics.length !== 0) failures.push(`${person.name}: diagnostics ${JSON.stringify(result.diagnostics)}`);
    const chain: IAutoMovieLoftChain | null = result.loft?.chain ?? null;
    if (chain === null) {
      failures.push(`${person.name}: no chain`);
      continue;
    }
    failures.push(...read(person.name, chain, person.views).map((r: IRow): string => r.finding).filter((f: string): boolean => f !== ""));
  }

  // Red proof: views moved by 1 mm at three sites must fail exactly those rows.
  const base: IPerson = PEOPLE[0]!;
  const moved: IAutoMovieHumanTrunkViews = {
    ...base.views,
    sites: base.views.sites.map((s: IAutoMovieHumanTrunkViews.ISite): IAutoMovieHumanTrunkViews.ISite =>
      s.site === "waist"
        ? { ...s, half: s.half + 1 }
        : s.site === "chest"
          ? { ...s, front: s.front + 1 }
          : s.site === "buttock" && "girth" in s.fullness
            ? { ...s, fullness: { girth: s.fullness.girth + 1 } }
            : s,
    ),
  };
  const movedChain: IAutoMovieLoftChain | null = AutoMovieHumanTrunkViewPart.create(moved).loft?.chain ?? null;
  if (movedChain === null) failures.push("red proof: the moved views made no chain");
  else {
    const red: string[] = read(base.name, movedChain, base.views)
      .filter((r: IRow): boolean => r.finding !== "")
      .map((r: IRow): string => r.key);
    const expected: string[] = ["waist half", "waist right half", "chest front", "buttock girth"];
    if (red.length !== expected.length || !expected.every((k: string): boolean => red.includes(k)))
      failures.push(`red proof: a 1 mm move failed [${red.join(", ")}], expected exactly [${expected.join(", ")}]`);
  }

  // Refused cases: reported, never thrown.
  const refuse = (name: string, views: IAutoMovieHumanTrunkViews, lofts: boolean): void => {
    let result: AutoMovieHumanTrunkViewPart.IResult;
    try {
      result = AutoMovieHumanTrunkViewPart.create(views);
    } catch (error) {
      failures.push(`${name}: threw ${String(error)}`);
      return;
    }
    if (result.diagnostics.length === 0) failures.push(`${name}: no diagnostic`);
    if ((result.loft?.chain !== null && result.loft?.chain !== undefined) !== lofts) failures.push(`${name}: chain ${lofts ? "missing" : "made"}`);
  };
  const sites: IAutoMovieHumanTrunkViews.ISite[] = base.views.sites;
  refuse("a site below the perineum", { ...base.views, sites: [{ ...sites[0]!, y: base.views.perineum.y - 5 }, ...sites.slice(1)] }, false);
  refuse("a back before its front", { ...base.views, sites: sites.map((s: IAutoMovieHumanTrunkViews.ISite): IAutoMovieHumanTrunkViews.ISite => (s.site === "waist" ? { ...s, back: s.front + 10 } : s)) }, false);
  refuse(
    "a tape under its box's rhombus",
    {
      ...base.views,
      sites: sites.map((s: IAutoMovieHumanTrunkViews.ISite): IAutoMovieHumanTrunkViews.ISite =>
        s.site === "waist" ? { ...s, fullness: { girth: 2 * Math.hypot(2 * s.half, s.front - s.back) - 20 } } : s,
      ),
    },
    true,
  );

  if (failures.length !== 0) throw new Error(`${failures.length} trunk view part findings:\n${failures.join("\n")}`);
}

/** Largest departure of a reading from its knot, mm: the emitted section's interpolation error and more (see the evidence). */
const LIMIT: number = 0.1;

/** Phases read on each ring. */
const PHASES: number = 2048;

/** One reading against its knot. */
interface IRow {
  /** `<site> <measure>`. */
  key: string;

  /** Empty when within the limit, otherwise the finding. */
  finding: string;
}

/**
 * Every site's readings on the chain against the views' knots, and the
 * perineum's closure.
 *
 * @param name The person.
 * @param chain The emitted chain.
 * @param views The knots expected.
 * @returns One row per reading.
 */
function read(name: string, chain: IAutoMovieLoftChain, views: IAutoMovieHumanTrunkViews): IRow[] {
  const rows: IRow[] = [];
  const phases: number[] = Array.from({ length: PHASES }, (_: unknown, i: number): number => (2 * Math.PI * i) / PHASES);
  const row = (key: string, value: number, expected: number): void => {
    const off: number = value - expected;
    rows.push({ key, finding: Math.abs(off) <= LIMIT ? "" : `${name} ${key}: ${value.toFixed(3)} mm against ${expected.toFixed(3)} mm (${off.toFixed(3)})` });
  };
  for (const s of views.sites) {
    const ring: [number, number, number][] = AutoMovieLoftChain.ring(chain, s.y, phases);
    const xs: number[] = ring.map((p: [number, number, number]): number => p[0]);
    const zs: number[] = ring.map((p: [number, number, number]): number => p[2]);
    row(`${s.site} half`, Math.max(...zs), s.half);
    row(`${s.site} right half`, -Math.min(...zs), s.half);
    row(`${s.site} front`, Math.max(...xs), s.front);
    row(`${s.site} back`, Math.min(...xs), s.back);
    if ("girth" in s.fullness) row(`${s.site} girth`, hull(ring.map((p: [number, number, number]): [number, number] => [p[0], p[2]])), s.fullness.girth);
  }

  // The bottom closes: the chain carries its pole at the perineum, and the
  // rings shrink toward it, each nearer ring reaching less far from it.
  const pole: [number, number, number] | undefined = chain.pole?.end === "bottom" ? chain.pole.point : undefined;
  const at: [number, number, number] = [views.perineum.x, views.perineum.y, 0];
  if (pole === undefined || Math.hypot(pole[0] - at[0], pole[1] - at[1], pole[2] - at[2]) > 1e-6)
    rows.push({ key: "perineum", finding: `${name} perineum: pole ${JSON.stringify(chain.pole)} is not the bottom pole at ${JSON.stringify(at)}` });
  const reach = (y: number): number =>
    Math.max(...AutoMovieLoftChain.ring(chain, y, phases).map((p: [number, number, number]): number => Math.hypot(p[0] - at[0], p[2] - at[2])));
  const reaches: number[] = [1, 5, views.sites[0]!.y - views.perineum.y].map((d: number): number => reach(views.perineum.y + d));
  if (!(reaches[0]! < reaches[1]! && reaches[1]! < reaches[2]!))
    rows.push({ key: "perineum", finding: `${name} perineum: rings 1 mm, 5 mm and at the lowest site reach ${reaches.map((r: number): string => r.toFixed(3)).join(", ")} mm, not shrinking toward the pole` });
  return rows;
}

/**
 * The perimeter of a closed polygon's convex hull (Andrew's monotone chain):
 * the taut tape over the section.
 *
 * @param points The polygon `[x, z]`.
 * @returns The hull's perimeter, mm.
 */
function hull(points: readonly [number, number][]): number {
  const sorted: [number, number][] = [...points].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
  const turn = (o: [number, number], a: [number, number], b: [number, number]): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: [number, number][]): [number, number][] => {
    const out: [number, number][] = [];
    for (const p of list) {
      while (out.length >= 2 && turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  const h: [number, number][] = [...half(sorted), ...half([...sorted].reverse())];
  let length: number = 0;
  for (let i: number = 0; i < h.length; i++) {
    const a: [number, number] = h[i]!;
    const b: [number, number] = h[(i + 1) % h.length]!;
    length += Math.hypot(b[0] - a[0], b[1] - a[1]);
  }
  return length;
}

/** A made person. */
interface IPerson {
  /** Name in findings. */
  name: string;

  /** The trunk's views. */
  views: IAutoMovieHumanTrunkViews;
}

/**
 * The perimeter of the ellipse inscribed in a box (Ramanujan's second
 * approximation), a tape every box reaches.
 *
 * @param half The half breadth, mm.
 * @param depth The whole depth, mm.
 * @returns The perimeter, mm.
 */
function ellipse(half: number, depth: number): number {
  const a: number = half;
  const b: number = depth / 2;
  const h: number = ((a - b) / (a + b)) ** 2;
  return Math.PI * (a + b) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));
}

/**
 * A made person from ANSUR II's means of one sex (`docs/sources/ansur-ii.md`)
 * with made forward places and untaped sizes.
 *
 * @param name Name in findings.
 * @param m The means: heights, breadths and depths, mm.
 * @returns The person.
 */
function person(
  name: string,
  m: { crotch: number; buttock: number; waist: number; chest: number; axilla: number; acromion: number; cervicale: number; hip: number; buttockDepth: number; waistBreadth: number; waistDepth: number; chestBreadth: number; chestDepth: number; biacromial: number },
): IPerson {
  // Made forward places of the mid-depth (the posture's forward and backward
  // lean) and a made fuller tape at the chest, inside its box's reach.
  const site = (siteName: string, y: number, half: number, depth: number, centre: number, fullness: IAutoMovieHumanTrunkViews.ISite["fullness"]): IAutoMovieHumanTrunkViews.ISite => ({
    site: siteName,
    y,
    half,
    front: centre + depth / 2,
    back: centre - depth / 2,
    fullness,
  });
  const chestHalf: number = m.chestBreadth / 2;
  const fuller: number = (ellipse(chestHalf, m.chestDepth) + 2 * (2 * chestHalf + m.chestDepth)) / 3;
  return {
    name,
    views: {
      perineum: { y: m.crotch, x: -10 },
      sites: [
        site("buttock", m.buttock, m.hip / 2, m.buttockDepth, -20, { girth: ellipse(m.hip / 2, m.buttockDepth) }),
        site("waist", m.waist, m.waistBreadth / 2, m.waistDepth, 0, { girth: ellipse(m.waistBreadth / 2, m.waistDepth) }),
        site("chest", m.chest, chestHalf, m.chestDepth, 10, { girth: fuller }),
        site("axilla", m.axilla, chestHalf, 0.9 * m.chestDepth, 5, { shoulder: AutoMovieViewSection.ELLIPSE }),
        site("acromion", m.acromion, m.biacromial / 2 + 5, 0.55 * m.chestDepth, -10, { shoulder: 0.5 }),
        site("top", m.cervicale + 40, 55, 110, -5, { shoulder: AutoMovieViewSection.ELLIPSE }),
      ],
    },
  };
}

/** The two made people: ANSUR II's female and male means (`docs/sources/ansur-ii.md`). */
const PEOPLE: IPerson[] = [
  person("ANSUR II women's means", {
    crotch: 782.3,
    buttock: 833.7,
    waist: 980.1,
    chest: 1171.6,
    axilla: 1239.0,
    acromion: 1335.1,
    cervicale: 1395.7,
    hip: 353.8,
    buttockDepth: 232.9,
    waistBreadth: 299.9,
    waistDepth: 213.0,
    chestBreadth: 269.3,
    chestDepth: 247.4,
    biacromial: 365.3,
  }),
  person("ANSUR II men's means", {
    crotch: 845.9,
    buttock: 887.9,
    waist: 1056.5,
    chest: 1291.1,
    axilla: 1329.1,
    acromion: 1440.7,
    cervicale: 1517.3,
    hip: 345.7,
    buttockDepth: 245.8,
    waistBreadth: 326.4,
    waistDepth: 237.8,
    chestBreadth: 289.4,
    chestDepth: 253.8,
    biacromial: 415.7,
  }),
];
