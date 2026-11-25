import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { HumanColliders } from "../posture/HumanColliders";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { StrikingBody } from "../striking/StrikingBody";

/** The alternatives of `ANGLESEntry`'s site. */
type ANGLESEntry =
  | "recline"
  | "hip"
  | "lying"
  | "neck"
  | "lift"
  | "open"
  | "elbow";

/**
 * The existing knockdown fold and its body's floor fit. The law owns the clock
 * and heading; this owner evaluates the clinical fold, its collision bounds and
 * the unchanged knee, arm and elbow bisections.
 */
export namespace KnockdownFloor {
  /** The trunk pitch and clinical joint angles at one phase sample. */
  export interface IFold {
    /** Trunk pitch, degrees. */
    pitch: number;
    /** Clinical angle triples, degrees by bone. */
    joints: IAutoMovieMotionHumanJoints.Angles;
  }

  /** The knee, upper arm and elbow angles fitted to this body's floor rest. */
  export interface IFit {
    /** Seated knee flexion, degrees. */
    knee: number;
    /** Lying upper-arm flexion, degrees. */
    arm: number;
    /** Lying elbow flexion, degrees. */
    elbow: number;
  }

  /** A fold's floor height and ankle/hip offsets at root zero facing +Z. */
  export interface IMeasure {
    /** Root height resting the lowest collider on the floor, metres. */
    floor: number;
    /** Mean ankle Z relative to the root, metres. */
    ankle: number;
    /** Hip Z relative to the root, metres. */
    hips: number;
  }

  /**
   * Evaluate the existing fold at shares of sitting and rolling back.
   *
   * @param fitted This body's fitted angles, degrees.
   * @param sit The sitting profile's share.
   * @param back The rolling-back profile's share.
   * @returns The trunk pitch and joint angles, degrees.
   */
  export function fold(fitted: IFit, sit: number, back: number): IFold {
    const seat: number = sit * (1 - back);
    const hip: number = ANGLES.hip * seat + 0.9 * ANGLES.lying * back;
    const knee: number = fitted.knee * seat + ANGLES.lying * back;
    const arm: number = ANGLES.lift * (1 - back) + fitted.arm * back;
    const elbow: number = ANGLES.elbow * (1 - back) + fitted.elbow * back;
    return {
      pitch: -(ANGLES.recline * seat + 88 * back),
      joints: {
        neck: [ANGLES.neck * back, 0, 0],
        leftUpperLeg: [hip, 5, 0],
        rightUpperLeg: [hip, 5, 0],
        leftLowerLeg: [knee, 0, 0],
        rightLowerLeg: [knee, 0, 0],
        leftUpperArm: [arm, ANGLES.open, 0],
        rightUpperArm: [arm, ANGLES.open, 0],
        leftLowerArm: [elbow, 0, 0],
        rightLowerArm: [elbow, 0, 0],
      },
    };
  }

