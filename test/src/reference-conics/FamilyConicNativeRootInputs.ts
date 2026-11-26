import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { FamilyConicNativePremises } from "./FamilyConicNativePremises";
import {
  FamilyConicNativeRootObservations as Observation,
} from "./FamilyConicNativeRootObservations";
import {
  AutoMovieConstructionAdmission,
  AutoMovieSolidChain,
  AutoMovieViewLoft,
} from "@automovie/engine";
import {
  AutoMovieHumanF1 as Figure,
  AutoMovieHumanF1NativeLaw as Law,
  AutoMovieHumanF1Placing as Placing,
  AutoMovieHumanHipSupportPlacement,
} from "@automovie/human";
import type {
  IAutoMovieHumanF1,
  IAutoMovieHumanF1Engineering,
  IAutoMovieHumanF1NativeLaw,
  IAutoMovieLoftChain,
  IAutoMovieSolidSurface,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * Missing root/operator inputs from the completed frozen engineering round.
 * Bundle with esbuild; provide absolute --cases, --round, --patch and --out.
 * Human geometry remains unchanged. The engine's added observation hooks make
 * this a separately hashed diagnostic generation, never the old input receipt.
 */
namespace FamilyConicNativeRootInputs {
  /** The actual relieved source supplied to the existing operator walker. */
  interface Source {
    chain: IAutoMovieLoftChain;
    surface: IAutoMovieSolidSurface;
  }

  /**
   * Collect all missing column/seed evidence without another constraint solve.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads immutable resolved fields and the existing native/source/operator owners, records actual computed trace events and pass-through seed queries, and preserves unresolved inputs and every failure.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One original bank/calibration, a bounded complete-chain cache and the existing postorder operator walker serve the full planned case list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no geometry, inverse, search, profile, scale or sampling; old generation provenance and the observation-only engine changes remain distinct.
   * @evidence contracts/development/common.md#meaningful-documentation Names actual physical/source versus normalized ribbon units and the unavailable/full-mesh limits.
   * @evidence contracts/development/implementation.md#efficient-algorithms Repeats only actual source and operator preparation needed for missing runtime inputs, with no full mesh, reference capture or repeated tape solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses completed case fields and the same prepared builders; the existing walker alone composes bands and seeds.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Writes an immutable per-case receipt, retaining only original preparation, the small bone cache and the current case's observations.
   */
  export async function main(): Promise<void> {
    const option = (name: string): string | undefined =>
      process.argv
        .find((argument: string): boolean => argument.startsWith(name + "="))
        ?.slice(name.length + 1);
    const output: string | undefined = option("--out"),
      catalogPath: string | undefined = option("--cases"),
      roundPath: string | undefined = option("--round"),
      patchPath: string | undefined = option("--patch");
    const root: string = path.resolve(
      process.cwd(),
      process.cwd().endsWith("test") ? ".." : ".",
    );
    if (
      [output, catalogPath, roundPath, patchPath].some(
        (value: string | undefined): boolean =>
          value === undefined || !path.isAbsolute(value),
      ) ||
      output === undefined ||
      catalogPath === undefined ||
      roundPath === undefined ||
      patchPath === undefined ||
      !path
        .resolve(output)
        .toLowerCase()
        .startsWith(
          (path.join(root, "packages/human/.shots") + path.sep).toLowerCase(),
        )
    )
      throw new Error(
        "absolute --cases/--round/--patch and new human/.shots --out required",
      );
    const catalogBytes: Buffer = await fs.readFile(catalogPath),
      roundBytes: Buffer = await fs.readFile(roundPath),
      patchBytes: Buffer = await fs.readFile(patchPath);
    const catalog: {
      sourceHashes: Record<string, string>;
      cases: IAutoMovieHumanF1Engineering.IResolvedCase[];
    } = JSON.parse(catalogBytes.toString());
    const originRound: { sourceHashes: Record<string, string> } = JSON.parse(
      roundBytes.toString(),
    );
    if (
      Identity.dataHash(catalog.sourceHashes) !==
      Identity.dataHash(originRound.sourceHashes)
    )
      throw new Error("completed cases/round generation hashes differ");
    const allowed: Set<string> = new Set([
      "packages/engine/src/geometry/construction/AutoMovieConstructionSplitBand.ts",
      "packages/engine/src/geometry/construction/AutoMovieConstructionSeeds.ts",
      "packages/engine/src/geometry/construction/index.ts",
    ]);
    const current: Record<string, string> = {},
      changed: {
        file: string;
        before: string | null;
        after: string;
        scope: string;
      }[] = [];
    for (const [relative, expected] of Object.entries(catalog.sourceHashes)) {
      const file: string = path.resolve(root, relative);
      if (!file.toLowerCase().startsWith((root + path.sep).toLowerCase()))
        throw new Error("source path leaves checkout: " + relative);
      const actual: string = Identity.byteHash(await fs.readFile(file));
      current[relative] = actual;
      if (actual !== expected) {
        if (!allowed.has(relative))
          throw new Error(
            "frozen generation source changed outside observation scope: " +
              relative,
          );
        changed.push({
          file: relative,
          before: expected,
          after: actual,
          scope:
            "existing producer optional observation connections; exact diff separately recorded",
        });
      }
    }
    for (const name of [
      "AutoMovieConstructionSplitBandTrace",
      "AutoMovieConstructionSeedTrace",
    ]) {
      const relative: string =
          "packages/engine/src/geometry/construction/" + name + ".ts",
        actual: string = Identity.byteHash(
          await fs.readFile(path.join(root, relative)),
        );
      current[relative] = actual;
      changed.push({
        file: relative,
        before: null,
        after: actual,
        scope: "new observation type/snapshot owner; no geometry producer",
      });
    }
    await fs.mkdir(output, { recursive: true });
    const provenance: Record<string, unknown> = {
      original: {
        catalog: {
          file: catalogPath,
          byteHash: Identity.byteHash(catalogBytes),
        },
        round: { file: roundPath, byteHash: Identity.byteHash(roundBytes) },
        sourceHashes: catalog.sourceHashes,
      },
      diagnostic: {
        sourceHashes: current,
        changed,
        observationDiff: {
          file: patchPath,
          byteHash: Identity.byteHash(patchBytes),
        },
        producer: {
          file: "test/src/reference-conics/FamilyConicNativeRootInputs.ts",
          byteHash: Identity.byteHash(
            await fs.readFile(
              path.join(
                root,
                "test/src/reference-conics/FamilyConicNativeRootInputs.ts",
              ),
            ),
          ),
        },
        walker: {
          file: "test/src/reference-conics/FamilyConicNativePremises.ts",
          byteHash: Identity.byteHash(
            await fs.readFile(
              path.join(
                root,
                "test/src/reference-conics/FamilyConicNativePremises.ts",
              ),
            ),
          ),
        },
        bundle: {
          file: process.argv[1],
          byteHash: Identity.byteHash(await fs.readFile(process.argv[1]!)),
        },
      },
      qualification:
        "separate observation-only generation; original case bytes/fields retained; not a replacement accepted case/preflight receipt",
    };
    const started: number = performance.now(),
      original: IAutoMovieHumanF1.IAssembly = Figure.assemble(),
      originalConstruction: ReturnType<typeof Figure.constructionFrom> =
        Figure.constructionFrom(original),
      prepared: IAutoMovieHumanF1NativeLaw.IPrepared = Law.prepare(
        original,
        originalConstruction.sources,
      );
    const bones: Map<number, IAutoMovieHumanF1.IAssembly> = new Map([
      [prepared.fields.hipJointCentreBreadth, original],
    ]);
    const plans: IAutoMovieHumanF1Engineering.IResolvedCase[] = [
      catalog.cases[0]!,
      { ...catalog.cases[0]!, id: "forced-native-f1" },
      ...catalog.cases.slice(1),
    ];
    const summary: unknown[] = [];
    for (const plan of plans) {
      if (plan.resolution.status !== "resolved") {
        summary.push({
          id: plan.id,
          status: "input-unresolved",
          resolution: plan.resolution,
        });
        continue;
      }
      const began: number = performance.now(),
        observed: Observation.IObservation = Observation.create(),
        failures: { owner: string; detail: string }[] = [];
      const events: Observation.IObservation["actualBands"] =
          observed.actualBands,
        seeds: Observation.IObservation["actualAxillaSeedEvents"] =
          observed.actualAxillaSeedEvents,
        queries: Observation.IObservation["actualAxillaQueries"] =
          observed.actualAxillaQueries,
        seams: unknown[] = observed.actualSeams;
      try {
        const oldPath: string = path.join(
            path.dirname(roundPath),
            plan.id + ".json",
          ),
          oldBytes: Buffer = await fs.readFile(oldPath);
        const old: {
          id: string;
          fieldsHash: string;
          fields: IAutoMovieHumanF1NativeLaw.IFields;
          sourceHashes: Record<string, string>;
          operators: { failures: unknown; backward: unknown };
        } = JSON.parse(oldBytes.toString());
        const fieldsHash: string = Identity.dataHash(plan.fields);
        if (
          old.id !== plan.id ||
          old.fieldsHash !== fieldsHash ||
          Identity.dataHash(old.fields) !== fieldsHash ||
          Identity.dataHash(old.sourceHashes) !==
            Identity.dataHash(catalog.sourceHashes)
        )
          throw new Error("completed case metadata differs: " + plan.id);
        let bone: IAutoMovieHumanF1.IAssembly | undefined = bones.get(
          plan.fields.hipJointCentreBreadth,
        );
        if (bone === undefined) {
          bone = Figure.assemble(
            undefined,
            AutoMovieHumanHipSupportPlacement.place(
              plan.fields,
              Placing.CHAIN,
              "femur",
            ),
          );
          bones.set(plan.fields.hipJointCentreBreadth, bone);
        }
        const baseline: boolean =
          plan.id !== "forced-native-f1" &&
          fieldsHash === Identity.dataHash(prepared.fields);
        const assembly: IAutoMovieHumanF1.IAssembly = baseline
          ? original
          : prepared.apply(plan.fields, bone);
        const assembled: number = performance.now(),
          declared: ReturnType<typeof Figure.constructionFrom> = baseline
            ? originalConstruction
            : Figure.constructionFrom(assembly),
          constructed: number = performance.now();
        try {
          AutoMovieConstructionAdmission.admit(declared.root);
        } catch (error: unknown) {
          failures.push({
            owner: "tree admission",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
        const sources: Map<string, Source> = new Map();
        for (const [name, part] of declared.sources) {
          try {
            const raw: ReturnType<typeof AutoMovieViewLoft.create> =
              AutoMovieViewLoft.create(part);
            if (raw.chain === null)
              throw new Error(JSON.stringify(raw.diagnostics));
            const chain: IAutoMovieLoftChain = AutoMovieSolidChain.framed(
                raw.chain,
              ),
              surface: IAutoMovieSolidSurface | null =
                AutoMovieSolidChain.surface(chain);
            if (surface === null)
              throw new Error("actual full relieved source unavailable");
            sources.set(name, { chain, surface });
          } catch (error: unknown) {
            failures.push({
              owner: name,
              detail: error instanceof Error ? error.message : String(error),
            });
          }
        }
        const sourced: number = performance.now();
        const operators: ReturnType<typeof FamilyConicNativePremises> =
          FamilyConicNativePremises(declared.root, sources, observed.hooks);
        const operatorEnd: number = performance.now(),
          outcome: {
            failures: typeof operators.failures;
            backward: typeof operators.backward;
          } = { failures: operators.failures, backward: operators.backward };
        const receipt: Record<string, unknown> = {
          schema: "f1-native-root-inputs/v1",
          id: plan.id,
          fields: plan.fields,
          fieldsHash,
          originalCase: {
            file: oldPath,
            byteHash: Identity.byteHash(oldBytes),
          },
          provenance,
          sourceFailures: failures,
          sourceCount: sources.size,
          actualBands: events,
          actualSeams: seams,
          actualAxillaSeedEvents: seeds,
          actualAxillaQueries: queries,
          operators,
          unchangedObservedOutcomes:
            Identity.dataHash(outcome) ===
            Identity.dataHash({
              failures: old.operators.failures,
              backward: old.operators.backward,
            }),
          timing: {
            assemblyMs: assembled - began,
            constructionMs: constructed - assembled,
            sourceMs: sourced - constructed,
            operatorsMs: operatorEnd - sourced,
            totalMs: performance.now() - began,
          },
          limits: [
            "no full skin mesh, closed traces, trims/fills or shape acceptance",
            "common scale passing is not local iteration convergence; local exhaustion is not geometric impossibility",
            "bounded seed failure does not prove no crossing",
            "physical source2 uses station mm and phase radians; ribbons use a normalized cross parameter",
            "whole-ring kept bounds and raw proxy sites retain their original separate scope",
          ],
        };
        await fs.writeFile(
          path.join(output, plan.id + ".json"),
          JSON.stringify(receipt),
          { flag: "wx" },
        );
        summary.push({
          id: plan.id,
          fieldsHash,
          sourceCount: sources.size,
          sourceFailures: failures,
          operatorFailures: operators.failures,
          backward: operators.backward,
          unchangedObservedOutcomes: receipt.unchangedObservedOutcomes,
          bandEvents: events.length,
          seedEvents: seeds.length,
          seedQueries: queries.length,
          timing: receipt.timing,
        });
      } catch (error: unknown) {
        const failed: { id: string; unavailable: string } = {
          id: plan.id,
          unavailable: error instanceof Error ? error.message : String(error),
        };
        summary.push(failed);
        await fs.writeFile(
          path.join(output, plan.id + ".json"),
          JSON.stringify(failed),
          { flag: "wx" },
        );
      }
      process.stdout.write(JSON.stringify(summary.at(-1)) + "\n");
    }
    await fs.writeFile(
      path.join(output, "root-inputs.json"),
      JSON.stringify({
        schema: "f1-native-root-input-round/v1",
        created: new Date().toISOString(),
        provenance,
        calibration: prepared.calibration,
        bones: bones.size,
        cases: summary,
        totalMs: performance.now() - started,
        acceptance: "none; observations for the complete next cause batch",
      }),
      { flag: "wx" },
    );
  }
}
void FamilyConicNativeRootInputs.main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
