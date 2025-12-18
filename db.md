# Database Schema

## Tables

### `experiences`
*Stores details about available experiences.*

| Column | Type | Nullable | Default | Options |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `text` | NO | - | `updatable`, `PK` |
| `name` | `text` | NO | - | `updatable` |
| `description` | `text` | YES | - | `updatable` |
| `max_capacity` | `integer` | NO | - | `updatable` |
| `duration_minutes` | `integer` | NO | - | `updatable` |
| `offset_minutes` | `integer` | NO | - | `updatable` |
| `color` | `text` | YES | - | `updatable` |
| `is_active` | `boolean` | YES | `true` | `updatable` |
| `start_date` | `text` | YES | - | `updatable` |
| `end_date` | `text` | YES | - | `updatable` |
| `time_intervals` | `jsonb` | YES | - | `updatable` |
| `created_at` | `timestamptz` | YES | `now()` | `updatable` |

### `bookings`
*Stores customer bookings.*

| Column | Type | Nullable | Default | Options |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `text` | NO | - | `updatable`, `PK` |
| `slot_id` | `text` | NO | - | `updatable` |
| `experience_id` | `text` | YES | - | `updatable`, `FK` |
| `date` | `text` | NO | - | `updatable` |
| `time` | `text` | NO | - | `updatable` |
| `pax` | `integer` | NO | - | `updatable` |
| `original_pax` | `integer` | YES | - | `updatable` |
| `visitor_name` | `text` | NO | - | `updatable` |
| `visitor_email` | `text` | YES | - | `updatable` |
| `attendee_names` | `jsonb` | YES | - | `updatable` |
| `checked_in` | `boolean` | YES | `false` | `updatable` |
| `created_at` | `timestamptz` | YES | `now()` | `updatable` |
| `reference_code` | `text` | YES | - | `updatable` |

### `day_overrides`
*Overrides availability for specific days.*

| Column | Type | Nullable | Default | Options |
| :--- | :--- | :--- | :--- | :--- |
| `date` | `text` | NO | - | `updatable`, `PK` |
| `is_closed` | `boolean` | YES | `false` | `updatable` |
| `override_hours` | `jsonb` | YES | - | `updatable` |
| `created_at` | `timestamptz` | YES | `now()` | `updatable` |

### `access_control`
*User authentication and roles.*

| Column | Type | Nullable | Default | Options |
| :--- | :--- | :--- | :--- | :--- |
| `username` | `text` | NO | - | `updatable`, `PK` |
| `password` | `text` | NO | - | `updatable` |
| `role` | `text` | NO | - | `updatable`, `CHECK` (ADMIN, STAFF) |
| `created_at` | `timestamptz` | YES | `now()` | `updatable` |

### `app_user_roles`
*Roles linked to auth.users.*

| Column | Type | Nullable | Default | Options |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | - | `updatable`, `PK`, `FK` |
| `role` | `text` | NO | - | `updatable`, `CHECK` (ADMIN, STAFF) |
| `is_active` | `boolean` | NO | `true` | `updatable` |
| `created_at` | `timestamptz` | NO | `now()` | `updatable` |

### `experience_slots`
*Generated slots for experiences.*

| Column | Type | Nullable | Default | Options |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `text` | NO | - | `updatable`, `PK` |
| `experience_id` | `text` | NO | - | `updatable` |
| `slot_date` | `date` | NO | - | `updatable` |
| `start_time` | `time` | NO | - | `updatable` |
| `end_time` | `time` | NO | - | `updatable` |
| `created_at` | `timestamptz` | NO | `now()` | `updatable` |

---

## Indexes

