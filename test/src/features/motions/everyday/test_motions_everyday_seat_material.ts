import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSeated,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanChain, AutoMovieMotionHumanPerformance } from "@automovie/motions";
import {
  HumanMaterialContact
} from "../../../../../packages/motions/src/posture/internal/HumanMaterialContact";
import {
  seated
} from "../../../../../packages/motions/src/everyday/internal/seated";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * An ordinary sit reaches a named seat and carries it into the rising release.
 *
 * Scenarios:
 *
 * 1. A wide chair accommodates both thighs on its physical surface.
 * 2. A chair with the same nominal seam and a narrow side edge is refused.
 * 3. The transition into rise preserves the named seat until weight transfer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A named seat must support both thighs, and its support persists into the rise until weight transfers.
 * @evidence contracts/development/testing.md#behavioral-verification Exercises the sit-to-rise composition with two otherwise equal named chair fixtures whose breadth differs.
 * @evidence contracts/development/testing.md#independent-expectations The width difference isolates the physical support surface from the nominal seat anchor. The named release fixes when the seat ceases to carry weight.
 */
export async function test_motions_everyday_seat_material(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const front: IAutoMovieVector3 = { x: 0, y: seated.popliteal(body), z: 0 };
  const upright = (width: number, offset: number = 0): AutoMovieMotionHumanPerformance => {
    const face: IAutoMovieAffordance = {
      id: "seat",
      kind: "seat",
      extent: null,
      width,
      depth: 0.5,
      frame: {
        translation: { ...front, x: offset },
        rotation: AutoMovieEngineQuaternion.identity(),
        scale: { x: 1, y: 1, z: 1 },
      },
    };
    const prop: IAutoMovieMotionHumanProp = {
      subject: "chair",
      fixed: true,
      frame: {
        position: { x: 0, y: 0, z: 0 },
        rotation: AutoMovieEngineQuaternion.identity(),
      },
      points: {
        seat: {
          point: face.frame.translation,
          normal: HumanMaterialContact.NORMAL,
        },
      },
      affordances: [face],
    };
    const seat: IAutoMovieMotionHumanSeated.ISeat = {
      at: front,
      yaw: 0,
      depth: face.depth!,
      carrier: "chair",
      point: "seat",
      armrests: {
        left: { x: 0.25, y: front.y + 0.2, z: -0.15 },
        right: { x: -0.25, y: front.y + 0.2, z: -0.15 },
      },
    };
    return new AutoMovieMotionHumanPerformance({
      seed: "seat material",
      performers: [
        {
          subject: "actor",
          body,
          at: { x: 0, y: 0, z: 0.13 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      props: [prop],
      composition: AutoMovieMotionHumanChain.subject("actor").sit({ seat, hold: 0.4 }).rise()
        .node,
    });
  };
  const wide: AutoMovieMotionHumanPerformance = upright(0.65);
  const windows: IAutoMovieMotionHumanContactWindow[][] = wide
    .segments("actor")
    .map((segment): IAutoMovieMotionHumanContactWindow[] =>
      segment.plan.contacts.filter(
        (contact): boolean => contact.part === "seat",
      ),
    );
  TestValidator.predicate(
    "the sitting hull carries finite support across the rise",
    windows.length === 2 &&
      windows[0]![0]?.material !== undefined &&
      windows[0]![0]!.support.kind === "prop" &&
      windows[0]![0]!.support.point === "seat" &&
      windows[1]![0]?.support.kind === "prop" &&
      windows[1]![0]!.support.point === "seat" &&
      windows[1]![0]!.from === 0 &&
      windows[1]![0]!.to < 1,
  );
  let refused: boolean = false;
  try {
    upright(0.04, 0.17);
  } catch (error: unknown) {
    refused = String(error).includes("both sides");
  }
  TestValidator.predicate(
    "the same nominal seat with insufficient breadth is refused",
    refused,
  );
}
