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
  footer: false,
  sidebar: false,
  toc: false,
  breadcrumb: false,
  pagination: false,
  timestamp: false,
};

/**
 * The site's top-level pages, in the order the navigation bar lists them.
 * The index is the landing page, which the logo links to, so it is hidden
 * from the list.
 */
const meta: MetaRecord = {
  index: {
    title: "AutoMovie",
    type: "page",
    display: "hidden",
    theme: { ...APPLICATION, footer: true },
  },
  playground: {
    title: "Playground",
    type: "page",
    theme: APPLICATION,
  },
  gallery: {
    title: "Gallery",
    type: "page",
    theme: APPLICATION,
  },
};
export default meta;
