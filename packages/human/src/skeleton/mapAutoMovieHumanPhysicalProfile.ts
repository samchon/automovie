import {
  Quaternion,
  Vector3,
  combinePhysicalMassProperties,
  validatePhysicalProfile,
} from "@automovie/engine";
import { quaternionFromAutoMovieBasis } from "@automovie/engine/math/quaternionFromAutoMovieBasis";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";

import type { AutoMovieHumanPhysicalProfile as Provider } from "./AutoMovieHumanPhysicalProfile";
import { AutoMovieHumanSegmentInertia as Anthropometry } from "./AutoMovieHumanSegmentInertia";
import type { IAutoMovieHumanPhysicalSource as Source } from "./IAutoMovieHumanPhysicalSource";
import { deriveAutoMovieHumanPhysicalJoints } from "./deriveAutoMovieHumanPhysicalJoints";

/**
 * Map a Human physical source to an articulated physical profile, purely from
 * the source and the caller's assumptions. De Leva (1996,
 * doi:10.1016/0021-9290(95)00178-6) whole-body mass fractions are normalized
 * over the regions present and distributed inside each region by the volume of
 * its declared solids. The head/neck, trunk, hands and feet are compound
 * regions; internal spine/girdle bones retain their portion of region mass.
 * Limbs with a published centre and gyration use them over the segment length;
 * boxes and other capsules use uniform-solid inertia, an approximation rather
 * than a measured individual scan. Equipment adds its declared mass, inertia
 * and collider; joints come from the source's coordinates.
 */
