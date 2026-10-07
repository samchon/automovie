from dataclasses import dataclass


@dataclass(frozen=True)
class EarSection:
    """Independent source-pinna section differences, in millimetres/degrees.

    Zero retains the licensed neutral. Projection raises the named source fold
    laterally; recession deepens an authored conchal or posterior attachment
    support. Thickness changes front/back skin together. The source charts and
    sparse witnesses are declared conventions, not clinical region boundaries,
    cartilage acquisition or a reconstructed personal ear. Paired instances
    each carry a complete independent record.
    """
    helixRimProjectionOffsetMillimetres: float
    antihelixProjectionOffsetMillimetres: float
    superiorCrusProjectionOffsetMillimetres: float
    inferiorCrusProjectionOffsetMillimetres: float
    cymbaFloorRecessionOffsetMillimetres: float
    cavumFloorRecessionOffsetMillimetres: float
    tragusProjectionOffsetMillimetres: float
    antitragusProjectionOffsetMillimetres: float
    lobuleHeightOffsetMillimetres: float
    lobuleBreadthOffsetMillimetres: float
    pinnaSectionThicknessOffsetMillimetres: float
    retroauricularSulcusRecessionOffsetMillimetres: float
    pinnaInclinationOffsetDegrees: float
