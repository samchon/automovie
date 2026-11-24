import {
  type AutoMovieXpbdBody,
  Quaternion,
  Vector3,
  physicalIcpController,
  physicalStanceDemand,
  physicalSupportPoint,
} from "@automovie/engine";
import type {
  IAutoMovieCollectPhysicalSupports,
  IAutoMovieFootfallPattern,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalSimulationInput,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalBalanceReplay } from "../internal/PhysicalBalanceReplay";
import { PhysicalHumanProfiles } from "../internal/PhysicalHumanProfiles";

/** The quiet stance's recording: the canonical Human standing unpushed. */
const QUIET: string = "human_p0_z.json";

/**
 * How far the supports' load may stand from the body's weight, as a share of
 * it.
 */
const LOAD: number = 0.02;

/**
 * How far the shifted stance's lever share must stand from an even split for
 * the stance to count as a weight transfer.
 */
const SHARE: number = 0.03;

/** How far the mass center may move over `WINDOW`, metres. */
const DRIFT: number = 0.002;

/**
 * The window over which a quiet stance holds its mass center within `DRIFT`,
 * seconds.
 */
const WINDOW: number = 0.15;

/** The planted weight shift toward the right foot, along world x, metres. */
const SHIFT: number = -0.02;

/**
 * How far above a sole's lowest corner a corner still bears, metres: the
 * project's foot lift bound (`AutoMovieMotionHumanAuditLimits.lift`).
 */
const LIFT: number = 0.005;

/**
 * The canonical Human's stance demand asks its soles for its weight where its
 * mass center puts it (`physicalStanceDemand.demand`).
 *
 * The demand is computed, both feet flat and bearing on their planted poses,
 * the capture-point controller fresh and the body at rest at its authored mass
 * center, on two kinds of frame:
 *
 * - The last quiet frame of the unpushed recording (`human_p0_z`), with the
 *   profile it ran with (`PhysicalHumanProfiles`, `m-average`);
 * - Each stored body size's neutral standing pose, the average and the tall man
 *   (`m-average`, `m-tall`), lowered onto the floor by its soles' lowest
 *   corner, every segment planted where it stands.
 *
 * Scenarios:
 *
 * 1. The supports are asked for the body's weight.
 * 2. The mass center is asked to hold still: the demand's horizontal force is
 *    below what would move it `DRIFT` within `WINDOW` from rest.
 * 3. The commanded centre of pressure splits the weight as moment balance allows.
 *    A foot bears its load anywhere across its support, so two feet are
 *    statically indeterminate: moment balance about the line between them fixes
 *    the left share only within the band the mass center's place gives with
 *    each foot's load at either end of its footprint; the command's share, each
 *    foot's load at its contact centroid, lies in it.
 * 4. With the body above its planted soles moved 20 mm toward the right foot, its
 *    authored mass center with it, the command follows the shifted mass center:
 *    its share leaves the left foot the smaller part, as the lever share about
 *    the contact centroids does, and 1 to 3 hold as well. The quiet stance's
 *    own lean is toward the left foot, so a demand that kept its command
 *    fails.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, the two stances and what each demand must show.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalStanceDemand.demand` on the recorded bodies and planted poses and reads its force and commanded centre of pressure.
 * @evidence contracts/development/testing.md#independent-expectations The weight is the profile's mass times the recorded gravity; the drift bound is the constant acceleration a t^2 / 2 that moves the mass center `DRIFT` in `WINDOW`; the band follows from moment balance with the mass center computed from the recorded segments' centres and the profile's masses, and each footprint from the frame's measured sole points.
 * @evidence contracts/development/testing.md#distinguishing-cases A quiet and a shifted stance, the recorded one shifted against its own lean, on two body sizes, and a band that tells a balanced split from one foot bearing the body.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation over the stored profiles and the quiet recording in the repository; no figure built, no native world, viewer or simulation run.
 */
