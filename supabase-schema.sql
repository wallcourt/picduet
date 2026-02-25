-- PicDuet Database Schema
-- Run this in the Supabase SQL editor to set up your database

-- Generations table
create table generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  prompt text not null,
  model_a text not null,
  model_b text not null,
  image_a_url text,
  image_b_url text,
  selected_winner text, -- 'a' or 'b' or null
  parent_id uuid references generations(id), -- for refinement chains
  share_id text unique, -- nanoid for shareable links
  is_public boolean default false,
  created_at timestamptz default now()
);

-- RLS policies
alter table generations enable row level security;

create policy "Users can view own generations" on generations
  for select using (auth.uid() = user_id);

create policy "Users can insert own generations" on generations
  for insert with check (auth.uid() = user_id);

create policy "Users can update own generations" on generations
  for update using (auth.uid() = user_id);

create policy "Anyone can view public generations" on generations
  for select using (is_public = true);

-- Community votes table (anonymous voting on public duels)
create table community_votes (
  id uuid primary key default gen_random_uuid(),
  generation_id uuid not null references generations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  voted_for text not null check (voted_for in ('a', 'b')),
  fingerprint text, -- SHA-256(IP + User-Agent) for anon dedup
  created_at timestamptz default now(),
  unique(generation_id, fingerprint)
);

alter table community_votes enable row level security;

create policy "Anyone can insert community votes" on community_votes
  for insert with check (true);

create policy "Anyone can read community votes" on community_votes
  for select using (true);

create index idx_community_votes_generation on community_votes(generation_id);

-- Migration for existing databases:
-- alter table generations add column share_id text unique;
-- alter table generations add column is_public boolean default false;
-- create policy "Anyone can view public generations" on generations for select using (is_public = true);

-- Subscriptions table (Stripe billing)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text not null unique,
  stripe_price_id text not null,
  plan text not null check (plan in ('starter', 'pro', 'power')),
  status text not null default 'active'
    check (status in ('active', 'past_due', 'canceled', 'incomplete')),
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_subscriptions_user on subscriptions(user_id);
create index idx_subscriptions_stripe_sub on subscriptions(stripe_subscription_id);

-- RLS: users read own subscription, service role writes via webhook
alter table subscriptions enable row level security;
create policy "Users can read own subscription" on subscriptions
  for select using (auth.uid() = user_id);

-- Index for usage counting (generations by user + date)
create index idx_generations_user_created on generations(user_id, created_at);
