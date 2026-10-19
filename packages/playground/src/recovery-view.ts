import { mountRecoveryViewerPage } from "./recovery/mountRecoveryViewerPage";
import { readRecoveryViewerDocument } from "./recovery/readRecoveryViewerDocument";

/** Mount the generic saved-coefficient inspector and expose its same interactive operations to capture hosts. */
const root: HTMLElement | null = document.getElementById("app");
if (root === null) throw new Error("Recovery inspector root is missing");
const page: ReturnType<typeof mountRecoveryViewerPage> =
  mountRecoveryViewerPage(root);
Object.assign(window, { __automovieRecovery: page });
const source: string | null = new URL(location.href).searchParams.get(
  "document",
);
if (source !== null)
  fetch(source)
    .then(async (response: Response): Promise<void> => {
      await page.load(await readRecoveryViewerDocument(response));
    })
    .catch((error: unknown): void => {
      console.error(error);
    });
