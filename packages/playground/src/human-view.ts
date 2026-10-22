/** Mount the existing Human page and expose its typed generated-result consumer.
 * loadGenerated accepts IAutoMovieHumanGenerated and displays its actual model
 * and parameters. Generation and untrusted JSON admission remain unimplemented;
 * failures are displayed rather than replaced by old models or PNGs.
 *
 */
async function bootstrapHumanPage(): Promise<void> {
  const root: HTMLElement | null = document.getElementById("app");
  if (root === null) throw new Error("Human editor root is missing");
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
  const query: URLSearchParams = new URL(location.href).searchParams;
  const owner: typeof import("./human/mountHumanViewerPage") =
    await import("./human/mountHumanViewerPage");
  if (disposed) return;
  const page: ReturnType<typeof owner.mountHumanViewerPage> =
    owner.mountHumanViewerPage(root);
  release = (): Promise<void> => page.dispose();
  Object.assign(window, { __automovieHuman: page });
  const alias: string | null = query.get("alias");
  const source: string | null =
    query.get("document") ??
    (alias === null
      ? null
      : "/human-images/" + encodeURIComponent(alias) + ".json");
  if (source !== null) {
    const status: HTMLElement | null = root.querySelector("#human-status");
    if (status !== null) {
      status.textContent = "입력 JSON을 불러오고 있습니다: " + source;
      status.dataset.kind = "busy";
    }
    const response: Response = await fetch(source, {
      signal: transport.signal,
    });
    if (!response.ok)
      throw new Error("Human document transport failed: " + response.status);
    const document: unknown = await response.json();
    if (disposed) return;
    const outcome: Awaited<ReturnType<typeof page.load>> =
      await page.load(document);
    if (!outcome.accepted) throw new Error(outcome.cause);
  }
}

void bootstrapHumanPage().catch((error: unknown): void => {
  console.error(error);
  const message: string =
    error instanceof Error ? error.message : String(error);
  const root: HTMLElement | null = document.getElementById("app");
  const status: HTMLElement | null | undefined =
    root?.querySelector("#human-status");
  if (status !== null && status !== undefined) {
    status.textContent = message;
    status.dataset.kind = "error";
  } else if (root !== null) {
    const failure: HTMLParagraphElement = document.createElement("p");
    failure.setAttribute("role", "alert");
    failure.textContent = "Human 뷰어 초기화 실패: " + message;
    root.replaceChildren(failure);
  }
  const empty: HTMLElement | null | undefined = root?.querySelector(
    "#human-empty-detail",
  );
  if (empty !== null && empty !== undefined) empty.textContent = message;
});
