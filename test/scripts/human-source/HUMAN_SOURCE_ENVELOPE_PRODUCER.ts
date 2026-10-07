import type { IHumanSourceEnvelopeProducer } from "./structures/IHumanSourceEnvelopeProducer.ts";

/**
 * The envelope detail producer, revision "envelope-g1". Kept from the published
 * receipt (envelope-detail-receipt.json): the structure (motion low-pass,
 * normal thickness of the residual split into smooth and detail, a ramped
 * corrective that removes the detail's extrapolation along the normal), the
 * cotangent heat operator with lumped mass, the diffusion lengths 150 and
 * 40 mm and each side's end. Chosen anew because the receipt does not
 * determine them: the step length t = L² / 2 (the heat kernel's variance 2t
 * equals σ² of a Gaussian with σ = L), the held boundary as a Dirichlet
 * condition that keeps the input value, the body view's neutral and normals,
 * mirror averaging for symmetry and the same nipple refill as every other
 * endpoint. The receipt's detail fractions and largest removals are listed
 * beside the new readings for comparison and are not fitted.
 */
export const HUMAN_SOURCE_ENVELOPE_PRODUCER: IHumanSourceEnvelopeProducer = {
  revision: "envelope-g1",
  motionMetres: 0.15,
  thicknessMetres: 0.04,
  node: 1,
  storageMetres: 1e-5,
  sides: [
    {
      id: "envelope/measureShoulderDist.positive",
      channel: "measureShoulderDist",
      side: "positive",
      end: 2,
      receiptDetailFraction: 0.059,
      receiptWorstRemovedAtEndMillimetres: 8,
    },
    {
      id: "envelope/measureShoulderDist.negative",
      channel: "measureShoulderDist",
      side: "negative",
      end: 2,
      receiptDetailFraction: 0.054,
      receiptWorstRemovedAtEndMillimetres: 3.5,
    },
    {
      id: "envelope/measureWaistCirc.positive",
      channel: "measureWaistCirc",
      side: "positive",
      end: 3.5,
      receiptDetailFraction: 0.095,
      receiptWorstRemovedAtEndMillimetres: 7.1,
    },
    {
      id: "envelope/measureWaistCirc.negative",
      channel: "measureWaistCirc",
      side: "negative",
      end: 2,
      receiptDetailFraction: 0.095,
      receiptWorstRemovedAtEndMillimetres: 2.8,
    },
    {
      id: "envelope/measureBustCirc.positive",
      channel: "measureBustCirc",
      side: "positive",
      end: 1.25,
      receiptDetailFraction: 0.109,
      receiptWorstRemovedAtEndMillimetres: 1.4,
    },
    {
      id: "envelope/measureBustCirc.negative",
      channel: "measureBustCirc",
      side: "negative",
      end: 2,
      receiptDetailFraction: 0.137,
      receiptWorstRemovedAtEndMillimetres: 8.8,
    },
    {
      id: "envelope/stomachPregnant.positive",
      channel: "stomachPregnant",
      side: "positive",
      end: 2,
      receiptDetailFraction: 0.141,
      receiptWorstRemovedAtEndMillimetres: 16,
    },
    {
      id: "envelope/macroMuscle.positive",
      channel: "macroMuscle",
      side: "positive",
      end: 2,
      receiptDetailFraction: 0.186,
      receiptWorstRemovedAtEndMillimetres: 5.9,
    },
    {
      id: "envelope/macroWeight.positive",
      channel: "macroWeight",
      side: "positive",
      end: 9,
      receiptDetailFraction: 0.111,
      receiptWorstRemovedAtEndMillimetres: 39.4,
    },
    {
      id: "envelope/macroWeight.negative",
      channel: "macroWeight",
      side: "negative",
      end: 2.5,
      receiptDetailFraction: 0.144,
      receiptWorstRemovedAtEndMillimetres: 7.3,
    },
  ],
};
