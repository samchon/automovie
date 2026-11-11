import { AutoMovieHumanBendArc } from "../limb/AutoMovieHumanBendArc";
import { AutoMovieHumanWalkPart } from "../limb/AutoMovieHumanWalkPart";
import type { AutoMovieHumanArmBones } from "./AutoMovieHumanArmBones";
import type { AutoMovieHumanArmWalk } from "./AutoMovieHumanArmWalk";

/** Bone-relative material chart shared before arm or digit scalar constraints are requested. */
export namespace AutoMovieHumanArmFrame {
  /** Original placement/control inputs; no completed source or neighbouring part is required. */
  export interface IInput {
    /** Side-qualified original owner name. */
    name: string;

    /** Neutral GH, elbow and wrist datums in calibration mm. */
    bones: Pick<AutoMovieHumanArmBones.IBones, "shoulder" | "elbow" | "wrist">;

    /** Actual third metacarpal head, calibration mm. */
    knuckle: Vec3;

    /** Anatomically declared distal palm reach, calibration mm. */
    reach: number;

    /** Unsolved named site boxes and tape inputs, proximal first. */
    sites: AutoMovieHumanArmWalk.ISiteLaw[];

    /** Public joint depth laws controlling the unchanged axis turns, calibration mm. */
    joints: { elbow: number; wrist: number };

    /** Existing display subdivision spacing, calibration mm. */
    gap: number;

    /** Optional palmar crease locus, calibration mm. */
    crease?: Vec3;

    /** Optional signed across-hand direction defining the material roll. */
    radial?: Vec3;

    /** Existing periodic compatibility and display order. */
    order: number;
  }

  /** Common axis/site chart before any native girth solve, scalar curve or loft. */
  export interface IOutput {
    /** Pure jointed axis, site stations, source pole and original frame mapping. */
    source: AutoMovieHumanWalkPart.ISource;

    /** Proximal support distance inside the shoulder girdle, calibration mm. */
    run: number;

    /** Actual rigid GH-to-elbow distance, calibration mm. */
    humerus: number;
  }

  /** Preserve the existing bone/share map and metre canonicalization without preparing any section. */
  export function create(input: IInput): IOutput | string {
    const {
      name,
      bones,
      knuckle,
      reach,
      sites,
      joints,
      gap,
      crease,
      radial,
      order,
    }: IInput = input;
    const laws: AutoMovieHumanArmWalk.ISiteLaw[] = sites;
    const first: AutoMovieHumanArmWalk.ISiteLaw = laws[0]!;
    const run: number = Math.max(...first.edges.map(Math.abs));
    const d: number = Math.hypot(
      ...([0, 1, 2].map(
        (c: number): number => bones.shoulder[c]! - bones.elbow[c]!,
      ) as [number, number, number]),
    );
    const top: Vec3 = [0, 1, 2].map(
      (c: number): number =>
        bones.shoulder[c]! + ((bones.shoulder[c]! - bones.elbow[c]!) * run) / d,
    ) as Vec3;
    const mapped: (
      bone: number,
      share: number,
    ) => { bone: number; share: number } = (
      bone: number,
      share: number,
    ): { bone: number; share: number } =>
      bone < 2
        ? {
            bone: 0,
            share: (bone === 0 ? share * run : run + share * d) / (run + d),
          }
        : { bone: bone - 1, share };
    const source: AutoMovieHumanWalkPart.ISource | string =
      AutoMovieHumanWalkPart.source({
        name,
        centres: [
          top,
          bones.elbow,
          bones.wrist,
          knuckle,
          ...(crease === undefined ? [] : [crease]),
        ],

        // GH remains a named point on the first straight segment, avoiding a
        // redundant almost-collinear joint after canonical unit conversion.
        joints: [
          { half: joints.elbow / 2 },
          { half: joints.wrist / 2 },
          ...(crease === undefined
            ? []
            : [
                {
                  half: AutoMovieHumanBendArc.half(
                    bones.wrist,
                    knuckle,
                    crease,
                    reach,
                  ),
                },
              ]),
        ],
        u: [1, 0, 0],
        sites: [
          ...laws.map(
            (
              l: AutoMovieHumanArmWalk.ISiteLaw,
            ): AutoMovieHumanWalkPart.ISite => ({
              site: l.site,
              ...mapped(l.bone, l.share),
              edges: l.edges,
              fullness: l.fullness,
            }),
          ),
        ],
        ...(radial === undefined
          ? {}
          : {
              roll: {
                from: { bone: 2, share: 0 },
                to: { bone: 2, share: 1 },
                up: radial,
              },
            }),
        tip: reach,

        // The proximal pole is hidden inside the girdle; final G2 is separate.
        base: true,
        order,
        samples: order,
        gap,
      });

    return typeof source === "string" ? source : { source, run, humerus: d };
  }
}

/** Original calibration-mm point. */
type Vec3 = AutoMovieHumanArmBones.IBones["shoulder"];
