import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieCurve64 as C } from "../../../../packages/engine/src/geometry/curve/IAutoMovieCurve64";
import { transportAutoMovieRecoveryObservationChart as transport } from "@automovie/recovery";
import { nclose } from "../internal/nclose";

/**
 * Ordered source identities preserve an incoming geometric chart without invented matches.
 *
 * Scenarios:
 * 1. Reversed and rotated observations retain incoming uniform or nonuniform phases and feature requests; an absent incoming phase seeds physical PL arc fractions.
 * 2. Three persistent anchors insert one exact PL-edge seam while preserving every raw point.
 * 3. Missing, duplicated or conflicting identities retain a refusal instead of nearest matching.
 * 4. Nonincreasing phases, collapsed edges and malformed coordinates remain explicit failures.
 *
 * @evidence contracts/testing.md#behavioral-verification Executes maintained observation transport and checks actual phases, point provenance, direction, feature indices, virtual seam and refusal diagnostics. Zero-anchor or contradictory input cannot acquire a fabricated phase map.
 * @evidence contracts/testing.md#independent-expectations Four equal-length square sides have quarter phases. Reversing the input order changes traversal sign but not the named chart. Between anchors D at.75 and B at1.25, the path D→E→B has lengths sqrt20 and6; its phase-zero crossing is x=1-sqrt5 on E→B. These geometric lengths determine the seam independently of the implementation.
 * @evidence contracts/testing.md#distinguishing-cases Covers all anchors, a missing seam anchor with three retained anchors, a virtual interior request, both source identity and geometric-point preservation, duplicated IDs, conflicting cyclic order, zero anchors, bad phases, zero edges, invalid feature indices and nonfinite coordinates. Source material correspondence, longitudinal guides, fitting and embedding remain unqualified.
 * @evidence contracts/testing.md#execution-ownership Portable generic PL rows exercise one pure numerical function in process. No asset, source mesh, anatomical fixture, fitter, filesystem, host process, viewer or GPU is used.
 */
