import { createEvidenceConfig } from "@automovie/evidence";
import { resolve } from "node:path";

/**
 * Four vertical shorts run settings → screenplay (`short-with-settings`).
 *
 * Settings construction and the research studies are answered; the
 * screenplay stages stay disabled drafts until their complete bodies exist.
 * `skills` names this production's own `.agents/skills` tree, whose bundled
 * contracts the answers cite.
 */
export default createEvidenceConfig({
  location: import.meta.dirname,
  skills: resolve(import.meta.dirname, ".agents/skills"),
  research: "evidence",
  narrative: {
    mode: "short-with-settings",
    construction: { settings: "evidence" },
  },
});
