import { assertSemanticMaskCapacity as assertSemanticMaskCapacityImplementation } from "./internal/assertSemanticMaskCapacity";
import { type IAutoMovieSemanticMaskEntry, type IAutoMovieSemanticMask, type IAutoMovieRenderSubject, type IAutoMovieSemanticMaskResolution } from "@automovie/interface";
import { semanticMaskNodeIndex as semanticMaskNodeIndexImplementation } from "./internal/semanticMaskNodeIndex";
import { semanticMaskVerificationFailure as semanticMaskVerificationFailureImplementation } from "./internal/semanticMaskVerificationFailure";
import { canonicalSemanticMaskPayload as canonicalSemanticMaskPayloadImplementation } from "./internal/canonicalSemanticMaskPayload";
import { deriveSemanticMask as deriveSemanticMaskImplementation } from "./internal/deriveSemanticMask";
import { digestSemanticMask as digestSemanticMaskImplementation } from "./internal/digestSemanticMask";
import { renderSemanticMaskSidecar as renderSemanticMaskSidecarImplementation } from "./internal/renderSemanticMaskSidecar";
import { resolveSemanticMask as resolveSemanticMaskImplementation } from "./internal/resolveSemanticMask";
import { verifySemanticMask as verifySemanticMaskImplementation } from "./internal/verifySemanticMask";

/** Public operations for Auto Movie Engine Render Semantic Mask. */
export namespace AutoMovieEngineRenderSemanticMask {
  /**
   * Admit the entity-claim count before allocating palette colours or instance
   * slots. The derivation owner supplies an array length after checking duplicate
   * identities, so the count is a nonnegative safe integer by construction. A
   * count at the bound remains valid; a larger count refuses rather than
   * truncating structural evidence. This check does not certify claim identities,
   * drawable coverage or the optional slot population.
   */
  export function assertAutoMovieSemanticMaskCapacity(entities: number): void {
    assertSemanticMaskCapacityImplementation(entities);
  }

  /**
   * Index a mask by the scene node ids that draw each entry.
   *
   * The viewer holds objects, not semantics; this is the join it uses. Built as
   * one map rather than searched per mesh, because a structural pass touches
   * every drawable in the scene once per frame.
   */
  export function autoMovieSemanticMaskNodeIndex(mask: IAutoMovieSemanticMask): Map<string, IAutoMovieSemanticMaskEntry> {
    return semanticMaskNodeIndexImplementation(mask);
  }

  /**
   * Return the typed reason from a semantic-mask verifier refusal.
   *
   * Receipt consumers use this instead of parsing error prose, while unrelated
   * exceptions remain distinguishable as `null`.
   */
  export function autoMovieSemanticMaskVerificationFailure(error: unknown): "unsupported" | "invalid" | "digest-mismatch" | null {
    return semanticMaskVerificationFailureImplementation(error);
  }

  /**
   * Project the complete current semantic payload into one field/collection
   * order.
   */
  export function canonicalAutoMovieSemanticMaskPayload(mask: Omit<IAutoMovieSemanticMask, "digest">): Omit<IAutoMovieSemanticMask, "digest"> {
    return canonicalSemanticMaskPayloadImplementation(mask);
  }

  /**
   * Derive the stable semantic palette for one render subject.
   *
   * Each semantic id supplies a hashed starting colour; allocation visits ids in
   * code-unit order and probes occupied colours forward. An allocated colour
   * therefore depends on the complete claim population when collisions or probing
   * chains occur. Reordering `scene.nodes` preserves the palette payload, while
   * adding claims can change existing colours through those chains.
   *
   * This function emits palette metadata. It observes no rendered pixels and does
   * not prove byte-identical GPU segmentation.
   *
   * Pixels belong to exactly one entry: the drawable that paints them. A
   * building's logical layers, its spaces, boundaries and openings, paint nothing
   * of their own and are reached through `owner`, so a wall pixel resolves to its
   * element, then to the boundary that wall realizes, then to the room, then to
   * the building unit. An element that fills an opening is owned by that opening,
   * which is how a door prop is addressable as a door rather than as an anonymous
   * panel.
   *
   * Simulated drawables are addressed the same way. A cloth panel, a planting
   * cluster and a bound water surface are held by no scene node, so they are
   * joined by the names their own viewer builders assign; without those names
   * every one of them would paint the reserved background and a segmentation
   * consumer would read a curtain, a fern bed and a pond as nothing at all.
   *
   * A surface graphic and a flame are joined by their viewer objects' names,
   * which are also their ids, `surface-graphic:<node>/<surface>` and
   * `flame:<node>/<cue>`, and each is owned by its prop's node, so a screen's
   * face or a candle's flame resolves to itself first and then the prop.
   *
   * Throws when the subject declares more entities than one bounded mask can
   * address. Silently dropping the excess would make a mask that segments a
   * different world than the one drawn.
   */
  export function deriveAutoMovieSemanticMask(subject: IAutoMovieRenderSubject): IAutoMovieSemanticMask {
    return deriveSemanticMaskImplementation(subject);
  }

  /**
   * Return the digest of one mask's complete canonical payload.
   *
   * Every semantic field participates, while collection order does not. Entries,
   * their node joins, and bounded-palette gaps are sorted by their stable ids
   * before an explicit-field-order JSON document is hashed. The self-declared
   * digest is deliberately absent from that document.
   */
  export function digestAutoMovieSemanticMask(mask: Omit<IAutoMovieSemanticMask, "digest">): string {
    return digestSemanticMaskImplementation(mask);
  }

  /**
   * Serialize one mask as the sidecar that travels beside the pixels: pretty
   * JSON, declared field order, one trailing newline.
   *
   * A mask frame is unreadable on its own. `#0A1B2C` is a door leaf only because
   * this document says so, so the palette has to leave the renderer with the
   * frames rather than be re-derived by whoever opens them later; a consumer that
   * re-derived it from a design that has since moved on would read yesterday's
   * colours off today's pixels. The bytes are the same convention the caption and
   * pose-keypoint sidecars use, so a host writes all three the same way.
   */
  export function renderAutoMovieSemanticMaskSidecar(mask: IAutoMovieSemanticMask): string {
    return renderSemanticMaskSidecarImplementation(mask);
  }

  /**
   * Read one rendered colour back to the thing it named, plus everything that
   * contains it.
   *
   * This is the whole point of the sidecar: a segmentation consumer holds a
   * pixel, not a graph. `#0A1B2C` becomes a door leaf, which becomes the door
   * opening, the wall boundary, the room, the storey and the building unit, and
   * every one of those is a stable id the design can be edited by.
   *
   * An unknown or malformed colour returns `null` rather than a guess.
   */
  export function resolveAutoMovieSemanticMask(mask: IAutoMovieSemanticMask, color: string): IAutoMovieSemanticMaskResolution | null {
    return resolveSemanticMaskImplementation(mask, color);
  }

  /**
   * Refuse a historical, foreign, or self-inconsistent semantic mask.
   *
   * This verifies current format identity and the complete canonical payload
   * digest. Semantic graph validity remains the derivation owner's concern, so a
   * consumer cannot accidentally reinterpret a v1 sidecar as current v2
   * evidence.
   */
  export function verifyAutoMovieSemanticMask(mask: IAutoMovieSemanticMask): void {
    verifySemanticMaskImplementation(mask);
  }
}
