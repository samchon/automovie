import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";
import { FamilyConicCaseSelection as Selection } from "./FamilyConicCaseSelection";
import { FamilyConicNativeControls as Control } from "./FamilyConicNativeControls";
import { FamilyConicNativePremises } from "./FamilyConicNativePremises";
import {
  FamilyConicNativeRootObservations as Observation,
} from "./FamilyConicNativeRootObservations";
import {
  AutoMovieConstructionAdmission,
  AutoMovieSolidChain,
  AutoMovieViewLoft,
  bracketedRoot,
  pointInPlanarRing,
} from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as Loft,
  AutoMovieHumanF1 as Figure,
  AutoMovieHumanF1Engineering as Engineering,
  AutoMovieHumanF1NativeLaw as Law,
  AutoMovieHumanF1NativeTape,
  AutoMovieHumanNativeCalipers as Calipers,
  AutoMovieHumanSegmentFrame as Frame,
} from "@automovie/human";
import type {
  IAutoMovieHumanF1,
  IAutoMovieHumanF1Engineering,
  IAutoMovieHumanF1NativeLaw,
  IAutoMovieLoftChain,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
} from "@automovie/interface";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * One authored-F1 engineering inspection round, without whole-skin realization.
 * Run an esbuild CJS bundle with --out=<absolute new human/.shots directory>.
 * The separate existing FamilyConicOwnership invocation compares the immutable
 * pre-change receipt; this producer compares the same native builder with independent ordinary originals,
 * all supplied-field sites, actual full-source operators and every band column.
 */
