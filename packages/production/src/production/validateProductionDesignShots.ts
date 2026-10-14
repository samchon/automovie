import type { IAutoMovieProductionDesignGraph } from "./IAutoMovieProductionDesignGraph";
import { validateProductionDesignText } from "./validateProductionDesignText";
import { validateProductionDesignInvalid } from "./validateProductionDesignInvalid";
import path from "node:path";
import { validateProductionDesignPositive } from "./validateProductionDesignPositive";
import { validateProductionDesignUniqueTextValues } from "./validateProductionDesignUniqueTextValues";
import { isProductionFrameTime } from "./isProductionFrameTime";
import { validateProductionDesignFinite } from "./validateProductionDesignFinite";
import { validateProductionDesignMissing } from "./validateProductionDesignMissing";
import { validateProductionDesignNamedStates } from "./validateProductionDesignNamedStates";
import { validateProductionDesignUnique } from "./validateProductionDesignUnique";
import { validateProductionDesignPredicates } from "./validateProductionDesignPredicates";
import { IAutoMovieDiagnostic, IAutoMovieFormationDesign } from "@automovie/interface";
import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Check keyed shot identity and canonical project-relative POSIX TypeScript source paths, including case-fold spelling collisions for Windows portability.
 *
 * @evidence contracts/common.md#principled-implementation Time pins, participants, hero ownership, states, camera, events and review-frame declarations retain original order. This neither reads source files nor proves compiled events or visual results.
 * @evidence contracts/common.md#clear-and-simple-design validateProductionDesignShots owns this operation at its existing validation position; the graph coordinator retains diagnostic ordering and final sorting.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retained declaration limits, identity comparisons and numerical policies decide admission; no consumer fixture, expected result or foreign-method replacement changes the decision.
 * @evidence contracts/common.md#meaningful-documentation The account gives this operation's premises, caller ownership and admission limits alongside its dominant work.
 * @evidence contracts/performance.md#efficient-algorithms Shot source strings and nested participants/events/frames are scanned, with formation/model/state reference lookups and predicate-owned searches; sets/maps grow with declared identities.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This synchronous call owns no cross-request cache or pending work; current graph records and registry contents determine each admission.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No handle or task is acquired. Call-local storage becomes unreachable on exit; diagnostics and returned values remain with the caller for its required lifetime and grow with addressed input and findings.
 */
