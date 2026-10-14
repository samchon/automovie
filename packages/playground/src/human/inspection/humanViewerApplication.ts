import type { IHumanViewerExampleSources } from "@automovie/viewer/human/inspection/IHumanViewerExampleSources";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createHumanViewerReferenceFaceDocument } from "../examples/createHumanViewerReferenceFaceDocument.js";
import { readHumanViewerStandardPeople } from "../examples/readHumanViewerStandardPeople.js";
import { readHumanViewerSubjectPeople } from "../examples/readHumanViewerSubjectPeople.js";

const directory: string = path.dirname(fileURLToPath(import.meta.url));

/**
 * Bind Playground's inspection pages and authored example parameters to Viewer execution.
 *
 * @evidence contracts/common.md#principled-implementation Absolute app-owned page/data paths and existing factories preserve the same example inputs without owning server execution.
 * @evidence contracts/common.md#clear-and-simple-design One application record is consumed by Viewer's caller-selected module loader.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Example bindings contain no bundled Human basis or fitted geometry fallback.
 * @evidence contracts/common.md#meaningful-documentation Identifies application page and parameter ownership at the Viewer boundary.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This binding selects no numerical or capture algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing example factories retain their source-aware behavior; this record adds no result cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Paths and factory references acquire no process or GPU lifetime.
 */
export function humanViewerApplication(): {
  directory: string;
  examples: IHumanViewerExampleSources;
} {
  return {
    directory,
    examples: {
      documentsFile: path.resolve(directory, "../examples/faces.json"),
      bodyExamplesFile: path.resolve(directory, "../examples/bodies.json"),
      cameraPosesFile: path.resolve(directory, "../examples/cameras/poses-lens-frame.json"),
      reference: createHumanViewerReferenceFaceDocument,
      standardPeople: readHumanViewerStandardPeople,
      subjectPeople: readHumanViewerSubjectPeople,
    },
  };
}

export default humanViewerApplication;
