export type ComfyUser = {
  id: string;
  updatedAt: string;
  createdAt: string;
  email: string;
  username: string;
  intro: string | null;
  imageUrl: string | null;
  provider: string;
  oauthSub: string;
};
