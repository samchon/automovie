import type { IBodyJointControlsProps } from "./IBodyJointControlsProps";

/**
 * Select source-supplied reference atlas bones by anatomical identity through
 * the body/person edit transaction. Resources and placement belong to the
 * source; this control authors no personal vertices or placement frames.
 * The builder owns exact registration refusal and last-valid model recovery.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Binds source-supplied named atlas inspection choices to the existing document transaction and history.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Separates reference-only inspection from clinically unavailable personal anatomy and states absent source resources.
 */
export function renderBodyAtlasInspectionControls(
  props: IBodyJointControlsProps,
): void {
  const fieldset = props.dom.createElement("fieldset");
  fieldset.dataset.role = "atlas-inspection";
  const legend = props.dom.createElement("legend");
  legend.textContent = "Reference atlas inspection";
  fieldset.append(legend);
  const resources = props.basis.anatomicalCandidates ?? [];
  const explanation = props.dom.createElement("p");
  explanation.textContent =
    resources.length === 0
      ? "No atlas inspection parts are supplied by this body source."
      : "These reference bones require their registered body shape. Personal anatomy remains unvalidated.";
  fieldset.append(explanation);
  for (const resource of resources) {
    const label = props.dom.createElement("label");
    const input = props.dom.createElement("input");
    input.type = "checkbox";
    input.dataset.atlasPart = resource.id;
    input.checked = (props.current().anatomicalInspection ?? []).includes(
      resource.id,
    );
    label.append(input, props.dom.createTextNode(" " + resource.id));
    input.onchange = () => {
      const next = structuredClone(props.current());
      const selected = (next.anatomicalInspection ?? []).filter(
        (id) => id !== resource.id,
      );
      if (input.checked) selected.push(resource.id);
      if (selected.length === 0) delete next.anatomicalInspection;
      else next.anatomicalInspection = selected;
      props.change(next);
    };
    fieldset.append(label);
  }
  props.container.append(fieldset);
}
