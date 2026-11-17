import type { IAutoMovieHumanDigitSection } from "../IAutoMovieHumanDigitSection";

/**
 * Digit section evaluators, joint windows and nail dimensions along a millimetre centre-line clock.
 *
 * The interface package owns these declarations; AutoMovieHumanDigitProfile in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Digit section evaluators, joint windows and nail dimensions along a millimetre centre-line clock. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IInput, IWindow, SpanRoot, SpanStations, SpanResult, INailResult, OfResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IInput, IWindow, SpanRoot, SpanStations, SpanResult, INailResult, OfResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanDigitProfile exchanges the named IInput, IWindow, SpanRoot, SpanStations, SpanResult, INailResult, OfResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanDigitProfile {
  /** The digit's base section and its loci along the line, mm.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The digit's base section and its loci along the line, mm.
   * @evidence contracts/development/design.md#principled-representation `base`: The digit's own section at an arc length along the line: half width, palmar and dorsal depths. `root`: Arc length of the digit's root, where its own sections start. `joints`: Arc lengths of the two distal joints (PIP and DIP, or the thumb's MCP and IP).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanDigitProfile.windows, AutoMovieHumanDigitProfile.creasesOf, AutoMovieHumanDigitProfile.plateOf. Also types AutoMovieHumanHandDigitBones.profile.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `base`, `root`, `joints`, `length`, `cap`, `softness`, `thumb`; callers supply the complete record.
   */
  export interface IInput {
    /**
     * The digit's own section at an arc length along the line: half width, palmar and dorsal depths.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The digit's own section at an arc length along the line: half width, palmar and dorsal depths.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or compensations execute in this signature. AutoMovieHumanDigitProfile and the callback provider must satisfy the documented base contract.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The signature chooses no algorithm or storage strategy; AutoMovieHumanDigitProfile and its callback provider own the cost of each base invocation.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This declaration performs no requests or caching. AutoMovieHumanDigitProfile and the callback provider determine when the inputs to base describe equivalent work.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The signature acquires no resources. AutoMovieHumanDigitProfile and the callback provider own any captured source data and the callable's lifetime.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation This is the IAutoMovieHumanDigitProfile.IInput.base callable contract, without an implementation body. AutoMovieHumanDigitProfile and its supplied callbacks own the numerical method and admission of the documented arguments.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure IAutoMovieHumanDigitProfile.IInput.base declares only the invocation boundary; decomposition belongs to AutoMovieHumanDigitProfile and the callback provider.
     */
    base: (s: number) => [number, number, number];

    /** Arc length of the digit's root, where its own sections start. */
    root: number;

    /** Arc lengths of the two distal joints (PIP and DIP, or the thumb's MCP and IP). */
    joints: readonly [number, number];

    /** Arc length of the apex. */
    length: number;

    /** Arc length where the tip's cap starts. */
    cap: number;

    /** Half length of a joint's turn, per joint radius (the elbow's softness). */
    softness: number;

    /** True for the thumb, whose base sections are its own and whose creases stand at its two joints. */
    thumb: boolean;
  }

  /** A relief's window along the line.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A relief's window along the line.
   * @evidence contracts/development/design.md#principled-representation `at`: Arc length of the window's centre, mm. `half`: Half width of the window along the line, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanDigitProfile.windows. Read by AutoMovieHumanDigitStations.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `at`, `half`; callers supply the complete record.
   */
  export interface IWindow {
    /** Arc length of the window's centre, mm. */
    at: number;

    /** Half width of the window along the line, mm. */
    half: number;
  }

  /** The root argument of AutoMovieHumanDigitProfile.span. A finger's base section from the span law, scaled to its root section.
  @param root The finger's own half width and half depth at its root, mm.
  @param stations Arc lengths of the root, PIP, DIP and the cap's start, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A finger's base section from the span law, scaled to its root section.
 * @evidence contracts/development/design.md#principled-representation A finger's base section from the span law, scaled to its root section. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitProfile.SpanRoot is the canonical exchange used by AutoMovieHumanDigitProfile.span.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitProfile.span for a finger's base section from the span law, scaled to its root section.
 */
  export type SpanRoot = readonly [number, number];

  /** The stations argument of AutoMovieHumanDigitProfile.span. A finger's base section from the span law, scaled to its root section.
  @param root The finger's own half width and half depth at its root, mm.
  @param stations Arc lengths of the root, PIP, DIP and the cap's start, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A finger's base section from the span law, scaled to its root section.
 * @evidence contracts/development/design.md#principled-representation A finger's base section from the span law, scaled to its root section. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitProfile.SpanStations is the canonical exchange used by AutoMovieHumanDigitProfile.span.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitProfile.span for a finger's base section from the span law, scaled to its root section.
 */
  export type SpanStations = readonly [number, number, number, number];

  /** Result of AutoMovieHumanDigitProfile.span. A finger's base section from the span law, scaled to its root section.
  @param root The finger's own half width and half depth at its root, mm.
  @param stations Arc lengths of the root, PIP, DIP and the cap's start, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A finger's base section from the span law, scaled to its root section.
 * @evidence contracts/development/design.md#principled-representation A finger's base section from the span law, scaled to its root section. The callable takes s and returns [number, number, number].
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitProfile.SpanResult is the canonical exchange used by AutoMovieHumanDigitProfile.span.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitProfile.span for a finger's base section from the span law, scaled to its root section.
 */
  export type SpanResult = (s: number) => [number, number, number];

  /** Result of AutoMovieHumanDigitProfile.nail. The nail plate's window along the line: its root, its free edge at the
  cap's start, and its width, the window the skin's nail part takes on the
  digit's chain.
  @param input The digit's base and loci.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The nail plate's window along the line: its root, its free edge at the cap's start, and its width, the window the skin's nail part takes on the digit's chain.
 * @evidence contracts/development/design.md#principled-representation `root`: Proximal nail-plate station along the digit's centre line, millimetres. `edge`: Free nail edge at the distal cap's start, millimetres along the digit's centre line. `width`: Nail plate's full transverse width, millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitProfile.INailResult is the canonical exchange used by AutoMovieHumanDigitProfile.nail.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `root`, `edge`, `width`; callers supply the complete record.
 */
  export type INailResult = {
    /** Proximal nail-plate station along the digit's centre line, millimetres. */
    root: number;
    /** Free nail edge at the distal cap's start, millimetres along the digit's centre line. */
    edge: number;
    /** Nail plate's full transverse width, millimetres. */
    width: number;
  };

  /** Result of AutoMovieHumanDigitProfile.of. The section shape at every arc length.
  @param input The digit's base and loci.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The section shape at every arc length.
 * @evidence contracts/development/design.md#principled-representation The section shape at every arc length. The callable takes s and returns IAutoMovieHumanDigitSection.IShape.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanDigitProfile.OfResult is the canonical exchange used by AutoMovieHumanDigitProfile.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanDigitProfile.of for the section shape at every arc length.
 */
  export type OfResult = (s: number) => IAutoMovieHumanDigitSection.IShape;
}
