from dataclasses import dataclass


@dataclass(frozen=True)
class CervicalEnvelope:
    """Whole common-root cervical exterior differences in millimetres.

    Front and back fullness act independently across the shared head/body
    source. Joint span uses the licensed whole-source neck-height endpoint,
    carrying the head and its attachment references together.
    Cervicomental projection advances the underside transition. Neither skin
    girth nor an observed clinical angle is inferred from these dimensions.
    """
    anteriorFullnessOffsetMillimetres: float
    posteriorFullnessOffsetMillimetres: float
    cervicomentalProjectionOffsetMillimetres: float
    cervicalJointSpanOffsetMillimetres: float
