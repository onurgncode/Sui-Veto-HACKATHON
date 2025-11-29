export interface EventNFT {
  id: string;
  commityId: string;
  xp: number;
  owner: string;
}

export interface MintEventNFTRequest {
  commityId: string;
  xp: number;
  recipient: string;
}

export interface GetEventNFTResponse {
  nft: EventNFT | null;
}

export interface GetEventNFTsByOwnerResponse {
  nfts: EventNFT[];
  total: number;
}

export interface GetEventNFTsByCommunityResponse {
  nfts: EventNFT[];
  total: number;
}

