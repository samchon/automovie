import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import type { AutoMovieHumanLoftMesh } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { HumanCurveFinding } from "./HumanCurveFinding";
import { HumanCurveVector } from "./HumanCurveVector";
import { HumanCurveConstants } from "./HumanCurveConstants";
import { HumanCurveRing } from "./HumanCurveRing";

type V3 = [number, number, number];
type IHumanCurveFinding = HumanCurveFinding.IHumanCurveFinding;
const { clamp, cross, distance, dot, sub, unit }: typeof HumanCurveVector = HumanCurveVector;
const { HAND_ARM_LAYERS, HAND_CRUMPLE, HAND_JOIN, HAND_PATCH, HAND_SHARP, HAND_TEAR }: typeof HumanCurveConstants = HumanCurveConstants;
const { uniform }: typeof HumanCurveRing = HumanCurveRing;

/** The rules of a hand: its mesh and joins. */
export namespace HumanCurveHand {
  /**
   * A hand's skin as it is meshed, which a chain's curves cannot show.
   *
   * - `tear`: two neighbouring triangles of the hand fold sharply against each
   *   other, the jagged skin at a digit's root. Only the arm's own chains are
   *   lofted, so this costs a hand and not a body.
   * - `join`: a child's own end ring stands off the parent's ring it inherits, so
   *   the zipper between them spans the difference. The plain `gap` rule allows a
   *   width at which a finger's root is already visibly torn.
   * - `crumple`: sharp edges crowd one small patch of skin. A crease is a few in a
   *   line; no single fold in a crumple need be sharp enough for `tear`.
   *
   * @param person Name in the findings.
   * @param body The generated body.
   */
  export function auditHumanHand(
    person: string,
    body: IAutoMovieHumanBodyCalibration,
  ): IHumanCurveFinding[] {
    return (["left", "right"] as const).flatMap(
      (hand: "left" | "right"): IHumanCurveFinding[] => {
        const owned: RegExp = new RegExp(`^(arm|hand|finger|thumb)\\.${hand}`);
        return [
          ...auditHandMesh(person, body, owned),
          ...auditHandJoins(person, body, owned),
        ];
      },
    );
  }

