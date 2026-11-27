import { AutoMovieEngineMath } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import type * as THREE from "three";

import { AutoMovieRenderThreeKind } from "./AutoMovieRenderThreeKind.js";

/**
 * Owned physical source correspondence on generated geometry, or readonly
 * source-pair decoding on an already-loaded static glTF geometry. Neither path
 * changes vertex attributes, opaque source IDs, nullable legacy incidence or
 * caller-owned imported records. Identity is not an anatomical certification.
 */
export class AutoMovieRenderGeometryPhysicalVertices {
  /**
   * Read an owned table, returning absence for an ordinary legacy geometry.
   * Present malformed/orphan wire data refuses instead of inferring identity.
   * glTF accessors may be interleaved: getters read the declared components,
   * whereas their backing array includes unrelated attributes and padding.
   */
  public static read(
    geometry: THREE.BufferGeometry,
  ): IAutoMovieMesh["physicalVertices"] {
    const raw: boolean =
      geometry.userData.automovieMeshPhysicalVertices !== undefined;
    const wire: boolean =
      geometry.userData.automoviePhysicalVertices !== undefined;
    const attribute: ReturnType<THREE.BufferGeometry["getAttribute"]> =
      geometry.getAttribute("_automovie_physical_source");
    if (!raw && !wire) {
      if (attribute !== undefined)
        throw new Error("Orphan physical source attribute.");
      return undefined;
    }
    if (raw && (wire || attribute !== undefined))
      throw new Error("Conflicting physical source namespaces.");
    let input: NonNullable<IAutoMovieMesh["physicalVertices"]> =
      geometry.userData.automovieMeshPhysicalVertices;
    if (wire) {
      const record: Pick<
        NonNullable<IAutoMovieMesh["physicalVertices"]>,
        "sources"
      > = geometry.userData.automoviePhysicalVertices;
      if (
        attribute === undefined ||
        attribute.itemSize !== 2 ||
        attribute.normalized ||
        !AutoMovieRenderThreeKind.isUint16Array(attribute.array)
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
    const result: NonNullable<IAutoMovieMesh["physicalVertices"]> =
      this.copy(input);
    this.validate(geometry, result);
    return result;
  }

  private static validate(
    geometry: THREE.BufferGeometry,
    result: NonNullable<IAutoMovieMesh["physicalVertices"]>,
  ): void {
    const position: ReturnType<THREE.BufferGeometry["getAttribute"]> =
      geometry.getAttribute("position");
    if (
      position === undefined ||
      position.itemSize !== 3 ||
      position.normalized ||
      !AutoMovieRenderThreeKind.isFloat32Array(position.array)
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
    AutoMovieEngineMath.resolveMeshPhysicalVertices({
      positions,
      physicalVertices: result,
    });
  }

  /**
   * Replace metadata on generated viewer-owned geometry after candidate
   * admission. Absence removes the prior table; explicit all-null remains.
   * Imported wire records refuse writes rather than changing caller state.
   * Validation belongs before the caller's atomic buffer publication.
   */
  public static writeOwned(
    geometry: THREE.BufferGeometry,
    metadata: IAutoMovieMesh["physicalVertices"],
  ): void {
    if (
      geometry.userData.automoviePhysicalVertices !== undefined ||
      geometry.getAttribute("_automovie_physical_source") !== undefined
    )
      throw new Error("Imported physical source metadata is readonly.");
    if (metadata === undefined)
      delete geometry.userData.automovieMeshPhysicalVertices;
    else {
      const result: NonNullable<IAutoMovieMesh["physicalVertices"]> =
        this.copy(metadata);
      this.validate(geometry, result);
      geometry.userData.automovieMeshPhysicalVertices = result;
    }
  }

  private static copy(
    input: NonNullable<IAutoMovieMesh["physicalVertices"]>,
  ): NonNullable<IAutoMovieMesh["physicalVertices"]> {
    const sources: NonNullable<IAutoMovieMesh["physicalVertices"]>["sources"] =
      input.sources.map(
        (
          source: NonNullable<
            IAutoMovieMesh["physicalVertices"]
          >["sources"][number],
        ): NonNullable<
          IAutoMovieMesh["physicalVertices"]
        >["sources"][number] => {
          if (source.id < 0)
            throw new Error("Physical sources need nonnegative IDs.");
          return { domain: source.domain, id: source.id };
        },
      );
    return { sources, vertices: input.vertices.slice() };
  }
}