| Table | Index Name | Definition |
| :--- | :--- | :--- |
| `access_control` | `access_control_pkey` | `CREATE UNIQUE INDEX access_control_pkey ON public.access_control USING btree (username)` |
| `app_user_roles` | `app_user_roles_pkey` | `CREATE UNIQUE INDEX app_user_roles_pkey ON public.app_user_roles USING btree (id)` |
| `bookings` | `bookings_date_idx` | `CREATE INDEX bookings_date_idx ON public.bookings USING btree (date)` |
| `bookings` | `bookings_exp_date_idx` | `CREATE INDEX bookings_exp_date_idx ON public.bookings USING btree (experience_id, date)` |
| `bookings` | `bookings_pkey` | `CREATE UNIQUE INDEX bookings_pkey ON public.bookings USING btree (id)` |
| `bookings` | `bookings_ref_code_idx` | `CREATE INDEX bookings_ref_code_idx ON public.bookings USING btree (reference_code)` |
| `bookings` | `bookings_reference_code_key` | `CREATE UNIQUE INDEX bookings_reference_code_key ON public.bookings USING btree (reference_code)` |
| `bookings` | `bookings_slot_id_idx` | `CREATE INDEX bookings_slot_id_idx ON public.bookings USING btree (slot_id)` |
| `experience_slots` | `experience_slots_exp_date_idx` | `CREATE INDEX experience_slots_exp_date_idx ON public.experience_slots USING btree (experience_id, slot_date)` |
| `experience_slots` | `experience_slots_experience_id_slot_date_start_time_key` | `CREATE UNIQUE INDEX experience_slots_experience_id_slot_date_start_time_key ON public.experience_slots USING btree (experience_id, slot_date, start_time)` |
| `experience_slots` | `experience_slots_lookup` | `CREATE INDEX experience_slots_lookup ON public.experience_slots USING btree (experience_id, slot_date, start_time)` |
| `experience_slots` | `experience_slots_pkey` | `CREATE UNIQUE INDEX experience_slots_pkey ON public.experience_slots USING btree (id)` |
| `experiences` | `experiences_pkey` | `CREATE UNIQUE INDEX experiences_pkey ON public.experiences USING btree (id)` |
| `schedules` | `schedules_pkey` | `CREATE UNIQUE INDEX schedules_pkey ON public.schedules USING btree (date)` |

---

## RLS Policies

Row Level Security is enabled for the following tables.

### `experiences`
| Policy Name | Operation | Roles | Using (Qual) | With Check |
| :--- | :--- | :--- | :--- | :--- |
| Public modify experiences | ALL | anon, authenticated | `true` | `true` |
| Public read experiences | SELECT | anon, authenticated | `true` | - |

### `bookings`
| Policy Name | Operation | Roles | Using (Qual) | With Check |
| :--- | :--- | :--- | :--- | :--- |
| Enable insert for all users | INSERT | anon, authenticated | - | `true` |
| Enable read access for all users | SELECT | anon, authenticated | `true` | - |
| Enable update for all users | UPDATE | anon, authenticated | `true` | - |

### `schedules`
| Policy Name | Operation | Roles | Using (Qual) | With Check |
| :--- | :--- | :--- | :--- | :--- |
| Public access schedules | ALL | anon, authenticated | `true` | `true` |

### `app_user_roles`
| Policy Name | Operation | Roles | Using (Qual) | With Check |
| :--- | :--- | :--- | :--- | :--- |
| read own role | SELECT | authenticated | `(id = auth.uid())` | - |

---

## Functions

### `reset_bookings`
*Deletes all bookings.*
```sql
CREATE OR REPLACE FUNCTION public.reset_bookings()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  delete from public.bookings;
end;
$function$
```

### `rebuild_experience_slots`
*Rebuilds slots for a specific experience based on its configuration.*
```sql
CREATE OR REPLACE FUNCTION public.rebuild_experience_slots(p_experience_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  exp record;
  d date;
  intr jsonb;
  st time;
  et time;
  cur time;
  dur interval;
  step interval;
begin
  select *
    into exp
  from public.experiences
  where id = p_experience_id
  limit 1;

  if not found then
    raise exception 'Experience not found: %', p_experience_id;
  end if;

  -- If inactive, wipe slots and exit
  if coalesce(exp.is_active, false) = false then
    delete from public.experience_slots
    where experience_id = p_experience_id;
    return;
  end if;

  dur  := make_interval(mins => exp.duration_minutes);
  step := make_interval(mins => exp.duration_minutes + exp.offset_minutes);

  -- Delete future slots (but keep slots that already have bookings)
  delete from public.experience_slots es
  where es.experience_id = p_experience_id
    and es.slot_date >= current_date
    and not exists (
      select 1
      from public.bookings b
      where b.slot_id = es.id
    );

  -- Rebuild from today -> end_date (or today -> start_date if end_date null)
  for d in
    select generate_series(
      greatest(current_date, coalesce(exp.start_date::date, current_date)),
      coalesce(exp.end_date::date, (current_date + interval '1 year')::date),
      '1 day'
    )::date
  loop
    -- For each date, check time_intervals
    -- time_intervals is e.g. [{"start": "09:00", "end": "17:00"}]
    if exp.time_intervals is not null then
      for intr in select * from jsonb_array_elements(exp.time_intervals)
      loop
        st := (intr->>'start')::time;
        et := (intr->>'end')::time;
        cur := st;

        while cur + dur <= et loop
          -- Insert slot if not exists
          insert into public.experience_slots (id, experience_id, slot_date, start_time, end_time)
          values (
            md5(p_experience_id || d::text || cur::text), -- deterministic ID
            p_experience_id,
            d,
            cur,
            cur + dur
          )
          on conflict (id) do nothing;

          cur := cur + step;
        end loop;
      end loop;
    end if;
  end loop;
end;
$function$
```

