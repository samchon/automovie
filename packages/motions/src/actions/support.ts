import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionHumanAuditSkin } from "../audit/AutoMovieMotionHumanAuditSkin";
import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanSupport } from "../law/HumanSupport";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanBodyFit } from "../posture/HumanBodyFit";
import { HumanColliders } from "../posture/HumanColliders";
import { knockdown } from "../reaction/knockdown";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { supportContact } from "./supportContact";

/**
 * Moving the body's weight across a sequence of supports: each stance's
 * contacts (`HumanSupport.IStance`) solved into one static key posture, and
 * the body carried from key to key with every new contact placed and
 * bearing before any contact the next stance lacks lets go.
 *
 * A key posture is the static multi-contact posture nearest the posture the
 * body enters with that puts every contact on its target, keeps the centre
 * of mass over the hull of the bearing contacts and every joint in its range
 * (`HumanBodyFit`, Bouyarmane and Kheddar 2010; Escande, Kheddar and
 * Miossec 2013), solved from the key before it, as a planner grows its next
 * stance from its parent. Between two stances the planner solves a third key
 * on the union of both stances' contacts, so the new contacts bear before
 * the old ones release (Escande et al.'s transition configurations, in
 * both stances at once), and the body moves between keys on a minimum-jerk
 * course in joint space (Flash and Hogan 1985), each joint on its own range
 * (`blendHumanJoint`). A contact no key posture reaches is refused with the
 * contact, its stance and the miss.
 *
 * A bearing foot lies on the floor at its toes' joint with its toes flat; a
 * bearing hand lies on its palm laid flat on the surface; a knee bears on the
 * shin's top; a gripping hand closes on its target at its grip. Each move
 * takes `SECONDS` (provisional: no study of the timing of a general support
 * sequence was located) or its stance's own. Events: `bear<i>` when the move
 * into stance `i` has placed its new contacts, `stance<i>` when stance `i`
 * is held alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the key postures with their sources, the transition keys, the course between keys, the refusal, the contacts' forms, the timing and the events.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of key postures solved once.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the move's time and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each key is the shared whole-body fit's; no posture is typed for any stance.
 */
export namespace support {
  /** The action's name. */
  export const name: HumanActionName = "support";

  /** Cancel table: a support sequence stands up from any stance it holds on its feet. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [{ window: [0, 1], kind: "inertialize", entry: 0, blend: 0.3 }],
  };

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The stances in order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One member read by `plan`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is typed.
   */
  export interface IParams {
    /** The stances, in order; the body enters the first from where it stands. */
    stances: readonly HumanSupport.IStance[];

    /** The surface a row's `on` contacts touch: a box's top to vault, a ledge to scramble onto, a table's edge to slide off; refused where a contact names `on` and this is absent. */
    on?: AutoMovieMotionTarget;
  }

  /** Seconds a move into a stance takes (provisional). */
  export const SECONDS: number = 1;

  /** How far a contact may miss its target, millimetres: the give of a pressed skin the audits read a contact with (`AutoMovieMotionHumanAuditSkin.BUILT`). */
  export const MISS: number = AutoMovieMotionHumanAuditSkin.BUILT * 1000;

