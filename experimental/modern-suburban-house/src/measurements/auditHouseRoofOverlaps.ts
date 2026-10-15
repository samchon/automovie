import type { IAutoMovieMesh } from "@automovie/interface";
import { block } from "../spaces/block";
import { buildHouse } from "../spaces/buildHouse";
import { SPLIT_X } from "../spaces/roof/SPLIT_X";
import { point } from "./point";
import { verifyRoofInternalFaces } from "./verifyRoofInternalFaces";
import { scanRoofOverlaps } from "./scanRoofOverlaps";
import { IRoofOverlapScan } from "./IRoofOverlapScan";
import { verifyRoofBoundaryPairs } from "./verifyRoofBoundaryPairs";

/** Pure fixtures run by every production roof audit, not an orphaned test file. */
const verifyRoofOverlapScanner = (): void => {
  const a = { id: "a", mesh: block([0, 0, 0], [1, 1, 1]) };
  const overlap = {
    id: "overlap",
    mesh: block([0.5, 0.5, 0.5], [1.5, 1.5, 1.5]),
  };
  const touching = { id: "touching", mesh: block([1, 0, 0], [2, 1, 1]) };
  const separate = { id: "separate", mesh: block([1.01, 0, 0], [2.01, 1, 1]) };
  const thin = {
    id: "thin",
    mesh: block([0.5, 0.995, 0.5], [1.5, 1.005, 1.5]),
  };
  const found = scanRoofOverlaps([a, overlap], 0.1).overlaps;
  if (found.length !== 1 || Math.abs(found[0]!.maximumDepth - 0.5) > 1e-9)
    throw new Error(
      "roof overlap fixture: intersecting boxes were not measured at 0.5 m"
    );
  if (scanRoofOverlaps([a, touching], 0.1).overlaps.length !== 0)
    throw new Error(
      "roof overlap fixture: a shared face was counted as volume"
    );
  let rejectedInternalFace = false;
  try {
    verifyRoofInternalFaces([a, touching]);
  } catch (error) {
    if (!String(error).includes("internal roof closure faces")) throw error;
    rejectedInternalFace = true;
  }
  if (!rejectedInternalFace) throw new Error(
    "roof internal-face fixture accepted a buried closure"
  );
  if (scanRoofOverlaps([a, separate], 0.1).overlaps.length !== 0)
    throw new Error(
      "roof overlap fixture: separate boxes were counted as touching"
    );
  if (scanRoofOverlaps([a, thin], 0.1).overlaps.length !== 1)
    throw new Error("roof overlap fixture: a 5 mm vertical overlap was missed");
  const open: IAutoMovieMesh = {
    ...a.mesh,
    indices: a.mesh.indices!.slice(0, -3),
  };
  const roof = buildHouse().parts.filter((part) => part.role === "roof");
  const withoutStepClosure = roof.map((part) => {
    if (part.id !== "roof-main-front" && part.id !== "roof-main-back") return part;
    const indices = part.mesh.indices!;
    const kept: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const vertices = [indices[i]!, indices[i + 1]!, indices[i + 2]!].map((index) => point(part.mesh, index));
      const stepFace = vertices.every((vertex) => Math.abs(vertex.x - SPLIT_X) < 1e-6) &&
        Math.max(...vertices.map((vertex) => vertex.y)) - Math.min(...vertices.map((vertex) => vertex.y)) > 1e-6;
      if (!stepFace) kept.push(...indices.slice(i, i + 3));
    }
    return { ...part, mesh: { ...part.mesh, indices: kept } };
  });
  let rejectedStepMutant = false;
  try {
    verifyRoofBoundaryPairs(withoutStepClosure);
  } catch (error) {
    if (!String(error).includes("unpaired roof boundaries")) throw error;
    rejectedStepMutant = true;
  }
  if (withoutStepClosure.every(
    (part) => part.mesh.indices!.length === roof.find((old) => old.id === part.id)!.mesh.indices!.length
  ))
    throw new Error(
      "roof boundary fixture did not remove the roof step closure"
    );
  if (!rejectedStepMutant) throw new Error(
    "roof boundary fixture accepted the missing step closure"
  );
  try {
    scanRoofOverlaps([{ id: "open", mesh: open }], 0.1);
  } catch (error) {
    if (String(error).includes("unpaired roof boundaries")) return;
    throw error;
  }
  throw new Error("roof overlap fixture: an open boundary was accepted");
};
/** The exact roof meshes shown by the current house viewer. */

export const auditHouseRoofOverlaps = (): IRoofOverlapScan => {
  verifyRoofOverlapScanner();
  const house = buildHouse();
  const roof = house.parts.filter((part) => part.role === "roof");
  verifyRoofInternalFaces(roof);
  return scanRoofOverlaps(roof);
};
