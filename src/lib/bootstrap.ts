import type {
  CategoryRecord,
  ClassCode,
  ClassOfficerRecord,
  ClassRecord,
  FeedPostRecord,
  LibraryCategoryName,
  LibraryResourceRecord,
  ParticipantRecord,
  PosterRecord,
  PublicBootstrapData,
  StudentRecord,
  WeeklyResultRecord,
} from '../types.ts';

export interface OfflineAdminUser {
  id: number;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TEACHER' | 'CLASS_ADMIN';
  assignedClass: ClassCode | null;
  status: 'ACTIVE' | 'DEACTIVATED';
  passwordPlain?: string | null;
}

const offlineAdmins: OfflineAdminUser[] = [
  {
    id: 1,
    email: 'nasirhussain12489@gmail.com',
    name: 'Nasir Hussain',
    role: 'SUPER_ADMIN',
    assignedClass: null,
    status: 'ACTIVE',
    passwordPlain: 'admin123',
  },
];

const offlineFeedPosts: FeedPostRecord[] = [
  {
    id: 1,
    classCode: 'U1',
    title: 'Welcome to ILM',
    caption: 'Offline demo feed post.',
    mediaUrl: '/uploads/demo-feed.jpg',
    mediaType: 'ANNOUNCEMENT',
    status: 'APPROVED',
    submittedByName: 'Demo Admin',
    createdAt: new Date().toISOString(),
  },
];

let nextOfflineAdminId = 2;
let nextOfflineFeedId = 2;

function buildDemoClasses(): ClassRecord[] {
  return [
    { id: 1, code: 'U1', name: 'Class U1', description: 'Foundation level class' },
    { id: 2, code: 'U2', name: 'Class U2', description: 'Middle level class' },
    { id: 3, code: 'U3', name: 'Class U3', description: 'Senior level class' },
    { id: 4, code: 'U4', name: 'Class U4', description: 'Advanced learning class' },
    { id: 5, code: 'U5', name: 'Class U5', description: 'Senior electives class' },
    { id: 6, code: 'U6', name: 'Class U6', description: 'Final stage class' },
  ];
}

function buildDemoCategories(): CategoryRecord[] {
  return [
    {
      id: 1,
      name: 'Qirat',
      maxParticipantsPerClass: 2,
      description: 'Qirat recitation',
      displayOrder: 1,
    },
    {
      id: 2,
      name: 'Naat',
      maxParticipantsPerClass: 2,
      description: 'Naat recitation',
      displayOrder: 2,
    },
    {
      id: 3,
      name: 'Speech',
      maxParticipantsPerClass: 2,
      description: 'Speech and expression',
      displayOrder: 3,
    },
  ];
}

function buildDemoStudents(): StudentRecord[] {
  return [
    {
      id: 1,
      admissionNo: 'U1-101',
      fullName: 'Ayesha Khan',
      classCode: 'U1',
      photoUrl: '/uploads/demo-student-1.jpg',
      bio: 'Dedicated learner',
    },
    {
      id: 2,
      admissionNo: 'U2-202',
      fullName: 'Bilal Ahmed',
      classCode: 'U2',
      photoUrl: '/uploads/demo-student-2.jpg',
      bio: 'Confident presenter',
    },
    {
      id: 3,
      admissionNo: 'U3-303',
      fullName: 'Sara Ali',
      classCode: 'U3',
      photoUrl: '/uploads/demo-student-3.jpg',
      bio: 'Strong in research',
    },
  ];
}

function buildDemoOfficers(): ClassOfficerRecord[] {
  return [
    {
      id: 1,
      classCode: 'U1',
      roleTitle: 'Class Teacher',
      holderName: 'Mr. Ahmed Khan',
      admissionNo: 'T-001',
      photoUrl: '/uploads/demo-teacher-1.jpg',
      responsibilities: 'Academic coordination',
    },
    {
      id: 2,
      classCode: 'U2',
      roleTitle: 'President',
      holderName: 'Hassan Ali',
      admissionNo: 'U2-201',
      photoUrl: '/uploads/demo-president-2.jpg',
      responsibilities: 'Leads class coordination',
    },
  ];
}

function buildDemoParticipants(): ParticipantRecord[] {
  return [
    {
      id: 1,
      admissionNo: 'U1-101',
      fullName: 'Ayesha Khan',
      photoUrl: '/uploads/demo-student-1.jpg',
      classCode: 'U1',
      categoryName: 'Speech',
      ownTopic: 'Learning without limits',
      shortDescription: 'Energetic student leader',
      publicationStatus: 'PUBLISHED',
    },
    {
      id: 2,
      admissionNo: 'U2-202',
      fullName: 'Bilal Ahmed',
      photoUrl: '/uploads/demo-student-2.jpg',
      classCode: 'U2',
      categoryName: 'Naat',
      ownTopic: 'A beautiful heart',
      shortDescription: 'Strong public speaker',
      publicationStatus: 'PUBLISHED',
    },
  ];
}

