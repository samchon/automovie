import fs from "node:fs";

import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanArmF1Pose } from "../generation/arm/AutoMovieHumanArmF1Pose";
import { HumanNodePaths } from "./HumanNodePaths";
import { NodeArmDeviation } from "./NodeArmDeviation";
import { NodeArmReference } from "./NodeArmReference";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;
type V2 = [number, number];

/**
 * f1's hand cut in her own hand frame (`ttsx`, f1_arm's reading for the palm
 * end and the thumb): planes normal to her hand axis every 4 mm from 40 to
 * 160 mm past her wrist zero (`AutoMovieHumanArmF1Pose.LEFT`), lateral the
 * styloid line made square to the hand axis, anterior (volar) = hand axis x
 * lateral. Every closed loop of each cut (`NodeArmDeviation.cut`) is listed
 * with its centroid, its box and its area, so the palm, the separate fingers
 * and the thumb can be told apart; each loop's centroid is also given in
 * world mm.
 */
export namespace NodeArmHandCuts {
  /** Cut and print. */
  export function run(): void {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const L: AutoMovieHumanArmF1Pose.ILandmarks = AutoMovieHumanArmF1Pose.LEFT;
    const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const across = (v: V3, axis: V3): V3 => {
      const d: number = S.dot(v, axis);
      return S.unit([v[0] - axis[0] * d, v[1] - axis[1] * d, v[2] - axis[2] * d]);
    };
    const handAxis: V3 = S.unit(L.handAxis);
    const foreAxis: V3 = S.unit(sub(L.wristZero, L.EC));
    const styloid: V3 = across(sub(L.RS, L.US), foreAxis);
    const lateral: V3 = across(styloid, handAxis);
    const anterior: V3 = S.unit(S.cross(handAxis, lateral));
    const mesh: NodeArmReference.IMesh = NodeArmReference.mesh(1);
    const rows: string[] = [];
    for (let x: number = 40; x <= 160; x += 4) {
      const centre: V3 = [L.wristZero[0] + handAxis[0] * x, L.wristZero[1] + handAxis[1] * x, L.wristZero[2] + handAxis[2] * x];
      const loops: V2[][] = NodeArmDeviation.cut(mesh, centre, handAxis, lateral, anterior);
      const described: string[] = loops.map((loop: V2[]): string => {
        let area: number = 0;
        let cx: number = 0;
        let cy: number = 0;
        for (let k: number = 0; k < loop.length; ++k) {
          const p: V2 = loop[k]!;
          const q: V2 = loop[(k + 1) % loop.length]!;
          const c: number = p[0] * q[1] - q[0] * p[1];
          area += c;
          cx += (p[0] + q[0]) * c;
          cy += (p[1] + q[1]) * c;
        }
        cx /= 3 * area;
        cy /= 3 * area;
        const xs: number[] = loop.map((p: V2): number => p[0]);
        const ys: number[] = loop.map((p: V2): number => p[1]);
        const world: V3 = [0, 1, 2].map((i: number): number => centre[i]! + lateral[i]! * cx + anterior[i]! * cy) as V3;
        return `area ${(Math.abs(area) / 2).toFixed(0)} centroid (${cx.toFixed(1)}, ${cy.toFixed(1)}) box x[${Math.min(...xs).toFixed(1)}, ${Math.max(...xs).toFixed(1)}] y[${Math.min(...ys).toFixed(1)}, ${Math.max(...ys).toFixed(1)}] world (${world.map((v: number): string => v.toFixed(1)).join(", ")})`;
      });
      rows.push(`x ${x}: ${loops.length} loops\n    ${described.join("\n    ")}`);
    }
    const text: string = `hand frame: lateral ${lateral.map((v: number): string => v.toFixed(4)).join(", ")}, anterior ${anterior.map((v: number): string => v.toFixed(4)).join(", ")}\n${rows.join("\n")}\n`;
    fs.writeFileSync(HumanNodePaths.resolve("packages/human/.shots/f1_arm2/hand-cuts.txt"), text);
    console.log(text);
  }
}

NodeArmHandCuts.run();
