import {
  AUTOMOVIE_ANALYSIS_DOMAINS,
  AUTO_MOVIE_LIGHT_TYPES,
  performShot,
  stageScene,
  summarizeAutoMovieAnalysis,
} from "@automovie/engine";
import {
  IAutoMovieActionCall,
  AutoMovieAnalysisDomain,
  IAutoMovieAnalysisGap,
  IAutoMovieConstraintViolation,
  IAutoMovieLight,
  IAutoMovieStageLight,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makePerformanceWrite,
  makeScriptWrite,
  makeStagingWrite,
  validSynthesizer,
} from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { namedFacts } from "../internal/predicates";

/**
 * A diagnostic agrees with the value it interpolates, for every value.
 *
 * The messages name light types, analysis domains and action verbs from closed unions that this project extends. A message that spells its article
 * beside the interpolation instead of deriving it reads correctly until the day
 * a vowel-initial member is added, and then reads `a opening` forever, in the
 * gap and violation text an author consults to decide what is wrong. That is
 * where it was found: `a opening row states type, size and count but no place`,
 * in a benchmark sandbox's `building.log`, in two separate rounds.
 *
 * So the property under test is not the wording of any one message. It is that
 * a union can grow without producing broken prose, and the cases are built to
 * fail when it cannot:
 *
 * - The light and domain tables are keyed by the runtime union constants, so a
 *   new member leaves the table incomplete and the case says so.
 * - The verb table is `satisfies Record<IAutoMovieActionCall["verb"], string>`,
 *   so a new verb fails the compile instead — the verbs have no runtime
 *   constant to enumerate, and the type checker enumerates them.
 * - Each table states its article as a literal rather than calling the helper
 *   the product uses, so a case cannot agree with a broken helper.
 *
 * Scenarios:
 *
 * 1. Every light type, staged so it trips the parameter refusals that name the
 *    type. `area` is the vowel-initial member and the reason this case exists;
 *    the other three are the counter-case a blanket `an` would fail.
 * 2. Every analysis domain, required with nothing submitted, in both the gap's
 *    reason and its remedy. Three of the six begin with a vowel.
 * 3. Schedule subjects are not exercised by the assertions in this entry.
 * 4. The two vowel-initial action verbs against a camera actor, with a
 *    consonant-initial verb as the counter-case.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises stageScene light refusals, summarizeAutoMovieAnalysis missing-domain gaps and performShot camera-actor refusals, checking interpolated diagnostic articles on actual returned product messages. It formats no authored prose and grades no source comment or production text.
 * @evidence contracts/testing.md#independent-expectations Literal article tables independently state an area, an artificial-light/air/acoustic analysis and an emote/enact action, with consonant-led counter-cases. Runtime light/domain coverage and the verb table's type contract expose newly added labels; substring checks permit unrelated wording and do not prove complete refusal content or general English pronunciation.
 * @evidence contracts/testing.md#distinguishing-cases Every current light kind and analysis domain is probed, while action refusal samples emote, enact and gesture only. The fixtures require refusals to exist before checking messages; schedule subjects, other verbs, arbitrary names and valid camera framing are outside this entry.
 * @evidence contracts/testing.md#execution-ownership The named test_text_diagnostic_article entry owns the light/domain rows expanded through namedFacts and the three direct action cases, using portable engine gates and in-memory film fixtures without a consumer install, host or renderer.
 */
export function test_text_diagnostic_article(): void {
  TestValidator.equals(
    "every light type is named with its own article",
    namedFacts([
      [
        "the table covers the union",
        (): boolean =>
          [...AUTO_MOVIE_LIGHT_TYPES].every(
            (type: IAutoMovieLight["type"]): boolean => LIGHT_ARTICLE[type] !== undefined,
          ) &&
          Object.keys(LIGHT_ARTICLE).length === AUTO_MOVIE_LIGHT_TYPES.size,
      ],
      ...[...AUTO_MOVIE_LIGHT_TYPES].map((type: IAutoMovieLight["type"]): [string, () => boolean] => [
        lightFact(type),
        (): boolean => {
          const messages: string[] = lightMessages(type);
          return (
            messages.length > 0 &&
            messages.every((message: string): boolean =>
              message.includes(`${LIGHT_ARTICLE[type]} light`),
            )
          );
        },
      ]),
    ]),
    {
      "the table covers the union": true,
      ...Object.fromEntries(
        [...AUTO_MOVIE_LIGHT_TYPES].map((type: IAutoMovieLight["type"]): [string, boolean] => [lightFact(type), true]),
      ),
    },
  );

  TestValidator.equals(
    "every analysis domain is asked for with its own article",
    namedFacts([
      [
        "the table covers the union",
        (): boolean =>
          AUTOMOVIE_ANALYSIS_DOMAINS.every(
            (domain: AutoMovieAnalysisDomain): boolean => DOMAIN_ARTICLE[domain] !== undefined,
          ) &&
          Object.keys(DOMAIN_ARTICLE).length ===
            AUTOMOVIE_ANALYSIS_DOMAINS.length,
      ],
      ...AUTOMOVIE_ANALYSIS_DOMAINS.map((domain: AutoMovieAnalysisDomain): [string, () => boolean] => [
        domainFact(domain),
        (): boolean => {
          const gap: IAutoMovieAnalysisGap | undefined = summarizeAutoMovieAnalysis({
            runs: [],
            revision: "revision-1",
            required: [domain],
          }).gaps.find((entry: IAutoMovieAnalysisGap): boolean => entry.domain === domain);
          return (
            gap !== undefined &&
            gap.reason.includes(
              `the production requires ${DOMAIN_ARTICLE[domain]} answer`,
            ) &&
            gap.remedy.includes(`run ${DOMAIN_ARTICLE[domain]} analysis`)
          );
        },
      ]),
    ]),
    {
      "the table covers the union": true,
      ...Object.fromEntries(
        AUTOMOVIE_ANALYSIS_DOMAINS.map((domain: AutoMovieAnalysisDomain): [string, boolean] => [domainFact(domain), true]),
      ),
    },
  );

  TestValidator.equals(
    "an action aimed through a camera is named with its verb's article",
    namedFacts([
      [
        "an emote action",
        (): boolean =>
          cameraActorRefusal({
            verb: "emote",
            actor: CAMERA,
            start: 0,
            duration: 1,
            preset: "happy",
            intensity: 0.5,
          })?.startsWith(`${VERB_ARTICLE.emote} action's actor`) === true,
      ],
      [
        "an enact action",
        (): boolean =>
          cameraActorRefusal({
            verb: "enact",
            actor: CAMERA,
            start: 0,
            duration: 1,
            clip: "bow",
          })?.startsWith(`${VERB_ARTICLE.enact} action's actor`) === true,
      ],
      [
        "a gesture action",
        (): boolean =>
          cameraActorRefusal({
            verb: "gesture",
            actor: CAMERA,
            start: 0,
            duration: 1,
            kind: "strike",
            at: { kind: "node", node: "knightB" },
          })?.startsWith(`${VERB_ARTICLE.gesture} action's actor`) === true,
      ],
    ]),
    {
      "an emote action": true,
      "an enact action": true,
      "a gesture action": true,
    },
  );
}

