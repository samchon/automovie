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
 * @evidence contracts/common.md#principled-implementation Admission proves, before any document is evaluated, that every surface and channel the contact declaration names exists, the aperture pairs are two distinct resident vertices of one surface, closure and reference are different expression channels, each collider seals into a surface the engine's oriented sheet query accepts on the neutral, and every metre figure is finite and nonnegative. It reads names and neutral geometry only.
 * @evidence contracts/common.md#clear-and-simple-design One declaration checked in order; the sheet query itself is the engine's admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every violation throws; nothing is repaired or defaulted.
 * @evidence contracts/common.md#meaningful-documentation States the requirement of articulation, the checks and that the evaluation, not admission, answers whether a combination passes.
 * @evidenceExclude contracts/anatomy.md#anatomical-source assertHumanFaceContact carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range assertHumanFaceContact admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority assertHumanFaceContact defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping assertHumanFaceContact is a computation over existing data and defines no part or group of parts.
 * @evidenceExclude contracts/modeling.md#parameter-channels assertHumanFaceContact defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry assertHumanFaceContact emits no primitive.
 * @evidenceExclude contracts/modeling.md#shared-boundaries assertHumanFaceContact constructs no surface that meets another part.
 * @evidenceExclude contracts/modeling.md#rendered-observation assertHumanFaceContact owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
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
  if (contact.margin !== undefined) {
    const count = (surfaces.get(contact.lips.surface)?.positions.length ?? 0) / 3;
    const chains = [contact.margin.upper, contact.margin.lower];
    const all = chains.flat();
    if (
      chains.some((chain) => chain.length < 2) ||
      all.some((vertex) => !Number.isInteger(vertex) || vertex < 0 || vertex >= count) ||
      new Set(all).size !== all.length
    )
      throw new Error(
        "Facial contact lip margin needs two chains of at least two distinct resident vertices of the lips surface.",
      );
  }
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
      !(
        collider.coverMetres === undefined ||
        (Number.isFinite(collider.coverMetres) && collider.coverMetres >= 0)
      ) ||
      collider.closure.length % 3 !== 0 ||
      collider.closure.some(
        (vertex) => !Number.isInteger(vertex) || vertex < 0 || vertex >= count,
      )
    )
      throw new Error(
        "A facial collider needs a resident surface named once, resident closure triangles, a positive reach and a finite nonnegative cover: " +
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
