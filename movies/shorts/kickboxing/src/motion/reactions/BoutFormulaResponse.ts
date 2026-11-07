import { AutoMovieEnvelope, impulseToRecoilPush } from "@automovie/engine";
import { AutoMovieHumanRigControls as Controls } from "@automovie/human";

import type { FilmPlan } from "../../shots/kickboxing/ring-bout/FilmPlan";
import type { FighterBody } from "../fighter/FighterBody";

/** Comparison body acting from measured geometric contacts. Native bones never consume this pose heuristic. */
export class BoutFormulaResponse {
  /** Explicit response authority, independent of the step scheduler's support policy. */
  public mode: BoutFormulaResponse.Mode = "native";
  /** Owned, chronological contact inputs; callers cannot alter a prepared response by mutating their records. */
  private contacts: BoutFormulaResponse.IContact[] = [];

  public constructor(
    /** Performer receiving this comparison acting. */
    private readonly actor: FilmPlan.ActorId,
  ) {}

  /** Actual admitted comparison records for this performer, including zero estimates. */
  public get contactCount(): number {
    return this.contacts.length;
  }

  /** Replace one complete causal response plan; geometric estimates never become solver impulses. */
  public configure(
    mode: BoutFormulaResponse.Mode,
    contacts: readonly BoutFormulaResponse.IContact[],
  ): void {
    if (mode !== "kinematic" && mode !== "native")
      throw new Error("Unknown bout response authority");
    const admitted: BoutFormulaResponse.IContact[] =
      BoutFormulaResponse.admit(contacts);
    this.mode = mode;
    this.contacts = admitted.filter(
      (contact: BoutFormulaResponse.IContact): boolean =>
        contact.actorId === this.actor,
    );
  }

  /** Add only body/head clinical flexion and facial intent. Hands, feet, support and root placement stay with their existing owners. */
  public apply(frame: FighterBody.Frame, seconds: number = frame.time): void {
    if (this.mode === "native") return;
    if (!Number.isFinite(seconds))
      throw new Error("Invalid comparison response clock");
    for (const contact of this.contacts) {
      const recipe: Readonly<BoutFormulaResponse.IRecipe> =
        BoutFormulaResponse.recipes[contact.relation];
      const weight: number = AutoMovieEnvelope.pulse(
        seconds,
        contact.seconds,
        contact.seconds + recipe.peakSeconds,
        contact.seconds + recipe.durationSeconds,
      );
      if (weight <= 0 || contact.normalImpulseEstimate === 0) continue;
      const degrees: number =
        impulseToRecoilPush(
          { x: contact.normalImpulseEstimate, y: 0, z: 0 },
          recipe.degreesPerNewtonSecond,
        ).flexion! * weight;
      this.flexion(
        frame,
        "cervical",
        "neck.cervical.flexion",
        -degrees * recipe.neck,
      );
      this.flexion(
        frame,
        "atlas",
        "neck.atlantoOccipital.flexion",
        -degrees * recipe.head,
      );
      this.flexion(
        frame,
        "thoracic",
        "spine.thoracic.flexion",
        degrees * recipe.chest,
      );
      this.flexion(
        frame,
        "lumbar",
        "spine.lumbar.flexion",
        degrees * recipe.waist,
      );
      frame.wince = Math.max(
        frame.wince,
        Math.min(
          1,
          contact.normalImpulseEstimate * recipe.wincePerNewtonSecond * weight,
        ),
      );
    }
  }

  /** Human owns clinical admission; the movie selects only which acting channels yield. */
  private flexion(
    frame: FighterBody.Frame,
    region: "cervical" | "atlas" | "thoracic" | "lumbar",
    channel: Controls.DegreeChannel,
    delta: number,
  ): void {
    if (delta === 0) return;
    const bounds: ReturnType<typeof Controls.bounds> = Controls.bounds(channel);
    frame[region].flexion = Math.max(
      bounds.minimum,
      Math.min(bounds.maximum, frame[region].flexion + delta),
    );
  }
}

/** These are explicit acting recipes for the geometric comparison, not a physical material or a solved response law. */
export namespace BoutFormulaResponse {
  /** A supported step is not itself a declaration of response authority. */
  export type Mode = "kinematic" | "native";

