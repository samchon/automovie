import {
  AutoMovieMotionAudit as Audit,
  DEFAULT_HUMANOID_ROM,
  DEFAULT_JOINT_AXES,
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  jointToQuaternion,
  measurePhysicalJointLimits,
  scanJointRom,
} from "@automovie/engine";
import {
  AutoMovieHumanCanonicalBody,
  AutoMovieHumanCanonicalSolids,
} from "@automovie/human";
import type {
  AutoMovieClinicalAxis,
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieHumanCanonicalSolids,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMeasurePhysicalJointLimits,
  IAutoMovieMotionAudit,
  IAutoMoviePhysicalFrame,
  IAutoMoviePhysicalJoint,
  IAutoMoviePhysicalProfile,
  IAutoMoviePhysicalSegment,
  IAutoMoviePhysicalSegmentState,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, createHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanLaw } from "../internal/motionHumanLaw";
import type { IMotionHumanPerson } from "../internal/people/IMotionHumanPerson";
import { MOTION_HUMAN_PEOPLE } from "../internal/people/MOTION_HUMAN_PEOPLE";

/**
 * The canonical Human profile agrees with the sources its provider names.
 *
 * Scenarios:
 *
 * 1. Every Dempster group of Winter Table 4.1 carries its share of the measured
 *    mass, and the shares close to the whole body.
 * 2. The whole-body centre of mass equals the share-weighted, volume-weighted
 *    centroid of the drawn solids and phalanx capsules rebuilt from the
 *    published joints.
 * 3. Every hull collider is one drawn solid at its world place, every drawn solid
 *    is used once on its carrier, and every phalanx capsule spans its joint to
 *    its child joint or fingertip at the joint's girth radius.
 * 4. Each clinical range-of-motion end, posed through the displayed
 *    clinical-to-rig conversion, lies on its physical axis limit: no excess at
 *    the end, the full excess two degrees beyond it, and no rotation leaking
 *    onto another physical axis. A joint gated by swing and twist (the
 *    shoulders, the thumbs' bases) is held on the displayed gate instead, whose
 *    clinical box is a reading only: each end of its twist interval reads no
 *    excess and no swing, the full twist excess two degrees beyond it, and
 *    every clinical end, at it and two degrees beyond it, reads natively
 *    exactly what the displayed gate reads of the same angles.
 * 5. The motion audit measures floor clearance on the profile's colliders: a floor
 *    one millimetre above the lowest collider point is a finding, one
 *    millimetre below it is not, although every bone origin stays above both.
 *
 * Mass, centre and collider positions are evaluated in the displayed T-pose
 * rest geometry. Joint limits are evaluated on the native joint coordinates the
 * simulation enforces, read from displayed frames. Rest-pose self-contact
 * between non-adjacent segments belongs to the support work of #3092.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Prepares an actual canonical Human, checks the settled public Stand at both thumb hinges, poses ROM ends through the rig's own axes and measures them with `measurePhysicalJointLimits`, and runs `AutoMovieMotionAudit` on the profile against two floors.
 * @evidence contracts/development/testing.md#independent-expectations Shares are Winter Table 4.1 literals with de Leva's head share. The centre and colliders are rebuilt from `AutoMovieHumanCanonicalSolids.build` and the published joints with closed-form capsule volume and centroid, not from the provider's mass combination. Joint expectations are the clinical ROM table posed through the display conversion; a bone the ROM table gates by swing and twist has the gate as its displayed limit, so its box ends are not limits there (the box premise does not hold for it), and its expectations are the gate's twist interval and the displayed gate's own reading (`scanJointRom.overshoot`) of each posed end. The audit floors come from the lowest rebuilt collider point.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers every mass group, both collider kinds, each ROM end inside and two degrees outside its limit, off-axis leakage, a gated joint's twist ends and its box ends against the displayed gate, and a floor on each side of the lowest collider point while bone origins stay above both. Native tracking and refusals belong to test_physical_human_profile, drawn-surface fidelity to test_human_canonical_solids_surface.
 * @evidence contracts/development/testing.md#execution-ownership The portable unit test test_physical_human_profile_sources prepares one installed canonical body in memory and calls public Engine and Human entries with no simulation, viewer or file host.
 * @evidence contracts/development/common.md#meaningful-documentation Documents the five source comparisons, their reference sources and which tolerances belong to displayed geometry and which to native joint coordinates.
 */
