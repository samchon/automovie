import type { FamilyConicCaptureInput as Input } from "./FamilyConicCaptureInput";
import { FamilyConicOriginalCatalog as Original } from "./FamilyConicOriginalCatalog";
import type { FamilyConicSourceCapture as Source } from "./FamilyConicSourceCapture";
import { AutoMovieHumanConicLoft as H } from "@automovie/human";
import { AutoMovieHumanF1 as F1 } from "@automovie/human/capture";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** Original source discovery and preparation for one admitted capture invocation. */
export namespace FamilyConicSourcePreparation {
  /** Borrow the unchanged public capture-state declaration. */
  type IState = Source.IState;

  /**
   * Observe actual source factories before any whole-tree or physical2 admission.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Existing original factories and source readers are delegated to Original.create before any whole-tree realization.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared original-catalog call returns the evidence.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source2, geometry reconstruction or final-skin fallback is introduced.
   * @evidence contracts/development/implementation.md#efficient-algorithms The catalog cost is driven by factories, controls, knots and bounded guide samples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same Original owner serves direct and prepared source consumers.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned one-case catalog owns its observed arrays; no cross-case cache exists.
   * @evidence contracts/development/common.md#meaningful-documentation The comment states source-factory observation before physical2 admission.
   */
  export function observe(
    entries: readonly Original.IEntry[],
  ): Original.IResult {
    return Original.create(entries);
  }

  /** Clone the requested actual factory relief scope, preserving every global and original family. */
  function bare(
    assembly: IAutoMovieHumanF1.IAssembly,
    names: readonly string[],
  ): IAutoMovieHumanF1.IAssembly {
    if (names.length === 0) return assembly;
    const found: Set<string> = new Set();
    const family: (source: IAutoMovieHumanConicLoft.IFamily) => IAutoMovieHumanConicLoft.IFamily = (
      source: IAutoMovieHumanConicLoft.IFamily,
    ): IAutoMovieHumanConicLoft.IFamily => {
      if (source.reliefs === undefined) return source;
      const reliefs: NonNullable<IAutoMovieHumanConicLoft.IFamily["reliefs"]> = source.reliefs.filter(
        (feature: NonNullable<IAutoMovieHumanConicLoft.IFamily["reliefs"]>[number]): boolean => {
          if (!names.includes(feature.name)) return true;
          found.add(feature.name);
          return false;
        },
      );
      return reliefs.length === source.reliefs.length
        ? source
        : { ...source, reliefs };
    };
    const body: typeof assembly.body = {
      trunk: family(assembly.body.trunk),
      arm: family(assembly.body.arm),
      hand: family(assembly.body.hand),
      leg: family(assembly.body.leg),
      ear: family(assembly.body.ear),
      nose: family(assembly.body.nose),
      breast: family(assembly.body.breast),
    };
    const digits: IAutoMovieHumanF1.IDigit[] = assembly.digits.map(
      (digit: IAutoMovieHumanF1.IDigit): IAutoMovieHumanF1.IDigit => ({
        ...digit,
        family: family(digit.family),
      }),
    );
    const helix: IAutoMovieHumanConicLoft.IFamily = family(assembly.helix);
    const antihelix: IAutoMovieHumanConicLoft.IFamily = family(assembly.antihelix);
    const axilla: IAutoMovieHumanConicLoft.IFamily = family(assembly.axilla);
    const concha: IAutoMovieHumanConicLoft.IFamily = family(assembly.concha);
    const nostril: IAutoMovieHumanConicLoft.IFamily = family(assembly.nostril);
    const missing: string[] = names.filter(
      (name: string): boolean => !found.has(name),
    );
    if (missing.length > 0)
      throw new Error(
        "Bare factory selection is absent: " + missing.join(", "),
      );
    return {
      ...assembly,
      body,
      digits,
      helix,
      antihelix,
      axilla,
      concha,
      nostril,
      families: [
        ...Object.values(body),
        helix,
        antihelix,
        ...digits.map((digit: IAutoMovieHumanF1.IDigit): IAutoMovieHumanConicLoft.IFamily => digit.family),
        axilla,
        concha,
        nostril,
      ],
    };
  }

