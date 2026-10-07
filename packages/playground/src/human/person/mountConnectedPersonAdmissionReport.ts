import type { IConnectedPersonAdmissionReport } from "./IConnectedPersonAdmissionReport";
import type { IConnectedPersonAdmissionReportProps } from "./IConnectedPersonAdmissionReportProps";
import type { IConnectedPersonAdmissionView } from "./IConnectedPersonAdmissionView";

/**
 * Show the admission report of the person on screen and save it on request.
 *
 * The report is written as the owner's object, unsummarized: `accepted`,
 * every failure, and the clearance and part readings when the measuring
 * owners attach them. The saved file adds only the identities of the
 * evaluation (document and both basis revisions) and whether the person was
 * accepted or a draft. The panel supplies the view after each state change;
 * this owner evaluates nothing and keeps no report of its own beyond the one
 * it is showing.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Displays and saves the unchanged admission report of the person the editor shows.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor Keeps the admission report a separate file from the numerical person document.
 * @author Samchon
 */
export function mountConnectedPersonAdmissionReport(props: IConnectedPersonAdmissionReportProps): IConnectedPersonAdmissionReport {
  const dom = props.container.ownerDocument;
  const title = dom.createElement("h2");
  title.textContent = "Admission report";
  const text = dom.createElement("pre");
  text.setAttribute("aria-label", "Admission report of the displayed person");
  const save = dom.createElement("button");
  save.type = "button";
  save.textContent = "Save admission report";
  let shown: IConnectedPersonAdmissionView | null = null;
  save.onclick = () => {
    if (shown === null) return;
    props.download(
      shown.document + (shown.mode === "accepted" ? ".admission.json" : ".construction-admission.json"),
      JSON.stringify(shown, null, 2),
      "application/json",
    );
  };
  props.container.append(title, save, text);
  const show = (view: IConnectedPersonAdmissionView | null): void => {
    shown = view;
    save.disabled = view === null;
    text.textContent =
      view === null
        ? "No person is displayed."
        : JSON.stringify({ mode: view.mode, parts: view.parts, admission: view.admission }, null, 2);
  };
  show(null);
  return { show };
}
