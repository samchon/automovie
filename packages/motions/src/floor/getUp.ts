import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBase,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGetUp,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieMotionManner,
  IAutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { support } from "../actions/support";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanBoneGroups } from "../posture/HumanBoneGroups";
import { HumanHand } from "../posture/HumanHand";
import { humanPostureHeading } from "../posture/humanPostureHeading";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { floorEntry } from "./floorEntry";
import { lieDown } from "./lieDown";

/** The record of `IKeyedA`'s site. */
type IKeyedA = { hip: number; knee: number; ankle: number; shoulder: number };

/** The alternatives of `PlanStancesPart`'s site. */
type PlanStancesPart = IAutoMovieMotionHumanSupport.Part | "lead" | "trail";

/** The alternatives of `ItemEntryItem`'s site. */
type ItemEntryItem = IAutoMovieMotionHumanSupport.Part | "lead" | "trail";

/**
 * Getting up from the floor to standing: from lying on the back or the front,
 * from the hands and knees or crouched, as a crawl ends.
 *
 * Rising from the floor is described by the movement of three body regions
 * (VanSant 1988, Phys Ther 68:185, "Rising from a supine position to erect
 * stance"): the arms, the head and trunk (the axial region) and the legs. The
 * one combination VanSant found most often among adults, though in only a
 * quarter of them, is symmetrical throughout: the trunk flexes forward out of
 * supine with both hands pushing, the body comes through sitting to a squat and
 * stands. That is the `symmetric` pattern, the default from the back. The other
 * end of VanSant's axial scale is a full rotation: the body rolls over to face
 * the floor, comes up onto the hands and knees, through a half kneel to
 * standing; that is the `rotation` pattern, the only way up from the front and
 * from the hands and knees, whose first postures it has already passed.
 *
 * The rise is a support sequence (`support`): each posture of the route is a
 * stance resting on what that posture bears on (`BEARS`), its key solved by the
 * whole-body fit nearest the route's posture (`POSES`, provisional angles, with
 * `lieDown`'s own floor postures where they are the same) with those parts on
 * the floor and the centre of mass over them, a new support placed before an
 * old one lets go, the body carried between keys about a support both hold and
 * resting on the floor by its colliders at every instant. The first stance
 * leaves from the posture the entry displays, so the rise continues from where
 * the body lies.
 *
 * Young adults rise from supine to standing in 2.6 s on average at their own
 * pace (Ulbrich et al. 2000, J Am Geriatr Soc 48:1626); the route's phases
 * share that time equally (provisional split), scaled by the manner's tempo.
 * Events: one per posture reached, then `standing`.
 *
 * Not yet: a partial rotation (one hand pushing from the side) and the half
 * kneel out of the symmetric squat, VanSant's other adult variants.
 */
export namespace getUp {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "getUp";

