import { createAutoMovieSignedMeshQuery } from "@automovie/engine";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";

/**
 * Admit a basis's coupled oral contact declaration before any document is
 * evaluated against it: every surface and channel it names exists, the
 * aperture vertex pairs are resident and distinct, the closure channel is an
 * expression channel decomposed against a different expression channel, the
 * tongue and every soft surface are resident and named once, each collider
 * seals into a surface the engine's oriented sheet query admits on the
 * neutral, and every metre figure is finite and nonnegative.
 *
 * Contact requires articulation, because the opening direction that orders
 * the apertures and the passage slab is read from the mandible's axis and
 * its reference opening; a purely linear basis has no such direction. The
 * check reads names and neutral geometry only; whether a document's
 * combination passes the rules is the evaluation's answer, not admission's.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-contact Refuses a contact declaration that names absent tissue or channels before a document could be judged against it.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-contact Checks the aperture pairs, closure coupling, passage, colliders and budgets the specification requires of a contact block.
 */
export function assertHumanFaceContact(basis: IAutoMovieHumanFaceBasis): void {
  const contact = basis.contact;
  if (contact === undefined) return;
  if (basis.articulation === undefined)
    throw new Error(
      "Facial contact needs the mandibular articulation for its opening direction.",
    );
  const surfaces = new Map(
    basis.surfaces.map((surface) => [surface.id, surface]),
  );
  const channels = new Map(
    basis.channels.map((channel) => [channel.id, channel.kind]),
  );
  const pair = (
    name: string,
    entry: { surface: string; upper: number; lower: number },
  ): void => {
    const surface = surfaces.get(entry.surface);
    const count = surface === undefined ? 0 : surface.positions.length / 3;
    if (
      surface === undefined ||
      [entry.upper, entry.lower].some(
        (vertex) => !Number.isInteger(vertex) || vertex < 0 || vertex >= count,
      ) ||
      entry.upper === entry.lower
    )
      throw new Error(
        "Facial contact " +
          name +
          " need two distinct resident vertices of one surface.",
      );
  };
  pair("lips", contact.lips);
  pair("incisors", contact.incisors);
  const expression = (channel: string): void => {
    if (channels.get(channel) !== "expression")
      throw new Error("Facial contact needs an expression channel: " + channel);
  };
  expression(contact.closure.channel);
  expression(contact.closure.reference);
  expression(contact.passage.channel);
  if (contact.closure.channel === contact.closure.reference)
    throw new Error(
      "A closure channel is decomposed against a different reference channel.",
    );
  if (
    !surfaces.has(contact.passage.surface) ||
    !Number.isFinite(contact.passage.slabMetres) ||
    contact.passage.slabMetres <= 0
  )
    throw new Error(
      "Facial contact passage needs a resident tongue surface and a positive slab.",
    );
  if (
    !Number.isFinite(contact.toleranceMetres) ||
    contact.toleranceMetres < 0 ||
    contact.colliders.length === 0 ||
    contact.soft.length === 0
  )
    throw new Error(
      "Facial contact needs a nonnegative tolerance, colliders and soft surfaces.",
    );
  const named = new Set<string>();
  for (const collider of contact.colliders) {
    const surface = surfaces.get(collider.surface);
    const count = surface === undefined ? 0 : surface.positions.length / 3;
    if (
      surface === undefined ||
      named.has(collider.surface) ||
      !Number.isFinite(collider.reachMetres) ||
      collider.reachMetres <= 0 ||
      collider.closure.length % 3 !== 0 ||
      collider.closure.some(
        (vertex) => !Number.isInteger(vertex) || vertex < 0 || vertex >= count,
      )
    )
      throw new Error(
        "A facial collider needs a resident surface named once, resident closure triangles and a positive reach: " +
          collider.surface,
      );
    named.add(collider.surface);
    // The sheet query admits or refuses the sealed neutral collider itself.
    createAutoMovieSignedMeshQuery(
      {
        positions: surface.positions,
        indices: [...surface.indices, ...collider.closure],
        normals: null,
        uvs: null,
        skin: null,
      },
      { boundary: "open" },
    );
  }
  for (const soft of contact.soft) {
    if (
      !surfaces.has(soft.surface) ||
      named.has(soft.surface) ||
      !Number.isFinite(soft.budgetMetres) ||
      soft.budgetMetres < 0
    )
      throw new Error(
        "A facial soft surface is resident, named once, not a collider, and has a nonnegative budget: " +
          soft.surface,
      );
    named.add(soft.surface);
  }
}
