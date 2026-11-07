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

import type { IAutoMovieHumanParameters } from "../structures/IAutoMovieHumanParameters";
import { AutoMovieHumanPhysicalFootShape } from "./AutoMovieHumanPhysicalFootShape";
import { AutoMovieHumanSegmentInertia as Anthropometry } from "./AutoMovieHumanSegmentInertia";
import { AutoMovieHumanSkeleton as Skeleton } from "./AutoMovieHumanSkeleton";
import { deriveAutoMovieHumanPhysicalJoints } from "./deriveAutoMovieHumanPhysicalJoints";

/**
 * Human provider with de Leva (1996, doi:10.1016/0021-9290(95)00178-6)
 * whole-body mass fractions. Girth comes from the same prepared skeleton as
 * Human limb capsules. The head/neck, trunk, hands and feet are compound
 * regions; internal spine/girdle bones retain their portion of region mass.
 * Volume fractions distribute each region's measured mass, and uniform-solid
 * inertia is an approximation, not a measured individual anthropometric scan.
 */
export namespace AutoMovieHumanPhysicalProfile {
  /** Equipment adds explicit mass, inertia and local collision geometry. */
  export interface IEquipment {
    /** Canonical segment owning the equipment. */ bone: string;
    /** Added kilograms. */ mass: number;
    /** Equipment's bone-local centre, metres. */ centerOfMass: IAutoMovieVector3;
    /** Principal inertia, kg m², aligned with the bone. */ inertia: IAutoMovieVector3;
    /** One retained collider; own id must be unique on the segment. */ shape: P.IShape;
  }
  /** Provider parameters retain the caller's mass and actuator assumptions. */
  export interface IOptions {
    /** Bare body mass, kg, not an inferred BMI. */ mass: number;
    /** Joint PD natural frequency, radians/second. */ frequency: number;
    /** Critical-damping ratio; nonnegative. */ dampingRatio: number;
    /** Maximum actuator torque per kg of downstream segment, N m/kg. */ torquePerKg: number;
    /** Passive angular decay rate, 1/s; zero by default, retained after tracking withdrawal. */ passiveRate?: number;
    /** Explicit gloves, shoes or other rigid equipment. */ equipment: IEquipment[];
    /** Contact materials, including skin and equipment ids. */ materials: P.IMaterial[];
    /** Material id for bare surfaces. */ skin: string;
  }
  /** Build from the actual numerical FK, with canonical ROM rather than copied bounds. */
  export function create(
    parameters: IAutoMovieHumanParameters,
    options: IOptions,
  ): P {
    return prepare(parameters, options).profile;
  }
  /** Share the same fixed person's numerical evaluator; a borrowed evaluator must have been prepared from these exact parameters. */
  export function prepare(
    parameters: IAutoMovieHumanParameters,
    options: IOptions,
    preparedEvaluator?: Skeleton.PoseEvaluator,
  ): { profile: P; evaluate: Skeleton.PoseEvaluator } {
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
    const evaluate: Skeleton.PoseEvaluator =
      preparedEvaluator ?? Skeleton.prepare(parameters);
    const output: Skeleton.IOutput = evaluate({});
    const point: (value: readonly number[]) => IAutoMovieVector3 = (
      value: readonly number[],
    ): IAutoMovieVector3 => ({ x: value[0]!, y: value[1]!, z: value[2]! });
    const rotation: (value: readonly number[]) => IAutoMovieQuaternion = (
      value: readonly number[],
    ): IAutoMovieQuaternion => ({
      x: value[0]!,
      y: value[1]!,
      z: value[2]!,
      w: value[3]!,
    });
    const kept: Skeleton.IBone[] = output.bones.filter(
      (bone: (typeof output.bones)[number]): boolean =>
        /^(hips|spine|chest|neck|atlas|head)$|^(left|right)(Shoulder|Scapula|UpperArm|LowerArm|Hand|UpperLeg|LowerLeg|Foot|Subtalar|Midfoot)$/u.test(
          bone.bone,
        ),
    );
    const positions: Map<string, IAutoMovieVector3> = new Map(
      output.posed.map(
        (
          placement: (typeof output.posed)[number],
        ): [string, IAutoMovieVector3] => [
          placement.bone,
          point(placement.position),
        ],
      ),
    );
    const neutral: Map<string, P.ITransform> = new Map(
      output.posed.map(
        (placement: (typeof output.posed)[number]): [string, P.ITransform] => [
          placement.bone,
          {
            position: point(placement.position),
            rotation: rotation(placement.rotation),
          },
        ],
      ),
    );
    const female: boolean = parameters.body.anatomy.sex === "female";
    const reference: Readonly<
      Record<Anthropometry.Region, Anthropometry.IRecord>
    > = female ? Anthropometry.female : Anthropometry.male;
    const fractions: Record<string, number> = Object.fromEntries(
      Object.entries(reference).map(
        ([region, value]: [string, Anthropometry.IRecord]): [
          string,
          number,
        ] => [region, value.mass],
      ),
    );
    const region: (bone: string) => string = (bone: string): string =>
      /^(head|neck|atlas)$/u.test(bone)
        ? "head"
        : /^(hips|spine|chest)$|Shoulder$|Scapula$/u.test(bone)
          ? "trunk"
          : bone.replace(/(Subtalar|Midfoot)$/u, "Foot");
    const prepared: IPreparedSegment[] = kept.map(
      (bone: (typeof kept)[number]): IPreparedSegment => {
        if (bone.bone.endsWith("Subtalar") || bone.bone.endsWith("Midfoot")) {
          const shape: P.IShape = AutoMovieHumanPhysicalFootShape(
            parameters,
            bone.bone,
            neutral,
            options.skin,
          );
          if (shape.kind !== "box")
            throw new Error("Human foot envelope must be a box");
          const halfExtents: IAutoMovieVector3 = shape.halfExtents;
          const local: IAutoMovieVector3 = shape.transform.position;
          return {
            bone,
            region: region(bone.bone),
            length: halfExtents.x * 2,
            radius: bone.radius,
            local,
            shape,
            volume: 8 * halfExtents.x * halfExtents.y * halfExtents.z,
          };
        }
        const from: IAutoMovieVector3 = positions.get(bone.bone)!;
        const child: Skeleton.IBone | undefined = kept.find(
          (candidate: (typeof kept)[number]): boolean =>
            candidate.parent === bone.bone,
        );
        const tip: IAutoMovieVector3 = child
          ? positions.get(child.bone)!
          : bone.tip
            ? Vector3.add(
                from,
                Quaternion.rotateVector(
                  neutral.get(bone.bone)!.rotation,
                  Vector3.subtract(point(bone.tip), point(bone.position)),
                ),
              )
            : bone.bone.endsWith("Hand")
              ? positions.get(`${bone.bone.slice(0, -4)}MiddleProximal`)!
              : bone.bone.endsWith("Foot")
                ? positions.get(`${bone.bone.slice(0, -4)}HalluxProximal`)!
                : Vector3.add(from, { x: 0, y: bone.radius * 2, z: 0 });
        const displacement: IAutoMovieVector3 = Vector3.subtract(tip, from);
        const length: number = Vector3.length(displacement);
        const radius: number = bone.radius;
        if (!Number.isFinite(length) || !(radius > 0))
          throw new Error(`Degenerate Human physical segment ${bone.bone}`);
        const inv: IAutoMovieQuaternion = Quaternion.inverse(
          neutral.get(bone.bone)!.rotation,
        );
        const local: IAutoMovieVector3 = Quaternion.rotateVector(
          inv,
          Vector3.scale(displacement, 0.5),
        );
        const y: IAutoMovieVector3 =
          length > 0
            ? Vector3.normalize(Quaternion.rotateVector(inv, displacement))
            : { x: 0, y: 1, z: 0 };
        const x: IAutoMovieVector3 = Vector3.normalize(
          Vector3.cross(
            Math.abs(y.x) < 0.9 ? { x: 1, y: 0, z: 0 } : { x: 0, y: 0, z: 1 },
            y,
          ),
        );
        const z: IAutoMovieVector3 = Vector3.cross(x, y);
        const shape: P.IShape = {
          id: "surface",
          kind: "capsule",
          radius,
          halfLength: Math.max(0, length / 2 - radius),
          material: options.skin,
          transform: {
            position: local,
            rotation: quaternionFromAutoMovieBasis(x, y, z),
          },
        };
        return {
          bone,
          region: region(bone.bone),
          length,
          radius,
          local,
          shape,
          volume:
            Math.PI * radius ** 2 * 2 * shape.halfLength +
            (4 * Math.PI * radius ** 3) / 3,
        };
      },
    );
    const totals: Map<string, number> = new Map();
    for (const item of prepared)
      totals.set(item.region, (totals.get(item.region) ?? 0) + item.volume);
    const sumFractions: number = [...totals.keys()].reduce(
      (sum: number, name: string): number =>
        sum + fractions[name.replace(/^(left|right)/u, "")]!,
      0,
    );
    const segments: P.ISegment[] = prepared.map(
      (item: (typeof prepared)[number]): P.ISegment => {
        const fraction: number =
          fractions[item.region.replace(/^(left|right)/u, "")]! / sumFractions;
        const mass: number =
          (options.mass * fraction * item.volume) / totals.get(item.region)!;
        const record: Anthropometry.IRecord =
          reference[
            item.region.replace(/^(left|right)/u, "") as Anthropometry.Region
          ];
        if (record.gyration && record.center !== undefined) {
          const radius: readonly [number, number, number] = record.gyration;
          return {
            bone: item.bone.bone,
            neutral: neutral.get(item.bone.bone)!,
            mass,
            centerOfMass: Vector3.scale(item.local, 2 * record.center),
            inertia: {
              x: mass * (item.length * radius[0]) ** 2,
              y: mass * (item.length * radius[2]) ** 2,
              z: mass * (item.length * radius[1]) ** 2,
            },
            inertiaRotation: item.shape.transform.rotation,
            shapes: [item.shape],
          };
        }
        if (item.shape.kind === "box") {
          const e: IAutoMovieVector3 = item.shape.halfExtents;
          return {
            bone: item.bone.bone,
            neutral: neutral.get(item.bone.bone)!,
            mass,
            centerOfMass: item.local,
            inertia: {
              x: (mass * (e.y ** 2 + e.z ** 2)) / 3,
              y: (mass * (e.x ** 2 + e.z ** 2)) / 3,
              z: (mass * (e.x ** 2 + e.y ** 2)) / 3,
            },
            inertiaRotation: item.shape.transform.rotation,
            shapes: [item.shape],
          };
        }
        const h: number =
          item.shape.kind === "capsule" ? item.shape.halfLength : 0;
        const sphereMass: number =
          (mass * ((4 * Math.PI * item.radius ** 3) / 3)) / item.volume;
        const cylinderMass: number = mass - sphereMass;
        const longitudinal: number =
          (cylinderMass * item.radius ** 2) / 2 +
          0.4 * sphereMass * item.radius ** 2;
        const transverse: number =
          (cylinderMass * (3 * item.radius ** 2 + 4 * h ** 2)) / 12 +
          sphereMass *
            (0.4 * item.radius ** 2 + h ** 2 + 0.75 * h * item.radius);
        return {
          bone: item.bone.bone,
          neutral: neutral.get(item.bone.bone)!,
          mass,
          centerOfMass: item.local,
          inertia: { x: transverse, y: longitudinal, z: transverse },
          inertiaRotation: item.shape.transform.rotation,
          shapes: [item.shape],
        };
      },
    );
    for (const equipment of options.equipment) {
      const segment: P.ISegment | undefined = segments.find(
        (candidate: (typeof segments)[number]): boolean =>
          candidate.bone === equipment.bone,
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
      output,
      evaluate,
      segments,
      neutral,
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
        (
          side: "left" | "right",
        ): { a: string; b: string; reason: string }[] => [
          {
            a: `${side}Shoulder`,
            b: `${side}UpperArm`,
            reason:
              "Overlapping shoulder capsule across the coincident scapular pivot.",
          },
          {
            a: `${side}LowerLeg`,
            b: `${side}Subtalar`,
            reason:
              "Overlapping ankle solids across the coincident foot pivot.",
          },
        ],
      ),
    ];
    const errors: string[] = validatePhysicalProfile(profile);
    if (errors.length)
      throw new Error(`Human physical profile: ${errors.join(", ")}`);
    return { profile, evaluate };
  }
}

/** One provider segment before its measured regional mass is distributed by declared volume. */
interface IPreparedSegment {
  /** Actual neutral Human FK bone. */ bone: Skeleton.IBone;
  /** Anatomical mass-table region, retaining its own side. */ region: string;
  /** Measured effective segment length, metres. */ length: number;
  /** Source skeleton girth radius, metres. */ radius: number;
  /** Bone-local collider centre, metres. */ local: IAutoMovieVector3;
  /** Declared collision approximation and material. */ shape: P.IShape;
  /** Exact volume of that declared solid approximation, cubic metres. */ volume: number;
}
