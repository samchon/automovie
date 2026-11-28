import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { AutoMovieMotionHumanRefusal } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { AquaticProp } from "../../../../../packages/motions/src/sport/internal/AquaticProp";

/**
 * Read articulated crew contacts with the merged state on the carrier's frame.
 *
 * Scenarios:
 *
 * 1. A named site uses the supplied writer instead of building the full pose.
 * 2. Sites without a projection share one full-pose lookup at the same sample.
 * 3. An unavailable contact still reports the valid named alternatives.
 * 4. A carrier with no articulation state can supply its point directly.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the supplied writer, fallback, refusal and point-placement cases.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the named-contact reader on a typed in-memory carrier and counts each supported provider call.
 * @evidence contracts/development/testing.md#independent-expectations Uses independent translations from the explicit state and rigid placement. The site and full pose counters distinguish the direct route from equivalent but repeated geometry work.
 */
export function test_motions_sport_aquatic_prop(): void {
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const frame: IAutoMovieRigidTransform = {
    position: { x: 10, y: 20, z: 30 },
    rotation: identity,
  };
  const contact = (
    id: string,
    kind: IAutoMovieAffordance["kind"],
    x: number,
  ): IAutoMovieAffordance => ({
    id,
    kind,
    extent: null,
    frame: { translation: { x, y: 2, z: 3 }, rotation: identity },
  });
  let full: number = 0;
  let narrow: number = 0;
  const prop: IAutoMovieMotionHumanProp = {
    subject: "shell",
    frame,
    points: {},
    affordances: [contact("grip", "handle", 0)],
    point: (_id: string, seconds: number) => ({
      point: { x: seconds, y: 22, z: 33 },
      normal: { x: 0, y: 1, z: 0 },
    }),
    articulate: (
      state: Readonly<Record<string, number>>,
    ): IAutoMovieMotionHumanProp.IPosed => {
      ++full;
      return {
        affordances: [
          contact("grip", "handle", state.arm! + state.base!),
          contact("foot", "surface", -1),
          contact("seat", "seat", 1),
        ],
      };
    },
    articulateSite: (
      id: string,
      state: Readonly<Record<string, number>>,
    ): IAutoMovieAffordance | undefined => {
      ++narrow;
      return id === "grip"
        ? contact("grip", "handle", state.arm! + state.base!)
        : undefined;
    },
  };
  const reader: IAutoMovieMotionHumanPropReader = {
    prop,
    frame: (): IAutoMovieRigidTransform => frame,
    state: (): Readonly<Record<string, number>> => ({ arm: 2, base: 1 }),
  };
  const posed: AquaticProp.IContacts = AquaticProp.at(reader, 4, { arm: 3 });
  TestValidator.equals("merged frame", posed.require("grip", "handle").world, {
    translation: { x: 14, y: 22, z: 33 },
    rotation: identity,
  });
  TestValidator.equals(
    "the named contact uses only its projection",
    [narrow, full],
    [1, 0],
  );
  TestValidator.equals(
    "fallback foot",
    posed.require("foot", "surface").world.translation.x,
    9,
  );
  TestValidator.equals(
    "fallback seat",
    posed.require("seat", "seat").world.translation.x,
    11,
  );
  TestValidator.equals("fallback builds once", full, 1);

  let refused: AutoMovieMotionHumanRefusal | undefined;
  try {
    posed.require("foot", "handle");
  } catch (error) {
    if (!(error instanceof AutoMovieMotionHumanRefusal)) throw error;
    refused = error;
  }
  TestValidator.equals("wrong-kind alternatives", refused?.feasible, {
    kind: "alternatives",
    values: ["grip"],
  });

  const ground: AquaticProp.IContacts = AquaticProp.at(
    { prop, frame: reader.frame },
    6,
  );
  TestValidator.equals(
    "declared point in the world",
    ground.require("grip", "handle").world.translation,
    {
      x: 6,
      y: 22,
      z: 33,
    },
  );
  TestValidator.equals("the unarticulated contact creates no pose", full, 1);
}
