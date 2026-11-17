import type { AutoMovieHumanoidBone, IAutoMovieJointPose, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanBodyFitTypes, IAutoMovieMotionHumanFoot, IAutoMovieMotionHumanFrame, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanPosture, IAutoMoviePose, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "@automovie/engine";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanBodyFit } from "../posture/HumanBodyFit";
import { HumanFitVariables } from "../posture/HumanFitVariables";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The sprint start's set geometry: block placement, the front knee's opening
 * and the body's centre of mass, solved on the performer's measured rig.
 * The athletics law owns timing and movements and delegates its set here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the geometry this module owns and its consumer's separate responsibility.
 * @evidence contracts/development/design.md#principled-representation Body-scaled block distances and measured knee and centre-of-mass constraints, in metres and degrees, return one stance in the entry's world frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the constants and set solve that athletics exposes through its existing names; no second calculation or constant table remains there.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the same body and entry for both feet, both hands and the trunk; no body-specific result is stored.
 */
export namespace sprintStartSet {
  /** The front knee's included angle in the set, degrees: 90 (SD 8) measured with the anthropometry-driven block setting (Cavedon et al. 2019, PLoS One 14:e0213979, table 2), Harland and Steele's (1997) "about 90". */
  export const FRONT: number = 90;

  /** The front block's distance behind the start line, a share of the leg's length (greater trochanter to lateral malleolus): the anthropometry-driven setting (Cavedon et al. 2019, table 2). */
  export const FRONT_DISTANCE: number = 0.6;

  /** The rear block's distance behind the front block, a share of the leg's length: the same setting's spacing (Cavedon et al. 2019). */
  export const SPACING: number = 0.45;

  /** The most the trunk's total tilt is searched to, degrees: a half turn, past which the trunk would point back up. */
  export const TILT: number = 180;

  /**
   * The whole body's centre of mass behind the start line in the set, metres
   * along the ground, by the sprinter's sex as the sources stratify it: 22.9
   * cm for elite men (Slawinski et al. 2010, J Strength Cond Res 24:896, n =
   * 6) and 16.2 cm for world-class women (Ciacci et al. 2017, J Sports Sci
   * 35:1270, n = 4), both read as Valamatos et al. 2022 report them (Int J
   * Environ Res Public Health 19:4074, section 4.1.2), the primary texts being
   * closed.
   */
  export const CENTRE: Readonly<Record<"female" | "male", number>> = {
    female: 0.162,
    male: 0.229,
  };

  /** The most the straight arms are searched to lean forward from the vertical, degrees: a quarter turn, past which the hands would no longer bear. */
  export const LEAN: number = 90;

  /** The front block's face from the floor, degrees (provisional, within a competition block's adjustment). */
  export const FRONT_BLOCK: number = 50;

  /** The rear block's face from the floor, degrees (provisional, within a competition block's adjustment). */
  export const REAR_BLOCK: number = 65;

  /** The arm extension of the initial geometric guess (provisional); the whole-body fit may change it to meet the measured constraints. */
  export const REACH: number = 0.98;

