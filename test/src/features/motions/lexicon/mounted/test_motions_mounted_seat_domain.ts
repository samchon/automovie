import { AutoMovieEngineQuaternion, AutoMovieEngineTransform, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPosture,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSeated,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  prepareMountMaterialSeat
} from "../../../../../../packages/motions/src/lexicon/internal/prepareMountMaterialSeat";
import {
  prepareMountSeat
} from "../../../../../../packages/motions/src/lexicon/internal/prepareMountSeat";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * The seat's front-edge rectangle is insufficient to place an astride pelvis.
 * On a 0.4 m deck with 0.015 m radius bars at either end, the 0.13 m deep
 * sagittal half-span leaves the socket between -0.255 m and -0.145 m.
 * A chair-style socket at -0.355 m is on the deck but its pelvis intersects
 * the cantle. The support patch and the two rod clearances must hold at the
 * prepared point. A selected socket just outside the deck front has a patch
 * that cannot support it, even with part of the pelvis on the deck. A round
 * pelvis that only touches at a point cannot bear
 * through the proposed surface patch. A skew rail obstructs only the front
 * of the admissible range even though its axis bounds cover the whole range.
 * The mount binding selects the matching
 * deck rather than a box with a conventional name, poses the actual stored
 * rider, and carries the selected socket through the named site's full turn
 * in one posed material observation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains pelvis-bearing eligibility from the actual deck, bar clearance and support patch, including named seat motion.
 * @evidence contracts/development/testing.md#behavioral-verification Tests a deck and two rod envelopes with finite negative fixtures, adds a skew obstruction and binds a stored articulated rider to the matching posed material.
 * @evidence contracts/development/testing.md#independent-expectations Known half-span and rod radius bound the solution between −0.255 and −0.145 m. The skew obstruction shortens only the forward limit, while point-only contact cannot carry a load.
 */
