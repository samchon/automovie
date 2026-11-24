import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFrame, ladderAccessRails } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few rotations, metres. */
const ROUNDING: number = 1e-12;

/**
 * `ladderAccessRails` reads a fixed ladder's two upright side rails: its `bar`
 * affordances named `...Rail`, each placed in the world, sorted to the
 * climber's left and right by its offset in the ladder's frame, and kept only
 * when its axis is within about 8 degrees of upright; either side missing gives
 * none.
 *
 * Scenarios, a ladder 2 m along +Z, the climber facing it from the origin, its
 * 1.8 m rails 0.25 m either side and 0.9 m up, gripped all but a 0.1 m
 * aperture:
 *
 * 1. The left rail stands at (0.25, 0.9, 2), upright, half 0.85 m long, and the
 *    right at (-0.25, 0.9, 2).
 * 2. A ladder whose right rail lies level, or that has no right rail, gives none.
 */
export function test_unit_motions_climbing_ladder_access_rails(): void {
  const upright: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    90,
  );
  const rail: (
    id: string,
    x: number,
    rotation: IAutoMovieQuaternion,
  ) => IAutoMovieAffordance = (
    id: string,
    x: number,
    rotation: IAutoMovieQuaternion,
  ): IAutoMovieAffordance => ({
    id,
    kind: "bar",
    frame: {
      translation: { x, y: 0.9, z: 0 },
      rotation,
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    length: 1.8,
    aperture: 0.1,
  });
  const placed: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 2 },
    rotation: Quaternion.identity(),
  };
  const ladder: (
    affordances: IAutoMovieAffordance[],
  ) => Parameters<typeof ladderAccessRails.read>[0] = (
    affordances: IAutoMovieAffordance[],
  ): Parameters<typeof ladderAccessRails.read>[0] => ({
    prop: { subject: "ladder", frame: placed, points: {}, affordances },
    frame: (): IAutoMovieRigidTransform => placed,
  });
  const frame: HumanFrame.IPrepared = HumanFrame.prepare({
    origin: { x: 0, y: 0, z: 0 },
    yaw: 0,
  });
  const pair: ladderAccessRails.IPair | undefined = ladderAccessRails.read(
    ladder([
      rail("leftRail", 0.25, upright),
      rail("rightRail", -0.25, upright),
      rail("rung1", 0, Quaternion.identity()),
    ]),
    frame,
    0,
  );
  const axis: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  TestValidator.predicate(
    "the rails",
    pair !== undefined &&
      pair.left.id === "leftRail" &&
      vclose(pair.left.center, { x: 0.25, y: 0.9, z: 2 }, ROUNDING) &&
      vclose(pair.left.axis, axis, ROUNDING) &&
      nclose(pair.left.half, 0.85, ROUNDING) &&
      vclose(pair.right.center, { x: -0.25, y: 0.9, z: 2 }, ROUNDING),
  );
  TestValidator.equals(
    "no pair",
    [
      ladderAccessRails.read(
        ladder([
          rail("leftRail", 0.25, upright),
          rail("rightRail", -0.25, Quaternion.identity()),
        ]),
        frame,
        0,
      ),
      ladderAccessRails.read(
        ladder([rail("leftRail", 0.25, upright)]),
        frame,
        0,
      ),
    ],
    [undefined, undefined],
  );
}
