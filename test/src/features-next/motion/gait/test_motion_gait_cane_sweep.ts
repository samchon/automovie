import { createLongCane } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCaneSweep,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import { checkTakeClean } from "../../../features/internal/checkTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Where the cane stands before it is taken up, beside the right foot, world
 * metres.
 */
const STAND: IAutoMovieVector3 = { x: -0.3, y: 0, z: 0.3 };

/** How far the walk goes along the corridor, metres. */
const CORRIDOR: number = 4;

/**
 * How long the cane is swept over the walk, seconds: within the corridor walk's
 * time, long enough for several steps.
 */
const SWEEP: number = 2.8;

/**
 * How close a touching tip lies to the floor, metres: the campaign's
 * ground-contact bound.
 */
const FLOOR: number = 0.002;

/**
 * The most the tip rises between two touches, metres: no more than an inch
 * (APH, Orientation and mobility, the two-point touch).
 */
const LIFT: number = 0.0254;

/**
 * How far beyond the body's widest part the arc may reach, metres: about an
 * inch beyond it (Kim, Wall Emerson and Naghshineh 2017), with an inch of
 * tolerance.
 */
const BEYOND: number = 0.0508;

/**
 * How far off the midline the cane hand may lie, metres: the touch contract's
 * 10 mm disc on each side of it, doubled for the pelvis's own sway.
 */
const MIDLINE: number = 0.02;

/**
 * Sweeping a long white cane along a corridor walk (#3994).
 *
 * Scenarios, on the average man and the small woman, the cane fitted to the
 * sternum and taken up from where it stands, for the two-point touch and
 * constant contact, each take clean:
 *
 * 1. At every touch the tip is on the floor on the side opposite the foot that
 *    lands.
 * 2. Each touch lies between the shoulder's half width and an inch beyond the
 *    body's widest part, so the arc spans the shoulder-width band.
 * 3. Between touches the two-point tip rises off the floor no more than an inch,
 *    while the constant-contact tip stays on it.
 * 4. The cane hand stays at the body's midline through the sweep.
 * 5. The shortest cane, too short to reach the floor beside the body from the
 *    waist, is refused on `prop`, and the refusal names the floor it cannot
 *    reach (the caneSweep contract: "a cane too short to reach the floor ahead
 *    … is refused"), so a fitted cane refused on `prop` for another reason does
 *    not pass it. The fitted canes of scenarios 1 to 4 are its adjacent valid
 *    cases.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take, the cases and their bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the overlay's touch events, the cane's displayed tip, the displayed feet, hips and grip socket; a touch in the air or on the stepping foot's side, an arc too narrow or wide, a two-point tip dragging or flying, a constant tip leaving the floor, a hand off the midline or an admitted short cane fails.
 * @evidence contracts/development/testing.md#independent-expectations The touch rule, the arc's width and the lift are the Hoover technique's (APH; Kim, Wall Emerson and Naghshineh 2017); the cane's length is the sternum fitting; the floor bound is the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, both techniques and the refused short cane; the cane and walker gaits are the aided support transfer spec's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain.
 */
export function test_motion_gait_cane_sweep(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const fit of ["m-average", "f-small"] as const)
    for (const technique of ["twoPoint", "constant"] as const)
      try {
        verify(checks, motionHumanBody(fit), `${fit} ${technique}`, technique);
      } catch (error: unknown) {
        checks.check(
          `${fit} ${technique}: ${error instanceof Error ? error.message : String(error)}`,
          false,
        );
      }

  // 5. The shortest cane.
  checks.check(
    "a cane too short to reach the floor from the waist is refused on the prop, for that floor",
    ((): boolean => {
      try {
        sweep(
          motionHumanBody("m-average"),
          createLongCane({ length: createLongCane.BANDS.length.minimum }),
          "twoPoint",
        ).bones("a", 3);
        return false;
      } catch (error: unknown) {
        return (
          error instanceof HumanRefusal &&
          error.axis === "prop" &&
          /reach the floor/.test(error.message)
        );
      }
    })(),
  );
  checks.assert("the long cane sweeps meet their acceptance");
}

