/**
 * The video filter chain planDeliveryDecode plans for 10 fps with a
 * 0.2 s black minimum, a 0.3 s freeze minimum, pic_th 0.98, pix_th 0.1 and a
 * 0.001 freeze noise level; every recording in deliveryDecodeRecordings was made with it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the plan inputs that produce this chain and that the recordings used it.
 */
export const deliveryDecodeRecordingFilter =
  "showinfo=checksum=0,blackdetect=d=0:pic_th=0.98:pix_th=0.1,freezedetect=n=0.001:d=199998us,metadata=mode=print";
