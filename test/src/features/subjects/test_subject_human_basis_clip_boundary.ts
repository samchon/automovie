import { createHumanFaceBasisBuilder } from "@automovie/human";
import { clipHumanFaceBasisSurface } from "@automovie/human/face/basis/clipHumanFaceBasisSurface";
import { TestValidator } from "@nestia/e2e";

import { humanFaceBasisFixture } from "../internal/humanFaceBasisFixture";
import { throwsError } from "../internal/predicates";

/**
 * Clipping retains exact boundary identities and never invents a cap or a seat.
 * Scenarios:
 * 1. A wholly retained surface preserves its data and region-local triangle ordinals.
 * 2. A plane touching only an edge or corner emits no degenerate triangle.
 * 3. A discarded component loses its rigid group; clipped membership stays complete.
 * 4. Nonfinite planes and unrepresentable edge fractions refuse; recovery works.
 * 5. An admitted repeated-corner triangle that is discarded cannot retain an attachment mapping.
 * 6. Shared hair domains/closure refuse a new cut instead of retaining stale correspondence.
 */
export const test_subject_human_basis_clip_boundary = (): void => {
  for (const metadata of [{ hairDomains: [] }, { hairContactClosure: [] }])
    TestValidator.predicate(
      "hair metadata must follow clipping",
      throwsError(() =>
        clipHumanFaceBasisSurface(
          { ...humanFaceBasisFixture().basis.surfaces[0], ...metadata },
          0.5,
        ),
      ),
    );
  const source = humanFaceBasisFixture().basis.surfaces[0];
  const retained = clipHumanFaceBasisSurface(source, 0);
  TestValidator.equals("whole surface retained", retained.surface, source);
  for (const region of source.regions)
    TestValidator.equals(
      "region seat ordinal",
      retained.retainedTriangles.get(region.id)!.get(0),
      0,
    );
  TestValidator.equals(
    "touching edge has no area",
    clipHumanFaceBasisSurface(source, 1).surface.indices,
    [],
  );
  TestValidator.equals(
    "discarded surface",
    clipHumanFaceBasisSurface(source, 2).surface.positions,
    [],
  );
  const corner = {
    ...source,
    positions: [0, 1, 0, 1, 0, 0, 0, 0, 0],
    indices: [0, 1, 2],
    targets: {},
    regions: [
      { id: "corner", material: "skin", indices: [0, 1, 2], uvs: null },
    ],
  };
  TestValidator.equals(
    "intersection at low identity",
    clipHumanFaceBasisSurface(corner, 1).surface.indices,
    [],
  );
  source.positions.push(2, -2, 0, 3, -2, 0, 2, -1, 0);
  source.indices.push(4, 5, 6);
  source.regions.push({
    id: "below",
    material: "skin",
    indices: [4, 5, 6],
    uvs: null,
  });
  source.rigidGroups = [
    { id: "kept", vertices: [0, 1, 2, 3], motion: "fit" },
    { id: "removed", vertices: [4, 5, 6], motion: "fixed" },
  ];
  const result = clipHumanFaceBasisSurface(source, 0.5);
  TestValidator.equals("complete surviving group", result.surface.rigidGroups, [
    { id: "kept", vertices: [0, 1, 2, 3, 4], motion: "fit" },
  ]);
  TestValidator.equals(
    "discarded seats are absent",
    result.retainedTriangles.get("below")!.size,
    0,
  );
  for (const height of [NaN, Infinity, -Infinity])
    TestValidator.predicate(
      "invalid plane refuses",
      throwsError(() => clipHumanFaceBasisSurface(source, height)),
    );
  const tiny = {
    ...corner,
    positions: [0, Number.MIN_VALUE, 0, 1, 0, 0, 0, 0, 0],
  };
  TestValidator.predicate(
    "unrepresentable edge refuses",
    throwsError(() => clipHumanFaceBasisSurface(tiny, Number.MIN_VALUE)),
  );
  TestValidator.equals(
    "recovery",
    clipHumanFaceBasisSurface(corner, 1).surface.indices,
    [],
  );
  const degenerate = humanFaceBasisFixture();
  const repeated = degenerate.basis.surfaces[0];
  repeated.indices.splice(0, 3, 0, 0, 1);
  repeated.regions[0].indices = [0, 0, 1];
  createHumanFaceBasisBuilder(degenerate.basis)(degenerate.document);
  const clipped = clipHumanFaceBasisSurface(repeated, -1);
  TestValidator.equals(
    "repeated-corner triangle is actually discarded",
    clipped.surface.regions[0].indices,
    [],
  );
  TestValidator.equals(
    "discarded triangle has no surviving seat",
    clipped.retainedTriangles.get(repeated.regions[0].id)!.size,
    0,
  );
  TestValidator.equals(
    "other region's retained seat stays valid",
    clipped.retainedTriangles.get(repeated.regions[1].id)!.get(0),
    0,
  );
  repeated.regions = [
    { ...repeated.regions[0], indices: repeated.indices.slice(), uvs: null },
  ];
  const single = clipHumanFaceBasisSurface(repeated, -1);
  const seats = single.retainedTriangles.get(repeated.regions[0].id)!;
  TestValidator.equals(
    "discarded corner cannot alias a later triangle",
    seats.has(0),
    false,
  );
  TestValidator.equals(
    "surviving triangle shifts within the same region",
    seats.get(1),
    0,
  );
};
