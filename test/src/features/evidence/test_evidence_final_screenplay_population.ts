import {
  type IAutoMovieScreenplayDocumentIdentity,
  projectAutoMovieMarkdownSyntax,
  validateAutoMovieFinalScreenplayPopulation,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

/**
 * Final language revision cannot change the frozen screenplay address space.
 *
 * Scenarios:
 *
 * 1. Disabled empty populations pass without reading; resident residue refuses.
 * 2. Active empty, missing, extra, renamed, and reordered files refuse.
 * 3. Changed H1, unit count, depth, anchor, lineage, title, or order refuses.
 * 4. Draft annotations refuse and evidence-stage citations cannot swap parents.
 * 5. Later-stage annotations and revised body language preserve identity;
 *    a changed group title refuses in the draft identity check.
 * 6. A tab after zero through three spaces is indented code; evidence examples
 *    neither forbid a draft nor create headings or evidence hosts.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateAutoMovieFinalScreenplayPopulation with injected identities and readers and projectAutoMovieMarkdownSyntax with live versus indented comments, checking population/order/title/heading preservation, draft annotation refusal and exact citation counterparts. This catches swapped parents or code examples enrolled as live hosts while allowing revised body wording.
 * @evidence contracts/testing.md#independent-expectations Literal ordered filenames and heading tuples independently define construction identity, and each citation must select its matching file or anchor. Reader-supplied tuples do not prove full screenplay parsing; the separate visibility assertion uses authored tab/four-space code examples beside one live heading, requiring blank projected code lines and the literal gate host without scoring prose.
 * @evidence contracts/testing.md#distinguishing-cases Keeps all population, nesting, title, stage and counterpart refusals; distinguishes tab-only, mixed space/tab and four-space code from an adjacent live heading and annotation. It does not claim complete CommonMark conformance.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit invokes actual source functions over resident documents and injected readers; it starts no filesystem, consumer, process or parser host.
 */
export function test_evidence_final_screenplay_population(): void {
  const document: IAutoMovieScreenplayDocumentIdentity = {
    title: "Arrival",
    source: "# Arrival\n\n## Gate {#gate}\n\nThe door is shut.\n",
    units: [
      { depth: 2, anchor: "gate", lineage: "gate", title: "Gate" },
      { depth: 3, anchor: "entry", lineage: "gate/entry", title: "Entry" },
      {
        depth: 4,
        anchor: "knock",
        lineage: "gate/entry/knock",
        title: "Knock",
      },
    ],
  };
  const files: string[] = ["001-part/001-arrival.md", "002-part/001-return.md"];
  const base: Parameters<typeof validateAutoMovieFinalScreenplayPopulation>[0] =
    {
      stage: "draft",
      residents: files,
      files,
      construction: new Map(files.map((file: string): [string, IAutoMovieScreenplayDocumentIdentity] => [file, document])),
      readFinal: (): IAutoMovieScreenplayDocumentIdentity => document,
      readGroupTitles: (): { construction: string; final: string } => ({ construction: "Part", final: "Part" }),
    };
  const refuse: (overrides: Partial<typeof base>, reason: string) => void = (overrides: Partial<typeof base>, reason: string): void => {
    let observed: unknown = undefined;
    try {
      validateAutoMovieFinalScreenplayPopulation({ ...base, ...overrides });
    } catch (error) {
      observed = error;
    }
    TestValidator.predicate(reason, observed instanceof Error && observed.message.includes(reason));
  };
  let reads: number = 0;
  validateAutoMovieFinalScreenplayPopulation({
    ...base,
    stage: "disabled",
    residents: [],
    files: [],
    construction: new Map(),
    readFinal: (): IAutoMovieScreenplayDocumentIdentity => {
      reads++;
      return document;
    },
  });
  TestValidator.equals("disabled needs no final reads", reads, 0);
  refuse({ stage: "disabled" }, "disabled but governed hosts remain");
  refuse({ files: [] }, "without a final screenplay host");
  for (const changed of [
    [files[0]!],
    [...files, "003-extra/001-unit.md"],
    ["001-part/002-renamed.md", files[1]!],
    [...files].reverse(),
  ])
    refuse({ files: changed }, "filenames must exactly preserve");
  refuse(
    { readFinal: (): IAutoMovieScreenplayDocumentIdentity => ({ ...document, title: "Departure" }) },
    "H1 title",
  );
  for (const units of [
    [],
    document.units.slice(0, 2),
    [...document.units].reverse(),
    ...[
      { depth: 3 as const },
      { anchor: "changed" },
      { lineage: "other/gate" },
      { title: "Other title" },
    ].map((change: Partial<IAutoMovieScreenplayDocumentIdentity["units"][number]>): IAutoMovieScreenplayDocumentIdentity["units"] => [
      { ...document.units[0]!, ...change },
      ...document.units.slice(1),
    ]),
  ])
    refuse(
      { readFinal: (): IAutoMovieScreenplayDocumentIdentity => ({ ...document, units }) },
      "headings, identity, nesting, and order",
    );
  const annotated: IAutoMovieScreenplayDocumentIdentity = {
    ...document,
    source:
      "<!--\n@evidence screenplays/001-part/001-arrival.md Exact construction file.\n-->\n" +
      document.source,
  };
  refuse({ readFinal: (): IAutoMovieScreenplayDocumentIdentity => annotated }, "before evidence tags are authored");
  refuse(
    {
      stage: "evidence",
      readFinal: (): IAutoMovieScreenplayDocumentIdentity => ({
        ...document,
        source:
          "<!-- @evidence screenplays/002-part/001-return.md Wrong construction file. -->\n" +
          document.source,
      }),
    },
    "exact construction counterpart",
  );
  for (const stage of ["evidence", "review"] as const)
    validateAutoMovieFinalScreenplayPopulation({
      ...base,
      stage,
      readFinal: (relative: string): IAutoMovieScreenplayDocumentIdentity => ({
        ...document,
        source:
          `<!-- @evidence screenplays/${relative} Exact construction file. -->\n` +
          document.source +
          `\n<!-- @evidenceReview screenplays/${relative}#gate #abcdef0 Read the gate.\n@evidence naturalness/core/common.md#naturalness-earned-element Naturalness answer. -->\n`,
      }),
    });
  for (const citation of [
    "@evidence screenplays/001-part/001-arrival.md#other Wrong unit.",
    "@evidenceReview screenplays/002-part/001-return.md#gate #abcdef0 Wrong file.",
    "@evidenceExclude screenplays/001-part/001-arrival.md File cited by a unit.",
    "@evidenceExcludeReview screenplays/001-part/001-arrival.md#other #abcdef0 Wrong excluded unit.",
  ])
    refuse(
      {
        stage: "evidence",
        readFinal: (): IAutoMovieScreenplayDocumentIdentity => ({
          ...document,
          source: document.source + `\n<!-- ${citation} -->\n`,
        }),
      },
      "exact construction counterpart",
    );
  refuse(
    { readGroupTitles: (): { construction: string; final: string } => ({ construction: "Part", final: "Other" }) },
    "delivery-group H1 title",
  );
  const groups: string[] = [];
  validateAutoMovieFinalScreenplayPopulation({
    ...base,
    readFinal: (): IAutoMovieScreenplayDocumentIdentity => ({
      ...document,
      source: document.source + '\n"Come in."\n',
    }),
    readGroupTitles: (group: string): { construction: string; final: string } => {
      groups.push(group);
      return { construction: "Part", final: "Part" };
    },
  });
  TestValidator.equals("each delivery group is checked", groups, [
    "001-part",
    "002-part",
  ]);
  for (const indentation of ["\t", " \t", "  \t", "   \t", "    "]) {
    const example: string = `${document.source}\n${indentation}<!-- @evidence screenplays/other.md Code example. -->\n`;
    validateAutoMovieFinalScreenplayPopulation({
      ...base,
      readFinal: (): IAutoMovieScreenplayDocumentIdentity => ({ ...document, source: example }),
    });
    const projection: ReturnType<typeof projectAutoMovieMarkdownSyntax> = projectAutoMovieMarkdownSyntax({
      path: "docs/final/screenplays/001-part/001-arrival.md",
      source: `# Arrival\n\n${indentation}## Hidden {#hidden}\n${indentation}<!-- @evidence screenplays/other.md Code example. -->\n\n## Gate {#gate}\n\n<!-- @evidence screenplays/001-part/001-arrival.md#gate Live counterpart. -->\n`,
    });
    TestValidator.equals("indented examples remain invisible without changing the adjacent live host", {
      headingLine: projection.visibleLines[2],
      exampleLine: projection.visibleLines[3],
      hosts: projection.annotations.map((annotation: ReturnType<typeof projectAutoMovieMarkdownSyntax>["annotations"][number]): string => annotation.host),
    }, {
      headingLine: "",
      exampleLine: "",
      hosts: ["docs/final/screenplays/001-part/001-arrival.md#gate"],
    });
  }
}