export async function test_physical_human_quiet_support(): Promise<void> {
  const failures: string[] = [];
  const quiet: PhysicalBalanceReplay.IFixture =
    await PhysicalBalanceReplay.load(QUIET);
  const profile: IAutoMoviePhysicalProfile = await PhysicalBalanceReplay.stored(
    {
      ...quiet,
      profile: await PhysicalHumanProfiles.load("m-average"),
    },
  );
  const record: PhysicalBalanceReplay.IRootRecord | undefined = [
    ...quiet.records,
  ]
    .reverse()
    .find(
      (
        candidate: PhysicalBalanceReplay.IRecord,
      ): candidate is PhysicalBalanceReplay.IRootRecord =>
        candidate.kind === "root",
    );
  if (record === undefined)
    throw new Error(`${QUIET} holds no root tracker's call`);
  const { segments, planted, center, supports } = record.input;
  if (planted === undefined || center === undefined)
    throw new Error(`${QUIET}'s root tracker's call holds no planted stance`);
  const recorded: IStanding = { segments, planted, center, supports };

  const shares = (label: string, by: number): IShares | undefined =>
    demand(
      quiet,
      profile,
      shift(recorded, profile, quiet, by),
      label,
      failures,
    );
  const follows = (label: string, shifted: IShares | undefined): void => {
    if (
      shifted &&
      !(
        Math.abs(shifted.lever - 0.5) > SHARE &&
        Math.sign(shifted.left - 0.5) === Math.sign(shifted.lever - 0.5)
      )
    )
      failures.push(
        `${label}: the command did not follow the shifted mass center ${JSON.stringify(shifted)}`,
      );
  };
  shares("quiet", 0);
  follows("shifted", shares("shifted", SHIFT));

  // Each body size's neutral standing pose, the same checks.
  for (const name of ["m-average", "m-tall"] as const) {
    const size: IAutoMoviePhysicalProfile =
      await PhysicalHumanProfiles.load(name);
    const stand: IStanding = standing(size, quiet);
    demand(quiet, size, stand, `${name} standing`, failures);
    follows(
      `${name} shifted`,
      demand(
        quiet,
        size,
        shift(stand, size, quiet, SHIFT),
        `${name} shifted`,
        failures,
      ),
    );
  }
  TestValidator.equals("Human quiet support and weight transfer", failures, []);
}

/**
 * A profile's neutral standing pose as a root tracker's input: every segment at
 * rest at its neutral pose, lowered so the support limbs' lowest sole corner is
 * on the floor, every segment planted where it stands, the authored mass center
 * the pose's own, and each support limb's bearing corners, those within `LIFT`
 * of the lowest, as its measured sole points.
 */
function standing(
  profile: IAutoMoviePhysicalProfile,
  fixture: PhysicalBalanceReplay.IFixture,
): IStanding {
  const limbs: IAutoMovieFootfallPattern["limbs"] =
    fixture.body.balance!.pattern.limbs;
  const corners = (
    bone: string,
    pose: IAutoMovieRigidTransform,
  ): IAutoMovieVector3[] =>
    profile.segments
      .filter(
        (segment: IAutoMoviePhysicalSegment): boolean => segment.bone === bone,
      )
      .flatMap((segment: IAutoMoviePhysicalSegment): IAutoMovieVector3[] =>
        [...segment.shapes, ...(segment.contactShapes ?? [])].flatMap(
          (shape: IAutoMoviePhysicalShape): IAutoMovieVector3[] =>
            vertices(shape).map(
              (point: IAutoMovieVector3): IAutoMovieVector3 =>
                physicalSupportPoint(
                  pose,
                  physicalSupportPoint(shape.transform, point),
                ),
            ),
        ),
      );
  const neutral = (bone: string): IAutoMovieRigidTransform =>
    profile.segments.find(
      (segment: IAutoMoviePhysicalSegment): boolean => segment.bone === bone,
    )!.neutral;
  const lowest: number = Math.min(
    ...limbs.flatMap((limb: IAutoMovieFootfallPattern["limbs"][number]) =>
      (limb.contacts ?? [limb.bone]).flatMap((bone: string): number[] =>
        corners(bone, neutral(bone)).map(
          (point: IAutoMovieVector3): number => point.y,
        ),
      ),
    ),
  );
  const pose = (bone: string): IAutoMovieRigidTransform => ({
    position: Vector3.add(neutral(bone).position, { x: 0, y: -lowest, z: 0 }),
    rotation: { ...neutral(bone).rotation },
  });
  const segments: Record<string, PhysicalBalanceReplay.ISegment> =
    Object.fromEntries(
      profile.segments.map(
        (
          segment: IAutoMoviePhysicalSegment,
        ): [string, PhysicalBalanceReplay.ISegment] => {
          const at: IAutoMovieRigidTransform = pose(segment.bone);
          return [
            segment.bone,
            {
              center: physicalSupportPoint(at, segment.centerOfMass),
              orientation: at.rotation,
              centerOfMass: { ...segment.centerOfMass },
              inertia: { ...segment.inertia },
              inertiaRotation: { ...segment.inertiaRotation },
              velocity: { x: 0, y: 0, z: 0 },
              angularVelocity: { x: 0, y: 0, z: 0 },
              dynamic: true,
            },
          ];
        },
      ),
    );
  return {
    segments,
    planted: Object.fromEntries(
      profile.segments.map((segment: IAutoMoviePhysicalSegment) => [
        segment.bone,
        pose(segment.bone),
      ]),
    ),
    center: centerOf(profile, segments),
    supports: limbs.map(
      (limb: IAutoMovieFootfallPattern["limbs"][number]): ISole => ({
        bone: limb.bone,
        points: (limb.contacts ?? [limb.bone])
          .flatMap((bone: string): IAutoMovieVector3[] =>
            corners(bone, pose(bone)),
          )
          .filter((point: IAutoMovieVector3): boolean => point.y <= LIFT),
      }),
    ),
  };
}

