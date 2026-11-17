import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanHandAttachment } from "../hand/IAutoMovieHumanHandAttachment";
import type { IAutoMovieHumanSectionSite } from "./IAutoMovieHumanSectionSite";
import type { IAutoMovieHumanSectionSource } from "./IAutoMovieHumanSectionSource";

/**
 * Digit joint-course inputs, named site laws and original parent material attachments. Runtime construction and admission remain with AutoMovieHumanDigitWalk in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes digit joint-course inputs, named site laws and original parent material attachments; nested declarations retain their units, frames, optional states and callback contracts.
 * @evidence contracts/development/design.md#principled-representation Digit joint-course inputs, named site laws and original parent material attachments. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these dependency-free exchange types for AutoMovieHumanDigitWalk; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups the existing DigitWalk contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.
 */
export namespace IAutoMovieHumanDigitWalk {
  /** What a digit is built from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a digit is built from.
   * @evidence contracts/development/design.md#principled-representation `name`: Chain name, such as `finger.left.index` or `toe.left.1`. `centres`: The joint centres from the base (the knuckle, inside the host) to the distal phalanx's end: base, then each interphalangeal joint, then the end, at least three. `dorsal`: The dorsal direction on the first phalanx.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanDigitInterim.finger, AutoMovieHumanDigitInterim.walk. Read by AutoMovieHumanHandAttachment.attach, AutoMovieHumanDigitWalk.create, AutoMovieHumanDigitWalk.define. Also types AutoMovieHumanArmSources.branch, AutoMovieHumanArmSources.digit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `ranges`: Optional closed-span scalar bounds in this digit's material chart. `attachment`: Whole actual parent owner and declared local contact/material transfer.
   */
  export interface IInput {
    /** Chain name, such as `finger.left.index` or `toe.left.1`. */
    name: string;

    /** The joint centres from the base (the knuckle, inside the host) to the distal phalanx's end: base, then each interphalangeal joint, then the end, at least three. */
    centres: AutoMovieVector3Tuple[];

    /** The dorsal direction on the first phalanx. */
    dorsal: AutoMovieVector3Tuple;

    /** The pulp's reach past the distal phalanx's end to the tip, mm. */
    tip: number;
    /** Optional closed-span scalar bounds in this digit's material chart. */
    ranges?: IAutoMovieHumanSectionSource["ranges"];

    /**
     * The laws at a site: `base`, `joint <k>` (k from 1, the first joint after the base), `shaft <k>` (the middle of bone k from 0), `end`.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The laws at a site: `base`, `joint <k>` (k from 1, the first joint after the base), `shaft <k>` (the middle of bone k from 0), `end`.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This law signature specifies the documented callback contract without an implementation body; AutoMovieHumanDigitWalk and its supplied callbacks own the numerical method and its premises.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes law at the containing contract boundary; decomposition of its implementation remains with AutoMovieHumanDigitWalk.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual law provider is responsible for satisfying the documented semantics.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by AutoMovieHumanDigitWalk determines the work per law call.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; AutoMovieHumanDigitWalk's runtime provider owns reuse and must preserve the documented source identity and effects.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the law provider and the caller retaining its containing record own the callback and its captured dependencies.
     */
    law(site: string): ISiteLaw;

    /** Control points and ring phases of each section, a multiple of 4. */
    order: number;

    /** Widest spacing between layers, mm. */
    gap: number;
    /** Whole actual parent owner and declared local contact/material transfer. */
    attachment?: IAutoMovieHumanHandAttachment.IConnection;
  }

  /** A digit's laws at one site.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A digit's laws at one site.
   * @evidence contracts/development/design.md#principled-representation `breadth`: Whole breadth across the digit, mm. `depth`: Whole depth from the dorsal to the palmar or plantar skin, mm. `dorsal`: The dorsal share of the depth above the bone's axis, in `(0, 1)`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanDigitInterim.walk, AutoMovieHumanDigitWalk.bendRadius. Also types AutoMovieHumanFootToeSources.law, AutoMovieHumanFootToeSources.near.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `shoulders`: Actual parent-derived quarter fullness in this digit's engine material frame. `shoulderJets`: Available quarter jets in the same normalized source clock; a held parent section declares its constant pullback explicitly. `jets`: Optional original edge jets in the digit's normalized source parameter.
   */
  export interface ISiteLaw {
    /** Whole breadth across the digit, mm. */
    breadth: number;

    /** Whole depth from the dorsal to the palmar or plantar skin, mm. */
    depth: number;

    /** The dorsal share of the depth above the bone's axis, in `(0, 1)`. */
    dorsal: number;

    /** The sourced conic shoulder of the section there. */
    shoulder: number;
    /** Actual parent-derived quarter fullness in this digit's engine material frame. */
    shoulders?: [number, number, number, number];
    /** Available quarter jets in the same normalized source clock; a held parent section declares its constant pullback explicitly. */
    shoulderJets?: IAutoMovieViewPart.IQuarters<
      IAutoMovieViewPart.IKnot["jet"]
    >;
    /** Optional original edge jets in the digit's normalized source parameter. */
    jets?: IAutoMovieHumanSectionSite["jets"];
  }
}
