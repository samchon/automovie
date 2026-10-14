import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignPositive } from "./validateProductionDesignPositive";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import { validateProductionDesignInteger } from "./validateProductionDesignInteger";
import { AUTOMOVIE_MAX_FRAME_PIXELS } from "./AUTOMOVIE_MAX_FRAME_PIXELS";
import { validateProductionDesignBounded } from "./validateProductionDesignBounded";
import { isProductionFrameTime } from "./isProductionFrameTime";
import { validateProductionDesignUniqueTextValues } from "./validateProductionDesignUniqueTextValues";
import { validateProductionDesignUnique } from "./validateProductionDesignUnique";
import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { validateProductionDesignCaptionGraphemeSegmentationIdentity } from "./validateProductionDesignCaptionGraphemeSegmentationIdentity";
import { IAutoMovieDiagnostic, IAutoMovieProductionVisualDeliveryLane, IAutoMovieProductionMixedVisualDeliveryPolicy, IAutoMovieDeliveryCrop, IAutoMovieProductionDeliverable, IAutoMovieShotContract, IAutoMovieShotParticipant, AutoMovieHumanoidBone, IAutoMovieBone } from "@automovie/interface";
import { SHA256_DIGEST_PATTERN, resolveProductionFrameRate } from "@automovie/engine";
import { parseAutoMovieCaptionLanguage } from "@automovie/render";

/**
 * Check production identity, frame/delivery/art declarations, explicit motion mappings and caption profiles in their existing order.
 *
 * @evidence contracts/common.md#principled-implementation Null production adds nothing; schema-admitted fields undergo scalar/raster bounds, closed delivery-lane policy and exact frame-clock checks, then local Sets enforce deliverable/motion/channel/caption identities and graph lookups resolve motion targets. Caption language/segmentation metadata use their owners; these declarations execute no source or provider.
 * @evidence contracts/common.md#clear-and-simple-design This singleton pass owns production field relations and delivery/motion/caption identity populations; rational clock, language and segmentation metadata rules remain delegated owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation States optional-production skip, rational clock and delivery/motion/caption obligations; productionRoot supplies the diagnostic path and findings append without executing source, providers, retargeting or caption segmentation.
 * @evidence contracts/performance.md#efficient-algorithms Delivery, motion mapping and caption profile scans dominate with repeated shot/participant lookups and string identity sets; no raster is allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work The current production/graph supply all field relations and local Sets share identity within each population; language parsing runs once per profile, while repeated shot/clock checks remain actual work without a cross-call cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Lane/motion/bone/caption Sets, mapping arrays and serialized refusal details are declaration-sized temporaries; findings remain in the caller's array without a local quota. No raster, retargeter, caption runtime, native handle or task is allocated.
 */
