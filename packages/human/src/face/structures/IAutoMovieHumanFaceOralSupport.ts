import type { IAutoMovieHumanFaceOralCrownSupport } from "./IAutoMovieHumanFaceOralCrownSupport";
import type { IAutoMovieHumanFaceOralTongueAttachmentSupport } from "./IAutoMovieHumanFaceOralTongueAttachmentSupport";

/**
 * Publisher-qualified native dental and lingual source used by the oral
 * generator. The source fingerprint is separate from the canonical skin
 * partition; native dental ordinals never borrow skin sample identities.
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

  /** Optional same-source ventral material boundary. Omission leaves tongue/floor attachment unregistered, rather than inventing a loop. */
  tongueAttachmentSupport?: IAutoMovieHumanFaceOralTongueAttachmentSupport;
}