  /**
   * Prepare one plan's reader of a fold's floor height and ankle/hip offsets,
   * for a body that stays unchanged through the plan.
   *
   * @param body The body.
   * @returns A reader of an evaluated fold, with an optional exact FK source
   *   and same-body ROM projector borrowed from the synchronous caller and
   *   never retained; it returns the three measures, metres in the root frame.
   */
  export function prepareMeasure(
    body: IAutoMovieMotionHumanBody,
  ): (
    folded: IFold,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IMeasure {
    const requested: Set<AutoMovieHumanoidBone> = new Set(
      HumanColliders.bones(body),
    );
    requested.add("hips").add("leftFoot").add("rightFoot");
    const read: ReturnType<typeof StrikingBody.prepareTrunk> =
      StrikingBody.prepareTrunk(body, requested);
    const minimum: ReturnType<typeof HumanColliders.prepareMinima> =
      HumanColliders.prepareMinima(body);
    return (
      folded: IFold,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IMeasure => {
      const bones: ReturnType<typeof StrikingBody.trunk> = read(
        foldPosture(folded),
        resolution,
        projection,
      );
      return {
        floor: -minimum(bones)[0]!,
        ankle:
          (bones.get("leftFoot")!.worldPosition.z +
            bones.get("rightFoot")!.worldPosition.z) /
          2,
        hips: bones.get("hips")!.worldPosition.z,
      };
    };
  }

  /**
   * Fit the original knee, upper-arm and elbow floor contacts by bisection.
   *
   * @param body The body.
   * @param landed The roll-back share when the seat lands.
   * @returns The fitted angles, degrees.
   */
  export function fit(body: IAutoMovieMotionHumanBody, landed: number): IFit {
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    const prepare: (
      part: (bone: string) => boolean,
      support: (bone: string) => boolean,
    ) => (folded: IFold) => number = (
      part: (bone: string) => boolean,
      support: (bone: string) => boolean,
    ): ((folded: IFold) => number) => {
      const requested: Set<AutoMovieHumanoidBone> = new Set();
      const parts: Set<AutoMovieHumanoidBone> = new Set();
      const supports: Set<AutoMovieHumanoidBone> = new Set();
      for (const bone of HumanColliders.bones(body)) {
        if (part(bone)) parts.add(bone);
        if (support(bone)) supports.add(bone);
        if (parts.has(bone) || supports.has(bone)) requested.add(bone);
      }
      const trunk: ReturnType<typeof StrikingBody.prepareTrunk> =
        StrikingBody.prepareTrunk(body, requested);
      const minimum: ReturnType<typeof HumanColliders.prepareMinima> =
        HumanColliders.prepareMinima(body, [parts, supports]);
      return (folded: IFold): number => {
        const bounds: number[] = minimum(
          trunk(foldPosture(folded), resolution, projection),
        );
        return bounds[0]! - bounds[1]!;
      };
    };
    const knees: ReturnType<typeof prepare> = prepare(SHANK, SEAT);
    const arms: ReturnType<typeof prepare> = prepare(UPPER_ARM, BODY);
    const elbows: ReturnType<typeof prepare> = prepare(FOREARM, BODY);

    // Positive at above, falling toward below, as in the original fit.
    const solve: (
      above: number,
      below: number,
      of: (value: number) => number,
    ) => number = (
      above: number,
      below: number,
      of: (value: number) => number,
    ): number => {
      if (of(above) <= 0) return above;
      if (of(below) >= 0) return below;
      let high: number = above;
      let low: number = below;
      for (let i: number = 0; i < 16; ++i) {
        const mid: number = (high + low) / 2;
        if (of(mid) > 0) high = mid;
        else low = mid;
      }
      return (high + low) / 2;
    };
    const fitted: IFit = { knee: 0, arm: ANGLES.lift, elbow: 0 };
    fitted.knee = solve(
      0,
      AutoMovieMotionHumanRange.degrees("leftLowerLeg", "flexion", "full"),
      (knee: number): number => knees(fold({ ...fitted, knee }, 1, landed)),
    );
    fitted.arm = solve(
      ANGLES.lift,
      AutoMovieMotionHumanRange.limit("leftUpperArm", "extension") ?? 0,
      (arm: number): number => arms(fold({ ...fitted, arm }, 1, 1)),
    );

    // Flexion raises the forearm, so the elbow's bracket runs from 90 to zero.
    fitted.elbow = solve(90, 0, (elbow: number): number =>
      elbows(fold({ ...fitted, elbow }, 1, 1)),
    );
    return fitted;
  }

  /**
   * Raise the distal legs in the terminal prone pose until the body can rest on
   * its own colliders. The original knee angle is retained when the distal legs
   * already clear that plane.
   *
   * @param body The unchanging canonical body and its actual colliders.
   * @param folded The forward lie with its original clinical angles.
   * @returns The common terminal knee flexion, in clinical degrees.
   */
  export function fitProneKnee(
    body: IAutoMovieMotionHumanBody,
    folded: IFold,
  ): number {
    const seed: number = folded.joints.leftLowerLeg![0];
    const ceiling: number = Math.min(
      seed + 90,
      AutoMovieMotionHumanRange.limit("leftLowerLeg", "flexion")!,
      AutoMovieMotionHumanRange.limit("rightLowerLeg", "flexion")!,
    );
    const distal: Set<AutoMovieHumanoidBone> = new Set();
    const support: Set<AutoMovieHumanoidBone> = new Set();
    const bones: ReadonlySet<AutoMovieHumanoidBone> =
      HumanColliders.bones(body);
    for (const bone of bones) (SHANK(bone) ? distal : support).add(bone);
    const read: ReturnType<typeof StrikingBody.prepareTrunk> =
      StrikingBody.prepareTrunk(body, bones);
    const minimum: ReturnType<typeof HumanColliders.prepareMinima> =
      HumanColliders.prepareMinima(body, [distal, support]);
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const projection: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);

    /** Positive when a distal leg extends below the other body contacts. */
    const deficit = (knee: number): number => {
      const bounds: number[] = minimum(
        read(
          foldPosture({
            ...folded,
            joints: {
              ...folded.joints,
              leftLowerLeg: [knee, 0, 0],
              rightLowerLeg: [knee, 0, 0],
            },
          }),
          resolution,
          projection,
        ),
      );
      return bounds[1]! - bounds[0]!;
    };
    if (deficit(seed) <= 0 || deficit(ceiling) > 0) return seed;

    // A quarter-turn takes the prone shank through the lifting arc. The 16
    // bisections use the same angular resolution as the existing floor fit.
    let low: number = seed;
    let high: number = ceiling;
    for (let i: number = 0; i < 16; i++) {
      const middle: number = (low + high) / 2;
      if (deficit(middle) > 0) low = middle;
      else high = middle;
    }
    return high;
  }

  /**
   * The root height placing an actual posture's lowest collider on zero.
   *
   * @param body The body.
   * @param posture The posture, with its root Y ignored.
   * @param resolution Optional exact FK reader or supplier borrowed from this
   *   synchronous body's planning operation.
   * @param projection Optional genuine same-body direct ROM projector borrowed
   *   only during this floor reading.
   * @returns Root height, metres.
   */
  export function rest(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): number {
    return prepareRest(body)(posture, resolution, projection);
  }

  /**
   * Bind one unchanged body's floor readers for repeated current postures.
   *
   * @param body The canonical body whose rig, rest and profile stay unchanged
   *   for the owning plan or interval.
   * @returns A reader of the actual posture and optional current-call FK/ROM
   *   metadata; its root Y is ignored and the result is the original floor
   *   height in metres.
   */
  export function prepareRest(
    body: IAutoMovieMotionHumanBody,
  ): (
    posture: IAutoMovieMotionHumanPosture,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ) => number {
    const read: ReturnType<typeof StrikingBody.prepareTrunk> =
      StrikingBody.prepareTrunk(body, HumanColliders.bones(body));
    const minimum: ReturnType<typeof HumanColliders.prepareMinima> =
      HumanColliders.prepareMinima(body);
    return (
      posture: IAutoMovieMotionHumanPosture,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): number => {
      const bones: ReturnType<typeof StrikingBody.trunk> = read(
        {
          ...posture,
          root: { ...posture.root, y: 0 },
        },
        resolution,
        projection,
      );
      return -minimum(bones)[0]!;
    };
  }

  /** The folded clinical request, with its root at zero facing +Z. */
  function foldPosture(folded: IFold): IAutoMovieMotionHumanPosture {
    return {
      root: { x: 0, y: 0, z: 0 },
      yaw: 0,
      pitch: folded.pitch,
      roll: 0,
      joints: folded.joints,
      limbs: {},
    };
  }

  /** The seat's pelvis and thigh shapes. */
  const SEAT: (bone: string) => boolean = (bone: string): boolean =>
    bone === "hips" || bone.endsWith("UpperLeg");

  /** Shapes below the knee. */
  const SHANK: (bone: string) => boolean = (bone: string): boolean =>
    /(LowerLeg|Foot|Toes)$/.test(bone);

  /** Upper-arm shapes. */
  const UPPER_ARM: (bone: string) => boolean = (bone: string): boolean =>
    bone.endsWith("UpperArm");

  /** Shapes below the elbow. */
  const FOREARM: (bone: string) => boolean = (bone: string): boolean =>
    /(LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/.test(bone);

  /** All shapes outside the arms. */
  const BODY: (bone: string) => boolean = (bone: string): boolean =>
    !UPPER_ARM(bone) && !FOREARM(bone);

  /** The law's unchanged provisional clinical angle levels, degrees. */
  const ANGLES: Record<ANGLESEntry, number> = {
    recline: AutoMovieMotionHumanRange.lean("half"),
    hip: AutoMovieMotionHumanRange.degrees("leftUpperLeg", "flexion", {
      level: "deep",
      scale: 1.1,
    }),
    lying: AutoMovieMotionHumanRange.degrees(
      "leftLowerLeg",
      "flexion",
      "slight",
    ),
    neck: AutoMovieMotionHumanRange.degrees("neck", "flexion", "half"),
    lift: AutoMovieMotionHumanRange.degrees("leftUpperArm", "flexion", {
      level: "slight",
      scale: 0.5,
    }),
    open: AutoMovieMotionHumanRange.degrees(
      "leftUpperArm",
      "abduction",
      "slight",
    ),
    elbow: AutoMovieMotionHumanRange.degrees("leftLowerArm", "flexion", {
      level: "light",
      scale: 0.8,
    }),
  };
}
