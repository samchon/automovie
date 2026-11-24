import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanWalkLegClearance,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTangle,
  poseBones,
  resolveHumanPosture,
  stand,
  walkLegClearance,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";

/** Rounding of the clearance against the audit's own reading, metres. */
const ROUNDING: number = 1e-9;

/** A leg's bones. */
const LEG: RegExp = /(UpperLeg|LowerLeg|Foot|Toes)$/u;

/**
 * `walkLegClearance.excess` reads how far one leg passes into the other, the
 * deepest pair of the two legs' colliders as the tangle audit reads it
 * (`AutoMovieMotionHumanAuditTangle.pose`).
 *
 * The excess reads the body's tangle model, made with the body, and the
 * test reads the audit on the whole posed body, so it builds the stored body
 * (humanFixtureBody).
 *
 * Scenarios, on the average man:
 *
 * 1. The quiet stance reads none.
 * 2. With the left ankle moved 12 cm across the right foot, at seven places
 *    from 30 cm behind to 30 cm ahead of it, the excess equals the audit's
 *    deepest leg-to-leg pair; some of those crossings pass into each other.
 */
export async function test_unit_motions_actions_walk_leg_clearance(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const quiet: IAutoMovieMotionHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const right: IAutoMovieVector3 = poseBones(body, resolveHumanPosture(body, quiet)).get(
    "rightFoot",
  )!.worldPosition;
  const legs = (
    posture: IAutoMovieMotionHumanPosture,
  ): {
    left: IAutoMovieMotionHumanWalkLegClearance.ILeg;
    right: IAutoMovieMotionHumanWalkLegClearance.ILeg;
    audited: number;
  } => {
    const bones: ReturnType<typeof poseBones> = poseBones(body, resolveHumanPosture(body, posture));
    const leg = (side: AutoMovieHumanSide): IAutoMovieMotionHumanWalkLegClearance.ILeg => ({
      side,
      hip: bones.get(`${side}UpperLeg`)!.worldPosition,
      knee: bones.get(`${side}LowerLeg`)!.worldPosition,
      ankle: bones.get(`${side}Foot`)!.worldPosition,
      thigh: bones.get(`${side}UpperLeg`)!.worldRotation,
      shank: bones.get(`${side}LowerLeg`)!.worldRotation,
      rotation: bones.get(`${side}Foot`)!.worldRotation,
    });
    let audited: number = 0;
    for (const pair of AutoMovieMotionHumanAuditTangle.pose(body, bones))
      if (LEG.test(pair.a) && LEG.test(pair.b) && pair.a.slice(0, 4) !== pair.b.slice(0, 4))
        audited = Math.max(audited, pair.depth);
    return { left: leg("left"), right: leg("right"), audited };
  };
  const prepared: ReturnType<typeof walkLegClearance.prepare> = walkLegClearance.prepare(body);
  const still = legs(quiet);
  TestValidator.equals(
    "the quiet stance reads none",
    walkLegClearance.excess(prepared, still.left, still.right),
    0,
  );
  let binding: number = 0;
  for (const ahead of [-0.3, -0.2, -0.1, 0, 0.1, 0.2, 0.3]) {
    const ankle: IAutoMovieVector3 = { x: right.x - 0.12, y: right.y, z: right.z + ahead };
    const read = legs({
      ...quiet,
      limbs: {
        ...quiet.limbs,
        leftLeg: {
          ...quiet.limbs.leftLeg!,
          point: ankle,
          bend: Vector3.add(ankle, { x: 0, y: 0.5, z: 1 }),
        },
      },
    });
    const excess: number = walkLegClearance.excess(prepared, read.left, read.right);
    TestValidator.predicate(
      `the audit's reading ${ahead} m ahead`,
      Math.abs(excess - read.audited) <= ROUNDING,
    );
    if (excess > 0) binding++;
  }
  TestValidator.predicate("some crossings pass into each other", binding > 0);
}