  /** One actual geometric measurement and its separately estimated normal impulse. */
  export interface IContact {
    /** Stable geometric observation identity. */
    receiptId: string;
    /** Screenplay interaction whose actual shapes were measured. */
    actionId: string;
    /** Performer receiving the comparison response. */
    actorId: FilmPlan.ActorId;
    /** Actual geometric measurement second; there is no anticipatory impact response. */
    seconds: number;
    /** Actual declared receiving role. */
    relation: "head" | "body" | "guard" | "shin-check";
    /** Two-segment normal impulse estimate in N s; never a solver receipt field. */
    normalImpulseEstimate: number;
    /** Solver data cannot enter this comparison body owner. */
    source: "geometric";
  }

  /** Clinical distribution and visible acting duration selected by this film. */
  export interface IRecipe {
    /** Degrees per N s passed to the existing shared recoil conversion. */
    degreesPerNewtonSecond: number;
    /** Peak after the actual contact measurement, seconds. */
    peakSeconds: number;
    /** Return to authored acting, seconds. */
    durationSeconds: number;
    /** Clinical head share. */
    head: number;
    /** Clinical cervical share. */
    neck: number;
    /** Clinical thoracic share. */
    chest: number;
    /** Clinical lumbar share. */
    waist: number;
    /** Saturating facial acting per estimated N s. */
    wincePerNewtonSecond: number;
  }

  /** A modest scalar flinch; direction and articulated effective mass are deliberately outside this comparison formula. */
  export const recipes: Readonly<
    Record<IContact["relation"], Readonly<IRecipe>>
  > = {
    head: {
      degreesPerNewtonSecond: 1,
      peakSeconds: 0.08,
      durationSeconds: 0.55,
      head: 0.4,
      neck: 0.6,
      chest: -0.2,
      waist: 0,
      wincePerNewtonSecond: 0.05,
    },
    body: {
      degreesPerNewtonSecond: 1,
      peakSeconds: 0.09,
      durationSeconds: 0.6,
      head: 0,
      neck: 0,
      chest: 0.7,
      waist: 0.3,
      wincePerNewtonSecond: 0.04,
    },
    guard: {
      degreesPerNewtonSecond: 0.35,
      peakSeconds: 0.08,
      durationSeconds: 0.38,
      head: 0,
      neck: 0,
      chest: -1,
      waist: 0,
      wincePerNewtonSecond: 0.01,
    },
    "shin-check": {
      degreesPerNewtonSecond: 0.15,
      peakSeconds: 0.08,
      durationSeconds: 0.38,
      head: 0,
      neck: 0,
      chest: 1,
      waist: 0,
      wincePerNewtonSecond: 0.01,
    },
  };

  /** Admit immutable product metadata without certifying an unobserved collision. The geometry producer owns that provenance. */
  export function admit(value: unknown): IContact[] {
    if (!Array.isArray(value))
      throw new Error("Bout formula responses must be an array");
    const ids: Set<string> = new Set();
    return value
      .map((row: unknown): IContact => {
        const contact: IContact = row as IContact;
        if (
          !contact ||
          typeof contact !== "object" ||
          typeof contact.receiptId !== "string" ||
          !contact.receiptId ||
          typeof contact.actionId !== "string" ||
          !contact.actionId ||
          !["a", "b", "referee"].includes(contact.actorId) ||
          !Number.isFinite(contact.seconds) ||
          contact.seconds < 0 ||
          contact.seconds > 180 ||
          !Object.hasOwn(recipes, contact.relation) ||
          contact.source !== "geometric" ||
          !Number.isFinite(contact.normalImpulseEstimate) ||
          contact.normalImpulseEstimate < 0
        )
          throw new Error("Invalid geometric bout formula response");
        const id: string = `${contact.actorId}/${contact.actionId}`;
        if (ids.has(id)) throw new Error("Duplicate bout formula response");
        ids.add(id);
        return { ...contact };
      })
      .sort(
        (a: IContact, b: IContact): number =>
          a.seconds - b.seconds || a.actionId.localeCompare(b.actionId),
      );
  }
}
