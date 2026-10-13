import type { HumanViewerAddress } from "@automovie/viewer/human/inspection/HumanViewerAddress";
import { humanViewerChoices } from "@automovie/viewer/human/inspection/humanViewerChoices";
import { parseHumanViewerLight } from "@automovie/viewer/human/inspection/parseHumanViewerLight";

/**
 * Own the inspection-light form's events and displayed values. The outer
 * controls supply real elements and navigation; this owner parses through the
 * URL boundary, reports invalid input without navigation, and clears an
 * override on reset. Show restores the bookmark state and hides unsupported
 * Face controls. Empty inputs represent no override, not invented defaults.
 * No scene, renderer or numerical document is mutated by this form.
 */
export function mountHumanViewerLightControls(props: {
  form: HTMLFormElement;
  name: HTMLSelectElement;
  components: readonly [HTMLInputElement, HTMLInputElement, HTMLInputElement];
  reset: HTMLButtonElement;
  error: HTMLElement;
  navigate: (light: HumanViewerAddress["light"]) => void;
}) {
  for (const name of humanViewerChoices.lights) {
    const option = props.form.ownerDocument.createElement("option");
    option.value = name;
    option.textContent = name;
    props.name.append(option);
  }
  props.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const source = [
      props.name.value,
      ...props.components.map((input) => input.value),
    ].join(",");
    let light: HumanViewerAddress["light"];
    try {
      light = parseHumanViewerLight(source);
    } catch {
      props.error.textContent =
        "Choose a light and enter a finite nonzero X/Y/Z direction.";
      return;
    }
    props.error.textContent = "";
    props.navigate(light);
  });
  props.reset.addEventListener("click", () => props.navigate(null));
  return {
    /** Restore the displayed bookmark and domain support without navigating. */
    show: (light: HumanViewerAddress["light"], supported: boolean): void => {
      props.form.hidden = !supported;
      props.name.value = light?.name ?? "key";
      props.components.forEach((input, index) => {
        input.value = light === null ? "" : String(light.direction[index]);
      });
      props.error.textContent = "";
    },
  };
}
