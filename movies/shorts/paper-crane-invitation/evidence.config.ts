import { createEngineeringClaims, createEvidenceConfig } from "@automovie/evidence";

/** Current construction is closed; engineering also selects maintained executable scripts. */
const engineering: ReturnType<typeof createEngineeringClaims> = createEngineeringClaims();
engineering[0]!.files.push("scripts/**/*.ts");
export default createEvidenceConfig({
  location: import.meta.dirname,
  claims: engineering,
  narrative: {
    mode: "short-with-settings",
    construction: { settings: "evidence", screenplay: "evidence" },
  },
});