  /**
   * Plan a support sequence.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When there is no stance, or a key posture leaves a contact more than `MISS` off its target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Each key is the whole-body fit on its contacts, seeded from the key before; a transition key holds both stances' contacts at once; the course between keys is a minimum-jerk blend of each joint on its range.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Keys solved once, then a posture read from the two keys around a second.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact the fit misses is refused, never left where the fit stopped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two fits per stance after the first, solved once at plan time; each posture blends one pair of keys.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The keys are solved once and every posture reads them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over its keys only.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const body: IHumanBody = context.body;
    const stances: readonly HumanSupport.IStance[] = context.params.stances;
    if (stances.length === 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "stances",
        value: 0,
        reason: "a support sequence needs at least one stance",
        fix: "give the stances the body rests on, in order",
      });

    // The posture the body enters with, by its joint angles: the preference
    // every key stays nearest to.
    const entry: IHumanPosture = context.entry.posture;
    const preferred: IHumanPosture = {
      root: entry.root,
      yaw: entry.yaw,
      pitch: entry.pitch,
      roll: entry.roll,
      joints: Object.fromEntries(
        context.entry.pose.joints.map(
          (j): [AutoMovieHumanoidBone, readonly [number, number, number]] => [
            j.bone,
            [j.flexion ?? 0, j.abduction ?? 0, j.twist ?? 0],
          ],
        ),
      ),
      limbs: {},
    };

    // Each contact's target, read once at the start.
    const left: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 1, y: 0, z: 0 },
    );
    const at = (c: HumanSupport.IContact): IAutoMovieVector3 | null => {
      if (c.target === undefined) return null;
      if (c.target !== "on") return context.aim(c.target, context.start).point;
      const on: AutoMovieMotionTarget | undefined = context.params.on;
      if (on === undefined)
        throw new HumanRefusal({
          kind: "parameter",
          axis: "on",
          value: c.part,
          reason: `the ${c.part} is placed on the action's surface, and none is given`,
          fix: "give the surface the row's contacts touch as `on`",
        });

      // A part on the surface on its own side: a hand out by the shoulder's
      // half width, a foot or a knee by the hip's, the trunk at its middle.
      const sign: number = c.part.startsWith("left") ? 1 : c.part.startsWith("right") ? -1 : 0;
      const half: number = c.part.endsWith("Hand")
        ? body.measure.shoulderHalfWidth
        : body.measure.hipHalfWidth;
      return Vector3.add(
        context.aim(on, context.start).point,
        Vector3.scale(left, sign * half),
      );
    };

    // A stance's preferred posture: its own key over the key before it,
    // rested on the floor by its lowest collider as a seed the fit then
    // places by what bears, or the entry's.
    const preference = (stance: HumanSupport.IStance, from: IHumanPosture): IHumanPosture => {
      if (stance.prefer === undefined) return preferred;
      const keyed: IHumanPosture = {
        root: from.root,
        yaw: entry.yaw + (stance.turn ?? 0),
        pitch: stance.prefer.pitch,
        roll: stance.prefer.roll,
        joints: { ...preferred.joints, ...stance.prefer.joints },
        limbs: {},
      };
      const low: number = HumanColliders.lowest(
        body,
        poseBones(body, resolveHumanPosture(body, keyed)),
      );
      return { ...keyed, root: { ...keyed.root, y: keyed.root.y - low } };
    };

    // Each key: the fit on its contacts from the key before.
    const keys: IKey[] = [
      { posture: preferred, seconds: 0, name: "start", contacts: [] },
    ];
    let seconds: number = 0;
    stances.forEach((stance: HumanSupport.IStance, i: number): void => {
      const move: number = stance.seconds ?? SECONDS;
      const before: IHumanPosture = keys[keys.length - 1]!.posture;
      const previous: readonly HumanSupport.IContact[] =
        i === 0 ? [] : stances[i - 1]!.contacts;
      const added: HumanSupport.IContact[] = stance.contacts.filter(
        (c: HumanSupport.IContact): boolean =>
          !previous.some((p: HumanSupport.IContact): boolean => same(p, c)),
      );
      if (i > 0 && added.length > 0) {
        const union: HumanSupport.IContact[] = [...previous, ...added];
        seconds += move / 2;
        keys.push({
          posture: solved(body, preference(stance, before), before, union, at, `bear${i}`),
          seconds,
          name: `bear${i}`,
          contacts: union,
        });
        seconds += move / 2;
      } else seconds += move;
      keys.push({
        posture: solved(
          body,
          preference(stance, keys[keys.length - 1]!.posture),
          keys[keys.length - 1]!.posture,
          stance.contacts,
          at,
          `stance${i}`,
        ),
        seconds,
        name: stance.event ?? `stance${i}`,
        contacts: stance.contacts,
      });
    });
    const duration: number = seconds;

    // Each contact bears from the key that places it to the key after the
    // last stance that holds it, and to the end where the last stance holds
    // it.
    const contacts: IHumanContactWindow[] = [];
    const opened: Map<string, number> = new Map();
    const kinds: Map<string, HumanSupport.IContact["kind"]> = new Map(
      stances.flatMap((st: HumanSupport.IStance): [string, HumanSupport.IContact["kind"]][] =>
        st.contacts.map((c: HumanSupport.IContact): [string, HumanSupport.IContact["kind"]] => [id(c), c.kind]),
      ),
    );
    const close = (key: string, until: number): void => {
      const from: number = opened.get(key)!;
      opened.delete(key);
      const [named] = key.split("|") as [string];
      const part: IHumanContactWindow["part"] | undefined =
        IHumanContactWindow.PARTS.find(
          (p: IHumanContactWindow["part"]): boolean => p === named,
        );
      if (part === undefined) return;
      contacts.push({
        part,
        kind:
          kinds.get(key) === "grip"
            ? "grip"
            : part === "seat"
              ? "seat"
              : part === "back"
                ? "lie"
                : "plant",
        from: from / duration,
        to: until / duration,
        support: { kind: "ground" },
      });
    };
    const keyAt = (name: string): IKey | undefined =>
      keys.find((k: IKey): boolean => k.name === name);
    stances.forEach((stance: HumanSupport.IStance, i: number): void => {
      const held: IKey = keyAt(stance.event ?? `stance${i}`)!;
      const placed: IKey = keyAt(`bear${i}`) ?? held;
      for (const c of stance.contacts)
        if (!opened.has(id(c))) opened.set(id(c), placed.seconds);
      const next: HumanSupport.IStance | undefined = stances[i + 1];
      if (next === undefined) return;
      const released: number = (keyAt(`bear${i + 1}`) ?? held).seconds;
      for (const c of stance.contacts)
        if (!next.contacts.some((n: HumanSupport.IContact): boolean => same(n, c)))
          close(id(c), released);
    });
    for (const key of [...opened.keys()]) close(key, duration);

    return {
      duration,
      events: keys
        .slice(1)
        .map((k: IKey): { name: string; share: number } => ({
          name: k.name,
          share: k.seconds / duration,
        })),
      contacts,
      posture: (t: number): IHumanPosture => {
        const s: number = Math.min(duration, Math.max(0, t));
        let k: number = 0;
        while (k + 1 < keys.length - 1 && keys[k + 1]!.seconds <= s) k++;
        const a: IKey = keys[k]!;
        const b: IKey = keys[Math.min(k + 1, keys.length - 1)]!;
        const span: number = b.seconds - a.seconds;
        const w: number = span > 0 ? minimumJerk((s - a.seconds) / span).s : 1;
        if (k === 0 && w === 0) return entry;

        // Between two keys the body pivots about a contact both hold, kept
        // where the first key has it across the floor, and rests on the
        // floor by its own colliders at every instant (`knockdown.rest`), as
        // the floor laws carry a body between their keyed postures.
        const shaped: IHumanPosture = blended(body, a.posture, b.posture, w);
        const pin: HumanSupport.IContact | undefined = a.contacts.find(
          (p: HumanSupport.IContact): boolean =>
            b.contacts.some((q: HumanSupport.IContact): boolean => same(p, q)),
        );
        if (pin === undefined) return shaped;
        const held: IAutoMovieVector3 = supportContact.pinned(body, a.posture, pin.part);
        const now: IAutoMovieVector3 = supportContact.pinned(body, shaped, pin.part);
        const moved: IHumanPosture = {
          ...shaped,
          root: {
            x: shaped.root.x + held.x - now.x,
            y: shaped.root.y,
            z: shaped.root.z + held.z - now.z,
          },
        };
        return { ...moved, root: { ...moved.root, y: knockdown.rest(body, moved) } };
      },
    };
  }

  /** A key posture of the plan. */
  interface IKey {
    /** The posture, by joint angles alone. */
    posture: IHumanPosture;

