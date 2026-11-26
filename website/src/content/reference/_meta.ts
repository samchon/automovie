import type { MetaRecord } from "nextra";

/**
 * The reference's pages, for a developer or a coding agent that writes against
 * the packages, in the order its sidebar lists them: the pages, the catalogues
 * of what a film is composed from, and the API documents.
 */
const meta: MetaRecord = {
  index: "Overview",
  packages: "Packages",
  cli: "CLI",
  evidence: "Evidence configuration",
  motion: "Motion API",

  "-- catalogues": { type: "separator", title: "Catalogues" },
  "gallery-overview": { title: "Gallery", href: "/gallery/" },
  "motions-catalogue": { title: "Motions", href: "/motions/" },
  "archetypes-catalogue": { title: "Archetypes", href: "/archetypes/" },
  "scene-studies": { title: "Scene studies", href: "/scenes/" },

  "-- appendix": { type: "separator", title: "Appendix" },
  // Static TypeDoc pages, not a route of this app: a full address, which
  // Next does not prefetch as a route.
  api: {
    title: "⇲ API documents",
    href: "https://samchon.github.io/automovie/api/",
  },
  examples: {
    title: "⇲ Example productions",
    href: "https://github.com/samchon/automovie-examples",
  },
};
export default meta;
