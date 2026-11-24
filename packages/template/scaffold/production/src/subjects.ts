import type {
  AutoMovieDrawSubjects,
  IAutoMovieDrawSubject,
} from "@automovie/render";

import type { IFilm } from "./IFilm";
import { films } from "./composition/films";
import { subjectOfFilm } from "./subjectOfFilm";

/**
 * The production's films as subjects, one per registered film under the film's
 * name: what the draw-only page `automovie capture --module src/subjects.ts`
 * and `automovie render --module src/subjects.ts` build over this module
 * offers, and what `automovie inspect` shows. Each film becomes its subject by
 * `subjectOfFilm`, so a capture, a delivered frame and the Viewer place and
 * read it the same way.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the subjects are, who draws them, and which mapping makes each one.
 * @evidence contracts/development/implementation.md#principled-implementation Maps the film registry through the one film-to-subject mapping.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One entry per film; the mapping lives in `subjectOfFilm`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No film is named; the props are not read, since films need none.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the registered films; a film is created only when its subject is.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A mapping made once per page.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each subject's dispose releases its film, as `subjectOfFilm` states.
 */
export const subjects: AutoMovieDrawSubjects = (): Readonly<
  Record<string, IAutoMovieDrawSubject>
> =>
  Object.fromEntries(
    Object.entries(films).map(
      ([name, film]: [string, IFilm]): [string, IAutoMovieDrawSubject] => [
        name,
        subjectOfFilm(name, film),
      ],
    ),
  );
