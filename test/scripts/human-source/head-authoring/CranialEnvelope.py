from dataclasses import dataclass


@dataclass(frozen=True)
class CranialEnvelope:
    """Source-neutral cranial trait differences, not clinical population norms.

    Millimetres are actual displacement dimensions of the source-envelope
    chart. Zero retains the supplied neutral. Positive breadth widens, height
    raises the vault, occiput advances posteriorly and forehead lean tilts
    anteriorly about its source glabella. This is a prototype exterior surface,
    not reconstructed skull bone or an inferred personal cranial section.
    """
    vaultBreadthOffsetMillimetres: float
    vaultHeightOffsetMillimetres: float
    occipitalProjectionOffsetMillimetres: float
    foreheadInclinationOffsetDegrees: float
    temporalBreadthOffsetMillimetres: float