export async function test_motions_mounted_seat_domain(): Promise<void> {
  const origin: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: AutoMovieEngineQuaternion.identity(),
  };
  const pelvis: IAutoMoviePhysicalShape = {
    id: "pelvis",
    material: "rider",
    kind: "box",
    halfExtents: { x: 0.17, y: 0.06, z: 0.13 },
    transform: { ...origin, position: { x: 0, y: 0.06, z: 0 } },
  };
  const deck: IAutoMoviePhysicalShape = {
    id: "deck",
    material: "tack",
    kind: "box",
    halfExtents: { x: 0.15, y: 0.02, z: 0.2 },
    transform: { ...origin, position: { x: 0, y: -0.02, z: -0.2 } },
  };
  const rod = (id: string, z: number): IAutoMoviePhysicalShape => ({
    id,
    material: "tack",
    kind: "capsule",
    radius: 0.015,
    halfLength: 0.06,
    transform: {
      position: { x: 0, y: 0.03, z },
      rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
    },
  });
  const rear: IAutoMoviePhysicalShape = rod("cantle", -0.4);
  const front: IAutoMoviePhysicalShape = rod("pommel", 0);
  const input: prepareMountSeat.IInput = {
    deck: { pose: origin, shape: deck },
    pelvis: [{ pose: origin, shape: pelvis }],
    obstacles: [
      { pose: origin, shape: rear },
      { pose: origin, shape: front },
    ],
  };
  // One construction and subtraction round trip over sub-metre geometry.
  const roundoff: number = 64 * Number.EPSILON;
  const conventional: IAutoMovieRigidTransform = {
    ...origin,
    position: { x: 0, y: 0, z: -0.355 },
  };
  TestValidator.predicate(
    "a socket on the deck can still put the pelvis inside the cantle",
    conventional.position.z > -0.4 &&
      conventional.position.z < 0 &&
      nclose(
        AutoMovieEnginePhysics.physicalShapePairDistance(conventional, pelvis, origin, rear),
        -0.045,
        roundoff,
      ),
  );

  const seat: prepareMountSeat.ISeat = prepareMountSeat(input)!;
  const placed: IAutoMovieRigidTransform = { ...origin, position: seat.point };
  TestValidator.predicate(
    "the whole pelvis bears between the two real bar envelopes",
    nclose(seat.range[0], -0.255, roundoff) &&
      nclose(seat.range[1], -0.145, roundoff) &&
      nclose(seat.point.z, -0.2, roundoff) &&
      nclose(seat.point.y, 0, roundoff) &&
      nclose(
        AutoMovieEnginePhysics.physicalShapePairDistance(placed, pelvis, origin, deck),
        0,
        roundoff,
      ) &&
      nclose(
        AutoMovieEnginePhysics.physicalShapePairDistance(placed, pelvis, origin, rear),
        0.055,
        roundoff,
      ) &&
      nclose(
        AutoMovieEnginePhysics.physicalShapePairDistance(placed, pelvis, origin, front),
        0.055,
        roundoff,
      ),
  );

  TestValidator.predicate(
    "the patch bears only a socket whose projection it contains",
    prepareMountSeat.bears(input, seat.point) &&
      !prepareMountSeat.bears(input, { ...seat.point, z: 0.1 }),
  );

  TestValidator.predicate(
    "a point touch is refused as planar pelvis bearing",
    prepareMountSeat({
      ...input,
      pelvis: [
        {
          pose: origin,
          shape: {
            id: "pelvis",
            material: "rider",
            kind: "sphere",
            radius: 0.06,
            transform: pelvis.transform,
          },
        },
      ],
    }) === undefined,
  );

  // This rail runs from (0.16, 0.06, 0) to (0.35, 0.06, -0.17).
  // Its projected collision interval includes the entire seat range,
  // although the clear centre lies behind its oblique side face.
  const run: number = Math.hypot(0.19, 0.17);
  const skew: IAutoMoviePhysicalShape = {
    id: "skew",
    material: "tack",
    kind: "box",
    halfExtents: { x: 0.01, y: run / 2, z: 0.02 },
    transform: {
      position: { x: 0.255, y: 0.06, z: -0.085 },
      rotation: AutoMovieEngineQuaternion.multiply(
        AutoMovieEngineQuaternion.fromAxisAngle(
          { x: 0, y: 1, z: 0 },
          Math.atan2(0.19, -0.17) / AutoMovieEngineQuaternion.DEG2RAD,
        ),
        AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
      ),
    },
  };
  const narrowed: prepareMountSeat.ISeat = prepareMountSeat({
    ...input,
    obstacles: [...input.obstacles, { pose: origin, shape: skew }],
  })!;
  // The nearest corner reaches the oblique face when its distance to the
  // centreline is the crosswise half-width: z = -(0.01*0.17+0.01*run)/0.19.
  const last: number = -0.13 - (0.01 * 0.17 + 0.01 * run) / 0.19;
  // Demand the engine's 1 nm distance resolution scaled into the
  // longitudinal direction by the face normal's z component.
  const castPrecision: number = 1e-9 * (run / 0.19) + roundoff;
  TestValidator.predicate(
    `a skew rail leaves the rear boundary intact (got ${narrowed.range[0]})`,
    nclose(narrowed.range[0], -0.255, roundoff),
  );
  TestValidator.predicate(
    `a skew rail ends at its oblique obstruction (got ${narrowed.range[1]}, expected ${last})`,
    nclose(narrowed.range[1], last, castPrecision),
  );
  TestValidator.predicate(
    "a skew rail leaves the pelvis in clear bearing",
    AutoMovieEnginePhysics.physicalShapePairDistance(
      { ...origin, position: narrowed.point },
      pelvis,
      origin,
      skew,
    ) > 0,
  );

  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const live: IAutoMovieRigidTransform = {
    position: { x: 2, y: 1, z: 3 },
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const surface: IAutoMovieAffordance = {
    id: "riding-seat",
    kind: "seat",
    extent: null,
    frame: AutoMovieEngineTransform.identity(),
    width: 0.3,
    depth: 0.4,
    astride: true,
  };
  const tread = (id: string, x: number): IAutoMovieAffordance => ({
    id,
    kind: "stirrup",
    extent: null,
    frame: AutoMovieEngineTransform.of({ x, y: -0.66, z: -0.15 }, origin.rotation),
    width: 0.12,
    depth: 0.05,
  });
  const left: string = "near-iron";
  const right: string = "far-iron";
  const supports: IAutoMovieAffordance[] = [
    surface,
    tread(left, 0.36),
    tread(right, -0.36),
  ];
  const mounted: IAutoMovieMotionHumanSeated.ISeat = {
    at: live.position,
    yaw: 90,
    astride: true,
    carrier: "mount",
    point: surface.id,
    footrestPoints: { left, right },
  };
  let observed: number = 0;
  const reader: IAutoMovieMotionHumanPropReader = {
    prop: {
      subject: "mount",
      frame: origin,
      points: Object.fromEntries(
        supports.map((item: IAutoMovieAffordance) => [
          item.id,
          { point: item.frame.translation, normal: { x: 0, y: 1, z: 0 } },
        ]),
      ),
    },
    frame: () => origin,
    snapshot: (seconds: number): IAutoMovieMotionHumanPropReader.ISnapshot => {
      if (seconds !== 2) throw new Error("Wrong material observation time");
      ++observed;
      return {
        frame: live,
        posed: {
          affordances: supports,
          shapes: [
            {
              ...deck,
              id: "saddle",
              transform: { ...origin, position: { x: 0.6, y: 0.08, z: -0.2 } },
            },
            deck,
            rear,
            front,
          ],
        },
      };
    },
  };
  const final = (): Omit<IAutoMovieMotionHumanPosture, "limbs"> => ({
    root: origin.position,
    yaw: 90,
    pitch: 0,
    roll: 0,
    joints: {},
  });
  const goal: IAutoMovieVector3 | undefined = prepareMountMaterialSeat(
    { body, start: 2, prop: () => reader },
    mounted,
    final,
  );
  TestValidator.predicate(
    "the selected deck and actual rider follow the named seat frame",
    observed === 1 &&
      goal !== undefined &&
      nclose(goal.x, 1.8, roundoff) &&
      nclose(goal.y, 1, roundoff) &&
      nclose(goal.z, 3, roundoff),
  );
}
