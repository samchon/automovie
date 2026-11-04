import { AutoMovieHumanArmRootOval } from "../../../src/generation/AutoMovieHumanArmRootOval";
import type { IAutoMovieHumanTrunkSolution } from "../../../src/generation/IAutoMovieHumanTrunkSolution";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugPieceMesh } from "../HumanDebugPieceMesh";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugTrunkKit } from "../trunk/HumanDebugTrunkKit";

/**
 * `shoulder.oval`: the left arm root's horizontal ellipses from the axilla to the shoulder point,
 * as the trunk solve hands them to the shoulder ring.
 *
 * Each of 41 heights from the axilla up to just under the cap's top is cut by
 * `AutoMovieHumanArmRootOval.at` (the abducted cylinder below the glenohumeral centre, the deltoid
 * cap above it), drawn as a closed ring of 48 points. The rings make one tube, the part
 * `human.skin.shoulder.left.oval/0`, and each ring is its curve `shoulder.left.oval/<k>`, bottom
 * first. Heights where the oval has no root are skipped and listed in the provenance.
 */
export const HumanDebugPieceShoulderOval: IHumanDebugPiece = {
  name: "shoulder.oval",
  region: "shoulder",
  description: "Left arm root's ellipses from the axilla to the shoulder point, from the trunk solve",
  arguments: [],
  build: (person: IHumanDebugPerson): IHumanDebugDocument => {
    const kit: HumanDebugTrunkKit.IFixed = HumanDebugTrunkKit.of(person);
    const s: IAutoMovieHumanTrunkSolution = kit.solution;
    const from: number = s.landmarks.axilla;
    const to: number = s.oval.cap.to - TOP_GAP;
    const rings: IHumanDebugDocument.Point[][] = [];
    const skipped: number[] = [];
    for (let i: number = 0; i < HEIGHTS; ++i) {
      const y: number = from + ((to - from) * i) / (HEIGHTS - 1);
      const oval: AutoMovieHumanArmRootOval.IOval | null = AutoMovieHumanArmRootOval.at(s.oval, y);
      if (oval === null) {
        skipped.push(y);
        continue;
      }
      rings.push(
        Array.from({ length: POINTS }, (_: unknown, k: number): IHumanDebugDocument.Point => {
          const t: number = (2 * Math.PI * k) / POINTS;
          return [oval.x + oval.rx * Math.cos(t), y, oval.z + oval.rz * Math.sin(t)];
        }),
      );
    }
    return {
      parts: [
        HumanDebugPieceMesh.part(
          "human.skin.shoulder.left.oval/0",
          HumanDebugPieceMesh.grid(rings, true),
          rings.map(
            (ring: IHumanDebugDocument.Point[], k: number): IHumanDebugDocument.ICurve => ({
              id: "human.construction.shoulder.left.oval/" + k,
              closed: true,
              points: ring,
            }),
          ),
        ),
      ],
      provenance: {
        piece: "shoulder.oval",
        person: person.alias,
        from,
        to,
        rings: rings.length,
        skipped,
        glenohumeral: s.oval.glenohumeral,
        radius: s.oval.radius,
        solveMilliseconds: kit.milliseconds,
      },
    };
  },
};

/** Heights cut between the axilla and the cap's top. */
const HEIGHTS: number = 41;

/** Points per ring. */
const POINTS: number = 48;

/** Distance under the cap's top where the last ring stands, mm: the oval has no root at the top itself. */
const TOP_GAP: number = 0.5;
