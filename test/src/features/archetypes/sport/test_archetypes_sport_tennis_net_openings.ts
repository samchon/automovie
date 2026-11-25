import { buildTennisNet } from "@automovie/archetypes/internal";
import { createAutoMovieMeshRayCaster } from "@automovie/engine";
import type { IAutoMovieMeshRayCaster } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The doubles net emits open twine cells beneath its sagging band.
 *
 * Scenarios:
 * 1. The middle of a low cell passes rays from both sides, while the adjacent
 *    vertical strand blocks them.
 * 2. One height above the band near the middle passes rays. At the same height
 *    nearer the post the band blocks rays.
 * 3. The centre strap blocks rays well below the band.
 */
export function test_archetypes_sport_tennis_net_openings(): void {
  const halfSpan: number = 0.45;
  const centre: number = 0.9;
  const post: number = 1.1;
  const net: ReturnType<typeof buildTennisNet> = buildTennisNet(
    halfSpan,
    centre,
    post,
    0.008,
    0.05,
  );
  const twine: IAutoMovieMeshRayCaster = createAutoMovieMeshRayCaster(net.twine);
  const tape: IAutoMovieMeshRayCaster = createAutoMovieMeshRayCaster(net.tape);

  // A 450 mm half span gives ten cells at the 45 mm mesh pitch.
  const pitch: number = halfSpan / 10;
  const cases: readonly (readonly [
    IAutoMovieMeshRayCaster,
    number,
    number,
    boolean,
  ])[] = [
    [twine, 1.5 * pitch, 0.014, false],
    [twine, 2 * pitch, 0.014, true],
    [tape, 0.1, 1.03, false],
    [tape, 0.36, 1.03, true],
    [tape, 0, 0.26, true],
  ];
  for (const z of [-1, 1])
    for (const [mesh, x, y, solid] of cases)
      TestValidator.equals(
        `net section at (${x}, ${y}) from ${z}`,
        mesh.blocked([x, y, z], [0, 0, -z], 2),
        solid,
      );
}
