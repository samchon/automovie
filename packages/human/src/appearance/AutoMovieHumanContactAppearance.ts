import {
  Quaternion,
  Vector3,
  samplePhysicalContactEvents,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
} from "@automovie/interface";

/** Local Human skin marks and short-lived compression carried by actual struck bones. */
export namespace AutoMovieHumanContactAppearance {
  /** A renderer applies these local values to its actual surface samples. */
  export interface ISample {
    /** Linear RGB multiplier; neutral is [1,1,1]. */ color: [
      number,
      number,
      number,
    ];
    /** Bone-local displacement, metres. */ displacement: IAutoMovieVector3;
  }
  /** Prepare immutable local patches once, without tinting a complete body part. */
  export function prepare(input: {
    /** Scene identity of this person. */ body: string;
    /** Actual completed contact episodes. */ contacts: readonly Receipt[];
    /** Same physical display poses used when each contact occurred. */ frameAt: (
      seconds: number,
      bone: string,
    ) => P.ITransform;
    /** Explicit skin material ids; equipment can remain excluded. */ materials: readonly string[];
    /** Radius in metres around each actual surface point. */ radius: number;
    /** Local color weight per normal N s. */ weightPerImpulse: number;
    /** Full-weight linear RGB multiplier, a visualization rather than an injury prediction. */ color: [
      number,
      number,
      number,
    ];
    /** Decay of accumulated color, seconds; Infinity retains it. */ decaySeconds: number;
    /** Decay of visible compression, seconds. */ compressionSeconds: number;
    /** Explicit fallback formula impulses for the kinematic path. */ geometricImpulses: Readonly<
      Record<string, number>
    >;
  }): (bone: string, point: IAutoMovieVector3, seconds: number) => ISample {
    if (
      !(input.radius > 0) ||
      !Number.isFinite(input.radius) ||
      !(input.weightPerImpulse >= 0) ||
      !Number.isFinite(input.weightPerImpulse) ||
      !(input.decaySeconds > 0) ||
      !(input.compressionSeconds > 0) ||
      !Number.isFinite(input.compressionSeconds) ||
      !Array.isArray(input.color) ||
      input.color.length !== 3 ||
      !Array.from(input.color).every(
        (value: number): boolean =>
          Number.isFinite(value) && value >= 0 && value <= 1,
      )
    )
      throw new Error("Invalid Human contact appearance policy");
    const color: [number, number, number] = [...input.color];
    const policy: Pick<
      typeof input,
      "radius" | "weightPerImpulse" | "decaySeconds" | "compressionSeconds"
    > = {
      radius: input.radius,
      weightPerImpulse: input.weightPerImpulse,
      decaySeconds: input.decaySeconds,
      compressionSeconds: input.compressionSeconds,
    };
    const patches: Map<
      string,
      {
        seconds: number;
        point: IAutoMovieVector3;
        normal: IAutoMovieVector3;
        impulse: number;
        compression: number;
      }[]
    > = new Map();
    for (const receipt of input.contacts)
      for (const [side, direction] of [
        [receipt.a, 1],
        [receipt.b, -1],
      ] as const) {
        if (
          side.body !== input.body ||
          !input.materials.includes(side.material)
        )
          continue;
        const events: Receipt[] = samplePhysicalContactEvents(receipt);
        for (const event of events) {
          const impulse: number | undefined =
            event.source === "solver"
              ? event.impulse!
              : input.geometricImpulses[receipt.id];
          if (impulse === undefined || !Number.isFinite(impulse) || impulse < 0)
            throw new Error(
              `Human appearance requires an actual or formula impulse: ${receipt.id}`,
            );
          const pose: P.ITransform = input.frameAt(event.seconds, side.bone);
          const inverse: P.ITransform["rotation"] = Quaternion.inverse(
            pose.rotation,
          );
          const patch: {
            seconds: number;
            point: IAutoMovieVector3;
            normal: IAutoMovieVector3;
            impulse: number;
            compression: number;
          } = {
            seconds: event.seconds,
            point: Quaternion.rotateVector(
              inverse,
              Vector3.subtract(event.point, pose.position),
            ),
            normal: Quaternion.rotateVector(
              inverse,
              Vector3.scale(event.normal, direction),
            ),
            impulse,
            compression: event.compression,
          };
          if (!patches.has(side.bone)) patches.set(side.bone, []);
          patches.get(side.bone)!.push(patch);
        }
      }
    return (
      bone: string,
      point: IAutoMovieVector3,
      seconds: number,
    ): ISample => {
      if (
        !Number.isFinite(seconds) ||
        seconds < 0 ||
        ![point.x, point.y, point.z].every(Number.isFinite)
      )
        throw new Error("Invalid Human surface sample");
      let weight: number = 0;
      let displacement: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
      for (const patch of patches.get(bone) ?? []) {
        if (patch.seconds > seconds) continue;
        const distance: number =
          Vector3.length(Vector3.subtract(point, patch.point)) / policy.radius;
        if (distance >= 1) continue;
        const kernel: number = (1 - distance * distance) ** 2;
        const age: number = seconds - patch.seconds;
        weight +=
          patch.impulse *
          policy.weightPerImpulse *
          kernel *
          Math.exp(-age / policy.decaySeconds);
        const depth: number =
          patch.compression *
          kernel *
          Math.exp(-age / policy.compressionSeconds);
        if (depth > Vector3.length(displacement))
          displacement = Vector3.scale(patch.normal, -depth);
      }
      const strength: number = Math.min(1, weight);
      return {
        color: color.map(
          (component: number): number => 1 + (component - 1) * strength,
        ) as [number, number, number],
        displacement,
      };
    };
  }
}
