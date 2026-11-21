// @ts-check
import { OptionDefaults } from "typedoc";

/**
 * The API reference of every library package, generated into `public/api/` so the
 * export serves it at `/api/`. Each package is documented from its
 * `src/index.ts` under its own name. The `@evidence` tags are the
 * repository's contract citations, so they are known to TypeDoc and left out
 * of the pages.
 *
 * @type {Partial<import("typedoc").TypeDocOptions>}
 */
const config = {
  name: "AutoMovie API",
  entryPointStrategy: "packages",
  entryPoints: ["../packages/*"],
  // The `automovie` command is a program, not an API, so it is left out.
  exclude: ["../packages/cli"],
  packageOptions: {
    entryPoints: ["src/index.ts"],
    skipErrorChecking: true,
    excludePrivate: true,
    excludeInternal: true,
    blockTags: [...OptionDefaults.blockTags, "@evidence", "@evidenceExclude"],
    excludeTags: ["@evidence", "@evidenceExclude"],
    sourceLinkTemplate:
      "https://github.com/samchon/automovie/blob/master/{path}#L{line}",
    validation: { notExported: false, invalidLink: false },
  },
  out: "./public/api",
  readme: "none",
  hideGenerator: true,
  githubPages: false,
  navigationLinks: {
    Docs: "https://samchon.github.io/automovie/docs/",
    Reference: "https://samchon.github.io/automovie/reference/",
    GitHub: "https://github.com/samchon/automovie",
  },
  validation: { notExported: false, invalidLink: false },
};
export default config;
