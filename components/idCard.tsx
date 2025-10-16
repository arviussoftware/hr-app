"use client";
import { useEffect, useRef, useState } from "react";
import * as domtoimage from "dom-to-image";
import jsPDF from "jspdf";
import { Card } from "./ui/card";
import ArviusLogo from "../public/ArviusLogo.ico";
import { motion } from "framer-motion";
import { Phone, Mail, Droplet } from "lucide-react";

interface IDCardData {
  empId: string;
  fullName: string;
  photoUrl: string;
  bloodGroup: string;
  phone: string;
  email: string;
}

export function IDCard({ id }: { id: number }) {
  const [data, setData] = useState<IDCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  useEffect(() => {
    if (!id) return;
    const fetchIDCard = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}api/hr/userPreview/${id}`);
        if (!res.ok) throw new Error("Failed to fetch ID card data");
        const resultFromAPI = await res.json();
        const mappedData: IDCardData = {
          empId: resultFromAPI.employeeId,
          fullName: `${resultFromAPI.firstName} ${resultFromAPI.lastName}`,
          photoUrl: resultFromAPI.profilePhoto
            ? `data:image/jpeg;base64,${resultFromAPI.profilePhoto}`
            : "",
          bloodGroup: resultFromAPI.bloodGroup,
          phone: resultFromAPI.contactNumber?.toString() || "",
          email: resultFromAPI.email,
        };
        setData(mappedData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchIDCard();
  }, [id, apiBaseUrl]);

  // Download as High-Resolution PNG (only ID card content)
  const downloadPNG = async () => {
    if (!cardRef.current || !data) return;
    try {
      const dataUrl = await domtoimage.toPng(cardRef.current, {
        quality: 1,
        width: cardRef.current.clientWidth * 4, // 4x width
        height: cardRef.current.clientHeight * 4, // 4x height
        style: {
          transform: "scale(4)",
          transformOrigin: "top left",
          width: `${cardRef.current.clientWidth}px`,
          height: `${cardRef.current.clientHeight}px`,
        },
      });
      const link = document.createElement("a");
      link.download = `IDCard_${data.empId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error generating PNG:", error);
      alert("Failed to generate PNG. Check console for details.");
    }
  };

  // Download as High-Resolution PDF (ID card centered on A4)
  const downloadPDF = async () => {
    if (!cardRef.current || !data) return;
    try {
      const scale = 4; // high resolution
      const dataUrl = await domtoimage.toPng(cardRef.current, {
        quality: 1,
        width: cardRef.current.clientWidth * scale,
        height: cardRef.current.clientHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${cardRef.current.clientWidth}px`,
          height: `${cardRef.current.clientHeight}px`,
        },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const cardWidth = 53.98; // mm
      const cardHeight = 85.6; // mm

      const x = (pdf.internal.pageSize.getWidth() - cardWidth) / 2;
      const y = (pdf.internal.pageSize.getHeight() - cardHeight) / 2;

      pdf.addImage(dataUrl, "PNG", x, y, cardWidth, cardHeight);
      pdf.save(`IDCard_${data.empId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Check console for details.");
    }
  };

  // Print directly (ID card centered on A4)
  const printCard = async () => {
    if (!cardRef.current) return;
    try {
      const scale = 4;
      const dataUrl = await domtoimage.toPng(cardRef.current, {
        quality: 1,
        width: cardRef.current.clientWidth * scale,
        height: cardRef.current.clientHeight * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: `${cardRef.current.clientWidth}px`,
          height: `${cardRef.current.clientHeight}px`,
        },
      });

      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
        <html>
          <head>
            <title>Print ID Card</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                background: #fff;
              }
              @media print {
                @page { size: A4; margin: 0; }
                img { width: 53.98mm; height: 85.6mm; margin: auto; }
              }
              img { width: 53.98mm; height: 85.6mm; }
            </style>
          </head>
          <body>
            <img src="${dataUrl}" />
            <script>
              window.onload = function() { window.focus(); window.print(); }
            </script>
          </body>
        </html>
      `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error("Error printing:", error);
      alert("Failed to print. Check console for details.");
    }
  };

  if (loading) return <p>Loading ID card...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col items-center bg-gray-50 pt-8 pb-4 px-4">
        {/* ID Card Container (display size) */}
        <div
          ref={cardRef}
          className="bg-white rounded-lg shadow-lg"
          style={{
            width: "185px",
            height: "300px",
            boxSizing: "border-box",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background Accents */}
          <div className="absolute top-0 left-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-400 -rotate-45 origin-top-left" />
          <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-bl from-blue-100 to-blue-400 rotate-45 origin-bottom-right" />

          {/* Card Content */}
          <div className="w-full h-full p-2 flex flex-col items-center box-border relative">
            {/* Header */}
            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center gap-1">
                <img
                  src={ArviusLogo.src}
                  alt="Arvius Logo"
                  className="w-8 h-8 object-contain"
                />
                <h2 className="text-lg font-bold text-blue-900 tracking-wide">
                  ARVIUS
                </h2>
              </div>
              <p className="text-[12px] text-gray-700 font-medium mt-1">
                ID : <span className="font-bold">{data.empId}</span>
              </p>
            </div>

            {/* Profile Image */}
            <div className="mt-2 w-16 h-16 rounded-full border-2 border-blue-500 overflow-hidden shadow-md">
              <img
                src={data.photoUrl}
                alt={data.fullName}
                className="w-full h-full object-cover"
              />
            </div>

            {/* User Name */}
            <h3 className="mt-3 text-lg-3/4 font-extrabold text-center text-gray-900 font-serif">
              {data.fullName}
            </h3>

            {/* Contact Info */}
            <div className="ml-10 mt-2 w-full max-w-[200px] space-y-1">
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] font-medium text-gray-700">
                  +91 {data.phone}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-blue-600" />
                <span className="text-[10px] break-all text-gray-700">{data.email}</span>
              </div>
              <div className="flex items-center gap-1">
                <Droplet className="w-3 h-3 text-red-600" />
                <span className="text-[10px] font-medium text-gray-700">
                  {data.bloodGroup}
                </span>
              </div>
            </div>

            {/* Footer */}
            <p className="mt-auto mb-2 text-[9px] text-gray-600 text-center">
              www.arviussoft.com
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-4">
          <button
            onClick={downloadPNG}
            className="px-2 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Download PNG
          </button>
          <button
            onClick={downloadPDF}
            className="px-2 py-1 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            Download PDF
          </button>
          <button
            onClick={printCard}
            className="px-2 py-1 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-800 transition"
          >
            Print
          </button>
        </div>
      </div>
    </motion.div>
  );
}
