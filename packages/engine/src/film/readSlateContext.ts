import { IAutoMovieSlate } from "@automovie/interface";
import { IAutoMovieStoredContext } from "./IAutoMovieStoredContext";
import { IAutoMovieStoredContextRequest } from "./IAutoMovieStoredContextRequest";

/**
 * Answer stored-context requests from the production slate. Geometry-dependent
 * engine queries (`getReach`, `getResolvedPose`, `measureDistance`) need their
 * own resolver inputs, so this helper intentionally covers only state already
 * present on {@link IAutoMovieSlate}.
 *
 * @evidence requirements/acceptance/scope-targets-and-authority.md#acceptance-requestable-unit readSlateContext keeps the requested review unit explicit: Answer stored-context requests from the production slate. Geometry-dependent engine queries (`getReach`, `getResolvedPose`, `measureDistance`) need their own resolver inputs, so this helper intentionally covers only state already present on {@link IAutoMovieSlate}.
 * @evidence specifications/review-and-acceptance/target-scope-and-context.md#review-system-scope-selection readSlateContext realizes explicit review-scope selection: Answer stored-context requests from the production slate. Geometry-dependent engine queries (`getReach`, `getResolvedPose`, `measureDistance`) need their own resolver inputs, so this helper intentionally covers only state already present on {@link IAutoMovieSlate}.
 */
export const readSlateContext = (
  slate: IAutoMovieSlate,
  request: IAutoMovieStoredContextRequest,
): IAutoMovieStoredContext => {
  switch (request.type) {
    case "getScript":
      return slate.script;
    case "getScene":
      return slate.scene;
    case "getShot":
      return findUniqueOrNull({
        items: slate.shots,
        matches: (shot) => shot.id === `shot:${request.beat}`,
        key: `shot:${request.beat}`,
        label: "shot id",
        path: (index) => `slate.shots[${index}].id`,
      });
    case "getNotes":
      return request.beat === undefined
        ? slate.notes
        : slate.notes.filter((note) => note.beat === request.beat);
    case "getBeatEnd":
      return findUniqueOrNull({
        items: slate.beatEnds,
        matches: (end) => end.beat === request.beat,
        key: request.beat,
        label: "beat end",
        path: (index) => `slate.beatEnds[${index}].beat`,
      });
  }
  const unknown = request as unknown as { type: unknown };
  throw new Error(`unknown slate context request "${String(unknown.type)}"`);
};
