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
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";

import type { motionComplaints } from "../../features/internal/motionComplaints";
import { motionActionUnit } from "./motionActionUnit";

/**
 * The long cane sweep of `test_motion_gait_cane_sweep`, staged as that spec
 * stages it, with its checks 1 to 4 for one body and technique, so each
 * technique is a unit of its own and the cane's pickUp and refusal are checked
 * apart.
 */
export namespace caneSweepScene {
  /** A long cane's model. */
  export type Cane = ReturnType<typeof createLongCane>;

  /**
   * Where the cane stands before it is taken up, beside the right foot, world
   * metres.
   */
  export const STAND: IAutoMovieVector3 = { x: -0.3, y: 0, z: 0.3 };

  /** How far the walk goes along the corridor, metres. */
  const CORRIDOR: number = 4;

  /**
   * How long the cane is swept over the walk, seconds: within the corridor
   * walk's time, long enough for several steps.
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
   * The parts the sweep's overlay owns: the cane arm's, whose findings in the
   * walk's span are the sweep's own.
   */
  const ARM: RegExp =
    /^right(Shoulder|UpperArm|LowerArm|Hand|Thumb|Index|Middle|Ring|Little)/;

  /**
   * The cane fitted to the body: the sternum's standing height, the long cane's
   * fitting length, within the archetype's length band.
   */
  export function fitted(body: IAutoMovieMotionHumanBody): Cane {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions.sternum;
    const sternum: number = body.rest.get(frame.bone)!.y + frame.point.y;
    return createLongCane({
      length: Math.min(
        createLongCane.BANDS.length.maximum,
        Math.max(createLongCane.BANDS.length.minimum, sternum),
      ),
    });
  }

  /**
   * Performer `a` at the origin facing +Z takes the standing cane up in the
   * right hand and walks the corridor sweeping it.
   */
  export function sweep(
    body: IAutoMovieMotionHumanBody,
    cane: Cane,
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
      .over((u) =>
        u.registered(AutoMovieMotionHumanGait.caneSweep.name, params),
      );
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

  /**
   * One body's sweep in one technique with the original's checks 1 to 4 and the
   * sweep's own bounds: its overlay's span of the walk, the cane arm's findings
   * only.
   */
  export function verify(
    checks: motionComplaints.IGatherer,
    body: IAutoMovieMotionHumanBody,
    label: string,
    technique: IAutoMovieMotionHumanCaneSweep.Technique,
  ): void {
    const cane: Cane = fitted(body);
    const film: HumanPerformance = sweep(body, cane, technique);
    const overlay: IAutoMovieMotionHumanSegment = film.overlays("a")[0]!;
    const touches: number[] = overlay.plan.events
      .filter((e: IAutoMovieMotionEvent): boolean => e.name.startsWith("touch"))
      .map(
        (e: IAutoMovieMotionEvent): number =>
          overlay.start + e.share * overlay.plan.duration,
      );
    const tip: (seconds: number) => IAutoMovieVector3 = (
      seconds: number,
    ): IAutoMovieVector3 => {
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

    // The sweep's own bounds: the arm's findings over the overlay's span.
    motionActionUnit.bounds(
      checks,
      label,
      film,
      "a",
      motionActionUnit.segment(film, "a", "walk"),
      { from: overlay.start, to: overlay.end },
      ARM,
    );
  }
}