export function validateProductionDesignShots(diagnostics: IAutoMovieDiagnostic[], graph: IAutoMovieProductionDesignGraph, productionRoot: string): void {
const sourceModuleSpellings: Map<string, string> = new Map<string, string>();
for (const [id, shot] of graph.shots) {
    const target: string = `shot:${id}`;
    const file: string = `${productionRoot}/shots/${encodeAutoMoviePathSegment(id)}.json`;
    validateProductionDesignText(diagnostics, shot.id, target, file, "id");
    if (shot.id !== id)
      validateProductionDesignInvalid(
        diagnostics,
        "design-identity-mismatch",
        target,
        file,
        `Shot file identity is "${id}" but value id is "${shot.id}". Rewrite it as a tracked shot contract using one matching id.`,
      );
    validateProductionDesignText(diagnostics, shot.beat, target, file, "beat");
    validateProductionDesignText(diagnostics, shot.source.module, target, file, "source.module");
    validateProductionDesignText(diagnostics, shot.source.export, target, file, "source.export");
    if (
      path.posix.isAbsolute(shot.source.module) ||
      /^[A-Za-z]:/.test(shot.source.module) ||
      shot.source.module.includes("\\") ||
      path.posix.normalize(shot.source.module) !== shot.source.module ||
      shot.source.module
        .split("/")
        .some((segment: string): boolean => segment.length === 0 || segment === "..") ||
      [".ts", ".tsx", ".mts", ".cts"].includes(
        path.posix.extname(shot.source.module),
      ) === false
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-source-path-invalid",
        target,
        file,
        `Source module "${shot.source.module}" is not one canonical project-relative POSIX TypeScript path. Remove absolute or drive roots, backslashes, empty or dot segments, and use a .ts, .tsx, .mts, or .cts extension before writing the shot contract record.`,
      );
    const foldedSourceModule: string = shot.source.module.toLowerCase();
    const priorSourceModule: string | undefined = sourceModuleSpellings.get(foldedSourceModule);
    if (
      priorSourceModule !== undefined &&
      priorSourceModule !== shot.source.module
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-source-path-collision",
        target,
        file,
        `Source module "${shot.source.module}" collides with "${priorSourceModule}" on a case-insensitive filesystem. Use one portable spelling for every shared module binding.`,
      );
    else sourceModuleSpellings.set(foldedSourceModule, shot.source.module);
    validateProductionDesignPositive(
      diagnostics,
      shot.durationSeconds,
      target,
      file,
      "durationSeconds",
    );
    validateProductionDesignUniqueTextValues(
      diagnostics,
      shot.styleIntent ?? [],
      target,
      file,
      "styleIntent",
    );
    if (
      graph.production !== null &&
      Number.isFinite(shot.durationSeconds) &&
      shot.durationSeconds > 0 &&
      isProductionFrameTime(
        shot.durationSeconds,
        graph.production.frameFormat.frameRate ??
          graph.production.frameFormat.fps,
      ) === false
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-frame-clock-invalid",
        target,
        file,
        `Shot "${id}" durationSeconds is off the ${graph.production.frameFormat.fps}fps production clock. Choose an exact integer frame count divided by fps in the tracked shot contract record.`,
      );
    if (shot.storyTime !== undefined) {
      if (
        graph.production !== null &&
        graph.production.storyClock === undefined
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-story-clock-absent",
          target,
          file,
          `Shot "${id}" is pinned to a story clock the production does not keep. Add storyClock to the tracked production design record, or remove ${id}.storyTime.`,
        );
      validateProductionDesignFinite(
        diagnostics,
        shot.storyTime.originSeconds,
        target,
        file,
        "storyTime.originSeconds",
      );
      if (shot.storyTime.rate !== undefined)
        validateProductionDesignPositive(
          diagnostics,
          shot.storyTime.rate,
          target,
          file,
          "storyTime.rate",
        );
    }
    const participantIds: Set<string> = new Set<string>();
    for (const participant of shot.participants) {
      validateProductionDesignText(diagnostics, participant.id, target, file, "participants.id");
      const participantKey: string = `${participant.kind}:${participant.id}`;
      if (participantIds.has(participantKey))
        validateProductionDesignInvalid(
          diagnostics,
          "design-duplicate-id",
          target,
          file,
          `Participant "${participantKey}" is duplicated. Keep each participant once in the tracked shot contract record.`,
        );
      participantIds.add(participantKey);
      if (
        participant.kind === "formation" &&
        graph.formations.has(participant.id) === false
      )
        validateProductionDesignMissing(
          diagnostics,
          target,
          file,
          `formation "${participant.id}"`,
          `Create or correct the formation design record for "${participant.id}" or remove it from ${id}.participants`,
        );
    }
    const formationHeroOwners: Map<string, string> = new Map<string, string>();
    for (const participant of shot.participants) {
      if (participant.kind !== "formation") continue;
      const formation: IAutoMovieFormationDesign | undefined = graph.formations.get(participant.id);
      if (formation === undefined) continue;
      for (const hero of formation.heroOverrides) {
        const owner: string | undefined = formationHeroOwners.get(hero.actor);
        if (owner !== undefined && owner !== formation.id)
          validateProductionDesignInvalid(
            diagnostics,
            "design-duplicate-id",
            target,
            file,
            `Hero actor "${hero.actor}" belongs to participating formations "${owner}" and "${formation.id}" in the same shot. Keep one formation owner per hero actor in ${id}.participants.`,
          );
        else formationHeroOwners.set(hero.actor, formation.id);
      }
    }
    validateProductionDesignNamedStates(
      diagnostics,
      graph,
      shot.opening,
      target,
      file,
      "opening",
    );
    validateProductionDesignNamedStates(
      diagnostics,
      graph,
      shot.closing,
      target,
      file,
      "closing",
    );
    validateProductionDesignText(diagnostics, shot.camera.intent, target, file, "camera.intent");
    validateProductionDesignUniqueTextValues(
      diagnostics,
      shot.camera.requiredSubjects,
      target,
      file,
      "camera.requiredSubjects",
    );
    if (shot.camera.requiredSubjects.length === 0)
      validateProductionDesignInvalid(
        diagnostics,
        "design-collection-empty",
        target,
        file,
        `Shot "${id}" must name at least one required camera subject. Add one in the tracked shot contract record.`,
      );
    if (
      Number.isFinite(shot.camera.maxOcclusionRatio) === false ||
      shot.camera.maxOcclusionRatio < 0 ||
      shot.camera.maxOcclusionRatio > 1
    )
      validateProductionDesignInvalid(
        diagnostics,
        "design-range-invalid",
        target,
        file,
        `Camera maxOcclusionRatio must be between 0 and 1. Fix ${id}.camera in the tracked shot contract record.`,
      );
    const events: Set<string> = new Set<string>();
    for (const event of shot.events) {
      validateProductionDesignUnique(diagnostics, events, event.id, target, file, "events");
      validateProductionDesignUniqueTextValues(
        diagnostics,
        event.subjects,
        target,
        file,
        `events.${event.id}.subjects`,
      );
      if (event.subjects.length === 0)
        validateProductionDesignInvalid(
          diagnostics,
          "design-collection-empty",
          target,
          file,
          `Event "${event.id}" must name at least one subject. Add one in the tracked shot contract record.`,
        );
      validateProductionDesignPredicates(
        diagnostics,
        graph,
        event.predicates,
        target,
        file,
        `events.${event.id}.predicates`,
      );
      if (
        Number.isFinite(event.window.from) === false ||
        Number.isFinite(event.window.to) === false ||
        event.window.from < 0 ||
        event.window.from > event.window.to ||
        event.window.to > shot.durationSeconds
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          `Event "${event.id}" has a window outside shot duration. Fix ${id}.events in the tracked shot contract record.`,
        );
    }
    const frames: Set<string> = new Set<string>();
    if (shot.reviewFrames.length === 0)
      validateProductionDesignInvalid(
        diagnostics,
        "design-collection-empty",
        target,
        file,
        `Shot "${id}" must declare at least one exact review frame and pass. Add reviewFrames in the tracked shot contract record so visual review has a reachable evidence target.`,
      );
    for (const frame of shot.reviewFrames) {
      validateProductionDesignUnique(diagnostics, frames, frame.id, target, file, "reviewFrames");
      if (
        Number.isFinite(frame.time) === false ||
        frame.time < 0 ||
        frame.time > shot.durationSeconds
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-range-invalid",
          target,
          file,
          `Review frame "${frame.id}" time is outside shot duration. Fix ${id}.reviewFrames in the tracked shot contract record.`,
        );
      else if (
        graph.production !== null &&
        isProductionFrameTime(
          frame.time,
          graph.production.frameFormat.frameRate ??
            graph.production.frameFormat.fps,
        ) === false
      )
        validateProductionDesignInvalid(
          diagnostics,
          "design-frame-clock-invalid",
          target,
          file,
          `Review frame "${frame.id}" is off the ${graph.production.frameFormat.fps}fps production clock. Snap its time to an exact frame in the tracked shot contract record.`,
        );
      if (new Set(frame.passes).size !== frame.passes.length)
        validateProductionDesignInvalid(
          diagnostics,
          "design-duplicate-id",
          target,
          file,
          `Review frame "${frame.id}" repeats a pass. Keep each pass once in the tracked shot contract record.`,
        );
      if (frame.passes.length === 0)
        validateProductionDesignInvalid(
          diagnostics,
          "design-collection-empty",
          target,
          file,
          `Review frame "${frame.id}" must request at least one pass. Add a pass in the tracked shot contract record.`,
        );
    }
  }
}
