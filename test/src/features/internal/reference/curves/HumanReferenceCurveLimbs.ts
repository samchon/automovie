import path from "node:path";

import type { HumanReferenceCurvePack } from "./HumanReferenceCurvePack";
import { HumanReferenceCurveQuality } from "./HumanReferenceCurveQuality";
import { HumanReferenceCurveStore } from "./HumanReferenceCurveStore";

/**
 * The limb sections of the reference curve pack (f1 only): planes normal to
 * the limb, digit and trunk axes, listed by `limbs/index.json`. A reader
 * answers empty when the checkout holds no limb pack.
 */
export namespace HumanReferenceCurveLimbs {
  /** The limb-section index; undefined when absent. */
  export function index(id: string): HumanReferenceCurvePack.ILimbIndex | undefined {
    const file: string = path.join(HumanReferenceCurveStore.directory(id), "limbs/index.json");
    if (!HumanReferenceCurveStore.exists(file)) return undefined;

    return HumanReferenceCurveStore.read<HumanReferenceCurvePack.ILimbIndex>(file);
  }

  /**
   * The stations of one limb family (by name, e.g. `arm_l-v2`) in a station
   * range. Each station keeps only its `ok` loops unless `query.quality`
   * asks for more; stations themselves are all returned. Empty when the
   * family is not in the pack.
   */
  export function stations(
    id: string,
    family: string,
    query: HumanReferenceCurvePack.IStationQuery = {},
  ): HumanReferenceCurvePack.IStation[] {
    const found: HumanReferenceCurvePack.ILimbFamily | undefined = index(id)?.families.find(
      (f: HumanReferenceCurvePack.ILimbFamily): boolean => f.name === family,
    );
    if (found === undefined) return [];

    const from: number = query.from ?? 0;
    const to: number = query.to ?? Infinity;
    const keep: (audited: { quality?: HumanReferenceCurveQuality.IQuality }) => boolean = HumanReferenceCurveQuality.accepts(query.quality);
    const out: HumanReferenceCurvePack.IStation[] = [];

    for (const f of found.files) {
      // A file outside the station range is never opened.
      if (f.lastStation < from || f.firstStation > to) continue;

      const body: HumanReferenceCurvePack.IStationFile = HumanReferenceCurveStore.read<HumanReferenceCurvePack.IStationFile>(
        path.join(HumanReferenceCurveStore.directory(id), "limbs", f.file),
      );
      for (const s of body.stations)
        if (s.station >= from && s.station <= to) out.push({ ...s, loops: s.loops.filter(keep) });
    }

    return out.sort((a: HumanReferenceCurvePack.IStation, b: HumanReferenceCurvePack.IStation): number => a.station - b.station);
  }
}
