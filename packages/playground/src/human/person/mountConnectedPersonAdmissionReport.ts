import type { IConnectedPersonAdmissionReport } from "./IConnectedPersonAdmissionReport";
import type { IConnectedPersonAdmissionReportProps } from "./IConnectedPersonAdmissionReportProps";
import type { IConnectedPersonAdmissionView } from "./IConnectedPersonAdmissionView";

/**
 * Show the admission report of the person on screen and save it on request.
 *
 * The report is written as the owner's object, unsummarized: `accepted`, every failure, and the clearance and part readings when the measuring owners attach them. The saved wrapper adds the material-region count and identities of the evaluation (document and both basis revisions) and whether the person was accepted or a draft. The panel supplies the view after each state change; this owner evaluates nothing and keeps no report of its own beyond the one it is showing.
 *
 * The active view is borrowed and serialized at paint/save time, not deep-copied. The parent clears this view and removes its DOM on close; externally retained mounted handles/elements remain caller-owned. Browser download completion is not physical disk-save acknowledgment.
 *
 * @evidence contracts/common.md#principled-implementation Show preserves accepted/draft mode and the numerical owner's unsummarized admission, while save adds supplied document/basis identities without changing failures or diagnostic readings.
 * @evidence contracts/common.md#clear-and-simple-design This mounted report owns one presentation and explicit save gesture while panel state supplies the current view and numerical owners produce admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown view disables saving, borrowed report objects are not independently validated or deep-isolated and a browser file handoff is not certified disk saving.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies current borrowed view, unsummarized report, paint/save serialization, parent DOM lifetime and download limits.
 * @evidence contracts/performance.md#efficient-algorithms Show serializes the current display report of size a and save serializes the full identity/report wrapper of size a plus identity strings, with proportional string storage; no numerical evaluation occurs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each supplied current view repaints the report and each save is an explicit user effect; no serialized output is cached across potentially changed borrowed reports.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One mounted pre/button and one current view are retained, with no report history; parent close clears the borrowed view and removes DOM, while externally retained handles/elements remain caller-owned and the download sink owns temporary browser URLs.
 *
 * @author Samchon
 */
export function mountConnectedPersonAdmissionReport(
  props: IConnectedPersonAdmissionReportProps,
): IConnectedPersonAdmissionReport {
  const dom: Document = props.container.ownerDocument;
  const title: HTMLHeadingElement = dom.createElement("h2");
  title.textContent = "Admission report";
  const text: HTMLPreElement = dom.createElement("pre");
  text.setAttribute("aria-label", "Admission report of the displayed person");
  const save: HTMLButtonElement = dom.createElement("button");
  save.type = "button";
  save.textContent = "Save admission report";
  let shown: IConnectedPersonAdmissionView | null = null;
  save.onclick = (): void => {
    if (shown === null) return;
    props.download(
      shown.document +
        (shown.mode === "accepted"
          ? ".admission.json"
          : ".construction-admission.json"),
      JSON.stringify(shown, null, 2),
      "application/json",
    );
  };
  props.container.append(title, save, text);
  const show: (view: IConnectedPersonAdmissionView | null) => void = (
    view: IConnectedPersonAdmissionView | null,
  ): void => {
    shown = view;
    save.disabled = view === null;
    text.textContent =
      view === null
        ? "No person is displayed."
        : JSON.stringify(
            { mode: view.mode, parts: view.parts, admission: view.admission },
            null,
            2,
          );
  };
  show(null);
  return { show };
}
