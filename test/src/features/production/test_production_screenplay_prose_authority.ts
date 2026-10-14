import type {
  IAutoMovieDiagnostic,
  IAutoMovieScreenplayIndex,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

import { parseScreenplayProse } from "../../../../packages/production/src/production/parseScreenplayProse";
import { screenplayProseDiagnostics } from "../../../../packages/production/src/production/screenplayProseDiagnostics";

function base(): IAutoMovieScreenplayIndex { return ({
    version: 2,
    production: "authority",
    treatment: {
      path: "docs/treatment.md",
      sequences: [
        {
          id: "SEQ-1",
          title: "Sequence",
          beats: [{ id: "BEAT-1", text: "The signal arrives." }],
        },
      ],
    },
    screenplay: {
      path: "docs/screenplay.md",
      lock: null,
      scenes: [
        {
          id: "SCN-1",
          title: "Signal",
          status: "active",
          covers: [
            {
              id: "BEAT-1",
              beat: "The signal arrives.",
              reason: "This scene delivers the signal.",
            },
          ],
          location: "LOC-1",
          storyTime: "NIGHT",
          participants: [
            { id: "CHAR-1", mode: "on-screen" },
            { id: "VOICE-1", mode: "off-screen" },
            { id: "CROWD-1", mode: "crowd" },
            { id: "PROP-1", mode: "object" },
            { id: "RAIN-1", mode: "environmental" },
            { id: "CHAR-2", mode: "referenced" },
          ],
          disposition: null,
        },
      ],
    },
    catalog: { characters: [], factions: [], locations: [] },
    continuity: [],
  }) as IAutoMovieScreenplayIndex; }

function carrier(props?: {
  location?: string;
  storyTime?: string;
  participants?: string[];
  beats?: string[];
}): string { return [
    "# SCN-1 - Signal",
    "@automovie-scene",
    `location: ${props?.location ?? "LOC-1"}`,
    `story-time: ${props?.storyTime ?? "NIGHT"}`,
    ...(
      props?.participants ?? [
        "CHAR-1 on-screen",
        "VOICE-1 off-screen",
        "CROWD-1 crowd",
        "PROP-1 object",
        "RAIN-1 environmental",
        "CHAR-2 referenced",
      ]
    ).map((participant: string): string => `participant: ${participant}`),
    ...(props?.beats ?? ["BEAT-1"]).map((beat: string): string => `beat: ${beat}`),
    "@end-automovie-scene",
    "The signal arrives.",
  ].join("\n"); }

function run(index: IAutoMovieScreenplayIndex, screenplay: string): IAutoMovieDiagnostic[] { return screenplayProseDiagnostics({
    screenplay: index,
    read: (relativePath: string): string | null =>
      relativePath === "docs/treatment.md"
        ? "The signal arrives."
        : relativePath === "docs/screenplay.md" ||
            relativePath === "docs/scene.md"
          ? screenplay
          : null,
  }); }

/**
 * Prove exact scene authority across whole and split screenplay layouts.
 *
 * Scenarios:
 * 1. Exact location, unknown/time, every participant mode and beat identity pass.
 * 2. Place, time, participant and beat mismatches each emit their stable code.
 * 3. Comments, fences, malformed carriers and OMITTED carriers cannot become authority.
 * 4. A split scene path yields the same normalized comparison as a whole screenplay.
 * 5. The carrier parser names every malformed line: a missing end marker, a
 *    line without a field separator, a repeated location or story-time, a
 *    participant without a mode, a blank beat, an unsupported field, a blank
 *    location or story-time, and a repeated participant or beat.
 *
 * @evidence contracts/testing.md#behavioral-verification Parses complete scene carriers and joins them to the actual semantic index, checking exact place/time/participant/beat comparisons and each malformed-field refusal; catches accidental authority from metadata or another scene.
 * @evidence contracts/testing.md#independent-expectations The explicit carrier grammar and stable identity/mode fields determine expected findings; tests assert literal parser stages and field rules without deriving expectations from another parser run or natural-language timing.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts exact, explicit unknown and split layouts with place/time/participant/beat mismatches, comments/fences, omitted state, absent end/separator, repeated fields, blank values and unsupported fields; Markdown section edge cases belong to diagnostic_units.
 * @evidence contracts/testing.md#execution-ownership The exported portable unit directly imports production sources and supplies caller-owned text and index records; it starts no process/browser/native build and registers no dynamic cases.
 */
export function test_production_screenplay_prose_authority(): void {
  const exact: IAutoMovieScreenplayIndex = base();
  const exactDiagnostics: IAutoMovieDiagnostic[] = run(exact, carrier());
  const unknown: IAutoMovieScreenplayIndex = base();
  unknown.screenplay.scenes[0]!.storyTime = "unknown";
  const split: IAutoMovieScreenplayIndex = base();
  split.screenplay.scenes[0]!.path = "docs/scene.md";
  const omitted: IAutoMovieScreenplayIndex = base();
  omitted.screenplay.scenes[0]!.status = "OMITTED";
  omitted.screenplay.scenes[0]!.title = "Signal";
  const hidden: string = [
    "# SCN-1 - Signal",
    "<!-- @automovie-scene",
    "location: LOC-1",
    "story-time: NIGHT",
    "@end-automovie-scene -->",
    "```md",
    carrier(),
    "```",
    "The signal arrives.",
  ].join("\n");
  function codes(index: IAutoMovieScreenplayIndex, prose: string): string[] { return run(index, prose).map((diagnostic: IAutoMovieDiagnostic): string => diagnostic.code); }

  TestValidator.equals(
    "screenplay prose authority has one exact scene-local owner",
    namedFacts([
      ["exactCarrierPasses", (): boolean => exactDiagnostics.length === 0],
      [
        "explicitUnknownPasses",
        (): boolean => run(unknown, carrier({ storyTime: "unknown" })).length === 0,
      ],
      ["splitLayoutPasses", (): boolean => run(split, carrier()).length === 0],
      [
        "locationConflictIsNamed",
        (): boolean =>
          codes(base(), carrier({ location: "loc-1" })).includes(
            "screenplay-scene-location-conflict",
          ),
      ],
      [
        "storyTimeConflictIsNamed",
        (): boolean =>
          codes(base(), carrier({ storyTime: "DAY" })).includes(
            "screenplay-scene-story-time-conflict",
          ),
      ],
      [
        "participantConflictIsNamed",
        (): boolean =>
          codes(
            base(),
            carrier({ participants: ["CHAR-1 referenced"] }),
          ).includes("screenplay-scene-participant-conflict"),
      ],
      [
        "beatConflictIsNamed",
        (): boolean =>
          codes(base(), carrier({ beats: ["BEAT-OTHER"] })).includes(
            "screenplay-scene-beat-conflict",
          ),
      ],
      [
        "hiddenCarrierIsAbsent",
        (): boolean =>
          codes(base(), hidden).includes("screenplay-scene-authority-absent"),
      ],
      [
        "malformedCarrierIsInvalid",
        (): boolean =>
          codes(
            base(),
            carrier({ participants: ["CHAR-1 performer"] }),
          ).includes("screenplay-scene-authority-invalid"),
      ],
      [
        "omittedCarrierIsUnexpected",
        (): boolean =>
          codes(omitted, carrier()).includes(
            "screenplay-scene-authority-unexpected",
          ),
      ],
    ]),
    {
      exactCarrierPasses: true,
      explicitUnknownPasses: true,
      splitLayoutPasses: true,
      locationConflictIsNamed: true,
      storyTimeConflictIsNamed: true,
      participantConflictIsNamed: true,
      beatConflictIsNamed: true,
      hiddenCarrierIsAbsent: true,
      malformedCarrierIsInvalid: true,
      omittedCarrierIsUnexpected: true,
    },
  );

  function parsed(lines: readonly string[]): { authority: boolean; errors: string[] } {
    const scene: ReturnType<typeof parseScreenplayProse>[number] = parseScreenplayProse(
      ["# SCN-1 - Signal", "@automovie-scene", ...lines].join("\n"),
    )[0]!;
    return {
      authority: scene.authority !== null,
      errors: scene.authorityErrors,
    };
  }
  const valid: string[] = ["location: LOC-1", "story-time: NIGHT"];
  TestValidator.equals(
    "the carrier parser names every malformed authority line",
    {
      unterminated: parsed(valid),
      noSeparator: parsed([...valid, "mood tense", "@end-automovie-scene"]),
      repeatedLocation: parsed([
        ...valid,
        "location: LOC-2",
        "@end-automovie-scene",
      ]),
      repeatedStoryTime: parsed([
        ...valid,
        "story-time: DAY",
        "@end-automovie-scene",
      ]),
      participantWithoutMode: parsed([
        ...valid,
        "participant: CHAR-1",
        "@end-automovie-scene",
      ]),
      blankBeat: parsed([...valid, "beat:", "@end-automovie-scene"]),
      unsupportedField: parsed([
        ...valid,
        "mood: tense",
        "@end-automovie-scene",
      ]),
      blankLocation: parsed([
        "location:",
        "story-time:",
        "@end-automovie-scene",
      ]),
      missingStoryTime: parsed(["location: LOC-1", "@end-automovie-scene"]),
      repeatedParticipant: parsed([
        ...valid,
        "participant: CHAR-1 on-screen",
        "participant: CHAR-1 on-screen",
        "@end-automovie-scene",
      ]),
      repeatedBeat: parsed([
        ...valid,
        "beat: BEAT-1",
        "beat: BEAT-1",
        "@end-automovie-scene",
      ]),
      exact: parsed([
        ...valid,
        "",
        "participant: CHAR-1 on-screen",
        "beat: BEAT-1",
        "@end-automovie-scene",
      ]),
    },
    {
      unterminated: {
        authority: false,
        errors: ["@automovie-scene has no @end-automovie-scene"],
      },
      noSeparator: {
        authority: true,
        errors: ['authority line "mood tense" has no field separator'],
      },
      repeatedLocation: {
        authority: true,
        errors: ["location is declared twice"],
      },
      repeatedStoryTime: {
        authority: true,
        errors: ["story-time is declared twice"],
      },
      participantWithoutMode: {
        authority: true,
        errors: ['participant "CHAR-1" has no valid identity and mode'],
      },
      blankBeat: { authority: true, errors: ["beat identity is blank"] },
      unsupportedField: {
        authority: true,
        errors: ['authority field "mood" is not supported'],
      },
      blankLocation: {
        authority: true,
        errors: [
          "location is absent or blank",
          "story-time is absent or blank",
        ],
      },
      missingStoryTime: {
        authority: false,
        errors: ["story-time is absent or blank"],
      },
      repeatedParticipant: {
        authority: true,
        errors: ["a participant identity and mode pair is repeated"],
      },
      repeatedBeat: {
        authority: true,
        errors: ["a beat identity is repeated"],
      },
      exact: { authority: true, errors: [] },
    },
  );
}
