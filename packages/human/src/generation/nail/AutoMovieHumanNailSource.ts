import { AutoMovieSolidVector as Vec } from "@automovie/engine";
import type {
  IAutoMovieHumanBodyLaw,
  IAutoMovieHumanDigitNails,
  IAutoMovieHumanHandBones,
  IAutoMovieHumanNail,
  IAutoMovieLoftContract,
  IAutoMovieSolidBody,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import { AutoMovieHumanDigitNails as Nails } from "./AutoMovieHumanDigitNails";

/** Distal placement from the generating digit and the person's own skeleton. */
export namespace AutoMovieHumanNailSource {
  /** The four human finger keys, in anatomical order. */
  const FINGERS: readonly IAutoMovieHumanHandBones.Finger[] = [
    "Index",
    "Middle",
    "Ring",
    "Little",
  ];

  /** Use only the originals with a retained face in the actual body. */
  export function collect(
    definition: IAutoMovieHumanBodyLaw.IDefinition,
    bodies: readonly IAutoMovieSolidBody.IPublished[],
    diagnostics: IAutoMovieLoftContract.IDiagnostic[],
  ): IAutoMovieHumanDigitNails.IPlaced[] {
    const retained: Set<string> = new Set(
      bodies.flatMap(({ faces }): string[] =>
        faces.map(({ chain }): string => chain),
      ),
    );
    const sources: IAutoMovieHumanDigitNails.IPlaced[] = [];
    const add = (
      name: string,
      place: (source: IAutoMovieViewPart) => IAutoMovieHumanDigitNails.IPlaced,
    ): void => {
      if (!retained.has(name)) return;
      try {
        const source: IAutoMovieViewPart | undefined =
          definition.lane.sourceParts.get(name);
        if (source === undefined)
          throw new Error("No retained original source");
        sources.push(place(source));
      } catch (error: unknown) {
        diagnostics.push({
          producer: `nail.${name}`,
          level: 7,
          contract: "native distal placement",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    };
    const rest = definition.prepared.limbRest();
    for (const side of ["left", "right"] as const) {
      const hand: IAutoMovieHumanHandBones.IOutput = definition.hands[side];
      for (const ray of FINGERS)
        add(`finger.${side}.${ray.toLowerCase()}`, (source) =>
          finger(source, hand.fingers[ray].centres),
        );
      add(`thumb.${side}`, (source) => finger(source, hand.thumb.centres));
      const leg = rest.leg(side);
      for (const [index, joints] of leg.foot.toes.entries())
        add(`toe.${side}.${index + 1}`, (source) =>
          toe(
            source,
            joints.map((p): P3 => Vec.add(p, [leg.shift[0], 0, leg.shift[1]])),
            index,
          ),
        );
    }
    return sources;
  }

  /** The finger original names the DIP or thumb IP station in its own clock. */
  export function finger(
    source: IAutoMovieViewPart,
    centres: readonly P3[],
  ): IAutoMovieHumanDigitNails.IPlaced {
    const joint: number | undefined = source.front.positive.knots.find(
      ({ site }): boolean => site === `joint ${centres.length - 2}`,
    )?.station;
    if (joint === undefined)
      throw new Error("Missing named distal joint in " + source.name);
    const ray: string = source.name.split(".").at(-1)!;
    const digit: string = source.name.startsWith("thumb.")
      ? "finger.thumb"
      : `finger.${ray === "little" ? "pinky" : ray}`;
    return {
      original: { digit, source, jointDistance: (s): number => s - joint },
      frame: frame(centres, source.axis.at(joint).u),
    };
  }

  /** Project the world distal bone onto the toe's parallel station planes. */
  export function toe(
    source: IAutoMovieViewPart,
    centres: readonly P3[],
    index: number,
  ): IAutoMovieHumanDigitNails.IPlaced {
    const first = source.axis.at(0);
    const along: P3 = Vec.cross(first.v, first.u);
    const placed: IAutoMovieHumanNail.IFrame = frame(centres, first.u);
    const centre: number = Vec.dot(Vec.sub(placed.origin, first.origin), along);
    const projection: number = Vec.dot(placed.distal, along);
    if (!(projection > 0))
      throw new Error("Distal bone reverses the toe's section planes");
    const digit: string = Nails.ROWS.filter(({ digit }): boolean =>
      digit.startsWith("toe."),
    )[index]!.digit;
    return {
      original: {
        digit,
        source,
        jointDistance: (s): number => (s - centre) / projection,
      },
      frame: placed,
    };
  }

  /** The last joint, terminal bone and the same source's projected dorsal. */
  function frame(centres: readonly P3[], hint: P3): IAutoMovieHumanNail.IFrame {
    const origin: P3 = centres.at(-2)!;
    const distal: P3 | null = Vec.unit(Vec.sub(centres.at(-1)!, origin));
    const dorsal: P3 | null =
      distal === null
        ? null
        : Vec.unit(Vec.sub(hint, Vec.scale(distal, Vec.dot(hint, distal))));
    if (distal === null || dorsal === null)
      throw new Error("Distal nail frame is singular");
    return { origin, distal, dorsal };
  }
}
