import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanLayerPlane } from "./HumanLayerPlane";
import type { HumanPopulation } from "./HumanPopulation";

type V3 = HumanAnatomy.V3;

const A: typeof HumanAnatomy = HumanAnatomy;


/**
 * Every principal layer of every loft chain of a generated person, as a place
 * to cut.
 *
 * A layer names a plane: its frame when it has one, else the horizontal plane
 * at its station. The plane only chooses where to cut and names what is found
 * there, as `chain/k`; the layer's own section is never the expected value of
 * a reference reading.
 */
export namespace HumanLayerSite {
  /** One principal layer of one chain, as a place to cut. */
  export interface ISite {
    /** Chain name. */
    chain: string;

    /** Layer index within the chain. */
    layer: number;

    /** Number of layers of the chain. */
    layers: number;

    /** The layer's station, mm. */
    station: number;

    /** The layer's plane. */
    plane: HumanLayerPlane.IPlane;

    /** The layer's section at {@link PHASES} uniform phases, world mm; used only to locate and to name phases. */
    ring: V3[];

    /** The ring's mean point projected into the plane, mm. */
    centre: V3;

    /** Largest distance of a ring point from the centre, mm. */
    reach: number;

    /** Whether a ring point stands more than {@link LIFT} from the plane, the section leaving it by a lift. */
    lifted: boolean;

    /** Whether ISO 20685-1 classes this section's girth as large (trunk, thigh). */
    large: boolean;

    /** The surveyed ANSUR 1988 measure nearest this section, whose variation floors its reference limits. */
    dimension: HumanPopulation.Variable;

    /** Continuity the chain declares across this layer: C2 when the layer and both neighbours carry curvatures, else C1; null at a chain end. */
    continuity: "C1" | "C2" | null;

    /** Length of the shorter interval beside the layer, mm. */
    interval: number;
  }

  /** Uniform phases at which a layer's ring is sampled. */
  export const PHASES: number = 360;

  /** Distance from its plane past which a ring point makes its section lifted rather than planar, mm. */
  export const LIFT: number = 0.05;

  /** Ring reach below which a layer is a pole or a tip, not a section, mm. */
  export const POLE: number = 2;

  /**
   * Every layer of a generated person's chains as a place to cut.
   *
   * @param views The person's skin views, held by the caller.
   */
  export function sites(views: HumanAnatomy.IViews): ISite[] {
    const out: ISite[] = [];
    const chains: IAutoMovieHumanLoftChain[] = views.person.body.chains;
    const joints: Map<string, V3> = views.bind().joints;
      const knee: number | undefined = joints.get("leftLowerLeg")?.[1];
      const phases: number[] = Array.from({ length: PHASES }, (_: unknown, i: number): number => (2 * Math.PI * i) / PHASES);

      for (const chain of chains)
        chain.layers.forEach((layer: IAutoMovieHumanLoftChain.ILayer, k: number): void => {
          out.push(site(chain, layer, k, phases, joints, knee));
        });

    return out;
  }

  /**
   * The chain phase of a world point: the nearest sample of the layer's ring.
   *
   * @param s The layer.
   * @param p A world point, mm.
   * @returns The phase in degrees.
   */
  export function phase(s: ISite, p: V3): number {
    let best: number = 0;
    let bestD: number = Infinity;

    s.ring.forEach((r: V3, i: number): void => {
      const d: number = (r[0] - p[0]) ** 2 + (r[1] - p[1]) ** 2 + (r[2] - p[2]) ** 2;

      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });

    return (360 * best) / PHASES;
  }
}

