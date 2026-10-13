import type { IAutoMovieHumanPersonDocument } from "@automovie/human";
import type { IAutoMovieHumanConstructionAdmission } from "@automovie/human/common/structures/IAutoMovieHumanConstructionAdmission";
import { createAutoMovieResourceRetirement } from "@automovie/viewer";

import type { IConnectedPersonModel } from "./IConnectedPersonModel";
import type { IConnectedPersonViewport } from "./IConnectedPersonViewport";

/**
 * Own the one accepted construction handed into history and the original
 * admission of a rebuilt history entry. A handoff is consumed once; restoring
 * without one constructs the complete document through the same viewport.
 * Refused frames retire before rejection, retaining the original admission
 * cause together with any resource-retirement failure.
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
}) {
  let handoff: Model | undefined;
  return {
    /** Transfer one already accepted construction into the next history build. */
    handoff: (model: Model): void => {
      handoff = model;
    },
    build: async (document: IAutoMovieHumanPersonDocument): Promise<Model> => {
      const prepared = handoff;
      handoff = undefined;
      if (prepared !== undefined) return prepared;
      const result = await props.viewport.construct(document);
      if (!result.admission.accepted) {
        return createAutoMovieResourceRetirement(
          [
            () => props.viewport.dispose(result.model),
            () => props.viewport.settleRetirements(),
          ],
          {
            error: new Error(
              "This history entry is no longer accepted: " +
                result.admission.failures
                  .map((failure) => failure.owner + ": " + failure.cause)
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
