import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanSupport } from "../law/HumanSupport";
import { HumanBodyFit } from "../posture/HumanBodyFit";
import { HumanBodyFitMerit } from "../posture/HumanBodyFitMerit";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFitPairs } from "../posture/HumanFitPairs";
import { HumanFitVariables } from "../posture/HumanFitVariables";
import type { HumanJacobian } from "../posture/HumanJacobian";
import type { IHumanPosture } from "../posture/IHumanPosture";
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The support law owns key solving; it and the squat vault consume the same raw or prepared key interpolation.
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
   * @evidence contracts/development/implementation.md#efficient-algorithms Two forward-kinematics merit readings and one fit per key; its foot-contact forms share one lazily measured fixed quiet-stance datum.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One prepareForm operation shares unchanged body geometry across all contacts, and HumanBodyFit.fit remains the actual complete multi-contact solve.
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
    const form: ReturnType<typeof supportContact.prepareForm> =
      supportContact.prepareForm(body);
    const forms: supportContact.IForm[] = contacts.map(
      (c: HumanSupport.IContact): supportContact.IForm => form(c, at(c)),
    );
    const bearing: RegExp[] = forms.flatMap(
      (f: supportContact.IForm): RegExp[] =>
        f.bearing === undefined ? [] : [f.bearing],
    );
    const targets: HumanBodyFit.ITarget[] = [
      ...forms.map((f: supportContact.IForm): HumanBodyFit.ITarget => f.target),
      ...swings,
    ];
    // Select the less violated of the previous solution and the geometrically
    // placed preference before the one SQP solve. This is a seed selection,
    // not a retry: both candidates are measured on the same full merit rows.
    const variables: readonly HumanJacobian.IVariable[] =
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
    const start: IHumanPosture =
      stated.violation < previous.violation ? preferred : from;
    const result: HumanBodyFit.IResult = HumanBodyFit.fit({
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
   * @evidence contracts/development/implementation.md#efficient-algorithms All anchors share one current candidate resolution and demanded FK, followed by the existing separately translated floor reading; N points require O(N) transforms rather than N candidate solves.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Anchor points observe the same unchanged turned candidate within supportContact.points; their offsets retain the form owner, and the translated floor posture receives its own actual reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function preferred(
    body: IHumanBody,
    base: IHumanPosture,
    stance: HumanSupport.IStance,
    from: IHumanPosture,
    place: (c: HumanSupport.IContact) => IAutoMovieVector3 | null = (): null =>
      null,
  ): IHumanPosture {
    if (stance.prefer === undefined) return base;
    const anchors: { contact: HumanSupport.IContact; at: IAutoMovieVector3 }[] =
      stance.contacts.flatMap(
        (
          c: HumanSupport.IContact,
        ): { contact: HumanSupport.IContact; at: IAutoMovieVector3 }[] => {
          const at: IAutoMovieVector3 | null = place(c);
          return at === null ? [] : [{ contact: c, at }];
        },
      );
    const turned: IHumanPosture = {
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
    const points: IAutoMovieVector3[] = supportContact.points(
      body,
      turned,
      anchors,
    );
    for (let i: number = 0; i < anchors.length; ++i) {
      const a: (typeof anchors)[number] = anchors[i]!;
      const now: IAutoMovieVector3 = points[i]!;
      dx += (a.at.x - now.x) / anchors.length;
      if (a.at.y > 0) dy += (a.at.y - now.y) / anchors.length;
      dz += (a.at.z - now.z) / anchors.length;
    }
    const keyed: IHumanPosture = {
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
      (c: HumanSupport.IContact): boolean =>
        supportContact.onFloorTarget(place(c)),
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Delegates to the same prepared interpolation owner as fixed-key consumers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The heading takes the shorter arc, so a turn across south is not a spin.
   * @evidence contracts/development/implementation.md#efficient-algorithms One-shot pair preparation is O(J) for J union joints; its interior pass shares O(B+J) rig metadata instead of repeated per-joint B-bone lookups, followed by the existing numerical blends.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Raw and prepared calls share one interpolation owner and blendHumanJoint's current synchronous multi-joint metadata, without retaining the current output.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function blended(
    body: IHumanBody,
    a: IHumanPosture,
    b: IHumanPosture,
    w: number,
  ): IHumanPosture {
    return prepareKeyBlend(body, a, b, false)(w);
  }

  /**
   * Prepare interpolation between two unchanged joint-space support keys.
   * Each read retains the original unclipped root/heading progress and
   * per-joint ROM interpolation; outputs contain no limb goals.
   *
   * @param body The unchanged body and its canonical axes/ranges.
   * @param a The fixed key at zero progress, in world metres and degrees.
   * @param b The fixed key at full progress in the same frame.
   * @returns A reader of the original progress, with a fresh posture and joint map.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States immutable key/body premises, world-metre/degree frame, unclipped root progress, ROM joint interpolation and output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Keeps blended's same ordered joint union, clinical-zero missing endpoints, blendHumanJoint range rule, Vector3.lerp root and original shortest-heading expression.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One private writer serves raw and fixed-key reads; fixed joint pairs/trunk deltas precede per-pair between readers and one current synchronous fallback for missing endpoints.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No current joint interpolation, range admission, root arithmetic, heading wrap, endpoint tuple identity or empty-goal rule is replaced with a fitted or sampled pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(J) construction removes repeated joint-union work. Each complete pair pays its owner's lazy endpoint/rig preparation once, potentially O(BJ) first-read metadata for B bones, then evaluates only the current numerical blend/readback. M missing-endpoint pairs share one O(B+M) current metadata pass; endpoints allocate none.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Immutable endpoint tuples, order, trunk deltas and between-owned fixed endpoint/chart metadata survive across reads under the unchanged body/tuple premise. Missing endpoint zeros remain per-query inputs to the synchronous generic joint owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One transition owns J fixed pairs and at most J bounded between readers until release. A missing-pair query's generic metadata ends with that query; no queried share, blended output or FK workspace is retained, and missing endpoint zeros are fresh per read.
   */
  export function prepareBlended(
    body: IHumanBody,
    a: IHumanPosture,
    b: IHumanPosture,
  ): (w: number) => IHumanPosture {
    return prepareKeyBlend(body, a, b, true);
  }

  /** One interpolation owner for one-shot metadata and immutable fixed-pair preparation. */
  function prepareKeyBlend(
    body: IHumanBody,
    a: IHumanPosture,
    b: IHumanPosture,
    fixed: boolean,
  ): (w: number) => IHumanPosture {
    const bones: Set<AutoMovieHumanoidBone> = new Set([
      ...(Object.keys(a.joints) as AutoMovieHumanoidBone[]),
      ...(Object.keys(b.joints) as AutoMovieHumanoidBone[]),
    ]);
    const pairs: IBlendPair[] = [...bones].map(
      (bone: AutoMovieHumanoidBone): IBlendPair => {
        const from: IBlendPair["from"] = a.joints[bone];
        const to: IBlendPair["to"] = b.joints[bone];
        return {
          bone,
          from,
          to,
          read:
            fixed && from !== undefined && to !== undefined
              ? blendHumanJoint.between(body, bone, from, to)
              : undefined,
        };
      },
    );
    const generic: boolean = pairs.some(
      (pair: IBlendPair): boolean => pair.read === undefined,
    );
    const yaw: number = ((b.yaw - a.yaw + 540) % 360) - 180;
    const pitch: number = b.pitch - a.pitch;
    const roll: number = b.roll - a.roll;
    return (w: number): IHumanPosture => {
      const joints: IHumanPosture["joints"] = {};
      const blend: ReturnType<typeof blendHumanJoint.prepare> | undefined =
        !generic || w <= 0 || w >= 1
          ? undefined
          : blendHumanJoint.prepare(body);
      for (const pair of pairs) {
        if (pair.read !== undefined) {
          joints[pair.bone] = pair.read(w);
          continue;
        }
        const from: readonly [number, number, number] = pair.from ?? [0, 0, 0];
        const to: readonly [number, number, number] = pair.to ?? [0, 0, 0];
        joints[pair.bone] =
          blend === undefined
            ? w >= 1
              ? to
              : from
            : blend(pair.bone, from, to, w);
      }
      return {
        root: Vector3.lerp(a.root, b.root, w),
        yaw: a.yaw + yaw * w,
        pitch: a.pitch + pitch * w,
        roll: a.roll + roll * w,
        joints,
        limbs: {},
      };
    };
  }

  /** One fixed union joint; absent tuples keep their original fresh-zero rule. */
  interface IBlendPair {
    /** The canonical joint name in original union order. */
    bone: AutoMovieHumanoidBone;

    /** Its authored first tuple, absent for clinical zero. */
    from: readonly [number, number, number] | undefined;

    /** Its authored second tuple, absent for clinical zero. */
    to: readonly [number, number, number] | undefined;

    /** The joint owner's lazy fixed-endpoint reader, absent for fresh-zero fallbacks or raw passes. */
    read: ReturnType<typeof blendHumanJoint.between> | undefined;
  }
}
