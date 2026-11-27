import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanDigitWalk,
  IAutoMovieHumanSectionSite,
  IAutoMovieHumanSectionSource,
  IAutoMovieHumanSourceDefinition,
  IAutoMovieHumanSourceRealization,
  IAutoMovieHumanWalkPart,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanBendArc } from "./AutoMovieHumanBendArc";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";
import { AutoMovieHumanWalkPart } from "./AutoMovieHumanWalkPart";

/**
 * A digit (a finger, the thumb, a toe) as one walk over its phalanges (#3049,
 * #3051): straight along each phalanx at the neutral pose, its interphalangeal
 * joints C2 turns of one axis, its tip a G2 dome, its base inside the palm or
 * the forefoot it merges onto.
 *
 * Knots stand at every joint and at every phalanx's middle, the sites a digit's
 * breadth and depth are published at or read between (the joints' breadths and
 * depths, the shafts between), the base being the digit's proximal joint (the
 * knuckle) inside its host, so the merge trims the digit's own root. Each
 * knot's breadth and depth are the caller's laws by site; the section's dorsal
 * and palmar (or plantar) edges split the depth about the bone by the caller's
 * dorsal share, and the two side edges split the breadth evenly about the bone
 * (a phalanx's cross-section is symmetric about its own median plane to the
 * precision of the published breadths, which are taken across it). A joint's
 * signed depth and half breadth define its section-box circumradius. JointTurn
 * converts that minimum axis radius and the actual angle into the engine's half
 * arclength. This bounds the named section only; changing sections along a turn
 * still require their own reach assessment. Radius and arclength are different
 * quantities.
 */
