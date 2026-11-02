import type { IAutoMovieHumanActionUnitActivation } from "../structures/expression/IAutoMovieHumanActionUnitActivation";
import type { IAutoMovieHumanExpression } from "../structures/expression/IAutoMovieHumanExpression";
import type { IAutoMovieHumanLipExpression } from "../structures/expression/IAutoMovieHumanLipExpression";
import type { IAutoMovieHumanMouthExpression } from "../structures/expression/IAutoMovieHumanMouthExpression";
import type { IAutoMovieHumanTongueExpression } from "../structures/expression/IAutoMovieHumanTongueExpression";
import type { IAutoMovieHumanVisemeWeights } from "../structures/expression/IAutoMovieHumanVisemeWeights";
import { AutoMovieHumanMouthExpression as Mouth } from "../expression/AutoMovieHumanMouthExpression";
import { AutoMovieHumanActionUnit } from "../typings/AutoMovieHumanActionUnit";

/** Runtime admission for the expression fields the generated mouth consumes. */
export namespace AutoMovieHumanExpressionAdmission {
  /** Validate every field and return independently owned expression data. */
  export function admit(value: unknown): IAutoMovieHumanExpression {
    if (!record(value) || !Array.isArray(value.units))
      throw new Error("Human expression must hold a units array");
    const problems: string[] = [];
    keys(value, ["units", "mouth"], "expression", problems);
    const units: IAutoMovieHumanActionUnitActivation[] = [];
    const seen: Map<string, Set<string>> = new Map();
    for (const entry of value.units) {
      if (!record(entry) || !unit(entry.unit) || !side(entry.side) || !bounded(entry.intensity, 0)) {
        problems.push("malformed action unit");
        continue;
      }
      keys(entry, ["unit", "side", "intensity"], entry.unit, problems);
      const used: Set<string> = seen.get(entry.unit) ?? new Set();
      if (used.has(entry.side) || used.has("both") || (entry.side === "both" && used.size > 0))
        problems.push(`duplicate or overlapping ${entry.unit}/${entry.side}`);
      used.add(entry.side);
      seen.set(entry.unit, used);
      if (entry.intensity > 0 && !SUPPORTED.has(entry.unit))
        problems.push(`${entry.unit}: the generated skin has no deformation for this unit`);
      if (JAW.has(entry.unit) && entry.side !== "both")
        problems.push(`${entry.unit}: the jaw acts bilaterally`);
      units.push({ unit: entry.unit, side: entry.side, intensity: entry.intensity });
    }
    const mouth: IAutoMovieHumanMouthExpression | undefined = value.mouth === undefined
      ? undefined
      : readMouth(value.mouth, seen, problems);
    if (problems.length > 0)
      throw new Error("Human expression is unsupported: " + problems.join("; "));
    return mouth === undefined ? { units } : { units, mouth };
  }
}

/** Admit the three optional mouth descriptions without unchecked casts. */
function readMouth(
  value: unknown,
  seen: ReadonlyMap<string, ReadonlySet<string>>,
  problems: string[],
): IAutoMovieHumanMouthExpression {
  if (!record(value)) {
    problems.push("mouth must be an object");
    return {};
  }
  keys(value, ["lips", "tongue", "visemes"], "mouth", problems);
  const out: IAutoMovieHumanMouthExpression = {};
  if (value.lips !== undefined) {
    const lips: IAutoMovieHumanLipExpression = {};
    if (!record(value.lips)) problems.push("mouth.lips must be an object");
    else {
      keys(value.lips, [...Mouth.PAIRED, ...Mouth.WHOLE], "mouth.lips", problems);
      for (const name of Mouth.PAIRED) {
        const pair: unknown = value.lips[name];
        if (pair === undefined) continue;
        if (seen.has(name)) problems.push(`${name} occurs in both units and mouth.lips`);
        if (!record(pair) || !bounded(pair.left, 0) || !bounded(pair.right, 0))
          problems.push(`mouth.lips.${name} needs left and right in [0, 1]`);
        else {
          keys(pair, ["left", "right"], name, problems);
          lips[name] = { left: pair.left, right: pair.right };
        }
      }
      for (const name of Mouth.WHOLE) {
        const amount: unknown = value.lips[name];
        if (amount === undefined) continue;
        if (seen.has(name)) problems.push(`${name} occurs in both units and mouth.lips`);
        if (!bounded(amount, 0)) problems.push(`mouth.lips.${name} must lie in [0, 1]`);
        else lips[name] = amount;
      }
    }
    out.lips = lips;
  }
  if (value.tongue !== undefined) {
    const tongue: IAutoMovieHumanTongueExpression = {};
    if (!record(value.tongue)) problems.push("mouth.tongue must be an object");
    else {
      keys(value.tongue, Mouth.TONGUE, "mouth.tongue", problems);
      for (const name of Mouth.TONGUE) {
        const amount: unknown = value.tongue[name];
        if (amount === undefined) continue;
        const minimum: number = name === "dorsumBacking" ? 0 : -1;
        if (!bounded(amount, minimum)) problems.push(`mouth.tongue.${name} must lie in [${minimum}, 1]`);
        else tongue[name] = amount;
      }
    }
    out.tongue = tongue;
  }
  if (value.visemes !== undefined) {
    const visemes: IAutoMovieHumanVisemeWeights = {};
    if (!record(value.visemes)) problems.push("mouth.visemes must be an object");
    else {
      keys(value.visemes, Mouth.VISEMES, "mouth.visemes", problems);
      for (const name of Mouth.VISEMES) {
        const amount: unknown = value.visemes[name];
        if (amount === undefined) continue;
        if (!bounded(amount, 0)) problems.push(`mouth.visemes.${name} must lie in [0, 1]`);
        else visemes[name] = amount;
      }
    }
    out.visemes = visemes;
  }
  return out;
}