  /** Cancel table: once standing, into anything a stand can become. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["standing", 1], kind: "inertialize", entry: 0 }],
  };
  /** The patterns of {@link Pattern}, as data. */
  export const PATTERNS: readonly ["symmetric", "rotation"] = [
    "symmetric",
    "rotation",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanGetUp.Pattern>[];
  /**
   * The share of the trained young adult's supine-to-stand time a body takes,
   * seconds (Ulbrich et al. 2000: 2.6 s).
   */
  export const SECONDS: number = 2.6;

  /**
   * The postures of the routes, after `lieDown`'s floor postures (provisional
   * angles): the deep squat with the trunk forward and the arms reaching ahead,
   * the shanks leaning to the ankle's dorsiflexion range; the half kneel on the
   * trailing knee with the leading foot flat ahead; standing.
   */
  export const POSES: Readonly<
    Record<IAutoMovieMotionHumanGetUp.Stage, IAutoMovieMotionHumanLieDown.IPose>
  > = {
    sit: lieDown.POSES.sit,
    squat: keyed(40, { hip: 120, knee: 100, ankle: 20, shoulder: 60 }),
    prone: lieDown.POSES.prone,
    quadruped: lieDown.POSES.quadruped,
    halfKneel: {
      pitch: 5,
      roll: 0,
      joints: {
        ...HumanHand.shape("left", "relaxed"),
        ...HumanHand.shape("right", "relaxed"),
        rightUpperLeg: [90, 5, 0],
        rightLowerLeg: [90, 0, 0],
        rightFoot: [0, 0, 0],
        leftUpperLeg: [0, 5, 0],
        leftLowerLeg: [95, 0, 0],
        leftFoot: [-30, 0, 0],
        leftUpperArm: [20, 10, 0],
        rightUpperArm: [20, 10, 0],
      },
    },
    stood: { pitch: 0, roll: 0, joints: {} },
  };

  /**
   * What each posture of the routes bears on (VanSant 1988's regions): the
   * seat, the heels and both hands pushing while sitting up, the feet in the
   * squat and standing, the front lying prone, the hands, knees and toes on the
   * hands and knees, and the trailing knee with both feet in the half kneel
   * (`lead`, the leading foot; `trail`, the trailing knee).
   */
  export const BEARS: Readonly<
    Record<IAutoMovieMotionHumanGetUp.Stage, readonly ItemEntryItem[]>
  > = {
    sit: ["seat", "leftFoot", "rightFoot", "leftHand", "rightHand"],
    squat: ["leftFoot", "rightFoot"],
    prone: ["front"],
    quadruped: [
      "leftHand",
      "rightHand",
      "leftKnee",
      "rightKnee",
      "leftFoot",
      "rightFoot",
    ],
    halfKneel: ["trail", "leftFoot", "rightFoot"],
    stood: ["leftFoot", "rightFoot"],
  };
  /** The routes, each a list of postures with the event of its arrival. */
  export const ROUTES: Readonly<
    Record<
      IAutoMovieMotionHumanGetUp.Pattern,
      readonly (readonly [IAutoMovieMotionHumanGetUp.Stage, string])[]
    >
  > = {
    symmetric: [
      ["sit", "seated"],
      ["squat", "squatting"],
      ["stood", "standing"],
    ],
    rotation: [
      ["prone", "prone"],
      ["quadruped", "handsAndKnees"],
      ["halfKneel", "halfKneeling"],
      ["stood", "standing"],
    ],
  };

  /**
   * Plan a rise from the floor: the route's postures as stances of the support
   * planner (`support`), each resting on the parts its posture bears on
   * (`BEARS`), keyed by its posture (`POSES`) and lasting its share of the
   * rise.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} `base` when the body already stands, sits on a seat
   *   or hangs, and what the support planner refuses.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGetUp.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const kind: IAutoMovieMotionHumanBase.Kind = context.entry.base.kind;
    if (
      kind === "standing" ||
      kind === "seated" ||
      kind === "hanging" ||
      kind === "leaning"
    )
      throw new HumanRefusal({
        kind: "base",
        axis: "base",
        value: kind,
        feasible: {
          kind: "alternatives",
          values: ["lying", "kneeling", "crouched"],
        },
        reason: `getUp rises from the floor, and the body is ${kind} where it starts`,
        fix:
          kind === "seated"
            ? "rise from a seat with rise"
            : "lie down, kneel or crawl before it, or leave it out",
      });
    const entered: IAutoMovieMotionHumanPosture = floorEntry.displayed(context);
    const heading: IAutoMovieQuaternion = humanPostureHeading(entered);

    // On the back the chest faces up; anything else rises by the rotation.
    const up: number = Quaternion.rotateVector(heading, { x: 0, y: 0, z: 1 }).y;
    const supine: boolean = kind === "lying" && up > 0;
    const pattern: IAutoMovieMotionHumanGetUp.Pattern = supine
      ? (context.params.pattern ?? "symmetric")
      : "rotation";

    // From the back the whole route; from the front it starts past the roll,
    // and from the hands and knees past the hands and knees as well.
    const route: readonly (readonly [
      IAutoMovieMotionHumanGetUp.Stage,
      string,
    ])[] =
      kind !== "lying"
        ? ROUTES.rotation.slice(2)
        : supine
          ? ROUTES[pattern]
          : ROUTES.rotation.slice(1);
    const lead: AutoMovieHumanSide = context.params.lead ?? "right";
    const trail: AutoMovieHumanSide = lead === "right" ? "left" : "right";

    // Each phase takes its share of a whole rise from lying.
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    const phase: number =
      (SECONDS / ROUTES[supine ? pattern : "rotation"].length) *
      modifiers.tempo;

    // Standing is the stand law's quiet stance (`quiet`).
    const stood: IAutoMovieMotionHumanLieDown.IPose = quiet(context.body);

    // The stances: each posture of the route on what it bears on, turned half
    // about the vertical after a roll from the back, so the head stays where
    // it lay.
    // The leading foot steps ahead into the half kneel, and the trailing foot
    // steps up beside it to stand.
    const floorFeet: FootTargets =
      pattern === "symmetric"
        ? symmetricFeet(context.body, entered, stood)
        : {};
    const stances: IAutoMovieMotionHumanSupport.IStance[] = route.map(
      (
        [key, event]: (typeof route)[number],
        i: number,
      ): IAutoMovieMotionHumanSupport.IStance => ({
        contacts: BEARS[key].map(
          (part: PlanStancesPart): IAutoMovieMotionHumanSupport.IContact => ({
            part:
              part === "lead"
                ? `${lead}Foot`
                : part === "trail"
                  ? `${trail}Knee`
                  : part,
            kind: "bear",
            ...(part === "leftFoot"
              ? floorFeet.left
              : part === "rightFoot"
                ? floorFeet.right
                : {}),
            ...((key === "halfKneel" && part === `${lead}Foot`) ||
            (key === "stood" &&
              route[i - 1]?.[0] === "halfKneel" &&
              part === `${trail}Foot`)
              ? { step: true }
              : {}),
          }),
        ),
        seconds: phase,
        prefer:
          key === "stood"
            ? stood
            : key === "halfKneel"
              ? halfKneeling(lead)
              : POSES[key],
        turn: supine && pattern === "rotation" ? 180 : 0,
        event,
      }),
    );
    if (kind === "lying" && pattern === "rotation") {
      // The palms take the upper body's weight before the trunk leaves the
      // floor for the hand-and-knee stance (VanSant 1988).
      // Introduce their contact within the original quadruped phase.
      const index: number = supine ? 1 : 0;
      const handsAndKnees: IAutoMovieMotionHumanSupport.IStance =
        stances[index]!;
      const placement: IAutoMovieMotionHumanSupport.IStance = {
        ...handsAndKnees,
        prefer: PUSH,
        contacts: [
          { part: "front", kind: "bear" },
          ...handsAndKnees.contacts.filter(
            (contact: IAutoMovieMotionHumanSupport.IContact): boolean =>
              contact.part.endsWith("Hand"),
          ),
        ],
        seconds: phase / 2,
        event: "palmsDown",
      };
      stances.splice(index, 1, placement, {
        ...handsAndKnees,
        seconds: phase / 2,
      });
    }
    const planned: IAutoMovieMotionHumanActionPlan = support.plan({
      ...context,
      params: { stances },
    });
    planned.base = { kind: "standing" };
    return planned;
  }
  /**
   * Standing as the stand law's quiet stance, the posture every performer
   * starts from, by its resolved joints: the stated posture a support sequence
   * ends standing in.
   *
   * @param body The body.
   * @returns The tilt, none, and the joints.
   */
  export function quiet(
    body: IAutoMovieMotionHumanBody,
  ): IAutoMovieMotionHumanLieDown.IPose {
    const pose: IAutoMoviePose = resolveHumanPosture(
      body,
      stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
    );
    const joints: IAutoMovieMotionHumanJoints.Angles = {};
    for (let i: number = 0; i < pose.joints.length; ++i) {
      const joint: IAutoMovieJointPose = pose.joints[i]!;
      joints[joint.bone] = [
        joint.flexion ?? 0,
        joint.abduction ?? 0,
        joint.twist ?? 0,
      ];
    }
    return { pitch: 0, roll: 0, joints };
  }
  /**
   * The half-kneeling key with the specified leading foot. The other knee is
   * the bearing knee. The same key seeds transfers onto a raised knee.
   */
  export function halfKneeling(
    lead: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanLieDown.IPose {
    return lead === "left" ? mirrored(POSES.halfKneel) : POSES.halfKneel;
  }

  /** A floor posture from its tilt and symmetric limb angles. */
  function keyed(
    pitch: number,
    a: IKeyedA,
  ): IAutoMovieMotionHumanLieDown.IPose {
    // The hands at rest; every arm angle is the key's own below.
    const joints: IAutoMovieMotionHumanJoints.Angles = {
      ...HumanHand.shape("left", "relaxed"),
      ...HumanHand.shape("right", "relaxed"),
    };
    for (const side of ["left", "right"] as const) {
      joints[`${side}UpperLeg`] = [a.hip, 8, 0];
      joints[`${side}LowerLeg`] = [a.knee, 0, 0];
      joints[`${side}Foot`] = [a.ankle, 0, 0];
      joints[`${side}UpperArm`] = [a.shoulder, 10, 0];
      joints[`${side}LowerArm`] = [10, 0, 0];
    }
    return { pitch, roll: 0, joints };
  }

  /** A posture with its left and right sides exchanged. */
  function mirrored(
    pose: IAutoMovieMotionHumanLieDown.IPose,
  ): IAutoMovieMotionHumanLieDown.IPose {
    const joints: IAutoMovieMotionHumanJoints.Angles = {};
    for (const [bone, angles] of Object.entries(pose.joints) as [
      AutoMovieHumanoidBone,
      readonly [number, number, number],
    ][])
      joints[
        (bone.startsWith("left")
          ? bone.replace(/^left/, "right")
          : bone.replace(/^right/, "left")) as AutoMovieHumanoidBone
      ] = angles;
    return { ...pose, joints };
  }
}

/** The new supports established before the symmetric crouch. */
type FootTargets = Partial<Record<AutoMovieHumanSide, IFootTarget>>;

/** A newly placed foot's fixed world target. */
interface IFootTarget {
  target: IAutoMovieMotionTarget;
}

/**
 * Place the unplanted feet at the sit key's preferred centre with their
 * eventual quiet stance's separation. Only the new placement is set here; the
 * same two contacts persist through squat and stand.
 */
function symmetricFeet(
  body: IAutoMovieMotionHumanBody,
  entry: IAutoMovieMotionHumanPosture,
  stood: IAutoMovieMotionHumanLieDown.IPose,
): FootTargets {
  const seated = getUp.POSES.sit;
  const feet = (
    key: IAutoMovieMotionHumanLieDown.IPose,
  ): Record<AutoMovieHumanSide, IAutoMovieVector3> => {
    const read = poseBones(
      body,
      resolveHumanPosture(body, { ...entry, ...key, limbs: {} }),
      undefined,
      HumanBoneGroups.TOES,
    );
    return {
      left: read.get("leftToes")!.worldPosition,
      right: read.get("rightToes")!.worldPosition,
    };
  };
  const sitting = feet(seated);
  const standing = feet(stood);
  const centre = Vector3.scale(Vector3.add(sitting.left, sitting.right), 0.5);
  const across = Vector3.scale(
    Vector3.subtract(standing.left, standing.right),
    0.5,
  );
  return {
    left: {
      target: {
        kind: "point",
        at: { ...Vector3.add(centre, across), y: 0 },
        frame: "world",
      },
    },
    right: {
      target: {
        kind: "point",
        at: { ...Vector3.subtract(centre, across), y: 0 },
        frame: "world",
      },
    },
  };
}

/** Prone key with both elbows near right angles as the palms take the press. */
const PUSH: IAutoMovieMotionHumanLieDown.IPose = {
  ...lieDown.POSES.prone,
  joints: {
    ...lieDown.POSES.prone.joints,
    leftLowerArm: [90, 0, 0],
    rightLowerArm: [90, 0, 0],
  },
};
