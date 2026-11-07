import { compileImpactEffects } from "@automovie/engine";
import type {
  IAutoMovieCompiledEffect,
  IAutoMovieEffectRecipe,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";
import {
  type IAutoMovieEffectViewerObject,
  buildInstancedEffect,
} from "@automovie/viewer";
import * as THREE from "three";

import type { BoutReceipts } from "./BoutReceipts";

/** This film's sweat/blood palette and budgets; emission, transport, stains and sampling belong to the shared packages. */
export class BoutEffects {
  /** Shared effects attached to the production scene. */
  public readonly object: THREE.Group = new THREE.Group();
  /** Actual delivered or inspected camera, borrowed from the film host. */
  public camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();
  /** Renderers own their stream geometry and materials. */
  private readonly streams: IAutoMovieEffectViewerObject[] = [];
  /** Replace the complete receipt-backed effect population once before playback. */
  public configure(
    impacts: BoutReceipts.IResult["impacts"],
    geometricImpulses: Readonly<Record<string, number>> = {},
  ): void {
    this.clear();
    const seen: Set<string> = new Set();
    for (const impact of impacts) {
      if (seen.has(impact.receipt.id)) continue;
      seen.add(impact.receipt.id);
      const source: Receipt = impact.receipt;
      const peak: NonNullable<Receipt["samples"]>[number] | undefined =
        source.samples?.reduce<
          NonNullable<Receipt["samples"]>[number] | undefined
        >(
          (
            best: NonNullable<Receipt["samples"]>[number] | undefined,
            sample: NonNullable<Receipt["samples"]>[number],
          ): NonNullable<Receipt["samples"]>[number] =>
            !best || sample.impulse > best.impulse ? sample : best,
          undefined,
        );
      const receipt: Receipt = peak
        ? { ...source, ...peak, endSeconds: peak.seconds, samples: undefined }
        : source;
      for (const kind of impact.relation === "head"
        ? (["sweat", "blood"] as const)
        : (["sweat"] as const)) {
        const blood: boolean = kind === "blood";
        const recipe: IAutoMovieEffectRecipe = {
          id: `${impact.actionId}:${receipt.id}:${kind}`,
          kind: "spray",
          seed: 1,
          emission: { rate: 0, burst: 1, duration: 1 / 120 },
          particle: {
            lifetime: { min: blood ? 2 : 0.8, max: blood ? 2 : 0.8 },
            size: { min: blood ? 0.018 : 0.016, max: blood ? 0.036 : 0.032 },
            color: blood ? "#8c0b12" : "#e6f3ff",
            opacity: {
              min: blood ? 1 : 0.8,
              max: blood ? 1 : 0.8,
              envelope: "constant",
            },
          },
          motion: {
            wind: { x: 0, y: 0, z: 0 },
            rise: 0,
            turbulence: blood ? 0.5 : 1.2,
            ballistic: {
              gravity: 9.81,
              floor: 0.002,
              retainStains: blood,
              stainSizeMultiplier: 2.3,
              velocitySpread: { x: 0, y: blood ? 0.45 : 0.8, z: 0 },
            },
          },
          budget: { maxParticles: blood ? 22 : 40, lodDistance: 100 },
          blend: "alpha",
        };
        const compiled: IAutoMovieCompiledEffect[] = compileImpactEffects({
          contacts: [receipt],
          geometricImpulses,
          recipe,
          endSeconds: 180,
          fixedStepSeconds: 1 / 120,
          particlesPerImpulse: blood ? 3 : 6,
          speedPerImpulse: blood ? 0.15 : 0.35,
          upwardFraction: blood ? 0.55 : 0.48,
          maximumEffects: 1,
        });
        for (const effect of compiled) {
          const stream: IAutoMovieEffectViewerObject =
            buildInstancedEffect(effect);
          this.streams.push(stream);
          this.object.add(stream.object);
        }
      }
    }
  }
  /** Draw the shared streams at the exact physical playback clock. */
  public update(seconds: number): void {
    for (const stream of this.streams) stream.update(this.camera, seconds);
  }
  /** Release only this film's effect instances. */
  public dispose(): void {
    this.clear();
    this.object.removeFromParent();
  }
  /** Retire stream-owned GPU resources before replacing the population. */
  private clear(): void {
    for (const stream of this.streams.splice(0)) {
      stream.object.removeFromParent();
      stream.object.geometry.dispose();
      for (const material of Array.isArray(stream.object.material)
        ? stream.object.material
        : [stream.object.material])
        material.dispose();
      stream.object.dispose();
    }
  }
}