  /**
   * Prepare the exact selected fields once, then inspect original factories before tree/mesh admission.
   * Existing production family membership and native mirror factories own the two sides.
   * Raw cutter originals are explicitly before CUTTERS.cut; applied cutter/kept domains belong to the later construction source.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The exact admitted fields enter assembleNative once; the production sourceScope and native H.source callback own actual closure/domain while fixed authored counterparts are observed independently.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Invocation-scoped bare selection precedes declared member enumeration and the two original catalogs.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Global BODY and original families stay unchanged; official wallDomain is recorded separately without clamping cap-inclusive source stations, failed factories retain declared identities, and no ordinary-grid fallback case is created.
   * @evidence contracts/development/implementation.md#efficient-algorithms One assembly and per-family original reads dominate; explicit counters exclude hidden production internals.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same prepared assembly and original catalog are handed to constructionFrom by the full consumer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One case state owns assembly, catalogs and observations; no reference mesh, renderer or cross-case cache is acquired.
   * @evidence contracts/development/common.md#meaningful-documentation The comment and members distinguish actual factories, fixed authored evidence and diagnostic bare scope.
   */
  export function prepare(input: Input.IInput): IState {
    const before: NodeJS.MemoryUsage = process.memoryUsage();
    const started: number = performance.now();
    const round: string = new Date().toISOString().replaceAll(":", "-");
    const assembly: IAutoMovieHumanF1.IAssembly = bare(
      F1.assembleNative(input.selected.fields),
      input.bare,
    );
    const assemblyMs: number = performance.now() - started;
    const originalStarted: number = performance.now();
    const reads: IState["reads"] = {
      assembleNative: 1,
      actualFamilyFactory: 0,
      authoredFamilyFactory: 0,
    };
    const entries: Original.IEntry[] = [];
    const descriptors: Map<string, { mirrored: boolean; cutter: boolean }> =
      new Map();
    for (const item of F1.FAMILIES)
      descriptors.set(item.family.name, {
        mirrored: item.mirrored,
        cutter: false,
      });
    for (const item of F1.CUTTERS)
      descriptors.set(item.family.name, {
        mirrored: item.mirrored,
        cutter: true,
      });
    const sourceScopes: IState["sourceScopes"] = [];
    const preparationUnavailable: { id: string; cause: string }[] = [];
    const bodyKeys: Map<string, keyof IAutoMovieHumanF1.IAssembly["body"]> = new Map();
    for (const key of Object.keys(
      assembly.body,
    ) as (keyof IAutoMovieHumanF1.IAssembly["body"])[])
      bodyKeys.set(assembly.body[key].name, key);
    for (const family of assembly.families) {
      const descriptor: { mirrored: boolean; cutter: boolean } | undefined =
        descriptors.get(family.name);
      if (descriptor === undefined)
        throw new Error(
          "Actual original has no production member descriptor: " + family.name,
        );
      const bodyKey: keyof IAutoMovieHumanF1.IAssembly["body"] | undefined = bodyKeys.get(
        family.name,
      );
      const role: Original.IEntry["role"] = descriptor.cutter
        ? "cutter-family-original"
        : "family-original";
      let scope: ReturnType<typeof F1.sourceScope> | null | undefined;
      const active: () => IAutoMovieHumanConicLoft.IFamily = (): IAutoMovieHumanConicLoft.IFamily => {
        if (scope === undefined)
          scope =
            bodyKey === undefined ? null : F1.sourceScope(assembly, bodyKey);
        return scope?.family ?? family;
      };
      const fixed: (name?: string) => IAutoMovieViewPart = (
        name?: string,
      ): IAutoMovieViewPart => {
        reads.authoredFamilyFactory++;
        const reference: IAutoMovieHumanConicLoft.IFamily = assembly.reference(family.name);
        return H.source(
          name === undefined ? reference : H.mirror(reference, name),
        );
      };
      const read: (name?: string) => IAutoMovieViewPart = (
        name?: string,
      ): IAutoMovieViewPart => {
        reads.actualFamilyFactory++;
        const member: IAutoMovieHumanConicLoft.IFamily =
          name === undefined ? active() : H.mirror(active(), name);
        sourceScopes.push({
          id: member.name,
          owner:
            scope === null || scope === undefined
              ? "AutoMovieHumanConicLoft.source native canonical callback"
              : "AutoMovieHumanF1.sourceScope -> AutoMovieHumanConicLoft.source",
          wallDomain: scope?.wallDomain ?? null,
          tips: member.tips,
          phase: member.phase,
          turn: member.turn,
        });
        if (member.native === undefined)
          throw new Error(
            "Actual native canonical source is unavailable; an ordinary re-created sampling grid is not a production source fallback",
          );
        return H.source(member);
      };
      entries.push({
        id: family.name,
        role,
        family,
        read: (): IAutoMovieViewPart => read(),
        reference: (): IAutoMovieViewPart => fixed(),
      });
      if (descriptor.mirrored) {
        const name: string = family.name + ".mirror";
        let raw: IAutoMovieHumanConicLoft.IFamily | undefined;
        try {
          raw = H.mirror(family, name);
        } catch (error: unknown) {
          preparationUnavailable.push({
            id: name + "/raw-family-controls",
            cause: error instanceof Error ? error.message : String(error),
          });
        }
        entries.push({
          id: name,
          role,
          ...(raw === undefined ? {} : { family: raw }),
          read: (): IAutoMovieViewPart => read(name),
          reference: (): IAutoMovieViewPart => fixed(name),
        });
      }
    }
    const originals: Original.IResult = observe(entries);
    originals.unavailable.push(...preparationUnavailable);
    const authored: Original.IResult = observe(
      originals.counterparts.map(
        (part: Original.IResult["counterparts"][number]): Original.IEntry => ({
          id: part.id,
          role: part.role,
          read: (): IAutoMovieViewPart => part.definition,
        }),
      ),
    );
    return {
      input,
      round,
      assembly,
      originals,
      declaredOriginals: entries.map(
        (entry: Original.IEntry): string => entry.id,
      ),
      recorded: { submitted: null, evidence: null },
      frameBaseline: null,
      sourceScopes,
      authored,
      assemblyMs,
      originalMs: performance.now() - originalStarted,
      reads,
      memory: { before, afterOriginals: process.memoryUsage() },
      frames: [],
    };
  }
}
