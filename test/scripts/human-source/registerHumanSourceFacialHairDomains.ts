import type { IAutoMovieHumanFaceBasis } from "@automovie/human/face/structures/IAutoMovieHumanFaceBasis";
import type { IAutoMovieHumanFaceFacialHairSite } from "@automovie/human/face/structures/IAutoMovieHumanFaceFacialHairSite";
import type { IAutoMovieHumanFaceHairDomain } from "@automovie/human/face/structures/IAutoMovieHumanFaceHairDomain";

import type { IHumanSourceFacialHairDomainObservation } from "./structures/IHumanSourceFacialHairDomainObservation.ts";

import type { IHumanSourceFacialHairDomainRegistration } from "./structures/IHumanSourceFacialHairDomainRegistration.ts";

/**
 * Author seven visible-shaft territories on the registered neutral native skin.
 *
 * These are prototype source markings, not inferred follicles or clinical beard
 * boundaries. The moustache uses the subnasal/subalar and upper-vermilion
 * landmarks; chin uses the lower lip, mouth corners and gnathion. Lateral
 * territories lie below the cheilion-tragion line, split at lower-lip height
 * into cheek and jaw. The tragion depth limits them to the anterior skin.
 * The latter line is a stated authoring convention, not a universal beardline:
 * https://pubmed.ncbi.nlm.nih.gov/34699440/ studied photographs of 32 men and
 * does not establish an invariant native mesh crop or follicular density.
 *
 * The skin material can also label disconnected internal native sheets. The
 * exterior support is the edge-connected native sheet containing subnasale,
 * both labiale landmarks, gnathion and both tragia. All named anchor incidences
 * must belong to that same sheet. Mouth corners supply boundary coordinates,
 * not a replacement sheet: their registration may lie on a separate oral skin.
 * No component size ranking or cropped-island removal defines this support.
 * Whole native triangles must satisfy the selected landmark-defined region.
 * No nearest-world selection, source vertex edit, epsilon, person parameter or
 * shaft count enters this registration. An empty or disconnected territory
 * refuses; its source boundary must be reauthored instead of dropping islands.
 */
