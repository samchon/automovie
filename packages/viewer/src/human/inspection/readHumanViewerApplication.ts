import path from "node:path";
import { pathToFileURL } from "node:url";

import type { IHumanViewerExampleSources } from "./IHumanViewerExampleSources.js";

/**
 * Load the caller's inspection application binding. The selected module supplies its HTML directory and example factories; Viewer supplies execution. Import failures retain their cause and no application or example is selected implicitly.
 *
 * @evidence contracts/common.md#principled-implementation A caller-selected absolute module URL is imported through Node, with explicit application-directory and example binding admission before service creation.
 * @evidence contracts/common.md#clear-and-simple-design Application content enters through one binding rather than a Viewer import of Playground source.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing selection refuses without a bundled app fallback or guessed workspace location.
 * @evidence contracts/common.md#meaningful-documentation Documents caller module ownership, imported side effects, required bindings and failure propagation.
 * @evidence contracts/performance.md#efficient-algorithms Node owns module loading; local checks visit fixed required fields and allocate one path URL.
 * @evidence contracts/performance.md#reuse-equivalent-work Node caches the selected module in this process; distinct service processes retain independent application lifetimes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The application module and callbacks live with the server process; this loader acquires no browser, worker or listening socket.
 */
export async function readHumanViewerApplication(): Promise<{
  directory: string;
  examples: IHumanViewerExampleSources;
  sourceDirectories: readonly string[];
}> {
  const selected: string | undefined = process.env.HUMAN_VIEWER_APPLICATION;
  if (selected === undefined || selected.trim() === "")
    throw new Error("Select HUMAN_VIEWER_APPLICATION before starting inspection.");
  const loaded: { default?: unknown } = await import(
    pathToFileURL(path.resolve(selected)).href
  );
  const application: unknown = typeof loaded.default === "function"
    ? await (loaded.default as () => unknown)()
    : loaded.default;
  if (
    application === null ||
    typeof application !== "object" ||
    !("directory" in application) ||
    typeof application.directory !== "string" ||
    !path.isAbsolute(application.directory) ||
    !("examples" in application) ||
    application.examples === null ||
    typeof application.examples !== "object"
  )
    throw new Error("The inspection application must supply directory and examples.");
  const examples: IHumanViewerExampleSources =
    application.examples as IHumanViewerExampleSources;
  if (
    ![examples.documentsFile, examples.bodyExamplesFile, examples.cameraPosesFile]
      .every((file: unknown): file is string => typeof file === "string" && path.isAbsolute(file)) ||
    ![examples.reference, examples.standardPeople, examples.subjectPeople]
      .every((factory: unknown): boolean => typeof factory === "function")
  )
    throw new Error("The inspection application has incomplete example bindings.");
  const sourceDirectories: unknown = "sourceDirectories" in application
    ? application.sourceDirectories : [application.directory];
  if (!Array.isArray(sourceDirectories) || !sourceDirectories.every(
    (directory: unknown): directory is string => typeof directory === "string" && path.isAbsolute(directory),
  ))
    throw new Error("Application source directories must be absolute paths.");
  return { directory: application.directory, examples, sourceDirectories };
}
