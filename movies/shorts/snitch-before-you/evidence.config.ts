import { createEvidenceConfig } from "@automovie/evidence";

/** Compact settings and screenplay retain the default engineering checks. */
export default createEvidenceConfig({
  location: import.meta.dirname,
  narrative: {
    mode: "short-with-settings",
    construction: { settings: "evidence", screenplay: "evidence" },
    naturalness: { screenplay: "evidence" },
    claims: [
      {
        name: "The commissioned authoring handoff answers delivery questions",
        type: "markdown",
        files: ["docs/review/delivery.md"],
        symbol: "file",
        reference: {
          type: "markdown",
          root: ".agents/skills/contracts",
          files: ["delivery.md"],
          symbol: "h2",
          checklist: true,
          noEvidenceExclude: true,
        },
      },
    ],
  },
});
