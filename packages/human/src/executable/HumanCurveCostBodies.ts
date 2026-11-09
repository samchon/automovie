import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import type { AutoMovieHumanSiteViewPart } from "../generation/limb/AutoMovieHumanSiteViewPart";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import type { HumanCurveCostSamples } from "./HumanCurveCostSamples";

/** Actual body-original collection for the existing Cost invocation; shared families retain their real clocks. */
export namespace HumanCurveCostBodies {
  /** Borrowed producer context and result sinks; no second source family is constructed. */
  export interface IInput extends Pick<
    HumanCurveCostSamples.IInput,
    | "context"
    | "phases"
    | "errors"
    | "parts"
    | "actual"
    | "definitionRefs"
    | "save"
  > {
    /** Actual body inventory, populated from the production factory metadata. */
    bodyNames: Set<string>;
  }

  /** Acquire the current production body originals and repeat reads, preserving failures and shared cost references. */
  export function run(input: IInput): void {
    const {
      context,
      phases,
      errors,
      parts,
      actual,
      definitionRefs,
      save,
      bodyNames,
    }: IInput = input;
    const toeFamilies: Map<string, "left" | "right"> = new Map();
    const preparedToeFamilies: Set<string> = new Set();
    const failedToeFamilies: Map<string, string> = new Map();

    const body: R.Result<ReturnType<typeof AutoMovieHumanBodyLaw.bodyInput>> =
      R.measure(
        phases,
        "body-factory-map",
        "BodyLaw.bodyInput; factory metadata only",
        (): ReturnType<typeof AutoMovieHumanBodyLaw.bodyInput> =>
          AutoMovieHumanBodyLaw.bodyInput(context),
      );
    if (body.ok) {
      bodyNames.add("trunk");
      for (const side of Object.keys(
        body.value.sides,
      ) as (keyof typeof body.value.sides)[]) {
        for (const kind of ["breast", "gluteal", "leg", "arm", "foot"])
          bodyNames.add(kind + "." + side);
        for (const name of [
          ...body.value.sides[side].digitNames,
          ...body.value.sides[side].toeNames,
        ])
          bodyNames.add(name);
        for (const name of body.value.sides[side].toeNames)
          toeFamilies.set(name, side);
      }
      const trunk: R.Result<
        ReturnType<typeof AutoMovieHumanBodyLaw.trunkSource>
      > = R.measure(
        phases,
        "trunk-family",
        "BodyLaw.trunkSource; shared tape passes and actual parent constraints",
        (): ReturnType<typeof AutoMovieHumanBodyLaw.trunkSource> =>
          AutoMovieHumanBodyLaw.trunkSource(context),
      );
      if (!trunk.ok)
        errors.push({ stage: "trunk-family", error: R.message(trunk.error) });
      for (const name of bodyNames) {
        const refs: string[] = ["canonical", "body-factory-map"];
        if (/^(trunk|breast|gluteal)(?:\.|$)/.test(name))
          refs.push("trunk-family");
        const toeSide: "left" | "right" | undefined = toeFamilies.get(name);
        if (toeSide !== undefined) {
          const familyId: string = "toe-family." + toeSide;
          refs.push(familyId, "definition:foot." + toeSide);
          if (!preparedToeFamilies.has(toeSide)) {
            preparedToeFamilies.add(toeSide);
            const family: R.Result<
              ReturnType<
                typeof AutoMovieHumanBodyLaw.bodyInput
              >["sides"]["left"]["toes"]
            > = R.measure(
              phases,
              familyId,
              "Shared production toe getter authors all its actual side members",
              (): ReturnType<
                typeof AutoMovieHumanBodyLaw.bodyInput
              >["sides"]["left"]["toes"] => body.value.sides[toeSide].toes,
            );
            if (!family.ok) {
              failedToeFamilies.set(toeSide, R.message(family.error));
              errors.push({ stage: familyId, error: R.message(family.error) });
            }
          }
        }
        if (/^(finger|thumb)\./.test(name))
          refs.push("definition:arm." + name.split(".")[1]);
        definitionRefs.set(name, refs);
        if (toeSide !== undefined && failedToeFamilies.has(toeSide)) {
          parts.push({
            name,
            kind: "body",
            definitionStatus: "blocked-by-shared-toe-factory",
            definitionRequestMillisecondsInclusive: null,
            sharedDefinitionRefs: refs,
            error: failedToeFamilies.get(toeSide),
          });
          continue;
        }
        const first: R.Result<AutoMovieHumanSiteViewPart.IDefinition | null> =
          R.measure(
            phases,
            "definition:" + name,
            "BodyLaw.original(" +
              name +
              "); first explicit incremental request",
            (): AutoMovieHumanSiteViewPart.IDefinition | null =>
              AutoMovieHumanBodyLaw.original(context, name),
          );
        const row: Record<string, unknown> = {
          name,
          kind: "body",
          definitionPhase: first.phase.id,
          sharedDefinitionRefs: refs,
          boundary:
            "First named request in the retained production context; required parents can be included. No isolated cold cost or apportioned family cost is claimed.",
          definitionStatus: !first.ok
            ? "threw"
            : first.value?.part === null || first.value === null
              ? "unavailable"
              : "available",
        };
        parts.push(row);
        if (!first.ok) {
          row.error = R.message(first.error);
          continue;
        }
        row.diagnostics = first.value?.diagnostics ?? [];
        if (first.value?.part !== null && first.value?.part !== undefined)
          actual.set(name, first.value.part);
        const retained: R.Result<AutoMovieHumanSiteViewPart.IDefinition | null> =
          R.measure(
            phases,
            "retained:" + name,
            "BodyLaw.original; same-context repeated request",
            (): AutoMovieHumanSiteViewPart.IDefinition | null =>
              AutoMovieHumanBodyLaw.original(context, name),
          );
        row.retainedReadMilliseconds = retained.phase.milliseconds;
        row.sameDefinitionIdentity =
          retained.ok && retained.value === first.value;
        row.definitionRequestMillisecondsInclusive = first.phase.milliseconds;
        row.individualFactoryMillisecondsExclusive = null;
        row.retainedReadStatus = retained.ok ? "returned" : "threw";
        if (!retained.ok) row.retainedReadError = R.message(retained.error);
        save();
      }
    } else
      errors.push({ stage: "body-factory-map", error: R.message(body.error) });
  }
}
