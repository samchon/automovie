import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Owned physical source correspondence on generated geometry, or readonly
 * source-pair decoding on an already-loaded static glTF geometry. Neither path
 * changes vertex attributes, opaque source IDs, nullable legacy incidence or
 * caller-owned imported records. Identity is not an anatomical certification.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Keeps source correspondence inspectable on generated and imported runtime geometry without transferring its ownership.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Copies viewer-owned metadata and leaves imported caller state unchanged.
 * @author Samchon
 */
export class AutoMovieGeometryPhysicalVertices {
  /**
   * Read an owned table, returning absence for an ordinary legacy geometry.
   * Present malformed/orphan wire data refuses instead of inferring identity.
   * glTF accessors may be interleaved: getters read the declared components,
   * whereas their backing array includes unrelated attributes and padding.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Makes declared source-pair/null ownership inspectable on generated and imported geometry.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Reads actual resident components and returns owned data without changing caller geometry.
   */
  public static read(
    geometry: THREE.BufferGeometry,
  ): IAutoMovieMesh["physicalVertices"] {
    const raw = Object.hasOwn(
      geometry.userData,
      "automovieMeshPhysicalVertices",
    );
    const wire = Object.hasOwn(geometry.userData, "automoviePhysicalVertices");
    const attribute = geometry.getAttribute("_automovie_physical_source");
    if (!raw && !wire) {
      if (attribute !== undefined)
        throw new Error("Orphan physical source attribute.");
      return undefined;
    }
    if (raw && (wire || attribute !== undefined))
      throw new Error("Conflicting physical source namespaces.");
    let input: unknown = geometry.userData.automovieMeshPhysicalVertices;
    if (wire) {
      const record: unknown = geometry.userData.automoviePhysicalVertices;
      if (
        record === null ||
        typeof record !== "object" ||
        Object.keys(record)
          .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
          .join(",") !== "attribute,sources,version" ||
        !("version" in record) ||
        record.version !== 1 ||
        !("attribute" in record) ||
        record.attribute !== "_AUTOMOVIE_PHYSICAL_SOURCE" ||
        !("sources" in record) ||
        attribute === undefined ||
        attribute.itemSize !== 2 ||
        attribute.normalized ||
        !(attribute.array instanceof Uint16Array)
      )
        throw new Error("Malformed physical source wire namespace.");
      const vertices: (number | null)[] = [];
      for (let vertex = 0; vertex < attribute.count; ++vertex) {
        const reference =
          attribute.getX(vertex) + 65536 * attribute.getY(vertex);
        vertices.push(reference === 0 ? null : reference - 1);
      }
      input = { sources: record.sources, vertices };
    }
    const result = this.copy(input);
    this.validate(geometry, result);
    return result;
  }

  private static validate(
    geometry: THREE.BufferGeometry,
    result: NonNullable<IAutoMovieMesh["physicalVertices"]>,
  ): void {
    const position = geometry.getAttribute("position");
    if (
      position === undefined ||
      position.itemSize !== 3 ||
      position.normalized ||
      !(position.array instanceof Float32Array)
    )
      throw new Error(
        "Physical source correspondence needs resident Float32 XYZ.",
      );
    const positions: number[] = [];
    for (let vertex = 0; vertex < position.count; ++vertex)
      positions.push(
        position.getX(vertex),
        position.getY(vertex),
        position.getZ(vertex),
      );
    resolveAutoMovieMeshPhysicalVertices({
      positions,
      physicalVertices: result,
    });
  }

  /**
   * Replace metadata on generated viewer-owned geometry after candidate
   * admission. Absence removes the prior table; explicit all-null remains.
   * Imported wire records refuse writes rather than changing caller state.
   * Validation belongs before the caller's atomic buffer publication.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Stores owned correspondence on the runtime geometry without borrowing mutable producer arrays.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Replaces or removes only viewer-owned metadata while protecting imported wire state.
   */
  public static writeOwned(
    geometry: THREE.BufferGeometry,
    metadata: IAutoMovieMesh["physicalVertices"],
  ): void {
    if (
      Object.hasOwn(geometry.userData, "automoviePhysicalVertices") ||
      geometry.getAttribute("_automovie_physical_source") !== undefined
    )
      throw new Error("Imported physical source metadata is readonly.");
    if (metadata === undefined)
      delete geometry.userData.automovieMeshPhysicalVertices;
    else {
      const result = this.copy(metadata);
      this.validate(geometry, result);
      geometry.userData.automovieMeshPhysicalVertices = result;
    }
  }

  private static copy(
    input: unknown,
  ): NonNullable<IAutoMovieMesh["physicalVertices"]> {
    if (
      input === null ||
      typeof input !== "object" ||
      !("sources" in input) ||
      !Array.isArray(input.sources) ||
      !("vertices" in input) ||
      !Array.isArray(input.vertices)
    )
      throw new Error(
        "Physical source correspondence needs source and vertex arrays.",
      );
    const sources = input.sources.map((source: unknown) => {
      if (
        source === null ||
        typeof source !== "object" ||
        !("domain" in source) ||
        typeof source.domain !== "string" ||
        source.domain.trim().length === 0 ||
        !("id" in source) ||
        typeof source.id !== "number" ||
        !Number.isSafeInteger(source.id) ||
        source.id < 0
      )
        throw new Error(
          "Physical sources need nonblank domains and safe nonnegative IDs.",
        );
      return { domain: source.domain, id: source.id };
    });
    return { sources, vertices: input.vertices.slice() as (number | null)[] };
  }
}
