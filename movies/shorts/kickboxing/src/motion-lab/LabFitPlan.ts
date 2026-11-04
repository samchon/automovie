import { AutoMovieHumanRigControls, type AutoMovieHumanClinicalIk, type AutoMovieHumanSkeleton } from "@automovie/human";
import type { MotionAction } from "../motion/core/MotionAction";

/**
 * Select laboratory fitting controls from actual target ancestry and authored pose intent.
 * @evidence contracts/common.md#implementation-and-ownership Public bone parents and canonical chains select relevant own-side arm/leg controls. Toe articulation remains the same authored pose, including public neutral defaults; framing a toe never adds all ten MTP freedoms. Every original foot vertex still belongs to the independent floor check.
 * @evidence contracts/common.md#authoring-interface This local adapter retains Human's32-control/16-update limits and reports its complete selection. Exact duplicate hard points share one equation while every raw goal keeps an explicit mapping; distinct goals or priorities are never merged.
 */
export namespace LabFitPlan {
  /**
   * Observable finite fitting request before the public solver is invoked.
   * @evidence contracts/common.md#implementation-and-ownership Records actual ancestors, chosen canonical paths, authored locks and independent toe intent alongside the unchanged solver budget.
   * @evidence contracts/common.md#authoring-interface Values are owned diagnostic data. A valid budget is input admission only; it does not establish actual physical convergence.
   */
  export interface Selection {
    /** Actual requested target ancestry, without floor-only vertices. */ ancestors: string[];
    /** Unique selected public degree channels. */ channels: AutoMovieHumanRigControls.DegreeChannel[];
    /** Explicit technique locks excluded from fitting. */ preserved: AutoMovieHumanRigControls.DegreeChannel[];
    /** Toe values retained exactly; omitted leaves use public neutral zero. */ toes: { channel: AutoMovieHumanRigControls.DegreeChannel; value: number; explicit: boolean }[];
    /** Public finite budget; never increased to admit a case. */ budget: { count: number; maximum: number; iterations: number; rootAxes: [] | ["y"] };
  }

  /**
   * Keep controls whose owning joint belongs to an actual requested bone ancestry.
   * @evidence contracts/common.md#implementation-and-ownership Resolves parents from the same body's public neutral skeleton and selects only its own canonical arm/leg chains. Toe pose is inspected and retained instead of becoming an unrelated compensating degree of freedom.
   * @evidence contracts/common.md#authoring-interface Bones include requested point/frame goals, not the complete floor population. Missing bones or invalid authored toe leaves refuse; selected controls still need preflight budget validation and actual postsolve inspection.
   */
  export function select(sample: MotionAction.Sample, neutral: AutoMovieHumanSkeleton.IOutput, bones: readonly string[]): Selection {
    const parents: Map<string, string | null> = new Map(neutral.bones.map((bone: AutoMovieHumanSkeleton.IBone): [string, string | null] => [bone.bone, bone.parent]));
    const ancestors: Set<string> = new Set();
    for (const bone of bones) {
      if (!parents.has(bone)) throw new Error(`Fitting target has no actual bone ${bone}`);
      let current: string | null = bone;
      const visited: Set<string> = new Set();
      while (current !== null) {
        if (visited.has(current)) throw new Error("Actual target ancestry contains a cycle");
        visited.add(current); ancestors.add(current);
        current = parents.get(current) ?? null;
      }
    }
    const preserved: AutoMovieHumanRigControls.DegreeChannel[] = [...(sample.preservedChannels ?? [])];
    const candidates: AutoMovieHumanRigControls.DegreeChannel[] = [];
    const toes: Selection["toes"] = [];
    for (const side of ["left", "right"] as const) {
      for (const region of ["arm", "leg"] as const) for (const channel of AutoMovieHumanRigControls.chain({ region, side })) {
        const suffix: string = channel.split(".").slice(2).join(".");
        const joint: string = region === "arm" ? suffix.startsWith("shoulderGirdle.") ? suffix.endsWith("upwardRotation") ? "Scapula" : "Shoulder" : suffix.startsWith("shoulder.") ? "UpperArm" : "LowerArm" : suffix.startsWith("hip.") ? "UpperLeg" : suffix.startsWith("knee.") ? "LowerLeg" : suffix.startsWith("ankle.") ? "Foot" : suffix.endsWith("subtalarInversion") ? "Subtalar" : "Midfoot";
        if (ancestors.has(`${side}${joint}`) && !preserved.includes(channel)) candidates.push(channel);
      }
      for (const digit of ["hallux", "second", "third", "fourth", "fifth"] as const) for (const channel of AutoMovieHumanRigControls.chain({ region: "toe", side, digit })) {
        let scalar: unknown = sample.pose;
        for (const part of channel.split(".")) scalar = scalar !== null && typeof scalar === "object" ? Reflect.get(scalar, part) : undefined;
        const value: unknown = scalar ?? 0;
        const bounds: ReturnType<typeof AutoMovieHumanRigControls.bounds> = AutoMovieHumanRigControls.bounds(channel, sample.pose);
        if (typeof value !== "number" || !Number.isFinite(value) || value < bounds.minimum || value > bounds.maximum) throw new Error(`Authored toe ${channel} must remain within its public clinical bounds`);
        toes.push({ channel, value, explicit: scalar !== undefined });
      }
    }
    const channels: AutoMovieHumanRigControls.DegreeChannel[] = [...new Set(candidates)];
    return { ancestors: [...ancestors], channels, preserved, toes, budget: { count: channels.length, maximum: 32, iterations: 16, rootAxes: ["y"] } };
  }

  /**
   * Normalize exactly repeated hard equations without losing their raw identities.
   * @evidence contracts/common.md#implementation-and-ownership Exact bone/local-point/world tuples share one solver equation. This avoids phase-role changes doubling an identical point's numerical weight. Every distinct world objective remains unchanged and each raw index identifies its effective equation.
   * @evidence contracts/common.md#authoring-interface Only hard goals are accepted here; soft priority is handled separately. No proximity tolerance, shape change, target averaging or postsolve retargeting participates.
   */
  export function hardTargets(raw: readonly AutoMovieHumanClinicalIk.ITarget[]): { rawTargets: AutoMovieHumanClinicalIk.ITarget[]; targets: AutoMovieHumanClinicalIk.ITarget[]; rawToEffective: number[] } {
    const targets: AutoMovieHumanClinicalIk.ITarget[] = [];
    const identities: Map<string, number> = new Map();
    const rawToEffective: number[] = raw.map((target: AutoMovieHumanClinicalIk.ITarget): number => {
      const key: string = JSON.stringify([target.bone, target.localPoint ?? [0, 0, 0], target.position]);
      let index: number | undefined = identities.get(key);
      if (index === undefined) { index = targets.length; identities.set(key, index); targets.push(structuredClone(target)); }
      return index;
    });
    return { rawTargets: structuredClone([...raw]), targets, rawToEffective };
  }
}
