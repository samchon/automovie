import type { IConnectedPersonSourceUrls } from "./IConnectedPersonSourceUrls";

/**
 * Select caller-owned typed source views through the normal editor URL.
 * The form stays outside the model panel so a refused generation can be
 * replaced. Blank fields restore the published pair; a partial pair is
 * refused by the shared selection reader before loading either definition.
 *
 * @author Samchon
 */
export function mountConnectedPersonSourceSelection(
  source: IConnectedPersonSourceUrls | undefined,
): void {
  const form = document.createElement("form");
  const title = document.createElement("strong");
  title.textContent = "Typed source views ";
  form.append(title);
  const head = document.createElement("input");
  const body = document.createElement("input");
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
  const load = document.createElement("button");
  load.type = "submit";
  load.textContent = "Load source pair";
  form.append(load);
  form.onsubmit = (event) => {
    event.preventDefault();
    if ((head.value.trim() === "") !== (body.value.trim() === "")) {
      load.textContent = "Select both source URLs; current person is retained";
      return;
    }
    const url = new URL(location.href);
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
