import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmMirror } from "./HumanArmMirror";
import type { HumanArmTrajectory } from "./HumanArmTrajectory";
import type { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";

/**
 * An arms' trajectory problem (`HumanArmTrajectory.IProblem`) read in the
 * mirror image of its world, so that of a problem and its mirror image one
 * is solved and the other is its mirror to the bit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is mirrored and what the mirror reading guarantees.
 * @evidence contracts/development/design.md#principled-representation The mirror across the world's x = 0 plane of every base, site, rest and side of the problem's own record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The test and the mirror, read by `HumanArmTrajectory.solve` and `admitted`, and the refusal told back in the author's names, read by `solve`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts One rule for one arm and for two, in either order.
 */
export namespace HumanArmTrajectoryMirror {
  /**
   * Whether the problem is solved in the mirror image of its world: when its
   * first arm is the left. The mirror takes every arm to the other side in
   * order, so of a problem and its mirror image exactly one begins with the
   * right arm, and that one is solved; the other is its mirror. A left arm
   * alone and a pair listed left first are solved as their mirrors, so
   * mirrored scenes give mirrored paths to the bit.
   *
   * @param problem The problem.
   * @returns Whether its first arm is the left.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule and why exactly one of a mirrored pair is solved.
   * @evidence contracts/development/implementation.md#principled-implementation A canonical representative of the two-element orbit of the mirror is chosen by the first arm's side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No side is preferred by a tolerance or a result.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function leftFirst(problem: HumanArmTrajectory.IProblem): boolean {
    return problem.arms[0]!.side === "left";
  }

  /**
   * A refusal read in the mirror image, told in the author's world: every
   * side it names, an arm's, a bone's or a region's, is the mirror image's,
   * so each is the other side of the author's body.
   *
   * @param refusal The refusal the mirrored problem's solve gave.
   * @returns The same refusal with every side its reason and its fix name taken to the other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States why every side named is swapped.
   * @evidence contracts/development/implementation.md#principled-implementation The mirror takes each side's name to the other's (`mirrored`), so the inverse of a mirrored reading's names is the same swap.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One swap over the reason and the fix.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every other member is kept; the value, the axis and the feasible set name no side.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the text.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function refusal(refusal: HumanRefusal): HumanRefusal {
    const swap = (text: string): string =>
      text.replace(
        /left|right|Left|Right/g,
        (side: string): string => SWAP[side]!,
      );
    return new HumanRefusal({
      kind: refusal.kind,
      ...(refusal.performer === "" ? {} : { performer: refusal.performer }),
      ...(refusal.act === "" ? {} : { act: refusal.act }),
      ...(refusal.instance === 0 ? {} : { instance: refusal.instance }),
      axis: refusal.axis,
      value: refusal.value,
      feasible: refusal.feasible,
      reason: swap(refusal.reason),
      fix: swap(refusal.fix),
    });
  }

  /**
   * A problem in the mirror image of its world: every arm on the other
   * side, its sites, rests and bases mirrored.
   *
   * @param problem The problem.
   * @returns Its mirror image; each base and site is mirrored into one record however often it is read.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is mirrored and the identity of the mirrored records.
   * @evidence contracts/development/implementation.md#principled-implementation The reflection across x = 0 of points and the conjugate reflection of rotations (`HumanArmMirror`), with every bone name taken to its opposite.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Bases, then each arm's side, sites and rests.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every member that names a side or a place is mirrored; the clinical triples read the same on either side and stay.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the waypoints; a base or site already mirrored is found by identity.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A base's and a site's mirror is one record per source record, so the frames and waypoints built on it are built once across the solve's readings.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mirrors are kept weakly by their source records and released with them.
   */
  export function mirrored(
    problem: HumanArmTrajectory.IProblem,
  ): HumanArmTrajectory.IProblem {
    return {
      ...problem,
      bases: problem.bases.map(mirroredBase),
      ...(problem.material === undefined ? {} : {
        material: {
          at: (seconds: number): G.IBase => mirroredBase(problem.material!.at(seconds)),
          bones: problem.material.bones.map((bone: string | undefined) =>
            bone === undefined ? undefined : HumanArmMirror.opposite(bone as AutoMovieHumanoidBone)),
        },
      }),
      arms: problem.arms.map(
        (arm: HumanArmTrajectory.IArm): HumanArmTrajectory.IArm => ({
          ...arm,
          side: arm.side === "left" ? "right" : "left",
          sites: arm.sites.map(
            (s: M.ISite | undefined): M.ISite | undefined =>
              s === undefined ? undefined : mirroredSite(s),
          ),
          ...(arm.rests === undefined
            ? {}
            : {
                rests: arm.rests.map(
                  (r: M.IRest): M.IRest => ({
                    ...r,
                    on: HumanArmMirror.opposite(r.on as AutoMovieHumanoidBone),
                  }),
                ),
              }),
        }),
      ),
    };
  }
}

/** A base's mirror image (`HumanArmMirror.mirrored`), one record per base, so the frames built on it are built once. */
function mirroredBase(base: G.IBase): G.IBase {
  let found: G.IBase | undefined = MIRRORED.get(base);
  if (found === undefined)
    MIRRORED.set(base, (found = HumanArmMirror.mirrored(base)));
  return found;
}

/** A site's mirror image across the world's x = 0 plane, one record per site, as `mirroredBase`. */
function mirroredSite(site: M.ISite): M.ISite {
  let found: M.ISite | undefined = SITES.get(site);
  if (found === undefined) SITES.set(site, (found = flipped(site)));
  return found;
}

/** A site's mirror image, built. */
function flipped(site: M.ISite): M.ISite {
  return {
    ...site,
    point: HumanArmMirror.flip(site.point),
    contact: HumanArmMirror.flip(site.contact),
    ...(site.limits === undefined
      ? {}
      : {
          limits: site.limits.map(
            (
              limit: NonNullable<M.ISite["limits"]>[number],
            ): NonNullable<M.ISite["limits"]>[number] => ({
              ...limit,
              contact: HumanArmMirror.flip(limit.contact),
            }),
          ),
        }),
    ...(site.rotation === undefined
      ? {}
      : { rotation: HumanArmMirror.turn(site.rotation) }),

    // A site riding another arm's segment, in that segment's own frame.
    ...(site.on === undefined
      ? {}
      : {
          on: {
            ...site.on,
            point: HumanArmMirror.flip(site.on.point),
            ...(site.on.normal === undefined
              ? {}
              : { normal: HumanArmMirror.flip(site.on.normal) }),
            ...(site.on.rotation === undefined
              ? {}
              : { rotation: HumanArmMirror.turn(site.on.rotation) }),
          },
        }),
  };
}

/** Each base's mirror image, kept while the base is held. */
const MIRRORED: WeakMap<G.IBase, G.IBase> = new WeakMap();

/** Each site's mirror image, kept while the site is held. */
const SITES: WeakMap<M.ISite, M.ISite> = new WeakMap();

/** A side's name and its mirror's. */
const SWAP: Readonly<Record<string, string>> = {
  left: "right",
  right: "left",
  Left: "Right",
  Right: "Left",
};
