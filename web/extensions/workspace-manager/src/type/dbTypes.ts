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

export type Workflow = {
  id: string;
  updatedAt: string;
  createdAt: string;
  name: string;
  description: string;
  privacy: string;
  machine_id: string;
  json: string;
};
