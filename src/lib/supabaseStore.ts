import { getSupabaseClient } from './supabase.ts';

export async function supabaseInsertParticipant(data: {
  admissionNo?: string | null;
  fullName: string;
  photoUrl: string;
  classCode: string;
  categoryName: string;
  ownTopic?: string | null;
  shortDescription?: string | null;
  publicationStatus?: string;
  createdByEmail?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const row = {
      admission_no: data.admissionNo || null,
      full_name: data.fullName.trim(),
      photo_url: data.photoUrl.trim(),
      class_code: data.classCode,
      category_name: data.categoryName,
      own_topic: data.ownTopic?.trim() || null,
      short_description: data.shortDescription?.trim() || null,
      publication_status: data.publicationStatus || 'PUBLISHED',
      created_by_email: data.createdByEmail || 'nasirhussin12489@gmail.com',
      updated_at: new Date().toISOString(),
    };

    const res = await client.from('participants').insert(row).select().single();
    if (res.error) {
      console.warn('Supabase insert participant warning:', res.error.message);
      return null;
    }
    return res.data;
  } catch (err) {
    console.warn('Supabase insert participant error:', err);
    return null;
  }
}

export async function supabaseUpdateParticipant(
  id: number,
  data: {
    admissionNo?: string | null;
    fullName?: string;
    photoUrl?: string;
    classCode?: string;
    categoryName?: string;
    ownTopic?: string | null;
    shortDescription?: string | null;
    publicationStatus?: string;
  }
) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.admissionNo !== undefined) updates.admission_no = data.admissionNo;
    if (data.fullName !== undefined) updates.full_name = data.fullName.trim();
    if (data.photoUrl !== undefined) updates.photo_url = data.photoUrl.trim();
    if (data.classCode !== undefined) updates.class_code = data.classCode;
    if (data.categoryName !== undefined) updates.category_name = data.categoryName;
    if (data.ownTopic !== undefined) updates.own_topic = data.ownTopic?.trim() || null;
    if (data.shortDescription !== undefined) updates.short_description = data.shortDescription?.trim() || null;
    if (data.publicationStatus !== undefined) updates.publication_status = data.publicationStatus;

    const res = await client.from('participants').update(updates).eq('id', id).select().single();
    if (res.error) {
      console.warn('Supabase update participant warning:', res.error.message);
      return null;
    }
    return res.data;
  } catch (err) {
    console.warn('Supabase update participant error:', err);
    return null;
  }
}

export async function supabaseDeleteParticipant(id: number) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const res = await client.from('participants').delete().eq('id', id);
    return !res.error;
  } catch (err) {
    console.warn('Supabase delete participant error:', err);
    return false;
  }
}

export async function supabaseInsertStudent(data: {
  admissionNo: string;
  fullName: string;
  classCode: string;
  photoUrl: string;
  bio?: string | null;
  createdByEmail?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const row = {
      admission_no: data.admissionNo.trim(),
      full_name: data.fullName.trim(),
      class_code: data.classCode,
      photo_url: data.photoUrl.trim(),
      bio: data.bio?.trim() || null,
      created_by_email: data.createdByEmail || 'nasirhussin12489@gmail.com',
      updated_at: new Date().toISOString(),
    };

    const res = await client.from('students').insert(row).select().single();
    if (res.error) {
      console.warn('Supabase insert student warning:', res.error.message);
      return null;
    }
    return res.data;
  } catch (err) {
    console.warn('Supabase insert student error:', err);
    return null;
  }
}

export async function supabaseUpdateStudent(
  id: number,
  data: {
    admissionNo?: string;
    fullName?: string;
    classCode?: string;
    photoUrl?: string;
    bio?: string | null;
  }
) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.admissionNo !== undefined) updates.admission_no = data.admissionNo.trim();
    if (data.fullName !== undefined) updates.full_name = data.fullName.trim();
    if (data.classCode !== undefined) updates.class_code = data.classCode;
    if (data.photoUrl !== undefined) updates.photo_url = data.photoUrl.trim();
    if (data.bio !== undefined) updates.bio = data.bio?.trim() || null;

    const res = await client.from('students').update(updates).eq('id', id).select().single();
    if (res.error) {
      console.warn('Supabase update student warning:', res.error.message);
      return null;
    }
    return res.data;
  } catch (err) {
    console.warn('Supabase update student error:', err);
    return null;
  }
}

export async function supabaseDeleteStudent(id: number) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const res = await client.from('students').delete().eq('id', id);
    return !res.error;
  } catch (err) {
    console.warn('Supabase delete student error:', err);
    return false;
  }
}

export async function supabaseInsertOfficer(data: {
  classCode: string;
  roleTitle: string;
  holderName: string;
  admissionNo?: string | null;
  photoUrl: string;
  responsibilities?: string | null;
  updatedByEmail?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const row = {
      class_code: data.classCode,
      role_title: data.roleTitle.trim(),
      holder_name: data.holderName.trim(),
      admission_no: data.admissionNo?.trim() || null,
      photo_url: data.photoUrl.trim(),
      responsibilities: data.responsibilities?.trim() || null,
      updated_by_email: data.updatedByEmail || 'nasirhussin12489@gmail.com',
      updated_at: new Date().toISOString(),
    };

    const res = await client.from('class_officers').insert(row).select().single();
    if (res.error) {
      console.warn('Supabase insert officer warning:', res.error.message);
      return null;
    }
    return res.data;
  } catch (err) {
    console.warn('Supabase insert officer error:', err);
    return null;
  }
}

