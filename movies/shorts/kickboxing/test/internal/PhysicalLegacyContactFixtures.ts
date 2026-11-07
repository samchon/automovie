import {
  type preparePhysicalGeometry as Geometry,
  Quaternion,
  Vector3,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalProfile as P,
  IAutoMovieContactReceipt as Receipt,
  IAutoMovieVector3 as V,
} from "@automovie/interface";

/** Literal original contact proxies, routed through the shared exact convex query owner. */
export namespace PhysicalLegacyContactFixtures {
  /** Query the separately recorded opening left-glove touch through the same native geometry. */
  export function touch(
    geometry: Geometry.IQueries,
    joints: IQuery["joints"],
    seconds: number,
  ): Receipt {
    const gloves: Geometry.ICollider[] = ["a", "b"].map(
      (id: string): Geometry.ICollider => {
        const hand: readonly number[] = joints[id]!.leftHand!;
        const elbow: readonly number[] = joints[id]!.leftLowerArm!;
        const from: V = { x: hand[0]!, y: hand[1]!, z: hand[2]! };
        const direction: V = Vector3.normalize(
          Vector3.subtract(from, { x: elbow[0]!, y: elbow[1]!, z: elbow[2]! }),
        );
        const center: V = Vector3.add(from, Vector3.scale(direction, 0.065));
        return capsule(id, "leftHand", center, center, 0.095, "glove");
      },
    );
    const receipt: Receipt | null = geometry.contact(
      gloves[0]!,
      gloves[1]!,
      seconds,
      1,
    );
    if (!receipt)
      throw new Error(
        "Opening touch lies outside the recorded metre query domain",
      );
    return { ...receipt, id: "touch" };
  }
  /** Independent recorded world FK and original sampled gap. */
  export interface IQuery {
    /** Original scheduled action; its technique and defence select the recorded geometric query. */
    action: {
      id: string;
      at: number;
      actor: string;
      technique: string;
      defense: string;
    };
    /** Original point-sampled signed separation, metres. */
    gap: number;
    /** Displayed world joint coordinates, by actor then bone. */
    joints: Record<string, Record<string, [number, number, number]>>;
  }
  /** Original technique geometry parameters, recorded before migration. */
  export interface IMetadata {
    /** Original own-side and target-region declarations, without production functions. */
    techniques: Record<string, { side: "left" | "right"; target: string }>;
    /** Original planned receiving relation; null denotes an intentional miss. */
    contactRelations: Record<string, string | null>;
  }

