import type { IAutoMovieCurve64 as C } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IAutoMovieHumanSkeleton as K } from "../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanSurfaceMeasurements as M } from "../structures/IAutoMovieHumanSurfaceMeasurements";
import { AutoMovieHumanSectionField64 } from "./AutoMovieHumanSectionField64";
import type { AutoMovieHumanSurfaceBuilder64 } from "./AutoMovieHumanSurfaceBuilder64";
import type { IAutoMovieHumanSurfaceDefinition as D } from "./IAutoMovieHumanSurfaceDefinition";
import { generateAutoMovieHumanSection64 } from "./generateAutoMovieHumanSection64";

/**
 * Dimensioned limb field in the one actual rest skeleton, ending at owned cuts.
 * The proximal plane is the mechanical upper-segment midpoint; the distal plane
 * is the actual hand/foot joint. Elbow/knee planes use the adjacent-axis bisector,
 * and the forearm/calf support lies one quarter down the distal segment. These
 * are explicit support-chart conventions, not clinical landmark equivalences.
 * Independent supplied B/D/G values are neither scaled by stature nor changed
 * when another value is edited. The station field owns world-vector full jets;
 * neighboring junctions consume the same proximal curve and jet coefficients.
 */
export class AutoMovieHumanSurfaceLimb64 {
  /** Owned mechanical mid-upper-segment cut and its complete physical jet. */
  public readonly proximal: D.Boundary;
  /** Owned hand/foot-joint cut; the missing terminal region stays explicit. */
  public readonly distal: D.Boundary;
  private readonly field: AutoMovieHumanSectionField64;
  private readonly stations: number[];
  private readonly ids: string[];
  private readonly owner: D.Patch;

  /** Resolve one named side through the admitted skeleton, never through a second rig. */
  public constructor(private readonly props: {
    part: "arm" | "leg";
    side: "left" | "right";
    skeleton: K;
    sections: readonly [M.Envelope, M.Envelope, M.Envelope, M.Envelope];
  }) {
    const prefix: string = props.side;
    const names: readonly string[] = props.part === "arm"
      ? ["UpperArm", "LowerArm", "Hand"] : ["UpperLeg", "LowerLeg", "Foot"];
    const bones: AutoMovieHumanoidBone[] = names.map(
      (name: string): AutoMovieHumanoidBone => `${prefix}${name}` as AutoMovieHumanoidBone);
    const joints: C.Vector[] = bones.map((bone: AutoMovieHumanoidBone): C.Vector => {
      const joint: K.IJoint | undefined = props.skeleton.joints.find(
        (candidate: K.IJoint): boolean => candidate.bone === bone);
      if (joint === undefined) throw new Error(`Missing actual limb joint ${bone}`);
      return [joint.position.x, joint.position.y, joint.position.z];
    });
    const subtract: (a: C.Vector, b: C.Vector) => C.Vector =
      (a: C.Vector, b: C.Vector): C.Vector => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
    const a: C.Vector = subtract(joints[1]!, joints[0]!);
    const b: C.Vector = subtract(joints[2]!, joints[1]!);
    const upper: number = Math.hypot(...a);
    const lower: number = Math.hypot(...b);
    if (!(upper > 0 && lower > 0)) throw new Error("Positive mechanical limb chords required");
    const first: C.Vector = a.map((x: number): number => x/upper) as unknown as C.Vector;
    const last: C.Vector = b.map((x: number): number => x/lower) as unknown as C.Vector;
    const middle: C.Vector = AutoMovieHumanSurfaceLimb64.unit([
      first[0]+last[0], first[1]+last[1], first[2]+last[2],
    ]);
    const centres: C.Vector[] = [
      joints[0]!.map((x: number, k: number): number => x+a[k]!/2) as unknown as C.Vector,
      joints[1]!,
      joints[1]!.map((x: number, k: number): number => x+b[k]!/4) as unknown as C.Vector,
      joints[2]!,
    ];
    const axes: C.Vector[] = [first, middle, last, last];
    this.stations = [upper/2, upper, upper+lower/4, upper+lower];
    this.ids = ["proximal", props.part === "arm" ? "elbow" : "knee",
      props.part === "arm" ? "forearm" : "calf", "distal"].map(
      (name: string): string => `${props.part}.${props.side}/${name}`);
    const courses: C.Cubic[] = props.sections.map((section: M.Envelope, i: number): C.Cubic => {
      const axis: C.Vector = axes[i]!;
      const anterior: C.Vector = AutoMovieHumanSurfaceLimb64.unit([
        -axis[0]*axis[2], -axis[1]*axis[2], 1-axis[2]*axis[2],
      ]);
      const breadth: C.Vector = [
        anterior[1]*axis[2]-anterior[2]*axis[1],
        anterior[2]*axis[0]-anterior[0]*axis[2],
        anterior[0]*axis[1]-anterior[1]*axis[0],
      ];
      return generateAutoMovieHumanSection64({
        name: this.ids[i]!, ...section, centreMm: centres[i]!,
        breadthAxis: breadth, anteriorAxis: anterior,
      }).curve;
    });
    this.field = new AutoMovieHumanSectionField64(this.stations, courses);
    this.owner = {part: props.part, side: props.side, branch: null,
      skinRole: "ordinary", bones, textureRectangle: [0,0,1,1], headChart: null};
    this.proximal = {
      id: this.ids[0]!, curve: this.field.courses[0]!, fullJ: this.field.fullJ[0]!,
      longitudinalAxis: first, incidents: [],
    };
    this.distal = {
      id: this.ids[3]!, curve: this.field.courses[3]!, fullJ: this.field.fullJ[3]!,
      longitudinalAxis: last, incidents: [],
    };
  }

  /** Publish these same fields; the caller supplies actual proximal incidence. */
  public emit(builder: AutoMovieHumanSurfaceBuilder64, proximalConnected: boolean): void {
    for (let i: number = 0; i < 3; ++i)
      builder.strip({
        id: `${this.props.part}.${this.props.side}/${i}`,
        start: {id: this.ids[i]!, curve: this.field.courses[i]!, fullJ: this.field.fullJ[i]!},
        end: {id: this.ids[i+1]!, curve: this.field.courses[i+1]!, fullJ: this.field.fullJ[i+1]!},
        lengthMm: this.stations[i+1]!-this.stations[i]!, owner: this.owner,
      });
    builder.boundary({...this.proximal, incidents: [
      {chart: this.props.part === "arm" ? "shoulder-axilla" : "pelvis-groin",
        status: proximalConnected ? "generated" : "missing"},
      {chart: `${this.props.part}.${this.props.side}/0`, status: "generated"},
    ]});
    builder.boundary({...this.distal, incidents: [
      {chart: `${this.props.part}.${this.props.side}/2`, status: "generated"},
      {chart: this.props.part === "arm" ? "hand" : "foot", status: "missing"},
    ]});
  }

  /** A degenerate transported reference leaves the frame unresolved. */
  private static unit(value: C.Vector): C.Vector {
    const length: number = Math.hypot(...value);
    if (!(length > 0) || !Number.isFinite(length)) throw new Error("Unresolved physical limb frame");
    return value.map((x: number): number => x/length) as unknown as C.Vector;
  }
}
