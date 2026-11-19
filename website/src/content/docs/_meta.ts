import type { MetaRecord } from "nextra";

/**
 * The guide's pages, for the person who makes a film with a coding agent, in
 * the order its sidebar lists them. The packages' APIs and the formats an
 * agent writes are in the reference, a tree of its own.
 */
const meta: MetaRecord = {
  index: "Introduction",
  setup: "Setup",
  "first-film": "Your first film",

  "-- guides": { type: "separator", title: "Guides" },
  screenplay: "Screenplay",
  "motion-as-code": "Motion as code",
  delivery: "Delivery",

  "-- more": { type: "separator", title: "More" },
  faq: "FAQ",
};
export default meta;
