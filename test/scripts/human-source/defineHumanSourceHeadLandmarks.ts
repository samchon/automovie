import { HUMAN_SOURCE_READ_LANDMARKS } from "./HUMAN_SOURCE_READ_LANDMARKS.ts";
import { HUMAN_SOURCE_HEAD_LANDMARK_TEXTS } from "./HUMAN_SOURCE_HEAD_LANDMARK_TEXTS.ts";
import { markHumanSourceSide } from "./markHumanSourceSide.ts";
import { mirrorHumanSourceLandmark } from "./mirrorHumanSourceLandmark.ts";
import { selectHumanSourceGlabella } from "./selectHumanSourceGlabella.ts";
import { selectHumanSourceMenton } from "./selectHumanSourceMenton.ts";
import { selectHumanSourcePronasale } from "./selectHumanSourcePronasale.ts";
import { selectHumanSourceReadLandmark } from "./selectHumanSourceReadLandmark.ts";
import { selectHumanSourceSellion } from "./selectHumanSourceSellion.ts";
import type { IHumanSourceHeadLandmarkInput } from "./structures/IHumanSourceHeadLandmarkInput.ts";
import type { IHumanSourceHeadLandmarks } from "./structures/IHumanSourceHeadLandmarks.ts";
import type { IHumanSourceLandmarkPick } from "./structures/IHumanSourceLandmarkPick.ts";

const LIMIT =
  "The vertex is fixed on the neutral head. When the shape changes, the definition's extremum can move to another vertex, and a fixed vertex does not follow that move.";

/**
 * Choose the head view's skin landmarks on the generation's neutral skin.
 * Midline points are searched among the base mesh's own midline vertices
 * (hm08.mirror) on the head partition; tragion is the frame-read vertex
 * (`HUMAN_SOURCE_READ_LANDMARKS`) on the right ear, mirrored to its exact left
 * twin. Each name gets its selection
 * record: meaning, citation, rule, chosen vertex, compared candidates,
 * neutral position and the fixed-vertex limit. A name whose extremum ties or
 * whose vertex is not on the head view exactly once is refused.
 */
export function defineHumanSourceHeadLandmarks(input: IHumanSourceHeadLandmarkInput): IHumanSourceHeadLandmarks {
  const { generation, mirror, faces, faceToG1 } = input;
  const p = generation.skin.positions;
  const head = markHumanSourceSide(generation.skin, 0);
  const midline = mirror.midline.filter((v) => head[v] === 1);
  const faceSet = generation.landmarks.find((set) => set.origin === "face");
  const mouth = faceSet?.ids.indexOf("joint-mouth") ?? -1;
  if (faceSet === undefined || mouth < 0) throw new Error("Head landmarks: the face landmark set has no mouth joint.");
  const glabella = selectHumanSourceGlabella(generation, midline);
  const pronasale = selectHumanSourcePronasale(p, midline, faceSet.positions[3 * mouth + 1]);
  const picks: Record<string, IHumanSourceLandmarkPick> = {
    glabella,
    sellion: selectHumanSourceSellion(p, faces, midline, glabella.vertex, pronasale.vertex),
    menton: selectHumanSourceMenton(generation, midline),
    "tragion-right": selectHumanSourceReadLandmark("tragion-right", p, head, HUMAN_SOURCE_READ_LANDMARKS["tragion-right"]),
  };
  for (const side of ["tragion"]) {
    const right = picks[`${side}-right`];
    const vertex = mirrorHumanSourceLandmark(`${side}-left`, p, mirror, right.vertex);
    picks[`${side}-left`] = { vertex, candidates: [{ vertex, position: [0, 1, 2].map((c) => p[3 * vertex + c]), value: p[3 * vertex + 1] }] };
  }
  const skinLandmarks: IHumanSourceHeadLandmarks["skinLandmarks"] = {};
  const records: IHumanSourceHeadLandmarks["records"] = [];
  for (const [name, pick] of Object.entries(picks)) {
    const views: number[] = [];
    faceToG1.forEach((g, j) => {
      if (g === pick.vertex) views.push(j);
    });
    if (views.length !== 1) throw new Error(`Head landmark ${name}: sample ${pick.vertex} appears ${views.length} times on the head view.`);
    skinLandmarks[name] = { surface: 0, vertex: views[0] };
    records.push({
      ...HUMAN_SOURCE_HEAD_LANDMARK_TEXTS[name],
      vertex: pick.vertex,
      viewVertex: views[0],
      position: [0, 1, 2].map((c) => p[3 * pick.vertex + c]),
      candidates: pick.candidates.slice(0, 4),
      limit: LIMIT,
    });
  }
  return { skinLandmarks, records };
}
