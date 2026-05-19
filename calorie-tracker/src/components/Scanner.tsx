import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface ScannerProps {
 onScan: (decodedText: string) => void
 onError?: (error: string) => void
}

export default function Scanner({ onScan, onError }: ScannerProps) {
 const scannerRef = useRef<Html5QrcodeScanner | null>(null)

 useEffect(() => {
 // Make sure we only initialize once
 if (!scannerRef.current) {
 scannerRef.current = new Html5QrcodeScanner(
"reader",
 { fps: 10, qrbox: { width: 250, height: 250 } },
 /* verbose= */ false
 )

 scannerRef.current.render(
 (decodedText) => {
 onScan(decodedText)
 },
 (errorMessage) => {
 if (onError) onError(errorMessage)
 }
 )
 }

 return () => {
 if (scannerRef.current) {
 scannerRef.current.clear().catch(console.error)
 scannerRef.current = null
 }
 }
 }, [onScan, onError])

 return (
 <div className="w-full bg-surface rounded-xl shadow-sm border border-border p-2">
 <div id="reader"className="w-full"></div>
 </div>
 )
}
