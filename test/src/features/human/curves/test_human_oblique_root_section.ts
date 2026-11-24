import {
  AutoMovieConstructionSkinCut,
  AutoMovieLoftViewFullSource,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft,
  AutoMovieHumanConicSection,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple as V,
  IAutoMovieConstructionSkinCut,
  IAutoMovieHumanConicLoft,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

/**
 * Cut a straight conic child by its parent's transverse plane. The exact
 * ellipse has one semiaxis equal to the child's radius and one equal to its
 * radius divided by the cosine of the angle to the plane normal.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the engine's cut and its derivative from the regular native conic source.
 * @evidence contracts/development/testing.md#independent-expectations The cylinder axis pierces the plane at [100, 0, 20 tan(π/6)], with ellipse axes along Y and Z.
 * @evidence contracts/development/testing.md#distinguishing-cases Compares an interior cut, a cut in a caller-owned conic extension, and a tube parallel to the parent plane.
 * @evidence contracts/development/testing.md#execution-ownership All inputs are synthesized in the test without an asset or a mesh.
 * @evidence contracts/development/common.md#meaningful-documentation States the analytic geometry and the responsibility for the extended domain.
 */
export function test_human_oblique_root_section(): void {
  const angle: number = Math.PI / 6;
  const cosine: number = Math.cos(angle);
  const pierce: number = 20 * Math.tan(angle);
  const end: V = [80 + 100 * cosine, 0, 100 * Math.sin(angle)];
  const samples: number = 32;
  const interior: IAutoMovieHumanConicLoft.IFamily = tube(end, [10, 90]);
  const carried: IAutoMovieHumanConicLoft.IFamily =
    AutoMovieHumanConicLoft.extended(tube(end, [40, 90]), 10);
  for (const family of [interior, carried]) {
    const { cut, surface } = section(family, samples);
    assert.ok(typeof cut !== "string", typeof cut === "string" ? cut : undefined);
    for (let i: number = 0; i < samples; ++i) {
      const v: number = (2 * Math.PI * i) / samples;
      const [u, du, ddu] = cut.at(v);
      const { p, u: s, v: t, uu, uv, vv } = surface.jet(u, v);
      assert.ok(Math.abs(p[0] - 100) < 1e-10);
      assert.ok(
        Math.abs(Math.hypot(p[1] / RADIUS, ((p[2] - pierce) * cosine) / RADIUS) - 1) <
          1e-10,
      );
      assert.ok(Math.abs(s[0] * du + t[0]) < 1e-10);
      assert.ok(
        Math.abs(uu[0] * du ** 2 + 2 * uv[0] * du + vv[0] + s[0] * ddu) <
          1e-10,
      );
    }
  }
  const refused = section(tube([80, 0, 100], [10, 90]), samples).cut;
  assert.ok(typeof refused === "string" && refused.includes("never enters"));
}

/** The independent cylindrical fixture's physical radius, in mm. */
const RADIUS: number = 10;

/** A circular conic family with a straight synthetic centreline. */
function tube(end: V, knots: number[]): IAutoMovieHumanConicLoft.IFamily {
  const shoulder: number = Math.SQRT2 - 1;
  return {
    name: "oblique-tube",
    centres: [[80, 0, 0], end],
    halves: [],
    up: [0, 1, 0],
    layout: AutoMovieHumanConicSection.limb(0),
    knots,
    values: [RADIUS, 0, 0, RADIUS, -RADIUS, 0, 0, -RADIUS, shoulder, shoulder, shoulder, shoulder]
      .map((x): number[] => knots.map((): number => x)),
  };
}

/** The general skin cut on the admitted conic and the parent plane at X = 100 mm. */
function section(
  family: IAutoMovieHumanConicLoft.IFamily,
  samples: number,
): {
  cut: IAutoMovieConstructionSkinCut.ICut | string;
  surface: IAutoMovieSolidSurface;
} {
  const read = AutoMovieLoftViewFullSource.create(AutoMovieHumanConicLoft.source(family));
  const surface: IAutoMovieSolidSurface = {
    name: family.name,
    orientation: 1,
    jet: read.jet,
  };
  const cut = AutoMovieConstructionSkinCut.create({
    surface,
    planes: [{ point: [100, 0, 0], normal: [1, 0, 0] }],
    into: 1,
    stations: family.knots,
    samples,
  });
  return { cut, surface };
}
