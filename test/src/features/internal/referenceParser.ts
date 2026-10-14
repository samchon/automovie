import * as path from "node:path";

import { loadSourceModule } from "./loadSourceModule";

/** The private syntax-injection and snapshot fields observed by reference units. */
interface ReferenceParser {
  /** Parse the current bytes through the real private source module. */
  parseReference(
    file: string,
    bytes: Uint8Array,
    syntax?: (source: string) => Promise<{
      tree: { type: "root"; children: [] };
      Parser: new (
        callbacks: { oncomment(): void },
        options: { decodeEntities: boolean },
      ) => {
        startIndex: number;
        endIndex: number;
        end(source: string): void;
      };
    }>,
  ): Promise<{
    source: string;
    file: string;
    revision: string;
    sourceBytes: number;
  }>;
}

/**
 * The private parser seam needed by snapshot and injected-failure units.
 *
 * Only the empty-root syntax injection and observed snapshot fields are typed
 * here. Private package source stays outside the test builder's rootDir.
 */
export const referenceParser: ReferenceParser = loadSourceModule<ReferenceParser>(
  path.resolve(
    __dirname,
    "../../../../packages/mcp/src/internal/parseReference.ts",
  ),
);
