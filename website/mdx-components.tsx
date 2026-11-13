import type { MDXComponents } from "nextra/mdx-components";
import { useMDXComponents as getDocsMDXComponents } from "nextra-theme-docs";

const docsComponents: MDXComponents = getDocsMDXComponents();

/**
 * The components every MDX page of the site renders with: the docs theme's,
 * then the page's own.
 *
 * @param components The page's own components.
 * @returns The merged set.
 */
export function useMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...docsComponents,
    ...components,
  };
}
