import { IAutoMovieSemanticMask, IAutoMovieSemanticMaskEntry } from "@automovie/interface";
import { autoMovieRenderHash32 } from "./autoMovieRenderHash32";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import { autoMovieFluidSurfaceNodeName } from "./autoMovieFluidSurfaceNodeName";
import { autoMoviePlantingNodeName } from "./autoMoviePlantingNodeName";
import { autoMovieSoftBodyNodeName } from "./autoMovieSoftBodyNodeName";
import { AUTOMOVIE_SEMANTIC_MASK_COLORS } from "./AUTOMOVIE_SEMANTIC_MASK_COLORS";
import { AUTOMOVIE_SEMANTIC_MASK_SPACE_NODE } from "./AUTOMOVIE_SEMANTIC_MASK_SPACE_NODE";
import { verifyAutoMovieSemanticMask } from "./verifyAutoMovieSemanticMask";

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
 *
 * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Serializes the palette that makes each rendered mask colour resolvable to its semantic entity.
 * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Produces the deterministic sidecar paired with the identity-mask frames.
 * @author Samchon
 */
export const renderAutoMovieSemanticMaskSidecar = (
  mask: IAutoMovieSemanticMask,
): string => {
  verifyAutoMovieSemanticMask(mask);
  return `${JSON.stringify(
    { ...canonicalSemanticMaskPayload(mask), digest: mask.digest },
    null,
    2,
  )}\n`;
};

/** Complete mask payload in its one portable field and collection order. */
const canonicalSemanticMaskPayload = (
  mask: Omit<IAutoMovieSemanticMask, "digest">,
): Omit<IAutoMovieSemanticMask, "digest"> => ({
  version: mask.version,
  protocol: mask.protocol,
  background: mask.background,
  entries: [...mask.entries]
    .sort((left, right) => compareAutoMovieRenderIds(left.id, right.id))
    .map((entry) => ({
      id: entry.id,
      kind: entry.kind,
      label: entry.label,
      color: entry.color,
      owner: entry.owner,
      nodes: [...entry.nodes].sort(compareAutoMovieRenderIds),
      slot:
        entry.slot === null
          ? null
          : {
              instanceSet: entry.slot.instanceSet,
              index: entry.slot.index,
            },
    })),
  unaddressed: [...mask.unaddressed]
    .sort((left, right) =>
      compareAutoMovieRenderIds(left.instanceSet, right.instanceSet),
    )
    .map((gap) => ({
      instanceSet: gap.instanceSet,
      slots: gap.slots,
      reason: gap.reason,
      remedy: gap.remedy,
    })),
});

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
