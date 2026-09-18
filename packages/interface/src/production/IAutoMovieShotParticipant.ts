/**
 * An actor or formation required by a shot.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `IAutoMovieShotParticipant` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `IAutoMovieShotParticipant` for the narrative intent story design ownership system contract.
 */
export type IAutoMovieShotParticipant =
  | {
      /** Named actor participant. */
      kind: "actor";
      /** Actor id. */
      id: string;
    }
  | {
      /** Formation participant. */
      kind: "formation";
      /** Formation id. */
      id: string;
    };
