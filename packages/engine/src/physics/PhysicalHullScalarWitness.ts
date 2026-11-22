import type {
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";

/** A topology query's ordinary, originally allocated hull record. */
type IAutoMovieHull = IAutoMoviePhysicalHullFaces.IHull;

/** The face selected by a scalar hull query and its original normal. */
interface IAutoMovieHullFaceReceipt {
  face: IAutoMoviePhysicalHullFaces.IFace;
  normal: IAutoMovieVector3;
}

/** The known ordinary objects reached from the original topology. */
interface IAutoMovieHullReceipt {
  faces: IAutoMovieHull["faces"];
  entries: readonly IAutoMovieHullFaceReceipt[];
}

/** Known topology nodes, registered by the topology allocator before returning. */
const TOPOLOGY: WeakMap<IAutoMovieHull, IAutoMovieHullReceipt> = new WeakMap();

/**
 * Operation-local validity proof for the exact faces read by scalar hull queries.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the reached topology and private packed geometry whose continued use it tests.
 * @evidence contracts/development/design.md#principled-representation Retains authority and reached indices, with no persistent distance memo.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The actual topology and scalar query owners issue and consult the proof.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown hulls and borrowed typed backing decline. Current face getters and topology replacements keep ordinary reads.
 */
export class PhysicalHullScalarWitness {
  /** The actual original topology and reached face indices of this operation. */
  readonly #reached: Map<
    IAutoMovieHullReceipt,
    { hull: IAutoMovieHull; indices: Set<number> }
  > = new Map();

  /** A single failed admission invalidates the entire operation. */
  #unproved: boolean = false;

  /**
   * Register the exact topology allocated by the original hull constructor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Records actual native face and normal identities.
   * @evidence contracts/development/implementation.md#principled-implementation Only the allocator calls this after its known native array map.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Store one array identity and its face records.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No fields are frozen or replaced.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in faces once per native hull.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Warm scalar queries share original topology authority.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Weak keys follow existing hull lifetime.
   */
  public static topology(
    hull: IAutoMovieHull,
    faces: IAutoMovieHull["faces"],
  ): void {
    const entries: IAutoMovieHullFaceReceipt[] = [];
    for (let index: number = 0; index < faces.length; ++index) {
      const face: IAutoMoviePhysicalHullFaces.IFace = faces[index]!;
      entries.push({ face, normal: face.normal });
    }
    TOPOLOGY.set(hull, { faces, entries });
  }

  /**
   * Record one actual scalar normal read after the original access.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the actual hull, extent, reached index and normal.
   * @evidence contracts/development/implementation.md#principled-implementation Checks the actual normal against the topology receipt and the numeric owner's nonescaping backing proof.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A per-hull set retains each reached index once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foreign topology or flat backing invalidates the witness before use.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per normal read with amortized set insertion.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Repeated visits keep only the same reached index.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources State belongs to the requesting numerical operation.
   */
  public read(
    hull: IAutoMovieHull,
    flatOwned: boolean,
    count: number,
    index: number,
    normal: IAutoMovieVector3,
  ): void {
    if (this.#unproved) return;
    const owner: IAutoMovieHullReceipt | undefined = TOPOLOGY.get(hull);
    if (
      !flatOwned ||
      owner === undefined ||
      owner.entries.length !== count ||
      owner.entries[index]?.normal !== normal
    ) {
      this.#unproved = true;
      return;
    }
    let entry: { hull: IAutoMovieHull; indices: Set<number> } | undefined =
      this.#reached.get(owner);
    if (entry === undefined) {
      entry = { hull, indices: new Set() };
      this.#reached.set(owner, entry);
    }
    entry.indices.add(index);
  }

  /**
   * Whether a scalar hull query supplied any actual operand.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes a reached hull from an untouched witness.
   * @evidence contracts/development/implementation.md#principled-implementation A failed admission or a nonempty reached set both establish observation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the same two state variables owned by read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not prepare or query untouched geometry.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work No observation state can be mistaken for known geometry.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  public touched(): boolean {
    return this.#unproved || this.#reached.size > 0;
  }
  /**
   * Check original topology and only the indices actually reached by the search.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the currently verified identities and the disposition of an unproved read.
   * @evidence contracts/development/implementation.md#principled-implementation Follow each known record only after validating the own field that led to it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One descriptor comparison per edge on the reached path.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not inspect or invoke getters on replacement arrays, faces or normals.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the number of reached faces, independent of numerical probes.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Stable reach returns the same pure scalar input as the original trial.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The check retains nothing.
   */
  public current(): boolean {
    if (this.#unproved) return false;
    for (const [owner, { hull, indices }] of this.#reached) {
      if (
        own(hull, "faces") !== owner.faces ||
        own(owner.faces, "length") !== owner.entries.length
      )
        return false;
      for (const index of indices) {
        const entry: IAutoMovieHullFaceReceipt = owner.entries[index]!;
        if (
          own(owner.faces, index) !== entry.face ||
          own(entry.face, "normal") !== entry.normal
        )
          return false;
      }
    }
    return true;
  }
}

/** Compare own values without invoking unknown accessor behavior. */
function own(owner: object, key: PropertyKey): unknown {
  const descriptor: PropertyDescriptor | undefined =
    Object.getOwnPropertyDescriptor(owner, key);
  return descriptor !== undefined && Object.hasOwn(descriptor, "value")
    ? descriptor.value
    : undefined;
}
