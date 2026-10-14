import type { IAutoMovieHumanFaceBasisDocument } from "@automovie/human";

import type { IConnectedFaceAppearanceProps } from "./IConnectedFaceAppearanceProps";
import { mountConnectedFaceFibres } from "./mountConnectedFaceFibres";
import { mountConnectedFaceHair } from "./mountConnectedFaceHair";
import { mountConnectedFaceIris } from "./mountConnectedFaceIris";
import { mountConnectedFacePigmentation } from "./mountConnectedFacePigmentation";

/**
 * Edit global reflectance in either control mode. Material selection is view state; numeric changes enter the panel's ordinary transaction and history. Inputs show linear RGB, avoiding an implicit browser sRGB conversion. Unedited material properties and pigmentation fields remain caller-owned.
 *
 * @evidence contracts/common.md#principled-implementation Linear RGB and roughness entry require finite values in [0,1], then update only the selected material property over the latest draft before ordinary face admission.
 * @evidence contracts/common.md#clear-and-simple-design Material selection remains view state, numeric candidates use the shared transaction, and separate pigmentation, iris, fibre and hair mounts retain their own fields.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inputs do not silently convert browser sRGB colours or substitute defaults for invalid entry, and own-property lookup preserves authored material overrides without prototype-name fallback.
 * @evidence contracts/common.md#meaningful-documentation The comment states linear units, transaction/history ownership, selection-only presentation and preservation of unedited fields.
 * @evidence contracts/performance.md#efficient-algorithms Mount scans m materials to create options and refresh searches m for the selected entry before building four inputs; each edit clones d document values, while child appearance refresh costs remain included through their owning mounts.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Selection redraw coordinates no numerical cache; latest draft access preserves pending fields and shared viewport/transaction owners decide model reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent panel owns section DOM, selection and current input listeners until removal; replacing entries releases old rows, and pending admission resources remain with the transaction owner.
 */
export function mountConnectedFaceAppearance(
  app: HTMLElement,
  props: IConnectedFaceAppearanceProps,
): {
  /** Redraw material and all child appearance controls from the current draft. */
  refresh: () => void;
} {
  const dom: Document = app.ownerDocument;
  const section: HTMLDetailsElement = dom.createElement("details");
  section.id = "face-appearance";
  const summary: HTMLElement = dom.createElement("summary");
  summary.textContent = "Colour and surface";
  const select: HTMLSelectElement = dom.createElement("select");
  select.id = "appearance-material";
  select.setAttribute("aria-label", "Surface material");
  for (const material of props.basis.materials) {
    const option: HTMLOptionElement = dom.createElement("option");
    option.value = material.id;
    option.textContent = material.name;
    select.append(option);
  }
  const entries: HTMLDivElement = dom.createElement("div");
  section.append(summary, select, entries);
  app.querySelector('[data-role="basis-controls"]')!.after(section);
  const refresh: () => void = (): void => {
    entries.replaceChildren();
    const material:
      | IConnectedFaceAppearanceProps["basis"]["materials"][number]
      | undefined = props.basis.materials.find(
      (
        one: IConnectedFaceAppearanceProps["basis"]["materials"][number],
      ): boolean => one.id === select.value,
    );
    if (material === undefined) return;
    const document: IAutoMovieHumanFaceBasisDocument = props.document();
    const authored:
      | NonNullable<IAutoMovieHumanFaceBasisDocument["materials"]>[string]
      | undefined = Object.hasOwn(document.materials ?? {}, material.id)
      ? document.materials![material.id]
      : undefined;
    for (const key of ["r", "g", "b", "roughness"] as const) {
      const label: HTMLLabelElement = dom.createElement("label");
      label.style.display = "block";
      label.textContent =
        key === "roughness" ? "Roughness" : "Linear " + key.toUpperCase();
      const input: HTMLInputElement = dom.createElement("input");
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
      input.onchange = async (): Promise<void> => {
        try {
          const value: number = Number(input.value);
          if (
            input.value.trim() === "" ||
            !Number.isFinite(value) ||
            value < 0 ||
            value > 1
          )
            throw new Error("Colour and roughness require a number in [0,1].");
          const next: IAutoMovieHumanFaceBasisDocument = structuredClone(
            props.document(),
          );
          next.materials ??= {};
          const override: NonNullable<
            IAutoMovieHumanFaceBasisDocument["materials"]
          >[string] = Object.hasOwn(next.materials, material.id)
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
  const pigmentation: ReturnType<typeof mountConnectedFacePigmentation> =
    mountConnectedFacePigmentation(app, props);
  const iris: ReturnType<typeof mountConnectedFaceIris> =
    mountConnectedFaceIris(app, props);
  const fibres: ReturnType<typeof mountConnectedFaceFibres> =
    mountConnectedFaceFibres(app, props);
  const hair: ReturnType<typeof mountConnectedFaceHair> =
    mountConnectedFaceHair(app, props);
  return {
    refresh: (): void => {
      refresh();
      pigmentation.refresh();
      iris.refresh();
      fibres.refresh();
      hair.refresh();
    },
  };
}
