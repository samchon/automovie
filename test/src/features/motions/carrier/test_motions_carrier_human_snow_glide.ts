import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { AutoMovieMotionHumanRide, AutoMovieMotionHumanRefusal } from "@automovie/motions";
import {
  prepareGlideSlope
} from "../../../../../packages/motions/src/carrier/internal/prepareGlideSlope";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../internal/motionActionContext";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * Check public snow-glide edge changes and the material plane used for
 * travel.
 *
 * Scenarios:
 *
 * 1. A transfer at 1 s in a 2 s glide gives a cue at share 0.5. Reject mixed
 *    techniques, a late transfer, excessive counter-turn and a same-sign next
 *    edge on their own axes.
 * 2. Use the slope's displayed deck plane to lower a sole during forward
 *    travel. Refuse a false grade, missing material, and travel outside the
 *    fore-aft or lateral extent.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios identify edge timing, technique and the bounds of the named material.
 * @evidence contracts/development/testing.md#behavioral-verification The public plan asserts cue timing and the supporting surface reader independently asserts slope and finite bounds.
 * @evidence contracts/development/testing.md#independent-expectations The cue share is one second divided by two, and the test derives the vertical travel from the inclined deck fixture.
 */
export async function test_motions_carrier_human_snow_glide(): Promise<void> {
  const pivots = { left: { x: 0, y: 0, z: 0 }, right: { x: 0, y: 0, z: 0 } };
  const transfer: IAutoMovieMotionHumanSurface.ISkiEdgeTransfer = {
    first: { degrees: 20, pivots },
    next: { degrees: -20, pivots },
    at: 1,
    counter: 10,
  };
  const nordic: IAutoMovieMotionHumanSurface.INordicStroke = {
    hand: "right",
    on: "track",
    grip: "pole",
    window: { start: 0.2, end: 0.8 },
    kick: 0.3,
  };
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanSurface.ISnowGlideParams> =
    motionActionContext(body, {
      duration: 2,
      speed: 1,
      edgeTransfer: transfer,
    });
  const law = AutoMovieMotionHumanRide.HumanSurface.snowGlide;
  const edgeChange: IAutoMovieMotionEvent | undefined = law
    .plan(context)
    .events.find(
      (event: IAutoMovieMotionEvent): boolean => event.name === "edgeChange",
    );
  TestValidator.predicate(
    "the edge change is at the authored second",
    edgeChange !== undefined && nclose(edgeChange.share, 0.5, Number.EPSILON),
  );

  const refused = (
    edgeTransfer: IAutoMovieMotionHumanSurface.ISkiEdgeTransfer,
    stroke?: IAutoMovieMotionHumanSurface.INordicStroke,
  ): string | undefined => {
    try {
      law.plan({
        ...context,
        params: { ...context.params, edgeTransfer, nordic: stroke },
      });
    } catch (error: unknown) {
      if (error instanceof AutoMovieMotionHumanRefusal) return error.axis;
      throw error;
    }
    return undefined;
  };
  TestValidator.equals(
    "the public snow glide reports the refused axis",
    [
      refused(transfer, nordic),
      refused({ ...transfer, at: 3 }),
      refused({ ...transfer, counter: 40 }),
      refused({ ...transfer, next: { degrees: 20, pivots } }),
    ],
    [
      "nordic",
      "edgeTransfer.at",
      "edgeTransfer.counter",
      "edgeTransfer.next.degrees",
    ],
  );
  materialContact();
}

/**
 * Resolve the actual bearing plane and finite deck of a named slide.
 *
 * Scenarios:
 *
 * 1. A real 10 degree descent drops both soles by sin(10 degrees) over 1 m.
 * 2. A level deck with the same origin, a missing face and a trajectory leaving
 *    the matched deck are refused.
 */
function materialContact(): void {
  const rotation: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    10,
  );
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const context = (
    tilted?: IAutoMovieQuaternion,
  ): Parameters<typeof prepareGlideSlope>[0] => ({
    start: 0,
    prop: (): IAutoMovieMotionHumanPropReader => {
      const affordances: IAutoMovieAffordance[] =
        tilted === undefined
          ? []
          : [
              {
                id: "top",
                kind: "surface",
                frame: {
                  translation: frame.position,
                  rotation: tilted,
                  scale: { x: 1, y: 1, z: 1 },
                },
                extent: null,
                width: 1,
                depth: 3,
              },
            ];
      return {
        prop: { subject: "deck", fixed: true, frame, points: {}, affordances },
        frame: (): IAutoMovieRigidTransform => frame,
      };
    },
  });
  const deck: prepareGlideSlope.ISlope = prepareGlideSlope(
    context(rotation),
    "deck",
    rotation,
  );
  const pitchDrop: number = Math.sin(Math.PI / 18);
  for (const x of [0.11, -0.11]) {
    const entered = deck.enter({ x, y: 0, z: 0 });
    deck.travel(frame.position, entered, 1, 0);
    const down = AutoMovieEngineQuaternion.rotateVector(deck.rotation, { x, y: 0, z: 1 });
    TestValidator.predicate(
      "the actual deck's metre of travel drops a sole",
      nclose(down.y, -pitchDrop, 1e-12),
    );
  }
  TestValidator.predicate(
    "reject false grade, missing material and travel beyond the deck",
    throwsError(() =>
      prepareGlideSlope(context(frame.rotation), "deck", rotation),
    ) &&
      throwsError(() => prepareGlideSlope(context(), "deck", rotation)) &&
      throwsError(() => deck.travel(frame.position, frame.position, 2, 0)) &&
      throwsError(() => deck.travel(frame.position, frame.position, 1.5, 2)),
  );
}
