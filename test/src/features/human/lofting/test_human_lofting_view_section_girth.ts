import { type AutoMovieLoftContract, AutoMovieViewSection, type IAutoMovieViewPart } from "@automovie/engine";

type Quarters = IAutoMovieViewPart.IQuarters<number>;

/**
 * The view section's girth rises monotonically with its shoulder inside the
 * box's reach, one girth solves back to its one shoulder, and a girth the box
 * cannot reach, or a box with no valid section, gives the end shape or none
 * with exactly one diagnostic.
 *
 * Scenarios:
 * 1. Reach: for a 60 by 40 box, a 120 by 40 box and two asymmetric boxes, the valid shoulder range holds the ellipse's shoulder and its girths lie inside the taut-tape bounds `2 sqrt(W^2 + D^2)` (the rhombus) and `2 (W + D)` (the rectangle).
 * 2. Monotone: 64 shoulders across each range give strictly rising girths; a made sequence with one fall must fail the same reader.
 * 3. Round trip: at five shoulders across each range, and with four sourced departures on one box, the girth of the section solves back to its shoulder within the solve's 1e-6 mm girth tolerance over the girth's slope, with no diagnostic; a made shoulder 0.01 off must fail the same reader.
 * 4. Out of reach: a girth 1 mm under the reach gives the least shoulder's section and one `girth in reach` diagnostic, 1 mm over it the greatest shoulder's and one diagnostic; the reach's own ends give none.
 * 5. No valid section: a departure that pushes one quarter's shoulder past 1 gives no section and one `view section` diagnostic.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `AutoMovieViewSection.range`, `.of` and `.solve` and reads their sections' `girth` and `shoulders` and their diagnostics. It catches a girth that does not rise with the shoulder (two shoulders for one girth), a reach outside the taut-tape bounds, a solve that lands on the wrong shoulder or misses its girth, a girth outside the reach clamped to the wrong end or reported more or less than once, and a broken box returning a section; any operator that solves one girth to its one shoulder and reports what it cannot reach passes.
 * @evidence contracts/testing.md#independent-expectations The bounds come from convex geometry, not the operator: a convex section touching all four sides of a W by D box has a taut-tape perimeter between the rhombus through its touch points and the box itself (#3045, #3046). The round trip's shoulder limit is the solve's published girth tolerance (1e-6 mm) divided by the girth's slope in the shoulder, read by a central difference, doubled for the difference's own error; its girth limit is that tolerance. Contract names are the operator's published ones (`girth in reach`, `view section`). Oracle limit: monotonicity is read at 64 shoulders, so a fold between two of them passes.
 * @evidence contracts/testing.md#distinguishing-cases Positive: in-reach girths across each range, at both ends and with departures. Negative: girths 1 mm outside on each side, a box with no valid section, and made falling and off-shoulder readings. Boundary: the reach's end girths, which must solve with no diagnostic. The section's shape and its guides belong to `test_human_lofting_view_section`; the chain to `test_human_lofting_view_section_chain`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_lofting_view_section_girth`; it builds made boxes in process, generates no person and starts no host, browser or GPU.
 */
