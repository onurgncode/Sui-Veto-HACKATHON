export interface Community {
  id: string;
  name: string;
}

export interface CreateCommunityRequest {
  name: string;
}

export interface CommunityMember {
  address: string;
  joinedAt: number;
}

export interface GetCommunityResponse {
  community: Community;
  memberCount: number;
}

export interface GetMembersResponse {
  members: CommunityMember[];
  total: number;
}

