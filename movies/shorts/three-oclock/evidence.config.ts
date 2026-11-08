import { createEvidenceConfig } from "@automovie/evidence";

/** Current scene replacement follows the independently closed five-unit canon. */
export default createEvidenceConfig({
  location: import.meta.dirname,
  narrative: {
    mode: "short-with-settings",
    construction: { settings: "evidence", screenplay: "evidence" },
    naturalness: { screenplay: "evidence" },
  },
});
