import { IAutoMovieShotContract } from "@automovie/interface";
import { AutoMovieProject } from "../project/AutoMovieProject";
import { encodeAutoMoviePathSegment } from "./contentIdentity";

/**
 * Create one explicitly unfinished shot contract on the frame grid, with at least one frame, unique performing-node participants and an encoded authoring-module path. Legacy camera identity becomes a reconstruction intent, not a recovered camera program.
 *
 * @evidence contracts/common.md#principled-implementation Frame-grid rounding uses the validated fps and nonnegative duration, while a Set preserves first-seen participant order without duplicate node subjects.
 * @evidence contracts/common.md#clear-and-simple-design Owns only one shot's draft fields; the plan composer creates source todos and missing-subject warnings from the complete slate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts buildLegacyShot names required future authoring rather than generated recovered code, and empty participants remain empty instead of choosing a fixture hero.
 * @evidence contracts/common.md#meaningful-documentation States minimum-frame duration, participant order/deduplication and the reconstruction status of module and camera facts.
 * @evidence contracts/performance.md#efficient-algorithms For P performances, expected Set membership and participant mapping cost O(P) with O(P) retained IDs; encoded path/message work follows shot and camera string lengths.
 * @evidence contracts/performance.md#reuse-equivalent-work Repeated participant IDs are deduplicated within this shot, while different shot drafts remain separate because timing, source identity and camera intent differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned draft arrays and strings escape; no renderer, module task or file is created by declaring its authoring path.
 */
export const legacyImporterDraftShotContract: (shot: ReturnType<AutoMovieProject["writableSlate"]>["shots"][number], fps: number) => IAutoMovieShotContract = (
  shot: ReturnType<AutoMovieProject["writableSlate"]>["shots"][number],
  fps: number,
): IAutoMovieShotContract => {
  const durationSeconds: number =
    Math.max(1, Math.round(Math.max(shot.duration, 0) * fps)) / fps;
  const actors: string[] = [
    ...new Set(shot.performances.map((performance: ReturnType<AutoMovieProject["writableSlate"]>["shots"][number]["performances"][number]): string => performance.node)),
  ];
  return {
    id: shot.id,
    beat: shot.id,
    source: {
      module: `src/shots/${encodeAutoMoviePathSegment(shot.id)}.ts`,
      export: "buildLegacyShot",
    },
    durationSeconds,
    participants: actors.map((id: string): { kind: "actor"; id: string; } => ({ kind: "actor", id })),
    opening: [],
    closing: [],
    camera: {
      intent: `Reconstruct legacy camera "${shot.camera}" from scene and shot evidence.`,
      requiredSubjects: actors,
      maxOcclusionRatio: 1,
    },
    events: [],
    reviewFrames: [{ id: "legacy-start", time: 0, passes: ["beauty"] }],
  };
};
