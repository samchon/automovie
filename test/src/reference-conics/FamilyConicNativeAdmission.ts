import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { AutoMovieLoftViewSource, AutoMovieViewLoft } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as Loft,
  AutoMovieHumanF1 as Figure,
  AutoMovieHumanF1NativeLaw as Law,
} from "@automovie/human";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1Engineering,
  IAutoMovieViewPart,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Deepen the completed native round's actual entry-admission failures.
 * Reads its exact resolved fields and the same production generating owner.
 * All logical families, their declared twins and caller cap/bare scopes are
 * inspected before any geometry correction; no target is solved again.
 */
namespace FamilyConicNativeAdmission {
  /** Every requested scope is explicit; no failed source is replaced by F1. */
  interface Scope {
    name: string;
    family: IAutoMovieHumanConicLoft.IFamily;
    usage: string;
  }
  /** Actual caller variants that can change native cap/pole bindings. */
  function scopes(family: IAutoMovieHumanConicLoft.IFamily): Scope[] {
    return [
      {
        name: "full",
        family,
        usage: "complete native family on authored knots",
      },
      {
        name: "open-bottom",
        family: { ...family, tips: [null, family.tips?.[1] ?? null] },
        usage: "exact fanSeams child request; no bottom cap",
      },
      {
        name: "open-top",
        family: { ...family, tips: [family.tips?.[0] ?? null, null] },
        usage: "fan host/continued source scope",
      },
      {
        name: "open-both",
        family: { ...family, tips: undefined },
        usage: "exact fanSeams host/valley request",
      },
      {
        name: "bare",
        family: {
          ...family,
          tips: undefined,
          reliefs: undefined,
          turn: undefined,
        },
        usage: "explicit bare native scope, not full-skin admission",
      },
    ];
  }
  /** Retain the actual engine refusal and source parameter/domain/sampling context. */
  function inspect(
    family: IAutoMovieHumanConicLoft.IFamily,
    originals: ReadonlyMap<string, IAutoMovieViewPart>,
  ): unknown[] {
    return scopes(family).map((scope): unknown => {
      const began: number = performance.now();
      try {
        const part = Loft.part(scope.family, [...scope.family.knots]);
        const scalar = AutoMovieLoftViewSource.create(part);
        const raw = AutoMovieViewLoft.create(part);
        const bank = originals.get(family.name);
        let bankGrid: unknown = null;
        if (raw.chain === null && bank !== undefined) {
          try {
            const other = Loft.part(scope.family, [...bank.stations]),
              loft = AutoMovieViewLoft.create(other);
            bankGrid = {
              stations: other.stations,
              samples: other.samples,
              pole: other.pole ?? null,
              diagnostics: loft.diagnostics,
              admitted: loft.chain !== null,
            };
          } catch (error: unknown) {
            bankGrid = {
              unavailable:
                error instanceof Error ? error.message : String(error),
            };
          }
        }
        return {
          name: family.name,
          scope: scope.name,
          usage: scope.usage,
          admitted: raw.chain !== null,
          diagnostics: raw.diagnostics,
          scalarAdmission:
            scalar === null
              ? null
              : {
                  diagnostics: scalar.diagnostics,
                  source:
                    scalar.source === null
                      ? null
                      : { domain: scalar.source.domain },
                },
          source: {
            stations: part.stations,
            samples: part.samples,
            phases: part.phases ?? null,
            pole: part.pole ?? null,
            capRequest: scope.family.tips ?? null,
            fieldControls:
              raw.chain === null
                ? {
                    front: part.front,
                    side: part.side,
                    fullness: part.fullness,
                  }
                : null,
          },
          bankGrid,
          milliseconds: performance.now() - began,
        };
      } catch (error: unknown) {
        return {
          name: family.name,
          scope: scope.name,
          usage: scope.usage,
          admitted: false,
          unavailable: error instanceof Error ? error.message : String(error),
          milliseconds: performance.now() - began,
        };
      }
    });
  }
  /**
   * Collect all independent source/scope refusals from the already resolved case catalog.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses the same Law.prepare/all builder and existing frame composer, then actual ConicLoft.part/ViewLoft/source admission for each requested caller scope. Failed first children cannot hide siblings or other families.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One original bank/calibration and one complete bone input per support span serve the immutable case table; each source request catches its actual failure and continues.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Performs no measurement solve, parameter correction, margin tuning, reference read or final-skin realization. An unresolved inverse remains unresolved even when its candidate fields are diagnostically inspected.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes actual production caller cap scopes, bare source scope and an original-bank-grid counterpart; a source refusal is not automatically an anatomical defect.
   * @evidence contracts/development/implementation.md#efficient-algorithms Bounded families/scopes/cases use original-calibration and support-frame reuse; raw source factories are evaluated only for this missing admission evidence.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the completed cases and actual production builders; it duplicates no inverse, family law, loft evaluator or inventory pipeline.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes one plain receipt per case and retains only the original bank, bounded bone cache and current case's source diagnostics.
   */
  export async function main(): Promise<void> {
    const option = (name: string): string | undefined =>
      process.argv
        .find((argument: string): boolean => argument.startsWith(name + "="))
        ?.slice(name.length + 1);
    const output = option("--out"),
      catalogPath = option("--cases"),
      root = path.resolve(
        process.cwd(),
        process.cwd().endsWith("test") ? ".." : ".",
      );
    if (
      output === undefined ||
      !path.isAbsolute(output) ||
      !path
        .resolve(output)
        .toLowerCase()
        .startsWith(
          (path.join(root, "packages/human/.shots") + path.sep).toLowerCase(),
        ) ||
      catalogPath === undefined ||
      !path.isAbsolute(catalogPath)
    )
      throw new Error("absolute --cases and new human/.shots --out required");
    const catalogBytes = await fs.readFile(catalogPath),
      catalog = JSON.parse(catalogBytes.toString()) as {
        sourceHashes: Record<string, string>;
        cases: IAutoMovieHumanF1Engineering.IResolvedCase[];
      };
    for (const [relative, expected] of Object.entries(catalog.sourceHashes)) {
      const file = path.resolve(root, relative);
      if (
        !file.toLowerCase().startsWith((root + path.sep).toLowerCase()) ||
        Identity.byteHash(await fs.readFile(file)) !== expected
      )
        throw new Error("case generation source changed: " + relative);
    }
    await fs.mkdir(output, { recursive: true });
    const started: number = performance.now(),
      original = Figure.assemble(),
      bank = Figure.constructionBareFrom(original).sources,
      prepared = Law.prepare(original, bank);
    const originalRows = original.families.flatMap((family): unknown[] => [
      ...inspect(family, bank),
      ...(bank.has(family.name + ".mirror")
        ? inspect(Loft.mirror(family, family.name + ".mirror"), bank)
        : []),
    ]);
    await fs.writeFile(
      path.join(output, "original-scopes.json"),
      JSON.stringify({
        scope: "ordinary authored families, same caller scopes",
        rows: originalRows,
      }),
      { flag: "wx" },
    );
    const plans = [
      {
        id: "forced-native-f1",
        fields: prepared.fields,
        inputStatus: "explicit forced native F1",
      },
      ...catalog.cases.map((item) => ({
        id: item.id,
        fields: item.fields,
        inputStatus: item.resolution.status,
      })),
    ];
    const summary: unknown[] = [];
    for (const plan of plans) {
      const began: number = performance.now();
      try {
        // The production owner composes the person's skeleton from every field it reads (lengths, hip support).
        const assembly = Figure.nativeFrom(plan.fields, prepared),
          rows = assembly.families.flatMap((family): unknown[] => [
            ...inspect(family, bank),
            ...(bank.has(family.name + ".mirror")
              ? inspect(Loft.mirror(family, family.name + ".mirror"), bank)
              : []),
          ]);
        const receipt = {
          id: plan.id,
          inputStatus: plan.inputStatus,
          fields: plan.fields,
          fieldsHash: Identity.dataHash(plan.fields),
          sourceHashes: catalog.sourceHashes,
          rows,
          milliseconds: performance.now() - began,
          qualification:
            "diagnostic admission only; no input, surface, anatomical or full-mesh acceptance; same original bank/calibration, complete skeleton input and production native builder",
        };
        await fs.writeFile(
          path.join(output, plan.id + ".json"),
          JSON.stringify(receipt),
          { flag: "wx" },
        );
        const failures = rows
          .filter(
            (row): boolean =>
              row !== null &&
              typeof row === "object" &&
              (row as { admitted?: boolean }).admitted === false,
          )
          .map((row): unknown => {
            const r = row as {
              name: string;
              scope: string;
              diagnostics?: unknown;
              unavailable?: string;
            };
            return {
              name: r.name,
              scope: r.scope,
              diagnostics: r.diagnostics ?? null,
              unavailable: r.unavailable ?? null,
            };
          });
        summary.push({
          id: plan.id,
          inputStatus: plan.inputStatus,
          requests: rows.length,
          failures,
          milliseconds: receipt.milliseconds,
        });
        process.stdout.write(JSON.stringify(summary.at(-1)) + "\n");
      } catch (error: unknown) {
        const failed = {
          id: plan.id,
          unavailable: error instanceof Error ? error.message : String(error),
        };
        summary.push(failed);
        await fs.writeFile(
          path.join(output, plan.id + ".json"),
          JSON.stringify(failed),
          { flag: "wx" },
        );
        process.stdout.write(JSON.stringify(failed) + "\n");
      }
    }
    await fs.writeFile(
      path.join(output, "admission.json"),
      JSON.stringify({
        created: new Date().toISOString(),
        catalog: { file: catalogPath, sha256: Identity.byteHash(catalogBytes) },
        sourceHashes: catalog.sourceHashes,
        calibration: prepared.calibration,
        boneInputs: plans.length,
        cases: summary,
        totalMs: performance.now() - started,
        bundle: {
          file: process.argv[1],
          sha256: Identity.byteHash(await fs.readFile(process.argv[1]!)),
        },
        acceptance:
          "none; completes the source-admission failure inspection before corrective geometry",
      }),
      { flag: "wx" },
    );
  }
}
void FamilyConicNativeAdmission.main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
