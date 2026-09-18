import { IAutoMovieSemanticMask } from "@automovie/interface";
import { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import { AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES } from "./AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES";
import { digestAutoMovieSemanticMask } from "./digestAutoMovieSemanticMask";

/**
 * Derive the stable semantic palette for one render subject.
 *
 * A colour is a pure function of the entity's semantic id: the id is hashed
 * into the palette, and a collision is resolved by giving the colour to the
 * lexicographically smaller id and probing forward for the other. Nothing in
 * that derivation can see the scene's array order, so:
 *
 * - Reordering `scene.nodes` reproduces a byte-identical mask, and
 * - Adding an unrelated entity leaves every existing colour untouched, unless the
 *   new id genuinely collides and genuinely sorts first, which is a property of
 *   the two ids and not of the edit.
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
 * Throws when the subject declares more entities than one bounded mask can
 * address. Silently dropping the excess would make a mask that segments a
 * different world than the one drawn.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Assigns stable collision-resolved colours to every drawable and retains its semantic ownership chain.
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-beauty-structural-distinction Derives a structural identity product from semantic drawables and ownership rather than reusing beauty colours as object identity.
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-pass-refusal Rejects duplicate semantic claimants or a mask population above the bounded palette instead of emitting an ambiguous structural pass.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Builds the complete structural mask product independently of scene traversal order.
 * @author Samchon
 */
export const deriveAutoMovieSemanticMask = (
  subject: IAutoMovieRenderSubject,
): IAutoMovieSemanticMask => {
  const claims = collectClaims(subject);
  // Two claimants of one semantic id would take two colours under one name, and
  // every reverse lookup of that name would answer with whichever entry the
  // index happened to keep. A mask that cannot say which thing a colour meant
  // is not evidence, so the ambiguity is refused where it is created.
  const claimed = new Set<string>();
  for (const claim of claims) {
    if (claimed.has(claim.id))
      throw new Error(
        `semantic mask has two claimants of "${claim.id}"; one drawable must not share a semantic id with another`,
      );
    claimed.add(claim.id);
  }
  if (claims.length > AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES)
    throw new Error(
      `semantic mask needs ${claims.length} entries, above the bounded maximum ${AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES}; derive one mask per building unit instead of one for the whole work`,
    );
  const slots = collectSlotClaims(subject, claims.length);
  const entries = allocate([...claims, ...slots.claims]);
  const payload: Omit<IAutoMovieSemanticMask, "digest"> = {
    version: SEMANTIC_MASK_VERSION as IAutoMovieSemanticMask["version"],
    protocol: SEMANTIC_MASK_PROTOCOL as IAutoMovieSemanticMask["protocol"],
    background: "#000000",
    entries,
    unaddressed: slots.unaddressed,
  };
  return { ...payload, digest: digestAutoMovieSemanticMask(payload) };
};
