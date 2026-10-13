import type { IAutoMovieHumanFaceOralSupport as ImportedIAutoMovieHumanFaceOralSupport, IAutoMovieHumanFaceBasisSurface as ImportedIAutoMovieHumanFaceBasisSurface, IAutoMovieHumanFaceOralCrownSupport as ImportedIAutoMovieHumanFaceOralCrownSupport } from "@automovie/human";
import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOralCrown } from "./IHumanFaceOralCrown";
import { isHumanFaceOralSourceSha256 } from "./isHumanFaceOralSourceSha256";

/**
 * Admit the publisher's native dental registration against its actual source. Exact cervical rows and component ordinals distinguish authority from a generation label. The raw-input fingerprint remains producer provenance; no runtime anatomical validity follows from a SHA-256 string.
 *
 * @evidence contracts/common.md#principled-implementation Exact publisher crown vertices/cervical rows/neutral coordinates and canonical generation are compared against native source registration.
 * @evidence contracts/common.md#clear-and-simple-design Provenance syntax is distinct from geometric support authority and later anatomical/contact admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts SHA format is not runtime raw-input digest verification or clinical validity; malformed ownership/registration refuses rather than guessed source support.
 * @evidence contracts/common.md#meaningful-documentation Named CC0 source/license and native dental/tongue owners retain original ordinal domains.
 * @evidence contracts/performance.md#efficient-algorithms Generation scanning is linear in surfaces and witness lookup currently costs O(crowns squared) plus vertex/port comparisons.
 * @evidence contracts/performance.md#reuse-equivalent-work One shared digest-syntax owner is reused and all crown comparisons use the same native surface.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary generation/id sets remain call-local and neither source arrays nor witness records are mutated/retained.
 *
 * @author Samchon
 */
export function assertHumanFaceOralSupport(
  basis: IAutoMovieHumanFaceBasis,
  crowns: readonly IHumanFaceOralCrown[],
): void {
  const support: ImportedIAutoMovieHumanFaceOralSupport | undefined = basis.oralSupport;
  if (
    support === undefined ||
    support.dentalSurface !== "Human.teeth_base" ||
    support.tongueSurface !== "Human.tongue01"
  )
    throw new Error(
      "Oral assembly needs its producer-qualified native dental and tongue registration.",
    );
  if (
    support.generation.trim() === "" ||
    support.sourceLicense !== "CC0-1.0" ||
    !isHumanFaceOralSourceSha256(support.dentalNativeSha256) ||
    support.sourceSha256.length === 0 ||
    support.sourceSha256.some((hash: string): boolean => !isHumanFaceOralSourceSha256(hash))
  )
    throw new Error(
      "Oral assembly needs exact publisher generation and source fingerprint identities.",
    );
  const generations: Set<string> = new Set(
    basis.surfaces.flatMap((surface: ImportedIAutoMovieHumanFaceBasisSurface): string[] =>
      surface.sourcePartition === undefined
        ? []
        : [surface.sourcePartition.generation],
    ),
  );
  if (generations.size !== 1 || !generations.has(support.generation))
    throw new Error(
      "Oral source registration does not share the connected assembly's canonical generation.",
    );
  const source: ImportedIAutoMovieHumanFaceBasisSurface = basis.surfaces.find(
    (surface: ImportedIAutoMovieHumanFaceBasisSurface): boolean => surface.id === support.dentalSurface,
  )!;
  if (
    support.crowns.length !== crowns.length ||
    new Set(support.crowns.map((crown: ImportedIAutoMovieHumanFaceOralCrownSupport): "11" | "12" | "13" | "18" | "14" | "16" | "15" | "17" | "21" | "22" | "23" | "28" | "24" | "26" | "25" | "27" | "31" | "32" | "33" | "38" | "34" | "36" | "35" | "37" | "41" | "42" | "43" | "48" | "44" | "46" | "45" | "47" => crown.id)).size !== crowns.length
  )
    throw new Error(
      "Oral source registration needs one witness for every source crown.",
    );
  for (const crown of crowns) {
    const witness: ImportedIAutoMovieHumanFaceOralCrownSupport | undefined = support.crowns.find((one: ImportedIAutoMovieHumanFaceOralCrownSupport): boolean => one.id === crown.id);
    if (
      witness === undefined ||
      witness.owner !== (crown.mandibular ? "jaw" : "head") ||
      witness.vertices.length !== crown.vertices.length ||
      witness.vertices.some((v: number, k: number): boolean => v !== crown.vertices[k]) ||
      witness.cervical.length !== crown.cervical.length ||
      witness.cervical.some((v: number, k: number): boolean => v !== crown.cervical[k]) ||
      witness.neutralCervicalPositions.length !== 3 * crown.cervical.length ||
      witness.neutralCervicalPositions.some(
        (value: number, k: number): boolean =>
          value !==
          source.positions[3 * crown.cervical[Math.floor(k / 3)] + (k % 3)],
      )
    )
      throw new Error(
        "Oral source crown witness differs from native geometry: " + crown.id,
      );
  }
}