### `create_booking_atomic`
*Atomically creates a booking, checking for capacity.*
```sql
CREATE OR REPLACE FUNCTION public.create_booking_atomic(input_booking_id text, input_slot_id text, input_experience_id text, input_date text, input_time text, input_pax integer, input_visitor_name text, input_visitor_email text, input_attendee_names jsonb, input_reference_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
declare
  cap int;
  booked int;
begin
  -- Lock the slot to prevent race conditions
  -- We perform an advisory lock based on the slot_id hash
  -- (simple integer mapping) to parse concurrency for *this* slot
  -- Note: This is an optimistic lock, adequate given low collision prob or retry logic likely
  -- OR we can lock the experience row, but that blocks ALL bookings for this experience.
  -- Better: Lock based on slot_id string hash.
  -- Using pg_advisory_xact_lock ensures lock is released at end of transaction
  
  -- We'll use a unique key based on the slot_id hash to serialize requests for the same slot
  -- IMPORTANT: This assumes the calling code handles retries if needed, 
  -- but actually this lock waits, so it just serializes.
  
  -- Ideally slot_id is sufficient.
  -- Cast hash to big int? pg_advisory_xact_lock takes bigint or (int, int).
  
  -- Let's just lock the experience_slots row if it exists? 
  -- Actually, slot might likely exist. 
  
  -- Let's stick to simple logic: lock the master table or advisory lock.
  -- Advisory lock on slot_id hash is good.
  
  -- We use hashtext(input_slot_id) which returns integer.
  -- pg_advisory_xact_lock(int)
  
  -- Wait for lock
  perform pg_advisory_xact_lock(hashtext(input_slot_id));

  select max_capacity
    into cap
  from public.experiences
  where id = input_experience_id
    and is_active = true
  limit 1;

  if cap is null then
    return jsonb_build_object('success', false, 'error', 'Experience not found or inactive');
  end if;

  select coalesce(sum(pax), 0)
    into booked
  from public.bookings
  where slot_id = input_slot_id;

  if booked + input_pax > cap then
    return jsonb_build_object(
      'success', false,
      'error', 'Slot full',
      'remaining', greatest(cap - booked, 0)
    );
  end if;

  insert into public.bookings (
    id, slot_id, experience_id, date, time, pax, original_pax,
    visitor_name, visitor_email, attendee_names, reference_code, checked_in
  ) values (
    input_booking_id, input_slot_id, input_experience_id, input_date, input_time,
    input_pax, input_pax,
    input_visitor_name, input_visitor_email, input_attendee_names,
    input_reference_code, false
  );

  return jsonb_build_object(
    'success', true,
    'booking', jsonb_build_object(
      'id', input_booking_id,
      'slotId', input_slot_id,
      'experienceId', input_experience_id,
      'date', input_date,
      'time', input_time,
      'pax', input_pax,
      'originalPax', input_pax,
      'visitorName', input_visitor_name,
      'visitorEmail', input_visitor_email,
      'attendeeNames', input_attendee_names,
      'referenceCode', input_reference_code,
      'checkedIn', false
    )
  );
end;
$function$
```

---

## Extensions

The following extensions are installed in the database:

- **pgcrypto** (v1.3): Cryptographic functions.

---

## Triggers

*No triggers found in the public schema.*

## Views

*No views found in the public schema.*
