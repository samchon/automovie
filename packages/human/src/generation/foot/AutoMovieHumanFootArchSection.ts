import { AutoMovieViewOutline } from "@automovie/engine";
import type {
  IAutoMovieHumanFootPart,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** The conic guides of the standing medial longitudinal arch. */
export namespace AutoMovieHumanFootArchSection {
  /**
   * Locate the plantar extremum and the medial half-breadth on the arch's
   * standing section. The original four conics retain their shoulder law. The
   * central-third interval comes from the standing scan protocol. Its midpoint
   * is an ESTIMATE for the person’s unmeasured longitudinal arch apex.
   *
   * @see https://doi.org/10.1186/s13047-021-00461-z Table 1 and figure 3 give standing arch height, width and the 60-degree plantar cutoff.
   */
  export function fullness(
    input: IAutoMovieHumanFootPart.IInput,
    part: Pick<IAutoMovieViewPart, "front" | "side" | "stations" | "fullness">,
  ): IAutoMovieViewPart.Fullness {
    if (input.metatarsal === undefined || part.fullness.kind !== "shoulder")
      return part.fullness;
    const bottom = part.stations[0]!;
    const top = part.stations.at(-1)!;
    const start = input.length / 3;
    const peak = input.length / 2;
    const end = Math.min((2 * input.length) / 3, input.metatarsal.span[0]);
    if (!(bottom < start && start < peak && peak < end && end < top))
      return part.fullness;

    const medial = input.side === "left" ? 1 : -1;
    const positive = AutoMovieViewOutline.create(part.side.positive, {
      bottom,
      top,
    });
    const negative = AutoMovieViewOutline.create(part.side.negative, {
      bottom,
      top,
    });
    const dorsal = AutoMovieViewOutline.create(
      input.dorsal ?? part.front.positive,
      { bottom, top },
    );
    if ("detail" in positive || "detail" in negative || "detail" in dorsal)
      return part.fullness;
    const upper = AutoMovieViewOutline.value(positive, peak);
    const lower = AutoMovieViewOutline.value(negative, peak);
    const roof = AutoMovieViewOutline.value(dorsal, peak);
    if (
      typeof upper === "string" ||
      typeof lower === "string" ||
      typeof roof === "string"
    )
      return part.fullness;
    const width = upper - lower;
    const height = HEIGHT * input.length;
    const depth = DEPTH * width;

    // For an elliptical quadrant, its contact-to-cutoff width and height are
    // C = B sin(theta), H = D (1 - cos(theta)). Its cutoff slope is
    // m = (D/B) tan(theta), so q = cos(theta) = H / (m C - H).
    const cosine = height / (Math.sqrt(3) * depth - height);
    if (!(cosine > 0 && cosine < 1)) return part.fullness;
    const span = depth / Math.sqrt(1 - cosine * cosine);
    const arch = height / (1 - cosine);
    if (!(span < width && arch < input.height + roof)) return part.fullness;

    const plantar = (medial === 1 ? upper : lower) - medial * span;
    const outline = (value: number): IAutoMovieViewPart.IOutline => ({
      knots: [
        { site: "heel pole", station: bottom, value: 0 },
        { site: "rear arch support", station: start, value: 0 },
        { site: "midfoot arch", station: peak, value },
        { site: "fore arch support", station: end, value: 0 },
        { site: "forefoot pole", station: top, value: 0 },
      ].map((knot) => ({ ...knot, jet: { first: 0, second: 0 } })),
    });
    const zero = outline(0);
    const side = outline(arch - input.height);
    const shoulder = part.fullness.shoulder;
    return {
      kind: "top",
      shoulders: [shoulder, shoulder, shoulder, shoulder],
      touch: [
        zero,
        medial === 1 ? side : zero,
        outline(plantar),
        medial === -1 ? side : zero,
      ],
    };
  }
}

/** Pooled left/right median arch height over foot length (7.3% and 7.2%). */
const HEIGHT: number = 0.0725;

/** Pooled left/right median arch depth over midfoot width (55% and 54%). */
const DEPTH: number = 0.545;
