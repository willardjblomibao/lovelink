export type PartnerRole = 'boyfriend' | 'girlfriend';

export type MoodType = string;

export type EventType = 'anniversary' | 'birthday' | 'date' | 'reminder' | 'custom';

export interface AppUser {
  id: string;
  display_name: string;
  role: PartnerRole | null;
  avatar_url: string | null;
  couple_id: string | null;
  is_online: boolean;
  last_seen_at: string;
  created_at: string;
}

export interface Couple {
  id: string;
  invite_code: string;
  boyfriend_id: string | null;
  girlfriend_id: string | null;
  anniversary_date: string | null;
  daily_quote: string | null;
  daily_quote_date: string | null;
  created_at: string;
  connected_at: string | null;
}

export interface LoveNote {
  id: string;
  couple_id: string;
  sender_id: string;
  content: string;
  delivered_at: string | null;
  seen_at: string | null;
  reaction: string | null;
  created_at: string;
}

export interface TypingStatus {
  couple_id: string;
  user_id: string;
  is_typing: boolean;
  updated_at: string;
}

export interface Memory {
  id: string;
  couple_id: string;
  uploader_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  caption: string | null;
  taken_at: string | null;
  is_favorite: boolean;
  created_at: string;
}

export interface CoupleEvent {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  event_type: EventType;
  event_date: string;
  is_recurring_yearly: boolean;
  notes: string | null;
  created_at: string;
}

export interface Mood {
  id: string;
  couple_id: string;
  user_id: string;
  mood: MoodType;
  mood_emoji: string | null;
  note: string | null;
  created_at: string;
}

export interface BucketListItem {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  category: 'date_idea' | 'wishlist' | 'travel' | 'other';
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface LocketPhoto {
  id: string;
  couple_id: string;
  sender_id: string;
  photo_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
}

export interface Surprise {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  content: string;
  unlock_at: string;
  is_unlocked: boolean;
  opened_by: string | null;
  opened_at: string | null;
  created_at: string;
}

export interface StudySession {
  couple_id: string;
  active_user_ids: string[];
  timer_started_at: string | null;
  duration_minutes: number;
  is_break: boolean;
  updated_at: string;
}

export interface StudyTask {
  id: string;
  couple_id: string;
  created_by: string;
  title: string;
  is_done: boolean;
  created_at: string;
}

export interface PartnerLocation {
  couple_id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number | null;
  label: string | null;
  updated_at: string;
}

export const MOOD_META: Record<string, { emoji: string; label: string; support: string }> = {
  amazing: { emoji: '🤩', label: 'Amazing', support: "That's the glow I love to see. Keep shining." },
  happy: { emoji: '😊', label: 'Happy', support: 'Your happiness makes my whole day better.' },
  okay: { emoji: '🙂', label: 'Okay', support: "Steady days count too. I'm right here with you." },
  tired: { emoji: '😴', label: 'Tired', support: 'Go easy on yourself today. Rest — I’ve got you.' },
  stressed: { emoji: '😣', label: 'Stressed', support: "Breathe. We'll get through this together, one step at a time." },
  sad: { emoji: '😢', label: 'Sad', support: "I wish I could hug you right now. You're not alone." },
  sick: { emoji: '🤒', label: 'Sick', support: 'Please rest and drink water. Sending all my care your way.' },
  missing_you: { emoji: '🥺', label: 'Missing you', support: "I'm missing you right back, more than words can say." }
};

export const PRESET_MOODS = ['amazing', 'happy', 'okay', 'tired', 'stressed', 'sad', 'sick', 'missing_you'];

/** Returns the emoji + label to show for any mood — preset or custom. */
export function getMoodDisplay(mood: Mood): { emoji: string; label: string } {
  const preset = MOOD_META[mood.mood];
  if (preset) return { emoji: preset.emoji, label: preset.label };
  return { emoji: mood.mood_emoji || '💫', label: mood.mood };
}

/** Returns a supportive line for a partner's mood — a tailored one for presets, a warm generic one for custom moods. */
export function getMoodSupport(mood: Mood): string {
  return MOOD_META[mood.mood]?.support ?? "Thanks for sharing how you're feeling — I'm here with you.";
}
