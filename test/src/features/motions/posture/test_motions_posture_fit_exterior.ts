import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanQuadraticProgram,
  IAutoMoviePhysicalShape,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanBodyFit
} from "../../../../../packages/motions/src/posture/internal/HumanBodyFit";
import {
  HumanFitExterior
} from "../../../../../packages/motions/src/posture/internal/HumanFitExterior";
import {
  poseBones
} from "../../../../../packages/motions/src/posture/internal/poseBones";
import {
  resolveHumanPosture
} from "../../../../../packages/motions/src/posture/internal/resolveHumanPosture";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/** The two equal spheres' exactly representable radius, metres. */
const RADIUS: number = 1 / 8;

/** The positions' rounding through the rigid transforms, in metres. */
const POSITION_ROUNDOFF: number = 1e-12;

/** SCO's 0.0001 mm constraint accuracy expressed in metres. */
const REQUIRED_CONTACT_PRECISION: number = 1e-7;

/** The midpoint of the accepted contact interval, in millimetres. */
const HELD_GOAL_MM: number = (REQUIRED_CONTACT_PRECISION * 1000) / 2;

/** An untranslated rigid body and a joint with no turn. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };

/** No rotation. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** Equal-radius shape used for an independently known signed distance. */
const SPHERE: IAutoMoviePhysicalShape = {
  id: "sphere",
  material: "solid",
  kind: "sphere",
  radius: RADIUS,
  transform: { position: ZERO, rotation: IDENTITY },
};

/** Place the sphere, whose shape origin coincides with this frame. */
function frame(position: IAutoMovieVector3): IAutoMovieRigidTransform {
  return { position, rotation: IDENTITY };
}

/** A single fixed sphere supplied through the exterior fit contract. */
function surrounding(
  position: IAutoMovieVector3,
): IAutoMovieMotionHumanBodyFitTypes.IExterior {
  return {
    bones: new Set<AutoMovieHumanoidBone>(["hips"]),
    obstacles: [
      { subject: "fixture", part: "sphere", pose: frame(position), shapes: [SPHERE] },
    ],
  };
}

/**
 * The exterior fit reads an actual signed gap once, linearizes it about the
 * moving witness and refuses negative separation through its normal entry.
 *
 * Scenarios:
 *
 * 1. Two spheres spaced 3/16 m apart give a −1/16 m gap, a −1 derivative for
 *    body translation toward the obstacle and a 62.5 mm lower row bound.
 * 2. A distant pair has no row. A pair at exact tangency remains observable,
 *    and reading it does not change the earlier pair's returned value.
 * 3. The body fit moves one root coordinate outward. A second fit that can
 *    only turn the head admits exact touching and refuses a sub-band
 *    exterior penetration.
 * 4. A turned fixed frame holds a point on material Y and Z inside its
 *    lateral range, with the attained coordinates read independently.
 * 5. A named support reads the least of its two actual pairs beyond the
 *    influence, with an angular slope of −1/4 m per radian. An independent
 *    right-angle offset sphere touches its named support. An ordinary
 *    tangent pair cannot satisfy a separated named contact.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines exterior nonpenetration, signed linearization, exact tangency, fixed material coordinates and named-contact ownership.
 * @evidence contracts/development/testing.md#behavioral-verification Measures signed sphere gaps, calls an independent body fit with movable and locked axes, then evaluates named contacts with transformed geometry and decoy pairs.
 * @evidence contracts/development/testing.md#independent-expectations The authored sphere gap is −1/16 m with translation slope −1 and lower bound 62.5 mm. Named contact uses the stated actual collider group, including beyond the influence distance.
 */
