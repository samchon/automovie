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
 * The face producer reports copied IDs at its successful exit. Initialize the observation before constructing it because its neutral check also reports an empty population. Each synchronous call returns its own ID set beside its model, so a later mouth-closure reference build cannot replace the current face's selection. When requested, the source-neutral shape reference is captured by the same call, separately from the mouthClose-zero normal reference. The same successful call supplies compact oral correspondence, including deliberately absent crowns. Omission copies neither measurement state. A refused face publishes no paired result.
 *
 * `census` asks the face producer for its report-only assembly census in `construct`; omission reports its judged relations only. The optional construction-progress observer is passed directly to the face owner, including actual bootstrap and condition completions. An observer exception propagates; the adapter invents no progress or verdict.
 *
 * No geometry, input document, source basis or hair naming rule is changed. This adapter is synchronous and owns only the latest observer snapshots; returned successful records retain their own ID set and owned producer maps. It establishes no concurrent or reentrant evaluation protocol.
 *
 * @evidence contracts/common.md#principled-implementation Success observers pair actual generated IDs, contact layouts and material seats with the same callable face result; optional reference/oral state is reset per call and construction delegates its own report directly.
 * @evidence contracts/common.md#clear-and-simple-design One adapter separates successful paired model consumption from explicit construction reports without a second face geometry or progress implementation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Actual emitted IDs select hair rather than a naming heuristic, observer failures propagate, and synchronous latest-state pairing supplies no reentrancy/concurrency guarantee.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes success pairing, optional measurement snapshots, construction census/progress and current snapshot lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Face compilation/evaluation includes the producer's actual geometry and admission costs; this wrapper adds a copied H-ID set and requested producer snapshot copies, not a second model build per call.
 * @evidence contracts/performance.md#reuse-equivalent-work Callable and construct share one producer and its own validated cache; the wrapper reuses no snapshot across changed documents and each successful result keeps its own hair selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The adapter retains the producer and latest observer maps until dropped or overwritten; retained result snapshots scale with caller-held builds, with no wrapper task, timer or independent cache.
 */
export function createHumanPersonFaceBuilder(
  basis: IAutoMovieHumanFaceBasis,
  occlusion?: IAutoMovieHumanFaceOcclusionOptions,
  readMeasurementStates: boolean = false,
  census: boolean = false,
  observeConstructionProgress?: (
    progress: IAutoMovieHumanFaceConstructionProgress,
  ) => void,
): ((document: IAutoMovieHumanFaceBasisDocument) => IAutoMovieHumanPersonFaceBuild) & { construct: (document: IAutoMovieHumanFaceBasisDocument) => IAutoMovieHumanFaceConstruction } {
  let emitted: readonly string[] = [];
  let hairContactLayouts: ReadonlyMap<string, IHumanFaceHairContactLayout> = new Map();
  let materialAttachments: ReadonlyMap<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>> = new Map();
  let reference: ReadonlyMap<string, readonly number[]> | undefined;
  let oral: IHumanFaceOralMeasurementRegistration | undefined;
  const build: ReturnType<typeof createHumanFaceBasisBuilder> = createHumanFaceBasisBuilder(basis, {
    occlusion,
    observeConstructionProgress,
    ...(census ? { census: true } : {}),
    observeHairParts: (ids: readonly string[]): void => {
      emitted = ids;
    },
    observeHairContactLayouts: (layouts: ReadonlyMap<string, IHumanFaceHairContactLayout>): void => {
      hairContactLayouts = layouts;
    },
    observeMaterialAttachments: (attachments: ReadonlyMap<string, ReadonlyMap<number, IHumanFaceMaterialAttachment>>): void => {
      materialAttachments = attachments;
    },
    ...(readMeasurementStates
      ? {
          observeReference: (
            value: ReadonlyMap<string, readonly number[]> | undefined,
          ): void => {
            reference = value;
          },
        }
      : {}),
    ...(readMeasurementStates
      ? {
          observeOralMeasurements: (
            value: IHumanFaceOralMeasurementRegistration | undefined,
          ): void => {
            oral = value;
          },
        }
      : {}),
  });
  const evaluate: (document: IAutoMovieHumanFaceBasisDocument) => IAutoMovieHumanPersonFaceBuild = (
    document: IAutoMovieHumanFaceBasisDocument,
  ): IAutoMovieHumanPersonFaceBuild => {
    reference = undefined;
    oral = undefined;
    materialAttachments = new Map();
    const model: IAutoMovieHumanPersonFaceBuild["model"] = build(document);
    return { model, hairPartIds: new Set(emitted), hairContactLayouts, materialAttachments, reference, oral };
  };
  return Object.assign(evaluate, {
    construct: (
      document: IAutoMovieHumanFaceBasisDocument,
    ): IAutoMovieHumanFaceConstruction => build.construct(document),
  });
}
