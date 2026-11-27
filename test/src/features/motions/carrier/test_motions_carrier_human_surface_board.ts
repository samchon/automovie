import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFoot,
  AutoMovieMotionHumanRefusal,
  HumanSurfaceBoard,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a few turned metres and degrees. */
const ROUNDING: number = 1e-9;

/**
 * `HumanSurfaceBoard`'s helpers stage a ride on a board's own frame.
 *
 * - `deck` admits a board whose `deck` surface is bounded and horizontal in its
 *   own frame, reads its frame on the action's clock, names its sites, and
 *   refuses a plant off its top by more than `GAP` or outside its extent.
 * - `world` and `local` carry a point into and out of the board's frame.
 * - `ankle` sets a sole goal: the ankle the sole's offset, turned, behind the
 *   sole point.
 * - `heading` is a rotation's yaw from +Z; `ease` the minimum-jerk share between
 *   two shares, held outside them; `plant` a support window.
 *
 * The body is built whole (`humanFixtureBody`) for `ankle`'s sole offset.
 *
 * Scenarios, a board at (2, 0.1, 0) turned a quarter about +Y, its deck 0.08 m
 * up, 0.2 m wide and 0.8 m long, with a `tail` site, on an action starting at 5
 * s:
 *
 * 1. The deck's frame at 1 s is read at 6 s; it takes the deck's centre and extent
 *    and the tail's place.
 * 2. A plant at the deck's centre passes; one 0.02 m above it, or 0.5 m along it,
 *    and a missing site, are refused on `on`; so is a deck tilted 30 degrees,
 *    or none.
 * 3. A point carried out and back is itself; the board's local +Z is world +X.
 * 4. An ankle plus the turned sole offset is the sole point; a quarter turn's
 *    heading is 90; the ease is 0, 0.5 and 1 before, halfway and after; a plant
 *    is its window.
 */
export async function test_motions_carrier_human_surface_board(): Promise<void> {
  const quarter: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
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
              Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 30),
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
      Vector3.add(
        goal.point,
        Quaternion.rotateVector(
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
