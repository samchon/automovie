import { createAutoMovieSignedMeshQuery } from "@automovie/engine";

import type { IAutoMovieHumanFaceBasis } from "../structures/IAutoMovieHumanFaceBasis";
import { readHumanFaceLipMarginPoints } from "./readHumanFaceLipMarginPoints";
import type { IAutoMovieHumanFaceBasisContact as IAutoMovieHumanFaceBasisContactImported } from "../structures/IAutoMovieHumanFaceBasisContact";
import type { IAutoMovieHumanFaceBasisSurface as IAutoMovieHumanFaceBasisSurfaceImported } from "../structures/IAutoMovieHumanFaceBasisSurface";
import type { IAutoMovieHumanFaceBasisChannel as IAutoMovieHumanFaceBasisChannelImported } from "../structures/IAutoMovieHumanFaceBasisChannel";
import type { IHumanFaceLipMarginPoints as IHumanFaceLipMarginPointsImported } from "./IHumanFaceLipMarginPoints";
import type { IHumanFaceLipMarginPoint as IHumanFaceLipMarginPointImported } from "./IHumanFaceLipMarginPoint";


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
 * @evidence contracts/common.md#principled-implementation Named resident oral pairs, expression channels, finite metre constraints and native margin support admit the coupled declaration; each neutral collider is independently admitted by the original oriented-sheet query.
 * @evidence contracts/common.md#clear-and-simple-design One contact gate joins source registration, margin uniqueness and collider/soft ownership; performed closure, passage and correction stay with evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Native material courses may share only their original endpoint commissures, while legacy chains remain disjoint; missing articulation or queryable neutral support refuses and neutral admission certifies no expression mixture.
 * @evidence contracts/common.md#meaningful-documentation Prose gives coupled references, metre units, source-only admission timing and performed validity separation.
 * @evidence contracts/performance.md#efficient-algorithms Surface/channel maps support expected constant lookups; margin reads include exact correspondence, and one lower-identity map makes cross-course sharing checks expected O(M) rather than repeated scans. Collider construction still includes full native query admission/hierarchy cost although its query is discarded afterward.
 * @evidence contracts/performance.md#reuse-equivalent-work Shared source lookup maps serve all contact entries; margin points are read once, while neutral validation queries cannot replace later differently posed contact hierarchies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local source maps, margin records and temporary neutral queries release on return/refusal; borrowed basis data is unchanged and no completed collider cache or external task escapes.
 */
export function assertHumanFaceContact(basis: IAutoMovieHumanFaceBasis): void {
  const contact: IAutoMovieHumanFaceBasisContactImported | undefined = basis.contact;
  if (contact === undefined) return;
  if (basis.articulation === undefined)
    throw new Error(
      "Facial contact needs the mandibular articulation for its opening direction.",
    );
  const surfaces: Map<string, IAutoMovieHumanFaceBasisSurfaceImported> = new Map(
    basis.surfaces.map((surface: IAutoMovieHumanFaceBasisSurfaceImported): [string, IAutoMovieHumanFaceBasisSurfaceImported]  => [surface.id, surface]),
  );
  const channels: Map<string, "shape" | "expression"> = new Map(
    basis.channels.map((channel: IAutoMovieHumanFaceBasisChannelImported): [string, "shape" | "expression"]  => [channel.id, channel.kind]),
  );
  const pair: (name: string, entry: { surface: string; upper: number; lower: number; }) => void = (
    name: string,
    entry: { surface: string; upper: number; lower: number },
  ): void => {
    const surface: IAutoMovieHumanFaceBasisSurfaceImported | undefined = surfaces.get(entry.surface);
    const count: number = surface === undefined ? 0 : surface.positions.length / 3;
    if (
      surface === undefined ||
      [entry.upper, entry.lower].some(
        (vertex: number): boolean  => !Number.isInteger(vertex) || vertex < 0 || vertex >= count,
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
    const count: number =
      (surfaces.get(contact.lips.surface)?.positions.length ?? 0) / 3;
    const surface: IAutoMovieHumanFaceBasisSurfaceImported = surfaces.get(contact.lips.surface)!;
    const read: IHumanFaceLipMarginPointsImported = readHumanFaceLipMarginPoints(surface, contact.margin, surface.positions);
    const chains: IHumanFaceLipMarginPointImported[][] = [read.upper, read.lower];
    const all: IHumanFaceLipMarginPointImported[] = chains.flat();
    const keys: (string | number | null)[][] = chains.map((chain: IHumanFaceLipMarginPointImported[]): (string | number | null)[]  => chain.map((point: IHumanFaceLipMarginPointImported): string | number | null  =>
      contact.margin!.kind === "material" ? point.identity : point.nativeVertex));
    const repeated: boolean = keys.some((chain: (string | number | null)[]): boolean  => new Set(chain).size !== chain.length);
    const lowerOrdinals: Map<string | number | null, number> = new Map(keys[1].map((identity: string | number | null, at: number): [string | number | null, number] => [identity, at]));
    const shared: boolean = keys[0].some((identity: string | number | null, upperAt: number): boolean  => {
      const lowerAt: number | undefined = lowerOrdinals.get(identity);
      if (lowerAt === undefined) return false;
      // A native source course may name its one real commissure in both
      // corresponding endpoints; legacy vertex chains keep their old guard.
      return contact.margin!.kind !== "material" ||
        !((upperAt === 0 && lowerAt === 0) ||
          (upperAt === keys[0].length - 1 && lowerAt === keys[1].length - 1)) ||
        chains[0][upperAt].nativeVertex === null || chains[1][lowerAt].nativeVertex === null;
    });
    if (
      chains.some((chain: IHumanFaceLipMarginPointImported[]): boolean  => chain.length < 2) ||
      all.some((point: IHumanFaceLipMarginPointImported): boolean  => point.vertices.some((vertex: number): boolean  => !Number.isInteger(vertex) || vertex < 0 || vertex >= count)) ||
      repeated || shared
    )
      throw new Error(
        "Facial contact lip margin needs two chains of at least two distinct resident vertices of the lips surface.",
      );
  }
  pair("incisors", contact.incisors);
  const expression: (channel: string) => void = (channel: string): void => {
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
  const named: Set<string> = new Set<string>();
  for (const collider of contact.colliders) {
    const surface: IAutoMovieHumanFaceBasisSurfaceImported | undefined = surfaces.get(collider.surface);
    const count: number = surface === undefined ? 0 : surface.positions.length / 3;
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
        (vertex: number): boolean  => !Number.isInteger(vertex) || vertex < 0 || vertex >= count,
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
