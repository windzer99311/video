import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';

interface Format {
  itag: number;
  quality: string;
  type: string;
  mimeType: string;
  size: string;
  bitrate: string;
  audioQuality?: string;
  hasVideo: boolean;
  hasAudio: boolean;
}

interface FormatSelectorProps {
  videoId: string;
  formats: Format[];
  onDownloadStart: (formatId: number) => void;
}

export default function FormatSelector({ videoId, formats, onDownloadStart }: FormatSelectorProps) {
  const [selectedFormat, setSelectedFormat] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  if (!formats || formats.length === 0) {
    return null;
  }

  const handleFormatSelect = (formatId: number) => {
    setSelectedFormat(formatId);
  };

  const handleDownload = async () => {
    if (!selectedFormat) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a format to download",
      });
      return;
    }

    try {
      setIsDownloading(true);
      onDownloadStart(selectedFormat);
    } catch (error) {
      console.error('Error starting download:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to start download',
      });
      setIsDownloading(false);
    }
  };

  // Filter and organize formats
  const videoFormats = formats.filter(f => f.hasVideo);
  const audioFormats = formats.filter(f => !f.hasVideo && f.hasAudio);

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg mb-8">
      <h3 className="text-lg font-semibold mb-4">Select Download Format</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {videoFormats.map(format => (
          <div 
            key={format.itag}
            className={`format-card bg-secondary rounded-lg p-4 cursor-pointer hover:bg-secondary/80 border-2 ${selectedFormat === format.itag ? 'selected' : 'border-transparent'}`}
            onClick={() => handleFormatSelect(format.itag)}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{format.quality}</span>
              <span className="text-sm py-1 px-2 rounded bg-background text-gray-300">{format.type}</span>
            </div>
            <div className="flex flex-col text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium text-white">{format.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Bitrate:</span>
                <span className="font-medium text-white">{format.bitrate}</span>
              </div>
              {format.audioQuality && (
                <div className="flex justify-between">
                  <span>Audio:</span>
                  <span className="font-medium text-white">{format.audioQuality}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {audioFormats.map(format => (
          <div 
            key={format.itag}
            className={`format-card bg-secondary rounded-lg p-4 cursor-pointer hover:bg-secondary/80 border-2 ${selectedFormat === format.itag ? 'selected' : 'border-transparent'}`}
            onClick={() => handleFormatSelect(format.itag)}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Audio Only</span>
              <span className="text-sm py-1 px-2 rounded bg-background text-gray-300">{format.type}</span>
            </div>
            <div className="flex flex-col text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium text-white">{format.size}</span>
              </div>
              <div className="flex justify-between">
                <span>Bitrate:</span>
                <span className="font-medium text-white">{format.bitrate}</span>
              </div>
              {format.audioQuality && (
                <div className="flex justify-between">
                  <span>Quality:</span>
                  <span className="font-medium text-white">{format.audioQuality}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <Button 
        className="w-full bg-accent hover:bg-[hsl(var(--accent-hover))] text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center"
        onClick={handleDownload}
        disabled={!selectedFormat || isDownloading}
      >
        {isDownloading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Preparing Download...
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Download Now
          </>
        )}
      </Button>
    </div>
  );
}
