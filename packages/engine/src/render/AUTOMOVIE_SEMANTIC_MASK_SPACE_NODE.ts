import { IAutoMovieBuiltEnvironment, IAutoMovieSemanticMaskGap } from "@automovie/interface";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import { AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES } from "./AUTOMOVIE_SEMANTIC_MASK_MAX_ENTRIES";

/**
 * Name of the viewer group holding a scene's standable ground.
 *
 * Mirrors `SPACE_GROUP_NAME` in the viewer. The engine cannot import the
 * viewer, and the mask has to be derivable without a renderer, so the one
 * constant both sides agree on is asserted by the test suite rather than shared
 * through a dependency that would invert the package layering.
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Gives standable ground a stable node key shared by semantic derivation and rendering.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Joins the structural pass's space entry to the viewer group that actually paints it.
 */
export const AUTOMOVIE_SEMANTIC_MASK_SPACE_NODE = "__automovie_space";

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

const buildingOwner = (
  scope: string,
  building: string | undefined,
): string | null =>
  building === undefined ? null : `building:${scope}/${building}`;
