import { AutoMovieEngineKinematics, Quaternion, AutoMovieEngineMath } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanAuditMeasure, IAutoMovieMotionHumanAuditMotion, IAutoMovieMotionHumanBody, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { HumanContactWindow } from "../../law/internal/HumanContactWindow";
import { HumanSupportPatch } from "../../posture/internal/HumanSupportPatch";
import { AutoMovieMotionHumanAuditMotion as HumanAuditMotion } from "./AutoMovieMotionHumanAuditMotion";

/**
 * Whether the loads a motion declares on its contacts can hold the body still.
 * A still body's support forces balance its weight along the weight's line of
 * action, so their resultant passes through the point under the centre of mass
 * (the static equilibrium of a rigid body). A contact bearing a share `w` of
 * the weight acts at its centre of pressure, somewhere within its contact
 * patch, so the points the resultant can pass through are the load-weighted
 * Minkowski sum `Σ w P` of the patches, the shares normalized to sum to one.
 * The reading is how far, horizontally, the centre of mass lies outside that
 * region, zero inside.
 *
 * A foot's patch is the outline of its sole where it bears (`HumanFoot.base`,
 * the base of support's own owner); every other contact's patch is its point,
 * the engine's point of its `region` or of its part's default region
 * (`HumanContactWindow.REGIONS`), on the displayed bones. An instant is read
 * when at least one bearing window is open, every open bearing window declares
 * its `load` and one load is positive, since an undeclared share has no weight
 * to check, and when the body is held: its extrapolated centre lies no further
 * from the centre than the bound itself (Hof, Gazendam and Sinke 2005, `x + v /
 * ω0`), so a moving centre's own lead cannot pass for a static error.
 */
export namespace AutoMovieMotionHumanAuditStatics {
  /**
   * The bound on the reading, as a share of stature: 2 % (the
   * motion-dynamics-core campaign's acceptance).
   */
  export const SHARE: number = 0.02;

