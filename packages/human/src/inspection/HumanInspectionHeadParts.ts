import type {
  AutoMovieLoftContract,
  IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanHeadOriginalSources } from "../generation/head/AutoMovieHumanHeadOriginalSources";
import type { HumanInspectionParts } from "./HumanInspectionParts";

/** Explicitly requested actual head originals, without tree assembly or implicit raw. */
export namespace HumanInspectionHeadParts {
  /** Borrowed source/attempt observations; missing stages are not passed. */
  type IOutput = HumanInspectionParts.IOutput;

  /** One actual complete source or explicitly available original guide. */
  type IPart = HumanInspectionParts.IPart;

  /** Observe canonical head originals and actual failed attempts without composing a regional tree or requesting raw lofts. */
  export function of(
    context: AutoMovieHumanBodyLaw.IOriginal,
    patterns: readonly string[],
  ): IOutput {
    if (patterns.length === 0)
      return {
        parts: [],
        scale:
          AutoMovieHumanBodyAnatomy.resolve(context.params).stature /
          context.stature,
        repeats: {},
        diagnostics: { body: [], head: [] },
        sourceRecords: [],
        observation: {
          stage: "scoped-source-definition",
          finalRealization: "not-run",
          treeParts: [],
          studies: [],
          definitionOnlyParts: [],
          unavailableParts: [],
          scope: {
            requested: [],
            observed: [],
            tree: "not-assembled",
            unrequested:
              "No head source was requested; no head owner, constraint, original, raw or tree was prepared.",
          },
        },
      };
    const known: Set<string> = new Set(
      AutoMovieHumanHeadOriginalSources.names(),
    );
    const unknownNames: string[] = patterns.filter(
      (pattern: string): boolean =>
        !pattern.includes("*") && !known.has(pattern),
    );
    if (unknownNames.length !== 0)
      throw new Error(
        "Unknown head original request: " + unknownNames.join(", "),
      );
    const head: ReturnType<typeof context.headSource> = context.headSource();
    const base: typeof head.source = head.source;
    const definition: ReturnType<typeof head.originals> | null = patterns.every(
      (pattern: string): boolean => pattern === base.guides.name,
    )
      ? null
      : head.originals(
          patterns.some((pattern: string): boolean => pattern.includes("*"))
            ? undefined
            : patterns,
        );
    const originals: IAutoMovieViewPart[] =
      definition === null
        ? []
        : [...definition.sources.values(), ...definition.studies];
    const attempts: Map<
      string,
      NonNullable<typeof definition>["attachments"][number]
    > = new Map(
      definition?.attachments.map(
        (
          attempt: NonNullable<typeof definition>["attachments"][number],
        ): [string, typeof attempt] => [attempt.name, attempt],
      ) ?? [],
    );
    const failures: AutoMovieLoftContract.IDiagnostic[] = [
      ...attempts.values(),
    ].flatMap(
      (
        attempt: NonNullable<typeof definition>["attachments"][number],
      ): AutoMovieLoftContract.IDiagnostic[] =>
        attempt.error === null
          ? []
          : [
              {
                producer: attempt.name,
                level: 3,
                contract: "original attachment",
                detail: attempt.error,
              },
            ],
    );
    const unavailable: Set<string> = new Set(
      failures.map(
        (failure: AutoMovieLoftContract.IDiagnostic): string =>
          failure.producer,
      ),
    );
    const parts: IPart[] =
      definition === null
        ? [
            {
              name: base.guides.name,
              guides: {
                source: base.guides,
                curves: base.guideCurves,
                fullSourceAttempt: (): typeof base.closureAttempt =>
                  base.closureAttempt,
              },
              part: base.calibration?.tape.part ?? null,
              fullSource: (): IAutoMovieViewPart => base.closed().tape.part,
              loft: base.raw,
            },
          ]
        : originals
            .filter(
              (part: IAutoMovieViewPart): boolean =>
                !unavailable.has(part.name),
            )
            .map(
              (part: IAutoMovieViewPart): IPart => ({
                name: part.name,
                part,
                loft:
                  part.name === base.guides.name
                    ? base.raw
                    : (definition?.lofts.get(part.name) ?? null),
              }),
            );
    const names: string[] = [
      ...parts.map((part: IPart): string => part.name),
      ...unavailable,
    ];
    return {
      parts,
      scale:
        AutoMovieHumanBodyAnatomy.resolve(context.params).stature /
        context.stature,
      repeats: {},
      diagnostics: {
        body: [],
        head: [
          ...base.diagnostics,
          ...parts.flatMap(
            (part: IPart): AutoMovieLoftContract.IDiagnostic[] =>
              part.loft?.diagnostics ?? [],
          ),
          ...failures,
        ],
      },
      sourceRecords: [
        ...parts.map((part: IPart): IOutput["sourceRecords"][number] => ({
          name: part.name,
          part: part.part !== null,
          loft: part.loft !== null,
          inTree: null,
          diagnostics: [...(part.loft?.diagnostics ?? [])],
        })),
        ...failures.map(
          (
            failure: AutoMovieLoftContract.IDiagnostic,
          ): IOutput["sourceRecords"][number] => ({
            name: failure.producer,
            part: false,
            loft: false,
            inTree: null,
            diagnostics: [failure],
          }),
        ),
      ],
      observation: {
        stage: "scoped-source-definition",
        finalRealization: "not-run",
        treeParts: [],
        studies:
          definition?.studies.map(
            (part: IAutoMovieViewPart): string => part.name,
          ) ?? [],
        definitionOnlyParts: [],
        unavailableParts: [...unavailable],
        scope: {
          requested: [...patterns],
          observed: names,
          tree: "not-assembled",
          unrequested:
            definition === null
              ? "Canonical head original guides are observed. Complete fullness is a deferred explicit top/full-source demand; regional originals, raw lofts and the production tree remain unrequested."
              : definition.requestScope === "selected-top-level"
                ? "Only exact requested top-level originals and their canonical numerical host are observed. Other regional constructors, studies, raw lofts, body and head-tree assembly are unrequested."
                : definition.requestScope === "selected-tape-invariant"
                  ? "Only the requested originals whose mass reads lie on or below nasion are observed, on the pre-closure host that is exact there; the upper tape closure, ears, orbits, raw lofts and head-tree assembly are unrequested."
                  :"The existing complete regional original provider authored its sources and independent studies; nested/ear source selection still retains this whole-catalogue dependency. Their attempts remain explicit; raw, body and complete tree realization are not implied.",
        },
      },
    };
  }
}