/**
 * A polytope collider's vertices in its own frame: a hull's points or a box's
 * corners.
 */
function vertices(shape: IAutoMoviePhysicalShape): IAutoMovieVector3[] {
  if (shape.kind === "hull") return shape.points;
  if (shape.kind !== "box") return [];
  const half: IAutoMovieVector3 = shape.halfExtents;
  return [-1, 1].flatMap((x: number): IAutoMovieVector3[] =>
    [-1, 1].flatMap((y: number): IAutoMovieVector3[] =>
      [-1, 1].map(
        (z: number): IAutoMovieVector3 => ({
          x: x * half.x,
          y: y * half.y,
          z: z * half.z,
        }),
      ),
    ),
  );
}

/**
 * The stance demand on one frame, checked; the command's left share, the lever
 * share and the band moment balance allows.
 */
function demand(
  fixture: PhysicalBalanceReplay.IFixture,
  profile: IAutoMoviePhysicalProfile,
  input: IStanding,
  label: string,
  failures: string[],
): IShares | undefined {
  const settings: PhysicalBalanceReplay.IFixture["settings"] = fixture.settings;
  const body: IAutoMoviePhysicalSimulationInput.IBody = {
    ...fixture.body,
    profile,
  };
  const stance: IAutoMovieFootfallPattern["limbs"] =
    fixture.body.balance!.pattern.limbs;
  const segments: Map<string, AutoMovieXpbdBody> =
    PhysicalBalanceReplay.segments(input.segments);
  const center: IAutoMovieVector3 = centerOf(profile, input.segments);
  const result: physicalStanceDemand.IResult | undefined =
    physicalStanceDemand.demand({
      settings,
      body,
      segments,
      stance,
      feet: Object.fromEntries(
        stance.map((limb: IAutoMovieFootfallPattern["limbs"][number]) => [
          limb.bone,
          { bearing: 1, flat: 1, ankle: ankleOf(profile, segments, limb.bone) },
        ]),
      ),
      planted: input.planted,
      center: input.center,
      velocity: { x: 0, y: 0, z: 0 },
      torque: { x: 0, y: 0, z: 0 },
      origin: center,
      strength: 1,
      icp: {
        state: physicalIcpController.create(),
        dt: 1 / settings.rate,
        swinging: false,
      },
    });
  if (result === undefined) {
    failures.push(`${label}: the stance made no demand`);
    return undefined;
  }
  const weight: number = profile.mass * -settings.gravity.y;
  if (Math.abs(result.force.y - weight) > weight * LOAD)
    failures.push(
      `${label}: the supports are asked ${result.force.y} N against ${weight} N`,
    );

  // A constant horizontal acceleration a moves the mass center a t^2 / 2 in
  // t from rest, so DRIFT over WINDOW bounds it by 2 DRIFT / WINDOW^2.
  const most: number = (profile.mass * 2 * DRIFT) / (WINDOW * WINDOW);
  const horizontal: number = Math.hypot(result.force.x, result.force.z);
  if (horizontal > most)
    failures.push(
      `${label}: the mass center is pushed by ${horizontal} N, more than ${most} N`,
    );

  // Moment balance about the line between the feet, with each foot bearing
  // its load anywhere across its own support: the left share is (c - r) /
  // (l - r) for some centre of pressure l on the left footprint and r on the
  // right, so it lies in the band those footprints' ends give.
  const footprint = (side: string): IAutoMovieVector3[] =>
    input.supports
      .filter((support: ISole): boolean => support.bone.startsWith(side))
      .flatMap((support: ISole): IAutoMovieVector3[] => support.points);
  const origin: IAutoMovieVector3 = mean(footprint("right"));
  const across: IAutoMovieVector3 = Vector3.subtract(
    mean(footprint("left")),
    origin,
  );
  across.y = 0;
  const along = (point: IAutoMovieVector3): number =>
    Vector3.dot(Vector3.subtract(point, origin), across) /
    Vector3.dot(across, across);
  const lever: number = along(center);
  const ends = (side: string): number[] => [
    Math.min(...footprint(side).map(along)),
    Math.max(...footprint(side).map(along)),
  ];
  const splits: number[] = ends("left").flatMap((l: number): number[] =>
    ends("right").map((r: number): number => (lever - r) / (l - r)),
  );
  const band: [number, number] = [Math.min(...splits), Math.max(...splits)];
  const left: number = along(result.pressure);
  if (!(left >= band[0] && left <= band[1]))
    failures.push(
      `${label}: the command leaves the left foot ${left} of the load, outside its moment-balance band ${JSON.stringify(band)}`,
    );
  return { left, lever, band };
}

