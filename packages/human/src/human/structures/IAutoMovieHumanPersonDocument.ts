import type { IAutoMovieHumanBodyBasisDocument } from "../../body/structures/IAutoMovieHumanBodyBasisDocument";
import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonHeadShape } from "./IAutoMovieHumanPersonHeadShape";

/**
 * Saved person request pairing face/body document vocabularies and their actual basis identities. Person identity/name remain distinct from inner document identities. The record embeds no photograph, mesh or image. Actual source context must remain unchanged during compiled evaluation; the interface neither deep-freezes it nor certifies clinical anatomy/current appearance.
 *
 * Body cheek albedo derives from the face's existing linear skin material/override before pigmentation-field lifting; explicitly authored body skinColour refuses duplicate authority. Site fields retain their own optical conventions. Legacy pairs use captured source neck correspondence; registered generations share source skin and body rig carry. Person headShape fields are registered source-neutral mm/degree differences routed through one actual body channel, even at zero, with no independent inner reconstruction.
 *
 * Omitted population leaves legacy face/body age/sex axes independent. Linked legacy derivation projects body macros through its source-node mapping and refuses duplicate face axes. Registered nonempty aliases/drivers instead follow their own gain branch and do not also execute linked derivation. Source coefficients and linked intent establish neither measured chronological age/sex nor clinical proportional consistency.
 *
 * @evidence contracts/common.md#principled-implementation Separate actual anatomy requests share explicit colour, source-head and registered coefficient authorities while retaining their original source vocabularies/identities.
 * @evidence contracts/common.md#clear-and-simple-design Canonical face/body/headShape records and one optional population mode compose person intent without another coordinate or raw asset representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Duplicate colour/registered axes refuse, head traits require actual source authority, and linked/driver coefficients do not fabricate measured demographics or unexecuted branch behavior.
 * @evidence contracts/common.md#meaningful-documentation Prose states input-only identity, pre-pigmentation linear colour, mm/degree trait ownership and distinct legacy/registered population semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This saved request schema executes no admission, coefficient projection or person geometry evaluation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Document equivalence and compiled-source reuse are runtime/builder behavior rather than caching implemented by this record.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no photograph, asset stream or task; callers own ordinary nested request records and actual loaded source contexts separately.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonDocument {
  /** Stable identity of this person. */
  id: string;

  /** Display name, independent of either basis. */
  name: string;

  /** The face, against the face basis the person builder was compiled with. */
  face: IAutoMovieHumanFaceBasisDocument;

  /** The body, against the body basis the person builder was compiled with, with no `skinColour` of its own. */
  body: IAutoMovieHumanBodyBasisDocument;

  /**
   * Source-neutral exterior differences in registered mm/degrees. Every present field, including zero, needs the shared source's actual body-channel registration; it supplies no personal mesh or clinical observation.
   */
  headShape?: IAutoMovieHumanPersonHeadShape;

  /**
   * Linked legacy population derives face globalAgeStructure/globalSexualDimorphism from body macroAge/macroGender and refuses explicitly authored face axes. Omission keeps independent legacy axes. Nonempty registered aliases/drivers use their separate actual gain branch; this flag does not force legacy conversion there.
   */
  population?: "linked";
}
