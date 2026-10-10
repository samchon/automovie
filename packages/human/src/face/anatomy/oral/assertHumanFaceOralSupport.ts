import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOralCrown } from "./IHumanFaceOralCrown";
import { isHumanFaceOralSourceSha256 } from "./isHumanFaceOralSourceSha256";

/**
 * Admit the publisher's native dental registration against its actual source.
 * Exact cervical rows and component ordinals distinguish authority from a
 * generation label. The raw-input fingerprint remains producer provenance;
 * no runtime anatomical validity follows from a SHA-256 string.
 * @author Samchon
 */
export function assertHumanFaceOralSupport(
  basis: IAutoMovieHumanFaceBasis,
  crowns: readonly IHumanFaceOralCrown[],
): void {
  const support = basis.oralSupport;
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
    support.sourceSha256.some((hash) => !isHumanFaceOralSourceSha256(hash))
  )
    throw new Error(
      "Oral assembly needs exact publisher generation and source fingerprint identities.",
    );
  const generations = new Set(
    basis.surfaces.flatMap((surface) =>
      surface.sourcePartition === undefined
        ? []
        : [surface.sourcePartition.generation],
    ),
  );
  if (generations.size !== 1 || !generations.has(support.generation))
    throw new Error(
      "Oral source registration does not share the connected assembly's canonical generation.",
    );
  const source = basis.surfaces.find(
    (surface) => surface.id === support.dentalSurface,
  )!;
  if (
    support.crowns.length !== crowns.length ||
    new Set(support.crowns.map((crown) => crown.id)).size !== crowns.length
  )
    throw new Error(
      "Oral source registration needs one witness for every source crown.",
    );
  for (const crown of crowns) {
    const witness = support.crowns.find((one) => one.id === crown.id);
    if (
      witness === undefined ||
      witness.owner !== (crown.mandibular ? "jaw" : "head") ||
      witness.vertices.length !== crown.vertices.length ||
      witness.vertices.some((v, k) => v !== crown.vertices[k]) ||
      witness.cervical.length !== crown.cervical.length ||
      witness.cervical.some((v, k) => v !== crown.cervical[k]) ||
      witness.neutralCervicalPositions.length !== 3 * crown.cervical.length ||
      witness.neutralCervicalPositions.some(
        (value, k) =>
          value !==
          source.positions[3 * crown.cervical[Math.floor(k / 3)] + (k % 3)],
      )
    )
      throw new Error(
        "Oral source crown witness differs from native geometry: " + crown.id,
      );
  }
}
