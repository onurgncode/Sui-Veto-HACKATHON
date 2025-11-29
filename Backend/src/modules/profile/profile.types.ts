export interface Profile {
  id: string;
  nickname: string;
  owner: string;
}

export interface MemberStats {
  xp: number;
  level: number;
}

export interface CreateProfileRequest {
  nickname: string;
}

export interface GetProfileResponse {
  profile: Profile;
}

export interface GetMemberStatsResponse {
  stats: MemberStats | null;
  commityId: string;
}

