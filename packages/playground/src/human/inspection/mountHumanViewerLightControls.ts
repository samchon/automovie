import type { HumanViewerAddress } from "@automovie/viewer/human/inspection/HumanViewerAddress";
import { humanViewerChoices } from "@automovie/viewer/human/inspection/humanViewerChoices";
import { parseHumanViewerLight } from "@automovie/viewer/human/inspection/parseHumanViewerLight";

/**
 * Own the inspection-light form's events and displayed values. The outer controls supply real elements and navigation; this owner parses through the URL boundary, reports invalid input without navigation, and clears an override on reset. Show restores the bookmark state and hides unsupported Face controls. Null display shows blank components for no override; submitting incomplete components refuses, and reset explicitly clears the override. No scene, renderer or numerical document is mutated by this form. Close removes this mount's submit/reset listeners; DOM elements remain caller-owned.
 *
 * @evidence contracts/common.md#principled-implementation The shared URL light parser admits a supported name and finite nonzero raw direction, invalid entry stops navigation, and explicit reset submits null to restore the viewport's own light directions.
 * @evidence contracts/common.md#clear-and-simple-design The form owns input/status events and delegates display navigation while the viewport owns normalization and scene-light resources.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Blank displayed no-override state is distinct from invalid submitted components, unsupported Face capability is hidden, and no invented vector or numerical document is authored.
 * @evidence contracts/common.md#meaningful-documentation The comment states parser and normalization owners, invalid-submit behavior, explicit reset, null display, capability hiding and listener-only closure.
 * @evidence contracts/performance.md#efficient-algorithms Mount creates options for the fixed studio-light list and each submit/show processes three scalar components, with constant work independent of scene or mesh dimensions.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Light navigation is a display effect and owns no numerical result or scene-light cache; borrowed viewport state is restored through the supplied address owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One AbortController owns two native listener registrations until close aborts their signal; elements and displayed values stay caller-owned and no scene/GPU resources are acquired.
 */
export function mountHumanViewerLightControls(props: {
  form: HTMLFormElement;
  name: HTMLSelectElement;
  components: readonly [HTMLInputElement, HTMLInputElement, HTMLInputElement];
  reset: HTMLButtonElement;
  error: HTMLElement;
  navigate: (light: HumanViewerAddress["light"]) => void;
}): {
  /** Restore observed light state and capability without submitting navigation. */
  show: (light: HumanViewerAddress["light"], supported: boolean) => void;

  /** Remove this mount's event handlers while preserving caller-owned elements. */
  close: () => void;
} {
  const listeners: AbortController = new AbortController();
  for (const name of humanViewerChoices.lights) {
    const option: HTMLOptionElement = props.form.ownerDocument.createElement("option");
    option.value = name;
    option.textContent = name;
    props.name.append(option);
  }
  props.form.addEventListener("submit", (event: SubmitEvent): void => {
    event.preventDefault();
    const source: string = [
      props.name.value,
      ...props.components.map((input: HTMLInputElement): string => input.value),
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
  }, { signal: listeners.signal });
  props.reset.addEventListener("click", (): void => props.navigate(null), { signal: listeners.signal });
  return {
    close: (): void => listeners.abort(),
    /** Restore the displayed bookmark and domain support without navigating. */
    show: (light: HumanViewerAddress["light"], supported: boolean): void => {
      props.form.hidden = !supported;
      props.name.value = light?.name ?? "key";
      props.components.forEach((input: HTMLInputElement, index: number): void => {
        input.value = light === null ? "" : String(light.direction[index]);
      });
      props.error.textContent = "";
    },
  };
}
