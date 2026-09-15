'use client';

import { useEffect, useMemo, useState } from 'react';
import NextImage from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Check,
  Clapperboard,
  Code2,
  Copy,
  ExternalLink,
  Flame,
  GraduationCap,
  Hash,
  Image as ImageIcon,
  Languages,
  Lightbulb,
  Megaphone,
  Menu,
  Search,
  Sparkles,
  TrendingUp,
  Video,
  X,
} from 'lucide-react';

import { AdsenseSlot } from '@/components/adsense-slot';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { promptLandingPages } from '@/lib/prompt-pages';

type Language = 'ta' | 'en';
type Category = 'all' | 'image' | 'video' | 'business';

type TrendPrompt = {
  id: number;
  category: Exclude<Category, 'all'>;
  image: string;
  imageAlt: string;
  titleTa: string;
  titleEn: string;
  descriptionTa: string;
  descriptionEn: string;
  prompt: string;
  models: string[];
  updatedTa: string;
  updatedEn: string;
  featured?: boolean;
  needsPhoto?: boolean;
};

const filters: { id: Category; ta: string; en: string; icon: typeof Flame }[] = [
  { id: 'all', ta: 'ட்ரெண்டிங்', en: 'Trending', icon: Flame },
  { id: 'image', ta: 'படங்கள்', en: 'Pictures', icon: ImageIcon },
  { id: 'video', ta: 'வீடியோக்கள்', en: 'Videos', icon: Video },
  { id: 'business', ta: 'வணிகம்', en: 'Business', icon: BriefcaseBusiness },
];

const popularSearches = [
  'Tamil AI prompts',
  '80s Tamil photo prompt',
  'Tamil image prompts',
  'Tamil video prompts',
  'Gemini prompts Tamil',
  'ChatGPT image prompts Tamil',
  'favorite actor AI poster',
  'Veo prompts Tamil',
  'Tamil business captions',
];

const watermarkEn =
  'Add the exact text “tamilaiprompt.com” as a small, clean, readable watermark in the bottom-right corner with safe padding, white at 70% opacity. Do not add any other text, logo, or watermark.';

const trendHeatById: Record<number, string> = {
  1: '1.1M',
  2: '846K',
  3: '712K',
  4: '94K',
  9: '389K',
  10: '277K',
  11: '1.4M',
  61: '1.2M',
  12: '81K',
  13: '456K',
  14: '63K',
  15: '519K',
  16: '72K',
  17: '933K',
  18: '148K',
  19: '604K',
  20: '49K',
  21: '488K',
  22: '119K',
  23: '331K',
  24: '694K',
  25: '208K',
  26: '879K',
  27: '41K',
  28: '564K',
  29: '58K',
  30: '29K',
  31: '97K',
  32: '174K',
};

const trendVisualThemes: Record<number, { bg: string; accent: string; sceneTa: string; sceneEn: string }> = {
  1: { bg: '#7c2d12', accent: '#fbbf24', sceneTa: '80s Studio', sceneEn: '80s Studio' },
  2: { bg: '#312e81', accent: '#93c5fd', sceneTa: 'Memory', sceneEn: 'Memory' },
  3: { bg: '#020617', accent: '#22d3ee', sceneTa: 'Night Ride', sceneEn: 'Night Ride' },
  4: { bg: '#78350f', accent: '#fde68a', sceneTa: 'Coffee Ad', sceneEn: 'Coffee Ad' },
  9: { bg: '#7f1d1d', accent: '#facc15', sceneTa: 'Wedding', sceneEn: 'Wedding' },
  10: { bg: '#475569', accent: '#f5f5f4', sceneTa: 'Polaroid', sceneEn: 'Polaroid' },
  11: { bg: '#991b1b', accent: '#fb7185', sceneTa: 'Hero Poster', sceneEn: 'Hero Poster' },
  61: { bg: '#991b1b', accent: '#facc15', sceneTa: 'Fan Poster', sceneEn: 'Fan Poster' },
  12: { bg: '#134e4a', accent: '#5eead4', sceneTa: 'Product', sceneEn: 'Product' },
  13: { bg: '#164e63', accent: '#67e8f9', sceneTa: 'Rainy', sceneEn: 'Rainy' },
  14: { bg: '#1e3a8a', accent: '#bfdbfe', sceneTa: 'Profile', sceneEn: 'Profile' },
  15: { bg: '#581c87', accent: '#d8b4fe', sceneTa: 'Fantasy', sceneEn: 'Fantasy' },
  16: { bg: '#166534', accent: '#bef264', sceneTa: 'Food', sceneEn: 'Food' },
  17: { bg: '#9d174d', accent: '#f9a8d4', sceneTa: 'Saree', sceneEn: 'Saree' },
  18: { bg: '#92400e', accent: '#fed7aa', sceneTa: 'Family', sceneEn: 'Family' },
  19: { bg: '#111827', accent: '#a78bfa', sceneTa: 'Cyberpunk', sceneEn: 'Cyberpunk' },
  20: { bg: '#334155', accent: '#e2e8f0', sceneTa: 'Catalog', sceneEn: 'Catalog' },
  21: { bg: '#7e22ce', accent: '#f0abfc', sceneTa: 'Anime', sceneEn: 'Anime' },
  22: { bg: '#18181b', accent: '#d4d4d8', sceneTa: 'Editorial', sceneEn: 'Editorial' },
  23: { bg: '#0f172a', accent: '#38bdf8', sceneTa: 'Reveal', sceneEn: 'Reveal' },
  24: { bg: '#0f766e', accent: '#99f6e4', sceneTa: 'Travel', sceneEn: 'Travel' },
  25: { bg: '#713f12', accent: '#fef08a', sceneTa: 'Cooking', sceneEn: 'Cooking' },
  26: { bg: '#4c1d95', accent: '#c4b5fd', sceneTa: 'Motion', sceneEn: 'Motion' },
  27: { bg: '#374151', accent: '#f3f4f6', sceneTa: 'Property', sceneEn: 'Property' },
  28: { bg: '#9a3412', accent: '#fdba74', sceneTa: 'Festival', sceneEn: 'Festival' },
  29: { bg: '#0f766e', accent: '#5eead4', sceneTa: 'Shop Ad', sceneEn: 'Shop Ad' },
  30: { bg: '#1d4ed8', accent: '#dbeafe', sceneTa: 'ID Photo', sceneEn: 'ID Photo' },
  31: { bg: '#7c2d12', accent: '#fdba74', sceneTa: 'Pet', sceneEn: 'Pet' },
  32: { bg: '#831843', accent: '#f9a8d4', sceneTa: 'Album', sceneEn: 'Album' },
};

const aiTips = [
  {
    titleTa: 'Prompt-ல் subject-ஐ முதலில் எழுதுங்கள்',
    titleEn: 'Start with the subject',
    bodyTa: 'முதலில் யார்/எது முக்கியம் என்பதை தெளிவாக எழுதுங்கள். அதன் பிறகு style, lighting, camera, background சேர்க்கலாம்.',
    bodyEn: 'Write who or what matters first. Then add style, lighting, camera, and background details.',
  },
  {
    titleTa: 'Reference photo இருந்தால் சொல்லுங்கள்',
    titleEn: 'Mention reference photos',
    bodyTa: 'முக அடையாளம் முக்கியமானால் “keep identity accurate” என்று சேர்க்கவும். இதனால் over-stylized முடிவுகள் குறையும்.',
    bodyEn: 'When identity matters, add “keep identity accurate.” It reduces over-stylized results.',
  },
  {
    titleTa: 'Video-க்கு duration மற்றும் ratio சேர்க்கவும்',
    titleEn: 'Add duration and ratio for video',
    bodyTa: 'Kling, Veo, Runway போன்ற tools-க்கு 9:16, 16:9, 6 seconds, 8 seconds போன்ற விவரங்கள் உதவும்.',
    bodyEn: 'Tools like Kling, Veo, and Runway work better when you include 9:16, 16:9, 6 seconds, or 8 seconds.',
  },
  {
    titleTa: 'Negative instruction பயன்படுத்துங்கள்',
    titleEn: 'Use negative instructions',
    bodyTa: '“no random text, no distorted hands, no extra logo” போன்ற வரிகள் unwanted mistakes-ஐ குறைக்க உதவும்.',
    bodyEn: 'Lines like “no random text, no distorted hands, no extra logo” help reduce unwanted mistakes.',
  },
  {
    titleTa: 'Watermark-ஐ prompt-லேயே சேர்க்கவும்',
    titleEn: 'Add watermark inside the prompt',
    bodyTa: 'Marketing-க்காக “tamilaiprompt.com bottom-right watermark” என்று தெளிவாக எழுதுங்கள்.',
    bodyEn: 'For marketing, clearly ask for a “tamilaiprompt.com bottom-right watermark.”',
  },
  {
    titleTa: 'ஒரே prompt-ஐ 3 முறை test செய்யுங்கள்',
    titleEn: 'Test one prompt three times',
    bodyTa: 'AI முடிவுகள் மாறக்கூடும். Best result கிடைக்க 2-3 variations உருவாக்கி நல்லதை தேர்ந்தெடுக்கவும்.',
    bodyEn: 'AI results can vary. Generate 2–3 variations and pick the strongest one.',
  },
];

const aiTools = [
  {
    name: 'Kling AI',
    url: 'https://kling.ai/',
    category: 'AI video & image',
    descriptionTa: 'Text-to-video, image-to-video, motion control போன்ற cinematic video generation.',
    descriptionEn: 'Cinematic text-to-video, image-to-video, and motion-control generation.',
  },
  {
    name: 'Midjourney',
    url: 'https://www.midjourney.com/',
    category: 'AI image',
    descriptionTa: 'Stylized, cinematic, poster, fashion, product visuals உருவாக்க popular tool.',
    descriptionEn: 'Popular for stylized, cinematic, poster, fashion, and product visuals.',
  },
  {
    name: 'ChatGPT Images',
    url: 'https://chatgpt.com/',
    category: 'AI image & writing',
    descriptionTa: 'Prompt எழுத, image edit செய்ய, Tamil content உருவாக்க பயன்படும்.',
    descriptionEn: 'Useful for prompt writing, image editing, and Tamil content creation.',
  },
  {
    name: 'Google Gemini',
    url: 'https://gemini.google.com/',
    category: 'AI image & assistant',
    descriptionTa: 'Image ideas, Tamil explanations, captions, visual prompt refinement.',
    descriptionEn: 'Good for image ideas, Tamil explanations, captions, and prompt refinement.',
  },
  {
    name: 'Runway',
    url: 'https://runwayml.com/',
    category: 'AI video',
    descriptionTa: 'Creators மற்றும் brands-க்கு AI video generation, editing workflows.',
    descriptionEn: 'AI video generation and editing workflows for creators and brands.',
  },
  {
    name: 'Canva AI',
    url: 'https://www.canva.com/ai/',
    category: 'Design & ads',
    descriptionTa: 'Posters, social ads, thumbnails, brand creatives உருவாக்க easy design tool.',
    descriptionEn: 'Easy design tool for posters, social ads, thumbnails, and brand creatives.',
  },
];

