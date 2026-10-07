import type { IHumanSourceEditedEndpoint } from "./IHumanSourceEditedEndpoint.ts";
import type { IHumanSourceEditedVertices } from "./IHumanSourceEditedVertices.ts";
import type { IHumanSourceRederivedEndpoint } from "./IHumanSourceRederivedEndpoint.ts";

/**
 * What the authoring stages of one generation deliberately changed over the
 * sampled and replayed source, in published addresses.
 *
 * Each stage that moves a neutral vertex or edits an endpoint row records it
 * here, so a comparison with a generation compiled without those stages can
 * tell an intended edit from an unintended drift. Everything a receipt does
 * not list is claimed unchanged: an empty receipt claims the two generations
 * hold the same coordinates everywhere.
 *
 * @author Samchon
 */
export interface IHumanSourceEditReceipt {
  /** Neutral positions that were moved. */
  positions: IHumanSourceEditedVertices[];

  /** Endpoint rows that were edited. */
  endpoints: IHumanSourceEditedEndpoint[];

  /** Vertices whose row was re-derived in every endpoint of their surface. */
  endpointVertices: IHumanSourceEditedVertices[];

  /**
   * Endpoints a producer derives from the edited neutral as a whole: fields
   * diffused or filtered over the body view, whose change is not confined to
   * the edited vertices.
   */
  rederivedEndpoints: IHumanSourceRederivedEndpoint[];
}
