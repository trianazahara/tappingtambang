import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import QRCode from 'react-qr-code';

export default function PrintVisitorCard() {
    const { uid } = useParams();
    const [qrUrl, setQrUrl] = useState('');

    useEffect(() => {
        // Generate the URL that the QR code will point to
        const publicUrl = `${window.location.origin}/v/${uid}`;
        setQrUrl(publicUrl);

        // Automatically trigger print after rendering
        const timer = setTimeout(() => {
            window.print();
        }, 500);

        return () => clearTimeout(timer);
    }, [uid]);

    return (
        <div className="bg-gray-100 min-h-screen p-8 flex items-start justify-center print:bg-white print:p-0">
            {/* The printable card container */}
            {/* A4 size: 210mm x 297mm */}
            <div className="bg-white shadow-lg border border-gray-200 overflow-hidden print:shadow-none print:border-none" style={{ width: '210mm', height: '297mm' }}>
                {/* Header */}
                <div className="bg-red-600 text-white text-center py-6 print:!bg-red-600" style={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
                    <h1 className="font-bold text-5xl leading-tight uppercase tracking-[0.3em]">VISITOR</h1>
                </div>

                {/* Body */}
                <div className="flex flex-col items-center justify-center p-12" style={{ height: 'calc(297mm - 96px)' }}>
                    
                    {/* QR Code */}
                    <div className="bg-white p-6 border-4 border-gray-100 rounded-2xl shadow-sm mb-12">
                        {qrUrl && <QRCode value={qrUrl} size={300} level="M" />}
                    </div>

                    {/* UID Label */}
                    <p className="text-gray-500 text-xl uppercase font-bold tracking-[0.2em] mb-4">ID KARTU</p>
                    <h2 className="text-6xl font-extrabold text-gray-900 tracking-tight text-center leading-none">
                        {uid}
                    </h2>
                    
                    {/* Footer logo/text */}
                    <div className="mt-auto pt-8 border-t-2 border-gray-100 w-full text-center">
                        <p className="text-xl text-gray-400 font-bold uppercase tracking-widest">Sistem Permit Tambang</p>
                    </div>
                </div>
            </div>

            {/* Print Help Text (Hidden on actual print) */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl print:hidden flex flex-col items-center">
                <p className="font-medium">Halaman cetak fisik kartu.</p>
                <p className="text-xs text-gray-400">Tekan Ctrl+P jika dialog print tidak muncul.</p>
            </div>
        </div>
    );
}
