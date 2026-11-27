import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanArmFrame,
  IAutoMovieHumanArmWalk,
  IAutoMovieHumanWalkPart,
} from "@automovie/interface";

import { AutoMovieHumanBendArc } from "./AutoMovieHumanBendArc";
import { AutoMovieHumanWalkPart } from "./AutoMovieHumanWalkPart";

/**
 * Bone-relative material chart shared before arm or digit scalar constraints
 * are requested.
 */
export namespace AutoMovieHumanArmFrame {
  /**
   * Preserve the existing bone/share map and metre canonicalization without
   * preparing any section.
   */
  export function create(
    input: IAutoMovieHumanArmFrame.IInput,
  ): IAutoMovieHumanArmFrame.IOutput | string {
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
    }: IAutoMovieHumanArmFrame.IInput = input;
    const laws: IAutoMovieHumanArmWalk.ISiteLaw[] = sites;
    const first: IAutoMovieHumanArmWalk.ISiteLaw = laws[0]!;
    const run: number = Math.max(...first.edges.map(Math.abs));
    const d: number = Math.hypot(
      ...([0, 1, 2].map(
        (c: number): number => bones.shoulder[c]! - bones.elbow[c]!,
      ) as [number, number, number]),
    );
    const top: AutoMovieVector3Tuple = [0, 1, 2].map(
      (c: number): number =>
        bones.shoulder[c]! + ((bones.shoulder[c]! - bones.elbow[c]!) * run) / d,
    ) as AutoMovieVector3Tuple;
    function mapped(
      bone: number,
      share: number,
    ): { bone: number; share: number } {
      return bone < 2
        ? {
            bone: 0,
            share: (bone === 0 ? share * run : run + share * d) / (run + d),
          }
        : { bone: bone - 1, share };
    }
    const source: IAutoMovieHumanWalkPart.ISource | string =
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
              l: IAutoMovieHumanArmWalk.ISiteLaw,
            ): IAutoMovieHumanWalkPart.ISite => ({
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