    /** When it is reached, seconds since the action's start. */
    seconds: number;

    /** Its event's name. */
    name: string;

    /** The contacts it rests on. */
    contacts: readonly HumanSupport.IContact[];
  }

  /** Whether two contacts are one: the same part on the same target. */
  function same(a: HumanSupport.IContact, b: HumanSupport.IContact): boolean {
    return id(a) === id(b);
  }

  /** A contact's identity. */
  function id(c: HumanSupport.IContact): string {
    return `${c.part}|${c.kind}|${JSON.stringify(c.target)}`;
  }

  /**
   * The key posture on a set of contacts, refused where a contact misses.
   *
   * @param body The body.
   * @param preferred The posture kept nearest.
   * @param from The key before, the seed.
   * @param contacts The contacts.
   * @param at Each contact's target point.
   * @param label The key's name, for the refusal.
   * @returns The posture.
   */
  function solved(
    body: IHumanBody,
    preferred: IHumanPosture,
    from: IHumanPosture,
    contacts: readonly HumanSupport.IContact[],
    at: (c: HumanSupport.IContact) => IAutoMovieVector3 | null,
    label: string,
  ): IHumanPosture {
    const forms: supportContact.IForm[] = contacts.map(
      (c: HumanSupport.IContact): supportContact.IForm =>
        supportContact.form(body, c, at(c)),
    );
    const bearing: RegExp[] = forms.flatMap((f: supportContact.IForm): RegExp[] =>
      f.bearing === undefined ? [] : [f.bearing],
    );
    const result: HumanBodyFit.IResult = HumanBodyFit.fit({
      body,
      posture: preferred,
      start: from,
      targets: forms.map((f: supportContact.IForm): HumanBodyFit.ITarget => f.target),
      bearing,
      balance: { parts: bearing },
    });
    result.residuals.forEach(
      (r: { point: number; turn: number }, k: number): void => {
        if (at(contacts[k]!) !== null && r.point > MISS)
          throw new HumanRefusal({
            kind: "reach",
            axis: "stances",
            value: r.point,
            reason: `the ${contacts[k]!.part} misses its target by ${r.point.toFixed(1)} mm at ${label}, past the ${MISS} mm a contact may miss by`,
            fix: "move the target nearer the stance's other contacts, or add a stance between",
          });
      },
    );
    return result.posture;
  }

  /** Two keys blended by a share, each joint on its own range, the root and the turn linearly. */
  function blended(
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
      // The heading on its shorter arc, so a turn across south is not a spin.
      yaw: a.yaw + ((((b.yaw - a.yaw + 540) % 360) - 180) * w),
      pitch: a.pitch + (b.pitch - a.pitch) * w,
      roll: a.roll + (b.roll - a.roll) * w,
      joints,
      limbs: {},
    };
  }
}