export namespace AutoMovieHumanDigitWalk {
  /**
   * Build and loft the digit.
   *
   * @param input The centres, the laws and the tip.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(
    input: IAutoMovieHumanDigitWalk.IInput,
  ): IAutoMovieHumanSourceRealization {
    return AutoMovieHumanSiteViewPart.loft(define(input));
  }

  /** Prepare the identical original digit, without constructing its raw loft. */
  export function define(
    input: IAutoMovieHumanDigitWalk.IInput,
  ): IAutoMovieHumanSourceDefinition {
    const bones: number = input.centres.length - 1;
    const quarters: Map<string, [number, number, number, number]> = new Map();
    const quarterJets: Map<
      string,
      NonNullable<IAutoMovieHumanDigitWalk.ISiteLaw["shoulderJets"]>
    > = new Map();
    function box(
      law: IAutoMovieHumanDigitWalk.ISiteLaw,
    ): [number, number, number, number] {
      return [
        law.depth * law.dorsal,
        law.breadth / 2,
        -law.depth * (1 - law.dorsal),
        -law.breadth / 2,
      ];
    }
    function site(
      name: string,
      bone: number,
      share: number,
      law: IAutoMovieHumanDigitWalk.ISiteLaw,
    ): IAutoMovieHumanWalkPart.ISite {
      if (law.shoulders !== undefined) quarters.set(name, law.shoulders);
      if (law.shoulderJets !== undefined)
        quarterJets.set(name, law.shoulderJets);
      return {
        site: name,
        bone,
        share,
        edges: box(law),
        fullness: {
          shoulder: law.shoulder,
          ...(law.shoulderJets?.[0] === undefined
            ? {}
            : { jet: law.shoulderJets[0] }),
        },
        ...(law.jets === undefined ? {} : { jets: law.jets }),
      };
    }

    // An attached hand digit consumes the actual parent-derived positive
    // base section; its first shaft keeps the independent measured law.
    const sites: IAutoMovieHumanWalkPart.ISite[] = [];
    if (input.attachment !== undefined)
      sites.push(site("base", 0, 0, input.law("base")));
    for (let b: number = 0; b < bones; b++) {
      sites.push(
        site(
          `shaft ${b}`,
          b,
          b === 0 ? firstShaftShare(input) : 0.5,
          input.law(`shaft ${b}`),
        ),
      );
      sites.push(
        b + 1 < bones
          ? site(`joint ${b + 1}`, b + 1, 0, input.law(`joint ${b + 1}`))
          : site("end", b, 1, input.law("end")),
      );
    }

    // The same radius produces a shorter turn at a smaller anatomical angle.
    const joints: { half: number }[] = Array.from(
      { length: bones - 1 },
      (_: unknown, k: number): { half: number } => ({
        half: AutoMovieHumanBendArc.half(
          input.centres[k]!,
          input.centres[k + 1]!,
          input.centres[k + 2]!,
          bendRadius(input.law(`joint ${k + 1}`)),
        ),
      }),
    );
    const prepared: IAutoMovieHumanWalkPart.ISource | string =
      AutoMovieHumanWalkPart.source({
        name: input.name,
        centres: input.centres,
        joints,
        u: input.dorsal,
        sites,
        ...(input.ranges === undefined ? {} : { ranges: input.ranges }),
        tip: input.tip,

        // Attached hand roots are regular sections. Standalone legacy walks
        // retain their explicit closed-base convention.
        base: input.attachment === undefined,
        order: input.order,
        samples: input.order,
        gap: input.gap,
      });
    if (typeof prepared === "string")
      return {
        part: null,
        view: null,
        diagnostics: [
          {
            producer: `walk.${input.name}`,
            level: 2,
            contract: "axis",
            detail: prepared,
          },
        ],
      };
    const definition: IAutoMovieHumanSectionSource = prepared.input;
    if (quarters.size > 0) {
      const departures: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> =
        [0, 1, 2, 3].map((q: number): IAutoMovieViewPart.IOutline => {
          const knots: IAutoMovieViewPart.IKnot[] = definition.sites.map(
            (s: IAutoMovieHumanSectionSite): IAutoMovieViewPart.IKnot => {
              if (!("shoulder" in s.fullness))
                throw new Error(
                  "A hand contact requires sourced quarter fullness",
                );
              const owner: IAutoMovieViewPart.IKnot["jet"] = quarterJets.get(
                s.site,
              )?.[0];
              const own: IAutoMovieViewPart.IKnot["jet"] = quarterJets.get(
                s.site,
              )?.[q];
              const jet: IAutoMovieViewPart.IKnot["jet"] =
                owner === undefined || own === undefined
                  ? undefined
                  : {
                      first:
                        owner.first === null || own.first === null
                          ? null
                          : own.first - owner.first,
                      second:
                        owner.second === null || own.second === null
                          ? null
                          : own.second - owner.second,
                    };
              return {
                site: s.site,
                station: s.station,
                value:
                  (quarters.get(s.site)?.[q] ?? s.fullness.shoulder) -
                  s.fullness.shoulder,
                ...(jet === undefined ? {} : { jet }),
              };
            },
          );
          const pole: IAutoMovieHumanSectionSource["pole"] = definition.pole;
          if (pole !== undefined && pole.end !== "top")
            knots.unshift({
              site: "bottom pole",
              station: pole.end === "both" ? pole.bottom : pole.station,
              value: knots[0]!.value,
            });
          if (pole !== undefined && pole.end !== "bottom")
            knots.push({
              site: "top pole",
              station: pole.end === "both" ? pole.top : pole.station,
              value: knots.at(-1)!.value,
            });
          return { knots };
        }) as IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline>;
      return AutoMovieHumanSiteViewPart.define({ ...definition, departures });
    }
    return AutoMovieHumanSiteViewPart.define(definition);
  }

  /**
   * The farthest corner of the named joint's signed section box bounds every
   * native conic point there. Both measured breadth and asymmetric
   * dorsal/palmar depths contribute, avoiding the half-depth focal-radius
   * equality at the joint centre. This does not bound the varying section or
   * curvature throughout the turn.
   */
  function bendRadius(law: IAutoMovieHumanDigitWalk.ISiteLaw): number {
    return Math.hypot(
      Math.max(law.depth * law.dorsal, law.depth * (1 - law.dorsal)),
      law.breadth / 2,
    );
  }

  /**
   * The attachment's supported skin root lies on the original first bone's
   * proximal extension. Its displacement does not move the measured midpoint
   * between the unchanged joint and first distal joint. Map that datum into the
   * new root-to-first-joint share; standalone callers retain one half. Units
   * cancel, and the source adapter still owns the physical station.
   */
  function firstShaftShare(input: IAutoMovieHumanDigitWalk.IInput): number {
    if (input.attachment === undefined) return 0.5;
    const root: AutoMovieVector3Tuple = input.centres[0]!;
    const joint: AutoMovieVector3Tuple = input.attachment.joint;
    const first: AutoMovieVector3Tuple = input.centres[1]!;
    function length(
      a: AutoMovieVector3Tuple,
      b: AutoMovieVector3Tuple,
    ): number {
      return Math.hypot(
        ...a.map((value: number, axis: number): number => value - b[axis]!),
      );
    }
    return (
      (length(joint, root) + length(first, joint) / 2) / length(first, root)
    );
  }
}
