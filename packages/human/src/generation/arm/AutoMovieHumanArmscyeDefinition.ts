import { AutoMovieIllinois } from "@automovie/engine";
import type {
  IAutoMovieConstructionPort,
  IAutoMovieLoftViewFullSource,
  IAutoMovieViewPart,
} from "@automovie/interface";

/** Declare a lateral shoulder port on the actual trunk and arm originals. */
export namespace AutoMovieHumanArmscyeDefinition {
  /** The conic in world millimetres and its registered native chart. */
  export interface IInput {
    /** Original trunk and arm whose exterior faces the port joins. */
    host: IAutoMovieViewPart;
    /** Original arm with its protected outlet section. */
    arm: IAutoMovieViewPart;
    /** Reader of the same trunk original. */
    wall: IAutoMovieLoftViewFullSource.IReader;
    /** Conic centre in the trunk's station and phase coordinates. */
    centre: [number, number];
    /** Fore-aft position of the conic's centre line at a trunk level. */
    centreX(station: number): number;
    /** Vertical half extent in mm. */
    height: number;
    /** Signed anteroposterior half extent in mm. */
    radius: number;
    /** Half extent in the parent chart's angle, radians. */
    phaseExtent: number;
    /** The original arm's anatomical side. */
    side: "left" | "right";
    /** Start of the arm original below its proximal articulation, mm. */
    start: number;
    /** First retained original arm section, mm. */
    outlet: number;
    /** Number of longitudinal rows supplied by the band's physical span. */
    rows: number;
    /** Optional measured acromial constraint on the superior meridian. */
    meridian?: IAutoMovieConstructionPort.IMeridian;
  }

  /** Solve the world conic on each bounded ray of the parent chart. */
  export function create(input: IInput): IAutoMovieConstructionPort {
    const {
      host,
      arm,
      wall,
      centre,
      centreX,
      height,
      radius,
      phaseExtent,
      side,
      start,
      outlet,
      rows,
      meridian,
    } = input;
    const sense: 1 | -1 = side === "left" ? -1 : 1;
    const minimum: number = side === "left" ? 0 : Math.PI;
    const maximum: number = minimum + Math.PI;
    const count: number = arm.samples;
    const shape: number[] = Array.from({ length: count }, (_, i): number => {
      const clock: number = (2 * Math.PI * i) / count;
      const dy: number = height * Math.cos(clock);
      const dp: number = sense * phaseExtent * Math.sin(clock);
      const limit: number = Math.min(
        height / Math.abs(dy),
        (dp < 0 ? centre[1] - minimum : maximum - centre[1]) / Math.abs(dp),
      );
      const level = (scale: number): number => {
        const y: number = centre[0] + scale * dy;
        const x: number = wall.point(y, centre[1] + scale * dp)[0];
        return (
          ((y - centre[0]) / height) ** 2 + ((x - centreX(y)) / radius) ** 2 - 1
        );
      };
      if (Math.abs(level(limit)) < 1e-10) return limit;
      const scale: number | null = AutoMovieIllinois.root(
        level,
        0,
        limit,
        1e-9,
        64,
      );
      if (scale === null || Math.abs(level(scale)) > 1e-7)
        throw new Error(
          `The stock port chart has no bounded opening at clock ${clock}`,
        );
      return scale;
    });
    return {
      type: "port",
      name: `port.${arm.name}`,
      host: { type: "source", name: host.name, source: host.name },
      part: { type: "source", name: arm.name, source: arm.name },
      hostFace: host.name,
      partFace: arm.name,
      band: `blend.${arm.name}.${host.name}`,
      loop: {
        centre: [centre[0] / 1000, centre[1]],
        semi: [height / 1000, phaseExtent],
        sense,
        shape,
      },
      partEnd: "bottom",
      rail: (outlet - start) / 1000,
      correspondence: "length",
      ribbons: "column",
      count,
      rows,
      ...(meridian === undefined ? {} : { meridian }),
    };
  }
}