  /**
   * The set position's hips, pitch and feet for a body in front of a line.
   *
   * @param context The body.
   * @param entry The standing posture; the line is a hand's length ahead of its feet.
   * @param front The front foot.
   * @param sex The measured centre-of-mass stratum.
   * @returns The hips' world point, the trunk's pitch, each palm's place on the floor and each foot's placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the geometry and the result.
   * @evidence contracts/development/implementation.md#principled-implementation One whole-body multi-contact fit holds the four effector frames, front knee 90, rear knee 117 +/- 11 and front hip 43 +/- 6 degrees (Cavedon et al. 2019, table 2, https://pmc.ncbi.nlm.nih.gov/articles/PMC6436800/), and the sex-matched centre position; these physical intervals do not impose one mean posture on every body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Body-scaled contacts, one geometric seed, then one shared whole-body fit and a measured refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Arm extension is not fixed to the seed and no joint range is narrowed; a joint/contact problem the fit does not meet is refused with its actual residuals.
   * @evidence contracts/development/implementation.md#efficient-algorithms One geometric seed and one shared fit with analytic Jacobians replace nested machine-resolution bisections; fit iterations, not a claimed speedup, determine cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the placed arm's wrist, pitch and root, and the foot's pivot.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function of(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    entry: IAutoMovieMotionHumanPosture,
    front: "left" | "right",
    sex: "female" | "male" = "male",
  ): {
    hips: IAutoMovieVector3;
    pitch: number;
    joints: IAutoMovieMotionHumanPosture["joints"];
    palms: Record<
      "left" | "right",
      {
        point: IAutoMovieVector3;
        facing: IAutoMovieVector3;
        forward: IAutoMovieVector3;
      }
    >;
    feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>;
  } {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const frame: IAutoMovieMotionHumanFrame.IFrame = {
      origin: { x: entry.root.x, y: 0, z: entry.root.z },
      yaw: entry.yaw,
    };
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const palm: (
      side: "left" | "right",
    ) => ReturnType<typeof of>["palms"]["left"] = (
      side: "left" | "right",
    ): ReturnType<typeof of>["palms"]["left"] => ({
      point: HumanFrame.point(frame, {
        x: (side === "left" ? 1 : -1) * m.shoulderHalfWidth,
        y: 0,
        z: m.footLength - m.hand / 2,
      }),
      facing: { x: 0, y: -1, z: 0 },
      forward,
    });
    const palms: ReturnType<typeof of>["palms"] = {
      left: palm("left"),
      right: palm("right"),
    };
    // The shoulders stand the arms' reach from the wrists of the laid hands,
    // the straight arms leaning forward from the vertical by `lean` degrees.
    const wrist: Record<"left" | "right", IAutoMovieVector3> = {
      left: AutoMovieMotionHumanPlaced.wrist(body, "left", palms.left),
      right: AutoMovieMotionHumanPlaced.wrist(body, "right", palms.right),
    };
    const wrists: IAutoMovieVector3 = Vector3.lerp(
      wrist.left,
      wrist.right,
      0.5,
    );
    const arm: number = REACH * (m.upperArm + m.forearm);
    const over: (lean: number) => IAutoMovieVector3 = (
      lean: number,
    ): IAutoMovieVector3 =>
      Vector3.add(
        { ...wrists, y: wrists.y + arm * Math.cos((lean * Math.PI) / 180) },
        Vector3.scale(forward, arm * Math.sin((lean * Math.PI) / 180)),
      );
    // Each foot in its block, the ball on the floor and the sole on the
    // block's face, its ball behind the line by the anthropometry-driven
    // setting's share of the leg's length (`FRONT_DISTANCE`, `SPACING`).
    const rear: "left" | "right" = front === "left" ? "right" : "left";
    const leg: number = m.thigh + m.shank;
    const feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = {
      [front]: block(
        body,
        entry,
        frame,
        front,
        FRONT_DISTANCE * leg,
        FRONT_BLOCK,
      ),
      [rear]: block(
        body,
        entry,
        frame,
        rear,
        (FRONT_DISTANCE + SPACING) * leg,
        REAR_BLOCK,
      ),
    } as Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>;

    // The trunk inclined by a total tilt shared by the lumbopelvic rhythm,
    // the pelvis taking no more than the planted legs' hip range leaves it
    // and the spine the rest (`HumanTrunk.incline`), its root placed so the
    // shoulders stand over the hands.
    const posed: (q: number, shoulders: IAutoMovieVector3) => IStance = (
      q: number,
      shoulders: IAutoMovieVector3,
    ): IStance => {
      const at: (limit: number) => IStance = (limit: number): IStance => {
        const tilt: { pitch: number; joints: IAutoMovieMotionHumanPosture["joints"] } =
          HumanTrunk.incline(entry.joints, q, limit);
        const turned: IAutoMovieMotionHumanPosture = {
          ...entry,
          root: { x: 0, y: 0, z: 0 },
          pitch: tilt.pitch,
          roll: 0,
          joints: tilt.joints,
          // The trunk alone is read: the limbs' goals move no joint of it.
          limbs: {},
        };
        const bones: ReturnType<typeof poseBones> = poseBones(
          body,
          resolveHumanPosture(body, turned),
        );
        const girdle: IAutoMovieVector3 = Vector3.lerp(
          bones.get("leftUpperArm")!.worldPosition,
          bones.get("rightUpperArm")!.worldPosition,
          0.5,
        );
        const root: IAutoMovieVector3 = Vector3.subtract(shoulders, girdle);
        return {
          pitch: tilt.pitch,
          joints: tilt.joints,
          hips: Vector3.add(root, bones.get("hips")!.worldPosition),
          joint: Vector3.add(
            root,
            bones.get(`${front}UpperLeg`)!.worldPosition,
          ),
          root,
        };
      };
      const free: IStance = at(Infinity);
      return at(
        HumanTrunk.pelvisLimit(
          body,
          Vector3.subtract(free.hips, body.rest.get("hips")!),
          entry.yaw,
          { left: feet.left.ankle, right: feet.right.ankle },
        ),
      );
    };

    // The middle of the old geometric search box is only the starting
    // configuration. Arm extension and trunk sharing remain free in the fit;
    // measured angles, mass centre and all four contacts decide the answer.
    const seed: IStance = posed(TILT / 2, over(LEAN / 2));
    const posture: IAutoMovieMotionHumanPosture = {
      ...entry,
      root: seed.root,
      pitch: seed.pitch,
      roll: 0,
      joints: seed.joints,
      limbs: {},
    };
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
      leftLeg: AutoMovieMotionHumanLeg.goal(
        body,
        posture,
        "left",
        feet.left,
        true,
      ),
      rightLeg: AutoMovieMotionHumanLeg.goal(
        body,
        posture,
        "right",
        feet.right,
        true,
      ),
      leftArm: {
        point: wrist.left,
        bend: AutoMovieMotionHumanBend.hang(body, posture, "left"),
      },
      rightArm: {
        point: wrist.right,
        bend: AutoMovieMotionHumanBend.hang(body, posture, "right"),
      },
    };
    const posedSeed: IAutoMoviePose = resolveHumanPosture(body, {
      ...posture,
      limbs,
    });
    const targets: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = [];
    for (const side of ["left", "right"] as const) {
      targets.push({
        bone: `${side}Foot`,
        goal: feet[side].ankle,
        rotation: feet[side].rotation,
      });
      const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.offset(
        body,
        side,
        "palm",
        "flat",
      );
      targets.push({
        bone: `${side}Hand`,
        point: palm.point,
        goal: palms[side].point,
        rotation: HumanHand.align(palm, {
          normal: palms[side].facing,
          forward: palms[side].forward,
        }),
      });
    }
    const solved: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
      body,
      // The law carries sagittal trunk flexion and planted legs; unused
      // neck, head, roll and frontal hip axes cannot decide a key that its
      // movements would subsequently discard. Arms retain their freedoms.
      variables: HumanFitVariables.BODY.filter(
        (variable: (typeof HumanFitVariables.BODY)[number]): boolean => {
          if (variable.kind === "place") return true;
          if (variable.kind === "heading") return variable.axis === "pitch";
          if (/^(neck|head)$/.test(variable.bone)) return false;
          if (/^(spine|chest)$/.test(variable.bone)) return variable.axis === 0;
          if (/(UpperLeg|LowerLeg)$/.test(variable.bone))
            return variable.axis === 0;
          return true;
        },
      ),
      posture: {
        ...posture,
        // Match the placed-arm consumer's flat hand before reading the floor;
        // the body fit does not optimize fixed digit-shape coordinates.
        joints: {
          ...Object.fromEntries(
            posedSeed.joints.map(
              (
                joint: IAutoMovieJointPose,
              ): [AutoMovieHumanoidBone, readonly [number, number, number]] => [
                joint.bone,
                [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0],
              ],
            ),
          ),
          ...HumanHand.shape("left", "flat"),
          ...HumanHand.shape("right", "flat"),
        },
      },
      targets,
      angles: [
        {
          points: [
            [{ bone: `${front}UpperLeg` }],
            [{ bone: `${front}LowerLeg` }],
            [{ bone: `${front}Foot` }],
          ],
          degrees: FRONT,
        },
        {
          points: [
            [{ bone: `${rear}UpperLeg` }],
            [{ bone: `${rear}LowerLeg` }],
            [{ bone: `${rear}Foot` }],
          ],
          degrees: [106, 128],
        },
        {
          points: [
            [{ bone: `${front}LowerLeg` }],
            [{ bone: `${front}UpperLeg` }],
            [{ bone: "leftUpperArm" }, { bone: "rightUpperArm" }],
          ],
          degrees: [37, 49],
        },
      ],
      centre: {
        point: HumanFrame.point(frame, {
          x: 0,
          y: 0,
          z: m.footLength - CENTRE[sex],
        }),
        axes: [forward],
      },
      bearing: [
        /^left(Foot|Toes)$/,
        /^right(Foot|Toes)$/,
        /^leftHand$/,
        /^rightHand$/,
      ],
    });
    if (!solved.converged)
      throw new HumanRefusal({
        kind: "reach",
        axis: "set",
        value: Math.max(
          solved.centre,
          ...solved.residuals.map(
            (r: IAutoMovieMotionHumanBodyFitTypes.IResult["residuals"][number]): number => r.point,
          ),
        ),
        reason: `the sprint set did not meet its four contacts, measured angles and centre: contacts ${solved.residuals.map((r: IAutoMovieMotionHumanBodyFitTypes.IResult["residuals"][number]): string => r.point.toFixed(2)).join(", ")} mm; angles ${solved.angles.map((angle: number): string => angle.toFixed(2)).join(", ")} degrees; centre ${solved.centre.toFixed(2)} mm (${solved.reason})`,
        fix: "use a stance whose contacts and measured set constraints are jointly reachable",
      });
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture(body, solved.posture),
    );
    const stance: IStance = {
      root: solved.posture.root,
      hips: bones.get("hips")!.worldPosition,
      joint: bones.get(`${front}UpperLeg`)!.worldPosition,
      pitch: solved.posture.pitch,
      joints: solved.posture.joints,
    };
    return {
      hips: stance.hips,
      pitch: stance.pitch,
      joints: stance.joints,
      palms,
      feet,
    };
  }
}

/** A set stance at one total tilt: the pelvis's pitch, the spine's flexion added, and the hips, the front hip joint and the root placed so the shoulders stand over the hands, world metres. */
interface IStance {
  pitch: number;
  joints: IAutoMovieMotionHumanPosture["joints"];
  hips: IAutoMovieVector3;
  joint: IAutoMovieVector3;
  root: IAutoMovieVector3;
}

/**
 * A foot in its block: the ball on the floor `behind` metres behind the
 * start line (the entry's foot length ahead of the root, where the hands lie),
 * the sole turned up onto the block's face.
 */
function block(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  frame: IAutoMovieMotionHumanFrame.IFrame,
  side: "left" | "right",
  behind: number,
  face: number,
): IAutoMovieMotionHumanFoot.IPlacement {
  return HumanFoot.pivot(
    body,
    side,
    "ball",
    HumanFrame.point(frame, {
      x: body.rest.get(`${side}UpperLeg`)!.x,
      y: 0,
      z: body.measure.footLength - behind,
    }),
    entry.yaw,
    -face,
  );
}
