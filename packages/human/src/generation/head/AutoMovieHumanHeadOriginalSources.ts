import { AutoMovieViewLoft, type IAutoMovieViewPart } from "@automovie/engine";

import type { IAutoMovieHumanEar } from "../../structures/head/IAutoMovieHumanEar";
import type { IAutoMovieHumanHeadLayout } from "../IAutoMovieHumanHeadLayout";
import type { AutoMovieHumanHeadComposer } from "./AutoMovieHumanHeadComposer";
import type { AutoMovieHumanHeadDome } from "./AutoMovieHumanHeadDome";
import { AutoMovieHumanHeadEarParts } from "./AutoMovieHumanHeadEarParts";
import { AutoMovieHumanHeadEyeParts } from "./AutoMovieHumanHeadEyeParts";
import { AutoMovieHumanHeadFeatures } from "./AutoMovieHumanHeadFeatures";
import { AutoMovieHumanHeadInnerParts } from "./AutoMovieHumanHeadInnerParts";

/**
 * Explicit selected/full regional source requests on one canonical numerical host.
 *
 * Two hosts serve these requests. A request whose every original reads the
 * mass only on or below nasion is authored on the canonical family's
 * pre-closure member (`IBase.tapeInvariant`), which equals every closed member
 * there bit for bit (the proof is on that field), so it never pays the upper
 * head-tape closure. Those originals and their reads are: the nose (`frontAt`
 * at the nasion-tip midpoint), both lips (one native contact section at
 * stomion), the philtrum (subnasale to labrale superius) and the mentolabial
 * sulcus (at sublabiale) on the mass, the lobule, alae and nostrils on the
 * nose, and the eye studies, which read the layout's landmarks only. Every
 * other request keeps the closed host: the orbital domes read the mass across
 * the palpebral fissure's height around the eye level, which reaches nasion,
 * and the auricles attach up to superaurale, above it. Requests mixing both
 * kinds, an absent list and the nested ear names retain the existing complete
 * regional catalogue on the closed host. This is a dependency boundary inside
 * the existing native bank; it is not the planned composed S01 source.
 */
export namespace AutoMovieHumanHeadOriginalSources {
  /** Source requests before tree assembly or any regional raw loft. */
  export interface IOutput {
    /** Empty is unrequested, unknown names throw before host work, tape-invariant names use the pre-closure host, exact top-level names select their closed-host factories, and absent/mixed/nested names retain the existing whole regional path. */
    request(names?: readonly string[]): AutoMovieHumanHeadComposer.IDefinition;
  }

