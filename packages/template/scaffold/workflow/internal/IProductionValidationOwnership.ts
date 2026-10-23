import type { IEvidenceConfig } from "@wrtnlabs/evidence";

import type { IProductionClaimOwner } from "../IProductionClaimOwner";

/** Captures immutable policy text and original object identities at construction. */
export interface IProductionValidationOwnership {
  /** Serialized graph before callers can mutate it. */
  config: string;
  /** Serialized production policy at factory capture. */
  props: string;
  /** Original claim object references in their authored order. */
  claims: IEvidenceConfig["claims"];
  /** Factory-assigned owners indexed by original claim position. */
  owners: IProductionClaimOwner[];
}
