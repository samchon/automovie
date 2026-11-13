import { Footer, Layout, Navbar } from "nextra-theme-docs";
import "nextra-theme-docs/style.css";
import { getPageMap } from "nextra/page-map";
import type { ReactElement, ReactNode } from "react";

const footer: ReactElement = (
  <Footer>
    <nav aria-label="Footer" className="automovie-site-footer-links">
      <a href="/automovie/docs/">Docs</a>
      <a href="https://github.com/samchon/automovie" target="_blank" rel="noreferrer">
        GitHub
      </a>
      <a href="https://www.npmjs.com/package/automovie" target="_blank" rel="noreferrer">
        npm
      </a>
    </nav>
    <br />
    Released under the MIT License.
    <br />
    <br />
    Copyright {new Date().getFullYear()}{" "}
    <a
      href="https://github.com/samchon"
      target="_blank"
      rel="noreferrer"
      style={{ color: "initial" }}
    >
      <u>Samchon</u>
    </a>{" "}
    & Contributors
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
            <span className="automovie-site-logo">
              <img
                src="/automovie/favicon.svg"
                width={28}
                height={28}
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
      sidebar={{ autoCollapse: false }}
      footer={footer}
    >
      {props.children}
    </Layout>
  );
}
