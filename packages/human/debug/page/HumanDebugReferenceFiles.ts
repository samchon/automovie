import type { IHumanDebugReferencePack } from "../contracts/IHumanDebugReferencePack";

/** Regions the comparison reads; `head_detail` (eyes, teeth, lashes) is not skin. */
const REGIONS: readonly string[] = ["trunk", "head", "arm_l", "arm_r", "hand_l", "hand_r", "leg_l", "leg_r", "foot_l", "foot_r"];

/** The served address of every file of the checkout's private pack, by its path from this module. */
const FILES: Record<string, () => Promise<string>> = (
  import.meta as unknown as {
    glob(pattern: string, options: { query: string; import: string }): Record<string, () => Promise<string>>;
  }
).glob("../../../../.references/curves/*/sections/*/*.json", { query: "?url", import: "default" });

/** Indexes of the pack, by the same paths. */
const INDEXES: Record<string, () => Promise<string>> = (
  import.meta as unknown as {
    glob(pattern: string, options: { query: string; import: string }): Record<string, () => Promise<string>>;
  }
).glob("../../../../.references/curves/*/index.json", { query: "?url", import: "default" });

/** The pack's curve record: Hermite spans with phase widths. */
interface ICurve {
  phaseIntervals: number[];
  spans: { start: number[]; end: number[]; startDerivative: number[]; endDerivative: number[] }[];
}

/**
 * Read one reference person's skin sections from the checkout's private pack
 * (`.references/curves/<id>/` at the repository root, git-ignored), for the view comparison.
 *
 * The pack's files are listed when Vite transforms this module (`import.meta.glob`, as served
 * addresses only), so a checkout without the pack lists none and nothing of it reaches the
 * repository; each file is fetched at run time. Each region file `sections/<region>/NNN.json` holds
 * horizontal sections whose curves are cubic Hermite splines; a closed curve becomes the loop of its
 * spans' start points and midpoints (the Hermite midpoint
 * `(start + end) / 2 + h (startDerivative - endDerivative) / 8`), rounded to 0.1 mm. Valid open arcs
 * include their final endpoint and remain open; only curves the pack's audit marks broken are left out. A region keeps the lowest section of each `step`
 * of height, so the head's event sections, thousands within a few centimetres, thin to an even
 * stack.
 *
 * @param id Reference id, such as `f1`.
 * @param step Least height between kept sections, mm, positive.
 * @returns The pack; a missing pack throws naming the ids present.
 *
 * @evidence contracts/common.md#principled-implementation Reads audited Hermite spans from the private pack, samples their starts and midpoints with the exact midpoint identity, and retains an open curve's final endpoint without closing it. The 0.1 mm rounding and height thinning are display conventions.
 * @evidence contracts/common.md#clear-and-simple-design This loader owns file discovery and sampling; reference drawing and geometric diagnostics consume the returned pack separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rejects a missing pack, excludes only source curves marked broken and invents no skin across an opening or absent file.
 * @evidence contracts/common.md#meaningful-documentation States source location, quality selection, endpoint treatment, sampling/thinning and failure behavior.
 * @evidence contracts/performance.md#efficient-algorithms Parsing and sampling scale with file bytes and Hermite spans; file names and S section heights are sorted, with O(S log S) height sorting before one thinning pass. Region fetches run concurrently, files within a region sequentially.
 * @evidence contracts/performance.md#reuse-equivalent-work The loaded module retains only the glob's served-URL functions; pack bytes are fetched with no-store for each comparison request so edited references are observed independently of cached Human construction.
 * @evidence contracts/performance.md#bound-retention-and-release-resources File URLs are bounded by the checkout's private pack inventory and released with the module. Parsed file records are temporary; the returned O(P) sampled pack belongs to the comparison request, with no file or GPU handle retained here.
 */
