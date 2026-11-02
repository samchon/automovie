import { TestValidator } from "@nestia/e2e";

import { AutoMovieHumanWebBoundary as Boundary } from "../../../../packages/human/src/generation/AutoMovieHumanWebBoundary";
import { AutoMovieHumanWebDomain as Domain } from "../../../../packages/human/src/generation/AutoMovieHumanWebDomain";
import { AutoMovieHumanWebPatch as Patch } from "../../../../packages/human/src/generation/AutoMovieHumanWebPatch";
import { nclose } from "../internal/nclose";

/**
 * A web's saddle stays inside its finite boundary curves with physical G2 jets.
 *
 * Scenarios:
 * 1. Parent and child rows fix opposite curve endpoints at every ring distance.
 * 2. Interior coordinates remain in [0,1], including the recorded thumb failure.
 * 3. The crest retains two independent tangents and a hyperbolic normal form.
 * 4. Station reparameterization keeps geometric curvature and the declared speed.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the bounded chart used by BodyWeb and its physical boundary-jet conversion. The recorded depth-inverse thumb coordinate exceeds one and is explicitly red, while every bounded coordinate stays inside its owning curves. A large tangential station acceleration must disappear when the caller requests zero parameter acceleration.
 * @evidence contracts/testing.md#independent-expectations A bounded transfinite chart must use parameters in [0,1] and copy its four endpoint constraints. The independent saddle is z=x*x-y*y, whose principal second derivatives at its crest are 2 and -2. Curvature is the normal component of acceleration divided by speed squared; its value is independent of station parameterization and orthogonal frame changes. Whole-person shape remains with the curve audits.
 * @evidence contracts/testing.md#distinguishing-cases Covers zero, tiny and wide ring distances, both boundary rows and 999 interior levels, the measured f1 out-of-domain witness, all four saddle quadrants, two handednesses, rotated frames and three finite boundary speeds. Source-distribution and malformed calibration validation belong to the producer's existing contracts.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by --include human_web_domain. It constructs only local analytic curves and jets and starts no process, person generation, browser or GPU.
 */
export function test_human_web_domain(): void {
  for (const y of [
    0, 1e-12, 1e-8, 0.01, 0.1, 1, 1.6841973476882552, 3, 10, 100,
  ]) {
    for (let i: number = 0; i <= 1000; i++) {
      const p: Domain.IPoint = Domain.point(-1 + (2 * i) / 1000, y);
      TestValidator.predicate(
        "finite own boundary parameter",
        Number.isFinite(p.own) && p.own >= -1e-12 && p.own <= 1 + 1e-12,
      );
      TestValidator.predicate(
        "finite lip boundary parameter",
        Number.isFinite(p.lip) && p.lip >= -1e-12 && p.lip <= 1 + 1e-12,
      );
    }
    const parent: Domain.IPoint = Domain.point(-1, y);
    const child: Domain.IPoint = Domain.point(1, y);
    TestValidator.predicate(
      "parent copies lip endpoint",
      nclose(parent.own, 0, 1e-12) && nclose(parent.lip, 1, 1e-12),
    );
    TestValidator.predicate(
      "child copies own endpoint",
      nclose(child.own, 1, 1e-12) && nclose(child.lip, 0, 1e-12),
    );
  }

  // This measured root column used to evaluate a quadratic extension at 1.258.
  const x: number = 0.08039824210958192;
  const y: number = 1.6841973476882552;
  const defective: number = Math.sqrt(
    (4.583758712028741 * (Math.hypot(x, y) + x)) / 2 / 2.559963293201733,
  );
  TestValidator.predicate("unbounded depth chart is red", defective > 1.25);
  TestValidator.predicate("finite chart is green", Domain.point(x, y).own < 1);

  const saddle: (a: number, b: number) => Patch.Vec3 = (
    a: number,
    b: number,
  ): Patch.Vec3 => {
    const p: Domain.IPoint = Domain.point(a * a - b * b, 2 * Math.abs(a * b));
    return [
      (Math.sign(a) || 1) * p.own,
      (Math.sign(b) || 1) * p.lip,
      p.own * p.own - p.lip * p.lip,
    ];
  };
  const h: number = 1e-4;
  const xx: number =
    (saddle(h, 0)[2] - 2 * saddle(0, 0)[2] + saddle(-h, 0)[2]) / (h * h);
  const yy: number =
    (saddle(0, h)[2] - 2 * saddle(0, 0)[2] + saddle(0, -h)[2]) / (h * h);
  const xy: number =
    (saddle(h, h)[2] -
      saddle(h, -h)[2] -
      saddle(-h, h)[2] +
      saddle(-h, -h)[2]) /
    (4 * h * h);
  TestValidator.predicate(
    "independent crest tangent",
    nclose(saddle(h, 0)[0] / h, 1, 1e-8) &&
      nclose(saddle(0, h)[1] / h, 1, 1e-8),
  );
  TestValidator.predicate(
    "hyperbolic normal form",
    nclose(xx, 2, 1e-8) && nclose(yy, -2, 1e-8) && nclose(xy, 0, 1e-8),
  );

  for (const sign of [-1, 1])
    for (const angle of [0, 0.57, Math.PI / 2])
      for (const speed of [1, 6.482421, 20.691673]) {
        const rotate: (p: Patch.Vec3) => Patch.Vec3 = (
          p: Patch.Vec3,
        ): Patch.Vec3 => [
          sign * (p[0] * Math.cos(angle) - p[2] * Math.sin(angle)),
          p[1],
          p[0] * Math.sin(angle) + p[2] * Math.cos(angle),
        ];
        const physical: Patch.IJet = {
          value: [0, 0, 0],
          first: rotate([1.5, 0.3, -0.4]),
          second: rotate([15000.4, 3000.7, -3999.8]),
        };
        const normalized: Patch.IJet = Boundary.geometric(physical, speed);
        const expected: Patch.Vec3 = curvature(physical);
        const actual: Patch.Vec3 = curvature(normalized);
        TestValidator.predicate(
          "physical curvature retained",
          expected.every((value: number, k: number): boolean =>
            nclose(value, actual[k]!, 1e-8),
          ),
        );
        TestValidator.predicate(
          "declared finite speed",
          nclose(Math.hypot(...normalized.first), speed, 1e-10),
        );
        TestValidator.predicate(
          "station acceleration removed",
          nclose(
            normalized.second.reduce(
              (sum: number, value: number, k: number): number =>
                sum + (value * normalized.first[k]!) / speed,
              0,
            ),
            0,
            1e-8,
          ),
        );
      }
}

/** Curvature vector from the independent Frenet normal-acceleration definition. */
function curvature(jet: Patch.IJet): Patch.Vec3 {
  const speed: number = Math.hypot(...jet.first);
  const tangent: Patch.Vec3 = jet.first.map(
    (x: number): number => x / speed,
  ) as Patch.Vec3;
  const along: number = jet.second.reduce(
    (sum: number, x: number, k: number): number => sum + x * tangent[k]!,
    0,
  );
  return jet.second.map(
    (x: number, k: number): number =>
      (x - along * tangent[k]!) / (speed * speed),
  ) as Patch.Vec3;
}
