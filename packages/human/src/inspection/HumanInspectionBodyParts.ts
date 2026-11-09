import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanLimbSources } from "../generation/AutoMovieHumanLimbSources";
import type { HumanInspectionParts } from "./HumanInspectionParts";
import { HumanInspectionPattern } from "./HumanInspectionPattern";

/** Selected actual body-original factories, independent of head and tree assembly. */
export namespace HumanInspectionBodyParts {
  /** Borrowed original observation contract, with no completed skin or bind implied. */
  type IOutput = HumanInspectionParts.IOutput;

  /** One real source record with optional previously requested raw geometry. */
  type IPart = HumanInspectionParts.IPart;

  /**
   * Observe selected actual body originals and their already required source parents.
   * BodyLaw.define consumes this same context and its lazy results. No regional head is composed,
   * and no body tree, final joining or whole-person acceptance is claimed. When requested, trunk
   * tape passes return original definitions. Raw results appear only when the production context
   * was explicitly asked to loft a name. Shared scalar/section preparation is real work;
   * head sources, raw neck geometry, whole bind and tree assembly remain unrequested.
   */
  export function of(
    context: AutoMovieHumanBodyLaw.IOriginal,
    patterns: readonly string[],
  ): IOutput {
    const familyNames: string[] = [
      "trunk",
      "breast.left",
      "breast.right",
      "gluteal.left",
      "gluteal.right",
    ];
    const family: boolean = familyNames.some((name: string): boolean =>
      HumanInspectionPattern.matches(name, patterns, ""),
    );
    const built: ReturnType<typeof AutoMovieHumanBodyLaw.trunkSource> | null =
      family ? AutoMovieHumanBodyLaw.trunkSource(context) : null;
    const records: NonNullable<typeof built>["sources"] = [
      ...(built?.sources ?? []),
    ];
    const requested: Set<string> = new Set(
      patterns.filter((pattern: string): boolean => !pattern.includes("*")),
    );
    const unavailable: Set<string> = new Set();

    // Regional source factories are lazy. A selected hand/foot must not demand
    // complete proximal legs merely to list unrequested parent geometry.
    for (const name of AutoMovieHumanLimbSources.names())
      if (HumanInspectionPattern.matches(name, patterns, ""))
        requested.add(name);
    for (const name of requested) {
      if (
        records.some(
          (source: (typeof records)[number]): boolean => source.name === name,
        )
      )
        continue;
      const definition: ReturnType<typeof AutoMovieHumanBodyLaw.original> =
        AutoMovieHumanBodyLaw.original(context, name);
      if (definition === null) {
        unavailable.add(name);
        continue;
      }
      const result: (typeof records)[number]["result"] =
        context.rawSources?.get(name) ?? { ...definition, loft: null };
      records.push({ name, result });
    }
    const last: Map<string, (typeof records)[number]> = new Map(
      records.map(
        (source: (typeof records)[number]): [string, typeof source] => [
          source.name,
          source,
        ],
      ),
    );
    const completedTrunk: typeof built = context.trunk ?? null;
    const counts: Record<string, number> = {};
    for (const source of records)
      counts[source.name] = (counts[source.name] ?? 0) + 1;
    for (const source of last.values())
      if (source.result.part === null) unavailable.add(source.name);
    return {
      parts: [...last.values()].flatMap(
        (source: (typeof records)[number]): IPart[] =>
          source.result.part === null
            ? []
            : [
                {
                  name: source.name,
                  part: source.result.part,
                  loft: source.result.loft,
                },
              ],
      ),
      scale:
        AutoMovieHumanBodyAnatomy.resolve(context.params).stature /
        context.stature,
      repeats: Object.fromEntries(
        Object.entries(counts).filter(
          ([, count]: [string, number]): boolean => count > 1,
        ),
      ),
      diagnostics: {
        body: [
          ...context.diagnostics,
          ...(context.body?.diagnostics ?? []),
          ...(completedTrunk?.diagnostics ?? []),
          ...records
            .filter(
              (source: (typeof records)[number]): boolean =>
                !completedTrunk?.sources.includes(source),
            )
            .flatMap(
              (
                source: (typeof records)[number],
              ): IOutput["diagnostics"]["body"] => source.result.diagnostics,
            ),
        ],
        head: [],
      },
      sourceRecords: records.map(
        (
          source: (typeof records)[number],
        ): IOutput["sourceRecords"][number] => ({
          name: source.name,
          part: source.result.part !== null,
          loft: source.result.loft !== null,
          inTree: null,
          diagnostics: [...source.result.diagnostics],
        }),
      ),
      observation: {
        stage: "scoped-source-definition",
        finalRealization: "not-run",
        treeParts: [],
        studies: [],
        definitionOnlyParts: [],
        unavailableParts: [...unavailable],
        scope: {
          requested: [...patterns],
          observed: [...last.keys()],
          tree: "not-assembled",
          unrequested:
            "Only requested prejoin original definitions and their direct shared rest/attachment descriptors are observed. A leg original is not a completed proximal trunk contact. Head sources, head-owned bones and whole bind remain unrequested. Foot/toe contacts borrow the same retained distal generating authority; complete proximal legs and trunk tape are not requested by those contacts. Full sources, raw lofts and final realization are not implied.",
        },
      },
    };
  }
}