  /**
   * Existing public regional-name protocol, before any host or source is acquired.
   * Nested/ear names are admitted requests for the existing whole catalogue;
   * listing them is neither a constructor nor a new S01 composition.
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

  /** Retain actual original objects and failures in this one immutable source invocation. */
  export function create(
    base: AutoMovieHumanHeadComposer.IBase,
    ears: { left: IAutoMovieHumanEar; right: IAutoMovieHumanEar },
    places?: AutoMovieHumanHeadComposer.IPlaces,
  ): IOutput {
    const known: Set<string> = new Set([...names(), base.guides.name]);
    const empty: AutoMovieHumanHeadComposer.IDefinition = {
      base,
      requestScope: "unrequested",
      parts: [],
      sources: new Map(),
      attachments: [],
      studies: [],
      lofts: new Map(),
      loft(name: string): AutoMovieViewLoft.IResult {
        throw new Error("No head original was requested: " + name);
      },
    };
    const attempts: AutoMovieHumanHeadDome.IAttempt[] = [];
    const lofts: Map<string, AutoMovieViewLoft.IResult> = new Map();
    let top: AutoMovieHumanHeadFeatures.IPrepared | undefined;
    let complete: AutoMovieHumanHeadComposer.IDefinition | undefined;

    // The pre-closure host keeps its own attempts and lofts, so a later
    // closed-host request neither repeats nor inherits these records.
    const lowerAttempts: AutoMovieHumanHeadDome.IAttempt[] = [];
    const lowerLofts: Map<string, AutoMovieViewLoft.IResult> = new Map();
    let lowerTop: AutoMovieHumanHeadFeatures.IPrepared | undefined;
    let lowerInner: AutoMovieHumanHeadFeatures.IFeature[] | undefined;
    let lowerStudies: IAutoMovieViewPart[] | undefined;

    /** Prepare only the canonical host and the five factory closures at explicit regional demand. */
    const prepare: () => AutoMovieHumanHeadFeatures.IPrepared =
      (): AutoMovieHumanHeadFeatures.IPrepared => {
        top ??= AutoMovieHumanHeadFeatures.prepare(
          base.closed().tape.plan,
          base.closed().tape.part,
          attempts,
        );
        return top;
      };

    /** Publish only requested actual originals on their host; raw remains an explicit request on these sources. */
    const publish: (
      host: IHost,
      parts: AutoMovieHumanHeadFeatures.IFeature[],
      studies: IAutoMovieViewPart[],
      requestScope: NonNullable<
        AutoMovieHumanHeadComposer.IDefinition["requestScope"]
      >,
      names?: readonly string[],
    ) => AutoMovieHumanHeadComposer.IDefinition = (
      host: IHost,
      parts: AutoMovieHumanHeadFeatures.IFeature[],
      studies: IAutoMovieViewPart[],
      requestScope: NonNullable<
        AutoMovieHumanHeadComposer.IDefinition["requestScope"]
      >,
      names?: readonly string[],
    ): AutoMovieHumanHeadComposer.IDefinition => {
      const mass: IAutoMovieViewPart = host.part;
      const sources: ReadonlyMap<string, IAutoMovieViewPart> = new Map([
        [mass.name, mass],
        ...parts.map(
          (
            feature: AutoMovieHumanHeadFeatures.IFeature,
          ): [string, IAutoMovieViewPart] => [feature.part.name, feature.part],
        ),
      ]);
      const relevant: AutoMovieHumanHeadDome.IAttempt[] =
        requestScope === "complete-regional-catalogue"
          ? host.attempts
          : host.attempts.filter(
              (attempt: AutoMovieHumanHeadDome.IAttempt): boolean =>
                names?.includes(attempt.name) ?? false,
            );
      return {
        base,
        parts,
        sources,
        attachments: relevant,
        studies,
        lofts: host.lofts,
        requestScope,
        loft(name: string): AutoMovieViewLoft.IResult {
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
                (host.attempts.find(
                  (attempt: AutoMovieHumanHeadDome.IAttempt): boolean =>
                    attempt.name === name,
                )?.error ?? "no original source in this definition"),
            );

          // The pre-closure mass is exact only on and below nasion, so it is
          // never lofted as the head; the closed host owns that raw request.
          if (part === mass && !host.closed)
            throw new Error(
              "The pre-closure head host is exact only below nasion; request the closed head mass for its raw loft",
            );
          const previous: AutoMovieViewLoft.IResult | undefined =
            host.lofts.get(name);
          if (previous !== undefined) return previous;
          const result: AutoMovieViewLoft.IResult =
            part === mass ? base.loft() : AutoMovieViewLoft.create(part);
          host.lofts.set(name, result);
          return result;
        },
      };
    };