export function mapAutoMovieHumanPhysicalProfile(
  source: Source,
  options: Provider.IOptions,
): P {
  if (
    !(options.mass > 0) ||
    !Number.isFinite(options.mass) ||
    !(options.frequency > 0) ||
    !Number.isFinite(options.frequency) ||
    !(options.torquePerKg > 0) ||
    !Number.isFinite(options.torquePerKg) ||
    options.dampingRatio < 0 ||
    !Number.isFinite(options.dampingRatio)
  )
    throw new Error("Invalid Human physical mass or actuator assumptions");
  const reference: Readonly<
    Record<Anthropometry.Region, Anthropometry.IRecord>
  > = source.sex === "female" ? Anthropometry.female : Anthropometry.male;
  const table: (region: string) => Anthropometry.IRecord = (
    region: string,
  ): Anthropometry.IRecord =>
    reference[region.replace(/^(left|right)/u, "") as Anthropometry.Region];
  const prepared: IPreparedSegment[] = source.segments.map(
    (segment: Source.ISegment): IPreparedSegment =>
      prepare(segment, options.skin),
  );

  // Each region's measured mass fraction, normalized over the present regions.
  const totals: Map<string, number> = new Map();
  for (const item of prepared)
    totals.set(item.region, (totals.get(item.region) ?? 0) + item.volume);
  const sumFractions: number = [...totals.keys()].reduce(
    (sum: number, name: string): number => sum + table(name).mass,
    0,
  );
  const segments: P.ISegment[] = prepared.map(
    (item: IPreparedSegment): P.ISegment => {
      const record: Anthropometry.IRecord = table(item.region);
      const mass: number =
        (options.mass * (record.mass / sumFractions) * item.volume) /
        totals.get(item.region)!;
      return {
        bone: item.segment.bone,
        neutral: item.segment.neutral,
        mass,
        ...inertia(item, record, mass),
        inertiaRotation: item.shape.transform.rotation,
        shapes: [item.shape],
      };
    },
  );

  // Declared equipment joins its segment as one rigid aggregate.
  for (const equipment of options.equipment) {
    const segment: P.ISegment | undefined = segments.find(
      (candidate: P.ISegment): boolean => candidate.bone === equipment.bone,
    );
    if (!segment || !(equipment.mass > 0) || !Number.isFinite(equipment.mass))
      throw new Error(`Invalid Human equipment ${equipment.bone}`);
    const aggregate: combinePhysicalMassProperties.IPart =
      combinePhysicalMassProperties([
        segment,
        { ...equipment, inertiaRotation: { x: 0, y: 0, z: 0, w: 1 } },
      ]);
    Object.assign(segment, aggregate);
    segment.shapes.push(structuredClone(equipment.shape));
  }
  const joints: P.IJoint[] = deriveAutoMovieHumanPhysicalJoints(
    source,
    segments,
    options,
  );
  const mass: number = segments.reduce(
    (sum: number, segment: P.ISegment): number => sum + segment.mass,
    0,
  );
  const centerOfMass: IAutoMovieVector3 = Vector3.scale(
    segments.reduce(
      (sum: IAutoMovieVector3, segment: P.ISegment): IAutoMovieVector3 =>
        Vector3.add(
          sum,
          Vector3.scale(
            Vector3.add(
              segment.neutral.position,
              Quaternion.rotateVector(
                segment.neutral.rotation,
                segment.centerOfMass,
              ),
            ),
            segment.mass,
          ),
        ),
      { x: 0, y: 0, z: 0 },
    ),
    1 / mass,
  );
  const profile: P = {
    id: "human",
    mass,
    centerOfMass,
    segments,
    joints,
    materials: structuredClone(options.materials),
    provenance:
      "de Leva 1996 young-adult mass fractions, limb centres and gyration radii, via Brubaker/Sigal/Fleet 2009 Tables 4-6. Rounded fractions normalized to input mass. Internal head/trunk/foot volume allocation and solid inertia are geometric estimates; foot boxes bound skeletal centres and girths, not a certified source-skin surface. Capsule girths and segment lengths come from this person's actual prepared Human. Actuator and equipment data are caller declarations; no individual inertia or injury claim.",
  };

  // A zero-length angular carrier separates these capsule owners in the
  // skeleton tree, but their solids represent one overlapping joint region.
  profile.collisionExclusions = [
    {
      a: "neck",
      b: "head",
      reason:
        "Connected neck and skull-base solids across the coincident atlas pivot.",
    },
    ...(["left", "right"] as const).flatMap(
      (side: "left" | "right"): { a: string; b: string; reason: string }[] => [
        {
          a: `${side}Shoulder`,
          b: `${side}UpperArm`,
          reason:
            "Overlapping shoulder capsule across the coincident scapular pivot.",
        },
        {
          a: `${side}LowerLeg`,
          b: `${side}Subtalar`,
          reason: "Overlapping ankle solids across the coincident foot pivot.",
        },
      ],
    ),
  ];
  const errors: string[] = validatePhysicalProfile(profile);
  if (errors.length)
    throw new Error(`Human physical profile: ${errors.join(", ")}`);
  return profile;
}

/** One provider segment before its measured regional mass is distributed by declared volume. */
interface IPreparedSegment {
  /** Source segment. */ segment: Source.ISegment;
  /** Anatomical mass-table region, retaining its own side. */ region: string;
  /** Effective segment length, metres. */ length: number;
  /** Bone-local collider centre, metres. */ local: IAutoMovieVector3;
  /** Declared collision approximation and material, in the bone's frame. */ shape: P.IShape;
  /** Exact volume of that declared solid approximation, cubic metres. */ volume: number;
}