namespace FamilyConicNativeRound {
  const differences = Control.differences;
  /** A complete actual source with its relieved world differential reader. */
  interface Source {
    part: IAutoMovieViewPart;
    chain: IAutoMovieLoftChain;
    surface: IAutoMovieSolidSurface;
  }
  const ORDERS: readonly (keyof IAutoMovieSolidSurface.IJet)[] = [
    "p",
    "u",
    "v",
    "uu",
    "uv",
    "vv",
  ];
  /** Exact JSON/byte fingerprint; no rounded geometry comparison. */
  const hash = Identity.byteHash;
  /** Actual world2, with no zero or finite-difference replacement. */
  function jet(
    surface: IAutoMovieSolidSurface,
    s: number,
    t: number,
  ): IAutoMovieSolidSurface.IJet | { unavailable: string } {
    try {
      const j = surface.jet(s, t);
      if (!ORDERS.every((key): boolean => j[key].every(Number.isFinite)))
        throw new Error("nonfinite full source2");
      return j;
    } catch (error: unknown) {
      return {
        unavailable: error instanceof Error ? error.message : String(error),
      };
    }
  }
  /** Generation hashes exclude capture code and every private/reference asset. */
  async function sourceHashes(root: string): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    const walk = async (directory: string): Promise<void> => {
      for (const entry of (
        await fs.readdir(directory, { withFileTypes: true })
      ).sort((a, b): number => a.name.localeCompare(b.name))) {
        const file = path.join(directory, entry.name);
        if (entry.isDirectory()) await walk(file);
        else if (entry.name.endsWith(".ts"))
          result[path.relative(root, file).replaceAll("\\", "/")] = hash(
            await fs.readFile(file),
          );
      }
    };
    for (const directory of [
      "packages/human/src",
      "packages/engine/src",
      "packages/interface/src",
    ])
      await walk(path.join(root, directory));
    for (const relative of [
      "package.json",
      "pnpm-lock.yaml",
      "packages/human/package.json",
      "packages/engine/package.json",
      "packages/interface/package.json",
      "packages/human/tsconfig.json",
      "packages/engine/tsconfig.json",
      "packages/interface/tsconfig.json",
    ]) {
      try {
        result[relative] = hash(await fs.readFile(path.join(root, relative)));
      } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    return result;
  }
  /** Every requested caliper uses its actual retained logical source and exact material proxy site. */
  function sites(
    fields: IAutoMovieHumanF1NativeLaw.IFields,
    assembly: IAutoMovieHumanF1.IAssembly,
    parts: ReadonlyMap<string, IAutoMovieViewPart>,
    kept: Record<string, readonly [number, number]>,
  ): Record<string, unknown>[] {
    const requests: {
      field: string;
      name: string;
      station: number;
      target: IAutoMovieHumanF1NativeLaw.ISize;
    }[] = [];
    for (const [field, station] of [
      ["hipSkin", 104],
      ["omphalionWall", 268.6],
      ["underbustWall", 427.69],
      ["bustWall", 475.16],
      ["neckSkin", 690.26],
      ["headSkin", 792],
    ] as const)
      requests.push({
        field: "wall." + field,
        name: assembly.body.trunk.name,
        station,
        target: fields.wall[field],
      });
    for (const [field, distance] of [
      ["arm", 10],
      ["leg", 6],
      ["breast", 1],
      ["nose", 1.5],
    ] as const)
      requests.push({
        field: "roots." + field,
        name: assembly.body[field].name,
        station:
          assembly.reference(assembly.body[field].name).knots[0]! + distance,
        target: fields.roots[field],
      });
    for (const [field, station] of [
      ["upperArm", 130.032],
      ["elbow", 262.989],
      ["forearm", 312.989],
      ["wrist", 504.881],
    ] as const)
      requests.push({
        field: "arm." + field,
        name:
          field === "wrist" ? assembly.body.hand.name : assembly.body.arm.name,
        station,
        target: fields.arm[field],
      });
    for (const [field, station] of [
      ["knee", 438.512],
      ["calf", 563.512],
      ["ankle", 794.035],
    ] as const)
      requests.push({
        field: "leg." + field,
        name: assembly.body.leg.name,
        station,
        target: fields.leg[field],
      });
    requests.push(
      {
        field: "extremities.hand",
        name: assembly.body.hand.name,
        station: 540,
        target: fields.extremities.hand,
      },
      {
        field: "extremities.foot",
        name: assembly.body.leg.name,
        station: 948,
        target: fields.extremities.foot,
      },
    );
    for (const [field, limb] of [
      ["finger", "arm"],
      ["toe", "leg"],
    ] as const) {
      const digit = assembly.digits.find(
        (candidate): boolean => candidate.limb === limb && candidate.knuckle,
      );
      if (digit === undefined)
        throw new Error("named authored digit root absent");
      requests.push({
        field: "extremities." + field,
        name: digit.family.name,
        station: assembly.reference(digit.family.name).knots[0]!,
        target: fields.extremities[field],
      });
    }
    const rows: Record<string, unknown>[] = requests.flatMap((request): Record<string, unknown>[] =>
      [request.name, request.name + ".mirror"]
        .filter((name): boolean => parts.has(name))
        .map((name): Record<string, unknown> => {
          const source = parts.get(name)!;
          const domain = kept[name] ?? [
            source.stations[0]!,
            source.stations.at(-1)!,
          ];
          try {
            const actual = Calipers.read(
              source,
              request.station,
            );
            return {
              ...request,
              name,
              actual,
              signed: {
                depth: actual.depth - request.target.depth,
                breadth: actual.breadth - request.target.breadth,
              },
              scalarAddresses: (["depth", "breadth"] as const).map(
                (coordinate) => ({
                  field: request.field + "." + coordinate,
                  target: request.target[coordinate],
                  actual: actual[coordinate],
                  signed: actual[coordinate] - request.target[coordinate],
                  unit: "mm",
                }),
              ),
              rawSourceDomain: [source.stations[0], source.stations.at(-1)],
              wholeRingKeptDomain: domain,
              wholeRingKept:
                request.station >= domain[0] && request.station <= domain[1],
              scope:
                "bare native caliper at named P material site; post-rail visibility is separate; never clinical pulp/metacarpal",
            };
          } catch (error: unknown) {
            return {
              ...request,
              name,
              unavailable:
                error instanceof Error ? error.message : String(error),
            };
          }
        }),
    );
    const pelvis = assembly.frames.get("pelvis"),
      femur = assembly.frames.get("femur");
    if (pelvis === undefined || femur === undefined)
      rows.push({
        field: "hipJointCentreBreadth",
        target: fields.hipJointCentreBreadth,
        unavailable: "actual pelvis/femur support frames absent",
        unit: "mm",
      });
    else {
      const local = Frame.toLocal(pelvis, femur.origin),
        actual: number = 2 * local[2];
      rows.push({
        field: "hipJointCentreBreadth",
        target: fields.hipJointCentreBreadth,
        actual,
        signed: actual - fields.hipJointCentreBreadth,
        storedSideLocal: local,
        unit: "mm",
        scope:
          "synthetic support calibration P; fixed median-frame signed half-span/twin relation, not clinical HJC breadth",
      });
    }
    const breast = parts.get(assembly.body.breast.name);
    if (breast === undefined)
      rows.push({
        field: "breastProjection",
        target: fields.breastProjection,
        unavailable: "actual breast native source absent",
        unit: "mm",
      });
    else {
      const rail: number =
          assembly.reference(assembly.body.breast.name).knots[0]! + 1,
        pole: number = breast.stations.at(-1)!,
        materialSpan: number = pole - rail,
        axisRail = breast.axis.at(rail).origin,
        axisPole = breast.axis.at(pole).origin,
        chord: number = Math.hypot(...Frame.sub(axisPole, axisRail));
      rows.push({
        field: "breastProjection",
        target: fields.breastProjection,
        actual: chord,
        signed: chord - fields.breastProjection,
        materialSpan,
        rail,
        poleStation: pole,
        axisRail,
        axisPole,
        straightCourseChord: chord,
        signedStraightCourseChord: chord - fields.breastProjection,
        unit: "mm",
        scope:
          "physical world projection is the axis rail-to-pole distance; source-native material span, cap parameter and pole remain fixed",
      });
    }
    return rows;
  }
  /** Finite full-skin parent-plane containment, explicitly distinct from a whole-volume certificate. */
  function support(assembly: IAutoMovieHumanF1.IAssembly, source: Source): unknown {
    const joint = assembly.frames.get("femur");
    if (joint === undefined)
      return { unavailable: "support proxy frame absent" };
    const y: number = joint.origin[1],
      domain = source.surface.domain ?? [
        source.chain.layers[0]!.y,
        source.chain.layers.at(-1)!.y,
      ];
    const ring: { x: number; y: number }[] = [],
      roots: number[] = [];
    for (let k: number = 0; k < 128; k++) {
      const phase: number = (2 * Math.PI * k) / 128,
        found: number[] = [];
      for (let j: number = 0; j < 128; j++) {
        const a: number = domain[0] + ((domain[1] - domain[0]) * j) / 128,
          b: number = domain[0] + ((domain[1] - domain[0]) * (j + 1)) / 128;
        let fa: number, fb: number;
        try {
          fa = source.surface.jet(a, phase).p[1] - y;
          fb = source.surface.jet(b, phase).p[1] - y;
        } catch {
          continue;
        }
        if (fa * fb > 0) continue;
        const s: number =
          fa === 0
            ? a
            : fb === 0
              ? b
              : bracketedRoot(
                  (station: number): number =>
                    source.surface.jet(station, phase).p[1] - y,
                  a,
                  b,
                  1e-7,
                  40,
                );
        if (!found.some((prior: number): boolean => Math.abs(prior - s) < 1e-6))
          found.push(s);
      }
      if (found.length !== 1)
        return {
          unavailable:
            "actual parent full-skin plane has " +
            found.length +
            " sampled crossings at phase " +
            phase,
          owner: assembly.body.trunk.name,
          domain,
          joint: joint.origin,
        };
      roots.push(found[0]!);
      const p = source.surface.jet(found[0]!, phase).p;
      ring.push({ x: p[0], y: p[2] });
    }
    return {
      owner: assembly.body.trunk.name,
      joint: joint.origin,
      domain,
      planeY: y,
      crossingStations: roots,
      inside: pointInPlanarRing(
        { x: joint.origin[0], y: joint.origin[2] },
        ring,
      ),
      ring,
      qualification:
        "finite128-phase complete-source plane observation; no clinical HJC or continuous whole-volume containment certificate",
    };
  }
  /** Execute the planned field/source/operator round; failures stay per case and never trigger tuning. */
  export async function main(): Promise<void> {
    const output = process.argv
      .find((argument: string): boolean => argument.startsWith("--out="))
      ?.slice(6);
    const root = path.resolve(
      process.cwd(),
      process.cwd().endsWith("test") ? ".." : ".",
    );
    // `--manifest`, run once right after the bundles are built and copied: record beside this bundle the source
    // digests as they are at build and the digest of every bundle of the set. Later stages read that record.
    const manifestPath: string = path.join(path.dirname(path.resolve(process.argv[1]!)), "bundles.json");
    if (process.argv.includes("--manifest")) {
      const directory: string = path.dirname(manifestPath);
      const bundles: Record<string, string> = {};
      for (const name of (await fs.readdir(directory)).sort((a: string, b: string): number => a.localeCompare(b)))
        if (name.endsWith(".cjs")) bundles[name] = hash(await fs.readFile(path.join(directory, name)));
      await fs.writeFile(
        manifestPath,
        JSON.stringify({
          schema: "f1-round-bundles/v1",
          created: new Date().toISOString(),
          scope: "source digests read once at build; every stage of the round binds to these bundle digests",
          sourceHashes: await sourceHashes(root),
          bundles,
        }),
        { flag: "wx" },
      );
      process.stdout.write(JSON.stringify({ manifest: manifestPath, bundles: Object.keys(bundles).length }) + "\n");
      return;
    }
    const manifest: { schema: string; sourceHashes: Record<string, string>; bundles: Record<string, string> } =
      JSON.parse(await fs.readFile(manifestPath, "utf8").catch((): never => {
        throw new Error("Round bundle manifest is absent beside this bundle: run it once with --manifest after the build");
      }));
    if (manifest.schema !== "f1-round-bundles/v1")
      throw new Error("Unsupported round bundle manifest schema");
    Selection.sourcePaths(manifest.sourceHashes);
    if (
      output === undefined ||
      !path.isAbsolute(output) ||
      !path
        .resolve(output)
        .toLowerCase()
        .startsWith(
          (path.join(root, "packages/human/.shots") + path.sep).toLowerCase(),
        )
    )
      throw new Error(
        "new absolute --out under packages/human/.shots required",
      );
    await fs.mkdir(output, { recursive: true });
    const inventoryPath = path.join(
      root,
      "test/.shots/family-conic-inventory/2026-11-14T17-03-28.244Z/inventory.json",
    );
    const inventoryBytes = await fs.readFile(inventoryPath),
      inventory = JSON.parse(inventoryBytes.toString()) as {
        rows: Control.IRow[];
      };
    const baselinePath = path.join(
      root,
      "packages/human/.shots/ownership-20261116/before.json",
    );
    const baselineBytes = await fs.readFile(baselinePath),
      acceptedReceipt = JSON.parse(baselineBytes.toString()) as {
        payload: string;
        sha256: string;
      };
    const ownershipPath = process.argv
      .find((argument: string): boolean => argument.startsWith("--ownership="))
      ?.slice(12);
    if (ownershipPath === undefined || !path.isAbsolute(ownershipPath))
      throw new Error(
        "--ownership must name the existing producer's actual same-generation comparison receipt",
      );
    const ownershipBytes = await fs.readFile(ownershipPath),
      ownership = JSON.parse(ownershipBytes.toString()) as {
        payload: string;
        sha256: string;
        bundle: { file: string; sha256: string };
        sources: { file: string; sha256: string }[];
      };
    if (
      hash(acceptedReceipt.payload) !== acceptedReceipt.sha256 ||
      hash(ownership.payload) !== ownership.sha256
    )
      throw new Error("immutable ownership payload digest mismatch");
    // Every stage runs from a bundle, a frozen snapshot of the sources, so the round is bound by its bundle set and
    // the working tree is not read again: this stage and the Ownership receipt must both come from the recorded set.
    Selection.bundle(manifest.bundles, {
      name: path.basename(process.argv[1]!),
      sha256: hash(await fs.readFile(process.argv[1]!)),
    });
    Selection.bundle(manifest.bundles, {
      name: "FamilyConicOwnership.cjs",
      sha256: ownership.bundle.sha256,
    });
    const generationHashes: Record<string, string> = manifest.sourceHashes;
    const ownershipComparison = {
      path: path.resolve(ownershipPath),
      sha256: hash(ownershipBytes),
      bundle: ownership.bundle,
      baseline: {
        path: baselinePath,
        sha256: hash(baselineBytes),
        payloadHash: acceptedReceipt.sha256,
      },
      actualPayloadHash: ownership.sha256,
      actualPayloadIdentical: acceptedReceipt.payload === ownership.payload,
      scope:
        "existing Ownership producer's original bare source/AST/readings; function-body provenance is not a numeric geometry residual",
      sourceHashScope:
        "same maintained Human generation and engine construction subset as the actual Ownership receipt; this round additionally records all Human/engine/interface source inputs",
    };
    const accepted = JSON.parse(acceptedReceipt.payload) as {
      root: unknown;
      fills: unknown;
    };
    const started: number = performance.now(),
      original = Figure.assemble(),
      framesPrepared: number = performance.now(),
      originalConstruction = Figure.constructionFrom(original),
      originals = originalConstruction.sources,
      bankPrepared: number = performance.now();
    const preparation = Law.prepare(original, originals),
      base = preparation.fields,
      calibrationMs: number = preparation.calibration.milliseconds;
    const measurements: unknown[] = [],
      baseHash = Identity.dataHash(base);
    const measure = (fields: IAutoMovieHumanF1NativeLaw.IFields): IAutoMovieHumanF1Engineering.IReading => {
      const began: number = performance.now(),
        identity: boolean = Identity.dataHash(fields) === baseHash;
      const families = identity
        ? { trunk: original.body.trunk, breast: original.body.breast }
        : preparation.tapeFamilies({
            wall: fields.wall,
            roots: { arm: fields.roots.arm, breast: fields.roots.breast },
            breastProjection: fields.breastProjection,
          });
      const prepared: number = performance.now();
      const part = (name: "trunk" | "breast"): IAutoMovieViewPart =>
        identity
          ? originals.get(original.body[name].name)!
          : Loft.part(
              { ...families[name], turn: undefined },
              originals.get(original.body[name].name)!.stations,
            );
      const parts = { trunk: part("trunk"), breast: part("breast") },
        generated: number = performance.now();
      let counts: unknown;
      const result = AutoMovieHumanF1NativeTape.read(
        parts,
        Identity.dataHash(fields),
        128,
        (actual): void => {
          counts = actual;
        },
      );
      measurements.push({
        fields: Identity.dataHash(fields),
        identity,
        controlPreparationMs: prepared - began,
        nativeSourceMs: generated - prepared,
        bareTapeMs: performance.now() - generated,
        totalMs: performance.now() - began,
        candidateFamilies: identity ? 0 : 2,
        candidateOtherFamilies: 0,
        nativeAdapters: 2,
        counts,
        scope:
          "same trunk/breast builders as full generation; bare native tape, finite128phase/65station apex and plane roots; no other candidate families or whole skin",
      });
      return result;
    };
    let baseline: IAutoMovieHumanF1Engineering.IReading | null = null,
      baselineFailure: string | null = null;
    try {
      baseline = measure(base);
    } catch (error: unknown) {
      baselineFailure = error instanceof Error ? error.message : String(error);
    }
    const cases = Engineering.resolve(base, baseline, measure, 0.25);
    const catalog = {
      schema: "f1-native-cases/v1",
      sourceHashes: generationHashes,
      cases,
      bundles: manifest.bundles,
    };
    await fs.writeFile(
      path.join(output, "cases.json"),
      JSON.stringify(catalog),
      { flag: "wx" },
    );
    const baselineSources: Map<string, Source> = new Map(),
      baselineSourceFailures: { owner: string; detail: string }[] = [],
      summary: unknown[] = [];
    const baselineStarted: number = performance.now();
    for (const [name, part] of originalConstruction.sources) {
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
          throw new Error(
            "independent ordinary original full source unavailable",
          );
        baselineSources.set(name, { part, chain, surface });
      } catch (error: unknown) {
        baselineSourceFailures.push({
          owner: name,
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const baselineSourceFactoryMs: number = performance.now() - baselineStarted;
    const plans = cases.map((item) => ({
      id: item.id,
      fields: item.fields,
      status: item.resolution.status,
    }));
    for (const plan of plans) {
      if (plan.status !== "resolved") {
        summary.push({
          id: plan.id,
          status: "input-unresolved; no shape claim",
        });
        continue;
      }
      try {
        const start: number = performance.now(),
          failures: { owner: string; detail: string }[] = [];
        // The production owner composes the person's skeleton from every field it reads (lengths, hip support).
        const assembly: IAutoMovieHumanF1.IAssembly = Figure.nativeFrom(plan.fields, preparation);
        const made: number = performance.now(),
          declared = Figure.constructionFrom(assembly),
          constructed: number = performance.now();
        try {
          AutoMovieConstructionAdmission.admit(declared.root);
        } catch (error: unknown) {
          failures.push({
            owner: "tree admission",
            detail: error instanceof Error ? error.message : String(error),
          });
        }
        const sources = new Map<string, Source>(),
          sourceRows: unknown[] = [];
        for (const [name, part] of declared.sources) {
          try {
            const raw = AutoMovieViewLoft.create(part);
            if (raw.chain === null)
              throw new Error(JSON.stringify(raw.diagnostics));
            const chain = AutoMovieSolidChain.framed(raw.chain),
              surface = AutoMovieSolidChain.surface(chain);
            if (surface === null)
              throw new Error("actual relieved source2 unavailable");
            const source = { part, chain, surface };
            sources.set(name, source);
            const old = baselineSources.get(name),
              lo: number = chain.layers[0]!.y,
              hi: number = chain.layers.at(-1)!.y;
            const readings = [0.1, 0.25, 0.5, 0.75, 0.9].flatMap(
              (share: number) =>
                Array.from({ length: 8 }, (_, k: number) => {
                  const s: number = lo + (hi - lo) * share,
                    t: number = (2 * Math.PI * k) / 8,
                    actual = jet(surface, s, t),
                    before = old === undefined ? null : jet(old.surface, s, t);
                  return {
                    s,
                    t,
                    actual,
                    baseline: before,
                    signed:
                      before === null
                        ? null
                        : differences(
                            actual,
                            before,
                            name + ".world2[" + s + "," + t + "]",
                          ),
                  };
                }),
            );
            const { axis: unusedAxis, ...parameters } = part;
            void unusedAxis;
            sourceRows.push({
              name,
              scope: "actual full relieved source",
              domain: surface.domain,
              pole: chain.pole ?? null,
              diagnostics: raw.diagnostics,
              parameterHash: hash(JSON.stringify(parameters)),
              axis2: readings.map(({ s }) => ({
                s,
                value: part.axis.at(s),
                actual2: part.axis.jet?.(s) ?? {
                  unavailable: "actual native axis2 unavailable",
                },
              })),
              readings,
            });
          } catch (error: unknown) {
            failures.push({
              owner: name,
              detail: error instanceof Error ? error.message : String(error),
            });
          }
        }
        const sourceEnd: number = performance.now(),
          observation: Observation.IObservation = Observation.create();
        const premises: ReturnType<typeof FamilyConicNativePremises> =
            FamilyConicNativePremises(
              declared.root,
              sources,
              observation.hooks,
            ),
          operatorEnd: number = performance.now();
        const trunk = sources.get(assembly.body.trunk.name),
          joint =
            trunk === undefined
              ? { unavailable: "actual parent trunk surface absent" }
              : support(assembly, trunk);
        const rootControls: unknown[] = [
          ...(assembly.nativePorts?.entries() ?? []),
        ].map(([name, spec]): unknown => {
          const final: IAutoMovieViewPart | undefined =
            declared.sources.get(name);
          const prepared = observation.actualBands.find(
            (entry): boolean =>
              entry.owner === "band." + name && entry.event.kind === "prepared",
          );
          const pairing =
            prepared !== undefined && prepared.event.kind === "prepared"
              ? prepared.event
              : null;
          const actualPairing: unknown[] = spec.rows.map(
            (row, k: number): unknown => {
              if (pairing === null || pairing.columns[k] === undefined)
                return {
                  column: k,
                  sourceClock: row.sourceClock,
                  unavailable:
                    "actual prepared operator pairing absent; candidate target is separate",
                };
              const column = pairing.columns[k]!,
                phase: number = pairing.childPhases[k]!,
                difference: number = phase - row.targetChildAddress[1];
              const eC = Frame.sub(column.start.point, row.targetParent),
                eQ = Frame.sub(column.end.point, row.targetChild);
              return {
                column: k,
                sourceClock: row.sourceClock,
                targetChildAddress: row.targetChildAddress,
                actualChildPhase: phase,
                phaseResidualRad:
                  difference -
                  2 * Math.PI * Math.round(difference / (2 * Math.PI)),
                actualHost: column.start.point,
                actualChild: column.end.point,
                issuedCurveResidualMm: {
                  parent: Frame.sub(column.start.point, row.actualParent),
                  child: Frame.sub(column.end.point, row.actualChild),
                },
                residualQualification:
                  "issuedCurveResidualMm compares actual producer/operator curves; finalOperatorResidualMm below is retained only as the discarded affine-target diagnostic",
                sourceMembership: row.level,
                finalOperatorResidualMm: {
                  eC,
                  eQ,
                  pairedGap: Frame.sub(eQ, eC),
                },
                units:
                  "points/residuals mm; operator first/second ribbon vectors remain normalized-cross derivatives in actualBands, not physical source2",
              };
            },
          );
          return {
            name,
            loop: spec.loop,
            railStations: spec.railStations,
            railDistances: spec.railDistances,
            range: spec.range,
            qualification: spec.qualification,
            unchangedLocalControls: spec.unchanged,
            sourceMembership: spec.rows.map((row): unknown => row.level),
            discardedAffineTargetPairCandidate: spec.rows,
            finalSource:
              final === undefined
                ? { unavailable: "actual final source absent" }
                : spec.inspect(final),
            actualPairing,
          };
        });
        const operatorObservation = {
          id: plan.id,
          fields: plan.fields,
          fieldsHash: Identity.dataHash(plan.fields),
          sourceHashes: generationHashes,
          actualBands: observation.actualBands,
          actualSeams: observation.actualSeams,
          actualAxillaSeedEvents: observation.actualAxillaSeedEvents,
          actualAxillaQueries: observation.actualAxillaQueries,
        };
        const observationPath: string = path.join(
            output,
            plan.id + ".operator-inputs.json",
          ),
          observationBytes: string = JSON.stringify(operatorObservation);
        await fs.writeFile(observationPath, observationBytes, { flag: "wx" });
        const operatorInputObservation = {
          file: path.relative(root, observationPath).replaceAll("\\", "/"),
          sha256: Identity.byteHash(observationBytes),
        };
        const fieldSites: Record<string, unknown>[] = sites(
          plan.fields, assembly, declared.sources, premises.keptDomains,
        );
        const projectionObservation: Record<string, unknown> | undefined = fieldSites.find(
          (row: Record<string, unknown>): boolean => row.field === "breastProjection",
        );
        const report = {
          id: plan.id,
          fields: plan.fields,
          fieldsHash: Identity.dataHash(plan.fields),
          sourceHashes: generationHashes,
          nativeEntry:
            "same prepared native builder for every case; independent ordinary original source bank",
          operatorInputObservation,
          rootControls,
          nativeSeedControls: [
            ...(assembly.nativeSeedControls?.entries() ?? []),
          ],
          failures,
          controls: Control.read(assembly, original, inventory.rows),
          constantConsumerRows: differences(
            { root: declared.root, fills: declared.fills },
            { root: accepted.root, fills: accepted.fills },
            "accepted.rootAndFills",
          ),
          ownershipComparison,
          fieldSites,
          supportParentPlane: joint,
          projection: projectionObservation,
          rootAndFills: { root: declared.root, fills: declared.fills },
          sourceRows,
          operators: premises,
          memory: process.memoryUsage(),
          timing: {
            assemblyMs: made - start,
            constructionAndSamplingMs: constructed - made,
            fullSourceFactoryMs: sourceEnd - constructed,
            operatorsMs: operatorEnd - sourceEnd,
            totalMs: performance.now() - start,
          },
          limits: [
            "finite source/function/field checks are not whole-domain or anatomy acceptance",
            "full closed joins/trims/fills and final mesh three-pass/reference inspection remain gated",
            "original immutable receipt comparison belongs to the existing Ownership producer in this same round",
            "raw numeric controls are not independent DOF; semantic and identifiability ledger remains maintained in provisional-conic-control-laws.md",
          ],
        };
        await fs.writeFile(
          path.join(output, plan.id + ".json"),
          JSON.stringify(report),
          { flag: "wx" },
        );
        await fs.writeFile(
          path.join(output, plan.id + ".preflight.json"),
          JSON.stringify(report),
          { flag: "wx" },
        );
        summary.push({
          id: plan.id,
          sources: sources.size,
          failures,
          operatorFailures: premises.failures,
          backward: premises.backward,
          timing: report.timing,
        });
        process.stdout.write(JSON.stringify(summary.at(-1)) + "\n");
      } catch (error: unknown) {
        const unavailable: string =
          error instanceof Error ? error.message : String(error);
        const identity = {
          id: plan.id,
          fields: plan.fields,
          fieldsHash: Identity.dataHash(plan.fields),
          sourceHashes: generationHashes,
        };
        const observationPath: string = path.join(
            output,
            plan.id + ".operator-inputs.json",
          ),
          observationBytes: string = JSON.stringify({
            ...identity,
            actualBands: [],
            actualSeams: [],
            unavailable,
            scope:
              "source admission failed before operator preparation; empty observations are unavailable, never a zero-backward pass",
          });
        await fs.writeFile(observationPath, observationBytes, { flag: "wx" });
        const failure = {
          ...identity,
          unavailable,
          operatorInputObservation: {
            file: path.relative(root, observationPath).replaceAll("\\", "/"),
            sha256: Identity.byteHash(observationBytes),
          },
          scope:
            "actual assembly/construction entry failed; remaining cases continue; no source/operator/shape acceptance",
        };
        await fs.writeFile(
          path.join(output, plan.id + ".json"),
          JSON.stringify(failure),
          { flag: "wx" },
        );
        await fs.writeFile(
          path.join(output, plan.id + ".preflight.json"),
          JSON.stringify(failure),
          { flag: "wx" },
        );
        summary.push(failure);
        process.stdout.write(JSON.stringify(failure) + "\n");
      }
    }
    const bundle = process.argv[1]!;
    await fs.writeFile(
      path.join(output, "round.json"),
      JSON.stringify({
        schema: "f1-native-round/v1",
        created: new Date().toISOString(),
        sourceHashScope: [
          "all TypeScript under packages/{human,engine,interface}/src",
          "existing root/package dependency and tsconfig inputs; capture/producer excluded",
          "read once at build into bundles.json beside the bundles; stages bind to the bundle digests, not the working tree",
        ],
        sourceHashes: generationHashes,
        bundles: manifest.bundles,
        producer: {
          collector: {
            file: "test/src/reference-conics/FamilyConicNativeRootObservations.ts",
            sha256: hash(
              await fs.readFile(
                path.join(
                  root,
                  "test/src/reference-conics/FamilyConicNativeRootObservations.ts",
                ),
              ),
            ),
          },
          file: "test/src/reference-conics/FamilyConicNativeRound.ts",
          sha256: hash(
            await fs.readFile(
              path.join(
                root,
                "test/src/reference-conics/FamilyConicNativeRound.ts",
              ),
            ),
          ),
          bundle: path.resolve(bundle),
          bundleHash: hash(await fs.readFile(bundle)),
        },
        ownershipComparison,
        inventory: {
          file: inventoryPath,
          sha256: hash(inventoryBytes),
          meaning: "original row metadata, not a new DOF count",
        },
        existingInventoryProducer:
          "test/src/reference-conics/FamilyConicInventory.ts",
        baseline,
        baselineFailure,
        originalPreparation: {
          framesMs: framesPrepared - started,
          bankAndSamplingMs: bankPrepared - framesPrepared,
        },
        calibration: preparation.calibration,
        calibrationMs,
        baselineSourceFactoryMs,
        baselineSourceFailures,
        baselineSources: baselineSources.size,
        bonePreparations: plans.length,
        measurements,
        cases: summary,
        totalMs: performance.now() - started,
        acceptance:
          "preflight evidence only; no shape, population or CI acceptance",
      }),
      { flag: "wx" },
    );
    process.stdout.write(
      JSON.stringify({
        output,
        cases: summary.length,
        totalMs: performance.now() - started,
      }) + "\n",
    );
  }
}
void FamilyConicNativeRound.main().catch((error: unknown): void => {
  console.error(error);
  process.exitCode = 1;
});
