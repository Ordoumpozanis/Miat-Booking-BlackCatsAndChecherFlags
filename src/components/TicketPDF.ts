'use client';

import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { Booking } from '../types';

export const generateBookingPDF = async (booking: Booking, experienceName: string) => {
  const doc = new jsPDF();
  
  // Vintage Paper Background
  doc.setFillColor(253, 251, 247); 
  doc.rect(0, 0, 210, 297, 'F');

  // Border Frame
  doc.setLineWidth(1.5);
  doc.setDrawColor(20, 20, 20);
  doc.rect(10, 10, 190, 277);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, 186, 273);

  // Header - "PADDOCK PASS"
  doc.setFillColor(20, 20, 20); 
  doc.rect(12, 12, 186, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont("helvetica", "bold");
  doc.text("PADDOCK PASS", 105, 35, { align: "center", charSpace: 3 });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("OFFICIAL ACCESS DOCUMENT", 105, 45, { align: "center", charSpace: 2 });

  // Event Details
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("THE LEGEND OF ASCARI", 105, 75, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "italic");
  doc.text(experienceName, 105, 85, { align: "center" });

  // Tech Specs Box
  doc.setDrawColor(200, 200, 200);
  doc.rect(30, 95, 150, 50);
  
  doc.setFontSize(10);
  doc.setFont("courier", "bold");
  doc.text("DATE", 40, 105);
  doc.text("LAUNCH TIME", 40, 115);
  doc.text("TEAM PRINCIPLE", 40, 125);
  doc.text("CREW SIZE", 40, 135);

  doc.setFont("helvetica", "bold");
  doc.text(booking.date, 100, 105);
  doc.text(booking.time, 100, 115);
  doc.text(booking.visitorName.toUpperCase(), 100, 125);
  doc.text(`${booking.pax} MECHANICS`, 100, 135);

  // QR Code Area
  try {
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({
        id: booking.id,
        ref: booking.referenceCode
    }));
    doc.addImage(qrDataUrl, 'PNG', 75, 160, 60, 60);
    
    // Reference Code
    doc.setFontSize(18);
    doc.setFont("courier", "bold");
    doc.text(booking.referenceCode, 105, 230, { align: "center" });
    
  } catch (err) {
    console.error("QR Error", err);
  }

  // Footer Disclaimer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  const disclaimer = "NOTICE: Motor racing is dangerous. By entering this experience, you accept all risks associated with time travel and mixed reality. Please present this pass at the gate.";
  doc.text(disclaimer, 105, 260, { align: "center", maxWidth: 140 });

  // Easter Egg
  doc.setFontSize(6);
  doc.text("NO BLACK CATS ALLOWED.", 105, 280, { align: "center" });

  doc.save(`PaddockPass_${booking.referenceCode}.pdf`);
};

export const generateQRImage = async (booking: Booking, experienceName: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
  
    const width = 600;
    const height = 800;
    canvas.width = width;
    canvas.height = height;
  
    // Background
    ctx.fillStyle = '#171717'; // Neutral 900
    ctx.fillRect(0, 0, width, height);
    
    // Border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, width - 40, height - 40);
  
    // Title
    ctx.fillStyle = '#FACC15'; // Yellow 400
    ctx.font = 'bold 40px Oswald';
    ctx.textAlign = 'center';
    ctx.fillText('BLACK CATS', width / 2, 100);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '30px Oswald';
    ctx.fillText('& CHEQUERED FLAGS', width / 2, 150);
  
    // Experience Name
    ctx.fillStyle = '#A3A3A3'; // Neutral 400
    ctx.font = 'italic 24px Inter';
    ctx.fillText(experienceName, width / 2, 220);
  
    // QR Code
    try {
        const qrUrl = await QRCode.toDataURL(JSON.stringify({
            id: booking.id,
            ref: booking.referenceCode
        }), { width: 400, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } });
        
        const qrImg = new Image();
        qrImg.src = qrUrl;
        await new Promise(r => qrImg.onload = r);
        
        // Draw white background for QR
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect((width - 320) / 2, 300, 320, 320);
        ctx.drawImage(qrImg, (width - 300) / 2, 310, 300, 300);
  
    } catch (e) {
        console.error(e);
    }
  
    // Ref Code
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 60px Courier New';
    ctx.fillText(booking.referenceCode, width / 2, 700);
    
    ctx.fillStyle = '#FACC15';
    ctx.font = 'bold 20px Oswald';
    ctx.fillText('PADDOCK PASS', width / 2, 740);
  
    // Download
    const link = document.createElement('a');
    link.download = `QR_${booking.referenceCode}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