export function validateProductionDesignProduction(diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, productionRoot: string): void {
const seenDeliverables: Set<string> = new Set<string>();
if (graph.production !== null) {
    const target: string = "production";
    const file: string = `${productionRoot}/production.json`;
    validateProductionDesignText(diagnostics, graph.production.id, target, file, "id");
    validateProductionDesignText(diagnostics, graph.production.title, target, file, "title");
    validateProductionDesignText(diagnostics, graph.production.logline, target, file, "logline");
    validateProductionDesignPositive(
      diagnostics,
      graph.production.targetRuntimeSeconds,
      target,
      file,
      "targetRuntimeSeconds",
    );
    if (
      graph.production.visualDelivery !== "deterministic" &&
      graph.production.visualDelivery !== "repainted" &&
      graph.production.visualDelivery !== "mixed"
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-enum-invalid",
        target,
        file,
        'visualDelivery must be "deterministic", "repainted", or "mixed". Choose the final visual delivery layer in the tracked production design record.',
      );
    const deliveryLanes: IAutoMovieProductionVisualDeliveryLane[] | undefined = graph.production.visualDeliveryLanes;
    const mixedPolicy: IAutoMovieProductionMixedVisualDeliveryPolicy | undefined = graph.production.mixedVisualDeliveryPolicy;
    if (
      graph.production.visualDelivery === "mixed"
        ? deliveryLanes === undefined ||
          deliveryLanes.length === 0 ||
          new Set(deliveryLanes.map((lane: IAutoMovieProductionVisualDeliveryLane): string => lane.occurrence)).size !==
            deliveryLanes.length ||
          deliveryLanes.some(
            (lane: IAutoMovieProductionVisualDeliveryLane): boolean =>
              lane.occurrence.trim().length === 0 ||
              lane.occurrence !== lane.occurrence.trim() ||
              lane.shot.trim().length === 0 ||
              lane.shot !== lane.shot.trim(),
          ) ||
          new Set(deliveryLanes.map((lane: IAutoMovieProductionVisualDeliveryLane): "deterministic" | "repainted" => lane.lane)).size !== 2 ||
          mixedPolicy === undefined ||
          mixedPolicy.version !== 1 ||
          SHA256_DIGEST_PATTERN.test(mixedPolicy.observationDigest) === false
        : deliveryLanes !== undefined || mixedPolicy !== undefined
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-enum-invalid",
        target,
        file,
        "Mixed visual delivery requires one unique explicit occurrence-lane population containing both lanes and one versioned aggregate-observation transition policy; all-one-lane shorthand must omit both fields.",
      );
    if (graph.production.storyClock !== undefined)
      validateProductionDesignText(
        diagnostics,
        graph.production.storyClock.epoch,
        target,
        file,
        "storyClock.epoch",
      );
    validateProductionDesignInteger(
      diagnostics,
      graph.production.frameFormat.width,
      16,
      16_384,
      target,
      file,
      "frameFormat.width",
    );
    validateProductionDesignInteger(
      diagnostics,
      graph.production.frameFormat.height,
      16,
      16_384,
      target,
      file,
      "frameFormat.height",
    );
    if (
      graph.production.frameFormat.width * graph.production.frameFormat.height >
      AUTOMOVIE_MAX_FRAME_PIXELS
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-range-invalid",
        target,
        file,
        `frameFormat width times height exceeds ${AUTOMOVIE_MAX_FRAME_PIXELS} pixels. Reduce the exact production raster so capture can produce the required review evidence.`,
      );
    validateProductionDesignPositive(
      diagnostics,
      graph.production.frameFormat.fps,
      target,
      file,
      "frameFormat.fps",
    );
    try {
      resolveProductionFrameRate(graph.production.frameFormat);
    } catch (error) {
      validateProductionDesignInvalid(
        diagnostics,
        "design-frame-clock-invalid",
        target,
        file,
        // The frame-rate resolver throws nothing but Error refusals.
        `${(error as Error).message} Author one exact reduced rational frame rate and an equal display fps, or use a lossless positive integer fps.`,
      );
    }
    const crop: IAutoMovieDeliveryCrop | undefined = graph.production.frameFormat.crop;
    if (crop !== undefined) {
      validateProductionDesignBounded(
        diagnostics,
        crop.left,
        0,
        1,
        target,
        file,
        "frameFormat.crop.left",
      );
      validateProductionDesignBounded(
        diagnostics,
        crop.top,
        0,
        1,
        target,
        file,
        "frameFormat.crop.top",
      );
      validateProductionDesignBounded(
        diagnostics,
        crop.right,
        0,
        1,
        target,
        file,
        "frameFormat.crop.right",
      );
      validateProductionDesignBounded(
        diagnostics,
        crop.bottom,
        0,
        1,
        target,
        file,
        "frameFormat.crop.bottom",
      );
      if (
        Number.isFinite(crop.left) &&
        Number.isFinite(crop.top) &&
        Number.isFinite(crop.right) &&
        Number.isFinite(crop.bottom) &&
        (crop.left >= crop.right || crop.top >= crop.bottom)
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          "frameFormat.crop must have left < right and top < bottom inside the normalized delivery gate. Correct the crop in the tracked production design record.",
        );
    }
    if (
      Number.isFinite(graph.production.targetRuntimeSeconds) &&
      graph.production.targetRuntimeSeconds > 0 &&
      Number.isFinite(graph.production.frameFormat.fps) &&
      graph.production.frameFormat.fps > 0 &&
      isProductionFrameTime(
        graph.production.targetRuntimeSeconds,
        graph.production.frameFormat.frameRate ??
          graph.production.frameFormat.fps,
      ) === false
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-frame-clock-invalid",
        target,
        file,
        `targetRuntimeSeconds must land on the ${graph.production.frameFormat.fps}fps production clock. Choose an exact integer frame count divided by fps in the tracked production design record.`,
      );
    if (graph.production.artDirection.palette.length === 0)
      validateProductionDesignInvalid(
        diagnostics,
        "design-collection-empty",
        target,
        file,
        "artDirection.palette must contain at least one color. Add a visual palette in the tracked production design record.",
      );
    validateProductionDesignUniqueTextValues(
      diagnostics,
      graph.production.artDirection.palette,
      target,
      file,
      "artDirection.palette",
    );
    validateProductionDesignText(
      diagnostics,
      graph.production.artDirection.silhouettePriority,
      target,
      file,
      "artDirection.silhouettePriority",
    );
    validateProductionDesignText(
      diagnostics,
      graph.production.artDirection.scaleGrammar,
      target,
      file,
      "artDirection.scaleGrammar",
    );
    if (graph.production.deliverables.length === 0)
      validateProductionDesignInvalid(
        diagnostics,
        "design-collection-empty",
        target,
        file,
        "deliverables must contain at least one output. Add a required production deliverable.",
      );
    for (const deliverable of graph.production.deliverables) {
      validateProductionDesignUnique(
        diagnostics,
        seenDeliverables,
        deliverable.id,
        target,
        file,
        "deliverables",
      );
      if (deliverable.kind !== "guide-pass" && deliverable.pass !== undefined)
        validateProductionDesignInvalid(
          diagnostics,
          "design-deliverable-pass-invalid",
          target,
          file,
          `Deliverable "${deliverable.id}:${deliverable.kind}" cannot own structural pass "${deliverable.pass}". Remove pass or change the deliverable to guide-pass.`,
        );
    }
    if (
      graph.production.visualDelivery !== "deterministic" &&
      graph.production.deliverables.some(
        (deliverable: IAutoMovieProductionDeliverable): boolean => deliverable.kind === "feature" && deliverable.required,
      ) === false
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-repaint-feature-required",
        target,
        file,
        "Repainted or mixed visual delivery requires at least one required feature deliverable. A nominal repaint selection cannot ship only deterministic previews, guides, audio, or omitted optional features.",
      );
    const adoptionIds: Set<string> = new Set<string>();
    const adoptionClips: Set<string> = new Set<string>();
    for (const adoption of graph.production.externalMotions ?? []) {
      validateProductionDesignUnique(
        diagnostics,
        adoptionIds,
        adoption.id,
        target,
        file,
        "externalMotions",
      );
      validateProductionDesignUnique(
        diagnostics,
        adoptionClips,
        adoption.clip,
        target,
        file,
        "externalMotions.clip",
      );
      for (const [field, value] of [
        ["asset", adoption.asset],
        ["take", adoption.take],
        ["shot", adoption.shot],
        ["actor", adoption.actor],
        ["clip", adoption.clip],
        ["sourceRig.id", adoption.sourceRig.id],
      ] as const)
        validateProductionDesignText(
          diagnostics,
          value,
          target,
          file,
          `externalMotions.${adoption.id}.${field}`,
        );
      const shot: IAutoMovieShotContract | undefined = graph.shots.get(adoption.shot);
      if (shot === undefined)
        validateProductionDesignMissing(
          diagnostics,
          target,
          file,
          `shot "${adoption.shot}"`,
          `create that shot or correct external motion adoption "${adoption.id}"`,
        );
      else if (
        shot.participants.some(
          (participant: IAutoMovieShotParticipant): boolean =>
            participant.kind === "actor" && participant.id === adoption.actor,
        ) === false
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-reference-missing",
          target,
          file,
          `External motion adoption "${adoption.id}" targets actor "${adoption.actor}" outside shot "${adoption.shot}" participants. Add that actor participant or correct the adoption.`,
        );
      const sourceBones: Set<AutoMovieHumanoidBone> = new Set(
        adoption.sourceRig.bones.map((bone: IAutoMovieBone): AutoMovieHumanoidBone => bone.bone),
      );
      const mappedSources: Set<string> = new Set<string>();
      const mappedTargets: Set<string> = new Set<string>();
      if (adoption.mapping.length === 0)
        validateProductionDesignInvalid(
          diagnostics,
          "design-collection-empty",
          target,
          file,
          `External motion adoption "${adoption.id}" has no explicit source-node mapping. Declare every adopted channel mapping; the builder will not infer one.`,
        );
      for (const mapping of adoption.mapping) {
        if (
          mapping.source.trim().length === 0 ||
          mappedSources.has(mapping.source) ||
          mappedTargets.has(mapping.target) ||
          sourceBones.has(mapping.target) === false
        )
          validateProductionDesignInvalid(
            diagnostics,
            "design-reference-invalid",
            target,
            file,
            `External motion adoption "${adoption.id}" has a blank, duplicate, or source-rig-incompatible mapping ${JSON.stringify(mapping)}. Keep a one-to-one explicit mapping to declared source-rig bones.`,
          );
        mappedSources.add(mapping.source);
        mappedTargets.add(mapping.target);
      }
      if (
        adoption.mode.kind === "humanoid-retarget" &&
        (Number.isFinite(adoption.mode.translationScale) === false ||
          adoption.mode.translationScale <= 0)
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          `External motion adoption "${adoption.id}" translationScale must be finite and positive. Correct the explicit retarget scale.`,
        );
    }
    const captionIds: Set<string> = new Set<string>();
    const captionLanguages: Set<string> = new Set<string>();
    for (const profile of graph.production.captionReadabilityProfiles ?? []) {
      validateProductionDesignUnique(
        diagnostics,
        captionIds,
        profile.id,
        target,
        file,
        "captionReadabilityProfiles",
      );
      validateProductionDesignText(
        diagnostics,
        profile.language,
        target,
        file,
        "captionReadabilityProfiles.language",
      );
      const languageIdentity: ReturnType<typeof parseAutoMovieCaptionLanguage> = parseAutoMovieCaptionLanguage(profile.language);
      if (languageIdentity === null)
        validateProductionDesignInvalid(
          diagnostics,
          "design-reference-invalid",
          target,
          file,
          `Caption readability profile "${profile.id}" language "${profile.language}" is not a well-formed RFC 5646 tag. Correct its language without inferring a replacement.`,
        );
      else if (captionLanguages.has(languageIdentity.comparisonKey))
        validateProductionDesignInvalid(
          diagnostics,
          "design-duplicate-id",
          target,
          file,
          `Caption readability profile language "${profile.language}" duplicates an existing language by ASCII case-insensitive identity. Keep one profile for that language identity.`,
        );
      else captionLanguages.add(languageIdentity.comparisonKey);
      validateProductionDesignCaptionGraphemeSegmentationIdentity(
        diagnostics,
        profile.segmentation,
        profile.id,
        target,
        file,
      );
      if (!Number.isSafeInteger(profile.version) || profile.version <= 0)
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          `Caption readability profile "${profile.id}" version must be a positive safe integer.`,
        );
      for (const [field, boundary] of Object.entries({
        maxGraphemesPerSecond: profile.maxGraphemesPerSecond,
        maxLinesPerCue: profile.maxLinesPerCue,
        maxGraphemesPerLine: profile.maxGraphemesPerLine,
        minDurationFrames: profile.minDurationFrames,
        minGapFrames: profile.minGapFrames,
      }))
        if (Number.isFinite(boundary.value) === false || boundary.value < 0)
          validateProductionDesignInvalid(
            diagnostics,
            "design-range-invalid",
            target,
            file,
            `Caption readability profile "${profile.id}" ${field}.value must be finite and non-negative.`,
          );
    }
  }
}