export async function supabaseDeleteOfficer(id: number) {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const res = await client.from('class_officers').delete().eq('id', id);
    return !res.error;
  } catch (err) {
    console.warn('Supabase delete officer error:', err);
    return false;
  }
}

export async function supabaseInsertFeedPost(data: {
  classCode: string;
  title: string;
  caption: string;
  mediaUrl: string;
  mediaType: string;
  status: string;
  submittedByName: string;
  submittedByEmail?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const row = {
      class_code: data.classCode,
      title: data.title.trim(),
      caption: data.caption.trim(),
      media_url: data.mediaUrl.trim(),
      media_type: data.mediaType || 'ANNOUNCEMENT',
      status: data.status || 'APPROVED',
      submitted_by_name: data.submittedByName.trim(),
      submitted_by_email: data.submittedByEmail || 'nasirhussin12489@gmail.com',
      updated_at: new Date().toISOString(),
    };

    const res = await client.from('feed_posts').insert(row).select().single();
    if (res.error) {
      console.warn('Supabase insert feed post warning:', res.error.message);
      return null;
    }
    return res.data;
  } catch (err) {
    console.warn('Supabase insert feed post error:', err);
    return null;
  }
}

export async function supabaseInsertWeeklyResult(data: {
  resultCategory: string;
  winnerName: string;
  winnerPhotoUrl: string;
  winnerClass: string;
  weekLabel: string;
  resultDate: string;
  remarks?: string | null;
  publicationStatus?: string;
  publishedByEmail?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const row = {
      result_category: data.resultCategory,
      winner_name: data.winnerName.trim(),
      winner_photo_url: data.winnerPhotoUrl.trim(),
      winner_class: data.winnerClass,
      week_label: data.weekLabel.trim(),
      result_date: data.resultDate,
      remarks: data.remarks?.trim() || null,
      publication_status: data.publicationStatus || 'PUBLISHED',
      published_by_email: data.publishedByEmail || 'nasirhussin12489@gmail.com',
      updated_at: new Date().toISOString(),
    };

    const res = await client.from('weekly_results').insert(row).select().single();
    if (res.error) {
      console.warn('Supabase insert weekly result warning:', res.error.message);
      return null;
    }
    return res.data;
  } catch (err) {
    console.warn('Supabase insert weekly result error:', err);
    return null;
  }
}

export async function supabaseInsertLibraryResource(data: {
  title: string;
  description?: string | null;
  author: string;
  category: string;
  libraryScope?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: string;
  contentPreview?: string | null;
  publicationStatus?: string;
  uploadedByEmail?: string;
}) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const row = {
      title: data.title.trim(),
      description: data.description?.trim() || null,
      author: data.author.trim(),
      category: data.category,
      library_scope: data.libraryScope || 'COMMON',
      file_url: data.fileUrl.trim(),
      file_type: data.fileType,
      file_size: data.fileSize || '1 MB',
      content_preview: data.contentPreview?.trim() || null,
      publication_status: data.publicationStatus || 'PUBLISHED',
      uploaded_by_email: data.uploadedByEmail || 'nasirhussin12489@gmail.com',
      updated_at: new Date().toISOString(),
    };

    const res = await client.from('library_resources').insert(row).select().single();
    if (res.error) {
      console.warn('Supabase insert library resource warning:', res.error.message);
      return null;
    }
    return res.data;
  } catch (err) {
    console.warn('Supabase insert library resource error:', err);
    return null;
  }
}

export async function supabaseUpsertSetting(key: string, value: string) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const res = await client.from('platform_settings').upsert(
      {
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'setting_key' }
    );
    return !res.error;
  } catch (err) {
    console.warn('Supabase upsert setting error:', err);
    return false;
  }
}

export async function supabaseUpdatePoster(
  classCode: string,
  data: {
    posterImageUrl?: string;
    participantsSnapshot?: string;
    participantCount?: number;
    title?: string;
    subtitle?: string;
    categoryName?: string;
  }
) {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.posterImageUrl !== undefined) updates.poster_image_url = data.posterImageUrl;
    if (data.participantsSnapshot !== undefined) updates.participants_snapshot = data.participantsSnapshot;
    if (data.participantCount !== undefined) updates.participant_count = data.participantCount;
    if (data.title !== undefined) updates.title = data.title;
    if (data.subtitle !== undefined) updates.subtitle = data.subtitle;
    if (data.categoryName !== undefined) updates.category_name = data.categoryName;

    const res = await client.from('posters').update(updates).eq('class_code', classCode).select();
    if (res.error) {
      console.warn('Supabase update poster warning:', res.error.message);
      return null;
    }
    return res.data;
  } catch (err) {
    console.warn('Supabase update poster error:', err);
    return null;
  }
}