export async function test_physical_human_profile_sources(): Promise<void> {
  const person: IMotionHumanPerson = MOTION_HUMAN_PEOPLE["m-average"];
  const body: IAutoMovieHumanCanonicalBody.IBody =
    AutoMovieHumanCanonicalBody.prepare(person.params, {
      mass: person.mass,
      id: "m-average",
    });
  const profile: IAutoMoviePhysicalProfile = body.profile;
  standThumbHinges(body);
  const joints: Map<string, IAutoMovieHumanCanonicalSolids.IJoint> = new Map(
    body.joints.map(
      (
        joint: IAutoMovieHumanCanonicalBody.IJoint,
      ): [string, IAutoMovieHumanCanonicalSolids.IJoint] => [
        joint.bone,
        {
          parent: joint.parent,
          carrier: joint.carrier,
          position: vector(joint.position),
          tip: joint.tip === null ? null : vector(joint.tip),
          radius: joint.radius,
        },
      ],
    ),
  );
  const segment = (bone: string): IAutoMoviePhysicalSegment => {
    const found: IAutoMoviePhysicalSegment | undefined = profile.segments.find(
      (candidate: IAutoMoviePhysicalSegment): boolean =>
        candidate.bone === bone,
    );
    if (found === undefined) throw new Error(`No profile segment ${bone}`);
    return found;
  };

  // 1. Dempster shares (Winter, Table 4.1) with de Leva's (1996) head.
  const groups: IGroup[] = [
    { share: 0.142, bones: ["hips"] },
    { share: 0.139, bones: ["spine"] },
    { share: 0.216, bones: ["chest"] },
    { share: 0.081 - 0.0694, bones: ["neck"] },
    { share: 0.0694, bones: ["head"] },
    ...(["left", "right"] as const).flatMap((side: string): IGroup[] => [
      { share: 0.028, bones: [`${side}UpperArm`] },
      { share: 0.016, bones: [`${side}LowerArm`] },
      {
        share: 0.006,
        bones: [
          `${side}Hand`,
          ...DIGITS.flat().map((name: string): string => `${side}${name}`),
        ],
      },
      { share: 0.1, bones: [`${side}UpperLeg`] },
      { share: 0.0465, bones: [`${side}LowerLeg`] },
      { share: 0.0145, bones: [`${side}Foot`, `${side}Toes`] },
    ]),
  ];
  const massDefects: string[] = [];
  const grouped: Set<string> = new Set(
    groups.flatMap((g: IGroup): string[] => g.bones),
  );
  for (const group of groups) {
    const total: number = group.bones.reduce(
      (sum: number, bone: string): number => sum + segment(bone).mass,
      0,
    );
    if (!close(total, group.share * person.mass, 1e-9))
      massDefects.push(
        `${group.bones[0]} group mass ${total} kg, share ${group.share}`,
      );
  }
  for (const s of profile.segments)
    if (!grouped.has(s.bone)) massDefects.push(`${s.bone} belongs to no share`);
  if (!close(profile.mass, person.mass, 1e-9))
    massDefects.push(
      `whole mass ${profile.mass} kg, measured ${person.mass} kg`,
    );
  TestValidator.equals(
    "Dempster groups carry their measured shares",
    massDefects,
    [],
  );

  // 2-3. Rebuild every collider from the drawn joints and compare.
  const solids: IAutoMovieHumanCanonicalSolids.ISolid[] =
    AutoMovieHumanCanonicalSolids.build(joints);
  const parts: Map<string, IPart[]> = new Map();
  const put = (bone: string, part: IPart): void => {
    parts.set(bone, [...(parts.get(bone) ?? []), part]);
  };
  for (const solid of solids)
    put(solid.carrier, {
      volume: solid.volume,
      centroid: solid.centre,
      solid,
    });
  for (const side of ["left", "right"] as const)
    for (const chain of DIGITS)
      chain.forEach((name: string, index: number): void => {
        const bone: string = `${side}${name}`;
        const joint: IAutoMovieHumanCanonicalSolids.IJoint = joints.get(bone)!;
        const next: string | undefined = chain[index + 1];
        const tip: boolean = next === undefined && joint.tip !== null;
        const end: IAutoMovieVector3 =
          next === undefined
            ? (joint.tip ?? joint.position)
            : joints.get(`${side}${next}`)!.position;
        const span: number = distance(joint.position, end);
        const to: IAutoMovieVector3 = tip
          ? lerp(
              joint.position,
              end,
              (span - Math.min(joint.radius, span)) / span,
            )
          : end;
        const length: number = distance(joint.position, to);
        put(bone, {
          volume:
            Math.PI * joint.radius ** 2 * length +
            (4 / 3) * Math.PI * joint.radius ** 3,
          centroid: lerp(joint.position, to, 0.5),
          capsule: {
            from: joint.position,
            to,
            radius: joint.radius,
            reach: end,
            tip,
          },
        });
      });

  const moment: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const group of groups) {
    const members: IPart[] = group.bones.flatMap(
      (bone: string): IPart[] => parts.get(bone) ?? [],
    );
    const volume: number = members.reduce(
      (sum: number, part: IPart): number => sum + part.volume,
      0,
    );
    for (const part of members) {
      const mass: number = (group.share * person.mass * part.volume) / volume;
      moment.x += mass * part.centroid.x;
      moment.y += mass * part.centroid.y;
      moment.z += mass * part.centroid.z;
    }
  }
  const centre: IAutoMovieVector3 = {
    x: moment.x / person.mass,
    y: moment.y / person.mass,
    z: moment.z / person.mass,
  };
  const centreError: number = distance(centre, profile.centerOfMass);
  TestValidator.predicate(
    `profile centre lies on the rebuilt source centre (${centreError} m)`,
    centreError <= 1e-9,
  );

  const colliderDefects: string[] = [];
  const used: Set<string> = new Set();
  let lowest: number = Infinity;
  for (const s of profile.segments) {
    const expected: IPart[] = parts.get(s.bone) ?? [];
    if (expected.length !== s.shapes.length)
      colliderDefects.push(
        `${s.bone} has ${s.shapes.length} colliders, sources ${expected.length}`,
      );
    for (const shape of s.shapes) {
      const origin: IAutoMovieVector3 = add(
        s.neutral.position,
        Quaternion.rotateVector(s.neutral.rotation, shape.transform.position),
      );
      const rotation: IAutoMovieQuaternion = Quaternion.multiply(
        s.neutral.rotation,
        shape.transform.rotation,
      );
      if (shape.kind === "hull") {
        const source: IAutoMovieHumanCanonicalSolids.ISolid | undefined =
          expected.find(
            (part: IPart): boolean => part.solid?.id === shape.id,
          )?.solid;
        if (source === undefined) {
          colliderDefects.push(`${s.bone}/${shape.id} has no drawn solid`);
          continue;
        }
        used.add(source.id);
        let gap: number =
          source.points.length === shape.points.length ? 0 : Infinity;
        shape.points.forEach(
          (point: IAutoMovieVector3, index: number): void => {
            const world: IAutoMovieVector3 = add(
              origin,
              Quaternion.rotateVector(rotation, point),
            );
            lowest = Math.min(lowest, world.y);
            const drawn: IAutoMovieVector3 | undefined = source.points[index];
            gap = Math.max(
              gap,
              drawn ? distance(world, add(source.centre, drawn)) : Infinity,
            );
          },
        );
        if (!(gap <= 1e-9))
          colliderDefects.push(
            `${s.bone}/${shape.id} hull leaves its solid by ${gap} m`,
          );
      } else if (shape.kind === "capsule") {
        const capsule: IPart["capsule"] = expected.find(
          (part: IPart): boolean => part.capsule !== undefined,
        )?.capsule;
        if (capsule === undefined) {
          colliderDefects.push(`${s.bone} capsule has no phalanx source`);
          continue;
        }
        const axis: IAutoMovieVector3 = Quaternion.rotateVector(rotation, {
          x: 0,
          y: shape.halfLength,
          z: 0,
        });
        const ends: IAutoMovieVector3[] = [
          subtract(origin, axis),
          add(origin, axis),
        ];
        lowest = Math.min(
          lowest,
          ...ends.map((end: IAutoMovieVector3): number => end.y - shape.radius),
        );
        const [proximal, distal]: [IAutoMovieVector3, IAutoMovieVector3] =
          distance(ends[0]!, capsule.from) <= distance(ends[1]!, capsule.from)
            ? [ends[0]!, ends[1]!]
            : [ends[1]!, ends[0]!];
        const gap: number = Math.max(
          distance(proximal, capsule.from),
          distance(distal, capsule.to),
          Math.abs(shape.radius - capsule.radius),
        );
        if (!(gap <= 1e-9))
          colliderDefects.push(
            `${s.bone} capsule leaves its phalanx by ${gap} m`,
          );
        if (capsule.tip) {
          const reach: number = distance(proximal, distal) + shape.radius;
          if (!close(reach, distance(capsule.from, capsule.reach), 1e-9))
            colliderDefects.push(`${s.bone} capsule cap misses its fingertip`);
        }
      } else
        colliderDefects.push(
          `${s.bone}/${shape.id} is an unexpected ${shape.kind}`,
        );
    }
  }
  for (const solid of solids)
    if (!used.has(solid.id))
      colliderDefects.push(`drawn solid ${solid.id} collides nowhere`);
  TestValidator.equals(
    "colliders are the drawn solids and phalanges",
    colliderDefects,
    [],
  );

  // 4. Displayed ROM ends against native joint coordinates.
  const radian: number = Math.PI / 180;
  const beyond: number = 2;
  const romDefects: string[] = [];
  let posed: number = 0;
  for (const joint of profile.joints) {
    const bone: AutoMovieHumanoidBone = joint.child as AutoMovieHumanoidBone;
    const rom: IAutoMovieJointConstraint | undefined =
      DEFAULT_HUMANOID_ROM[bone];
    if (rom === undefined) continue;
    const basis =
      body.skeleton.bones.find((candidate) => candidate.bone === bone)?.axes ??
      HUMANOID_JOINT_AXES[bone] ??
      DEFAULT_JOINT_AXES;
    const pose = (
      angles: IAutoMovieJointPose,
    ): IAutoMovieMeasurePhysicalJointLimits.IResult =>
      measurePhysicalJointLimits(joint, REST, {
        position: REST.position,
        rotation: jointToQuaternion(angles, basis, HUMANOID_REST_FRAME[bone]),
      });
    const gate: IAutoMovieJointConstraint["swingTwist"] = rom.swingTwist;
    if (joint.range !== undefined && gate !== undefined && gate !== null) {
      // A joint gated by swing and twist is held on the displayed gate:
      // its twist ends lie on the native twist limit with no swing, and
      // every clinical end, at it and beyond it, reads natively what the
      // displayed gate reads of the same angles.
      for (const [end, outward] of [
        [gate.twist.min, -1],
        [gate.twist.max, 1],
      ] as const) {
        const at: IAutoMovieMeasurePhysicalJointLimits.IResult = pose(
          angles(bone, "twist", end),
        );
        posed++;
        const twist: number = at.find(
          (c: IAutoMovieMeasurePhysicalJointLimits.IResult[number]): boolean =>
            c.axis === "y",
        )!.violation;
        const swing: number = at.find(
          (c: IAutoMovieMeasurePhysicalJointLimits.IResult[number]): boolean =>
            c.axis === "x",
        )!.angle;
        if (!(twist <= 1e-9))
          romDefects.push(
            `${bone} gate twist ${end} deg exceeds by ${twist / radian} deg`,
          );
        if (!(Math.abs(swing) <= 1e-9))
          romDefects.push(
            `${bone} gate twist ${end} deg leaks ${swing / radian} deg onto the swing`,
          );
        if (Math.abs(end) + beyond >= 180) continue;
        const past: number = pose(
          angles(bone, "twist", end + outward * beyond),
        ).find(
          (c: IAutoMovieMeasurePhysicalJointLimits.IResult[number]): boolean =>
            c.axis === "y",
        )!.violation;
        if (!close(past, beyond * radian, 1e-9))
          romDefects.push(
            `${bone} gate twist ${beyond} deg past ${end} deg reads ${past / radian} deg excess`,
          );
      }
      for (const clinical of ["flexion", "abduction", "twist"] as const) {
        const range: IAutoMovieAngleRange | null | undefined = rom[clinical];
        if (range === null || range === undefined) continue;
        for (const value of [
          range.min,
          range.max,
          range.min - beyond,
          range.max + beyond,
        ]) {
          if (Math.abs(value) >= 180) continue;
          const posedAngles: IAutoMovieJointPose = angles(
            bone,
            clinical,
            value,
          );
          const native: number = pose(posedAngles).reduce(
            (
              sum: number,
              c: IAutoMovieMeasurePhysicalJointLimits.IResult[number],
            ): number => sum + c.violation,
            0,
          );
          const displayed: number =
            scanJointRom.overshoot(posedAngles, rom) * radian;
          posed++;
          if (!close(native, displayed, 1e-9))
            romDefects.push(
              `${bone}.${clinical} ${value} deg reads ${native / radian} deg natively, the displayed gate ${displayed / radian} deg`,
            );
        }
      }
      continue;
    }
    for (const clinical of ["flexion", "abduction", "twist"] as const) {
      const range: IAutoMovieAngleRange | null | undefined = rom[clinical];
      if (range === null || range === undefined) continue;
      const axis: IAutoMoviePhysicalJoint["axes"][number] | undefined =
        joint.axes.find(
          (candidate: IAutoMoviePhysicalJoint["axes"][number]): boolean =>
            candidate.channel === `${bone}.${clinical}`,
        );
      if (axis === undefined) {
        romDefects.push(`${bone}.${clinical} has no physical axis`);
        continue;
      }
      for (const [end, outward] of [
        [range.min, -1],
        [range.max, 1],
      ] as const) {
        const measure = (
          degrees: number,
        ): IAutoMovieMeasurePhysicalJointLimits.IResult =>
          pose(angles(bone, clinical, degrees));
        const at: IAutoMovieMeasurePhysicalJointLimits.IResult = measure(end);
        posed++;
        const own: IAutoMovieMeasurePhysicalJointLimits.IResult[number] =
          at.find(
            (
              c: IAutoMovieMeasurePhysicalJointLimits.IResult[number],
            ): boolean => c.axis === axis.axis,
          )!;
        if (!(own.violation <= 1e-9))
          romDefects.push(
            `${bone}.${clinical} ${end} deg exceeds ${axis.axis} by ${own.violation / radian} deg`,
          );
        for (const other of at)
          if (other.axis !== axis.axis && Math.abs(other.angle) > 1e-9)
            romDefects.push(
              `${bone}.${clinical} ${end} deg leaks ${other.angle / radian} deg onto ${other.axis}`,
            );
        if (Math.abs(end) + beyond >= 180) continue;
        const past: IAutoMovieMeasurePhysicalJointLimits.IResult = measure(
          end + outward * beyond,
        );
        const excess: number = past.find(
          (c: IAutoMovieMeasurePhysicalJointLimits.IResult[number]): boolean =>
            c.axis === axis.axis,
        )!.violation;
        if (!close(excess, beyond * radian, 1e-9))
          romDefects.push(
            `${bone}.${clinical} ${beyond} deg past ${end} deg reads ${excess / radian} deg excess`,
          );
      }
    }
  }
  TestValidator.predicate("the ROM table reaches native joints", posed > 0);
  TestValidator.equals(
    "displayed ROM ends lie on native limits",
    romDefects,
    [],
  );

  // 5. The audit reads the profile's colliders, not bone origins.
  const origins: number = Math.min(
    ...profile.segments.map(
      (s: IAutoMoviePhysicalSegment): number => s.neutral.position.y,
    ),
  );
  const millimetre: number = 0.001;
  TestValidator.predicate(
    "bone origins stand above both audited floors",
    origins > lowest + millimetre,
  );
  const frame: IAutoMoviePhysicalFrame = {
    seconds: 0,
    bodies: {
      [profile.id]: Object.fromEntries(
        profile.segments.map(
          (
            s: IAutoMoviePhysicalSegment,
          ): [string, IAutoMoviePhysicalSegmentState] => [
            s.bone,
            {
              position: s.neutral.position,
              rotation: s.neutral.rotation,
              velocity: { x: 0, y: 0, z: 0 },
              angularVelocity: { x: 0, y: 0, z: 0 },
            },
          ],
        ),
      ),
    },
  };
  const audit = async (
    floor: number,
  ): Promise<IAutoMovieMotionAudit.IFinding[]> =>
    (
      await Audit.run({
        bodies: [
          {
            id: profile.id,
            profile,
            speeds: {},
            supports: [],
            floorTolerance: 0,
            overlapTolerance: 0,
            jointTolerance: Math.PI,
          },
        ],
        start: 0,
        end: 0,
        rate: 1,
        floor,
        sample: (): IAutoMoviePhysicalFrame => frame,
        allowed: (): boolean => false,
      })
    ).findings.filter(
      (finding: IAutoMovieMotionAudit.IFinding): boolean =>
        finding.kind === "floor",
    );
  const raised: IAutoMovieMotionAudit.IFinding[] = await audit(
    lowest + millimetre,
  );
  const lowered: IAutoMovieMotionAudit.IFinding[] = await audit(
    lowest - millimetre,
  );
  const deepest: number = Math.max(
    0,
    ...raised.map(
      (finding: IAutoMovieMotionAudit.IFinding): number => finding.actual,
    ),
  );
  TestValidator.predicate(
    `a floor above the lowest collider is found (${deepest} m)`,
    close(deepest, millimetre, 1e-6),
  );
  TestValidator.equals("a floor below every collider is clear", lowered, []);
}

