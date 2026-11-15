import type {
  IAutoMovieSeededChainFit,
  IAutoMovieSwivelNear,
} from "@automovie/engine";
import type { IAutoMoviePose, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmMirror } from "./HumanArmMirror";
import { HumanLimbFit } from "./HumanLimbFit";
import { HumanLimbFitFrame } from "./HumanLimbFitFrame";
import { HumanLimbMirror } from "./HumanLimbMirror";
import type { IHumanPosture } from "./IHumanPosture";

/**
 * The memory of limb fits (`HumanLimbFit.fit`): each body's fits kept by
 * every input they are a pure function of, read again instead of solved
 * again, and the switch that turns the memory off for a check against the
 * solver.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, by what and why.
 * @evidence contracts/development/design.md#principled-representation A memo of a pure function, owned by the body it fits.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The remembered fit and the memory's switch.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fit is `HumanLimbFit`'s; nothing here solves one.
 */
export namespace HumanLimbFitMemory {  /**
   * Turn the memory of limb fits off or on again. Off, every fit is solved
   * afresh and nothing is kept, which is what a check of the memory against
   * the solver compares with; it is on unless turned off.
   *
   * @param on Whether fits are remembered.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each setting does and the default.
   * @evidence contracts/development/implementation.md#principled-implementation One switch read by every remembered fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One assignment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Off keeps nothing, so a comparison reads the solver alone.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The fits kept are bounded by `remembered`.
   */
  export function memory(on: boolean): void {
    REMEMBERING.on = on;
  }

  /**
   * The fit of one limb, remembered: the same body, the same pose before the
   * fit, the same limb, goal and arms placed before it give the same fit, so
   * it is solved once and read again. A plan's own posture and the displayed
   * pose of the same instant ask the same fit, and so does every instant of a
   * held pose; an arm's fit with its clearance search is most of what a
   * displayed pose costs.
   *
   * The fit is a pure function of exactly what the key holds: the limb, the
   * arms placed before it, the whole goal (point, bend, rotation, contact,
   * planted, the bone it is attached to, the reference with its weight, and
   * the other bodies' colliders it keeps clear of, each with its frame and
   * shapes) and the pose before the fit (its root's translation, rotation
   * and scale and every joint's angles, which is where the trunk, the other
   * limbs already fitted and any layer have left the body). The body itself,
   * with its skeleton, topology, ranges and shapes, is the memory's owner.
   * Nothing else is read: the solver draws nothing and keeps no state.
   *
   * Each body keeps its last `FIT_MEMORY` fits, the least recently read
   * dropped first, and a body no longer held drops them all. A left limb's
   * fit is kept under its mirror's key, the right limb's (`fit`), so a fit
   * and its mirror image are one entry, with the seed it was chosen at.
   *
   * The key and the solve are in the root's floor frame (`HumanLimbFitFrame`):
   * the pose's root, the goal's point, bend, contact and rotation and the
   * rival wrist are moved by minus the root's floor point and turned by minus
   * its heading, so one body doing the same thing in another place or facing
   * another way reads the same fit. A hit hands back the stored pose with the
   * caller's own root and the stored seed unchanged: the seed's swivel and
   * branch live in the chain root's bone-local frame, which a turn about +Y
   * and a floor translation leave invariant. A goal attached to a bone or
   * naming other bodies' colliders, and a pose without a root, stay keyed in
   * the world.
   *
   * A fit continued from a nearby one (`near`) is kept under that seed too,
   * which is one more input it is a pure function of: an entry and the cut
   * after it read the same continued samples, and the second reads them here.
   *
   * @param body The performer's body.
   * @param pose The pose before the fit.
   * @param limb The limb.
   * @param goal Its goal, attached or not.
   * @param placed The arms already placed.
   * @param rival Where the other arm's wrist will be, while it is still to be fitted.
   * @param near A nearby fit of the same limb to continue; omitted, the fit is solved cold.
   * @returns The pose with the limb fitted, and the seed that continues it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States why a fit can be remembered, exactly what its key holds and how much is kept.
   * @evidence contracts/development/implementation.md#principled-implementation The key is every input of a pure function; the body owns its fits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One key, one lookup, one insertion in recency order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing the fit reads is left out of the key.
   * @evidence contracts/development/implementation.md#efficient-algorithms A map read in place of a fit, the key linear in the pose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fit of an instant already solved is read again.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each body keeps its last `FIT_MEMORY` fits, least recently read dropped first, in a weak map that lets them go with the body.
   */
  export function remembered(
    body: IHumanBody,
    pose: IAutoMoviePose,
    limb: IHumanPosture.Limb,
    goal: IHumanPosture.IGoal,
    placed: readonly ("left" | "right")[],
    rival?: IAutoMovieVector3,
    near?: IAutoMovieSwivelNear,
  ): IAutoMovieSeededChainFit {
    if (!REMEMBERING.on) return HumanLimbFit.fit(body, pose, limb, goal, placed, rival, near);
    // A left limb's fit is its mirror's, remembered under the right limb's
    // key, so a fit and its mirror image share one entry.
    if (limb.startsWith("left")) {
      const image: IAutoMovieSeededChainFit = remembered(
        body,
        HumanLimbMirror.pose(pose),
        HumanLimbMirror.limb(limb),
        HumanLimbMirror.goal(goal),
        placed.map(HumanLimbMirror.side),
        rival === undefined ? undefined : HumanArmMirror.flip(rival),
        near,
      );
      return { pose: HumanLimbMirror.pose(image.pose), seed: image.seed };
    }
    // Keyed and solved in the root's floor frame (`HumanLimbFitFrame`), so
    // one body doing the same thing elsewhere or facing elsewhere shares the
    // fit; handed back with the caller's root and the seed as it is.
    const frame: HumanLimbFitFrame.IFrame | null = HumanLimbFitFrame.of(
      pose,
      goal,
    );
    const own: IAutoMoviePose =
      frame === null ? pose : HumanLimbFitFrame.pose(frame, pose);
    const aim: IHumanPosture.IGoal =
      frame === null ? goal : HumanLimbFitFrame.goal(frame, goal);
    const away: IAutoMovieVector3 | undefined =
      frame === null || rival === undefined
        ? rival
        : HumanLimbFitFrame.point(frame, rival);
    const key: string = JSON.stringify([
      limb,
      placed,
      away ?? null,
      aim,
      own.root,
      own.joints,
      near ?? null,
    ]);
    let fits: Map<string, IAutoMovieSeededChainFit> | undefined =
      FITS.get(body);
    if (fits === undefined) {
      fits = new Map();
      FITS.set(body, fits);
    }
    let out: IAutoMovieSeededChainFit | undefined = fits.get(key);
    HumanLimbFitFrame.count(body, out !== undefined);
    if (out === undefined) out = HumanLimbFit.fit(body, own, limb, aim, placed, away, near);
    else fits.delete(key);
    fits.set(key, out);
    if (fits.size > FIT_MEMORY) fits.delete(fits.keys().next().value!);
    return frame === null
      ? out
      : { pose: { ...out.pose, root: pose.root }, seed: out.seed };
  }

