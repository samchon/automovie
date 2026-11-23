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
 * Operation-local validity proof for the exact faces read by scalar hull
 * queries.
 */
export class PhysicalHullScalarWitness {
  /** The actual original topology and reached face indices of this operation. */
  readonly #reached: Map<
    IAutoMovieHullReceipt,
    { hull: IAutoMovieHull; indices: Set<number> }
  > = new Map();

  /** A single failed admission invalidates the entire operation. */
  #unproved: boolean = false;

  /** Register the exact topology allocated by the original hull constructor. */
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

  /** Record one actual scalar normal read after the original access. */
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

  /** Whether a scalar hull query supplied any actual operand. */
  public touched(): boolean {
    return this.#unproved || this.#reached.size > 0;
  }
  /**
   * Check original topology and only the indices actually reached by the
   * search.
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
