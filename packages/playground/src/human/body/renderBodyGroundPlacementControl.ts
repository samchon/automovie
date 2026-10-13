import type { IBodyJointControlsProps } from "./IBodyJointControlsProps";
import type { IAutoMovieHumanBodyBasisDocument } from "@automovie/human";

/**
 * Bind explicit lowest-foot placement to the body panel's existing edit transaction. The person panel uses the same joint controls and history. Omission retains an airborne pose; selecting placement keeps joint angles and places only the lowest foot, with no bilateral IK or balance promise.
 *
 * @evidence contracts/common.md#principled-implementation The checkbox authors the existing lowest-foot mode only when the source declares joint-ground; omission retains authored airborne pose and all other current document fields survive the edit.
 * @evidence contracts/common.md#clear-and-simple-design The control owns one explicit placement preference while the Human builder owns ground evaluation and the parent transaction owns admission and history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A source without ground disables the control, and vertical placement is documented without claiming bilateral foot contact, inverse kinematics or balance.
 * @evidence contracts/common.md#meaningful-documentation The comment explains omitted placement, unchanged joint angles, lowest-foot semantics and the limits of the operation.
 * @evidence contracts/performance.md#efficient-algorithms Mount scans l landmark ids once to find source ground and creates constant DOM; each edit clones the current document of d values in O(d) time and storage to preserve unrelated authored fields.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This explicit document edit coordinates no repeated numerical computation or result cache; the parent builder owns ensuing placement evaluation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent container owns a checkbox, description and event listener until redraw or close; the control borrows the basis and acquires no worker or GPU resource.
 */
export function renderBodyGroundPlacementControl(
  props: IBodyJointControlsProps,
): void {
  const label: HTMLLabelElement = props.dom.createElement("label");
  const input: HTMLInputElement = props.dom.createElement("input");
  input.type = "checkbox";
  input.dataset.role = "ground-placement";
  input.checked = props.current().groundPlacement === "lowest-foot";
  input.disabled = !props.basis.landmarks.ids.includes("joint-ground");
  label.append(
    input,
    props.dom.createTextNode(" Place lowest foot on source ground"),
  );
  const description: HTMLParagraphElement = props.dom.createElement("p");
  description.textContent = input.disabled
    ? "This source supplies no ground plane."
    : "Vertical placement keeps the joint pose; a higher foot can remain raised.";
  input.onchange = (): void => {
    const next: IAutoMovieHumanBodyBasisDocument = structuredClone(props.current());
    if (input.checked) next.groundPlacement = "lowest-foot";
    else delete next.groundPlacement;
    props.change(next);
  };
  props.container.append(label, description);
}
