#!/usr/bin/env python3
import argparse
import json
import os
import sys
from datetime import datetime
import re

try:
    from pytubefix import YouTube
    from pytubefix.exceptions import PytubeFixError
except ImportError:
    # Try to install pytubefix if not available
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pytubefix"])
    from pytubefix import YouTube
    from pytubefix.exceptions import PytubeFixError

def format_size(bytes_size):
    """Format bytes to human-readable size"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0 or unit == 'GB':
            break
        bytes_size /= 1024.0
    return f"{bytes_size:.1f} {unit}"

def format_bitrate(bitrate):
    """Format bitrate to human-readable form"""
    if bitrate > 1000000:
        return f"{bitrate/1000000:.1f} Mbps"
    elif bitrate > 1000:
        return f"{bitrate/1000:.0f} kbps"
    else:
        return f"{bitrate} bps"

def get_video_info(url):
    """Get video information"""
    try:
        yt = YouTube(url)
        
        # Get basic video information
        video_info = {
            "id": yt.video_id,
            "title": yt.title,
            "author": yt.author,
            "thumbnail": yt.thumbnail_url,
            "duration": str(datetime.utcfromtimestamp(yt.length).strftime('%H:%M:%S')),
            "views": format_number(yt.views),
            "publishDate": yt.publish_date.isoformat() if yt.publish_date else None,
            "rating": f"{yt.rating:.1f}" if yt.rating else "N/A",
            "description": yt.description,
            "formats": []
        }
        
        # Get available formats
        streams = yt.streams.filter(progressive=True).order_by('resolution').desc()
        audio_streams = yt.streams.filter(only_audio=True).order_by('abr').desc()
        
        # Add video formats
        for stream in streams:
            size = format_size(stream.filesize)
            format_info = {
                "itag": stream.itag,
                "quality": stream.resolution,
                "type": stream.subtype,
                "mimeType": stream.mime_type,
                "size": size,
                "bitrate": format_bitrate(stream.bitrate),
                "hasVideo": True,
                "hasAudio": True
            }
            video_info["formats"].append(format_info)
        
        # Add audio formats
        for stream in audio_streams:
            # Skip if already included in progressive streams
            if any(f["itag"] == stream.itag for f in video_info["formats"]):
                continue
                
            size = format_size(stream.filesize)
            format_info = {
                "itag": stream.itag,
                "quality": "Audio",
                "type": stream.subtype,
                "mimeType": stream.mime_type,
                "size": size,
                "bitrate": format_bitrate(stream.bitrate),
                "audioQuality": stream.abr,
                "hasVideo": False,
                "hasAudio": True
            }
            video_info["formats"].append(format_info)
        
        return video_info
        
    except PytubeFixError as e:
        raise Exception(f"PytubeFixError: {str(e)}")
    except Exception as e:
        raise Exception(f"Error: {str(e)}")

def format_number(num):
    """Format number with commas for thousands"""
    return "{:,}".format(num)

def download_video(url, itag, output_path):
    """Download video with progress reporting"""
    try:
        yt = YouTube(url)
        
        # Setup progress callback
        def progress_callback(stream, chunk, bytes_remaining):
            filesize = stream.filesize
            bytes_downloaded = filesize - bytes_remaining
            percentage = int((bytes_downloaded / filesize) * 100)
            print(f"progress: {percentage}", flush=True)
        
        yt.register_on_progress_callback(progress_callback)
        
        # Get the stream
        stream = yt.streams.get_by_itag(itag)
        if not stream:
            raise Exception(f"Stream with itag {itag} not found")
        
        # Get file info before download
        file_info = {
            "title": yt.title,
            "author": yt.author,
            "thumbnail": yt.thumbnail_url,
            "quality": stream.resolution if stream.resolution else "Audio",
            "format": stream.subtype,
            "size": format_size(stream.filesize)
        }
        
        # Download the video
        file_path = stream.download(output_path=os.path.dirname(output_path), 
                                    filename=os.path.basename(output_path))
        
        # Add file path to info
        file_info["filePath"] = file_path
        
        # Print file info for the Node.js process to capture
        print(f"file_info: {json.dumps(file_info)}", flush=True)
        
        return True
        
    except PytubeFixError as e:
        print(f"PytubeFixError: {str(e)}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="YouTube Video Downloader")
    parser.add_argument("--info", help="Get video information")
    parser.add_argument("--download", help="Download video")
    parser.add_argument("--itag", type=int, help="Stream itag to download")
    parser.add_argument("--output", help="Output file path")
    
    args = parser.parse_args()
    
    try:
        if args.info:
            video_info = get_video_info(args.info)
            print(json.dumps(video_info), flush=True)
        elif args.download and args.itag and args.output:
            success = download_video(args.download, args.itag, args.output)
            if not success:
                sys.exit(1)
        else:
            print("Error: Invalid arguments", file=sys.stderr)
            sys.exit(1)
    except Exception as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
