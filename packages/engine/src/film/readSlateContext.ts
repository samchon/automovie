import { IAutoMovieSlate } from "@automovie/interface";

import { IAutoMovieStoredContext } from "./IAutoMovieStoredContext";
import { IAutoMovieStoredContextRequest } from "./IAutoMovieStoredContextRequest";

/**
 * Answer a stored-context request from the production slate.
 *
 * `getScript` and `getScene` return the slate's slice, `null` before its stage
 * has run. `getShot` returns the shot whose id is `shot:<beat>`, the id a built
 * beat's shot carries, or `null` when the beat has none yet. `getNotes` returns
 * every open note, or only the notes filed on `beat` when one is given.
 * `getBeatEnd` returns the end state recorded for `beat`, or `null`. Results are
 * the slate's own objects, not copies.
 *
 * Throws when two shots share the requested id or two end states share the
 * requested beat, naming both positions, because answering with either would
 * hide a slate that contradicts itself; and on a request type outside the
 * stored set. Geometry queries (`getReach`, `getResolvedPose`,
 * `measureDistance`) need resolver inputs the slate does not hold, so they are
 * not part of the stored set.
 *
 * @param slate The production's running context.
 * @param request The stored-context query.
 * @returns The requested slice, record, list, or `null`.
 *
 * @evidence contracts/common.md#principled-implementation An exhaustive switch over the stored request union, with a runtime refusal after it for a type the union does not allow, since a request crosses a process boundary; single-record lookups scan for every match so a duplicate is reported rather than resolved by position.
 * @evidence contracts/common.md#clear-and-simple-design One switch per request type with the uniqueness rule in one private helper shared by `getShot` and `getBeatEnd`; geometry-dependent requests stay with their resolvers instead of widening this reader's inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No beat or shot is special-cased; `shot:<beat>` is the shot id convention the harness gives a built beat's shot, and a duplicate throws instead of returning the first.
 * @evidence contracts/common.md#meaningful-documentation States the answer and empty answer of every request type, that results alias the slate, every throw and why, and why geometry queries are excluded.
 * @evidence contracts/performance.md#efficient-algorithms One pass over the shots, notes or end states for the request, O(n) in that slice; a full scan is required because uniqueness cannot be proven by stopping at the first match.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answers one request against the current slate; the slate changes between stages, so an index built here would need invalidation the caller does not provide.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; a filtered note list is a fresh array the caller owns, and every other answer is a slate object.
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
        matches: (shot: IAutoMovieSlate["shots"][number]): boolean =>
          shot.id === `shot:${request.beat}`,
        key: `shot:${request.beat}`,
        label: "shot id",
        path: (index: number): string => `slate.shots[${index}].id`,
      });
    case "getNotes":
      return request.beat === undefined
        ? slate.notes
        : slate.notes.filter(
            (note: IAutoMovieSlate["notes"][number]): boolean =>
              note.beat === request.beat,
          );
    case "getBeatEnd":
      return findUniqueOrNull({
        items: slate.beatEnds,
        matches: (end: IAutoMovieSlate["beatEnds"][number]): boolean =>
          end.beat === request.beat,
        key: request.beat,
        label: "beat end",
        path: (index: number): string => `slate.beatEnds[${index}].beat`,
      });
  }
  const unknown: { type: unknown } = request as unknown as { type: unknown };
  throw new Error(`unknown slate context request "${String(unknown.type)}"`);
};

/** The one item `matches` accepts, `null` for none, or a throw for two. */
const findUniqueOrNull = <T,>(props: {
  items: readonly T[];
  matches: (item: T) => boolean;
  key: string;
  label: string;
  path: (index: number) => string;
}): T | null => {
  let found: { item: T; index: number } | null = null;
  for (let index: number = 0; index < props.items.length; index++) {
    const item: T = props.items[index]!;
    if (!props.matches(item)) continue;
    if (found !== null)
      throw new Error(
        `${props.label} "${props.key}" is duplicated at ${props.path(index)}; first declared at ${props.path(found.index)}`,
      );
    found = { item, index };
  }
  return found?.item ?? null;
};
