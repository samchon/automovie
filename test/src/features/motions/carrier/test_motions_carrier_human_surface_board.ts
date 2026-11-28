import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import {
  HumanSurfaceBoard
} from "../../../../../packages/motions/src/carrier/internal/HumanSurfaceBoard";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few turned metres and degrees. */
const ROUNDING: number = 1e-9;

/**
 * Check how a foot boards a finite deck in the board's own frame.
 *
 * Scenarios:
 *
 * 1. Read the named deck and tail at film second 6 for a one-second local
 *    read of an action starting at 5. Admit its centre and refuse off-plane,
 *    off-deck, missing and tilted material on `on` .
 * 2. Round-trip a local point through the rotated board, then reconstruct the
 *    requested sole point from the ankle goal and the turned sole offset.
 * 3. Read 90 degrees of heading, the endpoint and midpoint ease values, and
 *    the authored plant window.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify the timed board, admitted deck, sole goal and plant window.
 * @evidence contracts/development/testing.md#behavioral-verification The fixtures check frame timing, deck admission and the displayed sole and contact window.
 * @evidence contracts/development/testing.md#independent-expectations The named clock addition, 90-degree axis change, inverse sole offset and symmetry at half ease determine the expected readings.
 */
export async function test_motions_carrier_human_surface_board(): Promise<void> {
  const quarter: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const frame: IAutoMovieRigidTransform = {
    position: { x: 2, y: 0.1, z: 0 },
    rotation: quarter,
  };
  const affordance = (
    id: string,
    kind: IAutoMovieAffordance["kind"],
    translation: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 },
  ): IAutoMovieAffordance => ({
    id,
    kind,
    frame: { translation, rotation, scale: { x: 1, y: 1, z: 1 } },
    extent: null,
    width: 0.2,
    depth: 0.8,
  });
  const read: number[] = [];
  const context = (
    affordances: IAutoMovieAffordance[],
  ): HumanSurfaceBoard.IDeckContext => ({
    start: 5,
    prop: () => ({
      prop: { affordances },
      frame: (seconds: number): IAutoMovieRigidTransform => {
        read.push(seconds);
        return frame;
      },
    }),
  });
  const deck: HumanSurfaceBoard.IDeck = HumanSurfaceBoard.deck(
    context([
      affordance("deck", "surface", { x: 0, y: 0.08, z: 0 }),
      affordance("tail", "surface", { x: 0, y: 0.08, z: -0.35 }),
    ]),
    "board",
  );
  deck.at(1);
  TestValidator.predicate(
    "the deck",
    read[0] === 6 &&
      vclose(deck.centre, { x: 0, y: 0.08, z: 0 }, ROUNDING) &&
      deck.width === 0.2 &&
      deck.length === 0.8 &&
      vclose(
        deck.site("tail", "surface"),
        { x: 0, y: 0.08, z: -0.35 },
        ROUNDING,
      ),
  );
  const refused = (run: () => unknown): string | undefined => {
    try {
      run();
    } catch (error: unknown) {
      if (error instanceof AutoMovieMotionHumanRefusal) return error.axis;
    }
    return undefined;
  };
  TestValidator.equals(
    "refusals",
    [
      refused(() => deck.plant({ x: 0, y: 0.08, z: 0 }, "left")),
      refused(() => deck.plant({ x: 0, y: 0.1, z: 0 }, "left")),
      refused(() => deck.plant({ x: 0, y: 0.08, z: 0.5 }, "left")),
      refused(() => deck.site("nose", "surface")),
      refused(() =>
        HumanSurfaceBoard.deck(
          context([
            affordance(
              "deck",
              "surface",
              { x: 0, y: 0.08, z: 0 },
              AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 30),
            ),
          ]),
          "board",
        ),
      ),
      refused(() => HumanSurfaceBoard.deck(context([]), "board")),
    ],
    [undefined, "on", "on", "on", "on", "on"],
  );
  const point: IAutoMovieVector3 = { x: 0.3, y: 0.4, z: -0.2 };
  TestValidator.predicate(
    "the board's frame",
    vclose(
      HumanSurfaceBoard.local(frame, HumanSurfaceBoard.world(frame, point)),
      point,
      ROUNDING,
    ) &&
      vclose(
        HumanSurfaceBoard.world(frame, { x: 0, y: 0, z: 1 }),
        { x: 3, y: 0.1, z: 0 },
        ROUNDING,
      ),
  );
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const sole: IAutoMovieVector3 = { x: 2, y: 0.18, z: 0.1 };
  const goal = HumanSurfaceBoard.ankle(body, "left", sole, quarter, true);
  TestValidator.predicate(
    "a sole goal",
    vclose(
      AutoMovieEngineVector3.add(
        goal.point,
        AutoMovieEngineQuaternion.rotateVector(
          quarter,
          HumanFoot.offset(body, "left", "sole"),
        ),
      ),
      sole,
      ROUNDING,
    ) && goal.planted === true,
  );
  TestValidator.predicate(
    "the heading and ease",
    nclose(HumanSurfaceBoard.heading(quarter), 90, ROUNDING) &&
      HumanSurfaceBoard.ease(0.1, 0.2, 0.6) === 0 &&
      nclose(HumanSurfaceBoard.ease(0.4, 0.2, 0.6), 0.5, ROUNDING) &&
      HumanSurfaceBoard.ease(0.7, 0.2, 0.6) === 1,
  );
  TestValidator.equals(
    "a plant",
    HumanSurfaceBoard.plant("leftFoot", 0.1, 0.4, { kind: "ground" }),
    {
      part: "leftFoot",
      from: 0.1,
      to: 0.4,
      support: { kind: "ground" },
      kind: "plant",
    },
  );
}
