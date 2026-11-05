import {
  createEngineeringClaims,
  createEvidenceConfig,
} from "@automovie/evidence";

/** Compact individually owned settings precede the complete screenplay. */
export default createEvidenceConfig({
  location: import.meta.dirname,
  claims: createEngineeringClaims({
    common: null,
    design: "contracts/common.md",
    implementation: "contracts/common.md",
    tests: "contracts/testing.md",
  }),
  narrative: {
    mode: "short-with-settings",
    construction: { settings: "evidence", screenplay: "evidence" },
    naturalness: { screenplay: "evidence" },
  },
});
