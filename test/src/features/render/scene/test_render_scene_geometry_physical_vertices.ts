import type { IAutoMovieMeshPhysicalVertices } from "@automovie/interface";
import { AutoMovieGeometryPhysicalVertices } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import {
  BufferAttribute,
  BufferGeometry,
  InterleavedBuffer,
  InterleavedBufferAttribute,
} from "three";

import { throwsError } from "../../internal/predicates";

/** A generated geometry carrying two resident XYZ vertices. */
function geometry(): BufferGeometry {
  const result: BufferGeometry = new BufferGeometry();
  result.setAttribute(
    "position",
    new BufferAttribute(new Float32Array([0, 0, 0, 1, 2, 3]), 3),
  );
  return result;
}

/**
 * Render geometry owns copies of generated physical source incidence and reads
 * imported incidence in the accessor's component order.
 *
 * Scenarios:
 *
 * 1. A generated table copies both source rows and references at write and read
 *    time. Clearing it restores legacy absence.
 * 2. Interleaved imported records ignore the neighbouring attribute. Word pair (1,
 *    0) denotes source 0, pair (0, 0) denotes a legacy vertex.
 * 3. The imported storage refuses writes and an orphan accessor refuses reads.
 */
export function test_render_scene_geometry_physical_vertices(): void {
  const generated: BufferGeometry = geometry();
  const authored: IAutoMovieMeshPhysicalVertices = {
    sources: [{ domain: "opaque-source", id: 66991 }],
    vertices: [0, null],
  };
  const expected: IAutoMovieMeshPhysicalVertices = {
    sources: [{ domain: "opaque-source", id: 66991 }],
    vertices: [0, null],
  };
  AutoMovieGeometryPhysicalVertices.writeOwned(generated, authored);
  authored.sources[0]!.id = 1;
  authored.vertices[0] = null;
  const read: IAutoMovieMeshPhysicalVertices =
    AutoMovieGeometryPhysicalVertices.read(generated)!;
  TestValidator.equals("writing owns the supplied records", read, expected);
  read.sources[0]!.id = 2;
  read.vertices[1] = 0;
  TestValidator.equals(
    "reading owns the returned records",
    AutoMovieGeometryPhysicalVertices.read(generated),
    expected,
  );
  AutoMovieGeometryPhysicalVertices.writeOwned(generated, undefined);
  TestValidator.equals(
    "removed table stays absent",
    AutoMovieGeometryPhysicalVertices.read(generated),
    undefined,
  );

  const imported: BufferGeometry = geometry();
  const wire: InterleavedBufferAttribute = new InterleavedBufferAttribute(
    new InterleavedBuffer(new Uint16Array([723, 1, 0, 824, 0, 0]), 3),
    2,
    1,
  );
  imported.setAttribute("_automovie_physical_source", wire);
  TestValidator.predicate(
    "a missing wire source table refuses",
    throwsError(
      () => AutoMovieGeometryPhysicalVertices.read(imported),
      "Orphan physical source",
    ),
  );
  imported.userData.automoviePhysicalVertices = { sources: expected.sources };
  TestValidator.equals(
    "wire components follow the accessor stride",
    AutoMovieGeometryPhysicalVertices.read(imported),
    expected,
  );
  TestValidator.predicate(
    "owned update refuses imported storage",
    throwsError(
      () => AutoMovieGeometryPhysicalVertices.writeOwned(imported, expected),
      "metadata is readonly",
    ),
  );
  TestValidator.predicate(
    "unchanged imported accessor",
    imported.getAttribute("_automovie_physical_source") === wire,
  );
}
