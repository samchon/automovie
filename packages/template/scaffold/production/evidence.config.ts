import { createEvidenceConfig } from "@automovie/evidence";

/**
 * The default project checks source and tests without selecting a narrative.
 *
 * `skills` names the shared `.agents/skills` tree whose bundled contracts the answers cite: this project's own, or its workspace root's.
 */
export default createEvidenceConfig({
  location: import.meta.dirname,
  skills: "{{skills}}",
});
