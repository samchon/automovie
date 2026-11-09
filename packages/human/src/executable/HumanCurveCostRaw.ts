import type { AutoMovieViewLoft } from "@automovie/engine";
import fs from "node:fs";
import path from "node:path";

import { AutoMovieHumanBodyLaw } from "../generation/AutoMovieHumanBodyLaw";
import { HumanCurveCostReport as R } from "./HumanCurveCostReport";
import type { HumanCurveCostSamples } from "./HumanCurveCostSamples";

/** Explicit named raw consumption after the existing Cost entry finishes original sampling. */
export namespace HumanCurveCostRaw {
  /** Same invocation and record ownership; raw results never replace original rows. */
  export interface IInput extends Pick<
    HumanCurveCostSamples.IInput,
    "parts" | "actual" | "context" | "phases" | "output" | "save"
  > {
    /** Actual body provider names, separate from head sources and studies. */
    bodyNames: Set<string>;

    /** Actual regional definition, or null after its retained acquisition failure. */
    head: ReturnType<
      AutoMovieHumanBodyLaw.IPrepared["head"]["originals"]
    > | null;
  }

  /** Request actual production suppliers once and serialize returned principal numeric rows outside their clocks. */
  export function run(input: IInput): void {
    const {
      parts,
      actual,
      context,
      bodyNames,
      head,
      phases,
      output,
      save,
    }: IInput = input;
    // Native named loft requests happen only after every original curve was observed.
    for (const row of parts) {
      const name: string = String(row.name);
      if (!actual.has(name)) {
        row.rawStatus = "not-callable-no-actual-source";
        row.rawMilliseconds = null;
        continue;
      }
      const retained: boolean = bodyNames.has(name)
        ? (context.rawSources?.has(name) ?? false)
        : name === "head.mass"
          ? context.head.source.raw !== null
          : (head?.lofts.has(name) ?? false);
      const raw: R.Result<AutoMovieViewLoft.IResult | null> = R.measure(
        phases,
        "raw:" + name,
        "Actual named production raw loft supplier",
        (): AutoMovieViewLoft.IResult | null =>
          bodyNames.has(name)
            ? (AutoMovieHumanBodyLaw.trunkLoft(context, name)?.loft ?? null)
            : name === "head.mass"
              ? context.head.source.loft()
              : (head?.loft(name) ?? null),
      );
      row.rawMilliseconds = raw.phase.milliseconds;
      row.rawRetainedBeforeRequest = retained;
      row.rawStatus = !raw.ok
        ? "threw"
        : raw.value?.chain === null || raw.value === null
          ? "unavailable-chain"
          : retained
            ? "retained-result"
            : "new-native-loft";
      if (raw.ok)
        row.rawFacts = {
          sections: raw.value?.sections.length ?? 0,
          layers: raw.value?.chain?.layers.length ?? null,
          diagnostics: raw.value?.diagnostics ?? [],
          representation:
            "Native raw coefficient chain; no mesh, Canvas, PNG or final joins",
        };
      else row.rawError = R.message(raw.error);
      if (
        raw.ok &&
        raw.value?.chain !== null &&
        raw.value?.chain !== undefined
      ) {
        const payload: string = JSON.stringify(R.rawPayload(raw.value.chain));
        const payloadPath: string = path.join(
          output,
          "raw." + name.replaceAll(/[^\w.-]/g, "_") + ".json",
        );
        fs.writeFileSync(payloadPath, payload);
        row.rawPrincipalNumericSha256 = R.hash(payload);
        row.rawPrincipalNumericPath = payloadPath;
        row.rawNumericHashBoundary =
          "Principal rows/order/frames/jets; callable/native laws are excluded. Serialization is outside the measured supplier call.";
      }
      save();
    }
  }
}