/** One body's sweep in one technique and its checks 1 to 4. */
function verify(
  checks: motionComplaints.IGatherer,
  body: IAutoMovieMotionHumanBody,
  label: string,
  technique: IAutoMovieMotionHumanCaneSweep.Technique,
): void {
  const length: number = Math.min(
    createLongCane.BANDS.length.maximum,
    Math.max(createLongCane.BANDS.length.minimum, sternum(body)),
  );
  {
    {
      const cane: ReturnType<typeof createLongCane> = createLongCane({
        length,
      });
      const film: HumanPerformance = sweep(body, cane, technique);
      checkTakeClean(checks, label, film);
      const overlay: IAutoMovieMotionHumanSegment = film.overlays("a")[0]!;
      const touches: number[] = overlay.plan.events
        .filter((e: IAutoMovieMotionEvent): boolean =>
          e.name.startsWith("touch"),
        )
        .map(
          (e: IAutoMovieMotionEvent): number =>
            overlay.start + e.share * overlay.plan.duration,
        );
      const tip = (seconds: number): IAutoMovieVector3 => {
        const frame: IAutoMovieRigidTransform = film.prop("cane", seconds);
        return Vector3.add(
          frame.position,
          Quaternion.rotateVector(frame.rotation, cane.site("tip").translation),
        );
      };
      const widest: number =
        body.measure.shoulderHalfWidth + body.measure.upperArmRadius;
      checks.check(
        `${label}: the sweep touches at every step (${touches.length})`,
        touches.length >= 2,
      );

      // 1 and 2. Each touch: on the floor, opposite the landing foot, in the band.
      for (const t of touches) {
        const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          film.bones("a", t);
        const hips: IAutoMovieVector3 = bones.get("hips")!.worldPosition;
        const left: IAutoMovieVector3 = bones.get("leftFoot")!.worldPosition;
        const right: IAutoMovieVector3 = bones.get("rightFoot")!.worldPosition;
        const at: IAutoMovieVector3 = tip(t);

        // Walking along +Z, the walker's left is +X.
        const lateral: number = at.x - hips.x;
        const leading: number = left.z > right.z ? 1 : -1;
        checks.check(
          `${label}: at ${t.toFixed(2)} s the tip touches the floor opposite the landing foot (${(at.y * 1000).toFixed(1)} mm up, ${(lateral * 1000).toFixed(0)} mm across)`,
          at.y <= FLOOR && lateral * leading < 0,
        );
        checks.check(
          `${label}: at ${t.toFixed(2)} s the touch lies in the shoulder-width band (${(Math.abs(lateral) * 1000).toFixed(0)} mm)`,
          Math.abs(lateral) >= body.measure.shoulderHalfWidth &&
            Math.abs(lateral) <= widest + BEYOND,
        );
      }

      // 3. Between touches.
      for (let i: number = 1; i < touches.length; ++i) {
        const mid: number = (touches[i - 1]! + touches[i]!) / 2;
        const height: number = tip(mid).y;
        checks.check(
          `${label}: between touches ${i} and ${i + 1} the tip ${technique === "twoPoint" ? "lifts no more than an inch" : "stays on the floor"} (${(height * 1000).toFixed(1)} mm)`,
          technique === "twoPoint"
            ? height > FLOOR && height <= LIFT + FLOOR
            : height <= FLOOR,
        );
      }

      // 4. The cane hand at the midline.
      const off: number = Math.max(
        ...touches.map((t: number): number => {
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            film.bones("a", t);
          return Math.abs(
            HumanHand.frame(body, bones, "right", "grip").point.x -
              bones.get("hips")!.worldPosition.x,
          );
        }),
      );
      checks.check(
        `${label}: the cane hand stays at the midline (${(off * 1000).toFixed(1)} mm)`,
        off <= MIDLINE,
      );
    }
  }
}

/** The sternum's standing height, metres: the long cane's fitting length. */
function sternum(body: IAutoMovieMotionHumanBody): number {
  const frame: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.regions.sternum;
  return body.rest.get(frame.bone)!.y + frame.point.y;
}

/**
 * Performer `a` at the origin facing +Z takes the standing cane up in the right
 * hand and walks the corridor sweeping it.
 */
function sweep(
  body: IAutoMovieMotionHumanBody,
  cane: ReturnType<typeof createLongCane>,
  technique: IAutoMovieMotionHumanCaneSweep.Technique,
): HumanPerformance {
  const params: IAutoMovieMotionHumanCaneSweep = {
    prop: "cane",
    hand: "right",
    technique,
    duration: SWEEP,
  };
  const chain: IAutoMovieMotionHumanChain = HumanChain.subject("a")
    .pickUp({ prop: "cane", handle: "grip", hand: "right" })
    .walk({ to: { x: 0, y: 0, z: CORRIDOR } })
    .over((u) => u.registered(AutoMovieMotionHumanGait.caneSweep.name, params));
  return new HumanPerformance({
    seed: "cane sweep",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("cane", cane, {
        position: STAND,
        rotation: Quaternion.identity(),
      }),
    ],
    laws: [AutoMovieMotionHumanGait.caneSweep],
    composition: chain.node,
  });
}
