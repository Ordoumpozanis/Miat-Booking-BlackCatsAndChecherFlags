import QRCode from 'qrcode';
import { Booking } from '../types';

export const generateQRImage = async (booking: Booking, experienceName: string) => {
    // 1. High-Res Canvas Setup (Poster Style)
    const width = 800;
    const height = 1500; // Increased height again for spacing
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper: Load Image
    const loadImage = (url: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(null);
            img.src = url;
        });
    };

    // Helper: Load Font
    const loadFont = async () => {
        try {
            await document.fonts.load("bold 60px 'Maxwell'");
            await document.fonts.load("40px 'Oswald'");
        } catch (e) { console.warn("Font load warning", e); }
    };

    await loadFont();

    const [miatLogo, bcLogo] = await Promise.all([
        loadImage('/Logo MIAT_NEG.png'),
        loadImage('/logo-bc.png')
    ]);

    // --- DESIGN EXECUTION ---

    // 2. Background: Deep Metallic Gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a1a'); // Dark Grey Top
    gradient.addColorStop(1, '#000000'); // Pure Black Bottom
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 3. Decorative Elements (Racing Theme)
    // Side Accent Stripe
    ctx.fillStyle = '#DC2626'; // Racing Red
    ctx.fillRect(0, 100, 12, 300);
    ctx.fillStyle = '#FACC15'; // Modena Yellow
    ctx.fillRect(0, 420, 12, 100);

    // Corner Accents (Top Right / Bottom Left)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width - 40, 40);
    ctx.lineTo(width - 40, 100);
    ctx.moveTo(width - 40, 40);
    ctx.lineTo(width - 100, 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(40, height - 100);
    ctx.moveTo(40, height - 40);
    ctx.lineTo(100, height - 40);
    ctx.stroke();

    let cursorY = 80;

    // 4. Header Logo (MIAT)
    if (miatLogo) {
        const logoWidth = 220; 
        const aspect = miatLogo.width / miatLogo.height;
        const logoHeight = logoWidth / aspect;
        const x = (width - logoWidth) / 2;
        
        ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
        ctx.shadowBlur = 30;
        ctx.drawImage(miatLogo, x, cursorY, logoWidth, logoHeight);
        ctx.shadowBlur = 0; // Reset
        
        cursorY += logoHeight + 120; // 1. Increased spacing (was 80) to separate from Paddock Pass
    } else {
        cursorY += 150;
    }

    // 5. Title Section
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FACC15'; // Yellow
    ctx.font = 'bold 80px "Maxwell", sans-serif'; 
    ctx.fillText('PADDOCK PASS', width / 2, cursorY);
    cursorY += 50;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '24px "Inter", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText('OFFICIAL ACCESS DOCUMENT', width / 2, cursorY);
    cursorY += 60;

    // Separator Line
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(100, cursorY);
    ctx.lineTo(width - 100, cursorY);
    ctx.stroke();
    cursorY += 60;

    // 6. Experience Logo - Bigger
    if (bcLogo) {
        const logoWidth = 340; // 2. Increased from 280
        const aspect = bcLogo.width / bcLogo.height;
        const logoHeight = logoWidth / aspect;
        const x = (width - logoWidth) / 2;
        
        ctx.drawImage(bcLogo, x, cursorY, logoWidth, logoHeight);
        cursorY += logoHeight + 60;
    } else {
        cursorY += 100;
    }

    // 7. QR Code "Chip" Card
    const cardSize = 450; 
    const cardX = (width - cardSize) / 2;
    const cardY = cursorY;
    
    // Draw Card Body
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 10;
    
    const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
    };
    roundRect(ctx, cardX, cardY, cardSize, cardSize, 25);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // QR Code Generation
    try {
        const qrSize = 360; 
        const qrUrl = await QRCode.toDataURL(JSON.stringify({
            id: booking.id,
            ref: booking.referenceCode
        }), { 
            width: qrSize, 
            margin: 1, 
            color: { dark: '#111111', light: '#FFFFFF' }
        });
        
        const qrImg = new Image();
        qrImg.src = qrUrl;
        await new Promise(r => qrImg.onload = r);
        
        const qrX = cardX + (cardSize - qrSize) / 2;
        const qrY = cardY + (cardSize - qrSize) / 2;
        
        ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
    } catch (e) {
        console.error(e);
    }
    
    cursorY += cardSize + 50; // 3. Increased spacing (was 100) to push Access Code down

    // 8. Footer Telemetry Data
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Courier New", monospace';
    // Label
    ctx.fillStyle = '#666';
    ctx.fillText('ACCESS CODE', width / 2, cursorY);
    cursorY += 65;
    // Value
    ctx.fillStyle = '#FACC15'; // Yellow
    ctx.font = 'bold 72px "Courier New", monospace';
    ctx.fillText(booking.referenceCode, width / 2, cursorY);
    cursorY += 20;

    // Grid details
    const boxY = cursorY+10;
    // Ensure we don't draw outside canvas if calculation is off
    if (boxY < height) {
        ctx.fillStyle = '#111';
        ctx.fillRect(0, boxY, width, height - boxY); // Fill rest of bottom
        
        ctx.beginPath();
        ctx.moveTo(0, boxY);
        ctx.lineTo(width, boxY);
        ctx.strokeStyle = '#333';
        ctx.stroke();

        const detailY = boxY + 80;
        
        // Left: Date
        ctx.textAlign = 'center';
        ctx.fillStyle = '#888';
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.fillText('MISSION DATE', width * 0.25, detailY);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px "Inter", sans-serif';
        ctx.fillText(booking.date, width * 0.25, detailY + 35);

        // Right: Time
        ctx.fillStyle = '#888';
        ctx.font = 'bold 16px "Inter", sans-serif';
        ctx.fillText('LAUNCH TIME', width * 0.75, detailY);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 28px "Inter", sans-serif';
        ctx.fillText(`${booking.time} HRS`, width * 0.75, detailY + 35);

        // Center Vertical Line
        ctx.beginPath();
        ctx.moveTo(width / 2, detailY - 20);
        ctx.lineTo(width / 2, detailY + 60);
        ctx.strokeStyle = '#333';
        ctx.stroke();
    }

    // 9. Download
    const link = document.createElement('a');
    link.download = `Pass_${booking.referenceCode}_Souvenir.png`;
    link.href = canvas.toDataURL('image/png', 1.0); // Max quality
    link.click();
};
