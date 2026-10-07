from dataclasses import dataclass


@dataclass(frozen=True)
class NasalEnvelope:
    """Independent source-nasal exterior differences in millimetres.

    Projection advances anteriorly, breadth widens the source section and
    height raises it. Root support uses source sellion, without claiming the
    missing clinical nasion construction. Tip support is a source-authored
    most-anterior witness. These fields supply a coarse connected exterior;
    source-relative differences are neither observed clinical measurements nor
    an inverse reconstruction of cartilage, airway or personal anatomy.
    """
    rootProjectionOffsetMillimetres: float
    dorsumProjectionOffsetMillimetres: float
    tipProjectionOffsetMillimetres: float
    tipBreadthOffsetMillimetres: float
    tipHeightOffsetMillimetres: float
    columellarProjectionOffsetMillimetres: float
    columellarBreadthOffsetMillimetres: float
    leftAlarBreadthOffsetMillimetres: float
    rightAlarBreadthOffsetMillimetres: float
    leftAlarHeightOffsetMillimetres: float
    rightAlarHeightOffsetMillimetres: float