/**
 * A root tracker's recorded input with every segment but the support limbs'
 * floor bodies moved along world x, and the authored mass center with them: the
 * body shifted over its planted soles, at rest at its shifted target.
 */
function shift(
  input: IStanding,
  profile: IAutoMoviePhysicalProfile,
  fixture: PhysicalBalanceReplay.IFixture,
  by: number,
): IStanding {
  const planted: Set<string> = new Set(
    fixture.body.balance!.pattern.limbs.flatMap(
      (limb: IAutoMovieFootfallPattern["limbs"][number]): string[] => [
        limb.bone,
        ...(limb.contacts ?? []),
      ],
    ),
  );
  const copy: IStanding = structuredClone(input);
  let moved: number = 0;
  for (const segment of profile.segments) {
    if (planted.has(segment.bone)) continue;
    copy.segments[segment.bone]!.center.x += by;
    moved += segment.mass;
  }
  copy.center.x += (by * moved) / profile.mass;
  return copy;
}

/** A limb's ankle joint centre, world metres, from its parent segment. */
function ankleOf(
  profile: IAutoMoviePhysicalProfile,
  segments: ReadonlyMap<string, AutoMovieXpbdBody>,
  bone: string,
): IAutoMovieVector3 {
  const joint: IAutoMoviePhysicalJoint = profile.joints.find(
    (candidate: IAutoMoviePhysicalJoint): boolean => candidate.child === bone,
  )!;
  const parent: AutoMovieXpbdBody = segments.get(joint.parent)!;
  return Vector3.add(
    parent.translation(),
    Quaternion.rotateVector(parent.rotation(), joint.parentFrame.position),
  );
}

/** The whole body's mass center from the recorded segments' centres. */
function centerOf(
  profile: IAutoMoviePhysicalProfile,
  segments: Readonly<Record<string, PhysicalBalanceReplay.ISegment>>,
): IAutoMovieVector3 {
  return profile.segments.reduce(
    (sum: IAutoMovieVector3, segment: IAutoMoviePhysicalSegment) =>
      Vector3.add(
        sum,
        Vector3.scale(
          segments[segment.bone]!.center,
          segment.mass / profile.mass,
        ),
      ),
    { x: 0, y: 0, z: 0 },
  );
}

/** The mean of points. */
function mean(points: readonly IAutoMovieVector3[]): IAutoMovieVector3 {
  return Vector3.scale(
    points.reduce(
      (sum: IAutoMovieVector3, point: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(sum, point),
      { x: 0, y: 0, z: 0 },
    ),
    1 / points.length,
  );
}

/** A support limb's measured sole points, world metres. */
type ISole = Pick<
  IAutoMovieCollectPhysicalSupports.ISupport,
  "bone" | "points"
>;

/** A standing frame as the stance demand reads it. */
interface IStanding {
  /** Each segment's state, by bone. */
  segments: Record<string, PhysicalBalanceReplay.ISegment>;
  /** The stance carriers' planted poses, by bone. */
  planted: Record<string, IAutoMovieRigidTransform>;
  /** The authored mass center, world metres. */
  center: IAutoMovieVector3;
  /** The support limbs' measured sole points. */
  supports: readonly ISole[];
}

/**
 * A stance's commanded left share, its lever share about the feet's contact
 * centroids, and the band moment balance allows it.
 */
interface IShares {
  /**
   * The left foot's share of the load at the commanded centre of pressure, each
   * foot's load at its contact centroid.
   */
  left: number;
  /**
   * The left share with the mass center's load split by its lever about the
   * contact centroids.
   */
  lever: number;
  /**
   * The least and greatest left share moment balance allows with each foot's
   * load anywhere on its footprint.
   */
  band: [number, number];
}
