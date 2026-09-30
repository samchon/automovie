/**
 * The navigation bar and part list of `/view`. The address in the page hash is
 * the only state: every control shows a field of the address the viewport
 * displays, and a click asks the host to navigate to the address with that
 * field changed, so reload, back and a pasted link restore the same frame.
 * Choosing another document clears the part sets, whose names belong to the
 * old document. The `/render` and `/sheet` links are built from the same
 * address and therefore draw what the viewport shows.
 */
import { HUMAN_OBSERVATION_PASSES } from "@automovie/playground/src/human/common/observation/HumanObservationPass";
import { HUMAN_OBSERVATION_VIEWS } from "@automovie/playground/src/human/common/observation/HumanObservationView";

import type { HumanViewerAddress } from "./HumanViewerAddress";
import type { HumanViewerCatalogue } from "./HumanViewerCatalogue";
import { changeHumanViewerParts } from "./changeHumanViewerParts";
import { describeHumanViewerDocuments } from "./describeHumanViewerDocuments";
import { neighbourHumanViewerDocument } from "./neighbourHumanViewerDocument";
import { openHumanViewerHref } from "./openHumanViewerHref";

const element = <T extends HTMLElement>(id: string): T =>
  document.querySelector<T>("#" + id)!;

export function mountHumanViewerControls(props: {
  navigate: (address: HumanViewerAddress) => void;
}) {
  let current: HumanViewerAddress | null = null;
  let ids: string[] = [];
  let names: string[] = [];
  const doc = element<HTMLSelectElement>("doc");
  const pass = element<HTMLSelectElement>("pass");
  const size = element<HTMLSelectElement>("size");
  const pitch = element<HTMLInputElement>("pitch");
  const zoom = element<HTMLInputElement>("zoom");
  const ao = element<HTMLInputElement>("ao");
  const filter = element<HTMLInputElement>("part-filter");
  const list = element<HTMLDivElement>("part-list");
  const views = element<HTMLElement>("views");
  const change = (fields: Partial<HumanViewerAddress>): void => {
    if (current !== null) props.navigate({ ...current, ...fields });
  };
  for (const view of HUMAN_OBSERVATION_VIEWS) {
    const button = document.createElement("button");
    button.dataset.view = view;
    button.textContent = view.replace("-three-quarter", " 3/4");
    button.addEventListener("click", () => change({ view }));
    views.append(button);
  }
  for (const name of HUMAN_OBSERVATION_PASSES)
    pass.append(new Option(name, name));
  doc.addEventListener("change", () =>
    change({ doc: doc.value, parts: [], hide: [], frame: null }),
  );
  for (const [id, step] of [
    ["prev", -1],
    ["next", 1],
  ] as const)
    element(id).addEventListener("click", () => {
      if (current !== null && ids.length !== 0)
        change({
          doc: neighbourHumanViewerDocument(ids, current.doc, step),
          parts: [],
          hide: [],
          frame: null,
        });
    });
  pass.addEventListener("change", () =>
    change({ pass: pass.value as HumanViewerAddress["pass"] }),
  );
  size.addEventListener("change", () => change({ size: Number(size.value) }));
  ao.addEventListener("change", () => change({ ao: ao.checked }));
  // A slider moves continuously: it shows its number while it moves and
  // navigates when it is released.
  pitch.addEventListener("input", () => {
    element("pitch-out").textContent = pitch.value + " deg";
  });
  pitch.addEventListener("change", () =>
    change({ pitch: Number(pitch.value) }),
  );
  zoom.addEventListener("input", () => {
    element("zoom-out").textContent = Number(zoom.value).toFixed(2) + "x";
  });
  zoom.addEventListener("change", () => change({ zoom: Number(zoom.value) }));
  element("part-reset").addEventListener("click", () =>
    change({ parts: [], hide: [] }),
  );
  filter.addEventListener("input", () => draw());
  for (const [id, target] of [
    ["copy-render", "render-link"],
    ["copy-sheet", "sheet-link"],
  ] as const)
    element(id).addEventListener("click", () => {
      const href = element<HTMLAnchorElement>(target).href;
      void navigator.clipboard?.writeText(href).catch(() => {});
    });

  function draw(): void {
    const words = filter.value
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word !== "");
    const shown = names.filter((name) =>
      words.every((word) => name.toLowerCase().includes(word)),
    );
    element("part-count").textContent =
      `${shown.length} of ${names.length} parts`;
    list.replaceChildren();
    for (const name of shown) {
      const row = document.createElement("div");
      row.className = "part";
      const label = document.createElement("span");
      label.textContent = name;
      label.title = name;
      row.append(label);
      for (const [set, text] of [
        ["parts", "only"],
        ["hide", "hide"],
      ] as const) {
        const box = document.createElement("input");
        box.type = "checkbox";
        box.checked = current?.[set].includes(name) ?? false;
        box.addEventListener("change", () => {
          if (current !== null)
            props.navigate(
              changeHumanViewerParts(current, name, set, box.checked),
            );
        });
        const wrapper = document.createElement("label");
        wrapper.append(box, text);
        row.append(wrapper);
      }
      list.append(row);
    }
  }
  return {
    /** Rebuild the document list from a fresh catalogue. */
    catalogue: (catalogue: HumanViewerCatalogue): void => {
      const entries = describeHumanViewerDocuments(catalogue);
      ids = entries.map((entry) => entry.id);
      doc.replaceChildren();
      const groups = new Map<string, HTMLOptGroupElement>();
      for (const entry of entries) {
        let group = groups.get(entry.section);
        if (group === undefined) {
          group = document.createElement("optgroup");
          group.label = entry.section;
          groups.set(entry.section, group);
          doc.append(group);
        }
        group.append(new Option(entry.label, entry.id));
      }
    },

    /** Show the displayed address and the meshes the viewport reports. */
    show: (address: HumanViewerAddress, parts: readonly string[]): void => {
      current = address;
      if (!ids.includes(address.doc))
        doc.append(new Option(address.doc, address.doc));
      doc.value = address.doc;
      pass.value = address.pass;
      if (![...size.options].some((option) => option.value === String(address.size)))
        size.append(new Option(String(address.size), String(address.size)));
      size.value = String(address.size);
      pitch.value = String(address.pitch);
      zoom.value = String(address.zoom);
      ao.checked = address.ao;
      element("pitch-out").textContent = address.pitch + " deg";
      element("zoom-out").textContent = address.zoom.toFixed(2) + "x";
      for (const button of views.querySelectorAll<HTMLButtonElement>("button"))
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.view === address.view),
        );
      const hrefs = openHumanViewerHref(address.doc, address);
      element<HTMLAnchorElement>("render-link").href = hrefs.render;
      element<HTMLAnchorElement>("sheet-link").href = hrefs.sheet;
      names = [...parts];
      draw();
    },
  };
}
