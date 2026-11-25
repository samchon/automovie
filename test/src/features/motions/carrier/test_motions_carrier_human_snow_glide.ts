import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSurface,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  HumanRefusal,
  HumanSnowGlide,
  prepareGlideSlope,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

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
  const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    10,
  );
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
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
    const down = Quaternion.rotateVector(deck.rotation, { x, y: 0, z: 1 });
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

/**
 * `HumanSnowGlide.admit` admits a snow glide's own requests before its glide is
 * planned: alpine edging or a Nordic stroke, not both; an edge transfer inside
 * the glide, its counter-rotation within 35 degrees, each edge pair within 45
 * degrees, and the new edges of the opposite cant.
 *
 * Scenarios, a 2 s glide:
 *
 * 1. A transfer at 1 s from a 20 degree to a -20 degree edge, countering 10
 *    degrees, is admitted.
 * 2. A transfer with a Nordic stroke is refused on `nordic`; one at 3 s on
 *    `edgeTransfer.at`; one countering 40 degrees on `edgeTransfer.counter`;
 *    one to a 20 degree edge on `edgeTransfer.next.degrees`.
 */
export function test_motions_carrier_human_snow_glide(): void {
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
    window: [0.2, 0.8],
    kick: 0.3,
  };
  const refused = (
    edgeTransfer: IAutoMovieMotionHumanSurface.ISkiEdgeTransfer,
    stroke?: IAutoMovieMotionHumanSurface.INordicStroke,
  ): string | undefined => {
    try {
      HumanSnowGlide.admit({
        duration: 2,
        edgeTransfer,
        ...(stroke === undefined ? {} : { nordic: stroke }),
      });
    } catch (error: unknown) {
      return error instanceof HumanRefusal ? error.axis : "error";
    }
    return undefined;
  };
  TestValidator.equals(
    "the transfer",
    [
      refused(transfer),
      refused(transfer, nordic),
      refused({ ...transfer, at: 3 }),
      refused({ ...transfer, counter: 40 }),
      refused({ ...transfer, next: { degrees: 20, pivots } }),
    ],
    [
      undefined,
      "nordic",
      "edgeTransfer.at",
      "edgeTransfer.counter",
      "edgeTransfer.next.degrees",
    ],
  );
  materialContact();
}
