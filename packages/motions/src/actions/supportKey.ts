import { Vector3, wrapDegrees } from "@automovie/engine";
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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The support law owns key solving; its intervals and the squat vault consume the same prepared key interpolation.
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
   * @param balance Whether the fit keeps the centre of mass over the bearing hull, the balance option (`IAutoMovieMotionHumanBalance`); absent or false, the key is the contacts' posture nearest the preference and no centre of mass is read.
   * @returns The posture.
   * @throws {HumanRefusal} A `reach` refusal on `stances` when a placed contact misses by more than `miss`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The whole-body fit on the contact forms, over the bearing hull only with the balance option, seeded from the previous solution or geometrically placed preference, whichever violates less of the fit's complete constraint merit before solving once.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Forms, two candidate merit readings, one fit and one pass over residuals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact the fit misses is refused, never left where the fit stopped; a swing's residual refuses nothing, since it bears on nothing, and a swing whose top would cost a contact is dropped from the key rather than traded against it.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two forward-kinematics merit readings and one fit per key, a second fit only where a swing cost a contact; its foot-contact forms share one lazily measured fixed quiet-stance datum.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One prepareForm operation shares unchanged body geometry across all contacts, and HumanBodyFit.fit remains the actual complete multi-contact solve.
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
    balance: boolean = false,
  ): IAutoMovieMotionHumanPosture {
    const form: ReturnType<typeof supportContact.prepareForm> =
      supportContact.prepareForm(body);
    const forms: supportContact.IForm[] = contacts.map(
      (c: IAutoMovieMotionHumanSupport.IContact): supportContact.IForm =>
        form(c, at(c)),
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
      ...(balance ? { balance: { parts: bearing } } : {}),
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
    const fitted: (
      on: IAutoMovieMotionHumanBodyFitTypes.ITarget[],
    ) => IAutoMovieMotionHumanBodyFitTypes.IResult = (
      on: IAutoMovieMotionHumanBodyFitTypes.ITarget[],
    ): IAutoMovieMotionHumanBodyFitTypes.IResult =>
      HumanBodyFit.fit({
        body,
        posture: preferred,
        start,
        targets: on,
        bearing,
        ...(balance ? { balance: { parts: bearing } } : {}),
      });
    const misses: (r: IAutoMovieMotionHumanBodyFitTypes.IResult) => boolean = (
      r: IAutoMovieMotionHumanBodyFitTypes.IResult,
    ): boolean =>
      r.residuals.some(
        (residual: { point: number; turn: number }, k: number): boolean =>
          k < contacts.length &&
          at(contacts[k]!) !== null &&
          residual.point > miss,
      );
    // A stepping part's swing is an aim of the step, never one of what
    // bears: where its top cannot be reached with every contact kept (a
    // large body's leg brought forward from the hands and knees), the key
    // is the supports' posture without it, and a contact that misses there
    // is refused.
    let result: IAutoMovieMotionHumanBodyFitTypes.IResult = fitted(targets);
    if (swings.length > 0 && misses(result))
      result = fitted(
        forms.map(
          (
            f: supportContact.IForm,
          ): IAutoMovieMotionHumanBodyFitTypes.ITarget => f.target,
        ),
      );
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
   * Prepare interpolation between two joint-space support keys the caller
   * holds unchanged: each joint on its own range (`blendHumanJoint`), the
   * root linearly and the heading the shorter way. Reads take the share
   * unclipped; outputs carry no limb goals.
   *
   * @param body The unchanged body and its canonical axes/ranges.
   * @param a The fixed key at zero progress, in world metres and degrees.
   * @param b The fixed key at full progress in the same frame.
   * @returns A reader of the share, with a fresh posture and joint map.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the key/body premises, world-metre/degree frame, unclipped share, ROM joint interpolation and output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation A free movement between two postures is smooth in joint space (Flash and Hogan 1985 for the caller's minimum-jerk share), each joint on its range (`blendHumanJoint`); a joint one key lacks blends from or to clinical zero; the heading difference is wrapped by `wrapDegrees`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed joint pairs and trunk deltas precede per-pair range readers and one per-read fallback for a pair missing an endpoint.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No joint interpolation, range admission, root arithmetic or heading wrap is replaced with a fitted or sampled pose.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(J) construction over the J union joints. Each complete pair pays its range reader's lazy preparation once, then each read evaluates only its numerical blend; M missing-endpoint pairs share one O(B+M) metadata pass for B bones per interior read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Endpoint tuples, order, trunk deltas and each pair's range metadata serve every read, since the caller holds the body and keys unchanged. Missing-endpoint zeros are per-read inputs to the generic joint owner.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One transition owns J fixed pairs and at most J range readers until release. A missing-pair read's metadata ends with that read; no share, blended output or FK workspace is retained.
   */
  export function prepareBlended(
    body: IAutoMovieMotionHumanBody,
    a: IAutoMovieMotionHumanPosture,
    b: IAutoMovieMotionHumanPosture,
  ): (w: number) => IAutoMovieMotionHumanPosture {
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
            from !== undefined && to !== undefined
              ? blendHumanJoint.between(body, bone, from, to)
              : undefined,
        };
      },
    );
    const generic: boolean = pairs.some(
      (pair: IBlendPair): boolean => pair.read === undefined,
    );
    const yaw: number = wrapDegrees(b.yaw - a.yaw);
    const pitch: number = b.pitch - a.pitch;
    const roll: number = b.roll - a.roll;
    return (w: number): IAutoMovieMotionHumanPosture => {
      const joints: IAutoMovieMotionHumanPosture["joints"] = {};
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

    /** The joint owner's lazy fixed-endpoint reader, absent when an endpoint falls back to clinical zero. */
    read: ReturnType<typeof blendHumanJoint.between> | undefined;
  }
}
