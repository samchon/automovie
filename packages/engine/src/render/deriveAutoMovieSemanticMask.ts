import { IAutoMovieBuiltEnvironment, IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry, IAutoMovieSemanticMaskGap } from "@automovie/interface";
import { autoMovieRenderHash32 } from "./autoMovieRenderHash32";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import { autoMovieFluidSurfaceNodeName } from "./autoMovieFluidSurfaceNodeName";
import { autoMoviePlantingNodeName } from "./autoMoviePlantingNodeName";
import { autoMovieSoftBodyNodeName } from "./autoMovieSoftBodyNodeName";
import { AUTOMOVIE_SEMANTIC_MASK_COLORS } from "./constants/AUTOMOVIE_SEMANTIC_MASK_COLORS";
import { AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES } from "./constants/AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES";
import { AUTOMOVIE_SEMANTIC_MASK_SPACE_NODE } from "./constants/AUTOMOVIE_SEMANTIC_MASK_SPACE_NODE";
import { digestAutoMovieSemanticMask } from "./digestAutoMovieSemanticMask";

/** Current full-payload semantic-mask format. */
const SEMANTIC_MASK_VERSION = 2;

/** Domain separator for the current full-payload semantic-mask format. */
const SEMANTIC_MASK_PROTOCOL = "automovie.semantic-mask.v2";

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

/** One entity awaiting a colour. */
interface IClaim {
  id: string;
  kind: IAutoMovieSemanticMaskEntry["kind"];
  label: string | null;
  owner: string | null;
  nodes: string[];
  slot: IAutoMovieSemanticMaskEntry["slot"];
}

/**
 * Assign every claim its colour.
 *
 * Claims are visited in ascending id order, so the "smaller id keeps the
 * colour" tie-break is structural rather than a comparison written out: the
 * first claimant of a colour is by construction the smallest id that wants it.
 */
const allocate = (claims: readonly IClaim[]): IAutoMovieSemanticMaskEntry[] => {
  const used = new Set<number>();
  return [...claims]
    .sort((left, right) => compareAutoMovieRenderIds(left.id, right.id))
    .map((claim) => {
      let color =
        1 + (autoMovieRenderHash32(claim.id) % AUTOMOVIE_SEMANTIC_MASK_COLORS);
      // Linear probe wrapped inside `[1, COLORS]`, so the sequence visits every
      // assignable colour and `#000000` stays reserved. The entry count is
      // bounded below the palette size, so a free colour always exists and this
      // loop has no failure path to conceal a defect in.
      while (used.has(color))
        color = (color % AUTOMOVIE_SEMANTIC_MASK_COLORS) + 1;
      used.add(color);
      return {
        id: claim.id,
        kind: claim.kind,
        label: claim.label,
        color: `#${color.toString(16).toUpperCase().padStart(6, "0")}`,
        owner: claim.owner,
        nodes: [...claim.nodes].sort(compareAutoMovieRenderIds),
        slot: claim.slot,
      };
    });
};

/** Every entity-level claim in the subject, excluding instanced slots. */
const collectClaims = (subject: IAutoMovieRenderSubject): IClaim[] => {
  const claims: IClaim[] = [];
  const owned = new Set<string>();
  for (const environment of subject.environments ?? [])
    claims.push(...environmentClaims(environment, owned));
  for (const node of subject.scene.nodes)
    if (!owned.has(node.id))
      claims.push({
        id: `node:${node.id}`,
        kind: "node",
        label: null,
        owner: null,
        nodes: [node.id],
        slot: null,
      });
  const space = subject.scene.space ?? null;
  if (space !== null)
    claims.push({
      id: `node:${space.id}`,
      kind: "node",
      label: "space",
      owner: null,
      // The viewer groups every standable surface under one named object; the
      // ground is one drawable, not one per polygon patch.
      nodes: [AUTOMOVIE_SEMANTIC_MASK_SPACE_NODE],
      slot: null,
    });
  for (const instanceSet of subject.instanceSets ?? [])
    claims.push({
      id: `instance-set:${instanceSet.id}`,
      kind: "instance-set",
      label: null,
      owner: null,
      nodes: [],
      slot: null,
    });
  for (const body of subject.waterBodies ?? [])
    claims.push({
      id: `water-body:${body.id}`,
      kind: "water-body",
      label: null,
      owner: body.owner,
      // The free surface a bound domain draws is one viewer object of its own,
      // named after the domain rather than after the body, so the join has to
      // carry that name too; without it the water would paint the reserved
      // background and a segmentation consumer would read the pond as nothing.
      nodes:
        body.domain === null
          ? body.nodes
          : [...body.nodes, autoMovieFluidSurfaceNodeName(body.domain.id)],
      slot: null,
    });
  // Cloth and planting paint pixels no scene node holds. Addressing them by the
  // viewer names their own builders assign is what keeps a curtain a curtain in
  // the mask instead of an unaddressed mesh painted background.
  for (const panel of subject.softBodies ?? [])
    claims.push({
      id: `soft-body:${panel.domain.id}`,
      kind: "soft-body",
      label: null,
      owner: panel.owner,
      nodes: [autoMovieSoftBodyNodeName(panel.domain.id)],
      slot: null,
    });
  for (const planting of subject.plantings ?? [])
    claims.push({
      id: `planting:${planting.cluster.id}`,
      kind: "planting",
      label: null,
      owner: planting.owner,
      // One claim for the cluster group, so both instanced batches under it
      // resolve to the same colour: a bed of ferns is one thing a segmentation
      // consumer asks about, not two.
      nodes: [autoMoviePlantingNodeName(planting.cluster.id)],
      slot: null,
    });
  return claims;
};

