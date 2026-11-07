import { Vector3, compileImpactEffects } from "@automovie/engine";
import type {
  IAutoMovieCompiledEffect,
  IAutoMovieEffectRecipe,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

/** Recorded legacy artistic effect inputs adapted to the existing compiled-effect owner, with explicitly estimated momentum. */
export namespace PhysicalLegacyEffectFixtures {
  /** Captured original measured landing plus its artistic emission direction. */
  export interface IImpact {
    /** Original action identifier, also owning its deterministic spray seed. */
    id: string;
    /** Original measured landing time, film seconds. */
    seconds: number;
    /** Original striking actor. */
    attacker: string;
    /** Original struck actor. */
    receiver: string;
    /** Original receiving-surface classification. */
    relation: "head" | "body" | "guard" | "shin-check";
    /** Receiver's struck anatomical side. */
    side: "left" | "right";
    /** Original striking glove side or shin. */
    weapon: "left" | "right" | "shin";
    /** Original receiving point, world metres. */
    point: [number, number, number];
    /** Original artistic spray direction; it is not a solver manifold normal. */
    direction: [number, number, number];
    /** Original geometric/artistic strength in [0,1], not measured momentum. */
    strength: number;
    /** Original finishing-contact declaration. */
    finish: boolean;
  }
  /** Original precomputed particle and optional persistent floor stain. */
  export interface IDroplet {
    /** Original visual material. */
    kind: "sweat" | "blood";
    /** Original release time, film seconds. */
    start: number;
    /** Original landing or disappearance time, film seconds. */
    end: number;
    /** Original release point, world metres. */
    origin: [number, number, number];
    /** Original release velocity, world metres/second. */
    velocity: [number, number, number];
    /** Original sphere radius, metres. */
    radius: number;
    /** Original persistent floor X/Z and radius, metres. */
    stain?: [number, number, number];
  }
  /** Captured inputs needed for an independent side-by-side effect consumer. */
  export interface IRecord {
    /** Complete original geometric landings and artistic emission inputs. */
    impacts: IImpact[];
    /** Independently captured original precomputed droplets. */
    droplets: IDroplet[];
  }

  /** Match original emission budgets and size ranges; transport remains the shared stateless ballistic sampler. */
  export function compile(
    impacts: readonly IImpact[],
    gaps: ReadonlyMap<string, number>,
  ): IAutoMovieCompiledEffect[] {
    return impacts.flatMap(
      (impact: (typeof impacts)[number]): IAutoMovieCompiledEffect[] => {
        const normal: ReturnType<typeof Vector3.normalize> = Vector3.normalize({
          x: -impact.direction[0],
          y: 0,
          z: -impact.direction[2],
        });
        // This is the original geometric landing and artistic direction, not a
        // solver manifold or measured momentum. The hint estimate is explicitly
        // 0.25 kg * (4 m/s * recorded strength), shared by both effect recipes.
        const receipt: Receipt = {
          id: `legacy-effect:${impact.id}`,
          source: "geometric",
          seconds: impact.seconds,
          endSeconds: impact.seconds,
          a: {
            body: impact.receiver,
            bone:
              impact.relation === "head"
                ? "head"
                : impact.relation === "body"
                  ? "chest"
                  : `${impact.side}${impact.relation === "guard" ? "Hand" : "LowerLeg"}`,
            shape: "recorded-landing",
            material: impact.relation === "guard" ? "glove" : "skin",
          },
          b: {
            body: impact.attacker,
            bone:
              impact.weapon === "shin" ? "LowerLeg" : `${impact.weapon}Hand`,
            shape: "recorded-weapon",
            material: "glove",
          },
          point: { x: impact.point[0], y: impact.point[1], z: impact.point[2] },
          normal,
          impulse: null,
          separation: gaps.get(impact.id)!,
          compression: Math.max(0, -gaps.get(impact.id)!),
        };
        const counts: { sweat: number; blood: number } =
          impact.relation === "head"
            ? { sweat: impact.finish ? 40 : 24, blood: impact.finish ? 22 : 6 }
            : impact.relation === "body"
              ? { sweat: 20, blood: 0 }
              : { sweat: 7, blood: 0 };
        return (["sweat", "blood"] as const).flatMap(
          (kind: "sweat" | "blood"): IAutoMovieCompiledEffect[] => {
            if (counts[kind] === 0) return [];
            const blood: boolean = kind === "blood";
            const speed: number = blood ? 1 : 2.3;
            const recipe: IAutoMovieEffectRecipe = {
              id: `${impact.id}:${kind}`,
              kind: "spray",
              seed: 1,
              emission: { rate: 0, burst: 1, duration: 1 / 120 },
              particle: {
                lifetime: { min: blood ? 2 : 0.8, max: blood ? 2 : 0.8 },
                size: {
                  min: blood ? 0.018 : 0.016,
                  max: blood ? 0.036 : 0.032,
                },
                color: blood ? "#8c0b12" : "#e6f3ff",
                opacity: { min: blood ? 1 : 0.8, max: blood ? 1 : 0.8 },
              },
              motion: {
                wind: { x: 0, y: 0, z: 0 },
                rise: 0,
                turbulence: blood ? 0.5 : 1.2,
                ballistic: { gravity: 9.81, floor: 0.002, retainStains: blood },
              },
              budget: { maxParticles: 64, lodDistance: 100 },
              blend: "alpha",
            };
            recipe.particle.opacity.envelope = "constant";
            recipe.motion.ballistic!.velocitySpread = {
              x: 0,
              y: blood ? 0.45 : 0.8,
              z: 0,
            };
            recipe.motion.ballistic!.stainSizeMultiplier = 2.3;
            return compileImpactEffects({
              contacts: [receipt],
              geometricImpulses: { [receipt.id]: 0.25 * 4 * impact.strength },
              recipe,
              endSeconds: 180,
              fixedStepSeconds: 1 / 120,
              particlesPerImpulse: counts[kind],
              speedPerImpulse: speed,
              upwardFraction: (blood ? 0.55 : 1.1) / speed,
              maximumEffects: 1,
            });
          },
        );
      },
    );
  }
}
