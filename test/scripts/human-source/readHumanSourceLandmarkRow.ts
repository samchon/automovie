import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

/** One body landmark's displacement under a body endpoint at weight one; zero where the endpoint has no row for it. */
export function readHumanSourceLandmarkRow(body: IAutoMovieHumanBodyBasis, name: string, index: number): number[] {
  const rows = body.landmarks.targets[name] ?? [];
  for (let i = 0; i < rows.length; i += 4) if (rows[i] === index) return rows.slice(i + 1, i + 4);
  return [0, 0, 0];
}
