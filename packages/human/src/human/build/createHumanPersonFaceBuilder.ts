import type { IHumanFaceOralMeasurementRegistration } from "../../face/anatomy/oral/IHumanFaceOralMeasurementRegistration";
import type { IHumanFaceHairContactLayout } from "../../face/anatomy/hair/IHumanFaceHairContactLayout";
import type { IHumanFaceMaterialAttachment } from "../../face/structures/IHumanFaceMaterialAttachment";
import { createHumanFaceBasisBuilder } from "../../face/basis/createHumanFaceBasisBuilder";
import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceConstruction } from "../../face/structures/IAutoMovieHumanFaceConstruction";
import type { IAutoMovieHumanFaceConstructionProgress } from "../../face/structures/IAutoMovieHumanFaceConstructionProgress";
import type { IAutoMovieHumanFaceOcclusionOptions } from "../../face/structures/IAutoMovieHumanFaceOcclusionOptions";
import type { IAutoMovieHumanPersonFaceBuild } from "../structures/IAutoMovieHumanPersonFaceBuild";

/**
 * Pair a person's admitted face with its actual generated hair identities.
 *
 * The face producer reports copied IDs at its successful exit. Initialize the
 * observation before constructing it because its neutral check also reports an
 * empty population. Each synchronous call returns its own ID set beside its
 * model, so a later mouth-closure reference build cannot replace the current
 * face's selection. When requested, the source-neutral shape reference is
 * captured by the same call, separately from the mouthClose-zero normal
 * reference. The same successful call supplies compact oral correspondence,
 * including deliberately absent crowns. Omission copies neither measurement
 * state. A refused face publishes no paired result.
 * `census` asks the face producer for its report-only assembly census in
 * `construct`; omission reports its judged relations only.
 * The optional construction-progress observer is passed directly to the face
 * owner, including actual bootstrap and condition completions. An observer
 * exception propagates; the adapter invents no progress or verdict.
 * No geometry, input document, source basis or hair naming rule is changed.
 */
export function createHumanPersonFaceBuilder(
  basis: IAutoMovieHumanFaceBasis,
  occlusion?: IAutoMovieHumanFaceOcclusionOptions,
  readMeasurementStates: boolean = false,
  census: boolean = false,
  observeConstructionProgress?: (
    progress: IAutoMovieHumanFaceConstructionProgress,
  ) => void,
) {
  let emitted: readonly string[] = [];
  let hairContactLayouts: ReadonlyMap<string, IHumanFaceHairContactLayout> = new Map();
  let materialAttachments: ReadonlyMap<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>> = new Map();
  let reference: ReadonlyMap<string, readonly number[]> | undefined;
  let oral: IHumanFaceOralMeasurementRegistration | undefined;
  const build = createHumanFaceBasisBuilder(basis, {
    occlusion,
    observeConstructionProgress,
    ...(census ? { census: true } : {}),
    observeHairParts: (ids) => {
      emitted = ids;
    },
    observeHairContactLayouts: (layouts) => {
      hairContactLayouts = layouts;
    },
    observeMaterialAttachments: (attachments) => {
      materialAttachments = attachments;
    },
    ...(readMeasurementStates
      ? {
          observeReference: (
            value: ReadonlyMap<string, readonly number[]> | undefined,
          ) => {
            reference = value;
          },
        }
      : {}),
    ...(readMeasurementStates
      ? {
          observeOralMeasurements: (
            value: IHumanFaceOralMeasurementRegistration | undefined,
          ) => {
            oral = value;
          },
        }
      : {}),
  });
  const evaluate = (
    document: IAutoMovieHumanFaceBasisDocument,
  ): IAutoMovieHumanPersonFaceBuild => {
    reference = undefined;
    oral = undefined;
    materialAttachments = new Map();
    const model = build(document);
    return { model, hairPartIds: new Set(emitted), hairContactLayouts, materialAttachments, reference, oral };
  };
  return Object.assign(evaluate, {
    construct: (
      document: IAutoMovieHumanFaceBasisDocument,
    ): IAutoMovieHumanFaceConstruction => build.construct(document),
  });
}
