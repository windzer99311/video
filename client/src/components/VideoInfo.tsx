import { formatDistanceToNow } from 'date-fns';

interface VideoInfoProps {
  video: {
    id: string;
    title: string;
    author: string;
    thumbnail: string;
    duration: string;
    views: string;
    publishDate: string;
    rating: string;
    description: string;
  } | null;
  isLoading: boolean;
}

export default function VideoInfo({ video, isLoading }: VideoInfoProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-lg p-6 shadow-lg mb-8 animate-pulse">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-2/5">
            <div className="relative aspect-video rounded-lg bg-secondary"></div>
          </div>
          <div className="w-full md:w-3/5 flex flex-col">
            <div className="h-6 bg-secondary rounded mb-2 w-3/4"></div>
            <div className="h-4 bg-secondary rounded mb-4 w-1/4"></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {Array(4).fill(null).map((_, i) => (
                <div key={i}>
                  <div className="h-3 bg-secondary rounded mb-2 w-1/3"></div>
                  <div className="h-4 bg-secondary rounded w-2/3"></div>
                </div>
              ))}
            </div>
            <div className="h-4 bg-secondary rounded mb-2 w-full"></div>
            <div className="h-4 bg-secondary rounded mb-2 w-5/6"></div>
            <div className="h-4 bg-secondary rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) return null;

  // Format publish date to relative time
  const formattedDate = video.publishDate ? formatDistanceToNow(new Date(video.publishDate), { addSuffix: true }) : 'Unknown date';

  return (
    <div className="bg-card rounded-lg p-6 shadow-lg mb-8">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-2/5">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-secondary">
            <img 
              src={video.thumbnail} 
              alt={`${video.title} thumbnail`} 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-white opacity-80" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        <div className="w-full md:w-3/5 flex flex-col">
          <h2 className="text-xl font-semibold mb-2">{video.title}</h2>
          <p className="text-muted-foreground mb-4">{video.author}</p>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <span className="block text-muted-foreground">Duration</span>
              <span className="font-medium">{video.duration}</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Views</span>
              <span className="font-medium">{video.views}</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Published</span>
              <span className="font-medium">{formattedDate}</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Rating</span>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium">{video.rating}</span>
              </div>
            </div>
          </div>
          <p className="text-gray-300 text-sm line-clamp-3 mb-4">{video.description}</p>
        </div>
      </div>
    </div>
  );
}
