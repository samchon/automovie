import { AutoMovieHumanLandmarkSurface as L } from "@automovie/human";

/**
 * A dividing surface through landmarks about a centre is a graph over the landmarks' least-squares plane that passes through every
 * landmark, with its far side toward the given point.
 *
 * Scenarios, millimetres:
 * 1. Four landmarks in the plane `z = 5`, at (10, 0), (0, 10), (-10, 0) and (0, -10) about the centre (0, 0, 2), far side toward
 *    (0, 0, 100): the surface is that plane. Its origin is the centre's foot (0, 0, 5), its normal (0, 0, 1), and the side of (3, 4, 9),
 *    (30, -7, 5) and (1, 1, -2) is 4, 0 and -7, within 1e-12.
 * 2. The same with the far side toward (0, 0, -100): the normal is (0, 0, -1) and the three sides are -4, 0 and 7.
 * 3. One landmark lifted: (10, 0, 5 + 3) in place of the first. The plane tilts, and the surface still passes through all four
 *    landmarks: the side of each is 0 within 1e-9. Midway in phase between two landmarks the side of the point on their chord is not 0:
 *    the offset there is the periodic cubic's, not the chord's, and stands off by more than 1e-3.
 * 4. Refusals: two landmarks alone; three landmarks of which two stand at one phase about the centre; a centre whose foot is a landmark.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanLandmarkSurface.create` and reads its origin, normal and side. It catches a normal left unoriented, an origin left at the centre, a surface that misses a landmark and a refusal that does not happen.
 * @evidence contracts/development/testing.md#independent-expectations A plane's signed distance and the statement that an interpolating graph is zero at its nodes are written here without the module's spline.
 * @evidence contracts/development/common.md#meaningful-documentation A planar landmark set checks orientation and signed distance. Moving one landmark exercises interpolation, while malformed landmark arrangements must refuse.
 */
export function test_human_landmark_surface(): void {
  const failures: string[] = [];
  const near = (label: string, a: readonly number[], b: readonly number[], limit: number): void => {
    const error: number = Math.max(...a.map((x: number, i: number): number => Math.abs(x - b[i]!)));
    if (!(error <= limit) || a.length !== b.length) failures.push(`${label}: ${JSON.stringify(a)} against ${JSON.stringify(b)} (error ${error})`);
  };
  const flat: number[][] = [[10, 0, 5], [0, 10, 5], [-10, 0, 5], [0, -10, 5]];
  const probes: number[][] = [[3, 4, 9], [30, -7, 5], [1, 1, -2]];

  // 1 and 2: a plane, both ways.
  const up: L.ISurface = L.create([0, 0, 2], flat, [0, 0, 100]);
  near("origin", up.origin, [0, 0, 5], 1e-12);
  near("normal", up.normal, [0, 0, 1], 1e-12);
  near("sides", probes.map(up.side), [4, 0, -7], 1e-12);
  const down: L.ISurface = L.create([0, 0, 2], flat, [0, 0, -100]);
  near("normal reversed", down.normal, [0, 0, -1], 1e-12);
  near("sides reversed", probes.map(down.side), [-4, 0, 7], 1e-12);

  // 3: one landmark lifted.
  const lifted: number[][] = [[10, 0, 8], ...flat.slice(1)];
  const bent: L.ISurface = L.create([0, 0, 2], lifted, [0, 0, 100]);
  near("through every landmark", lifted.map(bent.side), [0, 0, 0, 0], 1e-9);
  const chord: number[] = [5, 5, 6.5];
  if (!(Math.abs(bent.side(chord)) > 1e-3)) failures.push(`the lifted surface holds the chord's middle: side ${bent.side(chord)}`);

  // 4: refusals.
  const refused = (label: string, build: () => unknown, text: string): void => {
    try {
      build();
      failures.push(`${label}: not refused`);
    } catch (error) {
      if (!(error instanceof Error && error.message.includes(text))) failures.push(`${label}: refused with ${String(error)}`);
    }
  };
  refused("two landmarks", (): unknown => L.create([0, 0, 0], flat.slice(0, 2), [0, 0, 1]), "at least three");
  refused("one phase", (): unknown => L.create([0, 0, 2], [[10, 0, 5], [20, 0, 5], [0, 10, 5]], [0, 0, 100]), "one phase");
  refused("centre on a landmark", (): unknown => L.create([10, 0, 9], flat, [0, 0, 100]), "stands on a landmark");

  if (failures.length > 0) throw new Error(`landmark surface: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
