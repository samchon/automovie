import type {
  IAutoMovieHumanFaceBasis,
  IAutoMovieHumanFaceBasisDocument,
} from "@automovie/human";

import { mountConnectedFaceHair } from "./connectedHair";
import { mountConnectedFaceIris } from "./connectedIris";
import { mountConnectedFacePigmentation } from "./connectedPigmentation";

/**
 * Edit global reflectance in either control mode. Material selection is view
 * state; numeric changes enter the panel's ordinary transaction and history.
 * Inputs show linear RGB, avoiding an implicit browser sRGB conversion.
 * Unedited material properties and pigmentation fields remain caller-owned.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Exposes numerical colour and roughness without an individual image resource.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Keeps appearance inputs synchronized with committed state and shared undo/redo.
 */
export function mountConnectedFaceAppearance(
  app: HTMLElement,
  props: {
    basis: IAutoMovieHumanFaceBasis;
    document: () => IAutoMovieHumanFaceBasisDocument;
    change: (document: IAutoMovieHumanFaceBasisDocument) => Promise<void>;
    refuse: (error: unknown) => void;
  },
) {
  const dom = app.ownerDocument;
  const section = dom.createElement("details");
  section.id = "face-appearance";
  const summary = dom.createElement("summary");
  summary.textContent = "Colour and surface";
  const select = dom.createElement("select");
  select.id = "appearance-material";
  select.setAttribute("aria-label", "Surface material");
  for (const material of props.basis.materials) {
    const option = dom.createElement("option");
    option.value = material.id;
    option.textContent = material.name;
    select.append(option);
  }
  const entries = dom.createElement("div");
  section.append(summary, select, entries);
  app.querySelector("#basis-controls")!.after(section);
  const refresh = (): void => {
    entries.replaceChildren();
    const material = props.basis.materials.find(
      (one) => one.id === select.value,
    );
    if (material === undefined) return;
    const document = props.document();
    const authored = Object.hasOwn(document.materials ?? {}, material.id)
      ? document.materials![material.id]
      : undefined;
    for (const key of ["r", "g", "b", "roughness"] as const) {
      const label = dom.createElement("label");
      label.style.display = "block";
      label.textContent =
        key === "roughness" ? "Roughness" : "Linear " + key.toUpperCase();
      const input = dom.createElement("input");
      input.type = "number";
      input.id = "appearance-" + key;
      input.min = "0";
      input.max = "1";
      input.step = "any";
      input.value = String(
        key === "roughness"
          ? (authored?.roughness ?? material.roughness)
          : (authored?.color?.[key] ?? material.baseColor[key]),
      );
      input.onchange = async () => {
        try {
          const value = Number(input.value);
          if (
            input.value.trim() === "" ||
            !Number.isFinite(value) ||
            value < 0 ||
            value > 1
          )
            throw new Error("Colour and roughness require a number in [0,1].");
          const next = structuredClone(props.document());
          next.materials ??= {};
          const override = Object.hasOwn(next.materials, material.id)
            ? next.materials[material.id]
            : {};
          if (key === "roughness") override.roughness = value;
          else {
            override.color ??= {
              r: material.baseColor.r,
              g: material.baseColor.g,
              b: material.baseColor.b,
            };
            override.color[key] = value;
          }
          Object.defineProperty(next.materials, material.id, {
            value: override,
            enumerable: true,
            configurable: true,
            writable: true,
          });
          await props.change(next);
        } catch (error) {
          props.refuse(error);
        }
        refresh();
      };
      label.append(input);
      entries.append(label);
    }
  };
  select.onchange = refresh;
  const pigmentation = mountConnectedFacePigmentation(app, props);
  const iris = mountConnectedFaceIris(app, props);
  const hair = mountConnectedFaceHair(app, props);
  return {
    refresh: () => {
      refresh();
      pigmentation.refresh();
      iris.refresh();
      hair.refresh();
    },
  };
}
