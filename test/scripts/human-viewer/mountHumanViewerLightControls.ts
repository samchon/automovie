import type { HumanViewerAddress } from "./HumanViewerAddress";
import { humanViewerChoices } from "./humanViewerChoices";
import { parseHumanViewerLight } from "./parseHumanViewerLight";

/**
 * Own the inspection-light form's events and displayed values. The outer
 * controls supply real elements and navigation; this owner parses through the
 * URL boundary, reports invalid input without navigation, and clears an
 * override on reset. Show restores the bookmark state and hides unsupported
 * Face controls. Empty inputs represent no override, not invented defaults.
 * No scene, renderer or numerical document is mutated by this form.
 *
 * @evidence contracts/common.md#principled-implementation The form and URL share admission, and only admitted selections navigate to a display address.
 * @evidence contracts/common.md#clear-and-simple-design Owns one form's event and state projection with supplied DOM elements and a navigation callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses local element events without replacing globals or selecting subject-specific light values.
 * @evidence contracts/common.md#meaningful-documentation Explains supported-domain visibility, reset meaning and rejection without navigation.
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
    const source = [props.name.value, ...props.components.map((input) => input.value)].join(",");
    let light: HumanViewerAddress["light"];
    try {
      light = parseHumanViewerLight(source);
    } catch {
      props.error.textContent = "Choose a light and enter a finite nonzero X/Y/Z direction.";
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
