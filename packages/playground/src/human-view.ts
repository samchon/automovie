import type { IHumanViewerPage } from "./human/IHumanViewerPage";

/**
 * Mount the single Human page and generate the requested input.
 *
 * `?alias=f1` generates from the typed module `src/human-parameters/f1.ts`
 * directly; `?document=<url>` fetches JSON and generates only when it equals a
 * registered typed example (see `admitHumanParameters`); `?modules=<name>` lofts
 * that module-fit preview's calibration instead (see `readHumanModulePreview`).
 * With neither alias nor document, the page
 * waits for the alias selector or `window.__automovieHuman`, which the PNG
 * worker's headless Chrome drives. After a load, `?camera=`, `?pass=` and
 * `?curves=` restore the view, then the free-view variables (`az`, `el`, `view`,
 * `target`, `dist`, `ortho`, `isolate`, `fit`, `garment`, `hair`, `material`, `light`). Hair visibility, clay skin and raking illumination restore through the same parser and canonical view as PNG capture; failures stay on the status line.
 */
async function bootstrapHumanPage(): Promise<void> {
  const root: HTMLElement | null = document.getElementById("app");
  if (root === null) throw new Error("Human page root is missing");

  // pagehide aborts the optional fetch and disposes the page once mounted.
  const transport: AbortController = new AbortController();
  let disposed: boolean = false;
  let release: () => Promise<void> = (): Promise<void> => Promise.resolve();
  window.addEventListener(
    "pagehide",
    (): void => {
      disposed = true;
      transport.abort();
      void Promise.resolve().then(release).catch(console.error);
    },
    { once: true },
  );

  const owner: typeof import("./human/mountHumanViewerPage") =
    await import("./human/mountHumanViewerPage");
  if (disposed) return;
  const page: IHumanViewerPage = owner.mountHumanViewerPage(root);
  release = (): Promise<void> => page.dispose();
  Object.assign(window, { __automovieHuman: page });

  const query: URLSearchParams = new URL(location.href).searchParams;
  const alias: string | null = query.get("alias");
  const source: string | null = query.get("document");
  const modules: string | null = query.get("modules");
  if (alias !== null && source !== null)
    throw new Error("Choose either ?alias or ?document, not both");
  if (alias !== null) await page.loadAlias(alias, modules);
  else if (source !== null) {
    const response: Response = await fetch(source, {
      signal: transport.signal,
    });
    if (!response.ok)
      throw new Error(
        "Human document transport failed: " + source + " " + response.status,
      );
    const candidate: unknown = await response.json();
    if (disposed) return;
    await page.load(candidate, modules);
  } else return;

  // The view variables were read before the load rewrote the URL.
  const view: string | null = query.get("camera");
  const pass: string | null = query.get("pass");
  const curves: string[] = query.getAll("curves");
  if (view !== null) page.setCamera(view);
  if (pass !== null) page.setPass(pass as IHumanViewerPage.Pass);
  if (curves.length !== 0) page.setCurves(curves.join(","));

  // Free-view variables go through the same parser the PNG URLs use.
  const free: URLSearchParams = new URLSearchParams();
  for (const name of [
    "az",
    "el",
    "view",
    "target",
    "dist",
    "ortho",
    "isolate",
    "fit",
    "garment",
    "hair",
    "material",
    "light",
  ]) {
    const value: string | null = query.get(name);
    if (value !== null) free.set(name, value);
  }
  if ([...free.keys()].length !== 0) page.setView(free.toString());
}

void bootstrapHumanPage().catch((error: unknown): void => {
  // The page already reports its own load failures; this covers mount and transport.
  console.error(error);
  const message: string =
    error instanceof Error ? error.message : String(error);
  const status: HTMLElement | null = document.getElementById("human-status");
  if (status !== null) {
    if (status.dataset.kind !== "error") {
      status.textContent = message;
      status.dataset.kind = "error";
    }
    return;
  }
  const root: HTMLElement | null = document.getElementById("app");
  if (root !== null) {
    const failure: HTMLParagraphElement = document.createElement("p");
    failure.setAttribute("role", "alert");
    failure.textContent = "Human 뷰어 초기화 실패: " + message;
    root.replaceChildren(failure);
  }
});
