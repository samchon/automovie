import type { HumanReferenceSurface } from "./HumanReferenceSurface";
import { HumanReferenceSurfaceExtras } from "./HumanReferenceSurfaceExtras";
import { HumanReferenceSurfaceGenerateds } from "./HumanReferenceSurfaceGenerateds";
import { HumanReferenceSurfaceNaming } from "./HumanReferenceSurfaceNaming";
import { HumanReferenceSurfaceOffsets } from "./HumanReferenceSurfaceOffsets";
import type { HumanReferenceSurfacePair } from "./HumanReferenceSurfacePair";
import { HumanReferenceSurfacePatches } from "./HumanReferenceSurfacePatches";
import { HumanReferenceSurfaceReferences } from "./HumanReferenceSurfaceReferences";
import { HumanReferenceSurfaceRegions } from "./HumanReferenceSurfaceRegions";

/**
 * The two-way comparison of a generated skin with its reference, assembled
 * from the pieces that read each direction. See `HumanReferenceSurface` for
 * the method and its premises.
 */
export namespace HumanReferenceSurfaceCompare {
  /**
   * Compares a generated skin with a reference, both ways, and reports every
   * patch beyond its limit and every region's statistics.
   *
   * @param props The skins, the labels and the limits.
   * @returns The report, with its patches sorted by person, region and descending area.
   */
  export function compare(props: HumanReferenceSurface.ICompareProps): HumanReferenceSurface.IReport {
    const { person, generated, reference, labels, limit }: HumanReferenceSurface.ICompareProps = props;
    const n: number = reference.P.length / 3;
    if (limit.length !== n) throw new Error(`${person}: ${limit.length} limits for ${n} reference vertices`);

    const ref: HumanReferenceSurfacePair.IReferenceSide = HumanReferenceSurfaceReferences.side(reference);
    const naming: HumanReferenceSurfaceNaming = new HumanReferenceSurfaceNaming(labels.joints);
    const region: Int32Array = naming.label(reference.P, reference.I, labels.tri, labels.chains);
    const gen: HumanReferenceSurfacePair.IGeneratedSide = HumanReferenceSurfaceGenerateds.side(generated);

    // Reference to generated: the signed offsets, and the patches where they pass their limits.
    const read: HumanReferenceSurfaceOffsets.IOffsets = HumanReferenceSurfaceOffsets.offsets(ref, gen, limit);
    const patches: HumanReferenceSurface.IPatch[] = HumanReferenceSurfacePatches.group({
      person,
      surface: "reference",
      P: ref.P,
      I: ref.I,
      normal: ref.normal,
      area: ref.area,
      flag: read.flag,
      value: read.deviation,
      limit,
      region,
      names: naming.names,
      fallback: read.fallback,
    });

    // Generated to reference: geometry the reference normals never reach.
    const extra: HumanReferenceSurfaceExtras.IExtras = HumanReferenceSurfaceExtras.extras(ref, gen, limit, read.flag);
    if (extra.flag.some((f: number): boolean => f !== 0))
      patches.push(
        ...HumanReferenceSurfacePatches.group({
          person,
          surface: "generated",
          P: gen.P,
          I: gen.I,
          normal: gen.normal,
          area: gen.area,
          flag: extra.flag,
          value: extra.value,
          limit: extra.limit,
          region: naming.label(gen.P, generated.I, generated.tri, generated.chains),
          names: naming.names,
          fallback: new Uint8Array(gen.count),
        }),
      );
    patches.sort(
      (x: HumanReferenceSurface.IPatch, y: HumanReferenceSurface.IPatch): number =>
        x.person.localeCompare(y.person) || x.region.localeCompare(y.region) || y.area - x.area,
    );

    return {
      person,
      vertices: n,
      generated: gen.count,
      deviation: read.deviation,
      patches,
      regions: HumanReferenceSurfaceRegions.statistics({
        names: naming.names,
        region,
        deviation: read.deviation,
        area: ref.area,
        fallback: read.fallback,
        flag: read.flag,
        skin: ref.skin,
        limit,
      }),
      fallback: read.fallback.reduce((s: number, f: number): number => s + f, 0),
      interior: ref.skin.reduce((s: number, k: number): number => s + 1 - k, 0),
    };
  }
}