export async function HumanDebugReferenceFiles(id: string, step: number): Promise<IHumanDebugReferencePack> {
  const index: string | undefined = Object.keys(INDEXES).find((file: string): boolean => file.endsWith(`/curves/${id}/index.json`));
  if (index === undefined)
    throw new Error(
      "No private reference pack " + id + " in .references/curves; present: " +
        (Object.keys(INDEXES).map((file: string): string => file.split("/").slice(-2, -1)[0]!).join(", ") || "none"),
    );
  const text: string = await (await fetch(await INDEXES[index]!(), { cache: "no-store" })).text();
  const stature: number = Number(/"statureMm":(-?[0-9.]+)/.exec(text)?.[1] ?? NaN);
  const regions: IHumanDebugReferencePack.IRegion[] = await Promise.all(
    REGIONS.map(async (name: string): Promise<IHumanDebugReferencePack.IRegion> => {
      const files: string[] = Object.keys(FILES)
        .filter((file: string): boolean => file.includes(`/curves/${id}/sections/${name}/`))
        .sort((a: string, b: string): number => a.localeCompare(b));
      const sections: IHumanDebugReferencePack.ISection[] = [];
      for (const file of files) {
        const document: { sections: { coordinateMm: number; curves: { kind: string; quality?: { status: string }; curve: ICurve }[] }[] } = await (
          await fetch(await FILES[file]!(), { cache: "no-store" })
        ).json();
        for (const section of document.sections)
          sections.push({
            y: section.coordinateMm,
            loops: section.curves
              .filter((c: { kind: string; quality?: { status: string } }): boolean => c.kind === "closed" && c.quality?.status !== "broken")
              .map((c: { curve: ICurve }): number[] => sample(c.curve, true)),
            arcs: section.curves
              .filter((c: { kind: string; quality?: { status: string } }): boolean => c.kind !== "closed" && c.quality?.status !== "broken")
              .map((c: { curve: ICurve }): number[] => sample(c.curve, false)),
          });
      }
      sections.sort((a: IHumanDebugReferencePack.ISection, b: IHumanDebugReferencePack.ISection): number => a.y - b.y);
      const thinned: IHumanDebugReferencePack.ISection[] = [];
      for (const s of sections) if ((s.loops.length !== 0 || (s.arcs?.length ?? 0) !== 0) && (thinned.length === 0 || s.y >= thinned[thinned.length - 1]!.y + step)) thinned.push(s);
      return { name, sections: thinned };
    }),
  );
  return { id, stature, step, regions };
}

/**
 * Span starts and midpoints, plus an open curve's last endpoint, as flat `x, z` pairs rounded to 0.1 mm.
 *
 * @evidence contracts/common.md#principled-implementation Uses the Hermite midpoint identity with each span's declared phase width; a closed path wraps to its first point, while an open one needs the last recorded end explicitly.
 * @evidence contracts/common.md#clear-and-simple-design One sampler serves both closure kinds without changing their source coordinates or fitting between curves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retains the existing display rounding and missing-width convention of zero; adds no closure edge or source-specific correction.
 * @evidence contracts/common.md#meaningful-documentation States flat coordinate order, mm rounding and endpoint ownership.
 * @evidence contracts/performance.md#efficient-algorithms One O(H) pass emits two sampled points per Hermite span and one extra endpoint for an open path.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads each span's supplied values directly; no generated Human or second interpolation solve is used.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one O(H) array and retains no source span or scratch state after the call.
 */
function sample(curve: ICurve, closed: boolean): number[] {
  const out: number[] = [];
  const round = (v: number): number => Math.round(v * 10) / 10;
  curve.spans.forEach((s: ICurve["spans"][number], i: number): void => {
    const h: number = curve.phaseIntervals[i] ?? 0;
    out.push(round(s.start[0]!), round(s.start[2]!));
    out.push(
      round((s.start[0]! + s.end[0]!) / 2 + (h * (s.startDerivative[0]! - s.endDerivative[0]!)) / 8),
      round((s.start[2]! + s.end[2]!) / 2 + (h * (s.startDerivative[2]! - s.endDerivative[2]!)) / 8),
    );
  });
  const last: ICurve["spans"][number] | undefined = curve.spans[curve.spans.length - 1];
  if (!closed && last !== undefined) out.push(round(last.end[0]!), round(last.end[2]!));
  return out;
}
