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
 * The site's top-level pages, in the order the navigation bar lists them.
 * The index is the landing page, which the logo links to. The motion and
 * archetype catalogues and the playground are the kit a film is composed
 * with, so they sit under one Library menu after the documentation and the
 * scenes. Former addresses stay as hidden pages that forward.
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
  scenes: {
    title: "Scenes",
    type: "page",
    theme: APPLICATION,
  },
  library: {
    title: "Library",
    type: "menu",
    items: {
      motions: { title: "Motions", href: "/motions/" },
      archetypes: { title: "Archetypes", href: "/archetypes/" },
      playground: { title: "Playground", href: "/playground/" },
    },
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
  playground: {
    title: "Playground",
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
  gallery: {
    title: "Archetypes",
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