/** Claims for one built environment's buildings, spaces, and drawables. */
const environmentClaims = (
  environment: IAutoMovieBuiltEnvironment,
  owned: Set<string>,
): IClaim[] => {
  const scope = environment.id;
  const buildingOfElement = new Map(
    environment.buildings.map((building) => [building.element, building.id]),
  );
  const buildingOfSpace = new Map(
    environment.buildings.map((building) => [building.space, building.id]),
  );
  // The tightest declared container of an element: the opening it fills, else
  // the boundary it realizes, else its parent element, else its building unit.
  // Ties inside one layer break on the ascending owner id so the chain is a
  // property of the design and not of declaration order.
  const boundaryOfElement = new Map<string, string>();
  for (const boundary of [...environment.boundaries].sort((left, right) =>
    compareAutoMovieRenderIds(left.id, right.id),
  ))
    for (const element of boundary.elements)
      if (!boundaryOfElement.has(element))
        boundaryOfElement.set(element, boundary.id);
  const openingOfElement = new Map<string, string>();
  for (const opening of [...environment.openings].sort((left, right) =>
    compareAutoMovieRenderIds(left.id, right.id),
  ))
    if (opening.fill !== null && !openingOfElement.has(opening.fill))
      openingOfElement.set(opening.fill, opening.id);

  const claims: IClaim[] = environment.buildings.map((building) => ({
    id: `building:${scope}/${building.id}`,
    kind: "building",
    label: null,
    owner: null,
    nodes: [],
    slot: null,
  }));
  for (const space of environment.spaces)
    claims.push({
      id: `space:${scope}/${space.id}`,
      kind: "space",
      label: space.kind,
      owner:
        space.parent !== null
          ? `space:${scope}/${space.parent}`
          : buildingOwner(scope, buildingOfSpace.get(space.id)),
      nodes: [],
      slot: null,
    });
  for (const boundary of environment.boundaries)
    claims.push({
      id: `boundary:${scope}/${boundary.id}`,
      kind: "boundary",
      label: boundary.kind,
      owner:
        boundary.spaces.length === 0
          ? null
          : `space:${scope}/${boundary.spaces[0]!}`,
      nodes: [],
      slot: null,
    });
  for (const opening of environment.openings)
    claims.push({
      id: `opening:${scope}/${opening.id}`,
      kind: "opening",
      label: opening.kind,
      owner: `boundary:${scope}/${opening.boundary}`,
      nodes: [],
      slot: null,
    });
  for (const element of environment.elements) {
    const node = `${scope}/${element.id}`;
    if (element.model !== null) owned.add(node);
    const opening = openingOfElement.get(element.id);
    const boundary = boundaryOfElement.get(element.id);
    claims.push({
      id: `element:${scope}/${element.id}`,
      kind: "element",
      label: element.kind,
      owner:
        opening !== undefined
          ? `opening:${scope}/${opening}`
          : boundary !== undefined
            ? `boundary:${scope}/${boundary}`
            : element.parent !== null
              ? `element:${scope}/${element.parent}`
              : buildingOwner(scope, buildingOfElement.get(element.id)),
      nodes: element.model !== null ? [node] : [],
      slot: null,
    });
  }
  return claims;
};

const buildingOwner = (
  scope: string,
  building: string | undefined,
): string | null =>
  building === undefined ? null : `building:${scope}/${building}`;

/**
 * Per-slot claims for instanced sets, and the sets that did not fit.
 *
 * Sets are considered in ascending id order and a set is addressed only while
 * the running total stays inside the bound, so whether one set's slots are
 * addressed never depends on how the caller ordered the array. A set that does
 * not fit keeps its set-level colour and is listed in `unaddressed`.
 */
const collectSlotClaims = (
  subject: IAutoMovieRenderSubject,
  entities: number,
): { claims: IClaim[]; unaddressed: IAutoMovieSemanticMaskGap[] } => {
  const claims: IClaim[] = [];
  const unaddressed: IAutoMovieSemanticMaskGap[] = [];
  let total = entities;
  for (const instanceSet of [...(subject.instanceSets ?? [])].sort(
    (left, right) => compareAutoMovieRenderIds(left.id, right.id),
  )) {
    if (total + instanceSet.count > AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES) {
      unaddressed.push({
        instanceSet: instanceSet.id,
        slots: instanceSet.count,
        reason: `addressing ${instanceSet.count} slots would take the mask past its bounded maximum of ${AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES} entries`,
        remedy: `split "${instanceSet.id}" into smaller sets, or read per-slot identity from the compiled instance runtime instead of the mask`,
      });
      continue;
    }
    total += instanceSet.count;
    for (let index = 0; index < instanceSet.count; ++index)
      claims.push({
        id: `instance-slot:${instanceSet.id}#${index}`,
        kind: "instance-slot",
        label: null,
        owner: `instance-set:${instanceSet.id}`,
        nodes: [],
        slot: { instanceSet: instanceSet.id, index },
      });
  }
  return { claims, unaddressed };
};
