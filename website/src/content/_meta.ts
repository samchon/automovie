import type { MetaRecord } from "nextra";

/** The theme options of a page that lays itself out across the whole window. */
const APPLICATION: {
  copyPage: false;
  layout: "full";
  footer: boolean;
  sidebar: false;
  toc: false;
  breadcrumb: false;
  pagination: false;
  timestamp: false;
} = {
  copyPage: false,
  layout: "full",
  footer: true,
  sidebar: false,
  toc: false,
  breadcrumb: false,
  pagination: false,
  timestamp: false,
};

/**
 * The site's top-level pages, in the order the navigation bar lists them. The
 * index is the landing page, which the logo links to. The guide, the reference
 * and the gallery are in the bar. Each catalogue also has a direct entry in the
 * reference. Former addresses stay as hidden pages that forward.
 */
const meta: MetaRecord = {
  index: {
    title: "AutoMovie",
    type: "page",
    display: "hidden",
    theme: APPLICATION,
  },
  docs: {
    title: "Docs",
    type: "page",
  },
  reference: {
    title: "Reference",
    type: "page",
  },
  gallery: {
    title: "Gallery",
    type: "page",
    theme: APPLICATION,
  },
  // The catalogues have their own pages and a shared gallery entry.
  scenes: {
    title: "Scene studies",
    type: "page",
    display: "hidden",
    theme: APPLICATION,
  },
  motions: {
    title: "Motions",
    type: "page",
    display: "hidden",
    theme: APPLICATION,
  },
  archetypes: {
    title: "Archetypes",
    type: "page",
    display: "hidden",
    theme: APPLICATION,
  },
  objects: {
    title: "Archetypes",
    type: "page",
    display: "hidden",
    theme: APPLICATION,
  },
  playground: {
    title: "Gallery",
    type: "page",
    display: "hidden",
    theme: APPLICATION,
  },
  human: {
    title: "AutoMovie",
    type: "page",
    display: "hidden",
    theme: APPLICATION,
  },
};
export default meta;