/** One provider mass share and the rig bones it spreads over. */
interface IGroup {
  share: number;
  bones: string[];
}

/** Read the thumb hinges from the same settled public Stand sent to the handoff. */
function standThumbHinges(body: IAutoMovieHumanCanonicalBody.IBody): void {
  const subject: string = body.profile.id;
  const film: motionHumanLaw.IFilm = motionHumanLaw.perform(
    "physical-support-geometry",
    [{ subject, body: createHumanBody(body.skeleton, body.profile) }],
    HumanChain.subject(subject).stand({ hold: 1, sway: 0 }),
  );
  const settled: number = motionHumanLaw.event(film, "settled", subject);
  const displayed: motionHumanLaw.Bones = film.bones(
    subject,
    settled + (film.duration - settled) / 2,
  );
  const at = (name: string) => {
    const bone = displayed.get(name as AutoMovieHumanoidBone)!;
    return { position: bone.worldPosition, rotation: bone.worldRotation };
  };
  const defects = body.profile.joints.flatMap((joint) =>
    measurePhysicalJointLimits(joint, at(joint.parent), at(joint.child))
      .filter(({ violation }) => violation > 1e-9)
      .map((coordinate) => ({ joint: joint.child, ...coordinate })),
  );
  TestValidator.predicate(
    `settled Stand thumb flexion fits the native hinges (${JSON.stringify(defects)})`,
    defects.every(({ joint }) => !/Thumb(Proximal|Distal)$/.test(joint)),
  );
}

