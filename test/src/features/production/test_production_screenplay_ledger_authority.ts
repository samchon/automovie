import type {
  IAutoMovieDiagnostic,
  IAutoMovieScreenplayIndex,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts } from "../internal/predicates";

import { screenplayLedgerDiagnostics } from "../../../../packages/production/src/production/screenplayLedgerDiagnostics";

function index(): IAutoMovieScreenplayIndex { return ({
  version: 2,
  production: "ledger",
  treatment: {
    path: "treatment.md",
    sequences: [
      {
        id: "SEQ-1",
        title: "Sequence",
        beats: [{ id: "BEAT-1", text: "The signal arrives." }],
      },
    ],
  },
  screenplay: {
    path: "screenplay.md",
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
        storyTime: "unknown",
        participants: [{ id: "CHAR-1", mode: "on-screen" }],
        disposition: null,
      },
    ],
  },
  catalog: {
    characters: [
      {
        id: "CHAR-1",
        name: "Character",
        evidence: [
          { scene: "SCN-1", reason: "The scene names the character." },
        ],
        bindings: [],
      },
    ],
    factions: [],
    locations: [
      {
        id: "LOC-1",
        name: "Location",
        evidence: [{ scene: "SCN-1", reason: "The scene names the location." }],
        bindings: [],
      },
    ],
  },
  continuity: [],
}); }

function run(screenplay: IAutoMovieScreenplayIndex): IAutoMovieDiagnostic[] { return screenplayLedgerDiagnostics({
    acceptance: new Map<string, never>(),
    contracts: new Map<string, never>(),
    screenplay,
    designRecordPath: (): string => "design.json",
  }); }

/**
 * Pin index facts introduced by the screenplay authority carrier.
 *
 * Scenarios:
 * 1. An explicit story-time state, unique participant and exact beat pair pass.
 * 2. Blank story time and participant identity fail independently.
 * 3. Duplicate participant pairs and blank or mismatched beat identities fail.
 * 4. Rephrased coverage text preserves the same stable beat identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual index ledger gate and asserts story-time, participant and stable beat-address admission; catches missing or repeated semantic identities while permitting differently worded coverage of the same beat id.
 * @evidence contracts/testing.md#independent-expectations Scene-local participant identity/mode pairs must be unique and coverage ids must name a declared treatment beat; exact prose spelling is not the coverage identity.
 * @evidence contracts/testing.md#distinguishing-cases Covers valid exact joins, blank time/participant/beat values, repeated participant pairs, missing beat id and changed coverage wording. General catalog, lock and downstream proof-owner checks belong to other screenplay tests.
 * @evidence contracts/testing.md#execution-ownership This exported portable unit directly imports the ledger owner and supplies caller-owned index/maps with a declared path callback, starting no host/native artifact and dynamically registering no cases.
 */
export function test_production_screenplay_ledger_authority(): void {
  const blankTime: IAutoMovieScreenplayIndex = structuredClone(index());
  blankTime.screenplay.scenes[0]!.storyTime = " ";
  const blankParticipant: IAutoMovieScreenplayIndex = structuredClone(index());
  blankParticipant.screenplay.scenes[0]!.participants[0]!.id = "";
  const duplicateParticipant: IAutoMovieScreenplayIndex = structuredClone(index());
  duplicateParticipant.screenplay.scenes[0]!.participants.push({
    id: "CHAR-1",
    mode: "on-screen",
  });
  const blankBeat: IAutoMovieScreenplayIndex = structuredClone(index());
  blankBeat.screenplay.scenes[0]!.covers[0]!.id = "";
  const mismatchedBeat: IAutoMovieScreenplayIndex = structuredClone(index());
  mismatchedBeat.screenplay.scenes[0]!.covers[0]!.id = "BEAT-MISSING";
  const rephrased: IAutoMovieScreenplayIndex = structuredClone(index());
  rephrased.screenplay.scenes[0]!.covers[0]!.beat = "An independently worded signal arrival.";
  TestValidator.equals("coverage joins stable identity rather than exact prose", run(rephrased), []);
  function codes(value: IAutoMovieScreenplayIndex): string[] { return run(value).map((diagnostic: IAutoMovieDiagnostic): string => diagnostic.code); }

  TestValidator.equals(
    "screenplay index authority fields are exact",
    namedFacts([
      ["exactJoinPasses", (): boolean => run(index()).length === 0],
      [
        "blankStoryTimeIsNamed",
        (): boolean => codes(blankTime).includes("screenplay-scene-story-time-absent"),
      ],
      [
        "blankParticipantIsNamed",
        (): boolean =>
          codes(blankParticipant).includes(
            "screenplay-scene-participant-invalid",
          ),
      ],
      [
        "duplicateParticipantIsNamed",
        (): boolean =>
          codes(duplicateParticipant).includes(
            "screenplay-scene-participant-invalid",
          ),
      ],
      [
        "blankBeatIdentityIsNamed",
        (): boolean => codes(blankBeat).includes("screenplay-cover-unpromised"),
      ],
      [
        "mismatchedBeatIdentityIsNamed",
        (): boolean => codes(mismatchedBeat).includes("screenplay-cover-unpromised"),
      ],
    ]),
    {
      exactJoinPasses: true,
      blankStoryTimeIsNamed: true,
      blankParticipantIsNamed: true,
      duplicateParticipantIsNamed: true,
      blankBeatIdentityIsNamed: true,
      mismatchedBeatIdentityIsNamed: true,
    },
  );
}
