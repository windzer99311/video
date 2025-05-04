import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';

interface DownloadProgressProps {
  videoId: string;
  formatId: number;
  onComplete: (downloadId: string) => void;
  onCancel: () => void;
}

export default function DownloadProgress({ videoId, formatId, onComplete, onCancel }: DownloadProgressProps) {
  const [progress, setProgress] = useState(0);
  const [downloadId, setDownloadId] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'downloading' | 'complete' | 'error'>('downloading');
  const [estimatedTime, setEstimatedTime] = useState<string>('calculating...');
  const [speed, setSpeed] = useState<string>('0 MB/s');
  const { toast } = useToast();

  useEffect(() => {
    // Start download when component mounts
    const startDownload = async () => {
      try {
        const response = await apiRequest('POST', '/api/video/download', {
          videoId,
          formatId
        });
        const data = await response.json();
        setDownloadId(data.downloadId);
      } catch (error) {
        console.error('Error starting download:', error);
        toast({
          variant: "destructive",
          title: "Download Failed",
          description: error instanceof Error ? error.message : 'Failed to start download',
        });
        setDownloadStatus('error');
        onCancel();
      }
    };

    // Only start the download if we don't have a downloadId yet
    if (!downloadId) {
      startDownload();
    }

    // Return early to prevent setting up the interval multiple times
    return () => {};
  }, [videoId, formatId, downloadId]);

  // Separate useEffect for polling to avoid dependency cycle
  useEffect(() => {
    if (!downloadId) return;

    // Poll for download progress
    const progressInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/download/status/${downloadId}`);
        if (!response.ok) throw new Error('Failed to fetch download status');
        
        const data = await response.json();
        setProgress(data.progress);
        setSpeed(data.speed);
        setEstimatedTime(data.estimatedTime);
        
        if (data.status === 'complete') {
          setDownloadStatus('complete');
          setProgress(100);
          clearInterval(progressInterval);
          onComplete(downloadId);
          toast({
            title: "Download Complete",
            description: "Your video has been downloaded successfully!",
          });
        } else if (data.status === 'error') {
          setDownloadStatus('error');
          clearInterval(progressInterval);
          toast({
            variant: "destructive",
            title: "Download Failed",
            description: data.error || 'An error occurred during download',
          });
          onCancel();
        }
      } catch (error) {
        console.error('Error checking download status:', error);
      }
    }, 1000);

    return () => clearInterval(progressInterval);
  }, [downloadId]);

  const handleCancelDownload = async () => {
    if (downloadId) {
      try {
        await apiRequest('DELETE', `/api/download/cancel/${downloadId}`);
        toast({
          title: "Download Cancelled",
          description: "The download has been cancelled",
        });
      } catch (error) {
        console.error('Error cancelling download:', error);
      }
    }
    onCancel();
  };

  const handleDownloadFile = async () => {
    if (downloadId && downloadStatus === 'complete') {
      try {
        // First check if the file exists on the server
        const response = await fetch(`/api/download/file/${downloadId}`, { method: 'HEAD' });
        if (response.ok) {
          // File exists, download it
          window.location.href = `/api/download/file/${downloadId}`;
        } else {
          // File doesn't exist, show error
          toast({
            variant: "destructive",
            title: "Download Error",
            description: "File not found on server. Please try downloading again.",
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Download Error",
          description: error instanceof Error ? error.message : 'Failed to save file',
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Download Not Ready",
        description: "Please wait for the download to complete",
      });
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg mb-8">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Download Progress</h3>
        <span className="text-accent font-medium">{progress}%</span>
      </div>
      
      <Progress 
        value={progress} 
        className="w-full bg-background h-4 rounded-full overflow-hidden mb-4"
      />
      
      <div className="flex flex-col sm:flex-row justify-between text-sm">
        <div className="flex items-center text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span>Estimated time: <span className="text-white">{estimatedTime}</span></span>
        </div>
        <div className="flex items-center text-muted-foreground mt-2 sm:mt-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" clipRule="evenodd" />
          </svg>
          <span>Download speed: <span className="text-white">{speed}</span></span>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button 
          className="flex-1 border border-muted text-white font-medium py-2 px-4 rounded-lg hover:bg-secondary transition-colors flex items-center justify-center"
          onClick={handleCancelDownload}
          variant="outline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          Cancel
        </Button>
        <Button 
          className={`flex-1 bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))/90] text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center ${downloadStatus !== 'complete' ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleDownloadFile}
          disabled={downloadStatus !== 'complete'}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          Save File
        </Button>
      </div>
    </div>
  );
}
