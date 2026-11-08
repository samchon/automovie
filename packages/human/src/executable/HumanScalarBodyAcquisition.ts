import type { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import type { AutoMovieHumanSiteViewPart } from "../generation/limb/AutoMovieHumanSiteViewPart";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import type { HumanScalarProbe } from "./HumanScalarProbe";

/** Current scalar diagnostic's actual body-provider acquisition, separate from borrowed-control probes. */
export namespace HumanScalarBodyAcquisition {
  /** The existing invocation and its already imported production module. */
  export interface IInput
    extends
      Pick<HumanScalarProbe.IInput, "timed" | "actualNames">,
      Pick<HumanScalarProbe.IOutput, "part" | "unavailable"> {
    /** Explicit dynamic import stays inside the entry's original import boundary. */
    body: typeof import("../generation/AutoMovieHumanBodyLaw.js");

    /** Same actual production context. */
    context: AutoMovieHumanBodyLaw.IPrepared;

    /** Production names obtained from actual factory metadata. */
    bodyNames: Set<string>;

    /** Actual source acquisition rows. */
    acquisitions: Record<string, unknown>[];

    /** Retained original acquisition failures. */
    errors: Record<string, unknown>[];

    /** Existing report writer outside measured calls. */
    save(): void;
  }

  /** Preserve the current shared-trunk and named-factory order and all real failure outcomes. */
  export function run(
    input: IInput,
  ): R.Result<ReturnType<typeof AutoMovieHumanBodyLaw.bodyInput>> {
    const {
      body,
      context,
      timed,
      bodyNames,
      part,
      actualNames,
      acquisitions,
      errors,
      unavailable,
      save,
    }: IInput = input;
    const metadata: R.Result<
      ReturnType<typeof body.AutoMovieHumanBodyLaw.bodyInput>
    > = timed(
      "acquire:body-metadata",
      "Actual body input factories; this phase is not assigned to each scalar",
      (): ReturnType<typeof body.AutoMovieHumanBodyLaw.bodyInput> =>
        body.AutoMovieHumanBodyLaw.bodyInput(context),
      true,
    );
    if (metadata.ok) {
      bodyNames.add("trunk");
      for (const side of Object.keys(
        metadata.value.sides,
      ) as (keyof typeof metadata.value.sides)[]) {
        for (const kind of ["breast", "gluteal", "leg", "arm", "foot"])
          bodyNames.add(kind + "." + side);
        for (const name of [
          ...metadata.value.sides[side].digitNames,
          ...metadata.value.sides[side].toeNames,
        ])
          bodyNames.add(name);
      }
      const trunk: R.Result<
        ReturnType<typeof body.AutoMovieHumanBodyLaw.trunkSource>
      > = timed(
        "acquire:shared-trunk",
        "Actual shared two-pass trunk/tape/parent source preparation",
        (): ReturnType<typeof body.AutoMovieHumanBodyLaw.trunkSource> =>
          body.AutoMovieHumanBodyLaw.trunkSource(context),
        true,
      );
      if (!trunk.ok)
        errors.push({
          stage: "shared-trunk-acquisition",
          error: R.message(trunk.error),
        });
      for (const name of bodyNames) {
        const refs: string[] = ["acquire:canonical", "acquire:body-metadata"];
        if (/^(trunk|breast|gluteal)(?:\.|$)/.test(name))
          refs.push("acquire:shared-trunk");
        const acquired: R.Result<AutoMovieHumanSiteViewPart.IDefinition | null> =
          timed(
            "acquire:" + name,
            "Actual BodyLaw.original; first named request in this retained context",
            (): AutoMovieHumanSiteViewPart.IDefinition | null =>
              body.AutoMovieHumanBodyLaw.original(context, name),
            true,
          );
        const row: Record<string, unknown> = {
          part: name,
          membership: "production-body",
          phase: acquired.phase.id,
          sharedRefs: refs,
          acquisitionMillisecondsInclusive: acquired.phase.milliseconds,
          originalConstructorMilliseconds: null,
          status: !acquired.ok
            ? "threw"
            : acquired.value?.part === null || acquired.value === null
              ? "no-actual-source"
              : "acquired",
        };
        acquisitions.push(row);
        if (!acquired.ok) row.error = R.message(acquired.error);
        else {
          row.diagnostics = acquired.value?.diagnostics ?? [];
          if (
            acquired.value?.part !== null &&
            acquired.value?.part !== undefined
          )
            part(
              acquired.value.part,
              [...refs, acquired.phase.id],
              "production-body",
            );
        }
        if (!actualNames.has(name))
          unavailable(
            name,
            "production-body",
            [...refs, acquired.phase.id],
            !acquired.ok
              ? R.message(acquired.error)
              : (acquired.value?.diagnostics ?? "No actual part returned"),
          );
        save();
      }
    } else
      errors.push({
        stage: "body-metadata-acquisition",
        error: R.message(metadata.error),
      });

    return metadata;
  }
}
