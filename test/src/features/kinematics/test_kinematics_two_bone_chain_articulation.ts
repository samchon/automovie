import { twoBoneChainArticulation } from "../../../../packages/engine/src/kinematics/twoBoneChainArticulation";
import { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";
import { namedFacts } from "../internal/namedFacts";
import { nclose } from "../internal/nclose";
import { type IAutoMovieTwoBoneArticulation } from "../../../../packages/engine/src/kinematics/IAutoMovieTwoBoneArticulation";
const IDENTITY: { x: number; y: number; z: number; w: number; } = { x: 0, y: 0, z: 0, w: 1 };

const at: (position: IAutoMovieVector3) => { worldPosition: IAutoMovieVector3; worldRotation: { x: number; y: number; z: number; w: number; }; } = (position: IAutoMovieVector3): { worldPosition: IAutoMovieVector3; worldRotation: { x: number; y: number; z: number; w: number; }; }  => ({
  worldPosition: position,
  worldRotation: IDENTITY,
});

/** A 0.3 + 0.25 chain hanging straight down from the origin, like a leg. */
const leg: (overrides: { upper?: IAutoMovieVector3; lower?: IAutoMovieVector3; end?: IAutoMovieVector3; target: IAutoMovieVector3; bendNormal?: IAutoMovieVector3; }) => IAutoMovieTwoBoneArticulation | null = (overrides: {
  upper?: IAutoMovieVector3;
  lower?: IAutoMovieVector3;
  end?: IAutoMovieVector3;
  target: IAutoMovieVector3;
  bendNormal?: IAutoMovieVector3;
}): IAutoMovieTwoBoneArticulation | null  =>
  twoBoneChainArticulation({
    upper: at(overrides.upper ?? { x: 0, y: 0, z: 0 }),
    lower: at(overrides.lower ?? { x: 0, y: -0.3, z: 0 }),
    end: overrides.end ?? { x: 0, y: -0.55, z: 0 },
    target: overrides.target,
    ...(overrides.bendNormal === undefined
      ? {}
      : { bendNormal: overrides.bendNormal }),
  });

/**
 * The shared two-bone lowering's own boundaries, pinned directly.
 *
 * The current direct caller is `solvePreparedChainPlant`, invoked by
 * `fitChainToTarget` for prepared contact candidates. `reachPose` uses the
 * separate hinge-respecting arm solve. These cases therefore present the
 * two-bone geometry's degeneracies directly instead of relying on a contact
 * scenario to happen to reach a zero-length segment.
 *
 * The world-down pole and its fallback remain this solver's conventional
 * bend-plane preference when no explicit normal is supplied. This CPU case
 * provides no independent measurement of living-knee mechanics.
 *
 * Scenarios:
 *
 * 1. An ordinary reachable target solves, and the lowered deltas are unit
 *    quaternions.
 * 2. The pole fallback: a target straight below the root makes the reach axis
 *    parallel to the world-down pole, so the bend-plane cross product
 *    degenerates and a second reference (+Z) takes over. The solve stays total
 *    rather than dividing by a zero-length normal.
 * 3. An explicit `bendNormal` overrides the pole derivation, and its two signs are
 *    the chain's two bend branches, so they do not produce the same answer.
 * 4. Degenerate: a zero-length upper segment, a zero-length lower segment, and a
 *    target coincident with the chain root each return `null`.
 *
 * @evidence contracts/testing.md#behavioral-verification Solves an isolated two-bone chain and checks unit deltas, pole-parallel fallback, different explicit bend-normal branches and degenerate null returns; invalid-length fabrication or lost branch sign fails.
 * @evidence contracts/testing.md#independent-expectations A unit rotation has component Euclidean norm 1, and opposite declared bend normals must distinguish the two branches for this noncollinear fixture. The case checks solvability/norm/branch discrimination rather than an independent end-contact oracle, which prepared contact tests supplement; arm reach uses a different hinge solver.
 * @evidence contracts/testing.md#distinguishing-cases Keeps ordinary and pole-parallel targets, both signed bend normals, zero upper/lower segment and root-coincident target; scalar shell clamping and hinge-specific ROM choices belong to their own entries.
 * @evidence contracts/testing.md#execution-ownership This exported runner entry directly invokes portable chain source and owns the conventional 0.3/0.25-metre local record; it requires no Human asset, native solver, browser or GPU.
 */
export function test_kinematics_two_bone_chain_articulation(): void {
  // 1. an ordinary solve
  const solved: IAutoMovieTwoBoneArticulation | null = leg({ target: { x: 0.2, y: -0.4, z: 0.1 } });
  TestValidator.equals(
    "a reachable target solves into two unit deltas",
    namedFacts([
      ["solved", (): boolean  => solved !== null],
      [
        "ncloseMathHypot",
        (): boolean  =>
          solved !== null &&
          nclose(
            Math.hypot(
              solved.upper.x,
              solved.upper.y,
              solved.upper.z,
              solved.upper.w,
            ),
            1,
            1e-9,
          ),
      ],
      [
        "ncloseMathHypot2",
        (): boolean  =>
          solved !== null &&
          nclose(
            Math.hypot(
              solved.lower.x,
              solved.lower.y,
              solved.lower.z,
              solved.lower.w,
            ),
            1,
            1e-9,
          ),
      ],
    ]),
    { solved: true, ncloseMathHypot: true, ncloseMathHypot2: true },
  );

  // 2. the pole fallback: reach axis parallel to world-down
  TestValidator.predicate(
    "a straight-down target still solves through the bend-plane fallback",
    leg({ target: { x: 0, y: -0.5, z: 0 } }) !== null,
  );

  // 3. an explicit bend normal overrides the pole, and its sign picks a branch
  const plus: IAutoMovieTwoBoneArticulation | null = leg({
    target: { x: 0.2, y: -0.4, z: 0.1 },
    bendNormal: { x: 1, y: 0, z: 0 },
  });
  const minus: IAutoMovieTwoBoneArticulation | null = leg({
    target: { x: 0.2, y: -0.4, z: 0.1 },
    bendNormal: { x: -1, y: 0, z: 0 },
  });
  TestValidator.equals(
    "the two hinge branches are genuinely different solves",
    namedFacts([
      ["plus", (): boolean  => plus !== null],
      ["minus", (): boolean  => minus !== null],
      [
        "nclosePlusUpper",
        (): boolean  =>
          plus !== null &&
          minus !== null &&
          Number.isFinite(plus.upper.x) &&
          Number.isFinite(minus.upper.x) &&
          !nclose(plus.upper.x, minus.upper.x, 1e-6),
      ],
    ]),
    { plus: true, minus: true, nclosePlusUpper: true },
  );

  // 4. the degenerate chains
  TestValidator.equals(
    "a zero-length upper segment returns null",
    leg({ lower: { x: 0, y: 0, z: 0 }, target: { x: 0.2, y: -0.4, z: 0.1 } }),
    null,
  );
  TestValidator.equals(
    "a zero-length lower segment returns null",
    leg({
      lower: { x: 0, y: -0.3, z: 0 },
      end: { x: 0, y: -0.3, z: 0 },
      target: { x: 0.2, y: -0.4, z: 0.1 },
    }),
    null,
  );
  TestValidator.equals(
    "a target on the chain root returns null",
    leg({ target: { x: 0, y: 0, z: 0 } }),
    null,
  );
}
