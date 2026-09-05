-- =========================================================
-- LoveLink — Migration 5: custom moods
-- =========================================================

-- Let a mood carry its own emoji, so custom moods aren't tied to the preset list.
alter table public.moods add column if not exists mood_emoji text;

-- Loosen "mood" from the fixed enum to free text so people can type any
-- custom feeling, not just the eight presets.
alter table public.moods alter column mood type text using mood::text;

-- Backfill emojis for existing preset rows so old entries still render
-- the right icon under the new "always show mood_emoji" model.
update public.moods set mood_emoji = case mood
  when 'amazing' then '🤩'
  when 'happy' then '😊'
  when 'okay' then '🙂'
  when 'tired' then '😴'
  when 'stressed' then '😣'
  when 'sad' then '😢'
  when 'sick' then '🤒'
  when 'missing_you' then '🥺'
  else mood_emoji
end
where mood_emoji is null;