  /** Exact surface gap and an explicit bound on the old eleven-point sampling approximation. */
  export function query(
    geometry: Geometry.IQueries,
    input: IQuery,
    metadata: IMetadata,
  ): { receipt: Receipt; samplingBound: number } {
    const spec: IMetadata["techniques"][string] =
      metadata.techniques[input.action.technique]!;
    const attacker: string = input.action.actor;
    const receiver: string = attacker === "a" ? "b" : "a";
    const struck: "left" | "right" = spec.side === "left" ? "right" : "left";
    const kick: boolean = input.action.technique.endsWith("kick");
    const at: (id: string, bone: string) => V = (
      id: string,
      bone: string,
    ): V => {
      const point: readonly number[] = input.joints[id]![bone]!;
      return {
        x: point[0]!,
        y: point[1]!,
        z: point[2]!,
      };
    };
    const glove: (id: string, side: string) => V = (
      id: string,
      side: string,
    ): V => {
      const hand: V = at(id, `${side}Hand`);
      return Vector3.add(
        hand,
        Vector3.scale(
          Vector3.normalize(Vector3.subtract(hand, at(id, `${side}LowerArm`))),
          0.065,
        ),
      );
    };
    const weapon: Geometry.ICollider = kick
      ? capsule(
          attacker,
          `${spec.side}LowerLeg`,
          at(attacker, `${spec.side}LowerLeg`),
          at(attacker, `${spec.side}Foot`),
          0.055,
          "skin",
        )
      : capsule(
          attacker,
          `${spec.side}Hand`,
          glove(attacker, spec.side),
          glove(attacker, spec.side),
          0.095,
          "glove",
        );
    let targets: Geometry.ICollider[];
    let samplingBound: number = 1e-8;
    if (input.action.defense === "check") {
      targets = [
        capsule(
          receiver,
          "leftLowerLeg",
          at(receiver, "leftLowerLeg"),
          at(receiver, "leftFoot"),
          0.055,
          "skin",
        ),
      ];
      samplingBound +=
        Vector3.length(
          Vector3.subtract(
            at(attacker, `${spec.side}Foot`),
            at(attacker, `${spec.side}LowerLeg`),
          ),
        ) / 20;
    } else if (input.action.defense === "hit" && spec.target === "head") {
      const head: V = at(receiver, "head");
      const toward: V = Vector3.subtract(at(attacker, "hips"), head);
      const forward: V = Vector3.normalize({ x: toward.x, y: 0, z: toward.z });
      const left: V = { x: -forward.z, y: 0, z: forward.x };
      const jaw: V = Vector3.add(
        head,
        Vector3.add(
          Vector3.add(
            Vector3.scale(forward, 0.06),
            Vector3.scale(left, struck === "left" ? 0.07 : -0.07),
          ),
          { x: 0, y: -0.05, z: 0 },
        ),
      );
      targets = [capsule(receiver, "head", jaw, jaw, 1e-12, "skin")];
    } else if (input.action.defense === "hit") {
      targets = [
        capsule(
          receiver,
          "chest",
          at(receiver, "hips"),
          at(receiver, "chest"),
          0.14,
          "skin",
        ),
      ];
      samplingBound +=
        Vector3.length(
          Vector3.subtract(at(receiver, "chest"), at(receiver, "hips")),
        ) / 20;
    } else if (input.action.technique === "uppercut") {
      targets = (["left", "right"] as const).map(
        (side: "left" | "right"): Geometry.ICollider =>
          capsule(
            receiver,
            `${side}Hand`,
            glove(receiver, side),
            glove(receiver, side),
            0.095,
            "glove",
          ),
      );
    } else {
      targets = [
        capsule(
          receiver,
          `${struck}Hand`,
          glove(receiver, struck),
          glove(receiver, struck),
          0.095,
          "glove",
        ),
      ];
      if (kick) {
        const midpoint: V = Vector3.scale(
          Vector3.add(
            at(receiver, `${struck}LowerArm`),
            at(receiver, `${struck}Hand`),
          ),
          0.5,
        );
        targets.push(
          capsule(
            receiver,
            `${struck}LowerArm`,
            midpoint,
            midpoint,
            0.05,
            "skin",
          ),
        );
      }
    }
    const contacts: Receipt[] = targets.map(
      (target: (typeof targets)[number]): Receipt => {
        // Positive gaps are intentional measurements here. The caller applies
        // the recorded landing threshold before publishing a contact event.
        const receipt: Receipt | null = geometry.contact(
          target,
          weapon,
          input.action.at,
          10,
        );
        if (!receipt)
          throw new Error(
            `Recorded geometric pair outside explicit query domain: ${input.action.id}`,
          );
        return { ...receipt, id: input.action.id };
      },
    );
    const receipt: Receipt = contacts.reduce(
      (best: Receipt, value: Receipt): Receipt =>
        value.separation < best.separation ? value : best,
    );
    return { receipt, samplingBound };
  }

  /** Place the old sphere/capsule proxy without changing either recorded endpoint. */
  function capsule(
    body: string,
    bone: string,
    from: V,
    to: V,
    radius: number,
    material: string,
  ): Geometry.ICollider {
    const delta: V = Vector3.subtract(to, from);
    const length: number = Vector3.length(delta);
    const direction: V =
      length > 0 ? Vector3.scale(delta, 1 / length) : { x: 0, y: 1, z: 0 };
    const rotation: P.ITransform["rotation"] =
      direction.y < -1 + 1e-10
        ? { x: 1, y: 0, z: 0, w: 0 }
        : Quaternion.normalize({
            x: direction.z,
            y: 0,
            z: -direction.x,
            w: 1 + direction.y,
          });
    return {
      body,
      bone,
      pose: { position: Vector3.scale(Vector3.add(from, to), 0.5), rotation },
      shape: {
        id: "recorded-contact-proxy",
        material,
        kind: "capsule",
        radius,
        halfLength: length / 2,
        transform: {
          position: { x: 0, y: 0, z: 0 },
          rotation: Quaternion.identity(),
        },
      },
    };
  }
}
