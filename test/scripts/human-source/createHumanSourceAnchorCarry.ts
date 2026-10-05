import type { IAutoMovieHumanBodyBasis } from "@automovie/human/body/structures/IAutoMovieHumanBodyBasis";

/**
 * The rigid carry of the head under a body endpoint: the mean displacement of
 * the anchor landmarks (the two eye joints), summed and then divided by their
 * count. Head-partition rows are stored relative to it, so the head moves with
 * the body as one piece and only its own deformation is written as rows. Every
 * stage reads the carry here, so a head row and its check subtract the same
 * value. With no anchor landmarks the carry is zero; a named landmark the body
 * does not have is refused.
 */
export function createHumanSourceAnchorCarry(body: IAutoMovieHumanBodyBasis, landmarks: readonly string[]): (name: string) => number[] {
  const indices = landmarks.map((id) => {
    const index = body.landmarks.ids.indexOf(id);
    if (index < 0) throw new Error(`The body has no anchor landmark ${id}.`);
    return index;
  });
  return (name) => {
    if (indices.length === 0) return [0, 0, 0];
    const rows = body.landmarks.targets[name] ?? [];
    const sum = [0, 0, 0];
    for (let i = 0; i < rows.length; i += 4) if (indices.includes(rows[i])) for (let c = 0; c < 3; c++) sum[c] += rows[i + 1 + c];
    return sum.map((x) => x / indices.length);
  };
}
