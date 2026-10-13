import type { IConnectedPersonSourceUrls } from "./IConnectedPersonSourceUrls";

/**
 * Select caller-owned source views through the editor URL. The form stays outside the model panel so a refused generation can be replaced. Blank fields omit both overrides and select the default loaders; this does not establish that a default asset is available. A partial pair retains the current page and reports the missing selection.
 *
 * @evidence contracts/common.md#principled-implementation Both trimmed fields must be present or absent together; URL search parameters carry their original text to the shared URL reader, which validates schemes before loading.
 * @evidence contracts/common.md#clear-and-simple-design One external form owns source-pair navigation and does not construct, admit or replace a model itself.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing half is refused without navigation, and omitted overrides do not claim a bundled or healthy generation.
 * @evidence contracts/common.md#meaningful-documentation The comment explains default-loader selection, pair requirements and retention of the current page on partial input.
 * @evidence contracts/performance.md#efficient-algorithms Two controls and two query keys require constant DOM work plus URL/string processing proportional to their text lengths; model loading occurs on the destination page.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Navigation is an authored effect; repeated submissions are not merged or served from a model cache by this form.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One form and submit handler are retained by the document until navigation/document disposal. The caller mounts it once; repeated mounting appends additional forms and this function exposes no local teardown.
 *
 * @author Samchon
 */
export function mountConnectedPersonSourceSelection(
  source: IConnectedPersonSourceUrls | undefined,
): void {
  const form: HTMLFormElement = document.createElement("form");
  const title: HTMLElement = document.createElement("strong");
  title.textContent = "Typed source views ";
  form.append(title);
  const head: HTMLInputElement = document.createElement("input");
  const body: HTMLInputElement = document.createElement("input");
  for (const [input, name, value] of [
    [head, "Head source URL", source?.head],
    [body, "Body source URL", source?.body],
  ] as const) {
    input.type = "text";
    input.placeholder = name;
    input.setAttribute("aria-label", name);
    input.value = value ?? "";
    form.append(input);
  }
  const load: HTMLButtonElement = document.createElement("button");
  load.type = "submit";
  load.textContent = "Load source pair";
  form.append(load);
  form.onsubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    if ((head.value.trim() === "") !== (body.value.trim() === "")) {
      load.textContent = "Select both source URLs; current person is retained";
      return;
    }
    const url: URL = new URL(location.href);
    for (const [key, value] of [
      ["headSource", head.value],
      ["bodySource", body.value],
    ] as const) {
      if (value.trim() === "") url.searchParams.delete(key);
      else url.searchParams.set(key, value);
    }
    if (window.__playgroundViewerPage !== undefined) window.__playgroundViewerPage.navigate(url.href);
    else location.assign(url.href);
  };
  document.body.insertBefore(form, document.querySelector("#app"));
}
