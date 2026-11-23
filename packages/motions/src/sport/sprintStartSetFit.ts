import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanFitGoals,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanBodyFit } from "../posture/HumanBodyFit";
import { HumanFitVariables } from "../posture/HumanFitVariables";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * The sprint set's one whole-body fit: both feet on their blocks, each hand's
 * thumb and index bridge at the line, the measured knee and hip angles and, on
 * the anthropometric setting, the measured centre of mass behind the line
 * (`sprintStartSet`, which prepares every input).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the fit's rows and who prepares them.
 * @evidence contracts/development/design.md#principled-representation World-metre targets, degree angle rows and an optional centre row over one seed posture.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The props record, the fit and the set read off it, used only by sprintStartSet.of.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every row is the caller's measured or placed value; nothing is restated here.
 */
export namespace sprintStartSetFit {
  /**
   * What the fit is asked.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's unit and frame.
   * @evidence contracts/development/design.md#principled-representation The body, the seed posture and pose, the feet's world placements, the hands' bridge targets, the legs and the measured angle rows in degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values `sprintStartSet.of` prepares for the fit.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The centre row is absent exactly when placed plates decide where the body stands.
   */
  export interface IProps {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** The seed posture, its limbs cleared. */
    posture: IAutoMovieMotionHumanPosture;

    /** The seed's resolved pose, whose joints start the fit. */
    seed: IAutoMoviePose;

    /** Each foot's placement on its block, world metres. */
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

    /**
     * Whether the feet stand on placed plates, held in all three axes, rather
     * than on body-scaled blocks held along the floor.
     */
    placed: boolean;

    /** Each hand's bridge targets at the line. */
    bridges: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanBodyFitTypes.ITarget[]
    >;

    /** The front foot. */
    front: AutoMovieHumanSide;

    /** The front knee's included angle, degrees: a value or a range. */
    knee: IAutoMovieMotionHumanFitGoals.IAngle["degrees"];

    /** The rear knee's included angle range, degrees. */
    rear: IAutoMovieMotionHumanFitGoals.IAngle["degrees"];

    /** The front hip's included angle range, degrees. */
    hip: IAutoMovieMotionHumanFitGoals.IAngle["degrees"];

    /** The centre of mass row, absent on placed plates. */
    centre: IAutoMovieMotionHumanFitGoals.ICentre | undefined;
  }

