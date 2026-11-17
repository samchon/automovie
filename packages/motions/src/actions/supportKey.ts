import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanBodyFit } from "../posture/HumanBodyFit";
import { HumanBodyFitMerit } from "../posture/HumanBodyFitMerit";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFitPairs } from "../posture/HumanFitPairs";
import { HumanFitVariables } from "../posture/HumanFitVariables";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { stand } from "./stand";
import { supportContact } from "./supportContact";

/**
 * A support planner's key postures (`support`): one solved on a stance's
 * contacts by the whole-body fit, and the course between two of them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two things the file holds and who reads them.
 * @evidence contracts/development/design.md#principled-representation A key is the static multi-contact posture on its contacts; the course between keys is a blend of their joints.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The key's solve and the blend, read by the support law alone.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The fit and the joint blend are their owners' (`HumanBodyFit`, `blendHumanJoint`); no posture is typed.
 */
export namespace supportKey {
  /**
   * The key posture on a set of contacts, refused where a contact misses.
   *
   * @param body The body.
   * @param preferred The posture kept nearest.
   * @param from The key before, the seed.
   * @param contacts The contacts.
   * @param at Each contact's target point.
   * @param label The key's name, for the refusal.
   * @param miss How far a contact may miss its target, millimetres.
   * @param swings The targets of the parts stepping, which bear on nothing; none when absent.
   * @returns The posture.
   * @throws {HumanRefusal} A `reach` refusal on `stances` when a placed contact misses by more than `miss`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The whole-body fit on the contact forms and bearing hull, seeded from the previous solution or geometrically placed preference, whichever violates less of the fit's complete constraint merit before solving once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Forms, two candidate merit readings, one fit and one pass over residuals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact the fit misses is refused, never left where the fit stopped; a swing's residual refuses nothing, since it bears on nothing.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two forward-kinematics merit readings and one fit per key.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `supportContact.form` and `HumanBodyFit.fit`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function solved(
    body: IAutoMovieMotionHumanBody,
    preferred: IAutoMovieMotionHumanPosture,
    from: IAutoMovieMotionHumanPosture,
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
    at: (c: IAutoMovieMotionHumanSupport.IContact) => IAutoMovieVector3 | null,
    label: string,
    miss: number,
    swings: readonly IAutoMovieMotionHumanBodyFitTypes.ITarget[] = [],
  ): IAutoMovieMotionHumanPosture {
    const forms: supportContact.IForm[] = contacts.map(
      (c: IAutoMovieMotionHumanSupport.IContact): supportContact.IForm =>
        supportContact.form(body, c, at(c)),
    );
    const bearing: RegExp[] = forms.flatMap(
      (f: supportContact.IForm): RegExp[] =>
        f.bearing === undefined ? [] : [f.bearing],
    );
    const targets: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = [
      ...forms.map(
        (f: supportContact.IForm): IAutoMovieMotionHumanBodyFitTypes.ITarget =>
          f.target,
      ),
      ...swings,
    ];
    // Select the less violated of the previous solution and the geometrically
    // placed preference before the one SQP solve. This is a seed selection,
    // not a retry: both candidates are measured on the same full merit rows.
    const variables: readonly IAutoMovieMotionHumanJacobian.IVariable[] =
      HumanFitVariables.BODY;
    const merit: HumanBodyFitMerit.IMerit = HumanBodyFitMerit.of({
      body,
      posture: preferred,
      variables,
      targets,
      angles: [],
      bearing,
      balance: { parts: bearing },
      pairs: HumanFitPairs.of(body),
      key: HumanFitVariables.vector(variables, preferred),
      price: HumanBodyFit.PRICE,
    });
    const previous: HumanBodyFitMerit.IEvaluation = merit.evaluate(
      HumanFitVariables.vector(variables, from),
    );
    const stated: HumanBodyFitMerit.IEvaluation = merit.evaluate(
      HumanFitVariables.vector(variables, preferred),
    );
    const start: IAutoMovieMotionHumanPosture =
      stated.violation < previous.violation ? preferred : from;
    const result: IAutoMovieMotionHumanBodyFitTypes.IResult = HumanBodyFit.fit({
      body,
      posture: preferred,
      start,
      targets,
      bearing,
      balance: { parts: bearing },
    });
    result.residuals.forEach(
      (r: { point: number; turn: number }, k: number): void => {
        if (k < contacts.length && at(contacts[k]!) !== null && r.point > miss)
          throw new HumanRefusal({
            kind: "reach",
            axis: "stances",
            value: r.point,
            reason: `the ${contacts[k]!.part} misses its target by ${r.point.toFixed(1)} mm at ${label}, past the ${miss} mm a contact may miss by`,
            fix: "move the target nearer the stance's other contacts, or add a stance between",
          });
      },
    );
    return result.posture;
  }

  /**
   * A stance's preferred posture: its stated posture (`prefer`) over the key
   * before it, turned by the stance's turn and rested on the floor by its
   * lowest collider and moved across the floor so its contacts that already
   * have a place lie over them, a seed the fit then places by what bears;
   * the posture the body entered with when the stance states none.
   *
   * @param body The body.
   * @param base The posture the body entered with, by its joint angles.
   * @param stance The stance.
   * @param from The key before.
   * @param place Each contact's place, world metres, or null for one without; none placed when absent.
   * @returns The posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both cases and how the stated posture is placed.
   * @evidence contracts/development/implementation.md#principled-implementation The stated tilt and joints use the fit's actual local contact offsets. Their mean Cartesian miss places the seed; floor contacts lower it to the floor, while entirely raised contacts retain their target height without floor penetration.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One posture and one floor reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms One contact-point resolution per anchor and one floor reading per stance.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanColliders.lowest`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function preferred(
    body: IAutoMovieMotionHumanBody,
    base: IAutoMovieMotionHumanPosture,
    stance: IAutoMovieMotionHumanSupport.IStance,
    from: IAutoMovieMotionHumanPosture,
    place: (
      c: IAutoMovieMotionHumanSupport.IContact,
    ) => IAutoMovieVector3 | null = (): null => null,
  ): IAutoMovieMotionHumanPosture {
    if (stance.prefer === undefined) return base;
    const anchors: {
      contact: IAutoMovieMotionHumanSupport.IContact;
      at: IAutoMovieVector3;
    }[] = stance.contacts.flatMap(
      (
        c: IAutoMovieMotionHumanSupport.IContact,
      ): {
        contact: IAutoMovieMotionHumanSupport.IContact;
        at: IAutoMovieVector3;
      }[] => {
        const at: IAutoMovieVector3 | null = place(c);
        return at === null ? [] : [{ contact: c, at }];
      },
    );
    const turned: IAutoMovieMotionHumanPosture = {
      root: from.root,
      yaw: base.yaw + (stance.turn ?? 0),
      pitch: stance.prefer.pitch,
      roll: stance.prefer.roll,
      // A stated posture is a whole one: what it leaves unstated hangs as the
      // body's relaxed arms (`stand.relaxed`), not as the entry held it.
      joints: {
        ...base.joints,
        ...stand.relaxed(body),
        ...stance.prefer.joints,
      },
      limbs: {},
    };
    let dx: number = 0;
    let dy: number = 0;
    let dz: number = 0;
    for (const a of anchors) {
      const now: IAutoMovieVector3 = supportContact.point(
        body,
        turned,
        a.contact,
        a.at,
      );
      dx += (a.at.x - now.x) / anchors.length;
      if (a.at.y > 0) dy += (a.at.y - now.y) / anchors.length;
      dz += (a.at.z - now.z) / anchors.length;
    }
    const keyed: IAutoMovieMotionHumanPosture = {
      ...turned,
      root: {
        x: turned.root.x + dx,
        y: turned.root.y + dy,
        z: turned.root.z + dz,
      },
    };
    const low: number = HumanColliders.lowest(
      body,
      poseBones(body, resolveHumanPosture(body, keyed)),
    );
    const grounded: boolean = stance.contacts.some(
      (c: IAutoMovieMotionHumanSupport.IContact): boolean =>
        supportContact.form(body, c, place(c)).bearing !== undefined,
    );
    return {
      ...keyed,
      root: {
        ...keyed.root,
        y: keyed.root.y - (grounded ? low : Math.min(0, low)),
      },
    };
  }

  /**
   * Two keys blended by a share, each joint on its own range, the root and
   * the turn linearly.
   *
   * @param body The body.
   * @param a The key at share 0.
   * @param b The key at share 1.
   * @param w The share.
   * @returns The posture, by joint angles alone.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is blended and how.
   * @evidence contracts/development/implementation.md#principled-implementation A free movement between two postures is smooth in joint space (Flash and Hogan 1985 for its minimum-jerk share), each joint on its range (`blendHumanJoint`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the joints of either key.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The heading takes the shorter arc, so a turn across south is not a spin.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the joints, no algorithm to choose.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `blendHumanJoint`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function blended(
    body: IAutoMovieMotionHumanBody,
    a: IAutoMovieMotionHumanPosture,
    b: IAutoMovieMotionHumanPosture,
    w: number,
  ): IAutoMovieMotionHumanPosture {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    const bones: Set<AutoMovieHumanoidBone> = new Set([
      ...(Object.keys(a.joints) as AutoMovieHumanoidBone[]),
      ...(Object.keys(b.joints) as AutoMovieHumanoidBone[]),
    ]);
    for (const bone of bones)
      joints[bone] = blendHumanJoint(
        body,
        bone,
        a.joints[bone] ?? [0, 0, 0],
        b.joints[bone] ?? [0, 0, 0],
        w,
      );
    return {
      root: Vector3.lerp(a.root, b.root, w),
      yaw: a.yaw + (((b.yaw - a.yaw + 540) % 360) - 180) * w,
      pitch: a.pitch + (b.pitch - a.pitch) * w,
      roll: a.roll + (b.roll - a.roll) * w,
      joints,
      limbs: {},
    };
  }
}
