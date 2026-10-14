import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanBodyBasisDocument,
} from "@automovie/human";

import type { IBodyJointControlsProps } from "./IBodyJointControlsProps";

/**
 * Select source-supplied reference atlas bones by anatomical identity through the body/person edit transaction. Resources and placement belong to the source; this control authors no personal vertices or placement frames. The builder owns exact registration refusal and last-valid model recovery.
 *
 * @evidence contracts/common.md#principled-implementation Each checkbox uses a source candidate's anatomical id, edits the latest sparse inspection list and delegates exact registration and document admission to the parent builder transaction.
 * @evidence contracts/common.md#clear-and-simple-design The renderer owns only candidate selection DOM; source resources, registration frames, geometry and history remain with their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing candidates display an explicit gap, source bones are labelled reference inspection rather than validated personal anatomy, and no candidate vertices or placements are fabricated.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes source reference resources from personal geometry and locates registration refusal and last-valid recovery with the builder.
 * @evidence contracts/performance.md#efficient-algorithms Mount scans a candidates and checks the i selected ids for each in O(ai) time with O(a) DOM; each edit clones the current document and scans i ids to replace only the selected candidate.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This selection renderer coordinates no geometry cache; it reads the current draft at event time and the parent builder decides resource reuse.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The parent container retains one checkbox and listener per candidate until redraw or close; basis resources are borrowed and no atlas GPU or worker handle is acquired here.
 */
export function renderBodyAtlasInspectionControls(
  props: IBodyJointControlsProps,
): void {
  const fieldset: HTMLFieldSetElement = props.dom.createElement("fieldset");
  fieldset.dataset.role = "atlas-inspection";
  const legend: HTMLLegendElement = props.dom.createElement("legend");
  legend.textContent = "Reference atlas inspection";
  fieldset.append(legend);
  const resources: NonNullable<
    IAutoMovieHumanBodyBasis["anatomicalCandidates"]
  > = props.basis.anatomicalCandidates ?? [];
  const explanation: HTMLParagraphElement = props.dom.createElement("p");
  explanation.textContent =
    resources.length === 0
      ? "No atlas inspection parts are supplied by this body source."
      : "These reference bones require their registered body shape. Personal anatomy remains unvalidated.";
  fieldset.append(explanation);
  for (const resource of resources) {
    const label: HTMLLabelElement = props.dom.createElement("label");
    const input: HTMLInputElement = props.dom.createElement("input");
    input.type = "checkbox";
    input.dataset.atlasPart = resource.id;
    input.checked = (props.current().anatomicalInspection ?? []).includes(
      resource.id,
    );
    label.append(input, props.dom.createTextNode(" " + resource.id));
    input.onchange = (): void => {
      const next: IAutoMovieHumanBodyBasisDocument = structuredClone(
        props.current(),
      );
      const selected: NonNullable<
        IAutoMovieHumanBodyBasisDocument["anatomicalInspection"]
      > = (next.anatomicalInspection ?? []).filter(
        (id: string): boolean => id !== resource.id,
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
