import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanPoseChannels } from "../../../../packages/human/src/skeleton/AutoMovieHumanPoseChannels";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanCurveRing } from "./HumanCurveRing";
import { HumanCurveVector } from "./HumanCurveVector";
import { HumanCurveConstants } from "./HumanCurveConstants";

type V3 = [number, number, number];
const { band, length, normalsOf, rearAt, side, uniform }: typeof HumanCurveRing = HumanCurveRing;
const { clamp, distance, dot, sub, unit }: typeof HumanCurveVector = HumanCurveVector;
const { ALIAS, ARMPIT_SEAM, BEND, CORNER_FROM, CORNER_PHASES, CORNER_REACH, CORNER_STEP, FOLD, FOLD_REACH, GAP, PHASES, REACH, SEAM, SHELF, SHELF_PLANE, STEP, STEP_ARC, STEP_REACH, STREAK, STREAK_SHARES, TEETH, TEETH_PINCH, THIGH_TOP, TIP, WRIST_SEAM }: typeof HumanCurveConstants = HumanCurveConstants;

/** The rules of the joins between chains: seams, folds, the hip and the leg's root. */
export namespace HumanCurveJoin {
  /** Joins: closed, and smooth across the seam. */
  export function auditJoins(
    body: IAutoMovieHumanBodyCalibration,
    generated: RegExp,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  ): void {
    const chains: Map<string, IAutoMovieHumanLoftChain> = new Map(
      body.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, IAutoMovieHumanLoftChain] => [
          c.name,
          c,
        ],
      ),
    );
    const find: (n: string) => IAutoMovieHumanLoftChain = (n: string): IAutoMovieHumanLoftChain => chains.get(n)!;
    for (const event of body.events) {
      // A web's children meet the parent through the web's own surface, which
      // the mesh rules read; their ends stand apart from its ring by design.
      if (event.web === true) continue;
      const parent: IAutoMovieHumanLoftChain = find(event.parent);
      const down: boolean = event.direction === "down";
      const end: number = down
        ? parent.layers[0]!.y
        : parent.layers[parent.layers.length - 1]!.y;
      const into: number = end + (down ? 1 : -1) * Math.min(REACH, length(parent) / 2);
      for (const split of event.splits) {
        const child: IAutoMovieHumanLoftChain = find(split.child);
        if (!generated.test(child.name) && !generated.test(parent.name)) continue;
        const region: string = `${event.parent} > ${child.name}`;
        const tip: number = down
          ? child.layers[child.layers.length - 1]!.y
          : child.layers[0]!.y;
        const away: number = tip + (down ? -1 : 1) * Math.min(REACH, length(child) / 2);
        const fine: number[] = uniform(720);
        const own: V3[] = AutoMovieHumanLoftChain.ring(child, tip, fine);
        const next: V3[] = AutoMovieHumanLoftChain.ring(child, away, fine);
        for (const [from, to] of split.arcs) {
          const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
          const count: number = 48;
          const phases: number[] = Array.from(
            { length: count },
            (_: unknown, i: number): number =>
              from + (span * (i + 0.5)) / count,
          );
          const ring: V3[] = AutoMovieHumanLoftChain.ring(parent, end, phases);
          const inner: V3[] = AutoMovieHumanLoftChain.ring(parent, into, phases);
          const facing: number[] = [];
          ring.forEach((p: V3, i: number): void => {
            let best: number = Infinity;
            let at: number = 0;
            own.forEach((q: V3, m: number): void => {
              const d: number = distance(p, q);
              if (d < best) {
                best = d;
                at = m;
              }
            });
            facing.push(fine[at]!);
            if (best > GAP) report(region, "gap", side(ring, i), best, GAP, p);

            // Pinches are corners by design: the seam rule is for the open arc.
            const edge: number = Math.min(i, count - 1 - i) / count;
            if (edge < 0.15) return;
            const a: V3 = unit(sub(p, inner[i]!));
            const b: V3 = unit(sub(next[at]!, own[at]!));
            const kink: number = (Math.acos(clamp(dot(a, b))) * 180) / Math.PI;
            if (/ear\./.test(region)) return;
            const limit: number = /> hand\./.test(region)
              ? WRIST_SEAM
              : /^upper > arm/.test(region)
                ? ARMPIT_SEAM
                : /^head\.middle > head\.lower/.test(region)
                  ? ARMPIT_SEAM
                  : SEAM;
            if (kink > limit) report(region, "seam", side(ring, i), kink, limit, p);
          });

          // How far the skin has turned a few millimetres either side of the ring.
          // One point of a heavy arm pressed on the trunk is a contact, so the
          // rule reads the arc's ninth decile.
          if (!/^(trunk|upper)$/.test(event.parent)) continue;
          const open: number[] = phases
            .map((_: number, i: number): number => i)
            .filter((i: number): boolean => Math.min(i, count - 1 - i) / count >= 0.15);
          const step: number = (down ? 1 : -1) * FOLD_REACH;
          const above: V3[] = normalsOf(
            parent,
            end + step,
            open.map((i: number): number => phases[i]!),
          );
          const below: V3[] = normalsOf(
            child,
            tip - step,
            open.map((i: number): number => facing[i]!),
          );
          const turns: number[] = open
            .map(
              (_: number, i: number): number =>
                (Math.acos(clamp(Math.abs(dot(above[i]!, below[i]!)))) * 180) /
                Math.PI,
            )
            .sort((p: number, q: number): number => p - q);
          const turn: number = turns[Math.floor(0.9 * (turns.length - 1))]!;
          if (turn > FOLD)
            report(region, "fold", side(ring, Math.floor(count / 2)), turn, FOLD, ring[Math.floor(count / 2)]!);
        }
      }
    }
  }

  /**
   * What shades as a line on figures every other rule passed.
   *
   * - `shelf`: the rear stops rising at the crotch ring, though the leg climbs into
   *   it. It reads as a soft line across the hip.
   * - `tip`: the crotch ring's rear ends in a sharp V, whose point shades across
   *   the cleft as a tab.
   * - `step`: the skin of the back turns faster on one side of the armpit's joint
   *   than on the other, a line with no angle at the ring itself.
   * - `streak`: a phase's kink runs down the thigh below its last interval, which
   *   is the join's fillet carrying a pinch's slope down the leg.
   */
  export function auditHip(
    body: IAutoMovieHumanBodyCalibration,
    generated: RegExp,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  ): void {
    const find: (n: string) => IAutoMovieHumanLoftChain | undefined = (n: string): IAutoMovieHumanLoftChain | undefined =>
      body.chains.find((c: IAutoMovieHumanLoftChain): boolean => c.name === n);
    const trunk: IAutoMovieHumanLoftChain | undefined = find("trunk");
    const upper: IAutoMovieHumanLoftChain | undefined = find("upper");
    if (trunk === undefined || upper === undefined) return;
    const seam: number = trunk.layers[0]!.y;
    if (generated.test("trunk")) {
      const fine: number[] = uniform(720);
      const reach: number = THIGH_TOP * body.stature;
      const side: number = Math.max(
        ...AutoMovieHumanLoftChain.ring(trunk, seam, fine).map(
          (p: V3): number => p[2],
        ),
      );

      // The rearmost place of a chain's ring at a height, at the shelf's lateral plane.
      const rear: (chain: IAutoMovieHumanLoftChain, y: number) => number = (chain: IAutoMovieHumanLoftChain, y: number): number =>
        rearAt(AutoMovieHumanLoftChain.ring(chain, y, fine), SHELF_PLANE * side);
      const leg: IAutoMovieHumanLoftChain | undefined = find("leg.left");
      if (leg !== undefined) {
        const at: number = rear(leg, seam);
        const below: number = rear(leg, seam - reach) - at;
        const above: number = at - rear(trunk, seam + reach);
        const ratio: number = below / Math.max(above, 1e-3);
        if (ratio > SHELF)
          report("trunk", "shelf", "rear of the crotch ring", ratio, SHELF, [at, seam, SHELF_PLANE * side]);
      }
      const spacing: number = (2 * Math.PI) / trunk.order;
      const [tip, next]: [V3, V3] = AutoMovieHumanLoftChain.ring(trunk, seam, [
        Math.PI,
        Math.PI - spacing,
      ]) as [V3, V3];
      const sharp: number =
        Math.abs(next[0] - tip[0]) / Math.max(Math.abs(next[2] - tip[2]), 1e-3);
      if (sharp > TIP) report("trunk", "tip", "rear of the crotch ring", sharp, TIP, tip);

      const joint: number = upper.layers[0]!.y;
      const phases: number[] = uniform(PHASES).filter(
        (t: number): boolean => Math.abs(t - Math.PI) < STEP_ARC,
      );

      // The median turn of a chain's normals between two stations, degrees.
      const turn: (chain: IAutoMovieHumanLoftChain, a: number, b: number) => number = (
        chain: IAutoMovieHumanLoftChain,
        a: number,
        b: number,
      ): number => {
        const p: V3[] = normalsOf(chain, a, phases);
        const q: V3[] = normalsOf(chain, b, phases);
        const angles: number[] = p
          .map(
            (n: V3, i: number): number =>
              (Math.acos(clamp(Math.abs(dot(n, q[i]!)))) * 180) / Math.PI,
          )
          .sort((x: number, y: number): number => x - y);
        return angles[Math.floor(angles.length / 2)]!;
      };
      const off: number = 0.1;
      const difference: number = Math.abs(
        turn(upper, joint + off, joint + STEP_REACH) -
          turn(trunk, joint - off, joint - STEP_REACH),
      );
      if (difference > STEP)
        report("upper > trunk", "step", "back of the joint", difference, STEP, [0, joint, 0]);

      // A feature narrower than a ring's control pitch turns the ring sharply
      // between two controls, and each row places it differently, so it prints
      // as teeth along it. The pinches are corners by design.
      const per: number = 4;
      const count: number = per * trunk.order;
      const pitched: number[] = uniform(count);
      const pinch: number = (TEETH_PINCH * 2 * Math.PI) / trunk.order;
      trunk.layers.forEach((l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
        const stations: number[] =
          k === 0 ? [l.y] : [(l.y + trunk.layers[k - 1]!.y) / 2, l.y];
        for (const s of stations) {
          const ring: V3[] = AutoMovieHumanLoftChain.ring(trunk, s, pitched);
          const heading: number[] = ring.map((p: V3, i: number): number => {
            const q: V3 = ring[(i + 1) % count]!;
            return Math.atan2(q[2] - p[2], q[0] - p[0]);
          });
          ring.forEach((p: V3, i: number): void => {
            const t: number = pitched[i]!;
            if (Math.min(t, Math.abs(t - Math.PI), 2 * Math.PI - t) < pinch) return;
            const d: number = heading[(i + per) % count]! - heading[i]!;
            const turn: number =
              (Math.abs(Math.atan2(Math.sin(d), Math.cos(d))) * 180) / Math.PI;
            if (turn > TEETH)
              report("trunk", "teeth", `layer ${band(k)} phase ${Math.round((t * 180) / Math.PI / 30) * 30}`, turn, TEETH, p);
          });
        }
      });
    }
    for (const name of ["leg.left", "leg.right"]) {
      const leg: IAutoMovieHumanLoftChain | undefined = find(name);
      if (leg === undefined || !generated.test(name)) continue;
      const top: number = leg.layers[leg.layers.length - 1]!.y;
      for (const share of STREAK_SHARES) {
        const ring: V3[] = AutoMovieHumanLoftChain.ring(
          leg,
          top - share * body.stature,
          uniform(512),
        );
        const n: number = ring.length;
        ring.forEach((b: V3, i: number): void => {
          const a: V3 = ring[(i + n - 1) % n]!;
          const c: V3 = ring[(i + 1) % n]!;
          const e: V3 = ring[(i + 2) % n]!;
          const third: number = Math.hypot(
            e[0] - 3 * c[0] + 3 * b[0] - a[0],
            e[2] - 3 * c[2] + 3 * b[2] - a[2],
          );
          if (third > STREAK)
            report(name, "streak", `under the ring ${share}`, third, STREAK, b);
        });
      }
    }
  }

  /**
   * A leg's rows through its knee and its sections under the crotch's pinches.
   *
   * - `rows`: under the knee's whole flexion, two neighbouring layers within its
   *   bend turn apart by more than {@link ALIAS}. The rig spreads a joint's turn
   *   over a quintic ramp {@link BEND} skin depths either side of it and the skin
   *   bends only between its rows, so rows that far apart print as facets round
   *   a flexed knee though the standing skin is smooth.
   * - `corner`: a leg's own section turns by more than {@link ALIAS} within 2 mm
   *   near one of the crotch ring's pinches, deeper than {@link CORNER_FROM} under
   *   the ring and down to the thigh rule's depth: the slit's corner carried down
   *   the thigh, which the cells alias into an edge.
   */
  export function auditLegRoot(
    body: IAutoMovieHumanBodyCalibration,
    generated: RegExp,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  ): void {
    const trunk: IAutoMovieHumanLoftChain | undefined = body.chains.find(
      (c: IAutoMovieHumanLoftChain): boolean => c.name === "trunk",
    );
    const event: IAutoMovieHumanBodyCalibration.IEvent | undefined = body.events.find(
      (e: IAutoMovieHumanBodyCalibration.IEvent): boolean => e.parent === "trunk" && e.direction === "down",
    );
    const flexion: (typeof AutoMovieHumanPoseChannels)[number] | undefined = AutoMovieHumanPoseChannels.find(
      (r: (typeof AutoMovieHumanPoseChannels)[number]): boolean => r[0] === "legs.<side>.knee.flexion",
    );
    for (const side of ["left", "right"]) {
      const name: string = `leg.${side}`;
      const leg: IAutoMovieHumanLoftChain | undefined = body.chains.find(
        (c: IAutoMovieHumanLoftChain): boolean => c.name === name,
      );
      if (leg === undefined || !generated.test(name)) continue;
      const low: number = leg.layers[0]!.y;
      const top: number = leg.layers[leg.layers.length - 1]!.y;

      // Rows through the knee.
      const knee: V3 | undefined = body.skeleton?.find(
        (b: NonNullable<IAutoMovieHumanBodyCalibration["skeleton"]>[number]): boolean => b.bone === `${side}LowerLeg`,
      )?.position;
      if (knee !== undefined && flexion !== undefined && knee[1] > low && knee[1] < top) {
        const range: number = flexion[5] - flexion[4];
        const depth: number = Math.min(
          ...AutoMovieHumanLoftChain.ring(leg, knee[1], uniform(PHASES)).map((p: V3): number => distance(p, knee)),
        );
        const half: number = BEND * depth;
        const ramp: (s: number) => number = (s: number): number => {
          const y: number = (Math.min(1, Math.max(-1, (s - knee[1]) / half)) + 1) / 2;
          return y * y * y * (y * (6 * y - 15) + 10);
        };
        leg.layers.forEach((l: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
          if (k === 0) return;
          const turn: number = range * (ramp(l.y) - ramp(leg.layers[k - 1]!.y));
          if (turn > ALIAS) report(name, "rows", `layer ${band(k)}`, turn, ALIAS, knee);
        });
      }

      // Sections under the pinches.
      const split: IAutoMovieHumanBodyCalibration.ISplit | undefined = event?.splits.find(
        (s: IAutoMovieHumanBodyCalibration.ISplit): boolean => s.child === name,
      );
      if (trunk === undefined || split === undefined) continue;
      const pinches: V3[] = AutoMovieHumanLoftChain.ring(trunk, trunk.layers[0]!.y, split.arcs.flat());
      const phases: number[] = uniform(CORNER_PHASES);
      for (let d: number = CORNER_FROM; d <= THIGH_TOP * body.stature && top - d > low; d += CORNER_STEP) {
        const ring: V3[] = AutoMovieHumanLoftChain.ring(leg, top - d, phases);
        const n: number = ring.length;
        const walk: (from: number, step: number) => V3 = (from: number, step: number): V3 => {
          let gone: number = 0;
          let i: number = from;
          while (gone < 1) {
            const j: number = (i + step + n) % n;
            gone += distance(ring[j]!, ring[i]!);
            i = j;
          }
          return ring[i]!;
        };
        for (const pinch of pinches) {
          let near: number = 0;
          ring.forEach((p: V3, i: number): void => {
            if (distance(p, pinch) < distance(ring[near]!, pinch)) near = i;
          });
          for (let o: number = -CORNER_REACH; o <= CORNER_REACH; o++) {
            const i: number = (near + o + n) % n;
            const a: V3 = unit(sub(ring[i]!, walk(i, -1)));
            const b: V3 = unit(sub(walk(i, 1), ring[i]!));
            const turn: number = (Math.acos(clamp(dot(a, b))) * 180) / Math.PI;
            if (turn > ALIAS) report(name, "corner", `under the ring ${Math.round(d)} ${pinch[0] > 0 ? "front" : "back"}`, turn, ALIAS, ring[i]!);
          }
        }
      }
    }
  }
}