const trends: TrendPrompt[] = [
  {
    id: 1,
    category: 'image',
    image: 'portrait',
    imageAlt: 'Fictional couple in an authentic 1980s Tamil studio portrait',
    titleTa: '80s தமிழ் சினிமா லுக்',
    titleEn: '80s Tamil cinema look',
    descriptionTa: 'உங்கள் selfie-ஐ 1980களின் தமிழ்நாட்டு ஸ்டூடியோ படமாக மாற்றுங்கள்.',
    descriptionEn: 'Turn your selfie into an authentic 1980s Tamil Nadu studio portrait.',
    prompt:
      'நான் பதிவேற்றும் புகைப்படத்தை முக அடையாளத்திற்கான துல்லியமான reference ஆகப் பயன்படுத்தவும். 1980களின் தமிழ்நாட்டு ஸ்டூடியோ புகைப்படமாக மாற்றவும் — காலத்திற்கேற்ற உடை, இயல்பான சிகை அலங்காரம், warm tungsten lighting, faded 35mm film grain, soft vignette. முக அமைப்பையும் இயல்பான தோற்றத்தையும் மாற்ற வேண்டாம். படத்தின் கீழ்-வலது மூலையில் பாதுகாப்பான இடைவெளியுடன் “tamilaiprompt.com” என்ற சரியான எழுத்தை சிறிய, தெளிவான, 70% opacity கொண்ட வெள்ளை watermark ஆகச் சேர்க்கவும். வேறு எழுத்து, logo அல்லது watermark சேர்க்க வேண்டாம்.',
    models: ['Gemini', 'ChatGPT Images'],
    updatedTa: '2 மணி நேரம் முன்பு',
    updatedEn: '2 hours ago',
    featured: true,
    needsPhoto: true,
  },
  {
    id: 2,
    category: 'image',
    image: 'memory',
    imageAlt: 'Fictional adult meeting their childhood self in a South Indian courtyard',
    titleTa: 'குழந்தைப் பருவத்தை சந்திக்கும் நீங்கள்',
    titleEn: 'Meet your childhood self',
    descriptionTa: 'இன்றைய நீங்களும் குழந்தைப் பருவ நீங்களும் ஒரே உணர்ச்சிப்பூர்வமான படத்தில்.',
    descriptionEn: 'Place your present and childhood selves in one emotional portrait.',
    prompt:
      'நான் பதிவேற்றும் தற்போதைய புகைப்படம் மற்றும் குழந்தைப் பருவ புகைப்படத்தை identity references ஆகப் பயன்படுத்தவும். இருவரும் அமைதியான தென்னிந்திய வீட்டுத் திண்ணையில் அன்புடன் ஒருவரை ஒருவர் சந்திப்பது போல இயல்பான black-and-white editorial portrait உருவாக்கவும். முக அடையாளம், வயது மற்றும் உடல் விகிதங்களை துல்லியமாக வைத்திருக்கவும். இயல்பான ஒளி, மென்மையான film grain. படத்தின் கீழ்-வலது மூலையில் பாதுகாப்பான இடைவெளியுடன் “tamilaiprompt.com” என்ற சரியான எழுத்தை சிறிய, தெளிவான, 70% opacity கொண்ட வெள்ளை watermark ஆகச் சேர்க்கவும். வேறு எழுத்து, logo அல்லது watermark சேர்க்க வேண்டாம்.',
    models: ['ChatGPT Images', 'Gemini'],
    updatedTa: 'நேற்று',
    updatedEn: 'Yesterday',
    needsPhoto: true,
  },
  {
    id: 3,
    category: 'video',
    image: 'video',
    imageAlt: 'Cinematic motorcycle ride through rainy neon-lit Chennai',
    titleTa: 'சென்னை Night Ride Reel',
    titleEn: 'Chennai night ride reel',
    descriptionTa: 'மழை இரவில் வேகமான cinematic tracking shot — Reels மற்றும் Shorts-க்கு.',
    descriptionEn: 'A rainy-night cinematic tracking shot for Reels and Shorts.',
    prompt:
      '9:16 vertical cinematic video. A motorcycle rides through rain-soaked Chennai streets at night. Low-angle tracking camera, neon reflections on wet asphalt, realistic wheel spray, subtle handheld energy, smooth subject motion, dramatic blue and amber lighting. 8 seconds, consistent rider and motorcycle. Add the exact text “tamilaiprompt.com” as a small, clean, readable watermark in the bottom-right corner with safe padding, white at 70% opacity, visible throughout the entire video. Do not add any other text, logo, or watermark.',
    models: ['Veo', 'Kling', 'Runway'],
    updatedTa: 'இன்று',
    updatedEn: 'Today',
  },
  {
    id: 4,
    category: 'business',
    image: 'product',
    imageAlt: 'Premium South Indian filter coffee advertisement scene',
    titleTa: 'Filter Coffee Product Ad',
    titleEn: 'Filter coffee product ad',
    descriptionTa: 'சிறு வணிகத்திற்கான premium product photo மற்றும் video opening shot.',
    descriptionEn: 'A premium product visual and video opening shot for a local business.',
    prompt:
      'Premium South Indian filter coffee advertisement. A polished brass davara-tumbler on a dark stone counter, delicate steam rising, early-morning sunlight cutting through a traditional kitchen window, rich coffee texture, realistic condensation, cinematic 50mm product photography, warm brown and brass palette, negative space for later copy. Add the exact text “tamilaiprompt.com” as a small, clean, readable watermark in the bottom-right corner with safe padding, white at 70% opacity. Do not add any other text, logo, or watermark.',
    models: ['Gemini', 'Midjourney', 'ChatGPT Images'],
    updatedTa: 'இந்த வாரம்',
    updatedEn: 'This week',
  },
  {
    id: 9,
    category: 'image',
    image: 'portrait',
    imageAlt: 'Cinematic Tamil wedding portrait with temple lights',
    titleTa: 'Temple Wedding Portrait',
    titleEn: 'Temple wedding portrait',
    descriptionTa: 'திருமண அழைப்பிதழ் feel கொண்ட cinematic couple photo style.',
    descriptionEn: 'A cinematic couple photo style with classic Tamil wedding warmth.',
    prompt: `Create a realistic Tamil temple wedding portrait from the uploaded photo. Golden evening light, jasmine flowers, silk saree and veshti styling, soft bokeh lamps, respectful traditional mood, natural skin texture, 85mm portrait lens, premium magazine color grade. Keep face identity accurate. ${watermarkEn}`,
    models: ['ChatGPT Images', 'Gemini', 'Midjourney'],
    updatedTa: 'புதியது',
    updatedEn: 'New',
    needsPhoto: true,
  },
  {
    id: 10,
    category: 'image',
    image: 'memory',
    imageAlt: 'Polaroid style friends memory photograph',
    titleTa: 'Polaroid Memory Photo',
    titleEn: 'Polaroid memory photo',
    descriptionTa: 'நண்பர்கள், family, college memories-க்கு nostalgic instant photo look.',
    descriptionEn: 'A nostalgic instant-photo look for friends, family, and college memories.',
    prompt: `Transform the uploaded photo into a realistic 1990s Polaroid memory. Slight flash, warm faded colors, imperfect framing, handwritten-photo-album feeling without adding text, gentle grain, natural candid smiles, believable shadows. Keep identities unchanged. ${watermarkEn}`,
    models: ['Gemini', 'ChatGPT Images'],
    updatedTa: 'புதியது',
    updatedEn: 'New',
    needsPhoto: true,
  },
  {
    id: 11,
    category: 'image',
    image: 'portrait',
    imageAlt: 'Vintage Tamil hero poster visual',
    titleTa: 'Vintage Hero Poster',
    titleEn: 'Vintage hero poster',
    descriptionTa: 'Mass Tamil cinema poster look, social DP மற்றும் fan edits-க்கு.',
    descriptionEn: 'A mass Tamil cinema poster look for profile photos and fan-style edits.',
    prompt: `Create a vintage Tamil cinema hero poster from the uploaded portrait. Dramatic side lighting, painted poster texture, heroic pose, rich red and gold accents, film grain, theatre banner energy, realistic facial identity, no extra typography. ${watermarkEn}`,
    models: ['Midjourney', 'ChatGPT Images', 'Gemini'],
    updatedTa: 'ட்ரெண்டிங்',
    updatedEn: 'Trending',
    needsPhoto: true,
  },
  {
    id: 61,
    category: 'image',
    image: 'portrait',
    imageAlt: 'Fictional Tamil cinema fan poster with theatre banner lighting',
    titleTa: 'Favorite Actor-Style Poster',
    titleEn: 'Favorite actor-style poster',
    descriptionTa: 'உங்கள் photo-வை safe mass Tamil cinema fan poster look ஆக மாற்றுங்கள்.',
    descriptionEn: 'Turn your own photo into a safe Tamil cinema fan-poster look.',
    prompt:
      'நான் upload செய்யும் என் சொந்த photo-வை reference ஆக பயன்படுத்தி mass Tamil cinema fan poster style உருவாக்கவும். Dramatic theatre-banner lighting, red and gold color grade, heroic but natural pose, painted poster texture, film grain, crowd celebration energy, clean cinematic composition. Real actor முகத்தை copy செய்ய வேண்டாம், எந்த political party logo/symbol/flag/slogan-ஐ சேர்க்க வேண்டாம், copyrighted movie poster-ஐ copy செய்ய வேண்டாம். முக அடையாளம் இயல்பாகவும் மரியாதையாகவும் இருக்கட்டும். படத்தின் கீழ்-வலது மூலையில் “tamilaiprompt.com” watermark சேர்க்கவும்.',
    models: ['ChatGPT Images', 'Gemini', 'Midjourney'],
    updatedTa: 'புதிய ட்ரெண்ட்',
    updatedEn: 'New trend',
    featured: true,
    needsPhoto: true,
  },
  {
    id: 12,
    category: 'image',
    image: 'product',
    imageAlt: 'Luxury product photography with Tamil cultural styling',
    titleTa: 'Luxury Product Shot',
    titleEn: 'Luxury product shot',
    descriptionTa: 'Local brand product-ஐ premium ad visual ஆக மாற்றும் prompt.',
    descriptionEn: 'Turn a local product into a polished premium ad visual.',
    prompt: `Create a premium product photograph for [product name]. Use elegant South Indian styling, clean background, realistic reflections, soft natural light, sharp product detail, tasteful props, commercial photography quality, space for later marketing copy. ${watermarkEn}`,
    models: ['Gemini', 'Midjourney', 'ChatGPT Images'],
    updatedTa: 'இந்த வாரம்',
    updatedEn: 'This week',
  },
  {
    id: 13,
    category: 'image',
    image: 'video',
    imageAlt: 'Rainy cinematic street fashion portrait',
    titleTa: 'Rainy Street Portrait',
    titleEn: 'Rainy street portrait',
    descriptionTa: 'மழை, neon light, cinematic mood கொண்ட fashion portrait.',
    descriptionEn: 'A rainy neon street fashion portrait with cinematic mood.',
    prompt: `Create a realistic rainy street portrait from the uploaded photo. Wet road reflections, neon shop lights, soft umbrella shadow, stylish casual outfit, cinematic 50mm lens, shallow depth of field, natural face details, moody but clear expression. ${watermarkEn}`,
    models: ['ChatGPT Images', 'Gemini'],
    updatedTa: 'இன்று',
    updatedEn: 'Today',
    needsPhoto: true,
  },
  {
    id: 14,
    category: 'image',
    image: 'portrait',
    imageAlt: 'LinkedIn profile photo with modern office background',
    titleTa: 'Professional Profile Photo',
    titleEn: 'Professional profile photo',
    descriptionTa: 'LinkedIn, resume, founder profile-க்கு clean corporate portrait.',
    descriptionEn: 'A clean corporate portrait for LinkedIn, resumes, and founder profiles.',
    prompt: `Create a professional headshot from the uploaded selfie. Modern office background, soft window light, neat formal outfit, confident approachable expression, realistic skin texture, sharp eyes, natural face identity, no over-smoothing. ${watermarkEn}`,
    models: ['ChatGPT Images', 'Gemini'],
    updatedTa: 'பயனுள்ளது',
    updatedEn: 'Useful',
    needsPhoto: true,
  },
  {
    id: 15,
    category: 'image',
    image: 'memory',
    imageAlt: 'AI avatar in Tamil fantasy kingdom style',
    titleTa: 'Tamil Fantasy Avatar',
    titleEn: 'Tamil fantasy avatar',
    descriptionTa: 'Ancient Tamil kingdom inspired fantasy avatar.',
    descriptionEn: 'A fantasy avatar inspired by ancient Tamil kingdoms.',
    prompt: `Create a respectful Tamil fantasy avatar from the uploaded portrait. Ancient kingdom inspired costume, temple architecture background, golden hour lighting, detailed fabric, heroic but natural pose, cinematic realism, accurate facial identity. ${watermarkEn}`,
    models: ['Midjourney', 'ChatGPT Images'],
    updatedTa: 'ட்ரெண்டிங்',
    updatedEn: 'Trending',
    needsPhoto: true,
  },
  {
    id: 16,
    category: 'image',
    image: 'product',
    imageAlt: 'Food photography banana leaf meal',
    titleTa: 'Banana Leaf Food Photo',
    titleEn: 'Banana leaf food photo',
    descriptionTa: 'Restaurant menu, food reels cover, catering ads-க்கு.',
    descriptionEn: 'For restaurant menus, food reel covers, and catering ads.',
    prompt: `Create realistic South Indian food photography of [dish name] served on a banana leaf. Natural daylight, appetizing steam, fresh colors, clean table styling, overhead and 45-degree composition, editorial restaurant quality. ${watermarkEn}`,
    models: ['Gemini', 'Midjourney'],
    updatedTa: 'பயனுள்ளது',
    updatedEn: 'Useful',
  },
  {
    id: 17,
    category: 'image',
    image: 'portrait',
    imageAlt: 'Studio saree portrait with soft lighting',
    titleTa: 'Elegant Saree Portrait',
    titleEn: 'Elegant saree portrait',
    descriptionTa: 'Traditional, classy, realistic saree photoshoot style.',
    descriptionEn: 'A traditional, classy, realistic saree photoshoot style.',
    prompt: `Turn the uploaded portrait into an elegant saree studio photoshoot. Soft diffused lighting, premium silk texture, jasmine and simple jewelry, calm expression, clean background, realistic body proportions and face identity. ${watermarkEn}`,
    models: ['ChatGPT Images', 'Gemini'],
    updatedTa: 'இந்த வாரம்',
    updatedEn: 'This week',
    needsPhoto: true,
  },
  {
    id: 18,
    category: 'image',
    image: 'memory',
    imageAlt: 'Newborn announcement style family photo',
    titleTa: 'Family Portrait Style',
    titleEn: 'Family portrait style',
    descriptionTa: 'Family album, anniversary, celebration edits-க்கு warm portrait.',
    descriptionEn: 'A warm portrait style for albums, anniversaries, and celebrations.',
    prompt: `Create a warm family portrait from the uploaded reference photos. Cozy home setting, natural smiles, balanced faces, soft window light, realistic clothing, gentle film color grade, no distorted hands or faces. ${watermarkEn}`,
    models: ['ChatGPT Images', 'Gemini'],
    updatedTa: 'பயனுள்ளது',
    updatedEn: 'Useful',
    needsPhoto: true,
  },
  {
    id: 19,
    category: 'image',
    image: 'video',
    imageAlt: 'Cyberpunk Chennai portrait',
    titleTa: 'Cyberpunk Chennai',
    titleEn: 'Cyberpunk Chennai',
    descriptionTa: 'Futuristic Chennai street mood-ல் profile photo அல்லது poster.',
    descriptionEn: 'A futuristic Chennai street mood for profile photos or posters.',
    prompt: `Create a cyberpunk Chennai portrait from the uploaded photo. Futuristic street signs without readable text, neon reflections, rain mist, modern Tamil city energy, cinematic shadows, detailed face, stylish jacket, realistic not cartoonish. ${watermarkEn}`,
    models: ['Midjourney', 'ChatGPT Images'],
    updatedTa: 'ட்ரெண்டிங்',
    updatedEn: 'Trending',
    needsPhoto: true,
  },
  {
    id: 20,
    category: 'image',
    image: 'product',
    imageAlt: 'Ecommerce product photo on white background',
    titleTa: 'Ecommerce White Background',
    titleEn: 'Ecommerce white background',
    descriptionTa: 'Amazon, Flipkart, website product listing-க்கு clean image.',
    descriptionEn: 'A clean listing image for Amazon, Flipkart, and websites.',
    prompt: `Create a clean ecommerce product image for [product]. Pure white background, realistic shadow, centered composition, accurate product shape and color, high detail, commercial catalog lighting, no labels unless present on product. ${watermarkEn}`,
    models: ['ChatGPT Images', 'Gemini'],
    updatedTa: 'பயனுள்ளது',
    updatedEn: 'Useful',
  },
  {
    id: 21,
    category: 'image',
    image: 'portrait',
    imageAlt: 'Anime inspired Tamil portrait',
    titleTa: 'Anime Tamil Avatar',
    titleEn: 'Anime Tamil avatar',
    descriptionTa: 'DP, stickers, creator identity-க்கு stylized avatar.',
    descriptionEn: 'A stylized avatar for DPs, stickers, and creator identity.',
    prompt: `Create an anime-inspired avatar based on the uploaded portrait. Keep the face recognizable, expressive eyes, clean line art, Tamil cultural outfit accents, vibrant background, polished character design, not childish. ${watermarkEn}`,
    models: ['Midjourney', 'ChatGPT Images'],
    updatedTa: 'ட்ரெண்டிங்',
    updatedEn: 'Trending',
    needsPhoto: true,
  },
  {
    id: 22,
    category: 'image',
    image: 'memory',
    imageAlt: 'Black and white editorial portrait',
    titleTa: 'Black & White Editorial',
    titleEn: 'Black and white editorial',
    descriptionTa: 'Magazine-style moody portrait, actors மற்றும் creators-க்கு.',
    descriptionEn: 'A magazine-style moody portrait for actors and creators.',
    prompt: `Create a black-and-white editorial portrait from the uploaded photo. Strong but soft contrast, natural skin texture, minimal background, thoughtful expression, high fashion magazine lighting, 85mm lens, realistic face identity. ${watermarkEn}`,
    models: ['ChatGPT Images', 'Gemini'],
    updatedTa: 'பயனுள்ளது',
    updatedEn: 'Useful',
    needsPhoto: true,
  },
  {
    id: 23,
    category: 'video',
    image: 'video',
    imageAlt: 'Product reveal video with cinematic lighting',
    titleTa: 'Product Reveal Video',
    titleEn: 'Product reveal video',
    descriptionTa: '8-second brand product reveal for Reels, Shorts, ads.',
    descriptionEn: 'An 8-second brand product reveal for Reels, Shorts, and ads.',
    prompt: `9:16 vertical video. Cinematic product reveal for [product]. Camera slowly pushes in, soft spotlight, realistic reflections, clean premium background, elegant hand interaction, subtle steam or particles only if relevant, smooth motion, 8 seconds. ${watermarkEn} Keep the watermark visible throughout the entire video.`,
    models: ['Veo', 'Runway', 'Kling'],
    updatedTa: 'இன்று',
    updatedEn: 'Today',
  },
  {
    id: 24,
    category: 'video',
    image: 'video',
    imageAlt: 'Travel reel of Tamil Nadu locations',
    titleTa: 'Tamil Nadu Travel Reel',
    titleEn: 'Tamil Nadu travel reel',
    descriptionTa: 'Temple, beach, street food shots கொண்ட travel video prompt.',
    descriptionEn: 'A travel video prompt with temples, beaches, and street food shots.',
    prompt: `9:16 vertical cinematic travel reel of Tamil Nadu. Fast but smooth cuts: temple gopuram at sunrise, coastal road, street food close-up, busy market, sunset silhouette. Natural colors, handheld travel energy, 10 seconds, no readable random text. ${watermarkEn} Keep the watermark visible throughout.`,
    models: ['Veo', 'Kling', 'Runway'],
    updatedTa: 'ட்ரெண்டிங்',
    updatedEn: 'Trending',
  },
  {
    id: 25,
    category: 'video',
    image: 'product',
    imageAlt: 'Food preparation cinematic reel',
    titleTa: 'Food Making Reel',
    titleEn: 'Food making reel',
    descriptionTa: 'Restaurant, cloud kitchen, home chef pages-க்கு appetizing reel.',
    descriptionEn: 'An appetizing reel for restaurants, cloud kitchens, and home chefs.',
    prompt: `9:16 vertical food reel showing [dish] being prepared. Macro close-ups, sizzling texture, steam, ingredient drops, quick cuts, natural kitchen sound mood, warm light, mouth-watering final plate, 8 seconds. ${watermarkEn} Keep watermark visible throughout.`,
    models: ['Veo', 'Kling', 'Runway'],
    updatedTa: 'இந்த வாரம்',
    updatedEn: 'This week',
  },
  {
    id: 26,
    category: 'video',
    image: 'portrait',
    imageAlt: 'Cinematic portrait motion video',
    titleTa: 'Photo To Motion Reel',
    titleEn: 'Photo to motion reel',
    descriptionTa: 'ஒரு portrait photo-ஐ subtle cinematic motion video ஆக.',
    descriptionEn: 'Turn one portrait photo into subtle cinematic motion.',
    prompt: `Animate the uploaded portrait into a 6-second cinematic motion video. Very subtle head movement, natural blinking, soft moving light, slight camera push-in, realistic hair movement, preserve face identity, no extra facial changes. ${watermarkEn} Keep watermark visible throughout.`,
    models: ['Kling', 'Runway', 'Veo'],
    updatedTa: 'ட்ரெண்டிங்',
    updatedEn: 'Trending',
    needsPhoto: true,
  },
  {
    id: 27,
    category: 'video',
    image: 'video',
    imageAlt: 'Real estate walk-through video',
    titleTa: 'Real Estate Walkthrough',
    titleEn: 'Real estate walkthrough',
    descriptionTa: 'Flat, villa, rental property-க்கு cinematic walkthrough.',
    descriptionEn: 'A cinematic walkthrough for flats, villas, and rentals.',
    prompt: `16:9 or 9:16 real estate walkthrough video for [property type]. Smooth gimbal movement from entrance to living area, bright natural light, clean interiors, realistic space, premium but honest presentation, 12 seconds. ${watermarkEn} Keep watermark visible throughout.`,
    models: ['Veo', 'Runway'],
    updatedTa: 'பயனுள்ளது',
    updatedEn: 'Useful',
  },
  {
    id: 28,
    category: 'video',
    image: 'product',
    imageAlt: 'Festival greeting animation',
    titleTa: 'Festival Greeting Video',
    titleEn: 'Festival greeting video',
    descriptionTa: 'Pongal, Diwali, New Year brand greeting video style.',
    descriptionEn: 'A festive greeting video style for Pongal, Diwali, and New Year.',
    prompt: `9:16 festive Tamil celebration greeting video for [festival]. Lamps, kolam, sugarcane or relevant festival symbols, warm family mood, elegant camera movement, premium colors, no random text, 8 seconds. ${watermarkEn} Keep watermark visible throughout.`,
    models: ['Veo', 'Kling', 'Runway'],
    updatedTa: 'சீசனல்',
    updatedEn: 'Seasonal',
  },
  {
    id: 29,
    category: 'business',
    image: 'product',
    imageAlt: 'Local business ad creative prompt',
    titleTa: 'Local Shop Ad Creative',
    titleEn: 'Local shop ad creative',
    descriptionTa: 'Small business social media poster visual prompt.',
    descriptionEn: 'A social poster visual prompt for small businesses.',
    prompt: `Create a clean social media ad visual for a Tamil local business: [business type]. Show the product/service clearly, friendly neighborhood trust, bright realistic lighting, space for later Tamil copy, modern Instagram-ready composition. ${watermarkEn}`,
    models: ['Canva AI', 'ChatGPT Images', 'Gemini'],
    updatedTa: 'பயனுள்ளது',
    updatedEn: 'Useful',
  },
  {
    id: 30,
    category: 'image',
    image: 'portrait',
    imageAlt: 'Passport photo correction prompt',
    titleTa: 'Passport Photo Clean-Up',
    titleEn: 'Passport photo clean-up',
    descriptionTa: 'Formal ID photo போல neat background மற்றும் lighting.',
    descriptionEn: 'Neat background and lighting for a formal ID-style photo.',
    prompt: `Convert the uploaded selfie into a formal passport-style photo. Plain light background, even lighting, natural skin, neutral expression, centered face, realistic shoulders, no beauty filter, keep exact identity. ${watermarkEn}`,
    models: ['ChatGPT Images', 'Gemini'],
    updatedTa: 'பயனுள்ளது',
    updatedEn: 'Useful',
    needsPhoto: true,
  },
  {
    id: 31,
    category: 'image',
    image: 'memory',
    imageAlt: 'Pet and owner portrait style',
    titleTa: 'Pet With Owner Portrait',
    titleEn: 'Pet with owner portrait',
    descriptionTa: 'Pet lovers-க்கான emotional studio portrait style.',
    descriptionEn: 'An emotional studio portrait style for pet lovers.',
    prompt: `Create a warm studio portrait of the person and their pet from uploaded references. Soft light, natural interaction, accurate pet features, realistic hands, calm background, emotional but not exaggerated. ${watermarkEn}`,
    models: ['ChatGPT Images', 'Gemini'],
    updatedTa: 'புதியது',
    updatedEn: 'New',
    needsPhoto: true,
  },
  {
    id: 32,
    category: 'image',
    image: 'video',
    imageAlt: 'Music album cover in Tamil indie style',
    titleTa: 'Indie Album Cover',
    titleEn: 'Indie album cover',
    descriptionTa: 'Tamil indie song, podcast, playlist cover look.',
    descriptionEn: 'A Tamil indie song, podcast, or playlist cover look.',
    prompt: `Create a Tamil indie album cover visual for [song mood]. Cinematic portrait or abstract street scene, rich texture, emotional lighting, square composition, modern music branding feel, leave space for later title design, no random text. ${watermarkEn}`,
    models: ['Midjourney', 'ChatGPT Images'],
    updatedTa: 'பயனுள்ளது',
    updatedEn: 'Useful',
  },
];

