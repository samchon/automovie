import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanSupport } from "../law/HumanSupport";
import { HumanBodyFit } from "../posture/HumanBodyFit";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
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
   * @evidence contracts/development/implementation.md#principled-implementation The whole-body fit on the contacts' forms, the bearing parts' hull as the balance's base, seeded from the key before (Escande, Kheddar and Miossec 2013).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Forms, one fit, one pass over the residuals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact the fit misses is refused, never left where the fit stopped; a swing's residual refuses nothing, since it bears on nothing.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fit per key.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `supportContact.form` and `HumanBodyFit.fit`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function solved(
    body: IHumanBody,
    preferred: IHumanPosture,
    from: IHumanPosture,
    contacts: readonly HumanSupport.IContact[],
    at: (c: HumanSupport.IContact) => IAutoMovieVector3 | null,
    label: string,
    miss: number,
    swings: readonly HumanBodyFit.ITarget[] = [],
  ): IHumanPosture {
    const forms: supportContact.IForm[] = contacts.map(
      (c: HumanSupport.IContact): supportContact.IForm =>
        supportContact.form(body, c, at(c)),
    );
    const bearing: RegExp[] = forms.flatMap(
      (f: supportContact.IForm): RegExp[] =>
        f.bearing === undefined ? [] : [f.bearing],
    );
    const result: HumanBodyFit.IResult = HumanBodyFit.fit({
      body,
      posture: preferred,
      start: from,
      targets: [
        ...forms.map(
          (f: supportContact.IForm): HumanBodyFit.ITarget => f.target,
        ),
        ...swings,
      ],
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
    body: IHumanBody,
    a: IHumanPosture,
    b: IHumanPosture,
    w: number,
  ): IHumanPosture {
    const joints: IHumanPosture["joints"] = {};
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
