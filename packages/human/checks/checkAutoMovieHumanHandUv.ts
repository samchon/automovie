import { AUTOMOVIE_HUMAN_UV_LAYOUT } from "../src/junction/AUTOMOVIE_HUMAN_UV_LAYOUT";
import { AutoMovieHumanSide } from "../src/junction/AutoMovieHumanSide";
import { AutoMovieHumanUvLayout } from "../src/junction/AutoMovieHumanUvLayout";
import { IAutoMovieHumanCage } from "../src/junction/IAutoMovieHumanCage";
import { IAutoMovieHumanSurfaceCoordinate } from "../src/junction/IAutoMovieHumanSurfaceCoordinate";
import { AutoMovieHumanConverter } from "../src/measure/AutoMovieHumanConverter";
import { IAutoMovieHumanMeasurements } from "../src/measure/IAutoMovieHumanMeasurements";
import { resolveAutoMovieHumanMeasurements } from "../src/measure/resolveAutoMovieHumanMeasurements";
import { AutoMovieHumanHandGenerator } from "../src/parts/hand/AutoMovieHumanHandGenerator";
import { IAutoMovieHumanSkeleton } from "../src/skeleton/IAutoMovieHumanSkeleton";
import { generateAutoMovieHumanSkeleton } from "../src/skeleton/generateAutoMovieHumanSkeleton";
import { IAutoMovieHumanIdentity } from "../src/structures/IAutoMovieHumanIdentity";
import { IAutoMovieHumanTraits } from "../src/structures/IAutoMovieHumanTraits";
/**
 * Refuse a hand atlas that changes with identity, has zero-area or folded faces, leaves its published chart, or overlaps itself.
 *
 * Scenarios:
 * 1. The four lean twenty-year-old gates have different physical positions but identical per-side UV coordinates and connectivity.
 * 2. Both handedness paths keep every face in its published rectangle with nonzero, consistently oriented triangles.
 * 3. The full emitted hand chart has no positive-area triangle intersections, including planar caps whose half-turn endpoints a tube mapper would fold.
 *
 * This is the Human build's portable geometry check, called by the junction check. It checks coarse texture coordinates, not anatomical form, texture filtering, the joined limit surface or visual gates.
 */
