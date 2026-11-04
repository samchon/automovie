import { AutoMovieSolidChain, type IAutoMovieLoftChain, type IAutoMovieSolidSurface } from "@automovie/engine";
import type { IAutoMovieHumanBodyCalibration } from "../../../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * The body lane's realized body is finite: every face it names is a published
 * chain with jets, and every shared boundary point evaluates to a finite world
 * point on its chain. A non-finite point anywhere leaves the whole figure's
 * bounds non-finite, and the viewer frames nothing.
 *
 * @evidence contracts/testing.md#behavioral-verification Calibrates each person of the run's set (`AutoMovieHumanBodyLaw.calibrate` through `HumanPeople.person`) and reads `calibration.bodies`: each face's chain is found in `calibration.chains` and reads as a solid surface (`AutoMovieSolidChain.surface`), and each body point's jet at its chart point is finite. Every failure is listed by person, body, chain and point index.
 * @evidence contracts/testing.md#independent-expectations Finiteness is the whole expectation: a world point of a solid's boundary is a real number on every axis, independent of any law that placed it.
 * @evidence contracts/testing.md#distinguishing-cases A face naming no published chain, a chain without jets, and a boundary point evaluating to NaN or an infinity each fail with their names; a person with no body passes trivially.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_limb_piece_body_finite`, generating the run's people on the CPU; no browser or GPU.
 */
export function test_human_limb_piece_body_finite(): void {
  const failures: string[] = [];
  for (const name of HumanPeople.names()) {
    const body: IAutoMovieHumanBodyCalibration = HumanPeople.person(name).body;
    const chains: Map<string, IAutoMovieLoftChain> = new Map(body.chains.map((c: IAutoMovieLoftChain): [string, IAutoMovieLoftChain] => [c.name, c]));
    const surfaces: Map<string, IAutoMovieSolidSurface | null> = new Map();
    const surface = (chain: string): IAutoMovieSolidSurface | null => {
      if (!surfaces.has(chain)) {
        const c: IAutoMovieLoftChain | undefined = chains.get(chain);
        surfaces.set(chain, c === undefined ? null : AutoMovieSolidChain.surface(c));
      }
      return surfaces.get(chain)!;
    };
    for (const b of body.bodies ?? []) {
      for (const f of b.faces) if (surface(f.chain) === null) failures.push(`${name} ${b.name}: face ${f.chain} is no published chain with jets`);
      b.points.forEach((p: { chain: string; chart: [number, number] }, i: number): void => {
        const s: IAutoMovieSolidSurface | null = surface(p.chain);
        if (s === null) {
          failures.push(`${name} ${b.name}: point ${i} on ${p.chain}, no published chain with jets`);
          return;
        }
        const q: readonly number[] = s.jet(p.chart[0], p.chart[1]).p;
        if (!q.every(Number.isFinite)) failures.push(`${name} ${b.name}: point ${i} on ${p.chain} at [${p.chart.join(", ")}] evaluates to [${q.join(", ")}]`);
      });
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} non-finite body findings:\n${failures.slice(0, 200).join("\n")}`);
}
