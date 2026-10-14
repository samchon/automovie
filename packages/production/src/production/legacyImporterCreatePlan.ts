import { IAutoMovieDiagnostic, IAutoMovieLegacyImportPlan, IAutoMovieLegacySourceTodo, IAutoMovieProductionDesign } from "@automovie/interface";
import { AutoMovieProject } from "../project/AutoMovieProject";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes, encodeAutoMoviePathSegment } from "./contentIdentity";
import { legacyImporterLegacyImportProtocol } from "./legacyImporterLegacyImportProtocol";
import type { legacyImporterLegacySnapshot } from "./legacyImporterLegacySnapshot";
import { legacyImporterInventoryEntries } from "./legacyImporterInventoryEntries";
import { legacyImporterDraftShotContract } from "./legacyImporterDraftShotContract";
import { legacyImporterImportWarning } from "./legacyImporterImportWarning";
import { legacyImporterProjectIdOf } from "./legacyImporterProjectIdOf";

/**
 * Compose a fingerprinted v1-import draft from the captured inventory and validated slate. Runtime rounds to at least one frame; raster, neutral art direction and preview delivery are explicit reconstruction defaults rather than recovered source contracts.
 *
 * @evidence contracts/common.md#principled-implementation Validated slate duration/fps and exact captured byte inventory determine timing and provenance; canonical JSON plus the shared v1 protocol binds every semantic plan member except its derived fingerprint.
 * @evidence contracts/common.md#clear-and-simple-design One composer owns draft defaults, shot/source todos and diagnostic order, while inventory hashing and shot drafting remain focused helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Defaults 30 fps, 1280x720 sRGB and neutral art direction are exposed by warnings and draft semantics; legacy cuts, source modules and camera subjects are never claimed recovered when absent.
 * @evidence contracts/common.md#meaningful-documentation Documents one-frame rounding, default-versus-authored facts, byte-grounded identity and the need to reconstruct and review production designs/source.
 * @evidence contracts/performance.md#efficient-algorithms Builds S shot drafts and diagnostic rows, F-file inventory and complete canonical plan encoding; inventory's per-file asset scan adds O(F*A), sorting O(F log F) and byte hashing/encoding add their full input lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses captured snapshot bytes and shared encoding/digest primitives within one plan; no mutable snapshot or draft is globally memoized.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned inventories, baselines, drafts and diagnostics retain population-sized values without a numeric cap; temporary encoding strings/buffers expire and this composer acquires no file or lock.
 */