export function test_geometry_recovery_observation_transport(): void {
  const closeVector: (
    a: C.Vector,
    b: C.Vector,
    tolerance: number,
  ) => boolean = (a: C.Vector, b: C.Vector, tolerance: number): boolean =>
    a.every((value: number, i: number): boolean =>
      nclose(value, b[i]!, tolerance),
    );
  const previous: Parameters<typeof transport>[0] = {
    pointsMm: [
      [0, 0, 0],
      [4, 0, 0],
      [4, 0, 4],
      [0, 0, 4],
    ],
    anchorIds: ["A", "B", "C", "D"],
    phase: [0, 0.25, 0.5, 0.75, 1],
  };
  const current: Parameters<typeof transport>[1] = {
    name: "observed-square",
    pointsMm: [
      [0, 1, 4],
      [4, 1, 4],
      [4, 1, 0],
      [0, 1, 0],
    ],
    anchorIds: ["D", "C", "B", "A"],
    corners: [0, 1, 2, 3],
    schedule: [0, 2],
  };
  const before: string = JSON.stringify({ previous, current });
  const reversed: ReturnType<typeof transport> = transport(
    previous,
    current,
    "ordinary-ordered",
  );
  const inherited: ReturnType<typeof transport> = transport(
    { ...previous, phase: [0, 0.1, 0.7, 0.9, 1] },
    current,
    "ordinary-ordered",
  );
  const seeded: ReturnType<typeof transport> = transport(
    { ...previous, phase: undefined },
    current,
    "ordinary-ordered",
  );
  const partial: Parameters<typeof transport>[1] = {
    name: "partial-anchor-row",
    pointsMm: [
      [4, 1, 0],
      [4, 1, 4],
      [0, 1, 4],
      [-2, 1, 0],
    ],
    anchorIds: ["B", "C", "D", null],
    corners: [0, 1, 2, 3],
    schedule: [0],
  };
  const seam: ReturnType<typeof transport> = transport(
    previous,
    partial,
    "ordinary-ordered",
  );
  const refusals: ReturnType<typeof transport>[] = [
    transport(
      previous,
      { ...current, anchorIds: [null, null, null, null] },
      "ordinary-ordered",
    ),
    transport(
      previous,
      { ...current, anchorIds: ["A", "B", "B", "D"] },
      "ordinary-ordered",
    ),
    transport(
      previous,
      { ...current, anchorIds: ["A", "C", "B", "D"] },
      "ordinary-ordered",
    ),
    transport(
      { ...previous, phase: [0, 0.25, 0.25, 0.75, 1] },
      current,
      "ordinary-ordered",
    ),
    transport(
      previous,
      {
        ...current,
        pointsMm: [
          current.pointsMm[0]!,
          current.pointsMm[0]!,
          current.pointsMm[2]!,
          current.pointsMm[3]!,
        ],
      },
      "ordinary-ordered",
    ),
    transport(previous, current, "unobserved-relation"),
  ];
  if (
    !reversed.admitted ||
    !seam.admitted ||
    !inherited.admitted ||
    !seeded.admitted
  )
    throw new Error(
      "The explicitly ordered square relations must admit their geometric chart",
    );
  TestValidator.equals(
    "reversed traversal is explicit",
    reversed.direction,
    -1,
  );
  TestValidator.equals(
    "an observed canonical seam is retained",
    reversed.virtualSeam,
    false,
  );
  const expected: C.Vector[] = [
    [0, 1, 0],
    [4, 1, 0],
    [4, 1, 4],
    [0, 1, 4],
  ];
  TestValidator.predicate(
    "incoming quarter phases preserved",
    reversed.row.phase.every((u: number, i: number): boolean =>
      nclose(u, i / 4, 1e-14),
    ),
  );
  const nonuniform: number[] = [0, 0.1, 0.7, 0.9, 1];
  TestValidator.predicate(
    "incoming nonuniform anchor phases are not replaced by arclength",
    inherited.row.phase.every((u: number, i: number): boolean =>
      nclose(u, nonuniform[i]!, 1e-14),
    ),
  );
  TestValidator.predicate(
    "the unparameterized square seeds physical quarter lengths",
    seeded.row.phase.every((u: number, i: number): boolean =>
      nclose(u, i / 4, 1e-14),
    ),
  );
  TestValidator.predicate(
    "named positions survive reversal",
    reversed.row.pointsMm.every((point: C.Vector, i: number): boolean =>
      closeVector(point, expected[i]!, 1e-14),
    ),
  );
  TestValidator.equals(
    "original cyclic point addresses are retained",
    reversed.provenance.map(
      (row: (typeof reversed.provenance)[number]): number =>
        row.kind === "observed-point" ? row.sourceIndex : -1,
    ),
    [3, 2, 1, 0],
  );
  TestValidator.equals(
    "every declared corner remains",
    reversed.row.corners,
    [0, 1, 2, 3],
  );
  TestValidator.equals(
    "schedule follows source points with canonical seam",
    reversed.row.schedule,
    [0, 1, 3],
  );
  TestValidator.equals(
    "three anchors suffice for partial geometric transport",
    seam.persistentAnchors.length,
    3,
  );
  TestValidator.equals(
    "interior seam is explicitly declared",
    seam.virtualSeam,
    true,
  );
  TestValidator.equals(
    "all four original observations remain",
    seam.originalPointsRetained,
    true,
  );
  TestValidator.equals(
    "one virtual point supplements original observations",
    seam.row.pointsMm.length,
    5,
  );
  TestValidator.predicate(
    "independent PL seam position",
    closeVector(seam.row.pointsMm[0]!, [1 - Math.sqrt(5), 1, 0], 1e-13),
  );
  const provenance: (typeof seam.provenance)[number] = seam.provenance[0]!;
  TestValidator.equals(
    "seam is not renamed as an observed point",
    provenance.kind,
    "observed-PL-interior",
  );
  if (provenance.kind !== "observed-PL-interior")
    throw new Error(
      "The chosen seam lies strictly inside the declared E-to-B edge",
    );
  TestValidator.equals(
    "interior request retains its source edge",
    provenance.sourceEdge,
    [3, 0],
  );
  TestValidator.predicate(
    "independent physical-edge fraction",
    nclose(provenance.fraction, (6 - Math.sqrt(20)) / 12, 1e-14),
  );
  TestValidator.predicate(
    "one-sided virtual-seam tangent",
    closeVector(seam.row.tangents[0]!.out, [1, 0, 0], 1e-14),
  );
  TestValidator.equals(
    "virtual seam is not a source corner",
    seam.row.corners.includes(0),
    false,
  );
  TestValidator.equals(
    "inferred phase is not material motion",
    seam.materialCorrespondenceQualified,
    false,
  );
  TestValidator.equals(
    "no longitudinal guide was observed by transport",
    seam.sourceGuideQualified,
    false,
  );
  TestValidator.predicate(
    "all invalid relations remain refusals",
    refusals.every(
      (row: ReturnType<typeof transport>): boolean =>
        !row.admitted &&
        row.diagnostics.length > 0 &&
        row.originalCourseRetainedByCaller,
    ),
  );
  TestValidator.equals(
    "caller rows are not mutated",
    JSON.stringify({ previous, current }),
    before,
  );
  TestValidator.predicate(
    "returned positions do not alias caller observations",
    reversed.row.pointsMm.every(
      (point: C.Vector): boolean => !current.pointsMm.includes(point),
    ),
  );
  const nonfinite: C.Vector[] = current.pointsMm.map(
    (point: C.Vector, i: number): C.Vector =>
      i === 0 ? [Number.NaN, point[1], point[2]] : [...point],
  );
  TestValidator.error("nonfinite physical data is malformed", (): void => {
    transport(
      previous,
      { ...current, pointsMm: nonfinite },
      "ordinary-ordered",
    );
  });
  TestValidator.error(
    "feature addresses cannot invent observations",
    (): void => {
      transport(previous, { ...current, corners: [4] }, "ordinary-ordered");
    },
  );
}
