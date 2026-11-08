import { createEvidenceConfig } from "@automovie/evidence";

/** Retain engineering checks while compact settings is authored before screenplay. */
export default createEvidenceConfig({
  location: import.meta.dirname,
  narrative: {
    mode: "short-with-settings",
    construction: { settings: "evidence", screenplay: "evidence" },
    naturalness: { screenplay: "evidence" },
  },
});
