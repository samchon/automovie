import { TestValidator } from "@nestia/e2e";

import { certifyFaceBrowShaftClearance } from "../../../scripts/face-review/certifyFaceBrowShaftClearance";
import { nclose, throwsError } from "../internal/predicates";

/** Exact plane and point-set distances distinguish an entire thick shaft from
 * endpoint or centreline checks. Unregistered exterior remains outside scope. */
export const test_subject_brow_shaft_clearance = (): void => {
  const plane = (point: readonly number[]) => ({ distance: Math.abs(point[2]) });
  const stations = [{ point: [-1, 0, 0.5], radius: 0.1 }, { point: [1, 0, 0.5], radius: 0.1 }];
  const snapshot = JSON.stringify(stations);
  const prepared = certifyFaceBrowShaftClearance({ stations, query: plane, maxQueries: 64 });
  TestValidator.predicate("whole interval certified after subdivision", prepared.status === "separated" && prepared.queries === 5 &&
    nclose(prepared.lowerBoundMetres, 0.15, 1e-12) && nclose(prepared.measuredGapMetres, 0.4, 1e-12));
  const rotated = stations.map((station) => ({ ...station, point: [station.point[0], -station.point[2], station.point[1]] }));
  TestValidator.equals("rigid rotation retains certificate", certifyFaceBrowShaftClearance({ stations: rotated,
    query: (point) => ({ distance: Math.abs(point[1]) }), maxQueries: 64 }).status, "separated");
  TestValidator.equals("query budget cannot pretend a proof", certifyFaceBrowShaftClearance({ stations, query: plane, maxQueries: 2 }).status, "unresolved");
  TestValidator.equals("finite radius catches penetration missed by centreline", certifyFaceBrowShaftClearance({
    stations: stations.map((station) => ({ ...station, radius: 0.6 })), query: plane, maxQueries: 64 }).status, "overlapping-envelope");
  TestValidator.equals("safe endpoints do not hide an interior obstacle", certifyFaceBrowShaftClearance({
    stations: [{ point: [-1, 0, 0], radius: 0.1 }, { point: [1, 0, 0], radius: 0.1 }],
    query: (point) => ({ distance: Math.hypot(...point) }), maxQueries: 64 }).status, "overlapping-envelope");
  TestValidator.equals("touching at rounding scale remains unresolved", certifyFaceBrowShaftClearance({
    stations: stations.map((station) => ({ ...station, radius: 0.5 })), query: plane, maxQueries: 64 }).status, "unresolved");
  const coincident = certifyFaceBrowShaftClearance({ stations: [{ point: [0, 0, 0.5], radius: 0.1 },
    { point: [0, 0, 0.5], radius: 0.2 }], query: plane, maxQueries: 2 });
  TestValidator.predicate("station ball includes the larger radius", coincident.status === "separated" && nclose(coincident.lowerBoundMetres, 0.3, 1e-12));
  for (const points of [[1e16, 1e16 + 2], [1e16 + 2, 1e16]])
    TestValidator.equals("unrepresentable midpoint returns unresolved", certifyFaceBrowShaftClearance({
      stations: points.map((x) => ({ point: [x, 0, 0.5], radius: 0.1 })), query: plane, maxQueries: 64 }).status, "unresolved");
  TestValidator.equals("zero tip radius remains geometric input", certifyFaceBrowShaftClearance({
    stations: [{ point: [0, 0, 1], radius: 0.1 }, { point: [0.1, 0, 1], radius: 0 }], query: plane, maxQueries: 2 }).status, "separated");
  for (const bad of [[], [stations[0]], [{ point: [0, 0], radius: 0 }, stations[1]],
    [{ point: [0, 0, NaN], radius: 0 }, stations[1]], [{ point: [0, 0, 0], radius: -1 }, stations[1]],
    [{ point: [0, 0, 0], radius: Infinity }, stations[1]]])
    TestValidator.predicate("invalid stations refuse", throwsError(() => certifyFaceBrowShaftClearance({ stations: bad, query: plane, maxQueries: 64 }), "finite metre stations"));
  for (const maxQueries of [1, 2.5, NaN, 1e100])
    TestValidator.predicate("invalid proof budget refuses", throwsError(() => certifyFaceBrowShaftClearance({ stations, query: plane, maxQueries }), "query budget"));
  for (const distance of [-1, NaN, Infinity])
    TestValidator.predicate("invalid metric oracle refuses", throwsError(() => certifyFaceBrowShaftClearance({ stations,
      query: () => ({ distance }), maxQueries: 64 }), "finite unsigned"));
  TestValidator.equals("caller stations unchanged", JSON.stringify(stations), snapshot);
};