  /**
   * The sharpest fold between neighbouring triangles, and the crowding of sharp
   * ones, per chain of a hand or a foot.
   *
   * @param keep Whether a triangle group counts; by default the arm far from
   *   the hand does not, since it is not the hand and its top has no parent here.
   */
  export function auditHandMesh(
    person: string,
    body: IAutoMovieHumanBodyCalibration,
    owned: RegExp,
    keep: (group: string) => boolean = (name: string): boolean => {
      const [chain, interval]: string[] = name.split("/");
      return !/^arm\./.test(chain!) || Number(interval) < HAND_ARM_LAYERS;
    },
  ): IHumanCurveFinding[] {
    const mesh: AutoMovieHumanLoftMesh.IContext = AutoMovieHumanBodySurface.generate({
      ...body,
      chains: body.chains.filter(
        (c: IAutoMovieLoftChain): boolean => owned.test(c.name),
      ),
      events: body.events.filter(
        (e: IAutoMovieHumanBodyCalibration.IEvent): boolean => owned.test(e.parent),
      ),
      poles: body.poles.filter(
        (p: IAutoMovieHumanBodyCalibration.IPole): boolean => owned.test(p.chain),
      ),
      apertures: [],
      appendages: undefined,
    }).mesh;
    const count: number = mesh.indices.length / 3;
    const owner: string[] = new Array<string>(count).fill("");
    mesh.groups.forEach(
      (g: { name: string; start: number }, k: number): void => {
        const end: number = mesh.groups[k + 1]?.start ?? mesh.indices.length;
        for (let t: number = g.start / 3; t < end / 3; t++) owner[t] = g.name;
      },
    );

    // A vertex's position, and a triangle's unit normal.
    const point: (v: number) => V3 = (v: number): V3 => [
      mesh.positions[3 * v]!,
      mesh.positions[3 * v + 1]!,
      mesh.positions[3 * v + 2]!,
    ];
    const normal: (t: number) => V3 = (t: number): V3 => {
      const a: V3 = point(mesh.indices[3 * t]!);
      return unit(
        cross(
          sub(point(mesh.indices[3 * t + 1]!), a),
          sub(point(mesh.indices[3 * t + 2]!), a),
        ),
      );
    };

    const edges: Map<number, number[]> = new Map();
    const size: number = mesh.positions.length / 3;
    for (let t: number = 0; t < count; t++) {
      if (!keep(owner[t]!)) continue;
      for (let e: number = 0; e < 3; e++) {
        const a: number = mesh.indices[3 * t + e]!;
        const b: number = mesh.indices[3 * t + ((e + 1) % 3)]!;
        const key: number = Math.min(a, b) * size + Math.max(a, b);
        const list: number[] | undefined = edges.get(key);
        if (list === undefined) edges.set(key, [t]);
        else list.push(t);
      }
    }
    const worst: Map<string, IHumanCurveFinding> = new Map();
    const sharp: { region: string; at: V3 }[] = [];
    for (const [key, list] of edges) {
      if (list.length !== 2) continue;
      const angle: number =
        (Math.acos(clamp(dot(normal(list[0]!), normal(list[1]!)))) * 180) / Math.PI;
      if (angle > HAND_SHARP)
        sharp.push({
          region: owner[list[0]!]!.split("/")[0]!,
          at: point(Math.floor(key / size)),
        });
      if (angle <= HAND_TEAR) continue;
      const region: string = owner[list[0]!]!.split("/")[0]!;
      const found: IHumanCurveFinding | undefined = worst.get(region);
      if (found !== undefined) found.count++;
      if (found !== undefined && found.value >= angle) continue;
      worst.set(region, {
        person,
        region,
        rule: "tear",
        where: "mesh",
        value: angle,
        limit: HAND_TEAR,
        count: found?.count ?? 1,
        point: point(Math.floor(key / size)),
      });
    }
    const crumples: Map<string, IHumanCurveFinding> = new Map();

    // Counted about each sharp edge, so a patch reads the same wherever a hand
    // stands, as a fixed grid would not.
    for (const edge of sharp) {
      let near: number = 0;
      for (const other of sharp)
        if (distance(edge.at, other.at) < HAND_PATCH) near++;
      if (near <= HAND_CRUMPLE) continue;
      const found: IHumanCurveFinding | undefined = crumples.get(edge.region);
      if (found !== undefined && found.value >= near) continue;
      crumples.set(edge.region, {
        person,
        region: edge.region,
        rule: "crumple",
        where: "mesh",
        value: near,
        limit: HAND_CRUMPLE,
        count: near,
        point: edge.at,
      });
    }
    return [...worst.values(), ...crumples.values()];
  }

  /** The most a child's own end ring stands off the arc it inherits, per join of a hand. */
  function auditHandJoins(
    person: string,
    body: IAutoMovieHumanBodyCalibration,
    owned: RegExp,
  ): IHumanCurveFinding[] {
    const find: (name: string) => IAutoMovieLoftChain = (name: string): IAutoMovieLoftChain =>
      body.chains.find((c: IAutoMovieLoftChain): boolean => c.name === name)!;

    // A web's children start apart from the parent's ring by design; the mesh
    // rules read the web between them.
    return body.events
      .filter((e: IAutoMovieHumanBodyCalibration.IEvent): boolean => owned.test(e.parent) && e.web !== true)
      .flatMap((event: IAutoMovieHumanBodyCalibration.IEvent): IHumanCurveFinding[] => {
        const parent: IAutoMovieLoftChain = find(event.parent);
        const end: number = parent.layers[0]!.y;
        return event.splits.flatMap((split: IAutoMovieHumanBodyCalibration.ISplit): IHumanCurveFinding[] => {
          const child: IAutoMovieLoftChain = find(split.child);
          const own: V3[] = AutoMovieLoftChain.ring(
            child,
            child.layers[child.layers.length - 1]!.y,
            uniform(720),
          );
          let most: number = 0;
          let at: V3 = [0, 0, 0];
          for (const [from, to] of split.arcs) {
            const span: number = to >= from ? to - from : to + 2 * Math.PI - from;
            for (const p of AutoMovieLoftChain.ring(
              parent,
              end,
              Array.from(
                { length: 48 },
                (_: unknown, i: number): number => from + (span * (i + 0.5)) / 48,
              ),
            )) {
              let best: number = Infinity;
              for (const q of own) best = Math.min(best, distance(p, q));
              if (best > most) {
                most = best;
                at = p;
              }
            }
          }
          return most > HAND_JOIN
            ? [
                {
                  person,
                  region: `${event.parent} > ${child.name}`,
                  rule: "join",
                  where: "own ring",
                  value: most,
                  limit: HAND_JOIN,
                  count: 1,
                  point: at,
                },
              ]
            : [];
        });
      });
  }
}