/** Localize a source solid into its bone and measure its length and volume. */
function prepare(segment: Source.ISegment, material: string): IPreparedSegment {
  const region: string = /^(head|neck|atlas)$/u.test(segment.bone)
    ? "head"
    : /^(hips|spine|chest)$|Shoulder$|Scapula$/u.test(segment.bone)
      ? "trunk"
      : segment.bone.replace(/(Subtalar|Midfoot)$/u, "Foot");
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(
    segment.neutral.rotation,
  );
  if (segment.solid.kind === "box") {
    const e: IAutoMovieVector3 = segment.solid.halfExtents;
    if (!(e.x > 0 && e.y > 0 && e.z > 0))
      throw new Error(`Degenerate Human physical segment ${segment.bone}`);
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      inverse,
      Vector3.subtract(segment.solid.center, segment.neutral.position),
    );
    return {
      segment,
      region,
      length: e.x * 2,
      local,
      shape: {
        id: "surface",
        kind: "box",
        material,
        halfExtents: { ...e },
        transform: {
          position: local,
          rotation: Quaternion.multiply(inverse, segment.solid.rotation),
        },
      },
      volume: 8 * e.x * e.y * e.z,
    };
  }

  // A capsule runs from the joint to the segment end, centred midway.
  const displacement: IAutoMovieVector3 = Vector3.subtract(
    segment.solid.end,
    segment.neutral.position,
  );
  const length: number = Vector3.length(displacement);
  const radius: number = segment.radius;
  if (!Number.isFinite(length) || !(radius > 0))
    throw new Error(`Degenerate Human physical segment ${segment.bone}`);
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    inverse,
    Vector3.scale(displacement, 0.5),
  );
  const y: IAutoMovieVector3 =
    length > 0
      ? Vector3.normalize(Quaternion.rotateVector(inverse, displacement))
      : { x: 0, y: 1, z: 0 };
  const x: IAutoMovieVector3 = Vector3.normalize(
    Vector3.cross(
      Math.abs(y.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 },
      y,
    ),
  );
  const halfLength: number = Math.max(0, length / 2 - radius);
  return {
    segment,
    region,
    length,
    local,
    shape: {
      id: "surface",
      kind: "capsule",
      radius,
      halfLength,
      material,
      transform: {
        position: local,
        rotation: quaternionFromAutoMovieBasis(x, y, Vector3.cross(x, y)),
      },
    },
    volume:
      Math.PI * radius ** 2 * 2 * halfLength + (4 * Math.PI * radius ** 3) / 3,
  };
}

/**
 * A segment's centre of mass and principal inertia: the published limb centre
 * and gyration radii over the segment length where the table has them, else
 * the uniform solid's own inertia about its centre (box, or capsule as a
 * cylinder plus two hemispheres with their parallel-axis offsets).
 */
function inertia(
  item: IPreparedSegment,
  record: Anthropometry.IRecord,
  mass: number,
): Pick<P.ISegment, "centerOfMass" | "inertia"> {
  if (record.gyration && record.center !== undefined) {
    const radius: readonly [number, number, number] = record.gyration;
    return {
      centerOfMass: Vector3.scale(item.local, 2 * record.center),
      inertia: {
        x: mass * (item.length * radius[0]) ** 2,
        y: mass * (item.length * radius[2]) ** 2,
        z: mass * (item.length * radius[1]) ** 2,
      },
    };
  }
  if (item.shape.kind === "box") {
    const e: IAutoMovieVector3 = item.shape.halfExtents;
    return {
      centerOfMass: item.local,
      inertia: {
        x: (mass * (e.y ** 2 + e.z ** 2)) / 3,
        y: (mass * (e.x ** 2 + e.z ** 2)) / 3,
        z: (mass * (e.x ** 2 + e.y ** 2)) / 3,
      },
    };
  }
  const r: number = item.segment.radius;
  const h: number = item.shape.kind === "capsule" ? item.shape.halfLength : 0;
  const sphereMass: number =
    (mass * ((4 * Math.PI * r ** 3) / 3)) / item.volume;
  const cylinderMass: number = mass - sphereMass;
  const longitudinal: number =
    (cylinderMass * r ** 2) / 2 + 0.4 * sphereMass * r ** 2;
  const transverse: number =
    (cylinderMass * (3 * r ** 2 + 4 * h ** 2)) / 12 +
    sphereMass * (0.4 * r ** 2 + h ** 2 + 0.75 * h * r);
  return {
    centerOfMass: item.local,
    inertia: { x: transverse, y: longitudinal, z: transverse },
  };
}