  /**
   * The worst horizontal distance by which the centre of mass lies outside the
   * load-weighted region of the contact patches, over the held instants with
   * declared loads.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param body Their body.
   * @param rate Grid samples per second.
   * @returns Metres (zero when nothing is read or nothing lies outside), with
   *   the windows and the second.
   */
  export function measure(
    motion: IAutoMovieMotionHumanAuditMotion,
    subject: string,
    body: IAutoMovieMotionHumanBody,
    rate: number = 24,
  ): IAutoMovieMotionHumanAuditMeasure {
    const windows: IAutoMovieMotionHumanAuditMotion.IWindow[] =
      HumanAuditMotion.windows(motion, subject);
    const lead: number =
      1 /
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassFrequency(
        AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPendulum(body.measure.hipHeight),
      );
    const bound: number = SHARE * body.measure.stature;
    const times: number[] = HumanAuditMotion.grid(0, motion.duration, rate);

    // Each grid instant's centre placed once within this measure:
    // consecutive held instants share their neighbours' centres.
    const model: IAutoMovieResolveCenterOfMass.IModel = body.massModel;
    const centres: Map<number, IAutoMovieVector3> = new Map();
    const centre = (i: number): IAutoMovieVector3 => {
      let found: IAutoMovieVector3 | undefined = centres.get(i);
      if (found === undefined) {
        found = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
          model,
          motion.bones(subject, times[i]!),
        );
        centres.set(i, found);
      }
      return found;
    };
    let worst: IAutoMovieMotionHumanAuditMeasure = {
      value: 0,
      seconds: 0,
      where: "none",
    };
    for (let i: number = 0; i < times.length; i++) {
      const t: number = times[i]!;
      const open: IAutoMovieMotionHumanAuditMotion.IWindow[] = bearing(
        windows,
        t,
      );
      if (
        open.length === 0 ||
        open.some(
          (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
            w.contact.load === undefined,
        ) ||
        !open.some(
          (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
            w.contact.load! > 0,
        )
      )
        continue;

      // Held: the extrapolated centre stays within the bound of the centre.
      const before: number = Math.max(0, i - 1);
      const after: number = Math.min(times.length - 1, i + 1);
      const a: IAutoMovieVector3 = centre(before);
      const b: IAutoMovieVector3 = centre(after);
      const span: number = times[after]! - times[before]!;
      const speed: number =
        span > 0 ? Math.hypot(b.x - a.x, b.z - a.z) / span : 0;
      if (speed * lead > bound) continue;

      const value: number = Math.max(
        0,
        -AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMargin(
          centre(i),
          region(body, motion.bones(subject, t), open, motion, t),
        ),
      );
      if (value > worst.value)
        worst = {
          value,
          seconds: t,
          where: open
            .map(
              (w: IAutoMovieMotionHumanAuditMotion.IWindow): string =>
                `${w.action} ${w.contact.part} ${w.contact.load}`,
            )
            .join(", "),
        };
    }
    return worst;
  }

  /**
   * The bearing windows open at an instant: those of a kind that bears the body
   * (`HumanContactWindow.BEARING`), or of any kind with a declared load.
   *
   * @param windows The person's windows, film seconds.
   * @param seconds Film seconds.
   * @returns The open bearing windows.
   */
  export function bearing(
    windows: readonly IAutoMovieMotionHumanAuditMotion.IWindow[],
    seconds: number,
  ): IAutoMovieMotionHumanAuditMotion.IWindow[] {
    return windows.filter(
      (w: IAutoMovieMotionHumanAuditMotion.IWindow): boolean =>
        seconds >= w.from &&
        seconds <= w.to &&
        (HumanContactWindow.BEARING.includes(w.contact.kind) ||
          w.contact.load !== undefined),
    );
  }

  /**
   * A window's contact point on displayed bones: its region's point, or its
   * part's default region's.
   *
   * @param body The body.
   * @param bones The displayed bones.
   * @param contact The window.
   * @returns World metres.
   */
  export const point: typeof HumanSupportPatch.point = HumanSupportPatch.point;

  /**
   * The corners of a window's contact patch: a foot's bearing sole outline when
   * the window names no other region, otherwise its contact point.
   *
   * @param body The body.
   * @param bones The displayed bones.
   * @param contact The window.
   * @returns World metres.
   */
  export const patch: typeof HumanSupportPatch = HumanSupportPatch;

  /**
   * The load-weighted Minkowski sum of the open windows' patches, the shares
   * normalized to sum to one: the hull of the weighted sums of their corners,
   * folded one window at a time.
   *
   * @param body The body.
   * @param bones The displayed bones.
   * @param open The open windows, each with a load, at least one positive.
   * @returns The region's corners, world metres.
   */
  function region(
    body: IAutoMovieMotionHumanBody,
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    open: readonly IAutoMovieMotionHumanAuditMotion.IWindow[],
    motion: IAutoMovieMotionHumanAuditMotion,
    seconds: number,
  ): IAutoMovieVector3[] {
    const total: number = open.reduce(
      (sum: number, w: IAutoMovieMotionHumanAuditMotion.IWindow): number =>
        sum + w.contact.load!,
      0,
    );
    let sum: IAutoMovieVector3[] = [{ x: 0, y: 0, z: 0 }];
    for (const w of open) {
      const share: number = w.contact.load! / total;
      if (share === 0) continue;
      const material: IAutoMovieRigidTransform | undefined =
        w.contact.material === undefined
          ? undefined
          : w.contact.support.kind === "ground"
            ? {
                position: { x: 0, y: w.contact.support.height ?? 0, z: 0 },
                rotation: Quaternion.identity(),
              }
            : motion.support?.(w.contact.support, seconds);
      const corners: IAutoMovieVector3[] = patch(
        body,
        bones,
        w.contact,
        material,
      );
      const next: IAutoMovieVector3[] = [];
      for (const s of sum)
        for (const c of corners)
          next.push({
            x: s.x + share * c.x,
            y: s.y + share * c.y,
            z: s.z + share * c.z,
          });
      sum = next.length >= 3 ? AutoMovieEngineMath.convexHull2D(next) : next;
    }
    return sum;
  }
}
