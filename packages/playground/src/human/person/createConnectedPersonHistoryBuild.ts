import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonViewport } from "./IConnectedPersonViewport";

/**
 * Own the one accepted construction handed into history and the original admission of a rebuilt history entry. A handoff is consumed once; restoring without one constructs the complete document through the same viewport. Refused frames retire before rejection, retaining the original admission cause together with any resource-retirement failure.
 *
 * The panel supplies an already accepted handoff for exactly the next matching document; this adapter does not independently compare documents or re-admit that handoff. The ordinary caller consumes it immediately through editor.edit, and the viewport owns final retirement of prepared frames.
 *
 * @evidence contracts/common.md#principled-implementation A one-use matching accepted construction enters history without a second build, while actual history restoration constructs through the same viewport and retains refused-admission cause plus independent retirement failures.
 * @evidence contracts/common.md#clear-and-simple-design The adapter owns the single handoff slot and original model/admission association, leaving document intent/history sequencing to the panel/editor and actual resource completion to the viewport.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The matching accepted-handoff premise is explicit rather than inferred from a similar model, and a newly refused restored entry is retired then rejected without substituting a guessed successful frame.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies one-use matching handoff, no independent document comparison, normal immediate consumption and original cause/retirement ownership.
 * @evidence contracts/performance.md#efficient-algorithms Handoff/consume is constant work, an actual restoration preserves its numerical construction cost and rejected admission formatting visits f owner failures before independent cleanup settlement; no numerical result is cloned here.
 * @evidence contracts/performance.md#reuse-equivalent-work The caller hands off the exact accepted frame already constructed for the editor's next same document, avoiding equivalent duplicate work only under that actual caller premise; other history restores evaluate normally through the viewport.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One handoff frame is held until consumed, with no separate cancellation/close in this adapter; the normal panel consumes it immediately, WeakMap associations do not strongly retain model keys and viewport close owns prepared/native resources. Externally retained adapter handles remain caller-owned.
 *
 * @author Samchon
 */
export function createConnectedPersonHistoryBuild<
  Model extends IConnectedPersonModel,
>(props: {
  /** The real viewport owns construction and resource-retirement completion. */
  viewport: IConnectedPersonViewport<Model>;

  /** Original owner reports associated with the actual prepared model identities. */
  admissions: WeakMap<Model, IAutoMovieHumanConstructionAdmission>;
}): {
  /** Supply the accepted frame for exactly the next matching document build. */
  handoff: (model: Model) => void;

  /** Consume the supplied frame once, otherwise construct and admit the requested history entry. */
  build: (document: IAutoMovieHumanPersonDocument) => Promise<Model>;
} {
  let handoff: Model | undefined;
  return {
    /** Transfer one already accepted construction into the next history build. */
    handoff: (model: Model): void => {
      handoff = model;
    },
    build: async (document: IAutoMovieHumanPersonDocument): Promise<Model> => {
      const prepared: Model | undefined = handoff;
      handoff = undefined;
      if (prepared !== undefined) return prepared;
      const result: Awaited<
        ReturnType<IConnectedPersonViewport<Model>["construct"]>
      > = await props.viewport.construct(document);
      if (!result.admission.accepted) {
        return createAutoMovieResourceRetirement(
          [
            (): void => props.viewport.dispose(result.model),
            (): Promise<void> => props.viewport.settleRetirements(),
          ],
          {
            error: new Error(
              "This history entry is no longer accepted: " +
                result.admission.failures
                  .map(
                    (
                      failure: IAutoMovieHumanConstructionAdmission["failures"][number],
                    ): string => failure.owner + ": " + failure.cause,
                  )
                  .join("; "),
            ),
          },
        )();
      }
      props.admissions.set(result.model, result.admission);
      return result.model;
    },
  };
}
