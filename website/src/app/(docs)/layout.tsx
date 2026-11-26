import { Footer, Layout, Navbar } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";
import { getPageMap } from "nextra/page-map";
import type { ReactElement, ReactNode } from "react";

import { SITE_BASE } from "../../SITE_BASE";

/** The footer's link columns: the site's sections and the project's places. */
const COLUMNS: readonly {
  title: string;
  links: readonly { label: string; href: string; external?: boolean }[];
}[] = [
  {
    title: "Learn",
    links: [
      { label: "Introduction", href: `${SITE_BASE}/docs/` },
      { label: "Setup", href: `${SITE_BASE}/docs/setup/` },
      {
        label: "Evidence graph",
        href: `${SITE_BASE}/docs/screenplay/evidence-graph/`,
      },
      { label: "Reference", href: `${SITE_BASE}/reference/` },
      { label: "API", href: `${SITE_BASE}/api/` },
    ],
  },
  {
    title: "Catalogues",
    links: [
      { label: "Gallery", href: `${SITE_BASE}/gallery/` },
      { label: "Scene studies", href: `${SITE_BASE}/scenes/` },
      { label: "Motions", href: `${SITE_BASE}/motions/` },
      { label: "Archetypes", href: `${SITE_BASE}/archetypes/` },
    ],
  },
  {
    title: "Project",
    links: [
      {
        label: "GitHub",
        href: "https://github.com/samchon/automovie",
        external: true,
      },
      {
        label: "npm",
        href: "https://www.npmjs.com/package/automovie",
        external: true,
      },
      {
        label: "Examples",
        href: "https://github.com/samchon/automovie-examples",
        external: true,
      },
      {
        label: "Issues",
        href: "https://github.com/samchon/automovie/issues",
        external: true,
      },
    ],
  },
];

const footer: ReactElement = (
  <Footer>
    <div className="am-footer">
      <div className="am-footer-brand">
        <span className="am-logo">
          <img
            src={`${SITE_BASE}/favicon.svg`}
            width={24}
            height={24}
            alt=""
            aria-hidden="true"
          />
          <span>AutoMovie</span>
        </span>
        <p>
          Write the film. Program the motion. Get the same frames every time.
        </p>
        <p className="am-footer-legal">
          MIT License. Copyright {new Date().getFullYear()}{" "}
          <a href="https://github.com/samchon" target="_blank" rel="noreferrer">
            Samchon
          </a>{" "}
          and contributors.
        </p>
      </div>
      {COLUMNS.map(
        (column): ReactElement => (
          <nav
            key={column.title}
            aria-label={column.title}
            className="am-footer-column"
          >
            <h2>{column.title}</h2>
            <ul>
              {column.links.map(
                (link): ReactElement => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...(link.external === true
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                    >
                      {link.label}
                    </a>
                  </li>
                ),
              )}
            </ul>
          </nav>
        ),
      )}
    </div>
  </Footer>
);

/**
 * The docs theme around every page: the navigation bar, the page map and the
 * footer.
 *
 * @param props The page.
 * @returns The themed page.
 */
export default async function DocsLayout(props: {
  children: ReactNode;
}): Promise<ReactElement> {
  return (
    <Layout
      navbar={
        <Navbar
          logo={
            <span className="am-logo">
              <img
                src={`${SITE_BASE}/favicon.svg`}
                width={26}
                height={26}
                alt=""
                aria-hidden="true"
              />
              <span>AutoMovie</span>
            </span>
          }
          projectLink="https://github.com/samchon/automovie"
        />
      }
      pageMap={await getPageMap()}
      docsRepositoryBase="https://github.com/samchon/automovie/tree/master/website"
      editLink="Edit this page on GitHub"
      sidebar={{ autoCollapse: false, defaultMenuCollapseLevel: 1 }}
      footer={footer}
    >
      {props.children}
    </Layout>
  );
}
