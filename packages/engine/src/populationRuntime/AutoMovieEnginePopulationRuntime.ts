import { materializeCompiledFormation as materializeCompiledFormationImplementation } from "./internal/materializeCompiledFormation";

import { instanceAddress as instanceAddressImplementation } from "./internal/instanceAddress";
import { instanceAddressSlot as instanceAddressSlotImplementation } from "./internal/instanceAddressSlot";
import { createSourceOracle as createSourceOracleImplementation } from "./internal/createSourceOracle";
import { compiledPopulationRepresentation as compiledPopulationRepresentationImplementation } from "./internal/compiledPopulationRepresentation";
import { instancePrototypeChoices as instancePrototypeChoicesImplementation } from "./internal/instancePrototypeChoices";

import { type IAutoMovieFormationSlot, type IAutoMovieCompiledFormation, type IAutoMovieModel, type IAutoMovieCreateCompiledSlotSummary, type IAutoMovieInstanceSlot, type IAutoMovieInstanceSetPlacement, type IAutoMovieMaterializeCompiledFormationInventory, type IAutoMovieCompiledInstanceSet, type IAutoMovieMaterializeCompiledInstanceSet, type IAutoMovieMaterializeCompiledInstanceSetInventory, type IAutoMovieCompiledInstancePrototype, type IAutoMovieSelectInstancePrototype, type IAutoMovieSummarizeCompiledSlotChunks, type IAutoMovieVector3, type IAutoMoviePlacementSummary, type IAutoMovieSourceOracle, type IAutoMovieCreateSourceOracle, type IAutoMovieCompiledPopulationRepresentation, type IAutoMovieInstancePrototypeChoices, type IAutoMovieMaterializeCompiledFormation } from "@automovie/interface";
import { compiledFormationSlot as compiledFormationSlotImplementation } from "./internal/compiledFormationSlot";
import { compiledLodModelDigest as compiledLodModelDigestImplementation } from "./internal/compiledLodModelDigest";
import { createCompiledSlotSummary as createCompiledSlotSummaryImplementation } from "./internal/createCompiledSlotSummary";
import { instanceSlot as instanceSlotImplementation } from "./internal/instanceSlot";
import { materializeCompiledFormationInventory as materializeCompiledFormationInventoryImplementation } from "./internal/materializeCompiledFormationInventory";
import { materializeCompiledInstanceSet as materializeCompiledInstanceSetImplementation } from "./internal/materializeCompiledInstanceSet";
import { materializeCompiledInstanceSetInventory as materializeCompiledInstanceSetInventoryImplementation } from "./internal/materializeCompiledInstanceSetInventory";
import { selectInstancePrototype as selectInstancePrototypeImplementation } from "./internal/selectInstancePrototype";
import { summarizeCompiledSlotChunks as summarizeCompiledSlotChunksImplementation } from "./internal/summarizeCompiledSlotChunks";
import { summarizeCompiledSlotRange as summarizeCompiledSlotRangeImplementation } from "./internal/summarizeCompiledSlotRange";

/** Public operations for Auto Movie Engine Population Runtime. */
export namespace AutoMovieEnginePopulationRuntime {
  /**
   * Regenerate one exact member of a compiled formation in constant memory.
   *
   * The compiled record is what a viewer draws and what a shot source is handed,
   * so a member is regenerated from it rather than from the design beside it. It
   * carries the terrain snapshot the builder placed the unit on, which a design
   * record does not: a member asked of the design stands at its anchor's height,
   * and the same member drawn from the compiled record stands on the rise under
   * it. The only thing the record spells differently from a design is a hero,
   * which is a promoted slot rather than an override.
   *
   * The identity law is not restated here. This and {@link formationSlot} for a
   * grounded design both hand the slot's actor and position to
   * {@link formationSlotRecord}, which names the hero actor or the slot-derived
   * node and carries the base model, the designed heading and the seeded motion
   * phase. A test pins the two answers equal for every slot of a compiled
   * formation.
   */
  export function compiledFormationSlot(formation: IAutoMovieCompiledFormation, slot: number): IAutoMovieFormationSlot {
    return compiledFormationSlotImplementation(formation, slot);
  }