  /**
   * Fit the set and refuse it when a row is not met.
   *
   * @param props The fit's rows and seed.
   * @returns The feasible fit.
   * @throws {HumanRefusal} When any contact, angle or centre row is not met,
   *   with every residual.
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation One shared whole-body fit (`HumanBodyFit`) over sagittal trunk, planted-leg and arm freedoms, with the bridge hand shape fixed, as the multi-contact inverse problem it solves.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Targets, variables, the fit, then the refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unmet row is refused with its residuals; no row is loosened here.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fit; its iterations decide the cost.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The seed pose's joints start the fit instead of a fresh solve.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The fit's result is returned and nothing else is kept.
   */
  export function of(props: IProps): IAutoMovieMotionHumanBodyFitTypes.IResult {
    const rear: AutoMovieHumanSide = props.front === "left" ? "right" : "left";
    const targets: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = [];
    for (const side of ["left", "right"] as const) {
      targets.push({
        bone: `${side}Foot`,
        goal: props.feet[side].ankle,
        ...(props.placed ? {} : { axes: ["x", "z"] }),
        rotation: props.feet[side].rotation,
      });
      targets.push(...props.bridges[side]);
    }
    const solved: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
      body: props.body,
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
        ...props.posture,
        // Match the placed-arm consumer's bridge hand before reading the floor;
        // the body fit does not optimize fixed digit-shape coordinates.
        joints: {
          ...Object.fromEntries(
            props.seed.joints.map(
              (
                joint: IAutoMovieJointPose,
              ): [AutoMovieHumanoidBone, readonly [number, number, number]] => [
                joint.bone,
                [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0],
              ],
            ),
          ),
          ...HumanHand.shape("left", "bridge"),
          ...HumanHand.shape("right", "bridge"),
        },
      },
      targets,
      angles: [
        {
          points: [
            [{ bone: `${props.front}UpperLeg` }],
            [{ bone: `${props.front}LowerLeg` }],
            [{ bone: `${props.front}Foot` }],
          ],
          degrees: props.knee,
        },
        {
          points: [
            [{ bone: `${rear}UpperLeg` }],
            [{ bone: `${rear}LowerLeg` }],
            [{ bone: `${rear}Foot` }],
          ],
          degrees: props.rear,
        },
        {
          points: [
            [{ bone: `${props.front}LowerLeg` }],
            [{ bone: `${props.front}UpperLeg` }],
            [{ bone: "leftUpperArm" }, { bone: "rightUpperArm" }],
          ],
          degrees: props.hip,
        },
      ],
      ...(props.centre === undefined ? {} : { centre: props.centre }),
      bearing: [
        // Body-scaled blocks leave the toes bearing on the track. The
        // placed plates supply both feet's full world targets themselves.
        ...(props.placed ? [] : [/^left(Foot|Toes)$/, /^right(Foot|Toes)$/]),
        // Each digit of the bridge bears on its own.
        /^leftThumbDistal$/,
        /^leftIndexDistal$/,
        /^rightThumbDistal$/,
        /^rightIndexDistal$/,
      ],
    });

    // The set needs a posture satisfying all the contact and measurement
    // rows. Further improvement of the preference within that feasible set
    // is a separate optimisation question (Wright and Tenny 2004, SIAM J.
    // Optim. 14(4), sec. 1, https://pages.cs.wisc.edu/~swright/papers/WriT04a.pdf).
    if (!solved.feasible)
      throw new HumanRefusal({
        kind: "reach",
        axis: "set",
        value: Math.max(
          solved.centre,
          ...solved.residuals.map(
            (
              r: IAutoMovieMotionHumanBodyFitTypes.IResult["residuals"][number],
            ): number => r.point,
          ),
        ),
        reason: `the sprint set did not meet its contacts, measured angles and centre: contacts ${solved.residuals.map((r: IAutoMovieMotionHumanBodyFitTypes.IResult["residuals"][number]): string => r.point.toFixed(2)).join(", ")} mm; angles ${solved.angles.map((angle: number): string => angle.toFixed(2)).join(", ")} degrees; centre ${solved.centre.toFixed(2)} mm (${solved.reason})`,
        fix: "use a stance whose contacts and measured set constraints are jointly reachable",
      });
    return solved;
  }

  /**
   * One palm's frame where the bridge leaves it, raised off the track.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame.
   * @evidence contracts/development/design.md#principled-representation A world-metre point and two unit world directions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The three values the placed arm reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Read off the fitted hand, never stated.
   */
  export interface IPalm {
    /** The palm's centre, world metres. */
    point: IAutoMovieVector3;

    /** The palm's outward normal, a unit world vector. */
    facing: IAutoMovieVector3;

    /** The fingers' direction, a unit world vector. */
    forward: IAutoMovieVector3;
  }

  /**
   * The fitted set as the athletics law reads it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member's frame and unit.
   * @evidence contracts/development/design.md#principled-representation The hips' world point, the trunk's pitch in degrees, the joints, each palm and each foot's achieved placement.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values `athletics.plan` reads from the set.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every value is read off the fitted posture.
   */
  export interface ISet {
    /** The hips joint, world metres. */
    hips: IAutoMovieVector3;

    /** The trunk's pitch, degrees. */
    pitch: number;

    /** The fitted joints. */
    joints: IAutoMovieMotionHumanPosture["joints"];

    /** Each palm where its bridge leaves it. */
    palms: Record<AutoMovieHumanSide, IPalm>;

    /** Each foot's achieved placement on its block. */
    feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;
  }

  /**
   * Read the set off its fitted posture.
   *
   * @param body The body.
   * @param posture The fitted posture.
   * @param resolution The set solve's resolution workspace.
   * @param projector The set solve's posture projection, when it has one.
   * @returns The set.
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation One resolution of the fitted posture; the hips, each palm's frame (`HumanHand.frame`) and each foot's achieved frame are read off it.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve, then read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps each foot's achieved block frame; substituting the requested rotation would discard the fitted shape at the toe's contact.
   * @evidence contracts/development/implementation.md#efficient-algorithms One resolution and the five demanded bones.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the set solve's resolution and projection.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh values and keeps no workspace.
   */
  export function read(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    resolution: ReturnType<typeof prepareHumanPoseResolution>,
    projector: ReturnType<typeof prepareHumanPostureProjection> | undefined,
  ): ISet {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
      body,
      resolveHumanPosture.seeded(
        body,
        posture,
        undefined,
        undefined,
        resolution,
        undefined,
        projector,
      ).pose,
      resolution(),
      new Set<AutoMovieHumanoidBone>([
        "hips",
        "leftHand",
        "rightHand",
        "leftFoot",
        "rightFoot",
      ]),
    );
    const palm: (side: AutoMovieHumanSide) => IPalm = (
      side: AutoMovieHumanSide,
    ): IPalm => {
      const at: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
        body,
        bones,
        side,
        "palm",
        "bridge",
      );
      return { point: at.point, facing: at.normal, forward: at.forward };
    };
    const foot: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle: bones.get(`${side}Foot`)!.worldPosition,
      rotation: bones.get(`${side}Foot`)!.worldRotation,
    });
    return {
      hips: bones.get("hips")!.worldPosition,
      pitch: posture.pitch,
      joints: posture.joints,
      palms: { left: palm("left"), right: palm("right") },
      feet: { left: foot("left"), right: foot("right") },
    };
  }
}
