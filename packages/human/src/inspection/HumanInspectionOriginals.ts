import type { AutoMovieLoftContract } from "@automovie/engine";

import { AutoMovieHumanBodyAnatomy } from "../generation/AutoMovieHumanBodyAnatomy";
import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import type { HumanInspectionParts } from "./HumanInspectionParts";
import { HumanInspectionPattern } from "./HumanInspectionPattern";
import { HumanInspectionBodyParts } from "./HumanInspectionBodyParts";
import { HumanInspectionHeadParts } from "./HumanInspectionHeadParts";

/** Routes original requests to their actual source factories; assembly and raw requests stay explicit. */
export namespace HumanInspectionOriginals {
  /** Source scope, nullable attempts and not-run final state borrowed by readers. */
  type IOutput = HumanInspectionParts.IOutput;

  /** Exact available original or explicitly declared partial guide. */
  type IPart = HumanInspectionParts.IPart;

  /** Combine selected observations over one production context; standalone '*' requests all original providers while tree assembly remains explicit. */
  export function scoped(context: AutoMovieHumanBodyLaw.IOriginal, patterns: readonly string[]): IOutput {
    const body: string[] = patterns.filter((pattern: string): boolean => HumanInspectionPattern.matches("trunk", [pattern], "") || ["breast.", "gluteal.", "leg.", "arm.", "foot.", "thumb.", "finger.", "toe."].some((prefix: string): boolean => canMatchPrefix(pattern, prefix)));
    const head: string[] = patterns.filter((pattern: string): boolean => !isBody(pattern));
    const observations: IOutput[] = [body.length === 0 ? null : HumanInspectionBodyParts.of(context, body), head.length === 0 ? null : HumanInspectionHeadParts.of(context, head)].filter((value: IOutput | null): value is IOutput => value !== null);
    const records: IOutput["sourceRecords"] = observations.flatMap((value: IOutput): IOutput["sourceRecords"] => value.sourceRecords);
    const unavailable: Set<string> = new Set(observations.flatMap((value: IOutput): string[] => value.observation.unavailableParts));
    const names: string[] = [...records.map((record: IOutput["sourceRecords"][number]): string => record.name), ...unavailable];

    // A broad glob may visit both providers. Only the combined actual names can
    // establish that it matched neither; one provider must not veto the other.
    for (const pattern of patterns)
      if (!names.some((name: string): boolean => HumanInspectionPattern.matches(name, [pattern], ""))) unavailable.add(pattern);
    return {
      parts: observations.flatMap((value: IOutput): IPart[] => value.parts),
      scale: AutoMovieHumanBodyAnatomy.resolve(context.params).stature / context.stature,
      repeats: observations.reduce((merged: Record<string, number>, value: IOutput): Record<string, number> => ({ ...merged, ...value.repeats }), {}),
      diagnostics: { body: observations.length === 0 ? [...context.diagnostics] : observations.flatMap((value: IOutput): AutoMovieLoftContract.IDiagnostic[] => value.diagnostics.body), head: observations.length === 0 ? [] : observations.flatMap((value: IOutput): AutoMovieLoftContract.IDiagnostic[] => value.diagnostics.head) },
      sourceRecords: records,
      observation: { stage: "scoped-source-definition", finalRealization: "not-run", treeParts: [], studies: observations.flatMap((value: IOutput): string[] => value.observation.studies), definitionOnlyParts: [], unavailableParts: [...unavailable], scope: { requested: [...patterns], observed: [...new Set(records.map((record: IOutput["sourceRecords"][number]): string => record.name))], tree: "not-assembled", unrequested: observations.length === 0 ? "No original part was requested. Canonical prerequisites may be prepared; no original family, raw loft or production tree was observed." : observations.map((value: IOutput): string => value.observation.scope!.unrequested).join(" ") } },
    };
  }

  /**
   * Request one exact raw source from its production owner, without a debug loft or parallel result cache.
   *
   * A head raw is lofted on the same definition its scoped reader selects
   * ({@link HumanInspectionHeadParts.of}): exact head names request their own
   * definition, which for originals read only on or below nasion is the
   * pre-closure host, and a star glob or a full observation requests the
   * complete catalogue. Each host keeps its own raw records, so a raw requested
   * on another host would stay invisible to that reader.
   *
   * @param patterns The scoped request's patterns; omitted for a full observation.
   */
  export function loft(context: AutoMovieHumanBodyLaw.IOriginal, name: string, patterns?: readonly string[]): void {
    if (isBody(name)) AutoMovieHumanBodyLaw.trunkLoft(context, name);
    else {
      const head: ReturnType<typeof context.headSource> = context.headSource();
      const selected: string[] | undefined = patterns?.filter((pattern: string): boolean => !isBody(pattern));
      if (name === head.source.guides.name) head.source.loft();
      else head.originals(selected === undefined || selected.some((pattern: string): boolean => pattern.includes("*")) ? undefined : selected).loft(name);
    }
  }

  /** Public body selector namespaces; actual digit/toe membership comes from production factory metadata. */
  function isBody(pattern: string): boolean {
    return /^(?:trunk|breast|gluteal|leg|arm|foot|thumb|finger|toe)(?:$|[.*])/.test(pattern);
  }

  /** Whether the public star-glob can consume a namespace prefix before any suffix; this routes broad globs without preparing every named original. */
  function canMatchPrefix(pattern: string, prefix: string): boolean {
    let states: Set<number> = new Set([0]);
    for (const character of prefix) {
      for (const state of states)
        if (pattern[state] === "*") states.add(state + 1);
      const next: Set<number> = new Set();
      for (const state of states)
        if (pattern[state] === "*") next.add(state);
        else if (pattern[state] === character) next.add(state + 1);
      states = next;
      if (states.size === 0) return false;
    }
    return states.size !== 0;
  }
}
