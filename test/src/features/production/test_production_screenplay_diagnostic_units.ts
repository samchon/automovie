import type {
  IAutoMovieDiagnostic,
  IAutoMovieScreenplayIndex,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

import { parseScreenplayProse } from "../../../../packages/production/src/production/parseScreenplayProse";
import { screenplayProseDiagnostics } from "../../../../packages/production/src/production/screenplayProseDiagnostics";

/** The prose-owned subset is sufficient for these diagnostics. */
function screenplay(props?: {
  scenes?: Array<
    Omit<
      IAutoMovieScreenplayIndex["screenplay"]["scenes"][number],
      "storyTime" | "participants"
    > &
      Partial<
        Pick<
          IAutoMovieScreenplayIndex["screenplay"]["scenes"][number],
          "storyTime" | "participants"
        >
      >
  >;
  sequences?: IAutoMovieScreenplayIndex["treatment"]["sequences"];
}): IAutoMovieScreenplayIndex { return ({
    version: 2,
    production: "diagnostic-units",
    treatment: {
      path: "docs/combined.md",
      sequences: props?.sequences ?? [],
    },
    screenplay: {
      path: "docs/combined.md",
      lock: null,
      scenes: (props?.scenes ?? []).map((scene: NonNullable<NonNullable<Parameters<typeof screenplay>[0]>["scenes"]>[number]): IAutoMovieScreenplayIndex["screenplay"]["scenes"][number] => ({
        storyTime: "unknown",
        participants: [],
        ...scene,
      })),
    },
    catalog: { characters: [], factions: [], locations: [] },
    continuity: [],
  }) as IAutoMovieScreenplayIndex; }

/**
 * Exercise the Markdown/prose boundary as a unit, including every refusal.
 *
 * Compiler fixtures prove integration separately. This unit owns the lexical
 * edge cases that should not require a complete production for each branch:
 * both fence markers, short and decorated non-closers, inline and multiline
 * comments, split documents, cached absent documents, and every prose/index
 * disagreement.
 *
 * Scenarios:
 * 1. Both fence kinds and comments exclude examples while visible sections and heading anchors remain authored.
 * 2. Missing, repeated, absent, retitled and empty active sections emit their own findings.
 * 3. Mixed whole/split documents share reads and explicit owned sections retain their semantic carrier.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual Markdown parser and semantic scene join and asserts admitted boundaries, diagnostic identities and read cardinality; catches metadata becoming a scene or split ownership reading the wrong section.
 * @evidence contracts/testing.md#independent-expectations Explicit SCN headings, complete carriers and declared layout determine expected identities; fence/comment examples are excluded by Markdown structure without asserting exact treatment wording or inferred numeric prose.
 * @evidence contracts/testing.md#distinguishing-cases Covers absent headings, both fence markers and decorated/short/nonclosing markers, comments across lines, anchors, indented visible text, whole/split layouts, missing/repeated sections, title mismatch, empty active body and omitted tombstones. Carrier malformed-field cases belong to prose_authority.
 * @evidence contracts/testing.md#execution-ownership The exported portable unit directly imports production parser/join sources and passes an in-memory declared read capability, starting no host or native artifact and registering no dynamic cases.
 */
export function test_production_screenplay_diagnostic_units(): void {
  const parsed: ReturnType<typeof parseScreenplayProse> = parseScreenplayProse(
    [
      "preamble",
      "<!-- metadata -->",
      "### SCN-A - Alpha {#alpha}",
      "Visible <!-- hidden --> tail.",
      "<!-- hidden",
      "still hidden",
      "-->Visible again.",
      "```md",
      "### SCN-FENCED - Not prose",
      "```",
      "   ~~~md",
      "### SCN-TILDE - Not prose",
      "   ~~",
      "   ~~~ trailing",
      "   ```",
      "   ~~~~",
      "    ``` is indented prose",
      "## SCN-B : Beta",
      "Body B.",
      "~~~",
      "an unterminated final fence",
    ].join("\r\n"),
  );
  const empty: ReturnType<typeof parseScreenplayProse> = parseScreenplayProse("No scene heading here.");

  const index: IAutoMovieScreenplayIndex = screenplay({
    sequences: [
      {
        id: "SEQ-DEFAULT",
        title: "Default",
        beats: [
          { id: "BEAT-WRITTEN", text: "Written beat." },
          { id: "BEAT-BLANK", text: " " },
          { id: "BEAT-MISSING", text: "Missing beat." },
        ],
      },
      {
        id: "SEQ-EMPTY-PATH",
        title: "Fallback",
        path: " ",
        beats: [],
      },
      {
        id: "SEQ-MISSING",
        title: "Missing",
        path: "docs/missing.md",
        beats: [],
      },
    ],
    scenes: [
      {
        id: "SCN-GOOD",
        title: "Good",
        status: "active",
        covers: [],
        location: null,
        disposition: null,
      },
      {
        id: "SCN-DUP",
        title: "Duplicate",
        status: "active",
        covers: [],
        location: null,
        disposition: null,
      },
      {
        id: "SCN-ABSENT",
        title: "Absent",
        status: "active",
        path: " ",
        covers: [],
        location: null,
        disposition: null,
      },
      {
        id: "SCN-RETITLED",
        title: "Expected title",
        status: "active",
        covers: [],
        location: null,
        disposition: null,
      },
      {
        id: "SCN-EMPTY",
        title: "Empty",
        status: "active",
        covers: [],
        location: null,
        disposition: null,
      },
      {
        id: "SCN-TOMBSTONE",
        title: "Tombstone",
        status: "OMITTED",
        covers: [],
        location: null,
        disposition: null,
      },
      {
        id: "SCN-OWNED",
        title: "Owned",
        status: "active",
        path: "docs/owned.md",
        covers: [],
        location: "unknown",
        disposition: null,
      },
      {
        id: "SCN-MISSING-DOC",
        title: "Missing doc",
        status: "active",
        path: "docs/missing.md",
        covers: [],
        location: null,
        disposition: null,
      },
    ],
  });
  const documents: Map<string, string> = new Map<string, string>([
    [
      "docs/combined.md",
      [
        "Written beat.",
        "<!-- Missing beat. -->",
        "# SCN-GOOD — Good",
        "Good body.",
        "# SCN-DUP - Duplicate",
        "First body.",
        "# SCN-DUP : Duplicate",
        "Second body.",
        "# SCN-EXTRA - Extra",
        "Unindexed body.",
        "# SCN-RETITLED - Different title",
        "Retitled body.",
        "# SCN-EMPTY - Empty",
        "# SCN-TOMBSTONE - Tombstone",
        "# SCN-OWNED - Owned",
        "This copy is ignored because the scene owns another document.",
      ].join("\n"),
    ],
    [
      "docs/owned.md",
      [
        "# SCN-NOT-OWNED - Ignored",
        "Ignored body.",
        "# SCN-OWNED - Owned",
        "@automovie-scene",
        "location: unknown",
        "story-time: unknown",
        "@end-automovie-scene",
        "Owned body.",
      ].join("\n"),
    ],
  ]);
  const reads: Map<string, number> = new Map<string, number>();
  const diagnostics: IAutoMovieDiagnostic[] = screenplayProseDiagnostics({
    screenplay: index,
    read: (relative: string): string | null => {
      reads.set(relative, (reads.get(relative) ?? 0) + 1);
      return documents.get(relative) ?? null;
    },
  });
  const codes: string[] = diagnostics.map((diagnostic: IAutoMovieDiagnostic): string => diagnostic.code);

  TestValidator.equals(
    "screenplay prose diagnostics own their complete lexical and refusal surface",
    namedFacts([
      [
        "nullIndexIsEmpty",
        (): boolean =>
          screenplayProseDiagnostics({ screenplay: null, read: (): string => "unused" })
            .length === 0,
      ],
      ["noHeadingIsEmpty", (): boolean => empty.length === 0],
      ["anchorsAreMetadata", (): boolean => parsed[0]?.title === "Alpha"],
      [
        "commentsAreRemoved",
        (): boolean => parsed[0]?.body.includes("hidden") === false,
      ],
      [
        "visibleCommentTailsRemain",
        (): boolean => parsed[0]?.body.includes("Visible again.") === true,
      ],
      [
        "bothFenceKindsAreIgnored",
        (): boolean =>
          parsed.every(
            (scene: ReturnType<typeof parseScreenplayProse>[number]): boolean => scene.id !== "SCN-FENCED" && scene.id !== "SCN-TILDE",
          ),
      ],
      [
        "indentedFenceTextRemainsProse",
        (): boolean => parsed[0]?.body.includes("indented prose") === true,
      ],
      [
        "laterScenesRemainAddressable",
        (): boolean =>
          parsed[1]?.id === "SCN-B" &&
          parsed[1]?.body.includes("Body B.") === true,
      ],
      ["missingDocumentsAreCached", (): boolean => reads.get("docs/missing.md") === 1],
      ["documentsAreCached", (): boolean => reads.get("docs/combined.md") === 1],
      [
        "missingDocumentIsNamed",
        (): boolean => codes.includes("screenplay-document-absent"),
      ],
      [
        "duplicateHeadingIsNamed",
        (): boolean => codes.includes("screenplay-heading-repeated"),
      ],
      [
        "unindexedHeadingIsNamed",
        (): boolean => codes.includes("screenplay-heading-unindexed"),
      ],
      [
        "absentHeadingIsNamed",
        (): boolean => codes.includes("screenplay-heading-absent"),
      ],
      [
        "retitledHeadingIsNamed",
        (): boolean => codes.includes("screenplay-heading-retitled"),
      ],
      [
        "emptyActiveSceneIsNamed",
        (): boolean => codes.includes("screenplay-scene-unwritten"),
      ],
      [
        "omittedEmptySceneIsAllowed",
        (): boolean =>
          diagnostics.some(
            (diagnostic: IAutoMovieDiagnostic): boolean =>
              diagnostic.message.includes('"SCN-TOMBSTONE"') &&
              diagnostic.code === "screenplay-scene-unwritten",
          ) === false,
      ],
      [
        "ownedSceneUsesItsOwnDocument",
        (): boolean =>
          diagnostics.some((diagnostic: IAutoMovieDiagnostic): boolean =>
            diagnostic.message.includes('"SCN-OWNED"'),
          ) === false,
      ],
    ]),
    {
      nullIndexIsEmpty: true,
      noHeadingIsEmpty: true,
      anchorsAreMetadata: true,
      commentsAreRemoved: true,
      visibleCommentTailsRemain: true,
      bothFenceKindsAreIgnored: true,
      indentedFenceTextRemainsProse: true,
      laterScenesRemainAddressable: true,
      missingDocumentsAreCached: true,
      documentsAreCached: true,
      missingDocumentIsNamed: true,
      duplicateHeadingIsNamed: true,
      unindexedHeadingIsNamed: true,
      absentHeadingIsNamed: true,
      retitledHeadingIsNamed: true,
      emptyActiveSceneIsNamed: true,
      omittedEmptySceneIsAllowed: true,
      ownedSceneUsesItsOwnDocument: true,
    },
  );

}
