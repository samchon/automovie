import {
  type IAutoMovieHumanBodyBasis,
  createHumanBodyUnderwear,
} from "@automovie/human";
import type { IAutoMovieMesh } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanBodyUnderwearFixture } from "../internal/humanBodyUnderwearFixture";

/**
 * The garment bridges a skin crease through the whole cut: the same panel
 * dressed with the table's span and with a span of zero differs exactly
 * where the panel has a groove.
 *
 * The panel is the fixture's front panel refined to 5 mm and given a V-groove
 * down its midline, 10 mm wide at the crests (x = +-5 mm) and 30 mm deep, its
 * face normals all +Z. A ball of half the 0.04 span rests on the two crests,
 * its arc dipping 0.6 mm below the crest plane (z = 0.1), so a bridged
 * groove vertex stands at z = 0.1 + lift - 0.0006 (the lift is the table's
 * 4 mm) within a millimetre.
 *
 * Scenarios:
 * 1. Span zero: the groove vertices sit in the groove, at z = 0.074.
 * 2. Span 0.04: every groove-floor vertex of the garment stands within 1 mm of the
 *    bridging arc and its normal points out (z > 0.7), no vertex dives more than
 *    1 mm below the arc; the vertices away from
 *    the groove keep z = 0.104 and the normal +Z; the triangle count is
 *    unchanged.
 */
export const test_human_body_underwear_bridge = (): void => {
  const fixture = humanBodyUnderwearFixture();
  const step = 0.005;
  const columns = 25;
  const rows = 49;
  const positions: number[] = [];
  const normals: number[] = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < columns; i++) {
      const x = -0.06 + i * step;
      positions.push(x, -0.66 + j * step, i === 12 ? 0.07 : 0.1);
      normals.push(0, 0, 1);
    }
  const indices: number[] = [];
  for (let j = 0; j + 1 < rows; j++)
    for (let i = 0; i + 1 < columns; i++) {
      const a = j * columns + i;
      indices.push(a, a + 1, a + columns + 1, a, a + columns + 1, a + columns);
    }
  const count = positions.length / 3;
  const surface = fixture.basis.surfaces[0]!;
  const basis: IAutoMovieHumanBodyBasis = {
    ...fixture.basis,
    surfaces: [
      {
        ...surface,
        positions,
        indices,
        regions: [
          { id: "front/skin", material: "skin", indices, uvs: null },
        ],
        skin: {
          joints: ["hips", "leftLowerArm"],
          boneIndices: Array.from({ length: count }, () => [0, 0, 0, 0]).flat(),
          weights: Array.from({ length: count }, () => [1, 0, 0, 0]).flat(),
        },
      },
    ],
  };
  const dress = (spanMetres: number) => {
    const result = createHumanBodyUnderwear(basis, {
      ...fixture.table,
      spanMetres,
    })({
      underwear: { style: "boxer-briefs" },
      rest: { surfaces: [positions], landmarks: fixture.rest.landmarks },
      posed: [{ positions, normals }],
    });
    return (result.parts[0]!.geometry as { mesh: IAutoMovieMesh }).mesh;
  };
  const groove = (mesh: IAutoMovieMesh) =>
    [...new Array(mesh.positions.length / 3).keys()].filter(
      (v) => Math.abs(mesh.positions[v * 3]!) < 1e-9,
    );

  const laid = dress(0);
  const grooveLaid = groove(laid);
  TestValidator.predicate(
    "span zero: the garment follows the groove down",
    grooveLaid.length > 10 &&
      grooveLaid.every(
        (v) => Math.abs(laid.positions[v * 3 + 2]! - 0.074) < 1e-9,
      ),
  );

  const bridged = dress(0.04);
  // the groove floor is the column of vertices on the axis of the laid garment,
  // which the bridged garment shares by index
  const floor = grooveLaid;
  const arc = 0.104 - 0.0006;
  TestValidator.equals(
    "the cut is unchanged",
    bridged.indices!.length,
    laid.indices!.length,
  );
  TestValidator.predicate(
    "span 0.04: the groove floor is bridged and its normals point out",
    floor.length === grooveLaid.length &&
      floor.every(
        (v) =>
          Math.abs(bridged.positions[v * 3 + 2]! - arc) < 0.001 &&
          bridged.normals![v * 3 + 2]! > 0.7,
      ),
  );
  TestValidator.predicate(
    "span 0.04: no vertex of the garment dives below the arc",
    [...new Array(bridged.positions.length / 3).keys()].every(
      (v) => bridged.positions[v * 3 + 2]! > arc - 0.001,
    ),
  );
  const away = [...new Array(bridged.positions.length / 3).keys()].filter(
    (v) => Math.abs(bridged.positions[v * 3]!) > 0.03,
  );
  TestValidator.predicate(
    "away from the groove the garment is untouched",
    away.length > 10 &&
      away.every(
        (v) =>
          Math.abs(bridged.positions[v * 3 + 2]! - 0.104) < 5e-4 &&
          Math.abs(bridged.normals![v * 3 + 2]! - 1) < 1e-3,
      ),
  );
};
