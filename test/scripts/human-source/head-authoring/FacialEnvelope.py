from dataclasses import dataclass


@dataclass(frozen=True)
class FacialEnvelope:
    """Independent paired source-envelope differences in millimetres.

    Projection is anterior, hollowing recesses buccal skin, mandibular breadth
    advances each side laterally and chin height descends. Supports are named
    source landmarks and conventional smooth chart intervals; these controls
    provide exterior geometry and infer no bone, fat volume or clinical grade.
    """
    leftMalarProjectionOffsetMillimetres: float
    rightMalarProjectionOffsetMillimetres: float
    leftBuccalHollowOffsetMillimetres: float
    rightBuccalHollowOffsetMillimetres: float
    leftMandibularBreadthOffsetMillimetres: float
    rightMandibularBreadthOffsetMillimetres: float
    chinProjectionOffsetMillimetres: float
    chinHeightOffsetMillimetres: float
