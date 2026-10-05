import type { IHumanSourceEnvelopeSide } from "./IHumanSourceEnvelopeSide.ts";

/**
 * The parameters of the envelope detail producer.
 *
 * @author Samchon
 */
export interface IHumanSourceEnvelopeProducer {
  /** Field revision name the regenerated rows carry. */
  revision: string;

  /** Diffusion length of the endpoint's motion low-pass, metres. */
  motionMetres: number;

  /** Diffusion length splitting the residual thickness, metres. */
  thicknessMetres: number;

  /** Weight magnitude of the authored endpoint node. */
  node: number;

  /** Storage step of the written rows, metres. */
  storageMetres: number;

  /** The extended sides written. */
  sides: IHumanSourceEnvelopeSide[];
}