const sectorPrompts = [
  {
    id: 5,
    category: 'business' as const,
    icon: Megaphone,
    titleTa: 'Instagram விற்பனை Caption',
    titleEn: 'Instagram sales caption',
    descriptionTa: 'தமிழ் வாடிக்கையாளர்களுக்கான இயல்பான விற்பனை பதிவு.',
    descriptionEn: 'A natural sales post written for Tamil customers.',
    prompt: 'நீங்கள் ஒரு தமிழ் social media copywriter. [தயாரிப்பு] பற்றிய Instagram caption எழுதுங்கள். முதல் வரியில் கவனம் ஈர்க்கும் hook, பின்னர் 3 தெளிவான பயன்கள், நம்பகமான தமிழ் பேச்சு நடை, மென்மையான call-to-action மற்றும் 5 தொடர்புடைய hashtags சேர்க்கவும். மிகைப்படுத்திய வாக்குறுதிகள் வேண்டாம்.',
  },
  {
    id: 6,
    category: 'education' as const,
    icon: GraduationCap,
    titleTa: 'எளிய தமிழில் பாடம் விளக்கம்',
    titleEn: 'Explain a lesson in simple Tamil',
    descriptionTa: 'கடினமான கருத்தை உதாரணங்களுடன் எளிதாக கற்றுக்கொள்ளுங்கள்.',
    descriptionEn: 'Learn a difficult concept through clear Tamil examples.',
    prompt: '[பாடம்/கருத்து] என்பதை 12 வயது மாணவருக்கும் புரியும் எளிய தமிழில் விளக்குங்கள். முதலில் ஒரு தினசரி வாழ்க்கை ஒப்புமை, பின்னர் படிப்படியான விளக்கம், ஒரு சிறிய உதாரணம், இறுதியில் 3 கேள்விகள் கொண்ட self-check சேர்க்கவும்.',
  },
  {
    id: 7,
    category: 'video' as const,
    icon: Clapperboard,
    titleTa: '30-வினாடி Reel Script',
    titleEn: '30-second reel script',
    descriptionTa: 'Hook முதல் CTA வரை முழு தமிழ் short-video script.',
    descriptionEn: 'A complete Tamil short-video script from hook to CTA.',
    prompt: '[தலைப்பு] பற்றி 30-வினாடி Instagram Reel script எழுதுங்கள். 2 வினாடி spoken hook, 3 வேகமான scenes, ஒவ்வொரு scene-க்கும் visual direction மற்றும் on-screen text, இயல்பான தமிழ் narration, இறுதியில் ஒரு தெளிவான CTA சேர்க்கவும். அட்டவணை வடிவில் கொடுக்கவும்.',
  },
  {
    id: 8,
    category: 'coding' as const,
    icon: Code2,
    titleTa: 'Code பிழை கண்டறிதல்',
    titleEn: 'Debug code step by step',
    descriptionTa: 'Root cause, குறைந்த மாற்றம் மற்றும் சரிபார்ப்பு வழிமுறை.',
    descriptionEn: 'Find the root cause, smallest fix, and verification steps.',
    prompt: 'நீங்கள் ஒரு senior software engineer. கீழே உள்ள code மற்றும் error message-ஐ ஆய்வு செய்யுங்கள். முதலில் root cause-ஐ எளிய தமிழில் விளக்குங்கள். பின்னர் குறைந்த மாற்றத்துடன் சரிசெய்த code, edge cases மற்றும் verification steps கொடுங்கள். Code: [paste code] Error: [paste error]',
  },
  {
    id: 33,
    category: 'business' as const,
    icon: Megaphone,
    titleTa: 'WhatsApp Offer Message',
    titleEn: 'WhatsApp offer message',
    descriptionTa: 'Local customers-க்கு குறுகிய, நம்பகமான offer copy.',
    descriptionEn: 'Short, trustworthy offer copy for local customers.',
    prompt: '[தயாரிப்பு/சேவை]க்கான WhatsApp offer message தமிழில் எழுதுங்கள். முதல் வரி hook, offer details, யாருக்கு பொருந்தும், ஒரு நம்பிக்கை காரணம், மென்மையான CTA, அதிகபட்சம் 70 வார்த்தைகள்.',
  },
  {
    id: 34,
    category: 'business' as const,
    icon: BriefcaseBusiness,
    titleTa: 'Business Name Ideas',
    titleEn: 'Business name ideas',
    descriptionTa: 'Tamil audience-க்கு நினைவில் நிற்கும் brand names.',
    descriptionEn: 'Memorable brand names for Tamil audiences.',
    prompt: '[business type]க்கு 25 brand name ideas கொடுங்கள். தமிழ் பேசும் audience-க்கு easy pronunciation, premium feel, social media handle availability நினைத்து பெயர்கள் உருவாக்கவும். ஒவ்வொரு பெயருக்கும் short meaning கொடுக்கவும்.',
  },
  {
    id: 35,
    category: 'business' as const,
    icon: Megaphone,
    titleTa: 'Facebook Ad Copy',
    titleEn: 'Facebook ad copy',
    descriptionTa: 'Hook, benefits, CTA உடன் Tamil ad variations.',
    descriptionEn: 'Tamil ad variations with hook, benefits, and CTA.',
    prompt: '[offer]க்கான 5 Facebook ad copy variations தமிழில் எழுதுங்கள். ஒவ்வொன்றும் வேறு angle: savings, trust, urgency, local pride, problem-solution. Headline, primary text, CTA தனியாக கொடுக்கவும்.',
  },
  {
    id: 36,
    category: 'business' as const,
    icon: BriefcaseBusiness,
    titleTa: 'Customer Review Reply',
    titleEn: 'Customer review reply',
    descriptionTa: 'Positive மற்றும் negative reviews-க்கு professional Tamil replies.',
    descriptionEn: 'Professional Tamil replies for positive and negative reviews.',
    prompt: 'கீழே உள்ள customer review-க்கு தமிழில் professional reply எழுதுங்கள். நன்றி, empathy, clear next step, brand voice friendly ஆக இருக்க வேண்டும். Defensive tone வேண்டாம். Review: [paste review]',
  },
  {
    id: 37,
    category: 'business' as const,
    icon: BriefcaseBusiness,
    titleTa: 'Product Description',
    titleEn: 'Product description',
    descriptionTa: 'Website அல்லது marketplace listing-க்கு SEO-friendly Tamil copy.',
    descriptionEn: 'SEO-friendly Tamil copy for website or marketplace listings.',
    prompt: '[product]க்கான SEO-friendly product description தமிழில் எழுதுங்கள். 1 short intro, 5 benefits, யாருக்கு பயன்படும், care/use instructions, natural keywords, இறுதியில் CTA சேர்க்கவும்.',
  },
  {
    id: 38,
    category: 'business' as const,
    icon: Megaphone,
    titleTa: '30-Day Content Calendar',
    titleEn: '30-day content calendar',
    descriptionTa: 'Small business Instagram page-க்கு daily content ideas.',
    descriptionEn: 'Daily content ideas for a small-business Instagram page.',
    prompt: '[business type]க்கு 30 நாள் Instagram content calendar உருவாக்குங்கள். Reels, carousel, story, customer proof, education, offer posts mix ஆக இருக்க வேண்டும். Tamil caption idea மற்றும் visual idea சேர்க்கவும்.',
  },
  {
    id: 39,
    category: 'business' as const,
    icon: BriefcaseBusiness,
    titleTa: 'Landing Page Copy',
    titleEn: 'Landing page copy',
    descriptionTa: 'Hero, benefits, trust, FAQ இல்லாமல் conversion-focused website copy.',
    descriptionEn: 'Conversion-focused website copy with hero, benefits, and trust.',
    prompt: '[service/product]க்கான landing page copy தமிழில் எழுதுங்கள். H1, subheading, 3 core benefits, proof points, process, pricing note, CTA sections கொடுக்கவும். Clear, simple, credible tone.',
  },
  {
    id: 40,
    category: 'education' as const,
    icon: GraduationCap,
    titleTa: 'Exam Study Plan',
    titleEn: 'Exam study plan',
    descriptionTa: 'தேர்வுக்கு தினசரி study schedule.',
    descriptionEn: 'A daily study schedule for exams.',
    prompt: '[exam/subject]க்கு [number] நாட்கள் study plan தமிழில் உருவாக்குங்கள். Daily topics, revision blocks, practice questions, weak-area review, final 2 days strategy சேர்க்கவும்.',
  },
  {
    id: 41,
    category: 'education' as const,
    icon: GraduationCap,
    titleTa: 'Notes To Flashcards',
    titleEn: 'Notes to flashcards',
    descriptionTa: 'Class notes-ஐ quick revision flashcards ஆக மாற்றுங்கள்.',
    descriptionEn: 'Turn class notes into quick revision flashcards.',
    prompt: 'கீழே உள்ள notes-ஐ தமிழில் flashcards ஆக மாற்றுங்கள். ஒவ்வொரு card-லும் question, short answer, memory clue சேர்க்கவும். முக்கியமான formulas/definitions தனியாக highlight செய்யவும். Notes: [paste notes]',
  },
  {
    id: 42,
    category: 'education' as const,
    icon: GraduationCap,
    titleTa: 'English To Tamil Teacher',
    titleEn: 'English to Tamil teacher',
    descriptionTa: 'English concepts-ஐ தமிழ் உதாரணத்துடன் கற்றுக்கொள்ள.',
    descriptionEn: 'Learn English concepts with Tamil explanations.',
    prompt: '[English grammar/topic]ஐ தமிழ் பேசும் மாணவருக்குப் புரியும் வகையில் கற்றுக்கொடுங்கள். Simple rule, Tamil comparison, 10 examples, common mistakes, 5 practice questions சேர்க்கவும்.',
  },
  {
    id: 43,
    category: 'education' as const,
    icon: GraduationCap,
    titleTa: 'YouTube Lesson Summary',
    titleEn: 'YouTube lesson summary',
    descriptionTa: 'Long lesson-ஐ clear Tamil revision notes ஆக.',
    descriptionEn: 'Turn a long lesson into clear Tamil revision notes.',
    prompt: 'இந்த transcript/lesson notes-ஐ தமிழில் சுருக்குங்கள். Key ideas, definitions, examples, timeline/process, exam-important points, 5 quiz questions சேர்க்கவும். Content: [paste transcript]',
  },
  {
    id: 44,
    category: 'education' as const,
    icon: GraduationCap,
    titleTa: 'Kids Story Generator',
    titleEn: 'Kids story generator',
    descriptionTa: 'Moral உடன் குழந்தைகளுக்கான தமிழ் bedtime story.',
    descriptionEn: 'A Tamil bedtime story for children with a moral.',
    prompt: '[theme] பற்றி 6-9 வயது குழந்தைகளுக்கான தமிழ் bedtime story எழுதுங்கள். Simple words, friendly characters, gentle humour, clear moral, 700 வார்த்தைகளுக்குள் இருக்க வேண்டும்.',
  },
  {
    id: 45,
    category: 'education' as const,
    icon: GraduationCap,
    titleTa: 'Interview Preparation',
    titleEn: 'Interview preparation',
    descriptionTa: 'Job interview-க்கு Tamil guidance மற்றும் mock answers.',
    descriptionEn: 'Tamil guidance and mock answers for job interviews.',
    prompt: '[job role] interview-க்கு தயாராக உதவுங்கள். 15 common questions, strong sample answers, Tamil explanation, STAR method, கேட்க வேண்டிய 5 questions, final checklist கொடுக்கவும்.',
  },
  {
    id: 46,
    category: 'video' as const,
    icon: Clapperboard,
    titleTa: 'YouTube Shorts Hook',
    titleEn: 'YouTube Shorts hook',
    descriptionTa: 'First 3 seconds-ல் attention பிடிக்கும் Tamil hooks.',
    descriptionEn: 'Tamil hooks that grab attention in the first 3 seconds.',
    prompt: '[topic]க்கு 25 Tamil YouTube Shorts hooks எழுதுங்கள். Curiosity, mistake, myth, checklist, story, challenge angles mix ஆக இருக்க வேண்டும். ஒவ்வொரு hook-மும் 12 வார்த்தைகளுக்குள்.',
  },
  {
    id: 47,
    category: 'video' as const,
    icon: Clapperboard,
    titleTa: 'Voiceover Script',
    titleEn: 'Voiceover script',
    descriptionTa: 'Product, travel, education video-க்கு natural Tamil voiceover.',
    descriptionEn: 'Natural Tamil voiceover for product, travel, or education videos.',
    prompt: '[video topic]க்கான 45-second Tamil voiceover script எழுதுங்கள். Warm spoken Tamil, short sentences, scene-by-scene pacing, emotional ending, clear CTA சேர்க்கவும்.',
  },
  {
    id: 48,
    category: 'video' as const,
    icon: Clapperboard,
    titleTa: 'Faceless Reel Ideas',
    titleEn: 'Faceless reel ideas',
    descriptionTa: 'Camera-வில் வராமல் create செய்யக்கூடிய Tamil reel ideas.',
    descriptionEn: 'Tamil reel ideas creators can make without showing their face.',
    prompt: '[niche]க்கு 30 faceless Instagram Reel ideas கொடுங்கள். ஒவ்வொன்றுக்கும் hook, visual footage idea, voiceover angle, CTA சேர்க்கவும். Tamil audience-க்கு relatable ஆக இருக்க வேண்டும்.',
  },
  {
    id: 49,
    category: 'video' as const,
    icon: Clapperboard,
    titleTa: 'Podcast Clip Script',
    titleEn: 'Podcast clip script',
    descriptionTa: 'Podcast idea-ஐ short viral clip ஆக மாற்றும் script.',
    descriptionEn: 'Turn a podcast idea into a short viral clip script.',
    prompt: '[podcast topic]க்கான 60-second Tamil podcast clip script எழுதுங்கள். Strong opening opinion, one story/example, crisp insight, share-worthy closing line, caption suggestion சேர்க்கவும்.',
  },
  {
    id: 50,
    category: 'coding' as const,
    icon: Code2,
    titleTa: 'Explain Code In Tamil',
    titleEn: 'Explain code in Tamil',
    descriptionTa: 'கோடு என்ன செய்கிறது என்பதை line-by-line கற்றுக்கொள்ள.',
    descriptionEn: 'Understand what code does, line by line.',
    prompt: 'இந்த code-ஐ line-by-line தமிழில் விளக்குங்கள். முதலில் overall purpose, பின்னர் important functions, data flow, possible bugs, beginner-friendly summary கொடுக்கவும். Code: [paste code]',
  },
  {
    id: 51,
    category: 'coding' as const,
    icon: Code2,
    titleTa: 'Build App Plan',
    titleEn: 'Build app plan',
    descriptionTa: 'Idea-வை screens, database, API, timeline ஆக உடைக்க.',
    descriptionEn: 'Break an idea into screens, database, API, and timeline.',
    prompt: '[app idea]க்கு technical build plan உருவாக்குங்கள். User flows, screens, database tables, API endpoints, MVP scope, tech stack, 2-week execution plan ஆகியவற்றை தமிழில் கொடுக்கவும்.',
  },
  {
    id: 52,
    category: 'coding' as const,
    icon: Code2,
    titleTa: 'SQL Query Helper',
    titleEn: 'SQL query helper',
    descriptionTa: 'Database கேள்விக்கு சரியான SQL மற்றும் explanation.',
    descriptionEn: 'Correct SQL and explanation for database questions.',
    prompt: 'இந்த requirement-க்கு SQL query எழுதுங்கள். Table schema, expected output, edge cases, performance index suggestion, Tamil explanation சேர்க்கவும். Requirement: [describe] Schema: [paste schema]',
  },
  {
    id: 53,
    category: 'coding' as const,
    icon: Code2,
    titleTa: 'Website Bug Report',
    titleEn: 'Website bug report',
    descriptionTa: 'Bug-ஐ developer புரியும் report ஆக மாற்றுங்கள்.',
    descriptionEn: 'Turn a bug into a developer-ready report.',
    prompt: 'இந்த website/app bug-ஐ developer-ready report ஆக எழுதுங்கள். Title, steps to reproduce, expected result, actual result, device/browser, severity, screenshots needed, possible cause சேர்க்கவும். Bug: [describe]',
  },
  {
    id: 54,
    category: 'coding' as const,
    icon: Code2,
    titleTa: 'API Documentation',
    titleEn: 'API documentation',
    descriptionTa: 'API endpoint-க்கு clear docs மற்றும் examples.',
    descriptionEn: 'Clear docs and examples for an API endpoint.',
    prompt: 'இந்த API endpoint-க்கு documentation எழுதுங்கள். Purpose, method, URL, headers, request body, response example, error cases, curl example, Tamil developer explanation சேர்க்கவும். API: [paste details]',
  },
  {
    id: 55,
    category: 'business' as const,
    icon: Megaphone,
    titleTa: 'SEO Blog Outline',
    titleEn: 'SEO blog outline',
    descriptionTa: 'Tamil blog post-க்கு keyword-friendly outline.',
    descriptionEn: 'A keyword-friendly outline for a Tamil blog post.',
    prompt: '[keyword/topic]க்கான SEO blog outline தமிழில் உருவாக்குங்கள். Search intent, title options, meta description, H2/H3 structure, FAQs as plain Q&A, internal link ideas, CTA சேர்க்கவும்.',
  },
  {
    id: 56,
    category: 'business' as const,
    icon: BriefcaseBusiness,
    titleTa: 'Competitor Comparison',
    titleEn: 'Competitor comparison',
    descriptionTa: 'உங்கள் product/service-ஐ competitor உடன் compare செய்ய.',
    descriptionEn: 'Compare your product or service with a competitor.',
    prompt: '[our product] மற்றும் [competitor] comparison table உருவாக்குங்கள். Features, pricing angle, ideal customer, strengths, weaknesses, positioning message, Tamil sales summary சேர்க்கவும். Fake claims வேண்டாம்.',
  },
  {
    id: 57,
    category: 'education' as const,
    icon: GraduationCap,
    titleTa: 'Tamil Quiz Maker',
    titleEn: 'Tamil quiz maker',
    descriptionTa: 'Any topic-க்கு multiple choice quiz.',
    descriptionEn: 'A multiple-choice quiz for any topic.',
    prompt: '[topic] பற்றி 20 multiple-choice quiz questions தமிழில் உருவாக்குங்கள். ஒவ்வொரு கேள்விக்கும் 4 options, correct answer, short explanation, difficulty level சேர்க்கவும்.',
  },
  {
    id: 58,
    category: 'video' as const,
    icon: Clapperboard,
    titleTa: 'Ad Storyboard',
    titleEn: 'Ad storyboard',
    descriptionTa: '15-second ad-க்கு scene-by-scene plan.',
    descriptionEn: 'A scene-by-scene plan for a 15-second ad.',
    prompt: '[product/service]க்கான 15-second video ad storyboard உருவாக்குங்கள். Scene time, visual, voiceover, on-screen text, sound cue, CTA ஆகியவற்றை table வடிவில் கொடுக்கவும்.',
  },
  {
    id: 59,
    category: 'business' as const,
    icon: Megaphone,
    titleTa: 'Festival Campaign Ideas',
    titleEn: 'Festival campaign ideas',
    descriptionTa: 'Tamil festival season-க்கு campaign ideas.',
    descriptionEn: 'Campaign ideas for Tamil festival seasons.',
    prompt: '[festival]க்கான [business type] marketing campaign ideas 20 கொடுங்கள். Offer angle, social post idea, WhatsApp message, reel idea, customer engagement activity சேர்க்கவும்.',
  },
  {
    id: 60,
    category: 'business' as const,
    icon: BriefcaseBusiness,
    titleTa: 'Founder Bio',
    titleEn: 'Founder bio',
    descriptionTa: 'Website, LinkedIn, pitch deck-க்கு founder intro.',
    descriptionEn: 'A founder intro for website, LinkedIn, or pitch decks.',
    prompt: '[founder details] அடிப்படையில் தமிழிலும் English-லுமாக founder bio எழுதுங்கள். Short version, website version, LinkedIn version, warm but professional tone, credibility points சேர்க்கவும்.',
  },
];

