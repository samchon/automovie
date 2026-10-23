import type { IEvidenceConfig } from "@wrtnlabs/evidence";

import { engineeringClaims } from "./workflow/engineeringClaims";

/** The default project checks source and tests without selecting a narrative. */
export default {
  severity: "error",
  claims: engineeringClaims,
} satisfies IEvidenceConfig;
