import type { ICreateHumanViewerCatalogueControllerProps } from "./ICreateHumanViewerCatalogueControllerProps";
import { createHumanViewerAdmission } from "./createHumanViewerAdmission";
import { createHumanViewerCatalogueRepublish } from "./createHumanViewerCatalogueRepublish";
import { settleHumanViewerInputs } from "./settleHumanViewerInputs";

/**
 * Publish descriptors without evaluating every document, and settle a selected
 * document against only its own input facts and domain admission. Explicit full
 * settlement still judges the complete inventory. Selection never changes the
 * validator, source-window authority or the host's complete inventory.
 *
 * @evidence contracts/common.md#principled-implementation Demand admission and keyed sidecar completion remove unrelated barriers while retaining each owner's verdict and generation identity.
 * @evidence contracts/common.md#clear-and-simple-design This controller owns catalogue/admission orchestration; source readers and the page retain their existing authorities.
 * @evidence contracts/common.md#meaningful-documentation Distinguishes selectable pending descriptors, drawable admissions and explicit full settlement.
 */
export function createHumanViewerCatalogueController(
  props: ICreateHumanViewerCatalogueControllerProps,
) {
  const { source } = props;
  const republish = createHumanViewerCatalogueRepublish(() => {
    props.publish(source.catalogue());
  });
  const admission = createHumanViewerAdmission({
    page: props.page,
    admit: props.admit,
    changed: republish,
  });
  source.admitWith(admission.of, admission.peek);
  source.sidecarsChanged(republish);
  return {
    admission,
    retry: (trigger: string): void => {
      const released = admission.retry();
      if (released !== 0)
        console.log(`ADMISSION RETRY ${new Date().toISOString()} ${released} waiting; ${trigger}`);
      republish();
    },
    readDocument: (doc: string) => source.catalogue(doc),
    settleInputs: () => {
      admission.retry();
      return settleHumanViewerInputs(
        () => {
          const inventory = source.catalogue(undefined, true);
          props.publish(inventory);
          return inventory;
        },
        [source.sidecars, source.views, admission],
      );
    },
    settleDocument: (doc: string) => {
      admission.retry(doc);
      const stem = doc.startsWith("file:") ? doc.slice(5).split("/")[0] : null;
      const files = stem === null ? [] : [
        stem + ".basis.json.gz", stem + ".person.json.gz",
        stem + ".head.json.gz", stem + ".body.json.gz",
      ];
      return settleHumanViewerInputs(
        () => source.catalogue(doc),
        [
          { busy: () => source.sidecars.busy(files), settled: () => source.sidecars.settled(files) },
          ...(source.hasOwnInput(doc) ? [] : [source.views]),
          { busy: () => admission.busy(doc), settled: () => admission.settled(doc) },
        ],
      ).then((selected) => {
        props.publish(source.catalogue());
        return selected;
      });
    },
  };
}