const englishPromptById: Record<number, string> = {
  1: `Use my uploaded photo as an accurate face reference. Transform it into an authentic 1980s Tamil Nadu studio portrait with period-appropriate clothing, natural hairstyle, warm tungsten lighting, faded 35mm film grain, and a soft vignette. Keep the face structure and natural expression unchanged. Add the exact text “tamilaiprompt.com” as a small, clean, readable white watermark at 70% opacity in the bottom-right corner with safe padding. Do not add any other text, logo, or watermark.`,
  2: `Use my current photo and childhood photo as identity references. Create a natural black-and-white editorial portrait where my present self warmly meets my childhood self in a calm South Indian home courtyard. Keep face identity, age, and body proportions accurate. Use natural light and soft film grain. Add the exact text “tamilaiprompt.com” as a small, clean, readable white watermark at 70% opacity in the bottom-right corner with safe padding. Do not add any other text, logo, or watermark.`,
  3: `9:16 vertical cinematic video. A motorcycle rides through rain-soaked Chennai streets at night. Low-angle tracking camera, neon reflections on wet asphalt, realistic wheel spray, subtle handheld energy, smooth subject motion, dramatic blue and amber lighting. 8 seconds, consistent rider and motorcycle. Add the exact text “tamilaiprompt.com” as a small, clean, readable white watermark in the bottom-right corner with safe padding, white at 70% opacity, visible throughout the entire video. Do not add any other text, logo, or watermark.`,
  61: `Use my uploaded personal photo as the reference and create a mass Tamil cinema fan-poster style image. Use dramatic theatre-banner lighting, red and gold color grading, a heroic but natural pose, painted poster texture, film grain, crowd celebration energy, and a clean cinematic composition. Do not copy any real actor’s face, do not include any political party logo, symbol, flag, or slogan, and do not copy a copyrighted movie poster. Keep my identity natural and respectful. Add “tamilaiprompt.com” as a bottom-right watermark.`,
  5: `Act as a Tamil social media copywriter. Write an Instagram sales caption for [product]. Include an attention-grabbing first-line hook, 3 clear benefits, a trustworthy conversational tone for Tamil customers, a soft call-to-action, and 5 relevant hashtags. Do not use exaggerated promises.`,
  6: `Explain [lesson/concept] in simple English so even a 12-year-old student can understand it. Start with a real-life analogy, then give a step-by-step explanation, one small example, and 3 self-check questions at the end.`,
  7: `Write a 30-second Instagram Reel script about [topic]. Include a 2-second spoken hook, 3 fast scenes, visual direction and on-screen text for each scene, natural narration, and a clear CTA at the end. Give it in table format.`,
  8: `Act as a senior software engineer. Review the code and error message below. First explain the root cause in simple English. Then provide the smallest possible fix, corrected code, edge cases, and verification steps. Code: [paste code] Error: [paste error]`,
  33: `Write a short WhatsApp offer message for [product/service]. Include a first-line hook, offer details, who it is for, one trust reason, a soft CTA, and keep it under 70 words.`,
  34: `Give 25 brand name ideas for [business type]. Make them easy to pronounce for Tamil-speaking audiences, memorable, premium-feeling, and suitable for social media handles. Add a short meaning for each name.`,
  35: `Write 5 Facebook ad copy variations for [offer]. Use five different angles: savings, trust, urgency, local pride, and problem-solution. Provide headline, primary text, and CTA separately.`,
  36: `Write a professional reply to this customer review. Include thanks, empathy, a clear next step, and a friendly brand voice. Do not sound defensive. Review: [paste review]`,
  37: `Write an SEO-friendly product description for [product]. Include one short intro, 5 benefits, who it is useful for, care/use instructions, natural keywords, and a final CTA.`,
  38: `Create a 30-day Instagram content calendar for [business type]. Mix Reels, carousels, stories, customer proof, education, and offer posts. Include a caption idea and visual idea for each day.`,
  39: `Write conversion-focused landing page copy for [service/product]. Include H1, subheading, 3 core benefits, proof points, process, pricing note, and CTA sections. Use a clear, simple, credible tone.`,
  40: `Create a [number]-day study plan for [exam/subject]. Include daily topics, revision blocks, practice questions, weak-area review, and a final 2-day strategy.`,
  41: `Turn the notes below into flashcards. Each card should include a question, short answer, and memory clue. Highlight important formulas or definitions separately. Notes: [paste notes]`,
  42: `Teach [English grammar/topic] to a Tamil-speaking student in easy English. Include a simple rule, Tamil comparison if useful, 10 examples, common mistakes, and 5 practice questions.`,
  43: `Summarize this transcript/lesson notes into clear revision notes. Include key ideas, definitions, examples, timeline/process, exam-important points, and 5 quiz questions. Content: [paste transcript]`,
  44: `Write a bedtime story for children aged 6–9 about [theme]. Use simple words, friendly characters, gentle humour, a clear moral, and keep it under 700 words.`,
  45: `Help me prepare for a [job role] interview. Give 15 common questions, strong sample answers, simple explanations, the STAR method, 5 questions I can ask the interviewer, and a final checklist.`,
  46: `Write 25 YouTube Shorts hooks for [topic]. Mix curiosity, mistake, myth, checklist, story, and challenge angles. Keep every hook under 12 words.`,
  47: `Write a 45-second voiceover script for [video topic]. Use a warm spoken tone, short sentences, scene-by-scene pacing, an emotional ending, and a clear CTA.`,
  48: `Give 30 faceless Instagram Reel ideas for [niche]. For each idea, include a hook, visual footage idea, voiceover angle, and CTA. Make it relatable for a Tamil audience.`,
  49: `Write a 60-second podcast clip script for [podcast topic]. Include a strong opening opinion, one story/example, a crisp insight, a share-worthy closing line, and a caption suggestion.`,
  50: `Explain this code line by line. Start with the overall purpose, then explain important functions, data flow, possible bugs, and a beginner-friendly summary. Code: [paste code]`,
  51: `Create a technical build plan for [app idea]. Include user flows, screens, database tables, API endpoints, MVP scope, tech stack, and a 2-week execution plan.`,
  52: `Write a SQL query for this requirement. Include table assumptions, expected output, edge cases, performance/index suggestions, and a simple explanation. Requirement: [describe] Schema: [paste schema]`,
  53: `Turn this website/app bug into a developer-ready bug report. Include title, steps to reproduce, expected result, actual result, device/browser, severity, screenshots needed, and possible cause. Bug: [describe]`,
  54: `Write documentation for this API endpoint. Include purpose, method, URL, headers, request body, response example, error cases, curl example, and a developer-friendly explanation. API: [paste details]`,
  55: `Create an SEO blog outline for [keyword/topic]. Include search intent, title options, meta description, H2/H3 structure, FAQs as plain Q&A, internal link ideas, and CTA.`,
  56: `Create a comparison table for [our product] and [competitor]. Include features, pricing angle, ideal customer, strengths, weaknesses, positioning message, and a short sales summary. Avoid fake claims.`,
  57: `Create 20 multiple-choice quiz questions about [topic]. Each question should include 4 options, the correct answer, a short explanation, and difficulty level.`,
  58: `Create a 15-second video ad storyboard for [product/service]. Give it in table format with scene time, visual, voiceover, on-screen text, sound cue, and CTA.`,
  59: `Give 20 marketing campaign ideas for [business type] during [festival]. Include offer angle, social post idea, WhatsApp message, reel idea, and customer engagement activity.`,
  60: `Write a founder bio based on [founder details] in both English and Tamil. Include a short version, website version, LinkedIn version, warm professional tone, and credibility points.`,
};

