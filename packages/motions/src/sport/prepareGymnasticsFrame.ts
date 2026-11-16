import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieCenterOfMass,
} from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { KnockdownFloor } from "../reaction/KnockdownFloor";
import type { GymnasticsFlight } from "./GymnasticsFlight";

/**
 * Prepare one joint-only flight query for both its COM placement and its
 * optional floor reading. The query owns the resolved bones until its caller
 * has read the posture and floor, then releases this preparation.
 *
 * @param body The unchanged body of the current query.
 * @param model Its physical mass model.
 * @param raw The original joint-only posture with no digit goals or separate whole-body rotation.
 * @param centre The desired world centre of mass, metres.
 * @param resolution Optional exact FK reader or lazy supplier borrowed from the current synchronous planning operation.
 * @returns Fresh raw posture demands placed by COM and a floor reader of that same articulation.
 * @throws {Error} When goals or a separate rotation make the shape depend on its translation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States joint-only admission, one-query bone lifetime, metre units and independent demanded posture/floor readings.
 * @evidence contracts/development/implementation.md#principled-implementation Resolve the original clinical demands once at root Y zero. A rigid translation carries its mass-weighted centre and every collider together; COM fixes the new root, while the negated lowest collider at root Y zero is the root height needed to rest the same articulation on the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the fixed query inputs, resolve one canonical bone map, place the raw posture by COM and lend that same map to the floor owner's reduction only on demand.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves raw clinical joints, resolver ROM, collision shapes and exact physical bounds. A position-dependent goal is refused rather than frozen or substituted, and the returned posture still receives ordinary downstream resolution.
 * @evidence contracts/development/implementation.md#efficient-algorithms One canonical resolution/FK in B bones and O(S) segment reduction supplies both real consumers; floor demand adds only O(C) collider bounds. It avoids the original second floor FK without changing bisection stations or tolerance; speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only the current query's articulation shares canonical bones between COM/floor. An explicit synchronous planning reader may also share exactly unchanged FK dependencies between bisection stations; changed angles/joints still evaluate, without a time-keyed result cache.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Each frame owns one current-query map and fresh raw posture. Its floor reader captures only body/map, never the optional FK reader/supplier, which stays with the synchronous planning caller or releases on return/throw; no global history or external handle is acquired.
 */
export function prepareGymnasticsFrame(
  body: IHumanBody,
  model: GymnasticsFlight.Model,
  raw: IHumanPosture,
  centre: IAutoMovieVector3,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): prepareGymnasticsFrame.IFrame {
  if (
    Object.values(raw.limbs).some((goal: IHumanPosture.IGoal | undefined): boolean => goal !== undefined) ||
    Object.values(raw.digits ?? {}).some((goal: IHumanPosture.IDigitGoal | undefined): boolean => goal !== undefined) ||
    raw.rotation !== undefined
  )
    throw new Error("Gymnastic frame preparation requires joint-only articulation");

  const source: IHumanPosture = { ...raw, root: { ...raw.root, y: 0 } };
  const read: ReturnType<typeof prepareHumanPoseResolution> = prepareHumanPoseResolution(resolution);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(body, resolveHumanPosture.seeded(body, source, undefined, undefined, read).pose, read());
  const com: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(model, bones);
  return {
    posture: {
      ...raw,
      root: {
        x: source.root.x + (centre.x - com.x),
        y: centre.y - com.y,
        z: source.root.z + (centre.z - com.z),
      },
    },
    floor: (): number => -KnockdownFloor.lowest(body, bones),
  };
}

/**
 * The two real readings sharing one joint-only query's canonical geometry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The frame documents raw posture provenance, exact floor reading and operation lifetime.
 * @evidence contracts/development/design.md#principled-representation Shares canonical geometry between COM placement and floor bounds while preserving the original raw posture separately.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One frame record serves those two existing law consumers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No alternate accepted pose, cached verdict, source flag or range override is exposed.
 */
export namespace prepareGymnasticsFrame {
  /**
   * COM-placed raw demands and a floor-height reader of the same articulation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Members state demanded versus resolved ownership, units and the synchronous query lifetime.
   * @evidence contracts/development/design.md#principled-representation Keeps the law's original posture separate from the floor height derived from its canonical collider geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The flight law reads the posture and its touchdown check reads floor; no prepared state enters the public action interface.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Contains no resolved flag, altered target or stored acceptance verdict; the floor remains the real collider reduction.
   */
  export interface IFrame {
    /** Original clinical demands with only the root moved to the requested COM. */
    posture: IHumanPosture;

    /**
     * Read the root Y that rests this articulation's lowest collider on zero.
     * Release the reader with its current query frame.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States metre units through root Y, floor-zero convention and frame-owned lifetime.
     * @evidence contracts/development/implementation.md#principled-implementation Delegates the current canonical bone map's exact collider bounds to KnockdownFloor.lowest, then negates its minimum Y.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One reduction keeps physical floor policy in its existing owner.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every actual collider bound is still evaluated; no cached floor verdict or tolerance changes the contact.
     * @evidence contracts/development/implementation.md#efficient-algorithms O(C) shape bounds without another canonical solve/FK.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the same synchronous query's bones as COM placement; distinct postures never share this frame.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows its frame's map through the query, with no external handle or global retention.
     */
    floor(): number;
  }
}
