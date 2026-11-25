import {
  Quaternion,
  Vector3,
  aimRotation,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditStatics,
  HumanContactWindow,
  poseBones,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";

/**
 * One trunk-part case: the part, the region it bears through and whether the
 * still body balances over it.
 */
interface ICase {
  /** The bearing part. */
  part: "head" | "chest";

  /** The physical site whose projected distance this case expects. */
  site: AutoMovieHumanoidRegion;

  /** Supply the site explicitly. The other cases exercise the default. */
  explicit?: true;

  /**
   * Whether the centre of mass lies within the statics bound of the region's
   * point.
   */
  balanced: boolean;
}

/**
 * The head and the chest as contact parts (#4012).
 *
 * Scenarios use one still pose with the crown set on the line of weight. A
 * rigid turn of the original standing bones sets up that premise for the
 * contact-window test while retaining the polygon body's proportions. Each case
 * declares the full load on one trunk-part window.
 *
 * 1. The parts and their default regions are in the contact tables: the back of
 *    the head and the breastbone.
 * 2. The statics audit reads a head or chest window at its region's point: the
 *    crown holds the body. The back of the head (the head's default) and the
 *    breastbone are on opposite sides of the weight line outside the bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the tables and the cases.
 * @evidence contracts/development/testing.md#behavioral-verification Feeds a still body's displayed bones with declared windows to the statics audit; a part missing from the tables or read at another point fails.
 * @evidence contracts/development/testing.md#independent-expectations A rigid turn maps the posed crown-to-centre direction onto world up. The horizontal lengths of the rotated physical site vectors independently predict the three audit readings. The audit's 2 % of stature bound still separates the crown and both defaults.
 * @evidence contracts/development/testing.md#distinguishing-cases Both parts, a named region and each default.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance supplies the bones; the audit runs on them directly.
 */
export function test_motion_contact_window_trunk_parts(): void {
  TestValidator.predicate(
    "the head and the chest are contact parts with their default regions",
    HumanContactWindow.PARTS.includes("head") &&
      HumanContactWindow.PARTS.includes("chest") &&
      HumanContactWindow.REGIONS.head === "headBack" &&
      HumanContactWindow.REGIONS.chest === "sternum",
  );
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const film: HumanPerformance = new HumanPerformance({
    seed: "trunk-parts",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ hold: 1, sway: 0 }).node,
  });
  const bound: number =
    AutoMovieMotionHumanAuditStatics.SHARE * body.measure.stature;
  const pose: IAutoMoviePose = film.pose("a", 0);
  const original: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    film.bones("a", 0);
  const centre: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    body.massModel,
    original,
  );
  const siteVector = (site: AutoMovieHumanoidRegion): IAutoMovieVector3 => {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[site];
    return Vector3.subtract(
      resolveAutoMovieHumanoidSurfaces.point(frame, original.get(frame.bone)!),
      centre,
    );
  };

  // Turn the complete posed rig about its own centre of mass. The contact
  // table is checked against the resulting displayed geometry.
  const turn: IAutoMovieQuaternion = aimRotation(siteVector("crown"), {
    x: 0,
    y: 1,
    z: 0,
  });
  const root: IAutoMovieTransform = pose.root!;
  const held: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    {
      ...pose,
      root: {
        ...root,
        translation: Vector3.add(
          centre,
          Quaternion.rotateVector(
            turn,
            Vector3.subtract(root.translation, centre),
          ),
        ),
        rotation: Quaternion.multiply(turn, root.rotation),
      },
    },
  );
  const cases: readonly ICase[] = [
    { part: "head", site: "crown", explicit: true, balanced: true },
    { part: "head", site: "headBack", balanced: false },
    { part: "chest", site: "sternum", balanced: false },
  ];
  for (const c of cases) {
    const window: IAutoMovieMotionHumanContactWindow = {
      part: c.part,
      kind: "bear",
      from: 0,
      to: 1,
      load: 1,
      support: { kind: "person", subject: "b", region: "shoulderLeft" },
      ...(c.explicit === true ? { region: c.site } : {}),
    };
    const motion: IAutoMovieMotionHumanAuditMotion = {
      duration: 1,
      bones: (): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => held,
      segments: (): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] => [
        {
          name: "rest",
          start: 0,
          entryTime: 0,
          end: 1,
          plan: { duration: 1, contacts: [window] },
        },
      ],
    };
    const value: number = AutoMovieMotionHumanAuditStatics.measure(
      motion,
      "a",
      body,
    ).value;
    const projected: IAutoMovieVector3 = Quaternion.rotateVector(
      turn,
      siteVector(c.site),
    );
    const expected: number = Math.hypot(projected.x, projected.z);
    TestValidator.predicate(
      `a ${c.part} window on ${c.explicit ? c.site : "its default region"} ${c.balanced ? "holds" : "does not hold"} the still body (${(value * 1000).toFixed(3)} mm, expected ${(expected * 1000).toFixed(3)} mm)`,
      nclose(value, expected) && (c.balanced ? value <= bound : value > bound),
    );
  }
}