export function registerHumanSourceFacialHairDomains(
  basis: IAutoMovieHumanFaceBasis,
): IHumanSourceFacialHairDomainRegistration[] {
  const landmarks = basis.skinLandmarks;
  const at = (name: string): [number, number, number] => {
    const one = landmarks?.[name];
    const surface = one === undefined ? undefined : basis.surfaces[one.surface];
    if (one === undefined || surface?.id !== "Human")
      throw new Error("Facial hair source territory lacks its native skin landmark: " + name);
    const point = surface.positions.slice(3 * one.vertex, 3 * one.vertex + 3);
    if (point.length !== 3 || point.some((value) => !Number.isFinite(value)))
      throw new Error("Facial hair landmark is not a finite native point: " + name);
    return [point[0], point[1], point[2]];
  };
  const skin = basis.surfaces.find((surface) => surface.id === "Human");
  if (skin?.sourcePartition === undefined)
    throw new Error("Facial territories need the actual registered native skin.");
  const left = at("cheilion-left"), right = at("cheilion-right");
  const middle = (left[0] + right[0]) / 2;
  const upper = at("labiale-superius"), lower = at("labiale-inferius");
  const nose = at("subnasale"), bottom = at("gnathion");
  const triangles = new Map<string, number>();
  for (let offset = 0; offset < skin.indices.length; offset += 3)
    triangles.set(skin.indices.slice(offset, offset + 3).join("/"), offset / 3);
  const resident = new Set<number>();
  for (const region of skin.regions.filter((region) => region.material === "skin"))
    for (let offset = 0; offset < region.indices.length; offset += 3) {
      const cell = triangles.get(region.indices.slice(offset, offset + 3).join("/"));
      if (cell === undefined) throw new Error("Facial skin region names a nonnative cell.");
      resident.add(cell);
    }
  if (resident.size === 0) throw new Error("Facial territory has no declared skin cells.");
  const sheetEdges = new Map<string, number[]>();
  const sheetNeighbours = new Map([...resident].map((cell) => [cell, new Set<number>()]));
  for (const cell of resident) {
    const face = skin.indices.slice(3 * cell, 3 * cell + 3);
    for (let edge = 0; edge < 3; edge++) {
      const a = face[edge], b = face[(edge + 1) % 3];
      const key = Math.min(a, b) + "/" + Math.max(a, b);
      const incident = sheetEdges.get(key) ?? [];
      for (const prior of incident) { sheetNeighbours.get(cell)!.add(prior); sheetNeighbours.get(prior)!.add(cell); }
      incident.push(cell); sheetEdges.set(key, incident);
    }
  }
  const supportLandmarks = ["subnasale", "labiale-superius", "labiale-inferius", "gnathion", "tragion-left", "tragion-right"];
  const anchorCells = supportLandmarks.map((name) => {
    at(name);
    const vertex = landmarks![name].vertex;
    const cells = [...resident].filter((cell) => skin.indices.slice(3 * cell, 3 * cell + 3).includes(vertex));
    if (cells.length === 0) throw new Error("Facial exterior anchor has no native skin incidence: " + name);
    return cells;
  });
  const exterior = new Set<number>();
  const pendingSheet = [anchorCells[0][0]];
  while (pendingSheet.length !== 0) {
    const cell = pendingSheet.pop()!;
    if (exterior.has(cell)) continue;
    exterior.add(cell); pendingSheet.push(...sheetNeighbours.get(cell)!);
  }
  if (anchorCells.some((cells) => cells.some((cell) => !exterior.has(cell))))
    throw new Error("Facial exterior landmarks do not share one native skin sheet.");
  const observations: IHumanSourceFacialHairDomainObservation[] = [];
  const domains: IAutoMovieHumanFaceHairDomain[] = [];
  const records: IHumanSourceFacialHairDomainRegistration[] = [];
  const definitions: [IAutoMovieHumanFaceFacialHairSite, "left" | "right" | null, "upper" | "chin" | "cheek" | "jaw"][] = [
    ["leftUpperLip", "left", "upper"], ["rightUpperLip", "right", "upper"],
    ["chin", null, "chin"], ["leftCheek", "left", "cheek"],
    ["rightCheek", "right", "cheek"], ["leftJaw", "left", "jaw"],
    ["rightJaw", "right", "jaw"],
  ];
  for (const [site, side, kind] of definitions) {
    const corner = side === "right" ? right : left;
    const sign = side === "right" ? -1 : 1;
    const alar = at("subalare-" + (side ?? "left"));
    const ear = at("tragion-" + (side ?? "left"));
    const width = sign * (corner[0] - middle);
    const alarWidth = sign * (alar[0] - middle);
    const earWidth = sign * (ear[0] - middle);
    if (!(width > alarWidth && alarWidth > 0 && earWidth > width && bottom[1] < lower[1]))
      throw new Error("Facial territory source landmarks have no admitted anatomical ordering: " + site);
    const inside = (vertex: number): boolean => {
      const x = skin.positions[3 * vertex], y = skin.positions[3 * vertex + 1];
      const z = skin.positions[3 * vertex + 2];
      if (![x, y, z].every(Number.isFinite)) throw new Error("Facial native cell is nonfinite.");
      const lateral = side === null ? Math.abs(x - middle) : sign * (x - middle);
      if (lateral < 0 || z < ear[2]) return false;
      if (kind === "upper") {
        if (lateral > width) return false;
        const lip = upper[1] + (corner[1] - upper[1]) * lateral / width;
        const roof = lateral <= alarWidth
          ? nose[1] + (alar[1] - nose[1]) * lateral / alarWidth
          : alar[1] + (corner[1] - alar[1]) * (lateral - alarWidth) / (width - alarWidth);
        return y >= lip && y <= roof;
      }
      if (kind === "chin") {
        const currentCorner = x < middle ? right : left;
        const currentWidth = Math.abs(currentCorner[0] - middle);
        return lateral <= currentWidth && y >= bottom[1] &&
          y <= lower[1] + (currentCorner[1] - lower[1]) * lateral / currentWidth;
      }
      if (lateral < width || lateral > earWidth || y < bottom[1]) return false;
      const roof = corner[1] + (ear[1] - corner[1]) * (lateral - width) / (earWidth - width);
      return kind === "cheek" ? y >= lower[1] && y <= roof : y <= lower[1];
    };
    const cells = [...exterior].filter((cell) => skin.indices.slice(3 * cell, 3 * cell + 3).every(inside)).sort((a, b) => a - b);

    const edges = new Map<string, number[]>();
    const neighbours = new Map(cells.map((cell) => [cell, new Set<number>()]));
    const vertices = new Set<number>();
    for (const cell of cells) {
      const face = skin.indices.slice(3 * cell, 3 * cell + 3);
      face.forEach((vertex) => vertices.add(vertex));
      for (let edge = 0; edge < 3; edge++) {
        const a = face[edge], b = face[(edge + 1) % 3];
        const key = Math.min(a, b) + "/" + Math.max(a, b);
        const incident = edges.get(key) ?? [];
        for (const prior of incident) { neighbours.get(cell)!.add(prior); neighbours.get(prior)!.add(cell); }
        incident.push(cell); edges.set(key, incident);
      }
    }
    const groups: number[][] = [];
    const seen = new Set<number>();
    for (const seed of cells) {
      if (seen.has(seed)) continue;
      const group: number[] = [];
      groups.push(group);
      const pending = [seed];
      while (pending.length !== 0) {
        const cell = pending.pop()!;
        if (seen.has(cell)) continue;
        seen.add(cell); group.push(cell); pending.push(...neighbours.get(cell)!);
      }
    }
    const components = groups.length;
    observations.push({ site, components: groups });
    if (components !== 1) continue;
    const origin: [number, number, number] = [0, 0, 0];
    for (const vertex of vertices)
      for (let axis = 0; axis < 3; axis++) origin[axis] += skin.positions[3 * vertex + axis] / vertices.size;
    const domain = "facial-" + site;
    domains.push({ id: domain, facialHairSite: site, origin, triangles: cells });
    records.push({ site, surface: skin.id, domain, landmarks: ["cheilion-left", "cheilion-right", "labiale-superius", "labiale-inferius", "subnasale", "gnathion", "subalare-" + (side ?? "left"), "tragion-" + (side ?? "left")], triangles: cells, components, convention: "Source-authored whole-skin-triangle territory on the native exterior sheet jointly registered by subnasale, labiale, gnathion and tragia, bounded by neutral landmarks and the head sagittal/anterior frame; an editing prototype domain, not a measured clinical beard or follicle boundary." });
  }
  if (observations.some((one) => one.components.length !== 1))
    throw new Error("Authored facial territory coverage refused: " + JSON.stringify({
      exteriorSupport: { landmarks: supportLandmarks, triangles: exterior.size },
      landmarks: Object.fromEntries(Object.entries(landmarks ?? {}).filter(([, value]) =>
        basis.surfaces[value.surface]?.id === skin.id).map(([name, value]) =>
        [name, { vertex: value.vertex, point: skin.positions.slice(3 * value.vertex, 3 * value.vertex + 3) }])),
      sites: observations.map((one) => ({
        site: one.site,
        components: one.components.map((cells) => ({
          triangles: cells,
          vertices: [...new Set(cells.flatMap((cell) => skin.indices.slice(3 * cell, 3 * cell + 3)))].map((vertex) => ({
            vertex, point: skin.positions.slice(3 * vertex, 3 * vertex + 3),
          })),
        })),
      })),
    }));
  const retained = skin.hairDomains ?? [];
  const prior = retained.filter((domain) => domain.facialHairSite !== undefined);
  const untagged = retained.filter((domain) => domain.facialHairSite === undefined);
  if (untagged.some((domain) => domains.some((one) => one.id === domain.id)))
    throw new Error("Facial territory identity collides with an original source domain.");
  if (prior.length !== 0) {
    if (prior.length !== domains.length || prior.some((domain) => {
      const expected = domains.find((one) => one.facialHairSite === domain.facialHairSite);
      return expected === undefined || domain.id !== expected.id ||
        JSON.stringify(domain.origin) !== JSON.stringify(expected.origin) ||
        JSON.stringify(domain.triangles) !== JSON.stringify(expected.triangles);
    }) || new Set(prior.map((domain) => domain.facialHairSite)).size !== domains.length)
      throw new Error("Existing facial territory differs from its current native authoring convention; reauthor its source registration.");
    return records;
  }
  skin.hairDomains = [...untagged, ...domains];
  return records;
}
