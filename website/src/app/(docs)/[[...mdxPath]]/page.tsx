import type { Metadata } from "next";
import { generateStaticParamsFor, importPage } from "nextra/pages";
import type { ReactElement } from "react";

import { useMDXComponents as getMDXComponents } from "../../../../mdx-components";

/** What Next passes a page of this route. */
interface IPageProps {
  /** The route's parameters: the MDX file's path under `src/content`. */
  params: Promise<{ mdxPath?: string[] }>;
}

/** An MDX page as Nextra imports it. */
type Imported = Awaited<ReturnType<typeof importPage>>;

/** The MDX paths under `src/content`, one static page each. */
export const generateStaticParams: ReturnType<typeof generateStaticParamsFor> =
  generateStaticParamsFor("mdxPath");

/**
 * The metadata of an MDX page, from its front matter.
 *
 * @param props The route's parameters.
 * @returns The metadata.
 */
export async function generateMetadata(props: IPageProps): Promise<Metadata> {
  const params: { mdxPath?: string[] } = await props.params;
  const page: Imported = await importPage(params.mdxPath);
  return page.metadata;
}

/** The docs theme's wrapper around a page's content. */
const Wrapper: NonNullable<ReturnType<typeof getMDXComponents>["wrapper"]> =
  getMDXComponents().wrapper!;

/**
 * One MDX page of `src/content`, in the docs theme's wrapper.
 *
 * @param props The route's parameters.
 * @returns The page.
 */
export default async function Page(props: IPageProps): Promise<ReactElement> {
  const params: { mdxPath?: string[] } = await props.params;
  const page: Imported = await importPage(params.mdxPath);
  const MDXContent: Imported["default"] = page.default;
  return (
    <Wrapper
      toc={page.toc}
      metadata={page.metadata}
      sourceCode={page.sourceCode}
    >
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
