import type { IEvidenceClaim } from "@wrtnlabs/evidence";

import type { IProductionConfigProps } from "../IProductionConfigProps";
import { collectProductionClaims } from "./collectProductionClaims";

/*
 * Creates the structural claims of one production for native Evidence.
 *
 * Returns the same full population used by createProductionConfig. Source stage
 * declarations do not certify independent review or creative approval.
 */
export function createProductionClaims(
  props: IProductionConfigProps,
): IEvidenceClaim[] {
  return collectProductionClaims(props);
}
