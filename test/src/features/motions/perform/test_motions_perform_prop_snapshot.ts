import type {
  IAutoMovieMotionHumanObject,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanObject } from "@automovie/motions";
import {
  HumanPerformancePropSnapshot
} from "../../../../../packages/motions/src/perform/internal/HumanPerformancePropSnapshot";
import {
  HumanPerformanceSite
} from "../../../../../packages/motions/src/perform/internal/HumanPerformanceSite";
import { TestValidator } from "@nestia/e2e";

import { testAffordance } from "../../internal/fixtures/testAffordance";

/** The neutral rotation, exact in binary64. */
const NEUTRAL: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/**
 * An externally posed model supplies the snapshot at the very same film
 * second as the displayed frame. It owns even an absent collider list. An
 * internally driven model supplies local geometry only without an external
 * pose; a rigid model uses its declared rest geometry.
 * A named world site uses the same posed payload when no explicit world point
 * owns it, including a site that the payload removes.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names carrier time, external geometry precedence, absent colliders, driven and rigid fallbacks, and world site ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the snapshot and site owners with literal carrier, posed model and articulation callbacks, recording which reader runs and at what seconds. It checks geometry, removes the external site's payload, and tests the explicit world point without a model read.
 * @evidence contracts/development/testing.md#independent-expectations At 2 s the carrier X is 18 and the posed seat offset is 1/4, so its named world X is 18.25. The collider is another 1/4 m away. At 3 s the model omits its collider. An explicit world site at X = 32 + t returns 35 at 3 s.
 */
export function test_motions_perform_prop_snapshot(): void {
  const modelReads: number[] = [];
  const drivenReads: number[] = [];
  const atRest: IAutoMovieMotionHumanObject.Placement = { at: x(0), yaw: 0 };
  const stateful: IAutoMovieMotionHumanObject.IModel = {
    ...model(1 / 8),
    articulate: (
      travel: Readonly<Record<string, number>>,
    ): IAutoMovieMotionHumanObject.IModel => model(travel.slide ?? 1 / 8),
  };
  const moving: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "moving",
    stateful,
    atRest,
    (seconds: number): IAutoMovieMotionHumanObject.Placement => ({
      at: x(4 + seconds),
      yaw: 0,
    }),
    undefined,
    undefined,
    (seconds: number): IAutoMovieMotionHumanObject.IModel => {
      modelReads.push(seconds);
      return seconds === 4
        ? { affordances: [] }
        : model(seconds / 8, seconds < 3);
    },
  );
  const articulated: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "articulated",
    stateful,
    atRest,
  );
  const rigid: IAutoMovieMotionHumanProp = AutoMovieMotionHumanObject.prop(
    "rigid",
    model(1 / 8),
    atRest,
  );
  const frame = (seconds: number): IAutoMovieRigidTransform => ({
    position: x(16 + seconds),
    rotation: NEUTRAL,
  });
  const driven = (
    seconds: number,
  ): IAutoMovieMotionHumanProp.IPosed | undefined => {
    drivenReads.push(seconds);
    return articulated.articulate?.({ slide: seconds / 2 });
  };

  moving.motion?.(2);
  TestValidator.equals(
    "ordinary reads leave the external pose unread",
    modelReads,
    [],
  );

  const tracked: IAutoMovieMotionHumanPropReader.ISnapshot =
    HumanPerformancePropSnapshot(moving, 2, frame, driven);
  const absent: IAutoMovieMotionHumanPropReader.ISnapshot =
    HumanPerformancePropSnapshot(moving, 3, frame, driven);
  TestValidator.equals(
    "the carrier view and posed geometry share film time",
    [
      tracked.frame.position.x,
      tracked.posed.affordances[0]?.frame.translation.x,
      tracked.posed.shapes?.[0]?.transform.position.x,
      absent.frame.position.x,
      absent.posed.affordances[0]?.frame.translation.x,
    ],
    [18, 1 / 4, 1 / 2, 19, 3 / 8],
  );
  TestValidator.predicate(
    "the external pose owns missing colliders too",
    absent.posed.shapes === undefined,
  );
  TestValidator.equals("exactly one external pose per sample", modelReads, [2, 3]);
  TestValidator.equals(
    "the external pose bypasses articulation",
    drivenReads,
    [],
  );

  const swung: IAutoMovieMotionHumanPropReader.ISnapshot =
    HumanPerformancePropSnapshot(articulated, 2, frame, driven);
  const still: IAutoMovieMotionHumanPropReader.ISnapshot =
    HumanPerformancePropSnapshot(rigid, 2, frame, () => undefined);
  TestValidator.equals(
    "driven and rigid geometry stay in prop space",
    [
      swung.posed.affordances[0]?.frame.translation.x,
      swung.posed.shapes?.[0]?.transform.position.x,
      still.posed.affordances[0]?.frame.translation.x,
      still.posed.shapes?.[0]?.transform.position.x,
    ],
    [1, 5 / 4, 1 / 8, 3 / 8],
  );
  TestValidator.equals(
    "articulation uses the requested film time",
    drivenReads,
    [2],
  );

  const override: IAutoMovieMotionHumanProp = {
    ...moving,
    subject: "override",
    point: (_id, seconds) => ({
      point: x(32 + seconds),
      normal: { x: 0, y: 1, z: 0 },
      rotation: NEUTRAL,
    }),
  };
  const state: IAutoMovieMotionHumanPerformanceState = {
    props: new Map([[moving.subject, moving], [override.subject, override]]),
    schedule: { entries: [], duration: 4 },
    duration: 4,
    performers: [],
    people: new Map(),
    tethered: new Map(),
    anchors: new Map(),
    grips: new Map(),
    meetings: new Map(),
    laws: new Map(),
    riding: new Set(),
    obstacles: [],
    forces: [],
    cues: {},
    clipped: new Map(),
    layered: new Map(),
    intended: new Map(),
    blasts: [],
    strikes: [],
    resolving: false,
    demand: undefined,
    horizon: undefined,
    meeting: undefined,
    demandAnchor: undefined,
    flight: "staged",
    placements: 0,
    trial: undefined,
    handovers: new Map(),
    soft: new Map(),
    writers: new Map(),
    flights: new Map(),
    flying: new Map(),
    hits: undefined,
  };
  TestValidator.equals(
    "the named site shares the snapshot's film time and carrier frame",
    HumanPerformanceSite(state, moving.subject, "saddle", 2, frame).position,
    x(18 + 1 / 4),
  );
  TestValidator.equals(
    "an explicit world point owns the named site",
    HumanPerformanceSite(state, override.subject, "saddle", 3, frame).position,
    x(35),
  );
  TestValidator.error("the external payload can remove the named site", () =>
    HumanPerformanceSite(state, moving.subject, "saddle", 4, frame),
  );
  TestValidator.equals("one pose per demanded external site", modelReads, [
    2,
    3,
    2,
    4,
  ]);
}

/** The model's named seat and collider maintain a quarter-metre offset. */
function model(
  position: number,
  collider: boolean = true,
): IAutoMovieMotionHumanObject.IModel {
  return {
    affordances: [testAffordance("saddle", "seat", x(position))],
    ...(collider
      ? {
          shapes: (): IAutoMoviePhysicalShape[] => [
            {
              id: "seat-body",
              kind: "sphere",
              radius: 1 / 8,
              material: "seat",
              transform: { position: x(position + 1 / 4), rotation: NEUTRAL },
            },
          ],
        }
      : {}),
  };
}

/** A point on the X axis, in metres. */
function x(distance: number): IAutoMovieVector3 {
  return { x: distance, y: 0, z: 0 };
}