/** Collect unknown own fields instead of silently ignoring authoring mistakes. */
function keys(value: Record<string, unknown>, allowed: readonly string[], path: string, problems: string[]): void {
  for (const key of Object.keys(value))
    if (!allowed.includes(key)) problems.push(`${path}.${key} is unknown`);
}

/** A non-array object whose fields can be admitted individually. */
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A finite intensity within its public closed interval. */
function bounded(value: unknown, minimum: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum && value <= 1;
}

/** One public side of an action unit. */
function side(value: unknown): value is IAutoMovieHumanActionUnitActivation["side"] {
  return value === "both" || value === "left" || value === "right";
}

/** A public action unit, including unsupported units admitted at rest. */
function unit(value: unknown): value is AutoMovieHumanActionUnit {
  return typeof value === "string" && UNITS.has(value);
}

/** Jaw channels compose with the authored pose through the instance. */
const JAW: ReadonlySet<string> = new Set(["jawDrop", "mouthStretch"]);

/** Units with a generated soft-tissue field or a skeletal jaw action. */
const SUPPORTED: ReadonlySet<string> = new Set([...Mouth.PAIRED, ...Mouth.WHOLE, ...JAW]);

/** Public action-unit vocabulary; the record checks completeness at compile time. */
const UNITS: ReadonlySet<string> = new Set(Object.keys({
  [AutoMovieHumanActionUnit.InnerBrowRaiser]: null,
  [AutoMovieHumanActionUnit.OuterBrowRaiser]: null,
  [AutoMovieHumanActionUnit.BrowLowerer]: null,
  [AutoMovieHumanActionUnit.UpperLidRaiser]: null,
  [AutoMovieHumanActionUnit.CheekRaiser]: null,
  [AutoMovieHumanActionUnit.LidTightener]: null,
  [AutoMovieHumanActionUnit.NoseWrinkler]: null,
  [AutoMovieHumanActionUnit.UpperLipRaiser]: null,
  [AutoMovieHumanActionUnit.NasolabialDeepener]: null,
  [AutoMovieHumanActionUnit.LipCornerPuller]: null,
  [AutoMovieHumanActionUnit.SharpLipPuller]: null,
  [AutoMovieHumanActionUnit.Dimpler]: null,
  [AutoMovieHumanActionUnit.LipCornerDepressor]: null,
  [AutoMovieHumanActionUnit.LowerLipDepressor]: null,
  [AutoMovieHumanActionUnit.ChinRaiser]: null,
  [AutoMovieHumanActionUnit.LipPucker]: null,
  [AutoMovieHumanActionUnit.LipStretcher]: null,
  [AutoMovieHumanActionUnit.NeckTightener]: null,
  [AutoMovieHumanActionUnit.LipFunneler]: null,
  [AutoMovieHumanActionUnit.LipTightener]: null,
  [AutoMovieHumanActionUnit.LipPressor]: null,
  [AutoMovieHumanActionUnit.LipsPart]: null,
  [AutoMovieHumanActionUnit.JawDrop]: null,
  [AutoMovieHumanActionUnit.MouthStretch]: null,
  [AutoMovieHumanActionUnit.LipSuck]: null,
  [AutoMovieHumanActionUnit.NostrilDilator]: null,
  [AutoMovieHumanActionUnit.NostrilCompressor]: null,
  [AutoMovieHumanActionUnit.LidDroop]: null,
  [AutoMovieHumanActionUnit.EyesClosed]: null,
} satisfies Record<AutoMovieHumanActionUnit, null>));
