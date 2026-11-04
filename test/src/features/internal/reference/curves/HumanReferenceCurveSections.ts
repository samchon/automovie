import path from "node:path";

import type { HumanReferenceCurvePack } from "./HumanReferenceCurvePack";
import { HumanReferenceCurveQuality } from "./HumanReferenceCurveQuality";
import { HumanReferenceCurveStore } from "./HumanReferenceCurveStore";

/**
 * The horizontal sections of the reference curve pack: its index, the region
 * labels, and a reader of the sections in a height range and region set. A
 * reader answers empty when the checkout holds no pack.
 */
export namespace HumanReferenceCurveSections {
  /** A reference's horizontal-section index, read once; undefined when absent. */
  export function index(id: string): HumanReferenceCurvePack.IIndex | undefined {
    const file: string = path.join(HumanReferenceCurveStore.directory(id), "index.json");
    if (!HumanReferenceCurveStore.exists(file)) return undefined;

    return HumanReferenceCurveStore.read<HumanReferenceCurvePack.IIndex>(file);
  }

  /** The region labels present in a reference's pack, sorted. */
  export function regions(id: string): string[] {
    const files: HumanReferenceCurvePack.IFile[] = index(id)?.files ?? [];

    return [...new Set(files.map((f: HumanReferenceCurvePack.IFile): string => f.region))].sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
  }

  /**
   * The horizontal sections in a height range and region set, in height
   * order, reading only the region files that overlap the query. Only `ok`
   * curves unless `query.quality` asks for more; a section left with no
   * curve is omitted. Empty when the pack is absent.
   */
  export function sections(id: string, query: HumanReferenceCurvePack.IQuery = {}): HumanReferenceCurvePack.ISection[] {
    const found: HumanReferenceCurvePack.IIndex | undefined = index(id);
    if (found === undefined) return [];

    const from: number = query.fromMm ?? -Infinity;
    const to: number = query.toMm ?? Infinity;
    const keep: (audited: { quality?: HumanReferenceCurveQuality.IQuality }) => boolean = HumanReferenceCurveQuality.accepts(query.quality);
    const wanted: Set<string> | undefined =
      query.region === undefined ? undefined : new Set(typeof query.region === "string" ? [query.region] : query.region);
    const out: Map<number, HumanReferenceCurvePack.ISection> = new Map();

    for (const f of found.files) {
      // A file outside the height range or the region set is never opened.
      if (f.toMm < from || f.fromMm > to || (wanted !== undefined && !wanted.has(f.region))) continue;

      const body: HumanReferenceCurvePack.IRegionFile = HumanReferenceCurveStore.read<HumanReferenceCurvePack.IRegionFile>(
        path.join(HumanReferenceCurveStore.directory(id), f.file),
      );
      for (const s of body.sections) {
        if (s.coordinateMm < from || s.coordinateMm > to) continue;

        const loops: HumanReferenceCurvePack.ILoop[] = s.curves.filter(
          (c: HumanReferenceCurvePack.ILoop): boolean => (query.kind === undefined || c.kind === query.kind) && keep(c),
        );
        if (loops.length === 0) continue;

        const section: HumanReferenceCurvePack.ISection = out.get(s.index) ?? { index: s.index, coordinateMm: s.coordinateMm, loops: [] };
        section.loops.push(...loops);
        out.set(s.index, section);
      }
    }

    const list: HumanReferenceCurvePack.ISection[] = [...out.values()].sort(
      (a: HumanReferenceCurvePack.ISection, b: HumanReferenceCurvePack.ISection): number => a.index - b.index,
    );
    for (const s of list)
      s.loops.sort((a: HumanReferenceCurvePack.ILoop, b: HumanReferenceCurvePack.ILoop): number =>
        a.kind === b.kind ? a.ordinal - b.ordinal : a.kind === "closed" ? -1 : 1,
      );

    return list;
  }
}
