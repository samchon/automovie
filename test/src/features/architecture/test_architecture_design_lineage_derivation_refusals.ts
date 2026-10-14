import { validateDesignLineage } from "@automovie/engine";
import type { IAutoMovieDesignLineage } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  RENOVATION_TEXTURE_DIGEST,
  brokenLineage,
  lineageDigest,
  refusesLineage as refuses,
} from "../internal/lineageFixtures";
import { namedFacts } from "../internal/predicates";

/** True when one edit away from the coherent fixture still validates. */
const accepts: (edit: Parameters<typeof brokenLineage>[0]) => boolean = (
  edit: Parameters<typeof brokenLineage>[0],
): boolean => validateDesignLineage({ lineage: brokenLineage(edit) }).success;

/**
 * Validate alternative, decision, artifact-stamp and imported-asset citation integrity against a coherent lineage.
 *
 * Scenarios:
 * 1. Alternative identity: blank and duplicated variant ids, a blank label, and a base revision nobody recorded.
 * 2. Change identity: blank and duplicated change ids, an unknown subject, a blank aspect, a blank rationale, and two edits of one subject's one aspect.
 * 3. Decision integrity: blank id and question, fewer than two options, an unknown option, a repeated option, options straddling two base revisions, and a selection that is not one of the options.
 * 4. Artifact identity: blank and duplicated artifact ids, and an artifact id squatting on a declared subject identity.
 * 5. Artifact inputs: no inputs at all, an unknown input, a repeated input, and a derivation cycle.
 * 6. Artifact stamps: malformed output and configuration digests, a superseded revision, an unknown variant, a variant belonging to another revision, an unknown phase, and a stamp disagreeing with an input's stamp.
 * 7. Asset citations: missing or mismatching declared digests, a changed subject digest leaving each of its two quotes stale, a quote for a non-input identity or a digest-null source input, and one identity quoted twice.
 * 8. Asset citations are accepted when they track the inputs: an output drops both the input and its citation, or the declared subject digest changes together with both quotes. No asset file is read or replaced.
 * 9. Comparison fairness is refused for a differing configuration and for a differing phase, and accepted once the pair agrees on either.
 * 10. An alternative that changes nothing is accepted: an empty change set is a scheme that keeps the base, not a malformed record.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateDesignLineage through refusesLineage and accepts, requiring the authored kind/path for each variant, decision, artifact, dependency, stamp, citation or comparison mutation. Accepted paired edits and the empty legacy change list contrast with specific refusals, exposing stale metadata allowed through or coherent updates rejected wholesale.
 * @evidence contracts/testing.md#independent-expectations The coherent renovation fixture and literal mutation paths determine expected admission; selected mutations intentionally edit several fields, such as dropping both imported input/citation or replacing the subject digest together with both quotes. Matching configuration/phase pairs are positive controls, and repeated hexadecimal fixture strings are authored metadata rather than independently hashed files or rebuilt artifacts. Path membership permits additional findings and does not assert diagnostic order or message text.
 * @evidence contracts/testing.md#distinguishing-cases Blank/duplicate/dangling identities, duplicate aspects/options/inputs, cycles, stale stamps, asset quote coverage, comparison mismatch and empty alternatives retain all existing cases; declared digests are test data rather than observed imported bytes.
 * @evidence contracts/testing.md#execution-ownership Portable CPU unit test_architecture_design_lineage_derivation_refusals imports the actual engine/archetype operations and owns its locally enumerated cases; no dynamic registration, consumer installation, native artifact build, process, browser or GPU host is required.
 */
