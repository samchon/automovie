import {
  createEngineeringClaims,
  createEvidenceConfig,
} from "@automovie/evidence";

/** Production source checks; this does not renew narrative acceptance. */
export default createEvidenceConfig({
  location: import.meta.dirname,
  claims: createEngineeringClaims({
    common: null,
    design: "contracts/common.md",
    implementation: "contracts/common.md",
    tests: "contracts/testing.md",
  }),
});
