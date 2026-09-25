import type { IAutoMovieHumanFaceBasis } from "@automovie/human";

/**
 * The incisal edge vertices of a contact basis's dentition.
 *
 * `prepareDentalPosition` measures the resting display from them and
 * `fit-face-landmarks.ts` observes them against a photograph's teeth. The
 * contact's incisal pair is where the two crowns meet, which is not their
 * edges, so each edge is read from the crown that holds the pair's vertex:
 * the connected component of the dentition surface, its lowest vertex for
 * the upper crown and its highest for the lower. Refuses a basis without
 * contact and a pair on one component, whose edges cannot be told apart.
 * Pure: the basis is read, never mutated.
 */
export function faceIncisalEdges(basis: IAutoMovieHumanFaceBasis): {
  surface: string;
  upper: number;
  lower: number;
} {
  const contact = basis.contact;
  if (contact === undefined)
    throw new Error("Incisal edges need a contact basis.");
  const teeth = basis.surfaces.find(
    (one) => one.id === contact.incisors.surface,
  )!;
  const parent = Array.from(
    { length: teeth.positions.length / 3 },
    (_, index) => index,
  );
  const root = (vertex: number): number => {
    while (parent[vertex] !== vertex) vertex = parent[vertex]!;
    return vertex;
  };
  for (let t = 0; t < teeth.indices.length; t += 3)
    for (let k = 1; k < 3; ++k)
      parent[root(teeth.indices[t + k]!)] = root(teeth.indices[t]!);
  const upperRoot = root(contact.incisors.upper);
  const lowerRoot = root(contact.incisors.lower);
  if (upperRoot === lowerRoot)
    throw new Error("The incisal pair must lie on two separate crowns.");
  const y = (vertex: number) => teeth.positions[3 * vertex + 1]!;
  let upper = contact.incisors.upper;
  let lower = contact.incisors.lower;
  parent.forEach((_, vertex) => {
    const at = root(vertex);
    if (at === upperRoot && y(vertex) < y(upper)) upper = vertex;
    if (at === lowerRoot && y(vertex) > y(lower)) lower = vertex;
  });
  return { surface: teeth.id, upper, lower };
}
