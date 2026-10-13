/**
 * One scalar or closed-choice input of the person document as the catalogue lists it: where it lives in the document and what its owner says about it.
 *
 * The catalogue is transport. Unit, range, step and qualification are copied from the owner's own descriptor (a basis channel, a registered head trait, a lash profile parameter); where the owner publishes no range the bounds are null and the screen says "not supplied". Nothing here is inferred, and admission stays with the owner's validator and builder. Paths contain literal key segments, so dots inside an owner id are not traversal separators. Default seeding, whole-record removal and explicit null disabling carry distinct owner operations; the descriptor itself performs none of them.
 *
 * @evidence contracts/common.md#principled-implementation Literal document paths preserve owner identity, and bounds/defaults/qualification plus separate seed/remove/disable paths carry the owning input contract to the editor.
 * @evidence contracts/common.md#clear-and-simple-design One transport record describes an input while path copying, DOM editing and complete-person validation remain their separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null bounds explicitly mean not supplied, authoring envelopes are not promoted to population anatomy, and omission is not conflated with explicit operation disabling.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies owner metadata provenance, literal segments, missing-range meaning and distinct seeding/removal/null operations.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This descriptor type implements no traversal, default materialization or numerical validation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Metadata transport declares no geometry result cache or descriptor memoization key.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Seed records and strings are ordinary borrowed data; the type acquires no DOM listener or numerical task.
 *
 * @author Samchon
 */
export interface IConnectedPersonInputDescriptor {
  /** Key segments from the person document root; a segment may itself contain dots. */
  path: string[];

  /** Display group the owner's descriptor belongs to. */
  group: string;

  /** Display name of the input within its group. */
  label: string;

  /** The owner's unit, such as mm, degrees or weight. */
  unit: string;

  /** The owner's lower bound, or null when the owner supplies none. */
  minimum: number | null;

  /** The owner's upper bound, or null when the owner supplies none. */
  maximum: number | null;

  /** Whether the owner excludes its numerical lower endpoint. */
  minimumExclusive?: boolean;

  /** Whether the owner excludes its numerical upper endpoint. */
  maximumExclusive?: boolean;

  /** Owner-defined closed choices; absence means a numerical scalar. */
  choices?: readonly string[];

  /** Original owner choice, absent when a legacy field has no exact closed-choice reading. */
  ownerChoice?: string;

  /** The owner's editing step, or null when the owner supplies none. */
  step: number | null;

  /** The owner's default value, or null when the owner publishes none. */
  ownerDefault: number | null;

  /** The owner's default for the whole containing record, used to start that record when the document omits it; null when the owner publishes none. */
  seed: object | null;

  /** The ancestor record the seed owns; omission seeds the immediate containing record. */
  seedPath?: readonly string[];

  /** Whole optional record removed when its members must be supplied together. */
  removePath?: readonly string[];

  /** Optional operation set to explicit null by Disable, distinct from removing an overlay. */
  disablePath?: readonly string[];

  /** What an absent value means, in the owner's terms. */
  omission: string;

  /** Whether the value may be removed on its own; false when its record needs every member. */
  removable: boolean;

  /** The owner's own statement of what the value and its bounds are. */
  qualification: string;
}
