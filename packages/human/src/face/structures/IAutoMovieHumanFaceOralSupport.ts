import type { IAutoMovieHumanFaceOralCrownSupport } from "./IAutoMovieHumanFaceOralCrownSupport";
import type { IAutoMovieHumanFaceOralTongueAttachmentSupport } from "./IAutoMovieHumanFaceOralTongueAttachmentSupport";

/**
 * Publisher-qualified native dental and lingual source used by the oral
 * generator. The source fingerprint is separate from the canonical skin
 * partition; native dental ordinals never borrow skin sample identities.
 * Current oral consumers check the coarse registered source IDs, canonical
 * generation and exact crown/cervical witnesses. Hash strings name producer
 * provenance; assertHumanFaceOralSupport does not recompute the complete native
 * record hash. The optional ventral tongue record is not currently consumed.
 *
 * @evidence contracts/common.md#principled-implementation assertHumanFaceOralSupport qualifies the current Human.teeth_base/Human.tongue01 source pair through canonical generation, CC0 declaration and exact crown/port witnesses, with dental identities distinct from skin samples.
 * @evidence contracts/common.md#clear-and-simple-design Source surfaces, provenance, crown witnesses and optional ventral registration have separate fields; the latter remains declared support rather than a hidden generated attachment.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Generation/hash syntax alone proves neither legal provenance nor anatomy; the current checker does not recompute dentalNativeSha256 and the oral generator does not consume tongueAttachmentSupport, so no attached floor boundary is certified by this record.
 * @evidence contracts/common.md#meaningful-documentation Current source restrictions, exact versus declared provenance checks and the unconsumed optional boundary are explicit alongside native crown ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The support record performs no source hashing, crown extraction or oral generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Generation/hash identities are producer metadata rather than runtime caching implemented here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The publisher owns source witness arrays; this schema acquires no licensed asset, dental mesh or query.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOralSupport {
  /** Same canonical source generation as the published connected assembly. */
  generation: string;

  /** Licensed raw input and registration receipt SHA-256 identities. */
  sourceSha256: string[];

  /** Authoritative license of the canonical native dental/tongue source. */
  sourceLicense: "CC0-1.0";

  /** Existing native dental surface identity. */
  dentalSurface: string;

  /** Existing native tongue surface identity. */
  tongueSurface: string;

  /** SHA-256 of the producer's exact neutral/target/attachment/region record. */
  dentalNativeSha256: string;

  /** Native permanent crown witnesses; source ports, not clinical CEJ. */
  crowns: IAutoMovieHumanFaceOralCrownSupport[];

  /** Optional publisher ventral material boundary; current oral generators do not consume it, and omission supplies no loop. */
  tongueAttachmentSupport?: IAutoMovieHumanFaceOralTongueAttachmentSupport;
}
