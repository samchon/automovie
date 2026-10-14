import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import type * as THREE from "three";

/**
 * Owned physical source correspondence on generated geometry, or readonly
 * source-pair decoding on an already-loaded static glTF geometry. Neither path
 * changes vertex attributes, opaque source IDs, nullable legacy incidence or
 * caller-owned imported records. Identity is not an anatomical certification.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Generated records are copied and admitted by resolveAutoMovieMeshPhysicalVertices; static glTF pairs decode unsigned low/high words into one-based source references, reserving zero for null and reading interleaved accessors component by component.
 * @evidence contracts/common.md#clear-and-simple-design Read and owned-write paths share copying and engine validation; imported wire namespaces stay readonly while generated metadata is published only after admission succeeds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing legacy metadata remains absent; orphan attributes, conflicting namespaces and malformed correspondence refuse instead of inventing source identities or rewriting caller-owned imports.
 * @evidence contracts/common.md#meaningful-documentation Explains legacy absence, readonly imports, nullable incidence, non-anatomical identity and validation before atomic generated-buffer publication; writeOwned states that undefined removes the prior record.
 * @evidence contracts/performance.md#efficient-algorithms Reading or writing copies source and vertex tables and extracts XYZ once for engine admission, using space linear in vertices plus sources; interleaved accessor reads avoid including unrelated backing-array entries.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Geometry metadata is mutable caller state, so each observation validates its current attributes instead of sharing a stale correspondence result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Read returns caller-owned copies and retains no geometry; owned writes retain one admitted table in geometry.userData until replacement, removal or geometry-owner release, without acquiring GPU buffers.
 */
export class AutoMovieGeometryPhysicalVertices {
  /**
   * Read an owned table, returning absence for an ordinary legacy geometry.
   * Present malformed/orphan wire data refuses instead of inferring identity.
   * glTF accessors may be interleaved: getters read the declared components,
   * whereas their backing array includes unrelated attributes and padding.
   *
   * @evidence contracts/common.md#principled-implementation Distinguishes generated and glTF wire namespaces, decodes Uint16 pairs with zero as null and validates copied correspondence against Float32 XYZ through the engine; malformed or conflicting inputs refuse.
   * @evidence contracts/common.md#clear-and-simple-design Both namespace paths converge on copy and validate, keeping representation decoding in the viewer and physical correspondence admission in the engine.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Legacy absence returns undefined; an orphan source attribute cannot create inferred anatomical identity or bypass wire validation.
   * @evidence contracts/common.md#meaningful-documentation States absence and refusal behavior and why interleaved attributes must be read through accessors.
   * @evidence contracts/performance.md#efficient-algorithms Source copying and vertex/XYZ extraction are linear in source and vertex counts, with temporary arrays of the same order before engine admission.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Buffer attributes and userData can change independently, so each read admits the current pair rather than reusing an earlier validation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returns an independent correspondence record and retains no geometry, accessor or temporary XYZ array.
   */
  public static read(
    geometry: THREE.BufferGeometry,
  ): IAutoMovieMesh["physicalVertices"] {
    const raw: boolean = Object.hasOwn(
      geometry.userData,
      "automovieMeshPhysicalVertices",
    );
    const wire: boolean = Object.hasOwn(geometry.userData, "automoviePhysicalVertices");
    const attribute: ReturnType<THREE.BufferGeometry["getAttribute"]> = geometry.getAttribute("_automovie_physical_source");
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
          .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
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
      for (let vertex: number = 0; vertex < attribute.count; ++vertex) {
        const reference: number =
          attribute.getX(vertex) + 65536 * attribute.getY(vertex);
        vertices.push(reference === 0 ? null : reference - 1);
      }
      input = { sources: record.sources, vertices };
    }
    const result: NonNullable<IAutoMovieMesh["physicalVertices"]> = this.copy(input);
    this.validate(geometry, result);
    return result;
  }

  private static validate(
    geometry: THREE.BufferGeometry,
    result: NonNullable<IAutoMovieMesh["physicalVertices"]>,
  ): void {
    const position: ReturnType<THREE.BufferGeometry["getAttribute"]> = geometry.getAttribute("position");
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
    for (let vertex: number = 0; vertex < position.count; ++vertex)
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
   * @evidence contracts/common.md#principled-implementation Refuses imported wire metadata, removes generated metadata for undefined and otherwise copies and validates the candidate before replacing geometry.userData, preserving the previous record on admission failure.
   * @evidence contracts/common.md#clear-and-simple-design This operation owns generated metadata publication while geometry-buffer updates remain with buildGeometry or the human buffer owner.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Explicit all-null correspondence remains explicit; imported records are never rewritten to make a generated candidate appear admissible.
   * @evidence contracts/common.md#meaningful-documentation Documents replacement, removal, readonly imported state and the caller's requirement to validate before atomic buffer publication.
   * @evidence contracts/performance.md#efficient-algorithms Undefined removal is constant time; present metadata copies sources and vertices and extracts XYZ once for linear-size engine validation.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each candidate is a publication request over current attributes; sharing a prior admitted record would lose ownership isolation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Geometry retains only the newly admitted copied table; replacement or deletion releases its previous reference and no GPU allocation is acquired here.
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
      const result: NonNullable<IAutoMovieMesh["physicalVertices"]> = this.copy(metadata);
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
    const sources: NonNullable<IAutoMovieMesh["physicalVertices"]>["sources"] = input.sources.map((source: unknown): NonNullable<IAutoMovieMesh["physicalVertices"]>["sources"][number] => {
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