function getPromptText(id: number, prompt: string, language: Language) {
  return language === 'en' ? englishPromptById[id] ?? prompt : prompt;
}

function getTrendHeat(id: number) {
  return trendHeatById[id] ?? '19K';
}

function getTrendType(category: Exclude<Category, 'all'>, language: Language) {
  if (category === 'image') {
    return language === 'ta' ? 'படம்' : 'Image';
  }

  if (category === 'video') {
    return language === 'ta' ? 'வீடியோ' : 'Video';
  }

  return language === 'ta' ? 'வணிகம்' : 'Business';
}

const text = {
  ta: {
    navTrending: 'ட்ரெண்டிங்',
    navImages: 'படங்கள்',
    navVideos: 'வீடியோக்கள்',
    navSectors: 'Business & Creators',
    navHashtags: 'Hashtags',
    navProfile: 'Profile Check',
    navTips: 'AI Tips',
    kicker: 'தமிழர்களுக்கான AI Trend Hub',
    heading: 'ட்ரெண்ட் ஆகும் முன்பே உருவாக்குங்கள்.',
    subheading: 'வைரல் படங்கள், வீடியோக்கள், AI tips, useful tools மற்றும் creator/business வேலைகளுக்கான 40+ copy-ready prompts — அனைத்தும் தமிழில்.',
    search: '80s படம், cinematic video என தேடுங்கள்…',
    trending: 'இப்போது ட்ரெண்டிங்கில்',
    updated: 'தினமும் புதுப்பிக்கப்படுகிறது',
    copy: 'Prompt-ஐ நகலெடு',
    copied: 'நகலெடுக்கப்பட்டது',
    photo: 'உங்கள் படம் தேவை',
    sectors: 'Business & Creator Prompts',
    sectorsDesc: 'உங்கள் content, captions, reels, ads, offers மற்றும் brand வேலைகளுக்கு நேரத்தை சேமியுங்கள்.',
    tips: 'AI Tips & Tricks',
    tipsDesc: 'ஒரே prompt-ஐ copy செய்வதற்குப் பதிலாக, நல்ல output வர எப்படி மாற்றுவது என்பதை கற்றுக்கொள்ளுங்கள்.',
    tools: 'Popular AI tools',
    toolsDesc: 'Image, video, captions, design வேலைகளுக்கு creators அதிகம் பயன்படுத்தும் AI websites.',
    empty: 'இந்த தேடலுக்கு prompt கிடைக்கவில்லை.',
    clear: 'அனைத்தையும் பார்க்க',
    home: 'ட்ரெண்ட்',
    saved: 'சேமித்தவை',
  },
  en: {
    navTrending: 'Trending',
    navImages: 'Images',
    navVideos: 'Videos',
    navSectors: 'Business & Creators',
    navHashtags: 'Hashtags',
    navProfile: 'Profile Check',
    navTips: 'AI Tips',
    kicker: 'The AI trend hub for Tamil creators',
    heading: 'Create it before the trend moves on.',
    subheading: '40+ copy-ready Tamil prompts plus AI tips and useful tools for viral images, videos, creators, and business work.',
    search: 'Search 80s photo, cinematic video…',
    trending: 'Trending right now',
    updated: 'Updated every day',
    copy: 'Copy prompt',
    copied: 'Copied',
    photo: 'Your photo needed',
    sectors: 'Business and creator prompts',
    sectorsDesc: 'Save time on content, captions, reels, ads, offers, and brand work.',
    tips: 'AI tips & tricks',
    tipsDesc: 'Go beyond copy-paste prompts and learn how to adjust them for better results.',
    tools: 'Popular AI tools',
    toolsDesc: 'Useful AI websites creators use for image, video, captions, and design workflows.',
    empty: 'No prompt matches this search.',
    clear: 'View all',
    home: 'Trends',
    saved: 'Saved',
  },
};