  /**
   * Content digest for one LOD tier's model group reference.
   *
   * An absent group hashes a marker naming the missing reference. A group that
   * cannot be canonically encoded hashes a distinct marker naming the unencodable
   * reference, rather than letting the encoding refusal discard the complete
   * compiled population. Neither marker certifies model content or validity;
   * callers own admission of their model inventory.
   *
   * The digest is the SHA-256 of canonical JSON v2 computed without a Node
   * built-in, equal to the Node builder's digest of the same canonical bytes.
   * Shared by the compiled formation and instance-set kernels; package-private.
   */
  export function compiledLodModelDigest(models: ReadonlyMap<string, IAutoMovieModel>, id: string): string {
    return compiledLodModelDigestImplementation(models, id);
  }

  /** Create a call-owned bounds and running-mean fold for ascending slot points. */
  export function createCompiledSlotSummary(): IAutoMovieCreateCompiledSlotSummary.IResult {
    return createCompiledSlotSummaryImplementation();
  }

  /**
   * Regenerate one member from the compact instance set's deterministic laws.
   *
   * A grid, lattice, scatter or explicit member is laid out in the set's local
   * frame and turned by the set's heading about its anchor. A route member takes
   * its ground-plan point from the route snapshot, spaced by arc length and
   * pushed sideways by its seeded jitter, and stands at the anchor's height. A
   * scatter disk with a ground rule reads the placed world's height at each slot
   * and adds the authored anchor Y offset. Scale, palette, traits, prototype,
   * rotation and visibility are drawn from the set seed and the slot, each under
   * its own salt, and an explicit block overrides what it states. A set that
   * declares no prototype table, no lattice or explicit layout, no per-axis
   * scale, no rotation range and no visibility probability keeps its original
   * output, which names no prototype.
   *
   * The compiled instance-set kernel measures chunk bounds through this function,
   * the shot-source oracle answers `instanceSlot` through it, and a subject
   * description and the viewer regenerate members through it, so a member asked
   * for while a shot compiles, described in a review, or drawn is the member the
   * compiled set regenerates. The input is the compiled shape for that reason:
   * reading a compiled set as a design once counted its default prototype twice.
   *
   * It throws for a slot outside the set, a missing or mismatched route snapshot,
   * a route without finite positive length, an explicit block missing the slot,
   * an explicit prototype no choice names, or a slot without a palette colour.
   * Compilation regenerates every slot through here. Consumers preserving the
   * compiled laws and route snapshot reproduce that admitted state. Route
   * placement uses temporary storage proportional to waypoint count.
   */
  export function instanceSlot(instanceSet: IAutoMovieInstanceSetPlacement, slot: number): IAutoMovieInstanceSlot {
    return instanceSlotImplementation(instanceSet, slot);
  }

  /**
   * Compile every formation of a production into its compact runtime record.
   *
   * Records are keyed by formation id and inserted in code-unit order of that id,
   * so the inventory and every artifact that serializes it are the same whatever
   * order the designs were read in. Each formation is compiled against the same
   * model groups, radii and terrain, which is what makes a unit compiled here the
   * unit a shot compiled from the same inputs would hold.
   */
  export function materializeCompiledFormationInventory(props: IAutoMovieMaterializeCompiledFormationInventory.IProps): Readonly<Record<string, IAutoMovieCompiledFormation>> {
    return materializeCompiledFormationInventoryImplementation(props);
  }

  /**
   * Compile one world instance set into its compact runtime without expanding it.
   *
   * The record keeps the placement and variation laws, the route snapshot a route
   * layout follows, one bounds and centroid per chunk of
   * {@link AutoMovieEngineInstanceChunkSize} slots, the representation tiers and
   * measured or fallback radius of the base model group and every declared
   * prototype, and a digest of every other field. A declared prototype table is
   * compiled with the base group's default first, which is the choice list every
   * member is regenerated against afterwards.
   *
   * Bounds are measured by regenerating each slot through {@link instanceSlot}, so
   * a member whose seeded variation is non-finite, or whose route is missing or
   * has no length, refuses compilation instead of producing a set no consumer can
   * regenerate. Member radii are supplied host estimates that this kernel does
   * not verify against geometry; missing estimates use the base then 0.5m. The
   * digest is SHA-256 over canonical JSON v2 computed without a Node built-in,
   * equal to the Node builder's digest of the same canonical bytes.
   */
  export function materializeCompiledInstanceSet(props: IAutoMovieMaterializeCompiledInstanceSet.IProps): IAutoMovieCompiledInstanceSet {
    return materializeCompiledInstanceSetImplementation(props);
  }

