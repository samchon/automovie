import type { IBodyJointControlsProps } from "./IBodyJointControlsProps";

/**
 * Bind explicit lowest-foot placement to the body panel's existing edit
 * transaction. The person panel uses the same joint controls and history.
 * Omission retains an airborne pose; selecting placement keeps joint angles
 * and places only the lowest foot, with no bilateral IK or balance promise.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Publishes the named ground-placement choice through the existing body/person transaction and last-valid recovery owners.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Shows placement as a separate choice from joint angles and preserves omission when cleared.
 */
export function renderBodyGroundPlacementControl(props: IBodyJointControlsProps): void {
  const label = props.dom.createElement("label");
  const input = props.dom.createElement("input");
  input.type = "checkbox";
  input.dataset.role = "ground-placement";
  input.checked = props.current().groundPlacement === "lowest-foot";
  input.disabled = !props.basis.landmarks.ids.includes("joint-ground");
  label.append(input, props.dom.createTextNode(" Place lowest foot on source ground"));
  const description = props.dom.createElement("p");
  description.textContent = input.disabled
    ? "This source supplies no ground plane."
    : "Vertical placement keeps the joint pose; a higher foot can remain raised.";
  input.onchange = () => {
    const next = structuredClone(props.current());
    if (input.checked) next.groundPlacement = "lowest-foot";
    else delete next.groundPlacement;
    props.change(next);
  };
  props.container.append(label, description);
}