/** One rebuilt collider source with its uniform-solid volume and world centroid. */
interface IPart {
  volume: number;
  centroid: IAutoMovieVector3;
  solid?: IAutoMovieHumanCanonicalSolids.ISolid;
  capsule?: {
    from: IAutoMovieVector3;
    to: IAutoMovieVector3;
    radius: number;
    reach: IAutoMovieVector3;
    tip: boolean;
  };
}

/** The thumb and finger phalanx chains of one hand, by rig name. */
const DIGITS: readonly (readonly string[])[] = [
  ["ThumbMetacarpal", "ThumbProximal", "ThumbDistal"],
  ...["Index", "Middle", "Ring", "Little"].map((d: string): string[] => [
    `${d}Proximal`,
    `${d}Intermediate`,
    `${d}Distal`,
  ]),
];

/** A joint's clinical angles with one axis set and the others at rest. */
function angles(
  bone: AutoMovieHumanoidBone,
  clinical: AutoMovieClinicalAxis,
  degrees: number,
): IAutoMovieJointPose {
  return {
    bone,
    flexion: null,
    abduction: null,
    twist: null,
    [clinical]: degrees,
  };
}

/** A parent frame at the origin with identity rotation. */
const REST: { position: IAutoMovieVector3; rotation: IAutoMovieQuaternion } = {
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
};

function vector(tuple: [number, number, number]): IAutoMovieVector3 {
  return { x: tuple[0], y: tuple[1], z: tuple[2] };
}

function add(a: IAutoMovieVector3, b: IAutoMovieVector3): IAutoMovieVector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subtract(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): IAutoMovieVector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function lerp(
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
  t: number,
): IAutoMovieVector3 {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t,
  };
}

function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function close(a: number, b: number, relative: number): boolean {
  return Math.abs(a - b) <= relative * Math.max(1, Math.abs(a), Math.abs(b));
}
