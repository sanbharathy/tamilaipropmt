import { NextResponse } from 'next/server';

type YouTubeChannelResponse = {
  id: string;
  title: string;
  description: string;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  uploadsPlaylistId?: string;
  recentVideos: {
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
  }[];
};

const youtubeApiBase = 'https://www.googleapis.com/youtube/v3';

function parseChannelInput(rawInput: string) {
  const input = rawInput.trim();

  if (!input) {
    return null;
  }

  if (input.startsWith('@')) {
    return { type: 'forHandle', value: input };
  }

  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(input)) {
    return { type: 'id', value: input };
  }

  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    const parts = url.pathname.split('/').filter(Boolean);
    const first = parts[0] ?? '';

    if (first.startsWith('@')) {
      return { type: 'forHandle', value: first };
    }

    if (first === 'channel' && parts[1]) {
      return { type: 'id', value: parts[1] };
    }

    if (first === 'user' && parts[1]) {
      return { type: 'forUsername', value: parts[1] };
    }

    if (first && !['watch', 'shorts', 'playlist', 'embed'].includes(first)) {
      return { type: 'forHandle', value: first.startsWith('@') ? first : `@${first}` };
    }
  } catch {
    return { type: 'forHandle', value: input.startsWith('@') ? input : `@${input}` };
  }

  return null;
}

async function youtubeFetch(path: string, params: Record<string, string>) {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      status: 500,
      body: { error: { message: 'YouTube API key is not configured yet.' } },
    };
  }

  const url = new URL(`${youtubeApiBase}${path}`);
  Object.entries({ ...params, key: apiKey }).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, { next: { revalidate: 3600 } });
  const body = await response.json();

  return { ok: response.ok, status: response.status, body };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const input = searchParams.get('url') ?? '';
  const parsed = parseChannelInput(input);

  if (!parsed) {
    return NextResponse.json({ error: 'Paste a YouTube channel URL, handle, or channel ID.' }, { status: 400 });
  }

  const channelParams: Record<string, string> = {
    part: 'snippet,statistics,contentDetails',
    maxResults: '1',
    [parsed.type]: parsed.value,
  };

  const channelResult = await youtubeFetch('/channels', channelParams);

  if (!channelResult.ok) {
    return NextResponse.json(
      {
        error:
          channelResult.body?.error?.message ??
          'Could not fetch YouTube channel data. Please check the channel link or API key.',
      },
      { status: channelResult.status },
    );
  }

  const channel = channelResult.body?.items?.[0];

  if (!channel) {
    return NextResponse.json({ error: 'No public YouTube channel found for this link or handle.' }, { status: 404 });
  }

  const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
  let recentVideos: YouTubeChannelResponse['recentVideos'] = [];

  if (uploadsPlaylistId) {
    const playlistResult = await youtubeFetch('/playlistItems', {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: '8',
    });

    if (playlistResult.ok) {
      const videoIds = (playlistResult.body?.items ?? [])
        .map((item: { contentDetails?: { videoId?: string } }) => item.contentDetails?.videoId)
        .filter(Boolean)
        .join(',');

      if (videoIds) {
        const videosResult = await youtubeFetch('/videos', {
          part: 'snippet,statistics',
          id: videoIds,
          maxResults: '8',
        });

        if (videosResult.ok) {
          recentVideos = (videosResult.body?.items ?? []).map((video: {
            id: string;
            snippet?: { title?: string; description?: string; publishedAt?: string };
            statistics?: { viewCount?: string; likeCount?: string; commentCount?: string };
          }) => ({
            id: video.id,
            title: video.snippet?.title ?? '',
            description: video.snippet?.description ?? '',
            publishedAt: video.snippet?.publishedAt ?? '',
            viewCount: Number(video.statistics?.viewCount ?? 0),
            likeCount: Number(video.statistics?.likeCount ?? 0),
            commentCount: Number(video.statistics?.commentCount ?? 0),
          }));
        }
      }
    }
  }

  const data: YouTubeChannelResponse = {
    id: channel.id,
    title: channel.snippet?.title ?? '',
    description: channel.snippet?.description ?? '',
    subscriberCount: Number(channel.statistics?.subscriberCount ?? 0),
    viewCount: Number(channel.statistics?.viewCount ?? 0),
    videoCount: Number(channel.statistics?.videoCount ?? 0),
    uploadsPlaylistId,
    recentVideos,
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
