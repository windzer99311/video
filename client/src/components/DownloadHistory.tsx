import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { formatDistanceToNow } from 'date-fns';

interface DownloadItem {
  id: string;
  videoId: string;
  title: string;
  thumbnail: string;
  quality: string;
  format: string;
  size: string;
  createdAt: string;
}

export default function DownloadHistory() {
  const { toast } = useToast();

  const { data: downloads, isLoading, error, refetch } = useQuery<DownloadItem[]>({
    queryKey: ['/api/downloads'],
  });

  const handleDownload = async (downloadId: string) => {
    window.location.href = `/api/download/file/${downloadId}`;
  };

  const handleClearHistory = async () => {
    try {
      await apiRequest('DELETE', '/api/downloads');
      toast({
        title: "History Cleared",
        description: "Your download history has been cleared",
      });
      refetch();
    } catch (error) {
      console.error('Error clearing history:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to clear download history",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-lg animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-secondary rounded w-1/4"></div>
          <div className="h-4 bg-secondary rounded w-1/6"></div>
        </div>
        {Array(3).fill(null).map((_, i) => (
          <div key={i} className="overflow-hidden bg-background rounded-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b border-secondary last:border-b-0">
              <div className="w-full sm:w-2/3 flex items-center">
                <div className="h-12 w-12 bg-secondary rounded mr-3"></div>
                <div className="overflow-hidden w-full">
                  <div className="h-4 bg-secondary rounded mb-2 w-3/4"></div>
                  <div className="h-3 bg-secondary rounded w-1/2"></div>
                </div>
              </div>
              <div className="flex items-center justify-between w-full sm:w-1/3">
                <div className="h-3 bg-secondary rounded w-1/4"></div>
                <div className="h-5 w-5 bg-secondary rounded-full"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-lg">
        <div className="text-center text-muted-foreground">
          <p>Failed to load download history</p>
          <Button 
            onClick={() => refetch()}
            variant="outline"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!downloads || downloads.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Recent Downloads</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>No download history yet</p>
          <p className="text-sm mt-2">Your recent downloads will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Recent Downloads</h3>
        <Button 
          onClick={handleClearHistory}
          variant="ghost" 
          className="text-accent hover:text-accent-hover text-sm flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Clear History
        </Button>
      </div>
      
      <div className="overflow-hidden bg-background rounded-lg">
        {downloads.map((download) => (
          <div key={download.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b border-secondary last:border-b-0">
            <div className="w-full sm:w-2/3 flex items-center">
              <div className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 bg-secondary rounded overflow-hidden mr-3">
                {download.thumbnail && (
                  <img 
                    src={download.thumbnail} 
                    alt={`${download.title} thumbnail`} 
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="overflow-hidden">
                <h4 className="font-medium text-sm truncate">{download.title}</h4>
                <div className="flex text-xs text-muted-foreground mt-1">
                  <span className="mr-3">{download.quality}</span>
                  <span className="mr-3">{download.format}</span>
                  <span>{download.size}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between w-full sm:w-1/3">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(download.createdAt), { addSuffix: true })}
              </span>
              <Button 
                onClick={() => handleDownload(download.id)}
                variant="ghost"
                size="icon"
                className="text-accent hover:text-accent-hover"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