export function test_human_lofting_view_section_girth(): void {
  const failures: string[] = [];
  const boxes: Quarters[] = [
    [30, 20, 30, 20],
    [60, 20, 60, 20],
    [30, 12, 18, 25],
    [12, 40, 20, 8],
  ];
  for (const extents of boxes) {
    const label: string = `box [${extents.join(", ")}]`;
    const box: AutoMovieViewSection.IBox = { extents };
    const W: number = extents[0] + extents[2];
    const D: number = extents[1] + extents[3];
    const range: AutoMovieViewSection.IRange | null = AutoMovieViewSection.range(box);
    if (range === null) {
      failures.push(`${label}: no valid range`);
      continue;
    }

    // 1. Reach inside the taut-tape bounds, holding the ellipse.
    const [lo, hi]: [number, number] = range.girth;
    if (!(range.shoulder[0] < AutoMovieViewSection.ELLIPSE && AutoMovieViewSection.ELLIPSE < range.shoulder[1])) failures.push(`${label}: shoulder range [${range.shoulder.join(", ")}] does not hold the ellipse's`);
    if (!(2 * Math.hypot(W, D) <= lo * (1 + 1e-12) && lo < hi && hi <= 2 * (W + D) * (1 + 1e-12))) failures.push(`${label}: reach ${lo} to ${hi} mm outside the rhombus ${2 * Math.hypot(W, D)} and rectangle ${2 * (W + D)} mm`);

    // 2. Monotone girth over the range.
    const girth: (r: number) => number = (r: number): number => AutoMovieViewSection.of(box, [r, r, r, r]).girth;
    const sequence: number[] = Array.from({ length: 64 }, (_: unknown, i: number): number => girth(range.shoulder[0] + ((range.shoulder[1] - range.shoulder[0]) * i) / 63));
    const fall: string | null = falls(sequence);
    if (fall !== null) failures.push(`${label}: ${fall}`);

    // 3. Round trip at five shoulders.
    for (const share of [0, 0.3, 0.5, 0.7, 1]) {
      const r: number = range.shoulder[0] + share * (range.shoulder[1] - range.shoulder[0]);
      failures.push(...roundTrip(`${label} at shoulder ${r}`, box, [0, 0, 0, 0], r, AutoMovieViewSection.solve("made", box, girth(r))));
    }

    // 4. Girths 1 mm outside the reach each way.
    const under: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve("made", box, lo - 1);
    const over: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve("made", box, hi + 1);
    for (const [name, solved, end] of [
      ["under", under, range.shoulder[0]],
      ["over", over, range.shoulder[1]],
    ] as [string, AutoMovieViewSection.ISolved, number][]) {
      if (solved.section === null || solved.section.shoulders.some((s: number): boolean => s !== end)) failures.push(`${label} ${name} the reach: section at shoulders [${solved.section?.shoulders.join(", ")}], expected ${end}`);
      if (!(solved.diagnostics.length === 1 && solved.diagnostics[0]!.contract === "girth in reach")) failures.push(`${label} ${name} the reach: diagnostics [${solved.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.contract).join(", ")}], expected one girth in reach`);
    }
  }

  // 3b. Round trip with sourced departures per quarter.
  const box: AutoMovieViewSection.IBox = { extents: [30, 12, 18, 25] };
  const departures: Quarters = [0.05, -0.05, 0.03, -0.03];
  const range: AutoMovieViewSection.IRange | null = AutoMovieViewSection.range(box, departures);
  if (range === null) failures.push("departures: no valid range");
  else {
    const r: number = (range.shoulder[0] + range.shoulder[1]) / 2;
    const g: number = AutoMovieViewSection.of(box, departures.map((d: number): number => r + d) as Quarters).girth;
    failures.push(...roundTrip("departures", box, departures, r, AutoMovieViewSection.solve("made", box, g, departures)));
  }

  // 5. A box with no valid section.
  const none: AutoMovieViewSection.ISolved = AutoMovieViewSection.solve("made", { extents: [30, 20, 30, 20] }, 150, [0.7, 0, 0, 0]);
  if (none.section !== null) failures.push("no valid section: a section is returned");
  if (!(none.diagnostics.length === 1 && none.diagnostics[0]!.contract === "view section")) failures.push(`no valid section: diagnostics [${none.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.contract).join(", ")}], expected one view section`);

  // Red proofs of the readers.
  if (falls([1, 2, 3, 2.5, 4]) === null) failures.push("proof: a falling girth sequence passes the monotone reader");
  const made: AutoMovieViewSection.ISolved = { section: AutoMovieViewSection.of(box, [0.42, 0.42, 0.42, 0.42]), diagnostics: [] };
  if (roundTrip("proof", box, [0, 0, 0, 0], 0.41, made).length === 0) failures.push("proof: a section 0.01 off its shoulder passes the round-trip reader");

  if (failures.length !== 0) throw new Error(`${failures.length} view section girth failures:\n${failures.join("\n")}`);
}

/** The first place a sequence fails to rise strictly, or null. */
function falls(sequence: readonly number[]): string | null {
  for (let i: number = 1; i < sequence.length; i++) if (!(sequence[i]! > sequence[i - 1]!)) return `girth ${sequence[i]} after ${sequence[i - 1]} at step ${i}: not rising`;
  return null;
}

/**
 * Every round-trip failure of a solve aimed at shoulder `r`: a diagnostic, a
 * missing section, a girth off its target by more than the solve's tolerance,
 * or a shoulder off `r` by more than that tolerance over the girth's slope.
 */
function roundTrip(label: string, box: AutoMovieViewSection.IBox, departures: Quarters, r: number, solved: AutoMovieViewSection.ISolved): string[] {
  const at: (x: number) => number = (x: number): number => AutoMovieViewSection.of(box, departures.map((d: number): number => x + d) as Quarters).girth;
  const target: number = at(r);
  if (solved.diagnostics.length !== 0) return [`${label}: diagnostics ${solved.diagnostics.map((d: AutoMovieLoftContract.IDiagnostic): string => d.detail).join("; ")}`];
  if (solved.section === null) return [`${label}: no section`];
  const out: string[] = [];
  if (!(Math.abs(solved.section.girth - target) <= 1e-6)) out.push(`${label}: girth ${solved.section.girth} against ${target} mm`);
  const h: number = 1e-6;
  const slope: number = Math.abs(at(r + h) - at(r - h)) / (2 * h);
  const limit: number = (2 * 1e-6) / slope + 1e-12;
  const got: number = solved.section.shoulders[0]! - departures[0]!;
  if (!(Math.abs(got - r) <= limit)) out.push(`${label}: shoulder ${got} against ${r}, limit ${limit}`);
  return out;
}