export function test_architecture_design_lineage_derivation_refusals(): void {
  TestValidator.equals(
    "alternative and decision refusals",
    namedFacts([
      [
        "a blank variant id is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.variants[0]!.id = "";
          }, "$input.variants[0].id"),
      ],
      [
        "a duplicated variant id is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.variants[1]!.id = "warm-oak";
          }, "$input.variants[1].id"),
      ],
      [
        "a variant with no label is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.variants[0]!.label = " ";
          }, "$input.variants[0].label"),
      ],
      [
        "an alternative applying to a revision nobody recorded is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.variants[0]!.base = "r7";
          }, "$input.variants[0].base"),
      ],
      [
        "a blank change id is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.variants[0]!.changes[0]!.id = "";
          }, "$input.variants[0].changes[0].id"),
      ],
      [
        "a change id reused by another alternative is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.variants[1]!.changes[0]!.id = "warm-floor";
          }, "$input.variants[1].changes[0].id"),
      ],
      [
        "a change about an unknown subject is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.variants[0]!.changes[0]!.subject = "wall-east";
          }, "$input.variants[0].changes[0].subject"),
      ],
      [
        "a change with no aspect is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.variants[0]!.changes[0]!.aspect = "";
          }, "$input.variants[0].changes[0].aspect"),
      ],
      [
        "a change with no rationale is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.variants[0]!.changes[0]!.rationale = "  ";
          }, "$input.variants[0].changes[0].rationale"),
      ],
      [
        "one alternative editing one aspect of one subject twice is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.variants[0]!.changes[1]!.subject = "floor-oak";
            draft.variants[0]!.changes[1]!.aspect = "material";
          }, "$input.variants[0].changes[1].aspect"),
      ],
      [
        "a blank decision id is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.decisions[0]!.id = "";
          }, "$input.decisions[0].id"),
      ],
      [
        "a decision with no question is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.decisions[0]!.question = "";
          }, "$input.decisions[0].question"),
      ],
      [
        "a decision holding fewer than two alternatives is refused",
        (): boolean =>
          refuses(
            (draft: IAutoMovieDesignLineage): void => {
              draft.decisions[0]!.options = ["warm-oak"];
            },
            "$input.decisions[0].options",
            "range",
          ),
      ],
      [
        "a decision naming an unknown alternative is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.decisions[0]!.options = ["warm-oak", "brutalist"];
          }, "$input.decisions[0].options[1]"),
      ],
      [
        "a decision naming one alternative twice is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.decisions[0]!.options = ["warm-oak", "warm-oak"];
          }, "$input.decisions[0].options[1]"),
      ],
      [
        "a decision straddling two base revisions is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.decisions[0]!.options = ["warm-oak", "legacy-scheme"];
          }, "$input.decisions[0].options"),
      ],
      [
        "a selection that is not one of the compared alternatives is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.decisions[0]!.selected = "legacy-scheme";
          }, "$input.decisions[0].selected"),
      ],
      [
        "an alternative that changes nothing is accepted",
        (): boolean =>
          accepts((draft: IAutoMovieDesignLineage): void => {
            draft.variants[2]!.changes = [];
          }),
      ],
    ]),
    {
      "a blank variant id is refused": true,
      "a duplicated variant id is refused": true,
      "a variant with no label is refused": true,
      "an alternative applying to a revision nobody recorded is refused": true,
      "a blank change id is refused": true,
      "a change id reused by another alternative is refused": true,
      "a change about an unknown subject is refused": true,
      "a change with no aspect is refused": true,
      "a change with no rationale is refused": true,
      "one alternative editing one aspect of one subject twice is refused": true,
      "a blank decision id is refused": true,
      "a decision with no question is refused": true,
      "a decision holding fewer than two alternatives is refused": true,
      "a decision naming an unknown alternative is refused": true,
      "a decision naming one alternative twice is refused": true,
      "a decision straddling two base revisions is refused": true,
      "a selection that is not one of the compared alternatives is refused": true,
      "an alternative that changes nothing is accepted": true,
    },
  );

  TestValidator.equals(
    "derived artifact refusals",
    namedFacts([
      [
        "a blank artifact id is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[0]!.id = "";
          }, "$input.derived[0].id"),
      ],
      [
        "a duplicated artifact id is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[1]!.id = "mesh-wall-north";
          }, "$input.derived[1].id"),
      ],
      [
        "an artifact squatting on a declared subject identity is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[0]!.id = "wall-north";
          }, "$input.derived[0].id"),
      ],
      [
        "an artifact with no output family is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[0]!.kind = " ";
          }, "$input.derived[0].kind"),
      ],
      [
        "an artifact citing no input at all is refused",
        (): boolean =>
          refuses(
            (draft: IAutoMovieDesignLineage): void => {
              draft.derived[1]!.inputs = [];
            },
            "$input.derived[1].inputs",
            "range",
          ),
      ],
      [
        "an artifact citing an unknown input is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[1]!.inputs = ["wall-east"];
          }, "$input.derived[1].inputs[0]"),
      ],
      [
        "an artifact citing one input twice is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[1]!.inputs = ["wall-west", "wall-west"];
          }, "$input.derived[1].inputs[1]"),
      ],
      [
        "a derivation cycle is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[0]!.inputs = [
              "wall-north",
              "opening-door",
              "render-lobby",
            ];
          }, "$input.derived"),
      ],
      [
        "a malformed artifact digest is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[0]!.digest = "sha256:short";
          }, "$input.derived[0].digest"),
      ],
      [
        "a malformed configuration digest is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[0]!.stamp.configuration = "sha256:short";
          }, "$input.derived[0].stamp.configuration"),
      ],
      [
        "an artifact still stamping a superseded revision is refused as stale",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[0]!.stamp.revision = "r1";
          }, "$input.derived[0].stamp.revision"),
      ],
      [
        "an artifact stamping an unknown alternative is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[9]!.stamp.variant = "brutalist";
          }, "$input.derived[9].stamp.variant"),
      ],
      [
        "an artifact applying another revision's alternative is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[9]!.stamp.variant = "legacy-scheme";
          }, "$input.derived[9].stamp.variant"),
      ],
      [
        "an artifact stamping an unknown phase is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[8]!.stamp.phase = "topping-out";
          }, "$input.derived[8].stamp.phase"),
      ],
      [
        "an artifact disagreeing with the input it was computed from is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[6]!.stamp.configuration = lineageDigest("de");
          }, "$input.derived[6].inputs[0]"),
      ],
      [
        "an output reading imported bytes without quoting them is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[3]!.assets = [];
          }, "$input.derived[3].assets"),
      ],
      [
        "an output quoting bytes the identity never carried is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[3]!.assets[0]!.digest = lineageDigest("5d");
          }, "$input.derived[3].assets[0].digest"),
      ],
      [
        "replacing a texture leaves the finish cut that read it stale",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.subjects[10]!.digest = lineageDigest("5d");
          }, "$input.derived[3].assets[0].digest"),
      ],
      [
        "replacing a texture leaves the alternative render that read it stale",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.subjects[10]!.digest = lineageDigest("5d");
          }, "$input.derived[9].assets[0].digest"),
      ],
      [
        "a quote for an identity the output never read is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[1]!.assets = [
              { subject: "oak-texture", digest: RENOVATION_TEXTURE_DIGEST },
            ];
          }, "$input.derived[1].assets[0].subject"),
      ],
      [
        "a quote for an input whose content is authored source is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[1]!.assets = [
              { subject: "wall-west", digest: RENOVATION_TEXTURE_DIGEST },
            ];
          }, "$input.derived[1].assets[0].subject"),
      ],
      [
        "one identity quoted twice by one output is refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[3]!.assets.push({
              subject: "oak-texture",
              digest: RENOVATION_TEXTURE_DIGEST,
            });
          }, "$input.derived[3].assets[1].subject"),
      ],
      [
        "an output dropping both the imported input and its quote is accepted",
        (): boolean =>
          accepts((draft: IAutoMovieDesignLineage): void => {
            draft.derived[3]!.inputs = ["floor-oak", "mesh-wall-north"];
            draft.derived[3]!.assets = [];
          }),
      ],
      [
        "bytes replaced together with every quote of them are accepted",
        (): boolean =>
          accepts((draft: IAutoMovieDesignLineage): void => {
            const replaced: string = lineageDigest("5d");
            draft.subjects[10]!.digest = replaced;
            draft.derived[3]!.assets[0]!.digest = replaced;
            draft.derived[9]!.assets[0]!.digest = replaced;
          }),
      ],
      [
        "two comparison renders under different configurations are refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[10]!.stamp.configuration = lineageDigest("de");
          }, "$input.derived[10].stamp"),
      ],
      [
        "two comparison renders at different phases are refused",
        (): boolean =>
          refuses((draft: IAutoMovieDesignLineage): void => {
            draft.derived[10]!.stamp.phase = "finishes";
          }, "$input.derived[10].stamp"),
      ],
      [
        "the same pair moved onto one shared configuration is accepted",
        (): boolean =>
          accepts((draft: IAutoMovieDesignLineage): void => {
            draft.derived[9]!.stamp.configuration = lineageDigest("de");
            draft.derived[10]!.stamp.configuration = lineageDigest("de");
          }),
      ],
      [
        "the same pair moved onto one shared phase is accepted",
        (): boolean =>
          accepts((draft: IAutoMovieDesignLineage): void => {
            draft.derived[9]!.stamp.phase = "finishes";
            draft.derived[10]!.stamp.phase = "finishes";
          }),
      ],
    ]),
    {
      "a blank artifact id is refused": true,
      "a duplicated artifact id is refused": true,
      "an artifact squatting on a declared subject identity is refused": true,
      "an artifact with no output family is refused": true,
      "an artifact citing no input at all is refused": true,
      "an artifact citing an unknown input is refused": true,
      "an artifact citing one input twice is refused": true,
      "a derivation cycle is refused": true,
      "a malformed artifact digest is refused": true,
      "a malformed configuration digest is refused": true,
      "an artifact still stamping a superseded revision is refused as stale": true,
      "an artifact stamping an unknown alternative is refused": true,
      "an artifact applying another revision's alternative is refused": true,
      "an artifact stamping an unknown phase is refused": true,
      "an artifact disagreeing with the input it was computed from is refused": true,
      "an output reading imported bytes without quoting them is refused": true,
      "an output quoting bytes the identity never carried is refused": true,
      "replacing a texture leaves the finish cut that read it stale": true,
      "replacing a texture leaves the alternative render that read it stale": true,
      "a quote for an identity the output never read is refused": true,
      "a quote for an input whose content is authored source is refused": true,
      "one identity quoted twice by one output is refused": true,
      "an output dropping both the imported input and its quote is accepted": true,
      "bytes replaced together with every quote of them are accepted": true,
      "two comparison renders under different configurations are refused": true,
      "two comparison renders at different phases are refused": true,
      "the same pair moved onto one shared configuration is accepted": true,
      "the same pair moved onto one shared phase is accepted": true,
    },
  );
}