/** One layer's site: its plane, its ring, and what the readings need to know about the place. */
function site(
  chain: IAutoMovieHumanLoftChain,
  layer: IAutoMovieHumanLoftChain.ILayer,
  k: number,
  phases: number[],
  joints: Map<string, V3>,
  knee: number | undefined,
): HumanLayerSite.ISite {
  const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = chain.layers;
  const frame: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(chain, layer.y);
  const ring: V3[] = AutoMovieHumanLoftChain.ring(chain, layer.y, phases) as V3[];
  const plane: HumanLayerPlane.IPlane = HumanLayerPlane.chart(frame.origin as V3, A.cross(frame.v as V3, frame.u as V3), frame.u as V3);

  // The ring's mean lies off its plane when the section is lifted; the centre is its shadow in the plane.
  let mean: V3 = [0, 0, 0];

  for (const p of ring) mean = A.add(mean, A.scale(p, 1 / ring.length));

  const centre: V3 = A.sub(mean, A.scale(plane.normal, A.dot(A.sub(mean, plane.origin), plane.normal)));
  const interior: boolean = k > 0 && k < layers.length - 1;
  const curved: boolean = interior && layers[k - 1]!.curvatures !== undefined && layer.curvatures !== undefined && layers[k + 1]!.curvatures !== undefined;

  return {
    chain: chain.name,
    layer: k,
    layers: layers.length,
    station: layer.y,
    plane,
    ring,
    centre,
    reach: Math.max(...ring.map((p: V3): number => A.dist(p, centre))),
    lifted: ring.some((p: V3): boolean => Math.abs(A.dot(A.sub(p, plane.origin), plane.normal)) > HumanLayerSite.LIFT),
    large: chain.name === "trunk" || chain.name === "upper" || (chain.name.startsWith("leg.") && knee !== undefined && centre[1] > knee),
    dimension: nearestDimension(chain.name, centre, joints),
    continuity: !interior ? null : curved ? "C2" : "C1",
    interval: Math.min(k > 0 ? layer.y - layers[k - 1]!.y : Infinity, k < layers.length - 1 ? layers[k + 1]!.y - layer.y : Infinity),
  };
}

/**
 * The ANSUR 1988 measure nearest a section, located by its chain and the
 * rig's joints: the trunk's buttock, natural waist or chest by the hips and
 * chest joints; the neck base, neck and head circumference up the head
 * chains; ear breadth; the arm's flexed biceps, elbow, flexed forearm and
 * wrist by thirds of the forearm; hand circumference for the hand and digits;
 * the leg's proximal thigh, knee and calf; foot breadth for the foot and toes.
 */
function nearestDimension(chain: string, p: V3, joints: Map<string, V3>): HumanPopulation.Variable {
  const head: string = chain.split(".")[0]!;
  const side: string = chain.includes("right") ? "right" : "left";
  const y: (bone: string) => number = (bone: string): number => joints.get(bone)?.[1] ?? NaN;

  // How far along a limb segment a point projects, 0 at its first joint and 1 at its second.
  const along: (first: string, second: string) => number = (first: string, second: string): number => {
    const pa: V3 | undefined = joints.get(side + first);
    const pb: V3 | undefined = joints.get(side + second);

    if (pa === undefined || pb === undefined) return NaN;

    const ab: V3 = A.sub(pb, pa);

    return A.dot(A.sub(p, pa), ab) / A.dot(ab, ab);
  };

  if (chain === "trunk") return p[1] < y("hips") ? "buttock" : p[1] < y("chest") ? "waist" : "chest";
  if (chain === "upper") return "chest";
  if (chain === "head") return "neckBase";
  if (chain === "head.lower") return p[1] < y("head") ? "neck" : "headCircumference";
  if (head === "head") return "headCircumference";
  if (head === "ear") return "earBreadth";

  if (head === "arm") {
    const f: number = along("LowerArm", "Hand");

    return !(f >= 0) ? "bicepsFlexed" : f < 1 / 3 ? "elbow" : f < 2 / 3 ? "forearmFlexed" : "wrist";
  }

  if (head === "hand" || head === "thumb" || head === "finger") return "handCircumference";

  if (head === "leg") {
    const f: number = along("UpperLeg", "LowerLeg");

    return f < 2 / 3 ? "thigh" : f < 4 / 3 ? "knee" : "calf";
  }

  return "footBreadth";
}
