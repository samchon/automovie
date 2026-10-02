import { TestValidator } from "@nestia/e2e";

import { faceBrowAttachmentFrame } from "../../../scripts/face-review/faceBrowAttachmentFrame";
import { faceBrowTubeStations } from "../../../scripts/face-review/faceBrowTubeStations";
import { nclose, throwsError } from "../internal/predicates";

/** Plane barycentrics, rigid rotation and the metric tube lattice are independent
 * oracles; neither carrier vertices nor a portrait is a follicle measurement. */
export const test_subject_brow_attachment_frame = (): void => {
  const mesh = { positions: [0, 0, 0, 0.02, 0, 0, 0, 0.01, 0], indices: [0, 1, 2] };
  const attachment = { triangle: 0, weights: [0.5, 0.25, 0.25] as const, reference: [1, 0, 0] as const };
  const snapshot = JSON.stringify({ mesh, attachment });
  const frame = faceBrowAttachmentFrame(mesh, attachment);
  const close = (actual: number[], expected: number[]) => actual.every((value, axis) => nclose(value, expected[axis], 1e-12));
  TestValidator.predicate("barycentric origin and right-handed frame", close(frame.origin, [0.005, 0.0025, 0]) &&
    close(frame.tangent, [1, 0, 0]) && close(frame.across, [0, 1, 0]) && close(frame.normal, [0, 0, 1]));
  TestValidator.predicate("metres into chart millimetres", close(frame.intoMillimetres([0.007, 0.0015, 0.003]), [2, -1, 3]));
  TestValidator.predicate("metric output returns to head frame", close(frame.outOfMetres([0.002, -0.001, 0.003]), [0.007, 0.0015, 0.003]));
  TestValidator.predicate("directions rotate without translation", close(frame.directionOut([0, 0, 1]), [0, 0, 1]));
  const rotated = faceBrowAttachmentFrame({ ...mesh, positions: [0, 0, 0, 0.02, 0, 0, 0, 0, 0.01] }, attachment);
  TestValidator.predicate("rigid rotation preserves units and orientation", close(rotated.normal, [0, -1, 0]) &&
    close(rotated.across, [0, 0, 1]) && close(rotated.outOfMetres([0.002, -0.001, 0.003]), [0.007, -0.003, 0.0015]));
  const subnormal = faceBrowAttachmentFrame({ positions: [0, 0, 0, 1e-155, 0, 0, 0, 1e-155, 0], indices: [0, 1, 2] },
    { ...attachment, reference: [1e-320, 0, 0] });
  TestValidator.predicate("finite subnormal axes normalize without overflowing reciprocals", close(subnormal.normal, [0, 0, 1]) && close(subnormal.tangent, [1, 0, 0]));
  const shifted = faceBrowAttachmentFrame({ ...mesh, positions: mesh.positions.map((value, index) => value + (index % 3 === 2 ? 0.001 : 0)) }, attachment);
  TestValidator.predicate("changed host rebuilds its attachment", close(shifted.origin, [0.005, 0.0025, 0.001]));
  frame.origin[0] = 99; frame.normal[0] = 99;
  TestValidator.predicate("owned axis arrays do not mutate transform", close(frame.outOfMetres([0, 0, 0]), [0.005, 0.0025, 0]));
  TestValidator.equals("caller data unchanged", JSON.stringify({ mesh, attachment }), snapshot);
  for (const triangle of [-1, 0.5, 1])
    TestValidator.predicate("invalid triangle ordinal refuses", throwsError(() => faceBrowAttachmentFrame(mesh, { ...attachment, triangle }), "resident host triangle"));
  for (const indices of [null, [0, 1], [0, -1, 2], [0, 1.5, 2], [0, 1, 3]])
    TestValidator.predicate("invalid connectivity refuses", throwsError(() => faceBrowAttachmentFrame({ ...mesh, indices }, attachment), "triangle"));
  for (const weights of [[0.5, 0.5], [-0.1, 0.6, 0.5], [1.1, 0, 0], [0.5, 0.25, 0.2], [NaN, 0, 1]])
    TestValidator.predicate("invalid barycentrics refuse", throwsError(() => faceBrowAttachmentFrame(mesh, { ...attachment, weights: weights as [number, number, number] }), "barycentric"));
  TestValidator.predicate("roundoff adjacent to exact sum remains admitted", Number.isFinite(faceBrowAttachmentFrame(mesh,
    { ...attachment, weights: [0.5, 0.25, 0.2500000000000001] }).origin[0]));
  TestValidator.predicate("nonfinite host coordinates refuse", throwsError(() => faceBrowAttachmentFrame({ ...mesh, positions: [NaN, ...mesh.positions.slice(1)] }, attachment), "finite metre"));
  for (const positions of [[0, 0, 0, 1, 0, 0, 2, 0, 0], [0, 0, 0, 1e308, 0, 0, 0, 1e308, 0]])
    TestValidator.predicate("collapsed or overflowing triangle refuses", throwsError(() => faceBrowAttachmentFrame({ ...mesh, positions }, attachment), "nondegenerate finite"));
  for (const reference of [[1], [0, 0, 0], [0, 0, 1], [1e-16, 0, 1], [NaN, 0, 0], [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE]])
    TestValidator.predicate("unconditioned tangent reference refuses", throwsError(() => faceBrowAttachmentFrame(mesh,
      { ...attachment, reference: reference as [number, number, number] }), "reference"));
  TestValidator.predicate("bad conversion coordinates refuse", throwsError(() => frame.intoMillimetres([1, 2]), "three finite") &&
    throwsError(() => frame.directionOut([0, NaN, 1]), "three finite"));
  const sparseReference = new Array<number>(3);
  sparseReference[0] = 1;
  TestValidator.predicate("sparse reference cannot acquire implicit zero axes", throwsError(() => faceBrowAttachmentFrame(mesh,
    { ...attachment, reference: sparseReference as [number, number, number] }), "reference"));
  TestValidator.predicate("sparse conversion cannot acquire implicit coordinates", throwsError(() => frame.intoMillimetres(new Array(3)), "three finite"));
  const positions = [0.001, 0.0005].flatMap((radius, row) => Array.from({ length: 9 }, (_, column) => {
    const angle = column * Math.PI / 4;
    return [0.01 + radius * Math.cos(angle), 0.02 + 0.002 * row, 0.03 + radius * Math.sin(angle)];
  }).flat());
  const tube = { positions, indices: [], normals: null, uvs: null, skin: null };
  const stations = faceBrowTubeStations(tube, 1);
  TestValidator.predicate("tube centres and radii remain metric", close(stations[0].point, [0.01, 0.02, 0.03]) &&
    close(stations[1].point, [0.01, 0.022, 0.03]) && nclose(stations[0].radius, 0.001, 1e-15) && nclose(stations[1].radius, 0.0005, 1e-15));
  for (const segments of [0, 0.5, 2])
    TestValidator.predicate("wrong tube row contract refuses", throwsError(() => faceBrowTubeStations(tube, segments), "metric lattice"));
  TestValidator.predicate("nonfinite tube refuses", throwsError(() => faceBrowTubeStations({ ...tube, positions: [Infinity, ...positions.slice(1)] }, 1), "metric lattice"));
  const displacedSeam = [...positions];
  displacedSeam[24] = 0.012;
  TestValidator.predicate("actual seam vertex is enclosed too", nclose(faceBrowTubeStations({ ...tube, positions: displacedSeam }, 1)[0].radius, 0.002, 1e-15));
};