export function checkAutoMovieHumanHandUv(): void {
    const converter: AutoMovieHumanConverter = new AutoMovieHumanConverter();
    const generator: AutoMovieHumanHandGenerator = new AutoMovieHumanHandGenerator();
    const expected: Map<AutoMovieHumanSide, IAutoMovieHumanCage> = new Map();
    const geometry: Map<AutoMovieHumanSide, Set<string>> = new Map([
        ["left", new Set()],
        ["right", new Set()],
    ]);
    for (const gate of GATES) {
        const identity: IAutoMovieHumanIdentity = converter.toIdentity({
            version: 1,
            sex: gate.sex,
            age: 20,
            stature: gate.stature,
            population: gate.population,
            build: {
                adiposity: -1,
                muscularity: gate.muscularity,
                slimness: 0,
                cuteness: 0,
            },
        });
        const measurements: IAutoMovieHumanMeasurements = resolveAutoMovieHumanMeasurements(identity);
        const skeleton: IAutoMovieHumanSkeleton = generateAutoMovieHumanSkeleton(measurements);
        for (const side of ["left", "right"] as const) {
            const cage: IAutoMovieHumanCage = generator.generate({
                measurements,
                skeleton,
                side,
            });
            geometry.get(side)!.add(JSON.stringify(cage.vertices));
            const baseline: IAutoMovieHumanCage | undefined = expected.get(side);
            if (baseline === undefined) {
                inspect(cage, side);
                expected.set(side, cage);
            }
            else {
                if (cage.faces.length !== baseline.faces.length)
                    throw new Error(`hand ${side} UV topology changes with identity`);
                cage.faces.forEach((face: IAutoMovieHumanCage.IFace, index: number): void => {
                    const previous: IAutoMovieHumanCage.IFace = baseline.faces[index]!;
                    if (face.vertices.some((vertex: number, corner: number): boolean => vertex !== previous.vertices[corner]))
                        throw new Error(`hand ${side} face ${index} connectivity changes with identity`);
                    if (face.uvs === undefined ||
                        previous.uvs === undefined ||
                        face.uvs.some((uv: Pair, corner: number): boolean => uv.some((value: number, component: number): boolean => value !== previous.uvs![corner]![component])))
                        throw new Error(`hand ${side} face ${index} UV changes with identity`);
                });
            }
        }
    }
    for (const [side, variants] of geometry)
        if (variants.size !== GATES.length)
            throw new Error(`hand ${side} gate geometry did not distinguish the identity cases`);
}
/** Check one identity because all following identities must emit exactly these UV values. */
const inspect: (cage: IAutoMovieHumanCage, side: AutoMovieHumanSide) => void = (cage: IAutoMovieHumanCage, side: AutoMovieHumanSide): void => {
    const triangles: Triangle[] = [];
    for (const face of cage.faces) {
        const coordinate: IAutoMovieHumanSurfaceCoordinate = face.coordinates[0];
        const chart: AutoMovieHumanUvLayout.IChart | undefined = AUTOMOVIE_HUMAN_UV_LAYOUT.charts.find((candidate: AutoMovieHumanUvLayout.IChart): boolean => candidate.part === "hand" &&
            candidate.side === side &&
            candidate.branch === (coordinate.branch ?? null));
        const uv: IAutoMovieHumanCage.IFace["uvs"] = face.uvs;
        if (chart === undefined || uv === undefined)
            throw new Error(`hand ${side} has no explicit UV chart`);
        for (const point of uv)
            if (point[0] < chart.x - ROUNDING ||
                point[0] > chart.x + chart.width + ROUNDING ||
                point[1] < chart.y - ROUNDING ||
                point[1] > chart.y + chart.height + ROUNDING)
                throw new Error(`hand ${side} UV leaves its published rectangle`);
        const first: Triangle = [uv[0], uv[1], uv[2]];
        const second: Triangle = [uv[0], uv[2], uv[3]];
        if (Math.abs(area(first)) <= ROUNDING ||
            Math.abs(area(second)) <= ROUNDING ||
            area(first) * area(second) < 0)
            throw new Error(`hand ${side} UV face collapses or folds`);
        triangles.push(first, second);
    }
    for (let first: number = 0; first < triangles.length; ++first)
        for (let second: number = first + 1; second < triangles.length; ++second)
            if (intersects(triangles[first]!, triangles[second]!))
                throw new Error(`hand ${side} UV triangles ${first}/${second} overlap`);
};
/** Twice the signed texture area, independent of surface geometry. */
const area: ([a, b, c]: Triangle) => number = ([a, b, c]: Triangle): number => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
/** Separating axes distinguish positive-area intersection from an allowed shared edge or corner. */
const intersects: (a: Triangle, b: Triangle) => boolean = (a: Triangle, b: Triangle): boolean => {
    if (Math.max(...a.map((point: Pair): number => point[0])) <=
        Math.min(...b.map((point: Pair): number => point[0])) ||
        Math.max(...b.map((point: Pair): number => point[0])) <=
            Math.min(...a.map((point: Pair): number => point[0])) ||
        Math.max(...a.map((point: Pair): number => point[1])) <=
            Math.min(...b.map((point: Pair): number => point[1])) ||
        Math.max(...b.map((point: Pair): number => point[1])) <=
            Math.min(...a.map((point: Pair): number => point[1])))
        return false;
    for (const triangle of [a, b])
        for (let edge: number = 0; edge < 3; ++edge) {
            const x: number = triangle[(edge + 1) % 3]![1] - triangle[edge]![1];
            const y: number = triangle[edge]![0] - triangle[(edge + 1) % 3]![0];
            const first: number[] = a.map((point: Pair): number => x * point[0] + y * point[1]);
            const second: number[] = b.map((point: Pair): number => x * point[0] + y * point[1]);
            if (Math.min(Math.max(...first), Math.max(...second)) -
                Math.max(Math.min(...first), Math.min(...second)) <=
                ROUNDING)
                return false;
        }
    return true;
};
type Pair = [
    number,
    number
];
type Triangle = [
    Pair,
    Pair,
    Pair
];
/** Unit-atlas roundoff bound; not an anatomical or fitting tolerance. */
const ROUNDING: number = 1e-14;
/** The campaign's four fixed lean-adult gate inputs. */
const GATES: Array<{
    sex: IAutoMovieHumanTraits["sex"];
    stature: number;
    population: IAutoMovieHumanTraits["population"];
    muscularity: number;
}> = [
    { sex: "female", stature: 1779, population: "eastAsian", muscularity: -0.59 },
    { sex: "male", stature: 1870, population: "european", muscularity: -0.251 },
    { sex: "female", stature: 1661, population: "european", muscularity: 0.409 },
    { sex: "male", stature: 1816, population: "european", muscularity: 0.127 },
];
