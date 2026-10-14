import { type IAutoMovieAssetUse, type IAutoMovieExternalMotionReceiptResource, type IAutoMovieExternalMotionMappingEntry, type IAutoMovieMotion, type IAutoMovieExternalMotionTake, AutoMovieHumanoidBone, IAutoMovieAssetProvenance } from "@automovie/interface";
import { importedNodeClipToAutoMovieMotion } from "@automovie/engine";
import { type IAutoMovieExternalModelInspection, adoptAutoMovieExternalMotion } from "@automovie/ingest";

import { type IAutoMovieProductionContentInput } from "../IAutoMovieProductionContentInput";
import { errorMessage } from "../designDerivation/errorMessage";
import { type IProductionExternalMotionAdoption } from "../IProductionExternalMotionAdoption";
import { externalMotionBasisOf } from "./externalMotionBasisOf";
import { type IProductionAssetInventoryContext } from "./IProductionAssetInventoryContext";

/**
 * Apply each explicit motion adoption to its already inspected source take and source rig.
 *
 * @evidence contracts/common.md#principled-implementation Adoption/clip ids must be nonblank and unique, source provenance/use/cache must match, then ingest adoption and engine clip conversion preserve the declared mapping, mode and take.
 * @evidence contracts/common.md#clear-and-simple-design Source inspection is earlier; this phase produces the normalized adoption map consumed by the shot-specific external-motion resolver.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No alternate take, rig, target or mapping is inferred after failure. Per-declaration errors remain diagnostics, and a partial adoption map is not an error-free build verdict.
 * @evidence contracts/common.md#meaningful-documentation States id/clip uniqueness, explicit source/decision inputs, retained source basis/closure and failure diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms Includes declaration record searches, mapping copies, actual adoption validation/track copying and engine clip conversion; repeated source searches and motion populations determine cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses successful source inspections and closures from this same invocation; distinct adoption decisions still execute independently because mappings/modes can differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned adoptions retain their source facts, receipt and converted motion through the build; sizes follow declared takes/tracks/mappings without acquiring IO or native tasks.
 *
 * @author Samchon
 */
export function adoptProductionAssetMotions(context: IProductionAssetInventoryContext): Map<string, IProductionExternalMotionAdoption> {
  const { records, content, motionInspections, motionClosures, diagnostic, graph, productionId }: IProductionAssetInventoryContext = context;
const externalMotions: Map<string, IProductionExternalMotionAdoption> = new Map<string, IProductionExternalMotionAdoption>();
const externalMotionClips: Map<string, string> = new Map<string, string>();
for (const declaration of graph.production?.externalMotions ?? []) {
    const priorClip: string | undefined = externalMotionClips.get(declaration.clip);
    if (
      externalMotions.has(declaration.id) ||
      declaration.id.trim().length === 0 ||
      declaration.clip.trim().length === 0 ||
      priorClip !== undefined
    ) {
      diagnostic(
        "source-motion-adoption-invalid",
        declaration.id || "external-motion-adoption",
        priorClip === undefined
          ? `External motion adoption and clip ids must be non-blank and unique, but received adoption "${declaration.id}" and clip "${declaration.clip}".`
          : `External motion adoption "${declaration.id}" repeats clip "${declaration.clip}" already owned by "${priorClip}". Keep one adoption per clip identity.`,
      );
      continue;
    }
    externalMotionClips.set(declaration.clip, declaration.id);
    const record: IAutoMovieAssetProvenance | undefined = records.find(
      (asset: IAutoMovieAssetProvenance) : boolean => asset.path === declaration.asset,
    );
    const input: IAutoMovieProductionContentInput | undefined = content.get(declaration.asset);
    const inspection: IAutoMovieExternalModelInspection | undefined = motionInspections.get(declaration.asset);
    if (
      record?.motion === undefined ||
      input?.bytes === null ||
      input === undefined ||
      inspection === undefined ||
      record.uses.some(
        (use: IAutoMovieAssetUse) : boolean =>
          use.production === productionId &&
          use.consumer.kind === "motion-adoption" &&
          use.consumer.id === declaration.id,
      ) === false
    ) {
      diagnostic(
        "asset-motion-provenance-missing",
        declaration.id,
        `External motion adoption "${declaration.id}" requires current motion provenance, resident digest-matched bytes, a successful inspection, and one matching motion-adoption use on asset "${declaration.asset}".`,
      );
      continue;
    }
    try {
      if (inspection.motion === undefined)
        throw new Error("External motion inspection has no motion basis.");
      const receipt: ReturnType<typeof adoptAutoMovieExternalMotion> = adoptAutoMovieExternalMotion({
        inspection,
        source: {
          path: declaration.asset,
          digest: record.digest,
          byteLength: input.bytes.byteLength,
        },
        decision:
          declaration.mode.kind === "native"
            ? {
                mode: "native",
                take: declaration.take,
                sourceRig: declaration.sourceRig,
                mapping: declaration.mapping.map((entry: IAutoMovieExternalMotionMappingEntry) : { node: string; bone: AutoMovieHumanoidBone; } => ({
                  node: entry.source,
                  bone: entry.target,
                })),
              }
            : {
                mode: "retarget",
                take: declaration.take,
                sourceRig: declaration.sourceRig,
                mapping: declaration.mapping.map((entry: IAutoMovieExternalMotionMappingEntry) : { node: string; bone: AutoMovieHumanoidBone; } => ({
                  node: entry.source,
                  bone: entry.target,
                })),
                target: declaration.actor,
                translationScale: declaration.mode.translationScale,
              },
      });
      const sourceMotion: IAutoMovieMotion = importedNodeClipToAutoMovieMotion({
        clip: receipt.take,
        sourceSkeleton: receipt.handoff.sourceRig,
        mapping: receipt.handoff.mapping,
        motionId: declaration.clip,
      });
      const sourceTake: IAutoMovieExternalMotionTake | undefined = record.motion.takes.find(
        (take: IAutoMovieExternalMotionTake) : boolean => take.id === declaration.take,
      );
      const sourceClosure: IAutoMovieExternalMotionReceiptResource[] | undefined = motionClosures.get(declaration.asset);
      if (sourceTake === undefined || sourceClosure === undefined)
        throw new Error(
          `External motion take "${declaration.take}" or its inspected source closure is absent from manifest provenance.`,
        );
      externalMotions.set(declaration.id, {
        declaration,
        receipt,
        sourceClosure,
        sourceBasis: externalMotionBasisOf(inspection.motion),
        sourceTake: { ...sourceTake },
        sourceMotion,
      });
    } catch (error) {
      diagnostic(
        "source-motion-adoption-invalid",
        declaration.id,
        `External motion adoption "${declaration.id}" is invalid: ${errorMessage(error)} Correct the selected take, source rig, mapping, or mode; the builder will not infer a replacement.`,
      );
    }
  }
  return externalMotions;
}