export const legacyImporterCreatePlan: (snapshot: legacyImporterLegacySnapshot, legacy: {
    slate: ReturnType<AutoMovieProject["writableSlate"]>;
    props: number;
    actors: number;
  }) => IAutoMovieLegacyImportPlan = (
  snapshot: legacyImporterLegacySnapshot,
  legacy: {
    slate: ReturnType<AutoMovieProject["writableSlate"]>;
    props: number;
    actors: number;
  },
): IAutoMovieLegacyImportPlan => {
  const fps: number = legacy.slate.film?.fps ?? 30;
  const rawRuntime: number = legacy.slate.shots.reduce(
    (sum: number, shot: ReturnType<AutoMovieProject["writableSlate"]>["shots"][number]): number => sum + shot.duration,
    0,
  );
  const targetRuntimeSeconds: number = Math.max(1, Math.round(rawRuntime * fps)) / fps;
  const projectId: string = legacyImporterProjectIdOf(snapshot.root);
  const productionDraft: IAutoMovieProductionDesign = {
    id: projectId,
    title: projectId,
    logline:
      legacy.slate.script?.logline.trim() ||
      "Legacy project import awaiting treatment reconstruction.",
    targetRuntimeSeconds,
    visualDelivery: "deterministic",
    frameFormat: {
      width: 1280,
      height: 720,
      fps,
      colorSpace: "srgb",
    },
    artDirection: {
      style: "primitive-3d",
      palette: ["#808080"],
      silhouettePriority:
        "Draft only: reconstruct silhouette priorities from legacy references.",
      scaleGrammar:
        "Draft only: reconstruct scale grammar from legacy scenes and assets.",
    },
    deliverables: [{ id: "legacy-preview", kind: "preview", required: false }],
  };
  const shotContractDrafts: ReturnType<typeof legacyImporterDraftShotContract>[] = legacy.slate.shots.map((shot: ReturnType<AutoMovieProject["writableSlate"]>["shots"][number]): ReturnType<typeof legacyImporterDraftShotContract> =>
    legacyImporterDraftShotContract(shot, fps),
  );
  const sourceTodos: IAutoMovieLegacySourceTodo[] = shotContractDrafts.map(
    (shot: ReturnType<typeof legacyImporterDraftShotContract>): { shot: string; module: string; export: string; reason: string; } => ({
      shot: shot.id,
      module: shot.source.module,
      export: shot.source.export,
      reason:
        "Legacy storage persisted compiled motion references, not the authoring TypeScript that produced them. Write and review this source before compilation.",
    }),
  );
  const diagnostics: IAutoMovieDiagnostic[] = [
    legacyImporterImportWarning(
      "legacy-frame-format-defaulted",
      "production",
      null,
      "Legacy storage has no authoritative raster or color-space contract. Review the 1280x720 sRGB draft before activating it.",
    ),
    legacyImporterImportWarning(
      "legacy-art-direction-defaulted",
      "production",
      null,
      "Legacy storage has no structured production art direction. Replace the neutral palette and draft grammar from project evidence.",
    ),
    legacyImporterImportWarning(
      "legacy-edit-reconstruction-required",
      "film",
      "film.json",
      "Legacy film cuts remain untouched and are not promoted to a production edit contract. Reconstruct and review the edit timeline.",
    ),
    legacyImporterImportWarning(
      "legacy-design-reconstruction-required",
      "legacy-project",
      null,
      `Legacy scenes, ${legacy.props} props, and ${legacy.actors} actor contexts remain evidence only. Author production world, model, formation, and acceptance designs explicitly.`,
    ),
    ...sourceTodos.map((todo: IAutoMovieLegacySourceTodo): IAutoMovieDiagnostic =>
      legacyImporterImportWarning(
        "legacy-source-unrecoverable",
        `shot:${todo.shot}`,
        todo.module,
        todo.reason,
      ),
    ),
    ...legacy.slate.shots
      .filter((shot: ReturnType<AutoMovieProject["writableSlate"]>["shots"][number]): boolean => shot.performances.length === 0)
      .map((shot: ReturnType<AutoMovieProject["writableSlate"]>["shots"][number]): IAutoMovieDiagnostic =>
        legacyImporterImportWarning(
          "legacy-camera-subject-reconstruction-required",
          `shot:${shot.id}`,
          `src/shots/${encodeAutoMoviePathSegment(shot.id)}.ts`,
          `Legacy shot "${shot.id}" names no performing scene node, so its readable camera subject cannot be inferred. Choose at least one compiled scene-node or formation id before submitting the production shot contract.`,
        ),
      ),
    ...[...snapshot.files]
      .filter(([, bytes]: [string, Uint8Array<ArrayBufferLike> | null]): boolean => bytes === null)
      .map(([relative]: [string, Uint8Array<ArrayBufferLike> | null]): IAutoMovieDiagnostic =>
        legacyImporterImportWarning(
          "legacy-asset-missing",
          "legacy-project",
          relative,
          `Registered legacy asset "${relative}" is absent. Restore or unregister it before relying on imported production evidence.`,
        ),
      ),
  ];
  const inventory: ReturnType<typeof legacyImporterInventoryEntries> = legacyImporterInventoryEntries(snapshot.files, snapshot.assets);
  const content: Omit<IAutoMovieLegacyImportPlan, "fingerprint"> = {
    version: 1 as const,
    legacyRevision: snapshot.revision,
    inventory,
    rollbackBaseline: snapshot.rollbackBaseline,
    productionDraft,
    shotContractDrafts,
    sourceTodos,
    diagnostics,
  };
  return {
    ...content,
    fingerprint: digestAutoMovieBytes(
      canonicalAutoMovieJsonBytes({
        protocol: legacyImporterLegacyImportProtocol,
        ...content,
      }),
    ),
  };
};