  /**
   * Compile every instance set a world declares into its compact runtime record.
   *
   * Records are keyed by set id and inserted in code-unit order of that id, so
   * the inventory is the same whatever order the world lists its sets in. A world
   * that declares no instance sets compiles to an empty inventory.
   */
  export function materializeCompiledInstanceSetInventory(props: IAutoMovieMaterializeCompiledInstanceSetInventory.IProps): Readonly<Record<string, IAutoMovieCompiledInstanceSet>> {
    return materializeCompiledInstanceSetInventoryImplementation(props);
  }

  /**
   * The prototype one instance slot draws, or the explicit one it names.
   *
   * A set with a prototype table draws from it, and a compiled table already
   * starts with the base model's default, counted once. A set without a table
   * draws its base model under the id `default`. An explicit member names its
   * choice outright, and naming one the table lacks refuses. Otherwise the slot's
   * seeded sample, drawn under the prototype salt, is spent across the weights in
   * table order: every choice but the last is tested, and the last is what
   * remains, which is both the weighted answer and the answer when a float
   * residue leaves the sample a hair above the final weight.
   *
   * The instance member regenerator and the structural subject diff both draw
   * through here, so a diff counts a prototype change exactly where a regenerated
   * member changes prototype. The choice returned is the table's own entry, so a
   * caller holding a compiled table reads that entry's tiers. An explicitly empty
   * table throws; only an absent table creates the default.
   */
  export function selectInstancePrototype<Choice extends Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "model" | "weight"
  >>(instanceSet: IAutoMovieSelectInstancePrototype.IInstanceSet<Choice>, slot: number, explicit: string | undefined): | Choice
  | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight"> {
    return selectInstancePrototypeImplementation<Choice>(instanceSet, slot, explicit);
  }

  /** Fold each generated slot once into both its chunk and the population summary. */
  export function summarizeCompiledSlotChunks(count: number, chunkSize: number, position: (slot: number) => IAutoMovieVector3): IAutoMovieSummarizeCompiledSlotChunks.IResult {
    return summarizeCompiledSlotChunksImplementation(count, chunkSize, position);
  }

  /**
   * Exact bounds and running-mean centroid of one contiguous slot range.
   *
   * Shared by the compiled formation and compiled instance-set kernels, because a
   * chunk summary is one measurement whichever population supplies the points:
   * both visit slots in ascending order and fold the centroid with the same
   * running mean, so their bounds and centroids are the same arithmetic rather
   * than two copies that could drift in the last bit. The fold is the one the
   * builder has always compiled with, so the summaries, and the digests over
   * them, are unchanged by the kernels moving here.
   *
   * Package-private: the engine root does not export it.
   */
  export function summarizeCompiledSlotRange(start: number, count: number, position: (slot: number) => IAutoMovieVector3): IAutoMoviePlacementSummary {
    return summarizeCompiledSlotRangeImplementation(start, count, position);
  }

  /**
   * The stable address of one compact instance-set member.
   *
   * An explicit layout member is `instance:<set>:<explicit id>`, the id its
   * author wrote; every other member is `instance:<set>:slot:<slot>` with the
   * slot zero-padded to six digits, so slot order and address order agree up to a
   * million members. The slot is not range-checked here; an explicit layout with
   * no transform for the slot falls back to the slot form.
   *
   * @param set Compiled set the member belongs to.
   * @param slot Zero-based member slot.
   * @returns The member's address.
   */
  export function autoMovieInstanceAddress(set: IAutoMovieCompiledInstanceSet, slot: number): string {
    return instanceAddressImplementation(set, slot);
  }

  /**
   * The slot one compact-member address names in a set, or null when it names no
   * member of that set.
   *
   * The inverse of `instanceAddress` for members inside the set: an
   * explicit layout matches its transforms' ids, any other layout parses exactly
   * six digits after `instance:<set>:slot:`. A slot at or past `set.count` is
   * null, so an address left over from a larger revision does not resolve.
   *
   * @param set Compiled set to search.
   * @param address Address to resolve.
   * @returns The zero-based slot, or null.
   */
  export function autoMovieInstanceAddressSlot(set: IAutoMovieCompiledInstanceSet, address: string): number | null {
    return instanceAddressSlotImplementation(set, address);
  }

  /**
   * Build the deterministic helpers a shot source reads through its build
   * context.
   *
   * A shot source asks where one member of a formation or instance set stands
   * while the builder is still compiling the shot, so the answer has to be the
   * one the compiled runtime holds. Both slot helpers regenerate from the
   * compiled records the source's context carries, never from the designs beside
   * them: a formation member stands on the terrain snapshot its unit was compiled
   * against, and an instance member selects from the compiled prototype table,
   * which already counts the default once. Distance is Euclidean in metres, and
   * ground height is the first world surface under the point or zero over none.
   *
   * An id with no compiled record refuses with a `RangeError` naming it,
   * including an id that only an inherited object property would otherwise
   * answer.
   *
   * The oracle keeps references to the three props, not copies, so it answers
   * from whatever those records hold when each method is called. Slot indices are
   * passed through to the slot regenerators, which own their range checks.
   *
   * @param props.world World whose surfaces answer ground height.
   * @param props.formationRuntime Compiled formations by id.
   * @param props.instanceSetRuntime Compiled instance sets by id.
   * @returns The oracle a shot source's build context exposes.
   */
  export function createAutoMovieSourceOracle(props: IAutoMovieCreateSourceOracle.IProps): IAutoMovieSourceOracle {
    return createSourceOracleImplementation(props);
  }

  /**
   * The compiled tiers and measured or fallback radius of one population
   * prototype.
   *
   * A formation's anonymous members and each prototype of an instance set are
   * drawn the same way: through the tiers the population design declares, or
   * through one `near` tier of the base model group when it declares none, each
   * bound to its model group digest and runtime model id. The member radius is
   * the largest radius over those tiers, where a tier whose group has no known
   * radius borrows the base group's, and one with neither is half a metre; no
   * member is ever smaller than a centimetre for projection. The kernel does not
   * verify supplied estimates against geometry; the fallback is an estimate for
   * missing geometry, and any enclosure proof belongs to the host.
   *
   * Radii are supplied by the host, which measures its own model groups and
   * adopted proxies, so this reads a table and never inspects geometry.
   *
   * The caller chooses which declared tiers apply: a formation's anonymous batch
   * drops the `hero` tier, which is drawn by named nodes, while an instance set
   * has no heroes and keeps every tier. Shared by both kernels; package-private.
   */
  export function compiledPopulationRepresentation(props: IAutoMovieCompiledPopulationRepresentation.IProps): IAutoMovieCompiledPopulationRepresentation.IResult {
    return compiledPopulationRepresentationImplementation(props);
  }

  /**
   * The prototype table one instance set draws its members from.
   *
   * A set with a prototype table draws from that table, which in a compiled set
   * already starts with the base model's default, counted once. A set without a
   * table draws only its base model, as one choice with the id `default` and
   * weight 1. The returned array is the set's own table when it has one, so the
   * caller must not mutate it.
   *
   * @param instanceSet Set whose table is read.
   * @returns The choices in table order.
   */
  export function instancePrototypeChoices<Choice extends Pick<
    IAutoMovieCompiledInstancePrototype,
    "id" | "model" | "weight"
  >>(instanceSet: IAutoMovieInstancePrototypeChoices.IInstanceSet<Choice>): readonly (
  | Choice
  | Pick<IAutoMovieCompiledInstancePrototype, "id" | "model" | "weight">
)[] {
    return instancePrototypeChoicesImplementation<Choice>(instanceSet);
  }

  /**
   * Compile one formation design into its compact, regenerable runtime record.
   *
   * The record stores what regenerates the members rather than the members: the
   * layout, anchor, heading and seed, one bounds and centroid per chunk of
   * {@link AutoMovieEngineFormationChunkSize} slots with that chunk's anonymous count
   * once heroes are excluded, each hero's promoted base transform, the anonymous
   * representation tiers the design declares, a measured or fallback member
   * radius, a domain-separated motion phase seed, and a digest of every other
   * field.
   *
   * The terrain it snapshots is the part of the world that can be under a member:
   * the surfaces whose ground-plan extent reaches the footprint measured on level
   * ground, in declared order. Relief moves members up and down, never sideways,
   * so that footprint holds on any terrain, and a unit with nothing under it
   * reuses the level pass as its finished summary.
   *
   * Supplied member radius estimates come from the host as a table. The host owns
   * model geometry and any enclosure proof; this kernel does not verify estimates
   * against geometry. Missing tier estimates borrow the base estimate, then 0.5m.
   * The digest is SHA-256 over canonical JSON v2 computed without a Node
   * built-in, equal to the Node builder's digest of the same canonical bytes.
   */
  export function materializeCompiledFormation(props: IAutoMovieMaterializeCompiledFormation.IProps): IAutoMovieCompiledFormation {
    return materializeCompiledFormationImplementation(props);
  }
}
