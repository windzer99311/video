import { useState } from 'react';
import UrlInput from '@/components/UrlInput';
import VideoInfo from '@/components/VideoInfo';
import FormatSelector from '@/components/FormatSelector';
import DownloadProgress from '@/components/DownloadProgress';
import DownloadHistory from '@/components/DownloadHistory';
import { queryClient } from '@/lib/queryClient';

interface VideoData {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  views: string;
  publishDate: string;
  rating: string;
  description: string;
  formats: {
    itag: number;
    quality: string;
    type: string;
    mimeType: string;
    size: string;
    bitrate: string;
    audioQuality?: string;
    hasVideo: boolean;
    hasAudio: boolean;
  }[];
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [downloadingFormat, setDownloadingFormat] = useState<number | null>(null);
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);

  const handleVideoFetched = (data: VideoData) => {
    setVideoData(data);
    setIsDownloadComplete(false);
    setDownloadingFormat(null);
  };

  const handleDownloadStart = (formatId: number) => {
    setDownloadingFormat(formatId);
  };

  const handleDownloadComplete = (downloadId: string) => {
    setIsDownloadComplete(true);
    // Invalidate downloads query to refresh history
    queryClient.invalidateQueries({ queryKey: ['/api/downloads'] });
  };

  const handleCancelDownload = () => {
    setDownloadingFormat(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-[hsl(var(--primary))]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
          </svg>
          YouTube Downloader
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">Download YouTube videos in your preferred quality. Just paste the URL and select your format.</p>
      </header>

      <UrlInput 
        onVideoFetched={handleVideoFetched} 
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />

      {videoData && (
        <VideoInfo
          video={videoData}
          isLoading={isLoading}
        />
      )}

      {videoData && !downloadingFormat && (
        <FormatSelector
          videoId={videoData.id}
          formats={videoData.formats}
          onDownloadStart={handleDownloadStart}
        />
      )}

      {videoData && downloadingFormat && (
        <DownloadProgress
          videoId={videoData.id}
          formatId={downloadingFormat}
          onComplete={handleDownloadComplete}
          onCancel={handleCancelDownload}
        />
      )}

      <DownloadHistory />

      <footer className="mt-10 text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} YouTube Downloader. Built with React & Node.js</p>
        <p className="mt-1">This tool is for educational purposes only. Please respect YouTube's terms of service.</p>
      </footer>
    </div>
  );
}
