import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest } from '@/lib/queryClient';

interface UrlInputProps {
  onVideoFetched: (videoData: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function UrlInput({ onVideoFetched, isLoading, setIsLoading }: UrlInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateYoutubeUrl = (url: string) => {
    const regex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return regex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous error
    setError(null);
    
    // Validate URL
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }
    
    if (!validateYoutubeUrl(url)) {
      setError('Invalid YouTube URL. Please enter a valid YouTube video link.');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/video/info', { url });
      const data = await response.json();
      onVideoFetched(data);
    } catch (error) {
      console.error('Error fetching video:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch video information');
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to fetch video information',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setError(null);
  };

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg mb-8">
      <form className="flex flex-col md:flex-row gap-4" onSubmit={handleSubmit}>
        <div className="flex-grow relative">
          <Input
            type="text"
            placeholder="Paste YouTube URL here..."
            className="w-full bg-secondary text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent h-12"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
          />
          {url && (
            <div 
              className="absolute right-3 top-3 text-muted-foreground cursor-pointer"
              onClick={handleClear}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>
        <Button 
          type="submit"
          className="bg-primary hover:bg-[hsl(var(--primary-hover))] text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center h-12"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <span className="mr-2">Get Video</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
            </>
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="mt-4 bg-[hsl(var(--error))] bg-opacity-20 text-[hsl(var(--error))] px-4 py-2 rounded-md">
          <div className="flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <AlertDescription>{error}</AlertDescription>
          </div>
        </Alert>
      )}
    </div>
  );
}
