import { AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeEquine, AutoMovieArchetypeQuadrupedHead, type createQuadruped, AutoMovieArchetypeHorse } from "@automovie/archetypes";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { nclose } from "./nclose";

/**
 * Actual complete-body head allocation and real head/ear fragment masses.
 *
 * Kubo1992 Table5 source percentages are independently restated, including their
 * printed100.4 total. These are the existing equid model's provisional horse
 * shares, not new donkey/mule anatomy measurements. Actual solids determine uniform within-segment allocation;
 * no ear density or ear mass coefficient is supplied. A genuine three-solid
 * head fixture exposes retained per-part masses through the existing fracture
 * consumer using an explicitly authored unit threshold, not a biological claim.
 */
export namespace EquineEarMass {
  /** The real public quadruped model, including its aggregate physical output. */
  type Model = ReturnType<typeof createQuadruped>;

  /** Integrated actual harness body must retain each source segment's total. */
  export function body(model: Model, label: string, findings: string[]): void {
    const weights: Map<string, number> = new Map([
      ["neck", 7],
      ["tail", 0.1],
      ["withers", 0],
    ]);
    const trunkVolume: number = volume(part(model, "trunk"));
    const rumpVolume: number = volume(part(model, "hindquarters"));
    weights.set("trunk", (59.5 * trunkVolume) / (trunkVolume + rumpVolume));
    weights.set(
      "hindquarters",
      (59.5 * rumpVolume) / (trunkVolume + rumpVolume),
    );
    const headIds: readonly string[] = ["head", "leftEar", "rightEar"];
    const headVolume: number = headIds.reduce(
      (sum: number, id: string): number => sum + volume(part(model, id)),
      0,
    );
    for (const id of headIds)
      weights.set(id, (4.4 * volume(part(model, id))) / headVolume);
    for (const side of ["left", "right"]) {
      for (const [suffix, weight] of [
        ["ForeHumerus", 4.6],
        ["ForeRadius", 0.9],
        ["ForeCannon", 0.3],
        ["ForePastern", 0.3],
        ["HindFemur", 6.9],
        ["HindTibia", 1],
        ["HindCannon", 0.4],
        ["HindPastern", 0.3],
      ] as const)
        weights.set(side + suffix, weight);
    }
    const expected: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    for (const [id, weight] of weights) {
      const at: IAutoMovieVector3 = part(model, id).transform!.translation;
      for (const axis of ["x", "y", "z"] as const)
        expected[axis] += (at[axis] * weight) / 100.4;
    }
    const actual: IAutoMovieVector3 = model.properties.centerOfMass;
    for (const axis of ["x", "y", "z"] as const)
      if (!nclose(actual[axis], expected[axis], 1e-9))
        findings.push(
          `${label}: source head/other-segment allocation changed actual COM.${axis}: ${actual[axis]} expected ${expected[axis]}`,
        );
  }

  /** Existing fracture output exposes actual positive plate masses and the preserved head total. */
  export function fragments(findings: string[]): void {
    const rig: AutoMovieArchetypeEquine.IRig = AutoMovieArchetypeEquine.rig({
      withersHeight: 1.6,
      girth: (1.6 * 2.04) / 1.72,
      mass: 400,
      tempo: 0,
    });
    for (const share of [undefined, 4.4]) {
      const draw: AutoMovieArchetypeDrawSession<never> =
        new AutoMovieArchetypeDrawSession<never>(
          "head-mass-observation",
          {},
          undefined,
        );
      const builder: AutoMovieArchetypeBuilder<never, never> =
        new AutoMovieArchetypeBuilder<never, never>({
          name: "actual head assembly",
          draw,
          material: "skin",
        });
      AutoMovieArchetypeQuadrupedHead(
        builder,
        rig,
        1.6,
        {
          // The head capsule and pinnae only: the horse's massless jaw is no fracture piece.
          poll: AutoMovieArchetypeHorse.BODY.head.poll,
          nose: AutoMovieArchetypeHorse.BODY.head.nose,
          radius: AutoMovieArchetypeHorse.BODY.head.radius,
          mouth: AutoMovieArchetypeHorse.BODY.head.mouth,
          ears: {
            length: 0.2,
            width: 0.08,
            plateThickness: 0.008,
            direction: { x: 1, y: 1, z: 0 },
          },
        },
        "#8a5a3a",
        share,
      );
      const ids: readonly string[] = ["head", "leftEar", "rightEar"];
      builder.fracture(
        ids.map((id: string): { id: string; parts: string[] } => ({
          id,
          parts: [id],
        })),
      );
      const model: ReturnType<typeof builder.build> = builder.build(7.3, {
        restitution: 0,
        outcome: { fracture: 1 },
      });
      const broken: ReturnType<typeof model.broken> = model.broken({
        energy: 1,
        momentum: { x: 0, y: 0, z: 0 },
      });
      if (
        broken === null ||
        broken.remainder !== null ||
        broken.fragments.length !== 3
      ) {
        findings.push(
          "Actual head/ear mass fixture did not expose all three real fragments",
        );
        continue;
      }
      const wholeVolume: number = ids.reduce(
        (sum: number, id: string): number => sum + volume(part(model, id)),
        0,
      );
      let total: number = 0;
      for (const fragment of broken.fragments) {
        const mass: number = fragment.archetype.body.mass;
        const expected: number =
          (7.3 * volume(part(model, fragment.id))) / wholeVolume;
        if (!(mass > 0) || !nclose(mass, expected, 1e-10))
          findings.push(
            `Actual ${fragment.id} mass ${mass} differs from its positive head-volume allocation ${expected}`,
          );
        total += mass;
      }
      if (!nclose(total, 7.3, 1e-10))
        findings.push(
          `Actual head/ear masses lost the original complete head mass: ${total}`,
        );
    }
  }

  /** Elementary actual symmetric-solid volume, independent of production mass helpers. */
  function volume(part: IAutoMovieModelPart): number {
    if (part.geometry.type !== "primitive")
      throw new Error("Head allocation requires actual primitive solids");
    const shape: typeof part.geometry.shape = part.geometry.shape;
    if (shape.type === "box") return shape.width * shape.height * shape.depth;
    if (shape.type === "capsule")
      return (
        Math.PI * shape.radius ** 2 * shape.height +
        (4 / 3) * Math.PI * shape.radius ** 3
      );
    if (shape.type === "cylinder")
      return Math.PI * shape.radius ** 2 * shape.height;
    if (shape.type === "sphere") return (4 / 3) * Math.PI * shape.radius ** 3;
    throw new Error(`Unsupported actual head allocation solid: ${shape.type}`);
  }

  /** A missing physical part is a real failed observation, never a zero placeholder. */
  function part(
    model: { parts: readonly IAutoMovieModelPart[] },
    id: string,
  ): IAutoMovieModelPart {
    const found: IAutoMovieModelPart | undefined = model.parts.find(
      (entry: IAutoMovieModelPart): boolean => entry.id === id,
    );
    if (found === undefined)
      throw new Error(`Missing actual mass-bearing ${id}`);
    return found;
  }
}