/** The staged camera every verb case aims through. */
const CAMERA: string = "cam-main";

/** The fact name a light type is reported under, spelled once. */
const lightFact: (type: string) => string = (type: string): string =>
  `${type} is refused as "${LIGHT_ARTICLE[type]} light"`;

/** The fact name an analysis domain is reported under. */
const domainFact: (domain: string) => string = (domain: string): string =>
  `${domain} reads as "${DOMAIN_ARTICLE[domain]}"`;

/**
 * The refusals a light of `type` draws that name the type.
 *
 * One light carrying a `range` and a `coneAngle` and neither a direction nor a
 * position trips whichever of the four parameter rules apply to its own type,
 * so the same probe covers all of them without a per-type fixture.
 */
const lightMessages: (type: string) => string[] = (type: string): string[] => {
  const staged: ReturnType<typeof stageScene> = stageScene(makeScriptWrite(), {
    ...makeStagingWrite(),
    lights: [
      {
        node: "probe",
        type,
        intensity: 1,
        range: 8,
        coneAngle: 30,
      } as unknown as IAutoMovieStageLight,
    ],
  });
  if (staged.success === true) return [];
  return staged.violations
    .map((violation: IAutoMovieConstraintViolation): string => violation.expected)
    .filter((message: string): boolean => message.includes(` ${type} light`));
};

/** The refusal an action draws for naming a camera as its actor. */
const cameraActorRefusal: (action: IAutoMovieActionCall) => string | null = (action: IAutoMovieActionCall): string | null => {
  const staged: ReturnType<typeof stageScene> = stageScene(makeScriptWrite(), makeStagingWrite());
  if (staged.success !== true)
    throw new Error("the staging fixture must succeed");
  const performed: ReturnType<typeof performShot> = performShot({
    script: makeScriptWrite(),
    staged,
    performance: makePerformanceWrite({ draft: [action] }),
    synthesize: validSynthesizer,
    skeleton: (): ReturnType<typeof createSkeleton> => createSkeleton(),
  });
  if (performed.success === true) return null;
  return (
    performed.violations.find((violation: IAutoMovieConstraintViolation): boolean =>
      violation.expected.includes("is a camera"),
    )?.expected ?? null
  );
};

/**
 * The article each light type is named with, keyed by the runtime union.
 *
 * Spelled out rather than derived, so a helper that started answering `a area`
 * would fail here instead of agreeing with itself.
 */
const LIGHT_ARTICLE: Record<string, string> = {
  area: "an area",
  directional: "a directional",
  point: "a point",
  spot: "a spot",
};

/** The article each analysis domain is named with. */
const DOMAIN_ARTICLE: Record<string, string> = {
  daylight: "a daylight",
  "artificial-light": "an artificial-light",
  thermal: "a thermal",
  moisture: "a moisture",
  air: "an air",
  acoustic: "an acoustic",
};

/**
 * The article each action verb is named with.
 *
 * `satisfies` rather than a runtime enumeration: the verbs are a discriminated
 * union with no constant to iterate, so the builder is what refuses a new verb
 * nobody has stated an article for. The three cases above read from it, so it
 * is a checked constant rather than dead weight.
 */
const VERB_ARTICLE: Record<IAutoMovieActionCall["verb"], string> = {
  attachTo: "an attachTo",
  emote: "an emote",
  enact: "an enact",
  frame: "a frame",
  gesture: "a gesture",
  hold: "a hold",
  launch: "a launch",
  locomote: "a locomote",
  lookAt: "a lookAt",
  reach: "a reach",
  react: "a react",
} satisfies Record<IAutoMovieActionCall["verb"], string>;
