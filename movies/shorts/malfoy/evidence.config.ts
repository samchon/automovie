import { createEvidenceConfig } from "@automovie/evidence";
import { resolve } from "node:path";

/**
 * The four shorts follow the short-with-settings route: the settings and the
 * four screenplay files have complete drafts, so their construction and the
 * screenplays' naturalness stage are on; the research studies exist; and the
 * entities, behaviors and compositions that realize them answer their
 * development contracts. `skills` names this production's own shared
 * `.agents/skills` tree, whose bundled contracts the answers cite.
 */
export default createEvidenceConfig({
  location: import.meta.dirname,
  skills: resolve(import.meta.dirname, ".agents/skills"),
  development: {
    entities: "evidence",
    behaviors: "evidence",
    composition: "evidence",
  },
  research: "evidence",
  narrative: {
    mode: "short-with-settings",
    construction: { settings: "evidence", screenplay: "evidence" },
    naturalness: { screenplay: "evidence" },
  },
});
