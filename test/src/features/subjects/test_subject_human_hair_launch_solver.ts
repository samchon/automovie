import {
  Vector3,
  createAutoMovieMeshRayCaster,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import { humanFaceHairContact } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { launchHumanFaceHairCurve } from "../../../../packages/human/src/face/anatomy/hair/launchHumanFaceHairCurve";
import { createHumanFaceHairRootBoundary } from "../../../../packages/human/src/face/anatomy/hair/createHumanFaceHairRootBoundary";
import { createSignedOctahedron, createSignedVoxelUnion } from "../internal/createSignedMeshFixture";
import { nclose, throwsError } from "../internal/predicates";

/**
 * An emergence station lies on its desired ray at the first available skin
 * clearance, before reentry and before spending the lock's entire length.
 * Scenarios:
 * 1. A closed box's plane independently gives travel c/sin(a) for 15 and 30
 *    degrees; a purely normal exit gives c without a tangent convention.
 *    Each admitted planar ray must return its station before those metric
 *    readings apply; an unexpected refusal fails the named success assertion.
 * 2. At the convex L1 ball's vertex the adjacent edge distance is
 *    t(sin(a)+cos(a))/sqrt(2), an independent changing-feature oracle.
 * 3. A concave L's opposite wall makes distance nonmonotone. A broad gap
 *    reaches clearance before reentry; a narrow gap cannot and refuses.
 * 4. Short, exhausted, off-surface and inward rays refuse. Inputs and the
 *    compiled collider remain owned when a returned station is mutated.
 * 5. Both signs of the existing root rounding allowance preserve the desired
 *    planar ray. An inside root's outward surface exit is not a reentry.
 * 6. A closed U-shaped solid creates a constant-distance exterior corridor;
 *    clearance below the target consumes the caller's shared remaining count
 *    and refuses, rather than relying on binary64 finiteness for useful cost.
 * 7. Malformed counts refuse without mutation. A rotated and translated box's
 *    shared face diagonal checks frame invariance under both rounding signs.
 * 8. A concave edge whose incident-face pseudonormal points with the ray still
 *    leads into actual solid interior. The signed witness refuses its exterior
 *    interval; the old intersection-normal classifier's reentry wording is not
 *    the invariant. A closed-box tangent near an edge also refuses, while its
 *    adjacent 15-degree ray follows the independently measured corner distance.
 * 9. Signed zero, a translated binary64 coordinate grid and finite travel
 *    overflow distinguish actual representable points from scalar advances.
 */
export const test_subject_human_hair_launch_solver = (): void => {
  const layer = { samplingStep: 0.002, clearance: 0.001 };
  const diagonalRoot = { triangle: 6, weights: [1, 0, 1] };
  const prepare = (mesh: IAutoMovieMesh, root: ReturnType<typeof Vector3.create>, metadata?: { triangle: number; weights: number[] }) => {
    const query = createAutoMovieSignedMeshQuery(mesh);
    const raycaster = createAutoMovieMeshRayCaster(mesh);
    const length = 0.05;
    const contact = humanFaceHairContact({ layer, root, length, query });
    const boundary = createHumanFaceHairRootBoundary({ positions: mesh.positions, indices: mesh.indices! });
    return { root, length, contact, raycaster, rootBoundary: {
      triangles: boundary.resolve(metadata ?? { triangle: query([root.x, root.y, root.z]).triangle, weights: [1, 1, 1] }),
      distance: boundary.distance,
    }, budget: { remaining: 1_000_000 } };
  };
  const box = createSignedVoxelUnion([[0, 0, 0]]);
  const root = Vector3.create(0.5, 1, 0.5);
  const planar = prepare(box, root, diagonalRoot);
  const target = planar.contact.clearance - planar.contact.epsilon;
  for (const degrees of [15, 30, 90]) {
    const angle = degrees * Math.PI / 180;
    const exitDirection = Vector3.create(Math.cos(angle), Math.sin(angle), 0);
    let launched: ReturnType<typeof launchHumanFaceHairCurve> | undefined;
    let launchFailure: unknown;
    try {
      launched = launchHumanFaceHairCurve({ ...planar, exitDirection });
    } catch (error: unknown) {
      launchFailure = error;
    }
    TestValidator.predicate("an admitted planar emergence ray returns an exterior station",
      launched !== undefined && launchFailure === undefined,
    );
    // The success assertion throws before these readings on a refused ray.
    const station = launched!;
    const chord = Vector3.subtract(station.point, root);
    TestValidator.predicate("plane launch preserves its angle and first clearance",
      nclose(station.distance, target / Math.sin(angle), 1e-12) &&
      nclose(Math.atan2(chord.y, Math.hypot(chord.x, chord.z)), angle, 1e-9) &&
      nclose(chord.y, target, 1e-12) && station.distance < planar.length,
    );
  }
  const edgeOffset = 0.001;
  const nearEdge = prepare(box, Vector3.create(1 - edgeOffset, 1, 0.5));
  TestValidator.predicate("a coplanar face ray cannot follow skin to its far edge",
    throwsError(() => launchHumanFaceHairCurve({ ...nearEdge, exitDirection: Vector3.create(1, 0, 0) }), "exterior"),
  );
  const shallowAngle = Math.PI / 12;
  const edgeTarget = nearEdge.contact.clearance - nearEdge.contact.epsilon;
  const expectedEdgeTravel = edgeOffset * Math.cos(shallowAngle) +
    Math.sqrt(edgeTarget ** 2 - (edgeOffset * Math.sin(shallowAngle)) ** 2);
  const edgeExit = launchHumanFaceHairCurve({
    ...nearEdge, exitDirection: Vector3.create(Math.cos(shallowAngle), Math.sin(shallowAngle), 0),
  });
  TestValidator.predicate("the adjacent positive ray clears the convex edge on its own ray",
    nclose(edgeExit.distance, expectedEdgeTravel, 1e-12),
  );
  const zero = prepare(box, Vector3.create(-0, 0, -0), { triangle: 0, weights: [0, 0, 1] });
  const vertexExit = launchHumanFaceHairCurve({ ...zero, exitDirection: Vector3.create(-1, -1, -1) });
  TestValidator.predicate("signed-zero roots keep a representable exterior vertex ray",
    nclose(Vector3.length(vertexExit.point), zero.contact.clearance - zero.contact.epsilon, 1e-12),
  );
  const translated = createSignedVoxelUnion([[0, 0, 0]]);
  const translation = 2 ** 40;
  for (let at = 0; at < translated.positions.length; at += 3) translated.positions[at] += translation;
  const quantized = prepare(translated, Vector3.create(translation + 1, 0.5, 0.5), { triangle: 2, weights: [1, 0, 1] });
  const quantizedTarget = quantized.contact.clearance - quantized.contact.epsilon;
  const quantum = 2 ** -12;
  const quantizedExit = launchHumanFaceHairCurve({ ...quantized, length: 1, exitDirection: Vector3.create(1, 0, 0) });
  TestValidator.predicate("large-coordinate clearance selects the first actual coordinate beyond target",
    quantizedExit.point.x - quantized.root.x === Math.ceil(quantizedTarget / quantum) * quantum,
  );
  TestValidator.predicate("finite travel overflow remains the actual signed-query refusal",
    throwsError(() => launchHumanFaceHairCurve({ ...planar, length: Number.MAX_VALUE, exitDirection: Vector3.create(0, 1, 0) }), "arithmetic must remain finite"),
  );
  const convex = prepare(createSignedOctahedron(), Vector3.create(1, 0, 0), { triangle: 0, weights: [0, 0, 1] });
  const angle = Math.PI / 12;
  const curved = launchHumanFaceHairCurve({
    ...convex,
    exitDirection: Vector3.create(Math.sin(angle), Math.cos(angle), 0),
  });
  const convexTarget = convex.contact.clearance - convex.contact.epsilon;
  TestValidator.predicate("convex feature clearance uses the actual surface",
    nclose(curved.distance, convexTarget * Math.SQRT2 / (Math.sin(angle) + Math.cos(angle)), 1e-12),
  );
  const solid = createSignedVoxelUnion([[0, 0, 0], [1, 0, 0], [0, 1, 0]]);
  const exitDirection = Vector3.create(-Math.cos(angle), Math.sin(angle), 0);
  const broad = prepare(solid, Vector3.create(1.03, 1, 0.5));
  const entry = broad.raycaster.nearest([1.03, 1, 0.5], [-Math.cos(angle), Math.sin(angle), 0], broad.length, broad.contact.epsilon);
  TestValidator.predicate("the concave negative twin really has an opposite wall",
    entry !== null && nclose(entry, 0.03 / Math.cos(angle), 1e-12),
  );
  const clear = launchHumanFaceHairCurve({ ...broad, exitDirection });
  TestValidator.predicate("first clearance precedes the nonmonotone region",
    nclose(clear.distance, (broad.contact.clearance - broad.contact.epsilon) / Math.sin(angle), 1e-12) && clear.distance < entry!,
  );
  const narrow = prepare(solid, Vector3.create(1.003, 1, 0.5));
  TestValidator.predicate("reentry before clearance refuses",
    throwsError(() => launchHumanFaceHairCurve({ ...narrow, exitDirection }), "reentry"),
  );
  TestValidator.predicate("short and exact-length boundaries refuse",
    throwsError(() => launchHumanFaceHairCurve({ ...planar, exitDirection: Vector3.create(0, 1, 0), length: target }), "length") &&
    throwsError(() => launchHumanFaceHairCurve({ ...planar, exitDirection: Vector3.create(0, 1, 0), length: planar.contact.epsilon }), "length"),
  );
  const inward = Vector3.create(0, -1, 0);
  TestValidator.predicate("inward and tangential exits refuse",
    throwsError(() => launchHumanFaceHairCurve({ ...planar, exitDirection: inward }), "outward") &&
    throwsError(() => launchHumanFaceHairCurve({ ...planar, exitDirection: Vector3.create(1, 0, 0) }), "outward"),
  );
  const outside = Vector3.create(0.5, 1.01, 0.5);
  TestValidator.predicate("a root off the same collider refuses",
    throwsError(() => launchHumanFaceHairCurve({ ...prepare(box, outside), exitDirection: Vector3.create(0, 1, 0) }), "root"),
  );
  const shallow = Vector3.create(Math.cos(angle), Math.sin(angle), 0);
  for (const sign of [-1, 1]) {
    const roundedRoot = Vector3.create(root.x, root.y + sign * planar.contact.epsilon / 2, root.z);
    const rounded = prepare(box, roundedRoot, diagonalRoot);
    const offset = roundedRoot.y - root.y;
    TestValidator.predicate("roundoff fixture retains the intended side",
      sign * offset > 0 && Math.abs(offset) <= rounded.contact.epsilon,
    );
    const result = launchHumanFaceHairCurve({ ...rounded, exitDirection: shallow });
    TestValidator.predicate("both root rounding sides keep the planar ray",
      nclose(result.distance, (rounded.contact.clearance - rounded.contact.epsilon - offset) / Math.sin(angle), 1e-12),
    );
    if (sign < 0) {
      const exit = rounded.raycaster.nearest([roundedRoot.x, roundedRoot.y, roundedRoot.z], [shallow.x, shallow.y, shallow.z], rounded.length);
      TestValidator.predicate("the inside root exits beyond the old minimum",
        exit !== null && exit > rounded.contact.epsilon,
      );
      TestValidator.predicate("length ending on the root exit cannot clear skin",
        throwsError(() => launchHumanFaceHairCurve({ ...rounded, exitDirection: shallow, length: exit! }), "length"),
      );
    }
  }
  TestValidator.predicate("nonfinite and nonpositive lock lengths refuse",
    throwsError(() => launchHumanFaceHairCurve({ ...planar, exitDirection: shallow, length: NaN }), "length") &&
    throwsError(() => launchHumanFaceHairCurve({ ...planar, exitDirection: shallow, length: 0 }), "length"),
  );
  const noIterations = { remaining: 0 };
  TestValidator.predicate("an exhausted shared budget refuses without adding work",
    throwsError(() => launchHumanFaceHairCurve({ ...planar, exitDirection: shallow, budget: noIterations }), "budget") && noIterations.remaining === 0,
  );
  const oneQuery = { remaining: 1 };
  TestValidator.predicate("a root-hit scan spends its shared count before refusing",
    throwsError(() => launchHumanFaceHairCurve({ ...planar, exitDirection: shallow, budget: oneQuery }), "budget") && oneQuery.remaining === 0,
  );
  for (const invalid of [Infinity, NaN, 0.5, -1, Number.MAX_SAFE_INTEGER + 1]) {
    const budget = { remaining: invalid };
    TestValidator.predicate("malformed counts refuse before consuming the caller's state",
      throwsError(() => launchHumanFaceHairCurve({ ...planar, exitDirection: shallow, budget }), "safe integer") && Object.is(budget.remaining, invalid),
    );
  }
  const corridor = createSignedVoxelUnion([[0, 0, 0], [0, 1, 0], [0, 2, 0], [1, 0, 0], [1, 2, 0]]);
  const gap = 1e-6;
  const separation = 2 * (target - gap);
  for (let at = 1; at < corridor.positions.length; at += 3) corridor.positions[at] *= separation;
  const channel = prepare(corridor, Vector3.create(1, 1.5 * separation, 0.5), { triangle: 10, weights: [1, 0, 1] });
  const plateau = channel.contact.sample(Vector3.create(1.1, 1.5 * separation, 0.5));
  TestValidator.predicate("the owned corridor is exterior below target clearance",
    plateau.signedDistance > 0 && nclose(plateau.signedDistance, target - gap, 1e-12),
  );
  const remaining = { remaining: 3 };
  TestValidator.predicate("a distance plateau consumes the shared budget on failure",
    throwsError(() => launchHumanFaceHairCurve({ ...channel, exitDirection: Vector3.create(1, 0, 0), budget: remaining }), "budget") && remaining.remaining === 0,
  );
  const insideX = 1 - channel.contact.epsilon / 4;
  const rounding = 1 - insideX;
  const grazingRoot = Vector3.create(insideX, 2 * separation - rounding, 0.5);
  const grazing = prepare(corridor, grazingRoot, { triangle: 10, weights: [0, 1, 1] });
  TestValidator.equals("the concave edge is shared by the two original incident faces",
    grazing.rootBoundary.triangles, [10, 36],
  );
  const diagonal = Vector3.normalize(Vector3.create(1, 1, 0));
  const rootSample = grazing.contact.sample(grazingRoot);
  TestValidator.predicate("the grazing fixture starts inside its admitted root allowance",
    rootSample.signedDistance < 0 && Math.abs(rootSample.signedDistance) <= grazing.contact.epsilon &&
    Vector3.dot(diagonal, Vector3.create(...rootSample.normal)) > 0,
  );
  const touch = grazing.raycaster.nearest([grazingRoot.x, grazingRoot.y, grazingRoot.z], [diagonal.x, diagonal.y, diagonal.z], grazing.length);
  TestValidator.predicate("the actual concave boundary is reached before clearance",
    touch !== null && touch < target && nclose(touch, rounding * Math.SQRT2, 1e-12),
  );
  TestValidator.predicate("the interval after the concave root edge is actual solid interior",
    grazing.contact.sample(Vector3.create(1 + separation / 2, 2.5 * separation, 0.5)).signedDistance < 0,
  );
  let grazingFailure: unknown;
  try {
    launchHumanFaceHairCurve({ ...grazing, exitDirection: diagonal });
  } catch (error: unknown) {
    grazingFailure = error;
  }
  TestValidator.predicate("a concave corner touch refuses its actual interior interval",
    grazingFailure instanceof Error && grazingFailure.message.includes("outward exterior interval"),
  );
  const rotate = (point: ReturnType<typeof Vector3.create>) => Vector3.create(
    (point.x - point.y) / Math.SQRT2,
    (point.x + point.y) / Math.SQRT2,
    point.z,
  );
  const shift = Vector3.create(2, 3, 4);
  const rotatedBox = createSignedVoxelUnion([[0, 0, 0]]);
  for (let at = 0; at < rotatedBox.positions.length; at += 3) {
    const point = Vector3.add(shift, rotate(Vector3.create(...rotatedBox.positions.slice(at, at + 3))));
    rotatedBox.positions.splice(at, 3, point.x, point.y, point.z);
  }
  const rotatedRoot = Vector3.add(shift, rotate(root));
  const rotatedNormal = rotate(Vector3.create(0, 1, 0));
  const planePoint = Vector3.add(shift, rotate(Vector3.create(0, 1, 0)));
  const allowance = prepare(rotatedBox, rotatedRoot).contact.epsilon;
  for (const sign of [-1, 0, 1]) {
    const seat = Vector3.add(rotatedRoot, Vector3.scale(rotatedNormal, sign * allowance / 2));
    const prepared = prepare(rotatedBox, seat, diagonalRoot);
    const result = launchHumanFaceHairCurve({ ...prepared, exitDirection: rotate(shallow) });
    const signedPlaneOffset = Vector3.dot(Vector3.subtract(seat, planePoint), rotatedNormal);
    const chord = Vector3.subtract(result.point, seat);
    TestValidator.predicate("a transformed shared triangle diagonal preserves its ray and clearance",
      nclose(result.distance, (prepared.contact.clearance - prepared.contact.epsilon - signedPlaneOffset) / Math.sin(angle), 1e-12) &&
      nclose(Vector3.dot(chord, rotatedNormal) / Vector3.length(chord), Math.sin(angle), 1e-9),
    );
  }
  const nonconvex = createSignedVoxelUnion([
    [-1, -1, 0], [-1, 0, 0], [0, -1, 0], [0, 0, 0], [0, -1, -1],
    [-1, -4, -1],
  ]);
  for (let at = 0; at < nonconvex.positions.length; at++) nonconvex.positions[at] *= 0.001;
  // Binary power ratios keep the authored ray incident on the vertex rather
  // than letting decimal-ratio rounding turn this into a nearby face crossing.
  const crossing = Vector3.normalize(Vector3.create(1, 8, 1));
  const crossingRoot = Vector3.create(-0.003 / 8, -0.003, -0.003 / 8);
  const crossingQuery = createAutoMovieSignedMeshQuery(nonconvex);
  const crossingRay = createAutoMovieMeshRayCaster(nonconvex);
  const crossingBoundary = createHumanFaceHairRootBoundary({ positions: nonconvex.positions, indices: nonconvex.indices! });
  const crossingStar = crossingBoundary.resolve({ triangle: crossingQuery([crossingRoot.x, crossingRoot.y, crossingRoot.z]).triangle, weights: [1, 0, 1] });
  const vertex = crossingQuery([0, 0, 0]);
  const contactAtEntry = humanFaceHairContact({
    layer: { samplingStep: 0.002, clearance: 0.003 },
    root: crossingRoot, length: 0.05, query: crossingQuery,
  });
  TestValidator.predicate("the nonconvex vertex is a real entry despite positive pseudonormal direction",
    vertex.feature === "vertex" && Vector3.dot(crossing, Vector3.create(...vertex.normal)) > 0 &&
    crossingQuery([-0.000001, -0.000008, -0.000001]).signedDistance > 0 &&
    crossingQuery([0.000001, 0.000008, 0.000001]).signedDistance < 0,
  );
  TestValidator.predicate("a true vertex entry before clearance refuses",
    throwsError(() => launchHumanFaceHairCurve({
      root: crossingRoot, exitDirection: crossing, length: 0.05,
      contact: contactAtEntry, raycaster: crossingRay, budget: { remaining: 1_000_000 },
      rootBoundary: { triangles: crossingStar, distance: crossingBoundary.distance },
    }), "reentry"),
  );
  const before = JSON.stringify(root);
  const first = launchHumanFaceHairCurve({ ...planar, exitDirection: Vector3.create(0, 1, 0) });
  first.point.y = 400;
  box.positions.fill(400);
  const owned = launchHumanFaceHairCurve({ ...planar, exitDirection: Vector3.create(0, 1, 0) });
  TestValidator.predicate("root, result and collider snapshots are independent",
    JSON.stringify(root) === before && nclose(owned.point.y - 1, target, 1e-12),
  );
};