  /** The limb fits remembered, by body. */
  const FITS: WeakMap<
    IHumanBody,
    Map<string, IAutoMovieSeededChainFit>
  > = new WeakMap();

  /** Whether limb fits are remembered (`memory`). */
  const REMEMBERING: { on: boolean } = { on: true };

  /**
   * How many limb fits a body keeps: the least power of two at which the
   * worst scene measured solves no fit twice.
   *
   * The contact scan (`HumanPerformanceContacts`) reads every body at each
   * 120 Hz step of every strike's window, again after each stop it commits,
   * and a display reads them once more. So a body's working set is the fits
   * of every strike window it is read in. The worst scene measured is the
   * website's boxing class: four performers over 13.4 s, 9,956 distinct
   * fits across the four bodies. Fits it solved again after dropping them:
   * - 512: 7,258 of 17,214;
   * - 2,048: 4;
   * - 4,096: none.
   *
   * Measured again once a left fit became its mirror's, read under the
   * right limb's key, on the same composition with the test fixture's
   * bodies (the coach m-large, the members f-small, m-average and
   * f-average), planned and then read at 24 Hz: 32,633 fit reads, 17,366
   * distinct fits, and solved again after dropping them 7,567 at 512, 5,009
   * at 1,024, 127 at 2,048 and none at 4,096, as before the change (17,365
   * distinct). A scene's left and right fits are rarely each other's exact
   * mirror, so the shared key changes the working set by one fit here, and
   * 4,096 stays the least power of two that solves none twice.
   */
  const FIT_MEMORY: number = 4096;
}
