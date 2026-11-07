import { BoutTechnique } from "./BoutTechnique";

/**
 * A receiver's answer as intent, never as outcome: what he believes is coming,
 * which answer family he uses and when he starts it. Whether the strike then
 * lands, glances, is blocked, deflected, checked or missed is computed by
 * {@link BoutOutcome} from these relations against the actual weapon.
 */
export namespace BoutAnswer {
  /** Answer families; each relates one of the receiver's limbs or his head to the incoming weapon. */
  export type Family = "cover" | "block" | "catch" | "parry" | "check" | "slip" | "weave" | "lean" | "none";

  /**
   * When the answer starts. `committed` began before the strike was launched,
   * from an earlier read; `anticipated` is set by contact from a read of the
   * launch; `reactive` starts one simple visual reaction time after launch;
   * `late` starts one choice reaction time after launch.
   */
  export type Timing = "committed" | "anticipated" | "reactive" | "late";

  /** One answer intent. */
  export interface IIntent {
    /** Answer family. */ readonly family: Family;
    /** Start class. */ readonly timing: Timing;
    /** Technique the receiver believes is coming; omitted when he reads the real one. */ readonly reads?: BoutTechnique.Name;
  }

  /** One registered family. */
  export interface ISpec {
    /** Registry key. */ readonly family: Family;
    /** Receiver limb class the answer occupies on the threatened side. */ readonly limb?: BoutTechnique.Limb;
    /** Answering surface whose set breadth covers the weapon. */ readonly guard?: "glove" | "forearm" | "shin";
    /** Head travel direction of an evasion. */ readonly evasion?: "lateral" | "vertical" | "backward";
    /** Regions the family can protect. */ readonly targets: readonly BoutTechnique.Target[];
    /** Weapon lines the family can meet or leave. */ readonly lines: readonly BoutTechnique.Line[];
    /** Seconds the answer takes to set fully. */ readonly lead: number;
    /** Seconds after contact before the receiver can launch, when the answer worked. */ readonly recover: number;
  }

  /** Simple visual reaction time domain, seconds (typical 0.15–0.25 s; Kosinski 2013, A literature review on reaction time). */
  export const SIMPLE: readonly [number, number] = [0.15, 0.25];

  /** Choice reaction time domain, seconds; choosing among answers adds about 0.1–0.2 s (Hick 1952). */
  export const CHOICE: readonly [number, number] = [0.3, 0.45];

  /** Seconds a struck receiver needs before launching, by struck region. */
  export const STUN: Readonly<Record<BoutTechnique.Target, number>> = { head: 0.35, body: 0.4, leg: 0.45 };

  const every: readonly BoutTechnique.Line[] = ["straight", "arc", "rising", "descending"];

  /** Every answer family. */
  export const registry: Readonly<Record<Family, ISpec>> = Object.freeze({
    cover: { family: "cover", limb: "arm", guard: "forearm", targets: ["head"], lines: every, lead: 0.15, recover: 0.1 },
    block: { family: "block", limb: "arm", guard: "forearm", targets: ["head", "body"], lines: every, lead: 0.15, recover: 0.15 },
    catch: { family: "catch", limb: "arm", guard: "glove", targets: ["head", "body"], lines: ["straight"], lead: 0.12, recover: 0.08 },
    parry: { family: "parry", limb: "arm", guard: "glove", targets: ["head", "body"], lines: ["straight"], lead: 0.12, recover: 0.05 },
    check: { family: "check", limb: "leg", guard: "shin", targets: ["leg"], lines: ["arc"], lead: 0.36, recover: 0.44 },
    slip: { family: "slip", evasion: "lateral", targets: ["head"], lines: ["straight"], lead: 0.27, recover: 0.1 },
    weave: { family: "weave", evasion: "vertical", targets: ["head"], lines: ["arc"], lead: 0.3, recover: 0.15 },
    lean: { family: "lean", evasion: "backward", targets: ["head"], lines: ["straight", "rising"], lead: 0.25, recover: 0.2 },
    none: { family: "none", targets: [], lines: [], lead: 0, recover: 0 },
  });

  /** One registered family. */
  export function get(family: Family): ISpec {
    return registry[family];
  }

  /** Facing opponents: a weapon on the attacker's side arrives on the receiver's opposite side. */
  export function side(attacker: BoutTechnique.Side): BoutTechnique.Side {
    return attacker === "left" ? "right" : "left";
  }

  /** Intent constructors, read as the screenplay reads: `cover("late")`, `block("committed", "body-kick")`. */
  export const intents: Readonly<Record<Family, (timing?: Timing, reads?: BoutTechnique.Name) => IIntent>> = Object.freeze(
    Object.fromEntries(
      (Object.keys(registry) as Family[]).map(
        (family: Family): [Family, (timing?: Timing, reads?: BoutTechnique.Name) => IIntent] => [
          family,
          (timing: Timing = "anticipated", reads?: BoutTechnique.Name): IIntent => ({ family, timing, ...(reads ? { reads } : {}) }),
        ],
      ),
    ) as Record<Family, (timing?: Timing, reads?: BoutTechnique.Name) => IIntent>,
  );
}
