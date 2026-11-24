import { AutoMovieViewLoft } from "@automovie/engine";
import type {
  IAutoMovieHumanEar,
  IAutoMovieHumanHeadComposer,
  IAutoMovieHumanHeadDome,
  IAutoMovieHumanHeadFeatures,
  IAutoMovieHumanHeadOriginalSources,
  IAutoMovieHumanPair,
  IAutoMovieViewLoft,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanHeadEarParts } from "./AutoMovieHumanHeadEarParts";
import { AutoMovieHumanHeadEyeParts } from "./AutoMovieHumanHeadEyeParts";
import { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";
import { AutoMovieHumanHeadInnerParts } from "./AutoMovieHumanHeadInnerParts";

/**
 * Explicit selected/full regional source requests on one canonical numerical
 * host.
 *
 * Two hosts serve these requests. A request whose every original reads the mass
 * only on or below nasion is authored on the canonical family's pre-closure
 * member (`IBase.tapeInvariant`), which equals every closed member there bit
 * for bit (the proof is on that field), so it never pays the upper head-tape
 * closure. Those originals and their reads are: the nose (`frontAt` at the
 * nasion-tip midpoint), both lips (one native contact section at stomion), the
 * philtrum (subnasale to labrale superius) and the mentolabial sulcus (at
 * sublabiale) on the mass, the nostril cutters on the original nose, and the
 * eye studies, which read the layout's landmarks only. Every other request
 * keeps the closed host: the orbital domes read the mass across the palpebral
 * fissure's height around the eye level, which reaches nasion, and the auricles
 * attach up to superaurale, above it. A request without a name list or with a
 * closed-host regional dependency selects the complete catalogue. Exact
 * top-level selections may share a single closed host.
 */
export namespace AutoMovieHumanHeadOriginalSources {
  /**
   * Existing public regional-name protocol, before any host or source is
   * acquired. Listing source names requires no geometry.
   */
  export function names(): string[] {
    return [
      "head.mass",
      ...AutoMovieHumanHeadFeatures.names(),
      "nose.lobule",
      "philtrum",
      "sulcus.mentolabial",
      ...(["left", "right"] as const).flatMap(
        (side: "left" | "right"): string[] => [
          "auricle." + side,
          "ear.helix." + side,
          "ear.antihelix." + side,
          "ear.crus.superior." + side,
          "ear.crus.inferior." + side,
          "ear.concha." + side,
          "nose.ala." + side,
          "nose.nostril." + side,
          "globe." + side,
          "fissure." + side,
        ],
      ),
    ];
  }

  /**
   * Originals whose every mass read lies on or below nasion, so the pre-closure
   * host serves them exactly (see the namespace comment for each read).
   */
  export function tapeInvariant(name: string): boolean {
    return (
      TOP.has(name) ||
      INNER.has(name) ||
      name.startsWith("globe.") ||
      name.startsWith("fissure.")
    );
  }

  /** Prepare each requested catalogue on its one actual host. */
  export function create(
    base: IAutoMovieHumanHeadComposer.IBase,
    ears: IAutoMovieHumanPair<IAutoMovieHumanEar>,
    places?: IAutoMovieHumanHeadComposer.IPlaces,
  ): IAutoMovieHumanHeadOriginalSources.IOutput {
    const top: readonly string[] = AutoMovieHumanHeadFeatures.names();
    const known: Set<string> = new Set([...names(), base.guides.name]);
    return {
      request(
        requested?: readonly string[],
      ): IAutoMovieHumanHeadComposer.IDefinition {
        if (requested?.length === 0) {
          /** Every raw name is unavailable in the empty definition. */
          function loft(name: string): IAutoMovieViewLoft.IResult {
            throw new Error("No head original was requested: " + name);
          }
          return {
            base,
            closureAttempt: { state: "unrequested" },
            requestScope: "unrequested",
            parts: [],
            sources: new Map(),
            attachments: [],
            studies: [],
            loft,
            prepareRaw: (
              rawNames: readonly string[],
            ): IAutoMovieHumanHeadComposer.IRaw => prepareRaw(rawNames, loft),
          };
        }
        const selected: readonly string[] = requested ?? [];
        const unavailable: string[] = selected.filter(
          (name: string): boolean => !known.has(name),
        );
        if (unavailable.length !== 0)
          throw new Error(
            "Unknown head original request: " + unavailable.join(", "),
          );

        const invariant: boolean = requested?.every(tapeInvariant) ?? false;
        const complete: boolean =
          requested === undefined ||
          (!invariant &&
            requested.some(
              (name: string): boolean =>
                name !== base.guides.name && !top.includes(name),
            ));
        const closureAttempt: IAutoMovieHumanHeadComposer.IDefinition["closureAttempt"] =
          invariant ? { state: "unrequested" } : base.attemptClosure();
        if (closureAttempt.state === "failed") throw closureAttempt.error;
        const { plan, part: mass }: typeof base.tapeInvariant =
          closureAttempt.state === "succeeded"
            ? closureAttempt.result.tape
            : base.tapeInvariant;

        const attempts: IAutoMovieHumanHeadDome.IAttempt[] = [];
        const needsInner: boolean =
          complete ||
          (invariant &&
            selected.some((name: string): boolean => INNER.has(name)));
        const outer: IAutoMovieHumanHeadFeatures.IFeature[] =
          AutoMovieHumanHeadFeatures.prepare(
            plan,
            mass,
            attempts,
            complete
              ? undefined
              : needsInner
                ? [...selected, "nose"]
                : selected,
          );
        const auricles: IAutoMovieHumanHeadFeatures.IFeature[] = complete
          ? AutoMovieHumanHeadEarParts.of(plan, mass, ears, places?.ears, attempts)
          : [];
        const inner: IAutoMovieHumanHeadFeatures.IFeature[] = needsInner
          ? AutoMovieHumanHeadInnerParts.of(
              plan,
              sourceMap(mass, outer),
              attempts,
            )
          : [];
        const regional: IAutoMovieHumanHeadFeatures.IFeature[] = [
          ...outer,
          ...auricles,
          ...inner,
        ];
        const parts: IAutoMovieHumanHeadFeatures.IFeature[] =
          complete || !invariant
            ? regional
            : regional.filter(
                (feature: IAutoMovieHumanHeadFeatures.IFeature): boolean =>
                  selected.includes(feature.part.name),
              );
        const studies: IAutoMovieViewPart[] =
          complete || (invariant && selected.some(isStudy))
            ? AutoMovieHumanHeadEyeParts.of(plan).filter(
                (part: IAutoMovieViewPart): boolean =>
                  complete || selected.includes(part.name),
              )
            : [];
        const sources: ReadonlyMap<string, IAutoMovieViewPart> = sourceMap(
          mass,
          parts,
        );
        const requestScope: IAutoMovieHumanHeadComposer.IDefinition["requestScope"] =
          complete
            ? "complete-regional-catalogue"
            : invariant
              ? "selected-tape-invariant"
              : "selected-top-level";

        return {
          base,
          closureAttempt,
          requestScope,
          parts,
          sources,
          attachments: complete
            ? attempts
            : attempts.filter(
                (attempt: IAutoMovieHumanHeadDome.IAttempt): boolean =>
                  selected.includes(attempt.name),
              ),
          studies,
          loft,
          prepareRaw: (
            rawNames: readonly string[],
          ): IAutoMovieHumanHeadComposer.IRaw => prepareRaw(rawNames, loft),
        };

        /** Realize one actual original on the already selected host. */
        function loft(name: string): IAutoMovieViewLoft.IResult {
          const part: IAutoMovieViewPart | undefined =
            sources.get(name) ??
            studies.find(
              (study: IAutoMovieViewPart): boolean => study.name === name,
            );
          if (part === undefined)
            throw new Error(
              "Head original " +
                name +
                " is unavailable: " +
                (attempts.find(
                  (attempt: IAutoMovieHumanHeadDome.IAttempt): boolean =>
                    attempt.name === name,
                )?.error ?? "no original source in this definition"),
            );
          if (part !== mass) return AutoMovieViewLoft.create(part);
          if (closureAttempt.state !== "succeeded")
            throw new Error(
              "The pre-closure head host is exact only below nasion; request the closed head mass for its raw loft",
            );
          return base.loft(closureAttempt.result);
        }
      },
    };
  }

  /** Publish one result for each declared raw name and its actual diagnostics. */
  export function prepareRaw(
    requested: readonly string[],
    loft: (name: string) => IAutoMovieViewLoft.IResult,
  ): IAutoMovieHumanHeadComposer.IRaw {
    const lofts: Map<string, IAutoMovieViewLoft.IResult> = new Map();
    const diagnostics: IAutoMovieHumanHeadComposer.IRaw["diagnostics"] = [];
    for (const name of new Set(requested)) {
      const result: IAutoMovieViewLoft.IResult = loft(name);
      lofts.set(name, result);
      diagnostics.push(...result.diagnostics);
    }
    return { lofts, diagnostics };
  }

  /** Index the actual original mass and the source leaves of this selection. */
  function sourceMap(
    mass: IAutoMovieViewPart,
    parts: readonly IAutoMovieHumanHeadFeatures.IFeature[],
  ): ReadonlyMap<string, IAutoMovieViewPart> {
    const sources: Map<string, IAutoMovieViewPart> = new Map([
      [mass.name, mass],
    ]);
    for (const feature of parts) sources.set(feature.part.name, feature.part);
    return sources;
  }

  /** Eye studies read landmarks and stay outside the production skin tree. */
  function isStudy(name: string): boolean {
    return name.startsWith("globe.") || name.startsWith("fissure.");
  }

  /**
   * Top-level originals on the tape-invariant host: the nose and both lips; the
   * orbital domes read up to nasion and stay closed.
   */
  const TOP: ReadonlySet<string> = new Set(["nose", "lip.upper", "lip.lower"]);

  /** Nested originals whose parents are the mass below nasion and the nose. */
  const INNER: ReadonlySet<string> = new Set([
    "nose.lobule",
    "nose.ala.left",
    "nose.ala.right",
    "nose.nostril.left",
    "nose.nostril.right",
    "philtrum",
    "sulcus.mentolabial",
  ]);
}
