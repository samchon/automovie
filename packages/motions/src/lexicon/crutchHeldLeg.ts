import {
  ANKLE_DORSIFLEXION,
  Quaternion,
  Vector3,
  getConstraint,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAngleRange,
  IAutoMovieHumanLimbReference,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSequentialConvex,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkFoot } from "../actions/walkFoot";
import { AutoMovieMotionHumanAuditTangleModel as Tangle } from "../audit/AutoMovieMotionHumanAuditTangleModel";
import { readHumanBone } from "../body/readHumanBone";
import { HumanArmRefine } from "../posture/HumanArmRefine";
import { HumanAuditModel } from "../posture/HumanAuditModel";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanLimbFit } from "../posture/HumanLimbFit";
import { HumanSequentialConvex as SCO } from "../posture/HumanSequentialConvex";
import { HumanSequentialConvexFunctions as F } from "../posture/HumanSequentialConvexFunctions";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { crutchHeldLegSweptDepth } from "./crutchHeldLegSweptDepth";

/**
 * Trajopt's sco settings for a joint-space course (`OptimizeProblem`,
 * src/trajopt/problem_description.cpp lines 244-257, github.com/joschu/trajopt
 * at commit 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause), the same
 * the arm course is solved at (`HumanArmOptimiser`), its boxes read in this
 * course's degrees.
 */
const LEG: Readonly<IAutoMovieMotionHumanSequentialConvex.IParameters> = {
  ...SCO.DEFAULTS,
  maxIter: 40,
  minApproxImproveFrac: 0.001,
  improveRatioThreshold: 0.2,
  meritErrorCoeff: 20,
  trustBoxSize: (0.1 * 180) / Math.PI,
  minTrustBoxSize: (1e-4 * 180) / Math.PI,
};

/** The leg's segments the held leg's course keeps clear, by bone suffix. */
const LEG_BONES: readonly string[] = ["UpperLeg", "LowerLeg", "Foot", "Toes"];

/**
 * The injured leg a crutch gait holds off the floor once the hands bear
 * (Physiopedia, Crutches: the three-point gait; HealthLinkBC, Using crutches).
 * From its bearing pose the leg lifts and folds to the held hip and knee
 * flexion on one course planned against the levels beneath it and the body
 * (`plan`, TrajOpt's collision constraint), its first knot the leg as it bears,
 * the ankle dorsiflexing by the shank's tilt up to a weightless ankle's limit
 * (`ANKLE_DORSIFLEXION.unloaded`) so the toes do not pitch down.
 *
 * @param props The leg, its timing and the posture it lifts from.
 * @returns The writer of a posture with the leg held, the base posture's other
 *   parts kept.
 */