function buildDemoPosters(): PosterRecord[] {
  return [
    {
      id: 1,
      classCode: 'U1',
      categoryName: 'Speech',
      title: 'Poster 1',
      subtitle: 'Student showcase',
      posterImageUrl: '/uploads/demo-poster-1.svg',
      participantsSnapshot: 'Ayesha Khan',
      participantCount: 1,
      generationStatus: 'READY',
      publicationStatus: 'PUBLISHED',
      isFeatured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      classCode: 'U2',
      categoryName: 'Naat',
      title: 'Poster 2',
      subtitle: 'Naat performance',
      posterImageUrl: '/uploads/demo-poster-2.svg',
      participantsSnapshot: 'Bilal Ahmed',
      participantCount: 1,
      generationStatus: 'READY',
      publicationStatus: 'PUBLISHED',
      isFeatured: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      classCode: 'U3',
      categoryName: 'Qirat',
      title: 'Poster 3',
      subtitle: 'Recitation club',
      posterImageUrl: '/uploads/demo-poster-3.svg',
      participantsSnapshot: 'Sara Ali',
      participantCount: 1,
      generationStatus: 'READY',
      publicationStatus: 'PUBLISHED',
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      classCode: 'U4',
      categoryName: 'Speech',
      title: 'Poster 4',
      subtitle: 'Leadership showcase',
      posterImageUrl: '/uploads/demo-poster-4.svg',
      participantsSnapshot: 'Amina Hassan',
      participantCount: 1,
      generationStatus: 'READY',
      publicationStatus: 'PUBLISHED',
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 5,
      classCode: 'U5',
      categoryName: 'Speech',
      title: 'Poster 5',
      subtitle: 'Community voice',
      posterImageUrl: '/uploads/demo-poster-5.svg',
      participantsSnapshot: 'Muneeb Rahman',
      participantCount: 1,
      generationStatus: 'READY',
      publicationStatus: 'PUBLISHED',
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 6,
      classCode: 'U6',
      categoryName: 'Naat',
      title: 'Poster 6',
      subtitle: 'Final showcase',
      posterImageUrl: '/uploads/demo-poster-6.svg',
      participantsSnapshot: 'Hadia Yusuf',
      participantCount: 1,
      generationStatus: 'READY',
      publicationStatus: 'PUBLISHED',
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function buildDemoResults(): WeeklyResultRecord[] {
  return [
    {
      id: 1,
      resultCategory: 'Best Speaker',
      winnerName: 'Ayesha Khan',
      winnerPhotoUrl: '/uploads/demo-student-1.jpg',
      winnerClass: 'U1',
      weekLabel: 'Week 1',
      resultDate: new Date().toISOString(),
      remarks: 'Excellent performance',
      publicationStatus: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      resultCategory: 'Best Naat',
      winnerName: 'Bilal Ahmed',
      winnerPhotoUrl: '/uploads/demo-student-2.jpg',
      winnerClass: 'U2',
      weekLabel: 'Week 1',
      resultDate: new Date().toISOString(),
      remarks: 'Strong voice and rhythm',
      publicationStatus: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    },
  ];
}

function buildDemoLibraryResources(): LibraryResourceRecord[] {
  return [
    {
      id: 1,
      title: 'Introduction to Public Speaking',
      description: 'Helpful notes for learners',
      author: 'ILM Admin',
      category: 'Notes',
      libraryScope: 'COMMON',
      fileUrl: '/uploads/demo-note.pdf',
      fileType: 'PDF',
      fileSize: '1.2 MB',
      contentPreview: 'Public speaking basics',
      publicationStatus: 'PUBLISHED',
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getOfflineAdminUser(email: string): OfflineAdminUser | null {
  return offlineAdmins.find((user) => user.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function upsertOfflineAdminUser(params: {
  id?: number;
  email: string;
  name: string;
  role: OfflineAdminUser['role'];
  assignedClass?: ClassCode | null;
  passwordPlain?: string | null;
  status?: OfflineAdminUser['status'];
}): OfflineAdminUser {
  const existing = typeof params.id === 'number'
    ? offlineAdmins.find((user) => user.id === params.id)
    : offlineAdmins.find((user) => user.email.toLowerCase() === params.email.toLowerCase());

  if (existing) {
    Object.assign(existing, {
      email: params.email,
      name: params.name,
      role: params.role,
      assignedClass: params.assignedClass ?? existing.assignedClass,
      status: params.status ?? existing.status,
      passwordPlain: params.passwordPlain ?? existing.passwordPlain,
    });
    return existing;
  }

  const created: OfflineAdminUser = {
    id: nextOfflineAdminId++,
    email: params.email,
    name: params.name,
    role: params.role,
    assignedClass: params.assignedClass ?? null,
    status: params.status ?? 'ACTIVE',
    passwordPlain: params.passwordPlain ?? null,
  };

  offlineAdmins.push(created);
  return created;
}

export function removeOfflineAdminUser(id: number): boolean {
  const index = offlineAdmins.findIndex((user) => user.id === id);
  if (index === -1) {
    return false;
  }

  offlineAdmins.splice(index, 1);
  return true;
}

export function upsertOfflineFeedPost(input: Partial<FeedPostRecord> & {
  id?: number;
  title: string;
  caption: string;
  classCode: ClassCode;
  submittedByName: string;
  mediaUrl?: string;
  mediaType?: FeedPostRecord['mediaType'];
  status?: FeedPostRecord['status'];
  submittedByEmail?: string;
}): FeedPostRecord {
  const existing = typeof input.id === 'number'
    ? offlineFeedPosts.find((post) => post.id === input.id)
    : null;

  if (existing) {
    Object.assign(existing, {
      ...input,
      mediaUrl: input.mediaUrl ?? existing.mediaUrl,
      mediaType: input.mediaType ?? existing.mediaType,
      status: input.status ?? existing.status,
      submittedByEmail: input.submittedByEmail ?? existing.submittedByEmail,
      createdAt: existing.createdAt,
    });
    return existing;
  }

  const created: FeedPostRecord = {
    id: input.id ?? nextOfflineFeedId++,
    classCode: input.classCode,
    title: input.title,
    caption: input.caption,
    mediaUrl: input.mediaUrl ?? '/uploads/demo-feed.jpg',
    mediaType: input.mediaType ?? 'ANNOUNCEMENT',
    status: input.status ?? 'APPROVED',
    submittedByEmail: input.submittedByEmail,
    submittedByName: input.submittedByName,
    createdAt: new Date().toISOString(),
  };

  offlineFeedPosts.push(created);
  return created;
}

export function validateAdminDelete(
  users: Array<{
    id: number;
    email: string;
    name: string;
    role: 'SUPER_ADMIN' | 'TEACHER' | 'CLASS_ADMIN';
    assignedClass: ClassCode | null;
    status: 'ACTIVE' | 'DEACTIVATED';
  }>,
  targetId: number,
  context: { currentUserId: number; currentUserRole: 'SUPER_ADMIN' | 'TEACHER' | 'CLASS_ADMIN' }
): void {
  const target = users.find((user) => user.id === targetId);
  if (!target) {
    return;
  }

  if (target.id === context.currentUserId && target.role === 'SUPER_ADMIN' && target.status === 'ACTIVE') {
    throw new Error('You cannot delete your own active Super Admin account.');
  }

  const activeSuperAdmins = users.filter(
    (user) => user.role === 'SUPER_ADMIN' && user.status === 'ACTIVE'
  );

  if (target.role === 'SUPER_ADMIN' && target.status === 'ACTIVE' && activeSuperAdmins.length <= 1) {
    throw new Error('At least one active Super Admin must remain.');
  }

  if (target.role === 'CLASS_ADMIN' && target.status === 'ACTIVE' && target.assignedClass) {
    const classAdminsForClass = users.filter(
      (user) =>
        user.role === 'CLASS_ADMIN' &&
        user.status === 'ACTIVE' &&
        user.assignedClass === target.assignedClass
    );

    if (classAdminsForClass.length <= 1) {
      throw new Error(`This is the last active Class Admin for class ${target.assignedClass}.`);
    }
  }
}

export function createFallbackBootstrapData(): PublicBootstrapData {
  return {
    classes: buildDemoClasses(),
    categories: buildDemoCategories(),
    students: buildDemoStudents(),
    classOfficers: buildDemoOfficers(),
    participants: buildDemoParticipants(),
    posters: buildDemoPosters(),
    feedPosts: offlineFeedPosts,
    weeklyResults: buildDemoResults(),
    libraryResources: buildDemoLibraryResources(),
    settings: {
      demoMode: 'true',
      offlineMode: 'true',
    },
  };
}
