import type { ICreateHumanViewerCatalogueControllerProps } from "./ICreateHumanViewerCatalogueControllerProps.js";
import type { IHumanViewerCatalogue } from "./IHumanViewerCatalogue.js";
import { createHumanViewerAdmission } from "./createHumanViewerAdmission.js";
import { createHumanViewerCatalogueRepublish } from "./createHumanViewerCatalogueRepublish.js";
import { settleHumanViewerInputs } from "./settleHumanViewerInputs.js";

/**
 * Publish descriptors without evaluating every document, and settle a selected document against only its own input facts and domain admission. Explicit full settlement still judges the complete inventory. Selection never changes the validator, source-window authority or the host's complete inventory.
 *
 * @evidence contracts/common.md#principled-implementation The controller installs owner admission and sidecar notifications, then settles selected documents against their own sidecars, optional generated views and admission.
 * @evidence contracts/common.md#clear-and-simple-design One admission owner and coalesced republisher connect source facts to the host; full and selected settlement share the existing idle-loop helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Selection narrows work without weakening admission or replacing the complete published catalogue, and retries only release actual waiting reasons.
 * @evidence contracts/common.md#meaningful-documentation Documentation distinguishes descriptor publication, selected settlement, full inventory and preserved source/validator authority.
 * @evidence contracts/performance.md#efficient-algorithms Selected settlement requests four stem sidecars and relevant owners; full settlement traverses the source inventory, while burst notifications coalesce into one event-loop rebuild.
 * @evidence contracts/performance.md#reuse-equivalent-work Admission key equivalence remains with its owner and all idle checks reread current source state; selected results are not substituted for the complete published inventory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The controller borrows server-lifetime source and page bridges; admission retains per-encountered-id verdicts and a republish callback can remain queued until its event-loop turn, with no independent cancellation seam.
 */
export function createHumanViewerCatalogueController(
  props: ICreateHumanViewerCatalogueControllerProps,
): {
  admission: ReturnType<typeof createHumanViewerAdmission>;
  retry: (trigger: string) => void;
  readDocument: (doc: string) => IHumanViewerCatalogue;
  settleInputs: () => Promise<IHumanViewerCatalogue>;
  settleDocument: (doc: string) => Promise<IHumanViewerCatalogue>;
} {
  const { source }: Pick<ICreateHumanViewerCatalogueControllerProps, "source"> =
    props;
  const republish: () => void = createHumanViewerCatalogueRepublish(
    (): void => {
      props.publish(source.catalogue());
    },
  );
  const admission: ReturnType<typeof createHumanViewerAdmission> =
    createHumanViewerAdmission({
      page: props.page,
      admit: props.admit,
      changed: republish,
    });
  source.admitWith(admission.of, admission.peek);
  source.sidecarsChanged(republish);
  return {
    admission,
    retry: (trigger: string): void => {
      const released: number = admission.retry();
      if (released !== 0)
        console.log(
          `ADMISSION RETRY ${new Date().toISOString()} ${released} waiting; ${trigger}`,
        );
      republish();
    },
    readDocument: (doc: string): IHumanViewerCatalogue => source.catalogue(doc),
    settleInputs: (): Promise<IHumanViewerCatalogue> => {
      admission.retry();
      return settleHumanViewerInputs((): IHumanViewerCatalogue => {
        const inventory: IHumanViewerCatalogue = source.catalogue(
          undefined,
          true,
        );
        props.publish(inventory);
        return inventory;
      }, [source.sidecars, source.views, admission]);
    },
    settleDocument: (doc: string): Promise<IHumanViewerCatalogue> => {
      admission.retry(doc);
      const stem: string | null = doc.startsWith("file:")
        ? doc.slice(5).split("/")[0]
        : null;
      const files: string[] =
        stem === null
          ? []
          : [
              stem + ".basis.json.gz",
              stem + ".person.json.gz",
              stem + ".head.json.gz",
              stem + ".body.json.gz",
            ];
      return settleHumanViewerInputs(
        (): IHumanViewerCatalogue => source.catalogue(doc),
        [
          {
            busy: (): boolean => source.sidecars.busy(files),
            settled: (): Promise<void> => source.sidecars.settled(files),
          },
          ...(source.hasOwnInput(doc) ? [] : [source.views]),
          {
            busy: (): boolean => admission.busy(doc),
            settled: (): Promise<void> => admission.settled(doc),
          },
        ],
      ).then((selected: IHumanViewerCatalogue): IHumanViewerCatalogue => {
        props.publish(source.catalogue());
        return selected;
      });
    },
  };
}
