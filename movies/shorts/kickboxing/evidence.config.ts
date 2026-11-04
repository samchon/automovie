import { createEvidenceConfig } from "@automovie/evidence";

/** Compact individually owned settings precede the complete screenplay. */
export default createEvidenceConfig({
  location: import.meta.dirname,
  narrative: {
    mode: "short-with-settings",
    construction: { settings: "evidence", screenplay: "evidence" },
    naturalness: { screenplay: "evidence" },
  },
});
