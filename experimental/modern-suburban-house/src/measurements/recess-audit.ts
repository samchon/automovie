/** Pure boundary and thin-wall fixtures for the blind-recess geometry producer. */
import { inspectAutoMovieMeshTopology } from "@automovie/engine";

import { blindRecessWall, type IBlindRecess } from "../spaces/rooms/recess";
import { block } from "../spaces/solids";

const fixture: IBlindRecess = {
  wallX: [0.75, 0.90], wallY: [3.06, 5.66], wallZ: [-8.95, -6.06],
  openingY: [4.16, 4.56], openingZ: [-8.55, -8.15], depth: 0.08,
};

const verify = (input: IBlindRecess): void => {
  const solid = blindRecessWall(input);
  const t = inspectAutoMovieMeshTopology(solid.mesh);
  const outer = (input.wallX[1] - input.wallX[0]) * (input.wallY[1] - input.wallY[0]) * (input.wallZ[1] - input.wallZ[0]);
  const pocket = input.depth * (input.openingY[1] - input.openingY[0]) * (input.openingZ[1] - input.openingZ[0]);
  if (!t.watertight || t.degenerate !== 0 || t.nonManifoldEdges !== 0 || t.boundaryEdges !== 0 || t.nonFinite !== 0)
    throw new Error(`blind recess topology failed: ${JSON.stringify(t)}`);
  if (Math.abs(t.volume - (outer - pocket)) > 1e-7)
    throw new Error(`blind recess volume ${t.volume} differs from ${outer - pocket}`);
  if (solid.face.holes.length !== 0)
    throw new Error("blind recess was incorrectly recorded as a through opening");
};

const mustReject = (input: IBlindRecess): void => {
  try { blindRecessWall(input); }
  catch { return; }
  throw new Error("blind recess accepted an open or degenerate boundary");
};

/** Invoked by the committed whole-house measurement producer. */
export const verifyBlindRecessFixtures = (): void => {
  // Convex uncut reference: the removed pocket must be exactly the volume difference.
  const convex = inspectAutoMovieMeshTopology(block([fixture.wallX[0], fixture.wallY[0], fixture.wallZ[0]], [fixture.wallX[1], fixture.wallY[1], fixture.wallZ[1]]));
  const outer = 0.15 * 2.60 * 2.89;
  if (!convex.watertight || Math.abs(convex.volume - outer) > 1e-7)
    throw new Error("convex wall reference fixture failed");
  // Concave wall and blind hole, then positive but very thin back and rim.
  verify(fixture);
  verify({ ...fixture, depth: 0.149 });
  verify({ ...fixture, openingY: [3.061, 5.659], openingZ: [-8.949, -6.061] });
  // An opening reaching the top or side is a different operation, not a blind niche.
  mustReject({ ...fixture, openingY: [4.16, 5.66] });
  mustReject({ ...fixture, openingZ: [-8.95, -8.15] });
  mustReject({ ...fixture, depth: 0.15 });
  mustReject({ ...fixture, depth: 0 });
  mustReject({ ...fixture, openingY: [4.56, 4.16] });
  mustReject({ ...fixture, depth: Number.NaN });
};
