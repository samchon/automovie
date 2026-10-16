import { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanFootPlan } from "./IAutoMovieHumanFootPlan";

/**
 * Each toenail's extent: from where its proximal fold begins to its free edge, as fractions of the toe's length from its joint, and its breadth over the toe's breadth, hallux then the lesser toes. The plate covers the distal phalanx's back, broadest on the hallux. Grade: conventional, set against renders and photographs.
 */
const NAIL: Record<
  "hallux" | "lesser",
  { from: number; to: number; breadth: number }
> = {
  hallux: { from: 0.74, to: 0.975, breadth: 0.72 },
  lesser: { from: 0.8, to: 0.975, breadth: 0.62 },
};

/** Plate surface above the skin and its underside below it, millimetres: the plate stands proud of the nail folds by a little under a millimetre over about 1.4 mm of hallux nail. Grade: conventional. */
const PLATE: { above: number; below: number } = { above: 0.9, below: 0.5 };

/** Vertices along and across a plate's top and bottom grids. */
const GRID: { along: number; across: number } = { along: 5, across: 5 };

/**
 * Place a nail plate on the back of each toe, on the skin the foot's cage produces.
 *
 * Each plate's grid points are found by casting rays from the toe's distal axis across its dorsal side onto the refined skin, so the plate follows the skin's own curvature across and along the toe; the top grid stands just above the skin and the bottom grid just below it, and their borders close the plate as one quad cage. The proximal row narrows into the curve of the nail fold.
 *
 * @param props.plan The foot's plan, for each toe's breadth
 * @param props.axes Each toe's axis as the lofted toe's spine holds it, in the foot's local frame
 * @param props.skin The final emitted skin projected through the shared local frame
 * @returns One closed quad cage per toe, hallux first, local frame, winding outward
 */
export function placeAutoMovieHumanFootNails(props: {
  plan: IAutoMovieHumanFootPlan;
  axes: Array<{ fractions: number[]; centres: IAutoMovieVector3[] }>;
  skin: {
    project: (
      origin: IAutoMovieVector3,
      direction: IAutoMovieVector3,
    ) => number | null;
  };
}): Array<{
  positions: IAutoMovieVector3[];
  quads: Array<[number, number, number, number]>;
}> {
  const V: typeof AutoMovieHumanVector = AutoMovieHumanVector;
  return props.plan.toes.map(
    (
      toe: IAutoMovieHumanFootPlan.IToe,
      t: number,
    ): {
      positions: IAutoMovieVector3[];
      quads: [number, number, number, number][];
    } => {
      const nail: { from: number; to: number; breadth: number } = toe.hallux
        ? NAIL.hallux
        : NAIL.lesser;
      const {
        fractions,
        centres,
      }: { fractions: number[]; centres: IAutoMovieVector3[] } = props.axes[t]!;
      // the toe's axis through its centres, read at a fraction of the toe's length
      const along: (s: number) => {
        origin: IAutoMovieVector3;
        axis: IAutoMovieVector3;
      } = (
        s: number,
      ): { origin: IAutoMovieVector3; axis: IAutoMovieVector3 } => {
        let k: number = 0;
        while (k + 2 < fractions.length && fractions[k + 1]! < s) ++k;
        const a: number = fractions[k]!;
        const b: number = fractions[k + 1]!;
        const w: number = (s - a) / (b - a);
        return {
          origin: V.offset(centres[k]!, [
            V.offset(centres[k + 1]!, [centres[k]!, -1]),
            w,
          ]),
          axis: V.normalize(V.offset(centres[k + 1]!, [centres[k]!, -1])),
        };
      };
      const width: number = nail.breadth * toe.width;
      const middle: { origin: IAutoMovieVector3; axis: IAutoMovieVector3 } =
        along((nail.from + nail.to) / 2);
      const across: IAutoMovieVector3 = V.normalize(
        V.cross(V.of(0, 1, 0), middle.axis),
      );
      const dorsal: IAutoMovieVector3 = V.normalize(
        V.cross(middle.axis, across),
      );
      const radius: number | null = props.skin.project(middle.origin, dorsal);
      if (radius === null || !(radius > 0))
        throw new Error(`Toenail ${t} centre ray misses the emitted skin`);
      const half: number = Math.min(1.2, width / 2 / radius);
      const top: IAutoMovieVector3[] = [];
      const bottom: IAutoMovieVector3[] = [];
      for (let i: number = 0; i < GRID.along; ++i) {
        const origin: IAutoMovieVector3 = along(
          nail.from + ((nail.to - nail.from) * i) / (GRID.along - 1),
        ).origin;
        for (let j: number = 0; j < GRID.across; ++j) {
          const angle: number =
            half * (i === 0 ? 0.8 : 1) * (2 * (j / (GRID.across - 1)) - 1);
          const ray: IAutoMovieVector3 = V.offset(
            V.of(0, 0, 0),
            [dorsal, Math.cos(angle)],
            [across, Math.sin(angle)],
          );
          const hit: number | null = props.skin.project(origin, ray);
          if (hit === null || !(hit > 0))
            throw new Error(`Toenail ${t} grid ray misses the emitted skin`);
          top.push(V.offset(origin, [ray, hit + PLATE.above]));
          bottom.push(V.offset(origin, [ray, hit - PLATE.below]));
        }
      }
      const positions: IAutoMovieVector3[] = [...top, ...bottom];
      const index: (layer: number, i: number, j: number) => number = (
        layer: number,
        i: number,
        j: number,
      ): number => layer * GRID.along * GRID.across + i * GRID.across + j;
      const quads: Array<[number, number, number, number]> = [];
      for (let i: number = 0; i + 1 < GRID.along; ++i)
        for (let j: number = 0; j + 1 < GRID.across; ++j) {
          quads.push([
            index(0, i, j),
            index(0, i, j + 1),
            index(0, i + 1, j + 1),
            index(0, i + 1, j),
          ]);
          quads.push([
            index(1, i, j),
            index(1, i + 1, j),
            index(1, i + 1, j + 1),
            index(1, i, j + 1),
          ]);
        }
      const rim: Array<[number, number]> = [];
      for (let j: number = 0; j + 1 < GRID.across; ++j) rim.push([0, j]);
      for (let i: number = 0; i + 1 < GRID.along; ++i)
        rim.push([i, GRID.across - 1]);
      for (let j: number = GRID.across - 1; j > 0; --j)
        rim.push([GRID.along - 1, j]);
      for (let i: number = GRID.along - 1; i > 0; --i) rim.push([i, 0]);
      rim.forEach(([i, j]: [number, number], k: number): void => {
        const [p, q]: [number, number] = rim[(k + 1) % rim.length]!;
        quads.push([
          index(0, p, q),
          index(0, i, j),
          index(1, i, j),
          index(1, p, q),
        ]);
      });
      // wind every quad so its normal leaves the plate: the top grid's faces away from the toe's axis
      const first: [number, number, number, number] = quads[0]!;
      const normal: IAutoMovieVector3 = V.cross(
        V.offset(positions[first[1]]!, [positions[first[0]]!, -1]),
        V.offset(positions[first[3]]!, [positions[first[0]]!, -1]),
      );
      const outward: boolean = V.dot(normal, dorsal) > 0;
      return {
        positions,
        quads: outward
          ? quads
          : quads.map(
              ([a, b, c, d]: [number, number, number, number]): [
                number,
                number,
                number,
                number,
              ] => [a, d, c, b],
            ),
      };
    },
  );
}