    /** Author exactly the requested tape-invariant originals on the pre-closure host, without the closure. */
    const invariant: (
      names: readonly string[],
    ) => AutoMovieHumanHeadComposer.IDefinition = (
      names: readonly string[],
    ): AutoMovieHumanHeadComposer.IDefinition => {
      const host: { plan: IAutoMovieHumanHeadLayout; part: IAutoMovieViewPart } =
        base.tapeInvariant;
      lowerTop ??= AutoMovieHumanHeadFeatures.prepare(
        host.plan,
        host.part,
        lowerAttempts,
      );
      const factories: AutoMovieHumanHeadFeatures.IPrepared = lowerTop;
      const outer: AutoMovieHumanHeadFeatures.IFeature[] = factories.read(
        names.filter((name: string): boolean => TOP.has(name)),
      );

      // The nested parts take the mass and the nose as parents; both are the
      // tape-invariant sources, so the nose is read from this same host.
      const inner: AutoMovieHumanHeadFeatures.IFeature[] = names.some(
        (name: string): boolean => INNER.has(name),
      )
        ? (lowerInner ??= AutoMovieHumanHeadInnerParts.of(
            host.plan,
            new Map([
              [host.part.name, host.part],
              ["nose", factories.read(["nose"])[0]!.part],
            ]),
            lowerAttempts,
          )).filter((feature: AutoMovieHumanHeadFeatures.IFeature): boolean =>
            names.includes(feature.part.name),
          )
        : [];
      const studies: IAutoMovieViewPart[] = names.some(
        (name: string): boolean =>
          name.startsWith("globe.") || name.startsWith("fissure."),
      )
        ? (lowerStudies ??= AutoMovieHumanHeadEyeParts.of(host.plan)).filter(
            (study: IAutoMovieViewPart): boolean => names.includes(study.name),
          )
        : [];
      return publish(
        {
          part: host.part,
          attempts: lowerAttempts,
          lofts: lowerLofts,
          closed: false,
        },
        [...outer, ...inner],
        studies,
        "selected-tape-invariant",
        names,
      );
    };

    /** The closed host's mass and records, at its explicit demand. */
    const closedHost: () => IHost = (): IHost => ({
      part: base.closed().tape.part,
      attempts,
      lofts,
      closed: true,
    });
    return {
      request(
        names?: readonly string[],
      ): AutoMovieHumanHeadComposer.IDefinition {
        if (names !== undefined) {
          if (names.length === 0) return empty;
          const unavailable: string[] = names.filter(
            (name: string): boolean => !known.has(name),
          );
          if (unavailable.length !== 0)
            throw new Error(
              "Unknown head original request: " + unavailable.join(", "),
            );
          if (names.every(tapeInvariant)) return invariant(names);
        }
        if (names === undefined && complete !== undefined) return complete;
        const factories: AutoMovieHumanHeadFeatures.IPrepared = prepare();
        if (
          names !== undefined &&
          names.every(
            (name: string): boolean =>
              name === base.guides.name || factories.names.includes(name),
          )
        )
          return publish(
            closedHost(),
            factories.read(names),
            [],
            "selected-top-level",
            names,
          );
        if (complete !== undefined) return complete;
        const { plan, part: mass }: ReturnType<typeof base.closed>["tape"] =
          base.closed().tape;
        const outer: AutoMovieHumanHeadFeatures.IFeature[] = factories.read();
        const parents: Map<string, IAutoMovieViewPart> = new Map([
          [mass.name, mass],
          ...outer.map(
            (
              feature: AutoMovieHumanHeadFeatures.IFeature,
            ): [string, IAutoMovieViewPart] => [
              feature.part.name,
              feature.part,
            ],
          ),
        ]);
        complete = publish(
          closedHost(),
          [
            ...outer,
            ...AutoMovieHumanHeadEarParts.of(
              plan,
              mass,
              ears,
              places?.ears,
              attempts,
            ),
            ...AutoMovieHumanHeadInnerParts.of(plan, parents, attempts),
          ],
          AutoMovieHumanHeadEyeParts.of(plan),
          "complete-regional-catalogue",
        );
        return complete;
      },
    };
  }

  /** One host's mass, its attempt and loft records, and whether it is the closed member. */
  interface IHost {
    /** The mass the requested originals attach to. */
    part: IAutoMovieViewPart;

    /** Dome attempts authored on this host. */
    attempts: AutoMovieHumanHeadDome.IAttempt[];

    /** Raw results already requested on this host. */
    lofts: Map<string, AutoMovieViewLoft.IResult>;

    /** True for the closed member, the only one lofted as the head. */
    closed: boolean;
  }

  /** Top-level originals on the tape-invariant host: the nose and both lips; the orbital domes read up to nasion and stay closed. */
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
