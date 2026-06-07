from fastapi import APIRouter, HTTPException, Query
import qrcode
import io
import base64

router = APIRouter()

@router.get("/generate")
def generate_qr(text: str = Query(..., description="Text or URL to convert to QR code")):
    try:
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(text)
        qr.make(fit=True)

        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to bytes
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format='PNG')
        img_byte_arr.seek(0)
        
        # Encode to base64
        encoded_img = base64.b64encode(img_byte_arr.read()).decode('utf-8')
        
        return {"image_base64": encoded_img}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
