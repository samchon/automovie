import type { MetaRecord } from "nextra";

/** The documentation's pages, in the order its sidebar lists them. */
const meta: MetaRecord = {
  index: "Introduction",
  setup: "Setup",
  "first-film": "Your first film",

  "-- guides": { type: "separator", title: "Guides" },
  screenplay: "Screenplay",
  motion: "Motion",
  delivery: "Delivery",

  "-- appendix": { type: "separator", title: "Appendix" },
  reference: "Reference",
  faq: "FAQ",
};
export default meta;