export function crutchHeldLeg(
  props: crutchHeldLeg.IProps,
): (
  base: IAutoMovieMotionHumanPosture,
  seconds: number,
) => IAutoMovieMotionHumanPosture {
  const { body, side, lifted, held, read } = props;
  const leg: `${AutoMovieHumanSide}Leg` = `${side}Leg`;
  const cleared: number = lifted + (held - lifted) / 3;
  // The held leg's course from the bearing pose, planned as TrajOpt
  // plans a chain (Schulman et al. 2014, IJRR 33:1251): the hip's flexion,
  // abduction and twist and the knee's flexion at the law's phase instants
  // (`knots`), the joint velocity cost and the held pose's joint cost,
  // trajopt's `JointVelCost` and `JointPosCost` in radians at coefficient 1,
  // under the collision constraint (section IV-A) at each knot and, swept
  // (section IV-B), between consecutive knots: every probe of the leg's
  // segments, the probes the take's tangle audit reads them by
  // (`AutoMovieMotionHumanAuditTangleModel`), placed on the colliders of the
  // posture resolved as it is displayed (`HumanColliders`), stays a swing's
  // clearance (`walkFoot.CLEARANCE`) from the levels beneath it, the flight's
  // treads and nosings where the law gives them (`stairs`), else its floor.
  // The course is solved once by trajopt's loop (`HumanSequentialConvex`) on
  // functions convexified as trajopt's (`HumanSequentialConvexFunctions`),
  // each read in its own knots' variables, from the law's own fold as its
  // seed, and played on the minimum-jerk path (`HumanArmRefine.hermite`).
  const knots: number[] = [
    lifted,
    cleared,
    held,
    ...(props.knots ?? []).filter((t: number): boolean => t > held),
  ];
  const model: Tangle.IModel = Tangle.model(body);
  const parts: number[] = model.parts.flatMap(
    (part: Tangle.IPart, i: number): number[] =>
      LEG_BONES.some((b: string): boolean => part.bone === `${side}${b}`)
        ? [i]
        : [],
  );
  // The leg's joint angles written into a posture at a share of the fold.
  const posed: (
    base: IAutoMovieMotionHumanPosture,
    from: crutchHeldLeg.IRaised,
    angles: readonly number[],
    s: number,
  ) => IAutoMovieMotionHumanPosture = (
    base: IAutoMovieMotionHumanPosture,
    from: crutchHeldLeg.IRaised,
    angles: readonly number[],
    s: number,
  ): IAutoMovieMotionHumanPosture => {
    const tilt: number =
      angles[3]! - from.lower[0] - (angles[0]! - from.upper[0]);
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...base.limbs };
    delete limbs[leg];
    return {
      ...base,
      limbs,
      joints: {
        ...base.joints,
        [`${side}UpperLeg`]: [angles[0]!, angles[1]!, angles[2]!],
        [`${side}LowerLeg`]: [
          angles[3]!,
          from.lower[1] * (1 - s),
          from.lower[2] * (1 - s),
        ],
        [`${side}Foot`]: [
          from.foot[0] +
            Math.min(
              Math.max(0, ANKLE_DORSIFLEXION.unloaded - from.foot[0]),
              Math.max(0, tilt),
            ),
          from.foot[1],
          from.foot[2],
        ],
      },
    };
  };
  // The body's segments placed for a posture, as the audit places them.
  const segments: (
    posture: IAutoMovieMotionHumanPosture,
  ) => IAutoMovieMotionHumanColliders.IPlaced[] = (
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanColliders.IPlaced[] =>
    HumanColliders.placed(
      body,
      poseBones(body, resolveHumanPosture(body, posture)),
    );
  // How deep each of the leg's segments lies in each other segment of the
  // body the audit reads it against, past its reference depth and the
  // audit's allowance (`Tangle.excess`, `HumanAuditModel.ALLOWANCE`).
  const tangles: (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ) => number[] = (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): number[] => {
    // Each segment read in is prepared once for this placement.
    const targets: Parameters<typeof Tangle.excess>[4] = [];
    return parts.flatMap((i: number): number[] =>
      model.parts.flatMap((_: Tangle.IPart, j: number): number[] =>
        parts.includes(j) || model.related[i]![j]
          ? []
          : [
              Tangle.excess(model, placed, i, j, targets) -
                HumanAuditModel.ALLOWANCE,
            ],
      ),
    );
  };
  // The leg's probes in the world, as the audit places them.
  const probes: (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ) => IAutoMovieVector3[] = (
    placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  ): IAutoMovieVector3[] => {
    return parts.flatMap((i: number): IAutoMovieVector3[] =>
      model.parts[i]!.probes.map(
        (probe: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(
            placed[i]!.pose.position,
            Quaternion.rotateVector(placed[i]!.pose.rotation, probe),
          ),
      ),
    );
  };
  // A probe's (or a probe's swept chord's) distance from the levels beneath,
  // less the swing's clearance.
  const clear: (
    seconds: number,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ) => number = (
    seconds: number,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): number => {
    if (props.stairs !== undefined) {
      const along: (p: IAutoMovieVector3) => number = (
        p: IAutoMovieVector3,
      ): number =>
        Vector3.dot(
          Vector3.subtract(p, props.stairs!.origin),
          props.stairs!.forward,
        );
      return (
        crutchHeldLegSweptDepth(
          props.stairs.steps,
          [along(a), a.y],
          [along(b), b.y],
        ) - walkFoot.CLEARANCE
      );
    }
    return Math.min(a.y, b.y) - props.floor!(seconds) - walkFoot.CLEARANCE;
  };
  const plan: (from: crutchHeldLeg.IRaised) => number[][] = (
    from: crutchHeldLeg.IRaised,
  ): number[][] => {
    const bases: IAutoMovieMotionHumanPosture[] = knots.map(
      (t: number): IAutoMovieMotionHumanPosture => read(t),
    );
    const share: (t: number) => number = (t: number): number =>
      minimumJerk(Math.min(1, (t - lifted) / (held - lifted))).s;
    const first: number[] = [
      from.upper[0],
      from.upper[1],
      from.upper[2],
      from.lower[0],
    ];
    const seed: number[] = knots.slice(1).flatMap((t: number): number[] => {
      const s: number = share(t);
      return [
        from.upper[0] + (props.hip - from.upper[0]) * s,
        from.upper[1] * (1 - s),
        from.upper[2] * (1 - s),
        from.lower[0] + (props.knee - from.lower[0]) * s,
      ];
    });
    const angles: (x: F.Vector, j: number) => number[] = (
      x: F.Vector,
      j: number,
    ): number[] => (j === 0 ? first : [...x.slice(4 * (j - 1), 4 * j)]);
    const at: (
      x: F.Vector,
      j: number,
    ) => IAutoMovieMotionHumanColliders.IPlaced[] = (
      x: F.Vector,
      j: number,
    ): IAutoMovieMotionHumanColliders.IPlaced[] =>
      segments(posed(bases[j]!, from, angles(x, j), share(knots[j]!)));
    const held4: number[] = [props.hip, 0, 0, props.knee];
    const hipRange: IAutoMovieJointConstraint | null = getConstraint(
      `${side}UpperLeg`,
      readHumanBone(body, `${side}UpperLeg`)?.constraint ?? null,
    );
    const kneeRange: IAutoMovieJointConstraint | null = getConstraint(
      `${side}LowerLeg`,
      readHumanBone(body, `${side}LowerLeg`)?.constraint ?? null,
    );
    const ranges: (IAutoMovieAngleRange | null | undefined)[] = [
      hipRange?.flexion,
      hipRange?.abduction,
      hipRange?.twist,
      kneeRange?.flexion,
    ];
    const solved: IAutoMovieMotionHumanSequentialConvex.IResult<
      F.Vector,
      IAutoMovieMotionHumanSequentialConvex.IEvaluation
    > = SCO.minimise(
      F.problem({
        costs: [
          {
            f: (x: F.Vector): number => {
              let sum: number = 0;
              for (let j: number = 1; j < knots.length; ++j) {
                const p: number[] = angles(x, j - 1);
                const q: number[] = angles(x, j);
                for (let d: number = 0; d < 4; ++d)
                  sum += ((q[d]! - p[d]!) * Quaternion.DEG2RAD) ** 2;
              }
              return sum;
            },
            full: true,
          },
          {
            f: (x: F.Vector): number => {
              let sum: number = 0;
              knots.forEach((t: number, j: number): void => {
                if (j === 0 || t < held) return;
                const q: number[] = angles(x, j);
                for (let d: number = 0; d < 4; ++d)
                  sum += ((q[d]! - held4[d]!) * Quaternion.DEG2RAD) ** 2;
              });
              return sum;
            },
            full: false,
          },
        ],
        // Each interval's rows read its two knots' variables alone: the
        // later knot's leg segments against the body's others, its probes
        // against the levels beneath, and each probe's chord from the
        // earlier knot; a leg with no level beneath it given reads the body
        // alone.
        constraints: knots.slice(1).map(
          (t: number, i: number): F.IConstraint => ({
            g: (x: F.Vector): F.Vector => {
              const later: IAutoMovieMotionHumanColliders.IPlaced[] = at(
                x,
                i + 1,
              );
              const tangled: number[] = tangles(later);
              if (props.stairs === undefined && props.floor === undefined)
                return tangled;
              const after: IAutoMovieVector3[] = probes(later);
              // The first interval leaves the bearing stance on the floor,
              // fixed: its chord is not read, as trajopt reads collision
              // from the first free timestep (`first_step`).
              const before: IAutoMovieVector3[] =
                i === 0 ? after : probes(at(x, i));
              return [
                ...tangled,
                ...after.flatMap(
                  (p: IAutoMovieVector3, k: number): number[] => [
                    -clear(t, p, p),
                    -clear(t, before[k]!, p),
                  ],
                ),
              ];
            },
            equality: false,
            variables: Array.from(
              { length: i === 0 ? 4 : 8 },
              (_: unknown, v: number): number =>
                i === 0 ? v : 4 * (i - 1) + v,
            ),
          }),
        ),
        low: seed.map(
          (_: number, v: number): number => ranges[v % 4]?.min ?? -Infinity,
        ),
        high: seed.map(
          (_: number, v: number): number => ranges[v % 4]?.max ?? Infinity,
        ),
      }),
      seed,
      LEG,
    );
    return knots.map((_: number, j: number): number[] => angles(solved.x, j));
  };
  // The leg as it bears, at the bearing stance's last representable instant
  // (at `lifted` itself a support plan has already let the foot's goal go):
  // the course's first knot, so the leg leaves its stance without a step.
  const bearing: IAutoMoviePose = resolveHumanPosture(
    body,
    read(lifted - Math.abs(lifted) * Number.EPSILON),
  );
  const ankle: IAutoMovieJointPose | undefined = bearing.joints.find(
    (j: IAutoMovieJointPose): boolean => j.bone === `${side}Foot`,
  );
  const from: crutchHeldLeg.IRaised = {
    ...HumanLimbFit.reference(bearing, leg),
    foot: [ankle?.flexion ?? 0, ankle?.abduction ?? 0, ankle?.twist ?? 0],
  };
  // The course, solved once here; a read only evaluates its path.
  const course: ReturnType<typeof HumanArmRefine.prepareHermite> =
    HumanArmRefine.prepareHermite(knots, plan(from));
  return (
    base: IAutoMovieMotionHumanPosture,
    seconds: number,
  ): IAutoMovieMotionHumanPosture => {
    if (seconds <= lifted) return base;
    const s: number = minimumJerk(
      Math.min(1, (seconds - lifted) / (held - lifted)),
    ).s;
    return posed(base, from, course(seconds).coordinates, s);
  };
}
/** Companion types of {@link crutchHeldLeg}. */
export namespace crutchHeldLeg {
  /** The leg to hold and when. */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The injured side. */
    side: AutoMovieHumanSide;

    /** When the foot leaves the floor, action seconds. */
    lifted: number;

    /** When the leg is held, action seconds. */
    held: number;

    /** The held hip flexion, degrees. */
    hip: number;

    /** The held knee flexion, degrees. */
    knee: number;

    /** The law's posture before the leg is held, by action second. */
    read: (seconds: number) => IAutoMovieMotionHumanPosture;

    /**
     * The height of the level beneath the held foot at an action second, world
     * metres, where the law gives no flight; the held angles alone when neither
     * is given.
     */
    floor?: (seconds: number) => number;

    /** The flight beneath the held foot, its treads and nosings. */
    stairs?: IStairs;

    /**
     * The law's phase instants after the leg is held, action seconds: the
     * course's further knots.
     */
    knots?: readonly number[];
  }

  /** A flight's profile in the vertical plane of its climb. */
  export interface IStairs {
    /** Where its distances ahead are measured from, world metres. */
    origin: IAutoMovieVector3;

    /** The climb's horizontal direction, a unit vector. */
    forward: IAutoMovieVector3;

    /** Its levels, nearest first. */
    steps: readonly IStep[];
  }

  /** One level of a flight: solid below its height from where it begins. */
  export interface IStep {
    /** Where it begins ahead of the origin, metres. */
    from: number;

    /** Its height, world metres. */
    height: number;
  }

  /**
   * The leg where it starts to fold: its hip's and knee's angles and its
   * ankle's, degrees.
   */
  export interface IRaised extends IAutoMovieHumanLimbReference {
    /** The ankle's `[flexion, abduction, twist]`, degrees. */
    foot: readonly [number, number, number];
  }
}
