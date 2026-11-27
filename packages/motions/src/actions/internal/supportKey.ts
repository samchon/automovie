import { AutoMovieEngineVector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanBodyFit } from "../../posture/internal/HumanBodyFit";
import { HumanBodyFitMerit } from "../../posture/internal/HumanBodyFitMerit";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanFitPairs } from "../../posture/internal/HumanFitPairs";
import { HumanFitVariables } from "../../posture/internal/HumanFitVariables";
import { blendHumanJoint } from "../../posture/internal/blendHumanJoint";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { admittedSupportPosture } from "./admittedSupportPosture";
import { prepareBilateralSupport } from "./prepareBilateralSupport";
import { preparePairedFloorSupport } from "./preparePairedFloorSupport";
import { prepareRaisedKneeSupport } from "./prepareRaisedKneeSupport";
import { prepareSupportSeed } from "./prepareSupportSeed";
import { stand } from "./stand";
import { supportContact } from "./supportContact";
import { supportKeyHeels } from "./supportKeyHeels";

/*
 * A support planner's key postures (`support`): one solved on a stance's
 * contacts by the whole-body fit, and the course between two of them.
 */
export namespace supportKey {
  /*
   * The key posture on a set of contacts, refused where a contact misses.
   * Parameter body: The body.
   * Parameter preferred: The posture kept nearest.
   * Parameter from: The key before, the seed.
   * Parameter contacts: The contacts.
   * Parameter at: Each contact's target point.
   * Parameter label: The key's name, for the refusal.
   * Parameter miss: How far a contact may miss its target, millimetres.
   * Parameter swings: The targets of the parts stepping, which bear on nothing;
   * none when absent.
   * Parameter form: The contact frames for the plan's unchanged body, including its
   * measured quiet-foot normals.
   * Parameter held: Whether the preceding transfer already established this
   * stance's preference and exact contact set.
   * Returns: The posture.
   * A `reach` refusal on `stances` when a placed contact
   * misses by more than `miss`.
   */
  export function solved(
    body: IAutoMovieMotionHumanBody,
    preferred: IAutoMovieMotionHumanPosture,
    from: IAutoMovieMotionHumanPosture,
    contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
    at: (c: IAutoMovieMotionHumanSupport.IContact) => ContactPoint,
    label: string,
    miss: number,
    swings: readonly IAutoMovieMotionHumanBodyFitTypes.ITarget[] = [],
    form: ReturnType<
      typeof supportContact.prepareForm
    > = supportContact.prepareForm(body),
    held: boolean = false,
  ): IAutoMovieMotionHumanPosture {
    const points: ContactPoint[] = contacts.map(at);
    const forms: supportContact.IForm[] = contacts.map(
      (
        c: IAutoMovieMotionHumanSupport.IContact,
        k: number,
      ): supportContact.IForm => form(c, points[k]!),
    );
    const bearing: RegExp[] = forms.flatMap(
      (f: supportContact.IForm): RegExp[] =>
        f.bearing === undefined ? [] : [f.bearing],
    );
    const holding: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = [
      ...forms.map(
        (f: supportContact.IForm): IAutoMovieMotionHumanBodyFitTypes.ITarget =>
          f.target,
      ),
      ...supportKeyHeels(body, from, preferred, contacts, points, miss),
    ];
    const targets: IAutoMovieMotionHumanBodyFitTypes.ITarget[] = [
      ...holding,
      ...swings,
    ];
    // Select the less violated of the previous solution and the geometrically
    // placed preference before the one SQP solve. This is a seed selection,
    // not a retry: both candidates are measured on the same full merit rows.
    const variables: readonly IAutoMovieMotionHumanJacobian.IVariable[] =
      HumanFitVariables.BODY;
    const merit: HumanBodyFitMerit.IMerit = HumanBodyFitMerit({
      body,
      posture: preferred,
      variables,
      targets,
      angles: [],
      bearing,
      pairs: HumanFitPairs(body),
      key: HumanFitVariables.vector(variables, preferred),
      price: HumanBodyFit.PRICE,
    });
    const stated: HumanBodyFitMerit.IEvaluation = merit.evaluate(
      HumanFitVariables.vector(variables, preferred),
    );
    if (merit.holds(stated.misses))
      return admittedSupportPosture(preferred, stated.r.written);
    if (swings.length === 0) {
      const paired: ReturnType<typeof preparePairedFloorSupport> =
        preparePairedFloorSupport(
          body,
          preferred,
          from,
          contacts,
          targets,
          bearing,
          merit,
        );
      if (paired !== undefined) return paired;
    }
    const previous: HumanBodyFitMerit.IEvaluation =
      preferred === from
        ? stated
        : merit.evaluate(HumanFitVariables.vector(variables, from));
    if (held && merit.holds(previous.misses))
      return admittedSupportPosture(from, previous.r.written);
    let start: IAutoMovieMotionHumanPosture =
      stated.violation < previous.violation ? preferred : from;
    if (!merit.holds(previous.misses)) {
      if (swings.length === 0) {
        const closed: ReturnType<typeof prepareRaisedKneeSupport> =
          prepareRaisedKneeSupport(
            body,
            preferred,
            from,
            contacts,
            holding,
            bearing,
            merit,
          );
        if (closed !== undefined) return closed;
      }
      const aligned: ReturnType<typeof prepareSupportSeed> = prepareSupportSeed(
        body,
        preferred,
        contacts,
        holding,
      );
      if (aligned !== undefined) {
        const corrected: HumanBodyFitMerit.IEvaluation = merit.evaluate(
          HumanFitVariables.vector(variables, aligned),
        );
        if (merit.holds(corrected.misses))
          return admittedSupportPosture(aligned, corrected.r.written);
        if (
          corrected.violation < Math.min(stated.violation, previous.violation)
        )
          start = aligned;
      }
    }
    const fitted: (
      on: IAutoMovieMotionHumanBodyFitTypes.ITarget[],
      seed?: IAutoMovieMotionHumanPosture,
    ) => IAutoMovieMotionHumanBodyFitTypes.IResult = (
      on: IAutoMovieMotionHumanBodyFitTypes.ITarget[],
      seed: IAutoMovieMotionHumanPosture = start,
    ): IAutoMovieMotionHumanBodyFitTypes.IResult =>
      HumanBodyFit.fit({
        body,
        posture: preferred,
        start: seed,
        targets: on,
        bearing,
      });
    const misses: (r: IAutoMovieMotionHumanBodyFitTypes.IResult) => boolean = (
      r: IAutoMovieMotionHumanBodyFitTypes.IResult,
    ): boolean =>
      r.residuals.some(
        (residual: Residual, k: number): boolean =>
          k < contacts.length && points[k] !== null && residual.point > miss,
      );
    // A stepping part's swing is an aim of the step, never one of what
    // bears: where its top cannot be reached with every contact kept (a
    // large body's leg brought forward from the hands and knees), the key
    // is the supports' posture without it, and a contact that misses there
    // is refused.
    let result: IAutoMovieMotionHumanBodyFitTypes.IResult = fitted(targets);
    if (swings.length > 0 && misses(result)) result = fitted(holding);
    // The preceding support can leave a limb against its range boundary.
    // The authored stance supplies its own articulation on the other side
    // of that boundary, even when its initial aggregate error is larger.
    if (start !== preferred && misses(result)) {
      const statedFit: IAutoMovieMotionHumanBodyFitTypes.IResult = fitted(
        holding,
        preferred,
      );
      if (!misses(statedFit)) result = statedFit;
    }
    // A three-support predecessor may be closer in aggregate while its
    // fourth limb is on the wrong side of a joint limit. A fully bilateral
    // support has a second physical branch from the already placed side.
    if (misses(result)) {
      const symmetric: ReturnType<typeof prepareBilateralSupport> =
        prepareBilateralSupport(
          body,
          from,
          contacts,
          forms.map(
            (form: supportContact.IForm): typeof form.target => form.target,
          ),
        );
      if (symmetric !== undefined) {
        const paired: IAutoMovieMotionHumanBodyFitTypes.IResult = fitted(
          holding,
          symmetric,
        );
        if (!misses(paired)) result = paired;
      }
    }
    result.residuals.forEach((r: Residual, k: number): void => {
      if (k < contacts.length && points[k] !== null && r.point > miss)
        throw new AutoMovieMotionHumanRefusal({
          kind: "reach",
          axis: "stances",
          value: r.point,
          reason: `the ${contacts[k]!.part} misses its target by ${r.point.toFixed(1)} mm at ${label}, past the ${miss} mm a contact may miss by`,
          fix: "move the target nearer the stance's other contacts, or add a stance between",
        });
    });
    return result.posture;
  }