export async function test_motions_posture_fit_exterior(): Promise<void> {
  const separation: number = 3 / 16;
  const read: HumanFitExterior.Reader = HumanFitExterior.prepare(
    surrounding({ x: separation, y: 0, z: 0 }).obstacles,
    1 / 16,
  );
  const at = (x: number): HumanFitExterior.IPair[] =>
    read([{ bone: "hips", pose: frame({ x, y: 0, z: 0 }), shapes: [SPHERE] }]);
  const overlapping: HumanFitExterior.IPair = at(0)[0]!;
  const row: IAutoMovieMotionHumanQuadraticProgram.IRow = HumanFitExterior.row(
    {
      index: [0],
      units: [1],
      price: 1,
      motions: [{ linear: { x: 1, y: 0, z: 0 }, angular: ZERO, moves: null }],
    },
    overlapping,
    1000,
  );
  TestValidator.predicate(
    "signed gap and its millimetre row agree with the two-sphere geometry",
    nclose(overlapping.contact.distance, -1 / 16, POSITION_ROUNDOFF) &&
      nclose(overlapping.contact.pointA.x, RADIUS, POSITION_ROUNDOFF) &&
      nclose(row.coef[0]!, -1000, POSITION_ROUNDOFF) &&
      nclose(row.l, 62.5, POSITION_ROUNDOFF),
  );
  TestValidator.predicate(
    "far pairs are pruned while exact zero and previous readings survive",
    at(-1).length === 0 &&
      at(-1 / 16)[0]?.contact.distance === 0 &&
      overlapping.contact.distance === -1 / 16,
  );

  const fixture: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const body: IAutoMovieMotionHumanBody = {
    ...fixture,
    colliders: {
      bones: new Set<AutoMovieHumanoidBone>(["hips"]),
      segments: [{ bone: "hips", offset: ZERO, rotation: IDENTITY, shapes: [SPHERE] }],
    },
  };
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: body.measure.hipHeight, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { leftUpperArm: [0, 25, 0], rightUpperArm: [0, 25, 0] },
    limbs: {},
  };
  const hip: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, posture),
  ).get("hips")!.worldPosition;
  const fitted: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
    body,
    posture,
    variables: [{ kind: "place", axis: "x" }],
    exterior: surrounding({ ...hip, x: hip.x + separation }),
  });
  const axialGap: number = separation - fitted.posture.root.x - 2 * RADIUS;
  TestValidator.predicate(
    "the exterior row moves the preferred root outward to the physical boundary",
    nclose(fitted.posture.root.x, -1 / 16, HumanBodyFit.TOLERANCE) &&
      fitted.exteriorContacts === undefined &&
      fitted.feasible === (axialGap >= 0),
  );

  // The body has no way of moving its hips through this one head variable.
  const overlap: number = HumanBodyFit.TOLERANCE / 8;
  const held = (gap: number): IAutoMovieMotionHumanBodyFitTypes.IResult =>
    HumanBodyFit.fit({
      body,
      posture,
      variables: [{ kind: "angle", bone: "head", axis: 0 }],
      exterior: surrounding({ ...hip, x: hip.x + 2 * RADIUS + gap }),
    });
  const touching: IAutoMovieMotionHumanBodyFitTypes.IResult = held(0);
  const penetrating: IAutoMovieMotionHumanBodyFitTypes.IResult = held(-overlap);
  TestValidator.predicate(
    "exact zero holds while a locked negative gap inside the old row band fails",
    touching.feasible &&
      touching.exterior?.separation === 0 &&
      !penetrating.feasible &&
      penetrating.exterior?.bone === "hips" &&
      penetrating.exterior.subject === "fixture" &&
      penetrating.exterior.part === "sphere" &&
      nclose(penetrating.exterior.separation, -overlap, POSITION_ROUNDOFF) &&
      nclose(penetrating.posture.root.x, 0, POSITION_ROUNDOFF),
  );

  const carrier: IAutoMovieRigidTransform = {
    position: hip,
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const placed: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
    body,
    posture: { ...posture, root: { ...posture.root, z: 1 / 8 } },
    start: posture,
    variables: [
      { kind: "place", axis: "x" },
      { kind: "place", axis: "z" },
    ],
    targets: [
      {
        bone: "hips",
        frame: carrier,
        axes: ["y", "z"],
        goal: { x: 0, y: 0, z: 1 / 16 },
      },
      {
        bone: "hips",
        frame: carrier,
        axes: ["x"],
        goal: { x: -1 / 8, y: 0, z: 0 },
        bound: 1 / 16,
      },
    ],
  });
  const shown: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, placed.posture),
  ).get("hips")!.worldPosition;
  TestValidator.predicate(
    "the fit attains held material Y and Z within the real material X bound",
    placed.feasible &&
      placed.exterior === undefined &&
      nclose(shown.x - hip.x, 1 / 16, HumanBodyFit.TOLERANCE) &&
      nclose(shown.y, hip.y, POSITION_ROUNDOFF) &&
      nclose(shown.z - hip.z, 1 / 8, HumanBodyFit.TOLERANCE),
  );

  // The 0.244 mm seed error fits inside the first 1 mm trust step and the
  // old 0.25 mm soft band. A required contact must correct it.
  const seedMiss: number = 1 / 4096;
  const near: IAutoMovieMotionHumanPosture = {
    ...posture,
    root: { ...posture.root, x: 1 / 16 - seedMiss },
  };
  const required: IAutoMovieMotionHumanBodyFitTypes.ITarget = {
    bone: "hips",
    frame: carrier,
    axes: ["z"],
    goal: { x: 0, y: 0, z: 1 / 16 },
    required: true,
  };
  const corrected: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
    body,
    posture: near,
    variables: [{ kind: "place", axis: "x" }],
    targets: [required],
  });
  const locked: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
    body,
    posture: near,
    variables: [{ kind: "place", axis: "z" }],
    targets: [
      {
        bone: "hips",
        axes: ["x"],
        goal: { ...hip, x: hip.x + 1 / 16 },
        required: true,
      },
    ],
  });
  TestValidator.predicate(
    "a required contact corrects the old soft band or refuses a locked miss",
    corrected.feasible &&
      nclose(corrected.posture.root.x, 1 / 16, REQUIRED_CONTACT_PRECISION) &&
      !locked.feasible &&
      locked.reason === "failed" &&
      nclose(locked.posture.root.x, near.root.x, POSITION_ROUNDOFF),
  );

  const group: IAutoMovieMotionHumanBodyFitTypes.IExteriorContact = {
    bone: "hips",
    subject: "fixture",
    part: "sphere",
  };
  const offset: IAutoMoviePhysicalShape = {
    ...SPHERE,
    transform: frame({ x: 1 / 4, y: 0, z: 0 }),
  };
  const remote: IAutoMovieMotionHumanBodyFitTypes.IExterior = surrounding({
    x: 1 / 4,
    y: 0,
    z: -3 / 8,
  });
  const farther = surrounding({ x: 1 / 4, y: 0, z: -1 / 2 });
  const readHeld: HumanFitExterior.Reader = HumanFitExterior.prepare(
    [...farther.obstacles, ...remote.obstacles],
    1 / 16,
    [group],
  );
  const offsetPlaced: Parameters<HumanFitExterior.Reader>[0] = [
    { bone: "hips", pose: frame(ZERO), shapes: [offset] },
  ];
  const gaps: HumanFitExterior.IPair[] = readHeld(offsetPlaced);
  const angularStep: Parameters<typeof HumanFitExterior.row>[0] = {
    index: [0],
    units: [1],
    price: 1,
    motions: [{ linear: ZERO, angular: { x: 0, y: 1, z: 0 }, moves: null }],
  };
  const equality: IAutoMovieMotionHumanQuadraticProgram.IRow =
    HumanFitExterior.row(angularStep, gaps[0]!, 1000);
  TestValidator.predicate(
    "the distant group's nearest actual pair owns one angular equality",
    gaps.length === 1 &&
      gaps[0]!.held === true &&
      gaps[0]!.contact.distance === 1 / 8 &&
      nclose(equality.coef[0]!, -250, POSITION_ROUNDOFF) &&
      nclose(equality.l, -125 + HELD_GOAL_MM, POSITION_ROUNDOFF) &&
      equality.u === equality.l &&
      nclose(
        HumanFitExterior.miss(gaps[0]!),
        1 / 8 - REQUIRED_CONTACT_PRECISION / 2,
        POSITION_ROUNDOFF,
      ),
  );
  const overlappingGroups: HumanFitExterior.IPair[] = HumanFitExterior.prepare(
    remote.obstacles,
    1 / 16,
    [
      group,
      { ...group, bone: ["hips", "leftFoot"] },
      { ...group, bone: ["leftFoot", "hips"] },
      { ...group, bone: ["hips", "head"] },
    ],
  )([
    ...offsetPlaced,
    {
      bone: "leftFoot",
      pose: frame({ x: 0, y: 0, z: -1 / 8 }),
      shapes: [offset],
    },
    { bone: "head", pose: frame({ x: 0, y: 1, z: 0 }), shapes: [offset] },
  ]);
  TestValidator.predicate(
    "overlapping bone groups select their own least gap and share its row",
    overlappingGroups.length === 2 &&
      overlappingGroups.some(
        (pair) =>
          pair.bone === "hips" &&
          pair.held === true &&
          pair.contact.distance === 1 / 8,
      ) &&
      overlappingGroups.some(
        (pair) =>
          pair.bone === "leftFoot" &&
          pair.held === true &&
          pair.contact.distance === 0,
      ),
  );
  const nearby = surrounding({ x: 1 / 4, y: 0, z: -9 / 32 });
  const ordinary = {
    ...surrounding({ x: 1 / 4, y: 0, z: 1 / 4 }).obstacles[0]!,
    subject: "other",
  };
  const unmarked: HumanFitExterior.IPair = HumanFitExterior.prepare(
    [ordinary],
    1 / 16,
  )(offsetPlaced)[0]!;
  const interior: HumanFitExterior.IPair[] = HumanFitExterior.prepare(
    [...nearby.obstacles, ...remote.obstacles, ordinary],
    1 / 16,
    [group],
    { bones: remote.bones, distance: REQUIRED_CONTACT_PRECISION },
  )(offsetPlaced);
  const marked: IAutoMovieMotionHumanQuadraticProgram.IRow =
    HumanFitExterior.row(
      angularStep,
      interior.find((pair) => pair.subject === "other")!,
      1000,
    );
  const unchanged: IAutoMovieMotionHumanQuadraticProgram.IRow =
    HumanFitExterior.row(
      angularStep,
      interior.find((pair) => pair.held === true)!,
      1000,
    );
  TestValidator.predicate(
    "only selected ordinary pairs aim inside nonpenetration",
    HumanFitExterior.row(angularStep, unmarked, 1000).l === 0 &&
      nclose(marked.l, 0.0001, POSITION_ROUNDOFF) &&
      marked.u === Infinity &&
      nclose(unchanged.l, -31.25 + HELD_GOAL_MM, POSITION_ROUNDOFF) &&
      unchanged.u === unchanged.l,
  );
  TestValidator.predicate(
    "a named contact requires actual coincident names and a posed body shape",
    throwsError(
      () =>
        HumanFitExterior.prepare(remote.obstacles, 1 / 16, [
          { ...group, subject: "other" },
        ]),
      "Exterior contact part other.sphere has no collider",
    ) &&
      throwsError(() => readHeld([]), "Exterior contact bone hips has no posed collider"),
  );

  const turned: IAutoMovieMotionHumanPosture = { ...posture, yaw: 90 };
  const turnedBody: IAutoMovieMotionHumanBody = {
    ...body,
    colliders: {
      ...body.colliders,
      segments: [
        { bone: "hips", offset: ZERO, rotation: IDENTITY, shapes: [offset] },
      ],
    },
  };
  const turnedHip: IAutoMovieVector3 = poseBones(
    turnedBody,
    resolveHumanPosture(turnedBody, turned),
  ).get("hips")!.worldPosition;
  const tangent = surrounding({ ...turnedHip, z: turnedHip.z - 1 / 2 });
  const apart = surrounding({ ...turnedHip, z: turnedHip.z - 5 / 8 });
  const heldFit = (
    obstacles: IAutoMovieMotionHumanBodyFitTypes.IExterior["obstacles"],
  ): IAutoMovieMotionHumanBodyFitTypes.IResult =>
    HumanBodyFit.fit({
      body: turnedBody,
      posture: turned,
      variables: [{ kind: "angle", bone: "head", axis: 0 }],
      exterior: { ...tangent, obstacles, contacts: [group] },
    });
  const matches: IAutoMovieMotionHumanBodyFitTypes.IResult = heldFit(
    tangent.obstacles,
  );
  const decoy: IAutoMovieMotionHumanBodyFitTypes.IResult = heldFit([
    ...apart.obstacles,
    { ...tangent.obstacles[0]!, subject: "other" },
  ]);
  const witness = matches.exteriorContacts?.[0];
  TestValidator.predicate(
    "a rotated collider can bear on its named part and a tangent decoy cannot substitute",
    matches.feasible &&
      matches.exterior?.separation === 0 &&
      witness?.separation === 0 &&
      nclose(witness.normal.z, -1, POSITION_ROUNDOFF) &&
      nclose(witness.pointA.z, turnedHip.z - 3 / 8, POSITION_ROUNDOFF) &&
      nclose(witness.pointB.z, turnedHip.z - 3 / 8, POSITION_ROUNDOFF) &&
      !decoy.feasible &&
      decoy.exterior?.subject === "other" &&
      decoy.exterior.separation === 0 &&
      decoy.exteriorContacts?.length === 1 &&
      decoy.exteriorContacts[0]?.subject === "fixture" &&
      nclose(decoy.exteriorContacts[0].separation, 1 / 8, POSITION_ROUNDOFF),
  );
}
