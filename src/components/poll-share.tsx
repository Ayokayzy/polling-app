"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { QrCode, Copy, Share2, Check } from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";

interface PollShareProps {
  pollId: string;
  pollQuestion: string;
}

/**
 * Renders a share UI for a poll including QR code generation, copy-to-clipboard, and Web Share integration.
 *
 * Displays the poll URL (selectable and copyable), generates and shows a QR code for the poll URL
 * (with a loading state while generating), and provides actions to share via the Web Share API or
 * fall back to copying the URL. The component constructs the poll URL from `window.location.origin`
 * and regenerates the QR code whenever `pollId` changes.
 *
 * @param pollId - Poll identifier used to build the shareable URL (e.g., appended to `/polls/`)
 * @param pollQuestion - Poll question text included in the Web Share message
 */
export function PollShare({ pollId, pollQuestion }: PollShareProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const pollUrl = `${window.location.origin}/polls/${pollId}`;

  useEffect(() => {
    generateQRCode();
  }, [pollId]);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(pollUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
      setQrCodeUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
      toast.error("Failed to generate QR code");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopied(true);
      toast.success("Poll URL copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Vote on this poll",
          text: `Check out this poll: "${pollQuestion}"`,
          url: pollUrl,
        });
      } catch (error) {
        // User cancelled sharing or error occurred
        console.log("Web share cancelled or failed");
      }
    } else {
      // Fallback to copy
      copyToClipboard();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Share This Poll
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Poll URL */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Poll URL:</label>
          <div className="flex gap-2">
            <Input
              value={pollUrl}
              readOnly
              className="flex-1"
              onClick={(e) => e.currentTarget.select()}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* QR Code */}
        <div className="space-y-2">
          <label className="text-sm font-medium">QR Code:</label>
          <div className="flex flex-col items-center space-y-3">
            <div className="bg-white p-4 rounded-lg border">
              {isGenerating ? (
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt="QR Code for poll"
                  className="w-[200px] h-[200px]"
                />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center bg-muted rounded">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Scan this QR code with your phone camera to open the poll
            </p>
          </div>
        </div>

        {/* Share Actions */}
        <div className="flex gap-2">
          <Button onClick={shareViaWebShare} className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" onClick={copyToClipboard} className="flex-1">
            <Copy className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p><strong>Share options:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Copy the URL and share it directly</li>
            <li>Use the QR code for easy mobile access</li>
            <li>Use the Share button to share via your device's share menu</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
