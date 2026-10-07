import type { IConnectedPersonSourceUrls } from "./IConnectedPersonSourceUrls";

/**
 * Select caller-owned typed source views through the normal editor URL.
 * The form stays outside the model panel so a refused generation can be
 * replaced. Blank fields restore the published pair; a partial pair is
 * refused by the shared selection reader before loading either definition.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Exposes source selection without replacing published assets or altering numerical person documents.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Keeps source loading available when model admission refuses the selected generation.
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
    location.assign(url.href);
  };
  document.body.insertBefore(form, document.querySelector("#app"));
}