export default function HomePage() {
  const [language, setLanguage] = useState<Language>('ta');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const t = text[language];

  useEffect(() => {
    window.setTimeout(() => {
      const saved = window.localStorage.getItem('tamilai-saved-prompts');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setSavedIds(parsed.filter((id): id is number => typeof id === 'number'));
          }
        } catch {
          window.localStorage.removeItem('tamilai-saved-prompts');
        }
      }
      setSavedLoaded(true);
    }, 0);
  }, []);

  useEffect(() => {
    if (savedLoaded) {
      window.localStorage.setItem('tamilai-saved-prompts', JSON.stringify(savedIds));
    }
  }, [savedIds, savedLoaded]);

  const visibleTrends = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return trends.filter((item) => {
      const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
      const savedMatch = !showSaved || savedIds.includes(item.id);
      const searchMatch =
        !term ||
        `${item.titleTa} ${item.titleEn} ${item.descriptionTa} ${item.descriptionEn} ${item.prompt} ${englishPromptById[item.id] ?? ''} ${item.models.join(' ')}`
          .toLocaleLowerCase()
          .includes(term);
      return categoryMatch && savedMatch && searchMatch;
    });
  }, [activeCategory, query, savedIds, showSaved]);

  const visibleSectors = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return sectorPrompts.filter((item) => {
      if (item.category === 'education' || item.category === 'coding') {
        return false;
      }

      const categoryMatch = activeCategory === 'all' || item.category === activeCategory;
      const savedMatch = !showSaved || savedIds.includes(item.id);
      const searchMatch = !term || `${item.titleTa} ${item.titleEn} ${item.descriptionTa} ${item.descriptionEn} ${item.prompt} ${englishPromptById[item.id] ?? ''}`.toLocaleLowerCase().includes(term);
      return categoryMatch && savedMatch && searchMatch;
    });
  }, [activeCategory, query, savedIds, showSaved]);

  async function copyPrompt(id: number, prompt: string) {
    await navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1800);
  }

  function toggleSaved(id: number) {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((savedId) => savedId !== id) : [...current, id],
    );
  }

  function selectCategory(category: Category) {
    setActiveCategory(category);
    setShowSaved(false);
    setMobileMenuOpen(false);
    document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetFilters() {
    setActiveCategory('all');
    setShowSaved(false);
    setQuery('');
    setMobileMenuOpen(false);
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <a href="#library" className="sr-only z-[100] bg-primary px-4 py-3 text-primary-foreground focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to prompts
      </a>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <button type="button" onClick={resetFilters} className="flex min-h-11 cursor-pointer items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Sparkles className="size-5" aria-hidden="true" />
            </span>
            <span className="font-heading text-[17px] font-bold tracking-tight">TamilAI<span className="text-primary">Prompt</span></span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground lg:flex" aria-label="Primary navigation">
            <button type="button" onClick={() => selectCategory('all')} className="cursor-pointer transition-colors hover:text-foreground">{t.navTrending}</button>
            <button type="button" onClick={() => selectCategory('image')} className="cursor-pointer transition-colors hover:text-foreground">{t.navImages}</button>
            <button type="button" onClick={() => selectCategory('video')} className="cursor-pointer transition-colors hover:text-foreground">{t.navVideos}</button>
            <a href="#sectors" className="transition-colors hover:text-foreground">{t.navSectors}</a>
            <Link href="/hashtags" className="transition-colors hover:text-foreground">{t.navHashtags}</Link>
            <Link href="/instagram-profile-checker" className="transition-colors hover:text-foreground">{t.navProfile}</Link>
            <a href="#tips" className="transition-colors hover:text-foreground">{t.navTips}</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="h-11 cursor-pointer rounded-xl px-3 text-sm"
              onClick={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
              aria-label={language === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாற்றவும்'}
            >
              <Languages className="size-4" aria-hidden="true" />
              {language === 'ta' ? 'தமிழ்' : 'EN'}
            </Button>
            <Button
              variant="outline"
              className="h-11 cursor-pointer rounded-xl px-3 lg:hidden"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
            </Button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <div id="mobile-menu" className="border-t border-border bg-background/98 px-4 py-3 shadow-[0_18px_40px_-30px_oklch(0.2_0.04_300/.6)] lg:hidden">
            <div className="grid gap-2">
              {filters.map((filter) => {
                const Icon = filter.icon;
                const selected = activeCategory === filter.id && !showSaved;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => selectCategory(filter.id)}
                    aria-pressed={selected}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl border px-4 text-left text-sm font-bold transition-colors ${
                      selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground'
                    }`}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {filter[language]}
                  </button>
                );
              })}
              <Link
                href="/hashtags"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 text-sm font-bold text-primary"
              >
                <Hash className="size-4" aria-hidden="true" />
                Hashtags
              </Link>
              <Link
                href="/instagram-profile-checker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-12 items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 text-sm font-bold text-primary"
              >
                <TrendingUp className="size-4" aria-hidden="true" />
                {t.navProfile}
              </Link>
              <a href="#tips" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-card px-4 text-sm font-bold text-muted-foreground">
                <Lightbulb className="size-4" aria-hidden="true" />
                {t.navTips}
              </a>
            </div>
          </div>
        ) : null}
      </header>

      <section className="relative overflow-hidden border-b border-border/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,oklch(0.89_0.09_305/.58),transparent_28%),radial-gradient(circle_at_85%_45%,oklch(0.93_0.06_190/.48),transparent_25%)]" />
        <div className="relative mx-auto max-w-5xl px-4 py-11 text-center sm:px-6 sm:py-16 lg:py-20">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/75 px-3 py-1.5 text-xs font-bold text-primary shadow-sm backdrop-blur">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-70 motion-reduce:animate-none" />
              <span className="relative inline-flex size-2 rounded-full bg-accent" />
            </span>
            {t.kicker}
          </div>
          <h1 className="font-heading text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            {t.heading}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">{t.subheading}</p>

          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border bg-card p-2 shadow-[0_16px_50px_-22px_oklch(0.45_0.2_305/.45)]">
            <label htmlFor="prompt-search" className="sr-only">{t.search}</label>
            <div className="flex items-center gap-2">
              <Search className="ml-3 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <Input
                id="prompt-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.search}
                className="h-12 border-0 bg-transparent px-1 text-base shadow-none focus-visible:ring-0"
              />
              <Button className="hidden h-11 cursor-pointer rounded-xl px-5 sm:inline-flex" onClick={() => document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth' })}>
                <Search className="size-4" aria-hidden="true" />
                {language === 'ta' ? 'தேடுக' : 'Search'}
              </Button>
            </div>
          </div>

          <div className="mx-auto mt-3 flex max-w-4xl snap-x gap-2 overflow-x-auto pb-2 sm:flex-wrap sm:justify-center" aria-label="Popular Tamil AI prompt searches">
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  setShowSaved(false);
                  document.querySelector('#library')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="min-h-9 shrink-0 snap-start cursor-pointer rounded-full border border-border bg-white/70 px-3 text-xs font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/30 hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      <AdsenseSlot name="home-top" className="py-6" />

      <section id="library" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">
              <TrendingUp className="size-4" aria-hidden="true" />
              {t.updated}
            </div>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{showSaved ? t.saved : t.trending}</h2>
          </div>
          {(query || activeCategory !== 'all' || showSaved) && (
            <Button variant="ghost" className="h-11 cursor-pointer rounded-xl text-primary" onClick={resetFilters}>{t.clear}</Button>
          )}
        </div>

        {visibleTrends.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {visibleTrends.map((item) => {
              const copied = copiedId === item.id;
              const saved = savedIds.includes(item.id);
              return (
                <article key={item.id} className={`group overflow-hidden rounded-3xl border border-border bg-card shadow-[0_10px_36px_-24px_oklch(0.25_0.08_300/.45)] transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-[0_20px_55px_-28px_oklch(0.45_0.18_305/.48)] ${item.featured ? 'md:col-span-2 xl:col-span-2' : ''}`}>
                  <TrendPreview
                    item={item}
                    language={language}
                    saved={saved}
                    onToggleSaved={() => toggleSaved(item.id)}
                  />

                  <div className="flex min-h-[260px] flex-col p-5">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{language === 'ta' ? item.updatedTa : item.updatedEn}</span>
                      {item.needsPhoto && <span className="rounded-full bg-secondary px-2 py-1 font-semibold text-secondary-foreground">{t.photo}</span>}
                    </div>
                    <h3 className="mt-3 font-heading text-xl font-bold leading-snug tracking-tight">{language === 'ta' ? item.titleTa : item.titleEn}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{language === 'ta' ? item.descriptionTa : item.descriptionEn}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {item.models.map((model) => <span key={model} className="rounded-md border border-border bg-muted px-2 py-1 text-[11px] font-semibold text-muted-foreground">{model}</span>)}
                    </div>
                    <Button className="mt-auto h-11 w-full cursor-pointer rounded-xl" onClick={() => copyPrompt(item.id, getPromptText(item.id, item.prompt, language))} aria-live="polite">
                      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                      {copied ? t.copied : t.copy}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-muted/45 px-5 py-14 text-center text-muted-foreground">
            <Search className="mx-auto mb-3 size-7" aria-hidden="true" />
            <p>{t.empty}</p>
            <Button variant="outline" className="mt-5 h-11 cursor-pointer rounded-xl" onClick={resetFilters}>{t.clear}</Button>
          </div>
        )}
      </section>

      <AdsenseSlot name="home-mid" className="pb-10" />

      {(visibleSectors.length > 0 || (!query && activeCategory === 'all' && !showSaved)) && (
        <section id="sectors" className="border-y border-border bg-card/55 py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-7 max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Work smarter</p>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{t.sectors}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{t.sectorsDesc}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {visibleSectors.map((item) => {
                const Icon = item.icon;
                const copied = copiedId === item.id;
                const saved = savedIds.includes(item.id);
                return (
                  <article key={item.id} className="flex min-h-[300px] flex-col rounded-2xl border border-border bg-card p-5 shadow-[0_8px_28px_-24px_oklch(0.2_0.04_300/.35)]">
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid size-11 place-items-center rounded-xl bg-secondary text-secondary-foreground"><Icon className="size-5" aria-hidden="true" /></span>
                      <button type="button" onClick={() => toggleSaved(item.id)} aria-label={saved ? 'Remove saved prompt' : 'Save prompt'} aria-pressed={saved} className="grid size-11 cursor-pointer place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40">
                        <Bookmark className={`size-4 ${saved ? 'fill-current text-primary' : ''}`} aria-hidden="true" />
                      </button>
                    </div>
                    <h3 className="mt-5 font-heading text-lg font-bold leading-snug">{language === 'ta' ? item.titleTa : item.titleEn}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{language === 'ta' ? item.descriptionTa : item.descriptionEn}</p>
                    <Button variant="outline" className="mt-auto h-11 w-full cursor-pointer rounded-xl border-primary/20 text-primary hover:bg-secondary" onClick={() => copyPrompt(item.id, getPromptText(item.id, item.prompt, language))}>
                      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
                      {copied ? t.copied : t.copy}
                    </Button>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section id="seo-guides" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="mb-7 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">SEO prompt guides</p>
          <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {language === 'ta' ? 'ட்ரெண்டிங் Prompt Guides' : 'Trending prompt guides'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            {language === 'ta'
              ? 'ஒவ்வொரு trend-க்கும் தனி page: Tamil prompt, English prompt, tips, mistakes, tools.'
              : 'Dedicated pages for each trend: Tamil prompt, English prompt, tips, mistakes, and tools.'}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Link
            href="/hashtags"
            className="group rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-[0_8px_28px_-24px_oklch(0.2_0.04_300/.35)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/45"
          >
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">Hashtags</p>
            <h3 className="mt-2 font-heading text-base font-bold leading-snug">30 Social Hashtag Sets</h3>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
              Copy-ready hashtags for Instagram, TikTok, YouTube Shorts, business, festival and AI trends.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
              {language === 'ta' ? 'Hashtags பார்க்க' : 'Open hashtags'}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
          <Link
            href="/instagram-profile-checker"
            className="group rounded-2xl border border-primary/25 bg-primary/5 p-4 shadow-[0_8px_28px_-24px_oklch(0.2_0.04_300/.35)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/45"
          >
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">Creator tool</p>
            <h3 className="mt-2 font-heading text-base font-bold leading-snug">Instagram Profile Checker</h3>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">
              Score your bio, niche, hooks, engagement and content consistency with instant suggestions.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
              {language === 'ta' ? 'Profile check செய்ய' : 'Check profile'}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          </Link>
          {promptLandingPages.map((page) => (
            <Link
              key={page.slug}
              href={`/prompts/${page.slug}`}
              className="group rounded-2xl border border-border bg-card p-4 shadow-[0_8px_28px_-24px_oklch(0.2_0.04_300/.35)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/35"
            >
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">Guide</p>
              <h3 className="mt-2 font-heading text-base font-bold leading-snug">{page.shortTitle}</h3>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted-foreground">{page.metaDescription}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary">
                {language === 'ta' ? 'பார்க்க' : 'Read guide'}
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="tips" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">Prompt mastery</p>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{t.tips}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">{t.tipsDesc}</p>
            <div className="mt-5 rounded-2xl border border-primary/15 bg-secondary/75 p-5 text-sm leading-6 text-secondary-foreground">
              {language === 'ta'
                ? 'Tip: ஒரு நல்ல AI prompt = subject + action + style + camera/light + output ratio + avoid mistakes.'
                : 'Tip: A strong AI prompt = subject + action + style + camera/light + output ratio + avoid mistakes.'}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {aiTips.map((tip) => (
              <article key={tip.titleEn} className="rounded-2xl border border-border bg-card p-5 shadow-[0_8px_28px_-24px_oklch(0.2_0.04_300/.35)]">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Lightbulb className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-heading text-lg font-bold leading-snug">
                  {language === 'ta' ? tip.titleTa : tip.titleEn}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {language === 'ta' ? tip.bodyTa : tip.bodyEn}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="tools" className="border-y border-border bg-muted/45 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-7 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-primary">AI websites</p>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">{t.tools}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{t.toolsDesc}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {aiTools.map((tool) => (
              <a
                key={tool.name}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-2xl border border-border bg-card p-5 shadow-[0_8px_28px_-24px_oklch(0.2_0.04_300/.35)] transition-[border-color,transform] hover:-translate-y-0.5 hover:border-primary/35 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-primary">{tool.category}</p>
                    <h3 className="mt-2 font-heading text-xl font-bold tracking-tight">{tool.name}</h3>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {language === 'ta' ? tool.descriptionTa : tool.descriptionEn}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-3xl bg-foreground px-6 py-9 text-background sm:px-10 sm:py-11">
          <div className="grid items-center gap-7 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-bold text-accent">TamilAI Prompt</p>
              <h2 className="mt-2 max-w-2xl font-heading text-2xl font-bold tracking-tight sm:text-3xl">
                {language === 'ta' ? 'ஒரு trend-ஐ தவறவிடாதீர்கள்.' : 'Never miss the next trend.'}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-background/70">
                {language === 'ta' ? 'தமிழ் creators-க்காக தேர்ந்தெடுக்கப்பட்ட புதிய prompts தினமும்.' : 'Fresh prompts selected daily for Tamil creators.'}
              </p>
            </div>
            <Button className="h-12 cursor-pointer rounded-xl bg-background px-5 text-foreground hover:bg-background/90" onClick={() => { resetFilters(); document.querySelector<HTMLInputElement>('#prompt-search')?.focus(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
              {language === 'ta' ? 'Prompts தேடுங்கள்' : 'Explore prompts'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>© 2026 TamilAI Prompt · தமிழர்களால், தமிழர்களுக்காக.</p>
        <nav className="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2" aria-label="Footer navigation">
          <Link href="/about" className="hover:text-primary hover:underline">About</Link>
          <Link href="/hashtags" className="hover:text-primary hover:underline">Hashtags</Link>
          <Link href="/instagram-profile-checker" className="hover:text-primary hover:underline">Profile Checker</Link>
          <Link href="/contact" className="hover:text-primary hover:underline">Contact</Link>
          <Link href="/privacy" className="hover:text-primary hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-primary hover:underline">Terms</Link>
        </nav>
      </footer>

    </main>
  );
}

function TrendPreview({
  item,
  language,
  saved,
  onToggleSaved,
}: {
  item: TrendPrompt;
  language: Language;
  saved: boolean;
  onToggleSaved: () => void;
}) {
  const theme = trendVisualThemes[item.id] ?? {
    bg: '#4c1d95',
    accent: '#c4b5fd',
    sceneTa: 'AI Trend',
    sceneEn: 'AI Trend',
  };
  return (
    <div
      className={`relative overflow-hidden bg-slate-950 ${item.featured ? 'aspect-[16/9]' : 'aspect-[4/3]'}`}
      aria-label={item.imageAlt}
      style={{ backgroundColor: theme.bg }}
    >
      <NextImage
        src={`/trends/generated/trend-${item.id}.jpg`}
        alt=""
        fill
        sizes={item.featured ? '(min-width: 1280px) 50vw, (min-width: 768px) 100vw, 100vw' : '(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw'}
        className="object-cover transition-transform duration-700 motion-safe:group-hover:scale-105"
        priority={item.featured}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white/.18,transparent_24%),linear-gradient(to_bottom,black/.08,transparent_45%,black/.34)]" aria-hidden="true" />
      <div className="absolute left-3 right-16 top-3 flex flex-wrap gap-2">
        <span className="inline-flex min-h-8 items-center rounded-full border border-white/25 bg-foreground/82 px-3 text-xs font-extrabold text-white shadow-sm backdrop-blur">
          {language === 'ta' ? 'ட்ரெண்டிங்' : 'Trending'}
        </span>
        <span className="inline-flex min-h-8 items-center rounded-full border border-white/25 bg-white/88 px-3 text-xs font-extrabold text-foreground shadow-sm backdrop-blur">
          {getTrendType(item.category, language)}
        </span>
      </div>
      <div className="absolute right-3 top-3">
        <button type="button" onClick={onToggleSaved} aria-label={saved ? 'Remove saved prompt' : 'Save prompt'} aria-pressed={saved} className={`grid size-11 cursor-pointer place-items-center rounded-full border border-white/30 bg-foreground/72 text-white shadow-sm backdrop-blur transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/70 ${saved ? 'bg-primary' : 'hover:bg-foreground/90'}`}>
          <Bookmark className={`size-4 ${saved ? 'fill-current' : ''}`} aria-hidden="true" />
        </button>
      </div>
      <div className="absolute bottom-3 left-3">
        <span className="inline-flex min-h-8 items-center rounded-full border border-white/25 bg-black/52 px-3 text-xs font-extrabold text-white shadow-sm backdrop-blur">
          🔥 {getTrendHeat(item.id)}
        </span>
      </div>
    </div>
  );
}