  /*
   * A stance's preferred posture: its stated posture (`prefer`) over the key
   * before it, turned by the stance's turn and rested on the floor by its
   * lowest collider and moved across the floor so its contacts that already
   * have a place lie over them, a seed the fit then places by what bears; the
   * posture the body entered with when the stance states none.
   * Parameter body: The body.
   * Parameter base: The posture the body entered with, by its joint angles.
   * Parameter stance: The stance.
   * Parameter from: The key before.
   * Parameter place: Each contact's place, world metres, or null for one without;
   * none placed when absent.
   * Returns: The posture.
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
    const anchors: IPreferredAnchorsItem[] = stance.contacts.flatMap(
      (c: IAutoMovieMotionHumanSupport.IContact): IAnchorsItemResult[] => {
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

  /*
   * Prepare interpolation between two joint-space support keys the caller holds
   * unchanged: each joint on its own range (`blendHumanJoint`), the root
   * linearly and the heading the shorter way. Reads take the share unclipped;
   * outputs carry no limb goals.
   * Parameter body: The unchanged body and its canonical axes/ranges.
   * Parameter a: The fixed key at zero progress, in world metres and degrees.
   * Parameter b: The fixed key at full progress in the same frame.
   * Returns: A reader of the share, with a fresh posture and joint map.
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
    const fallback: ReadonlySet<AutoMovieHumanoidBone> = new Set(
      pairs.flatMap((pair: IBlendPair): AutoMovieHumanoidBone[] =>
        pair.read === undefined ? [pair.bone] : [],
      ),
    );
    const blend: ReturnType<typeof blendHumanJoint.prepare> =
      blendHumanJoint.prepare(body, fallback);
    const yaw: number = AutoMovieEngineMath.wrapDegrees(b.yaw - a.yaw);
    const pitch: number = b.pitch - a.pitch;
    const roll: number = b.roll - a.roll;
    return (w: number): IAutoMovieMotionHumanPosture => {
      const joints: IAutoMovieMotionHumanPosture["joints"] = {};
      for (const pair of pairs) {
        if (pair.read !== undefined) {
          joints[pair.bone] = pair.read(w);
          continue;
        }
        const from: readonly [number, number, number] = pair.from ?? [0, 0, 0];
        const to: readonly [number, number, number] = pair.to ?? [0, 0, 0];
        joints[pair.bone] = blend(pair.bone, from, to, w);
      }
      return {
        root: AutoMovieEngineVector3.lerp(a.root, b.root, w),
        yaw: a.yaw + yaw * w,
        pitch: a.pitch + pitch * w,
        roll: a.roll + roll * w,
        joints,
        limbs: {},
      };
    };
  }

  /*
   * The solver's measured miss of one target.
   */
  type Residual =
    IAutoMovieMotionHumanBodyFitTypes.IResult["residuals"][number];

  /*
   * One fixed union joint; absent tuples keep their original fresh-zero rule.
   */
  interface IBlendPair {
    /*
     * The canonical joint name in original union order.
     */
    bone: AutoMovieHumanoidBone;

    /*
     * Its authored first tuple, absent for clinical zero.
     */
    from: readonly [number, number, number] | undefined;

    /*
     * Its authored second tuple, absent for clinical zero.
     */
    to: readonly [number, number, number] | undefined;

    /*
     * The joint owner's fixed-endpoint reader, absent when an endpoint falls
     * back to clinical zero.
     */
    read: ReturnType<typeof blendHumanJoint.between> | undefined;
  }
}

/*
 * A contact with no authored or previously laid world position yet.
 */
type ContactPoint = IAutoMovieVector3 | null;

/*
 * The record of `IAnchorsItemResult`'s site.
 */
type IAnchorsItemResult = {
  contact: IAutoMovieMotionHumanSupport.IContact;
  at: IAutoMovieVector3;
};

/*
 * The record of `IPreferredAnchorsItem`'s site.
 */
type IPreferredAnchorsItem = {
  contact: IAutoMovieMotionHumanSupport.IContact;
  at: IAutoMovieVector3;
};
