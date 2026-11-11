import type {
  AutoMovieSolidVector,
  IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanHandAttachment } from "../hand/AutoMovieHumanHandAttachment";
import { AutoMovieHumanBendArc } from "./AutoMovieHumanBendArc";
import { AutoMovieHumanSiteViewPart } from "./AutoMovieHumanSiteViewPart";
import { AutoMovieHumanWalkPart } from "./AutoMovieHumanWalkPart";

type Vec3 = AutoMovieSolidVector.Vec3;

/**
 * A digit (a finger, the thumb, a toe) as one walk over its phalanges
 * (#3049, #3051): straight along each phalanx at the neutral pose, its
 * interphalangeal joints C2 turns of one axis, its tip a G2 dome, its base
 * inside the palm or the forefoot it merges onto.
 *
 * Knots stand at every joint and at every phalanx's middle, the sites a
 * digit's breadth and depth are published at or read between (the joints'
 * breadths and depths, the shafts between), the base being the digit's
 * proximal joint (the knuckle) inside its host, so the merge trims the
 * digit's own root. Each knot's breadth and depth are the caller's laws
 * by site; the section's dorsal and palmar (or plantar) edges split the depth
 * about the bone by the caller's dorsal share, and the two side edges split
 * the breadth evenly about the bone (a phalanx's cross-section is symmetric
 * about its own median plane to the precision of the published breadths,
 * which are taken across it). A joint's signed depth and half breadth define
 * its section-box circumradius. JointTurn converts that minimum axis radius
 * and the actual angle into the engine's half arclength. This bounds the
 * named section only; changing sections along a turn still require their
 * own reach assessment. Radius and arclength are different quantities.
 */
export namespace AutoMovieHumanDigitWalk {
  /** A digit's laws at one site. */
  export interface ISiteLaw {
    /** Whole breadth across the digit, mm. */
    breadth: number;

    /** Whole depth from the dorsal to the palmar or plantar skin, mm. */
    depth: number;

    /** The dorsal share of the depth above the bone's axis, in `(0, 1)`. */
    dorsal: number;

    /** The sourced conic shoulder of the section there. */
    shoulder: number;
    /** Actual parent-derived quarter fullness in this digit's engine material frame. */
    shoulders?: [number, number, number, number];
    /** Available quarter jets in the same normalized source clock; a held parent section declares its constant pullback explicitly. */
    shoulderJets?: IAutoMovieViewPart.IQuarters<
      IAutoMovieViewPart.IKnot["jet"]
    >;
    /** Optional original edge jets in the digit's normalized source parameter. */
    jets?: AutoMovieHumanSiteViewPart.ISite["jets"];
  }

  /** What a digit is built from. */
  export interface IInput {
    /** Chain name, such as `finger.left.index` or `toe.left.1`. */
    name: string;

    /** The joint centres from the base (the knuckle, inside the host) to the distal phalanx's end: base, then each interphalangeal joint, then the end, at least three. */
    centres: Vec3[];

    /** The dorsal direction on the first phalanx. */
    dorsal: Vec3;

    /** The pulp's reach past the distal phalanx's end to the tip, mm. */
    tip: number;
    /** Optional closed-span scalar bounds in this digit's material chart. */
    ranges?: AutoMovieHumanSiteViewPart.IInput["ranges"];

    /** The laws at a site: `base`, `joint <k>` (k from 1, the first joint after the base), `shaft <k>` (the middle of bone k from 0), `end`. */
    law(site: string): ISiteLaw;

    /** Control points and ring phases of each section, a multiple of 4. */
    order: number;

    /** Widest spacing between layers, mm. */
    gap: number;
    /** Whole actual parent owner and declared local contact/material transfer. */
    attachment?: AutoMovieHumanHandAttachment.IConnection;
  }

  /**
   * Build and loft the digit.
   *
   * @param input The centres, the laws and the tip.
   * @returns The part, its loft and the diagnostics.
   */
  export function create(input: IInput): AutoMovieHumanSiteViewPart.IResult {
    return AutoMovieHumanSiteViewPart.loft(define(input));
  }

  /** Prepare the identical original digit, without constructing its raw loft. */
  export function define(
    input: IInput,
  ): AutoMovieHumanSiteViewPart.IDefinition {
    const bones: number = input.centres.length - 1;
    const quarters: Map<string, [number, number, number, number]> = new Map();
    const quarterJets: Map<
      string,
      NonNullable<ISiteLaw["shoulderJets"]>
    > = new Map();
    const box: (law: ISiteLaw) => [number, number, number, number] = (
      law: ISiteLaw,
    ): [number, number, number, number] => [
      law.depth * law.dorsal,
      law.breadth / 2,
      -law.depth * (1 - law.dorsal),
      -law.breadth / 2,
    ];
    const site: (
      name: string,
      bone: number,
      share: number,
      law: ISiteLaw,
    ) => AutoMovieHumanWalkPart.ISite = (
      name: string,
      bone: number,
      share: number,
      law: ISiteLaw,
    ): AutoMovieHumanWalkPart.ISite => {
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
    };

    // An attached hand digit consumes the actual parent-derived positive
    // base section; its first shaft keeps the independent measured law.
    const sites: AutoMovieHumanWalkPart.ISite[] = [];
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
    const prepared: AutoMovieHumanWalkPart.ISource | string =
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
    const definition: AutoMovieHumanSiteViewPart.IInput = prepared.input;
    if (quarters.size > 0) {
      const departures: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> =
        [0, 1, 2, 3].map((q: number): IAutoMovieViewPart.IOutline => {
          const knots: IAutoMovieViewPart.IKnot[] = definition.sites.map(
            (s: AutoMovieHumanSiteViewPart.ISite): IAutoMovieViewPart.IKnot => {
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
          const pole: AutoMovieHumanSiteViewPart.IInput["pole"] =
            definition.pole;
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

  /** The farthest corner of the named joint's signed section box bounds every native conic point there. Both measured breadth and asymmetric dorsal/palmar depths contribute, avoiding the half-depth focal-radius equality at the joint centre. This does not bound the varying section or curvature throughout the turn. */
  function bendRadius(law: ISiteLaw): number {
    return Math.hypot(
      Math.max(law.depth * law.dorsal, law.depth * (1 - law.dorsal)),
      law.breadth / 2,
    );
  }

  /** The attachment's supported skin root lies on the original first bone's proximal extension. Its displacement does not move the measured midpoint between the unchanged joint and first distal joint. Map that datum into the new root-to-first-joint share; standalone callers retain one half. Units cancel, and the source adapter still owns the physical station. */
  function firstShaftShare(input: IInput): number {
    if (input.attachment === undefined) return 0.5;
    const root: Vec3 = input.centres[0]!;
    const joint: Vec3 = input.attachment.joint;
    const first: Vec3 = input.centres[1]!;
    const length: (a: Vec3, b: Vec3) => number = (a: Vec3, b: Vec3): number =>
      Math.hypot(
        ...a.map((value: number, axis: number): number => value - b[axis]!),
      );
    return (
      (length(joint, root) + length(first, joint) / 2) / length(first, root)
    );
  }
}
